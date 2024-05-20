import {
	Body,
	Delete,
	Get,
	Headers,
	HttpCode,
	type LoggerService,
	Param,
	Patch,
	Post,
	Query,
	Req,
	Res,
	type Type,
	UseFilters,
	applyDecorators,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
	ApiBadRequestResponse,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiExtraModels,
	ApiHeader,
	ApiNoContentResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiProperty,
	ApiQuery,
	type ApiResponse as ApiResponseDecorator,
	getSchemaPath,
} from "@nestjs/swagger";
import {
	ProblemDetailException,
	ProblemDetailFilter,
	type ProblemDetailTypeUrlResolver,
} from "@sjfrhafe/nest-problem-details";
import type { Request, Response } from "express";
import type { Object as JsonObject, Primitive as JsonPrimitive } from "json-typescript";
import * as MongoErrors from "mongo-errors";
import { MongoServerError } from "mongodb";
import type { FilterQuery, HydratedDocument, InferId, Model, SortOrder } from "mongoose";
import { MongooseError, Error as MongooseErrorNamespace } from "mongoose";
import { ListOperator, LogicalOperator, Operators, type SearchField, ValueOperator, filtersValidator } from "./api.js";
import { CommaListPipe } from "./helpers.js";
import Hal from "./representation/hal.js";
import {
	type Representation,
	getContentType,
	getParser,
	getRenderer,
	getSwaggerExtension,
	validateContentType,
} from "./representation/index.js";
import JsonApi, {
	type JsonApiUpdateRequestInterface,
	type JsonApiCreateRequestInterface,
} from "./representation/json-api.js";
import { bound, regexEscaper, removeUndefined, wrap } from "./utils.js";

export interface EntityConverter<
	Resource,
	Searchable extends SimpleType,
	Dto extends JsonObject = JsonObject,
	Creator extends JsonObject = JsonObject,
	Updater extends JsonObject = JsonObject,
> {
	/**
	 * Transform a document from MongoDB into the DTO you want to display
	 * @param input The document from MongoDB
	 */
	toDto: (input: HydratedDocument<Resource> | Resource) => Dto;
	/**
	 * Mapping of the filtering provided to a MongoDB FilterQuery
	 * @param input
	 */
	fromSearchable: (input?: SearchField<Searchable>) => FilterQuery<Resource>;
	/**
	 * Mapping of field to select (`projection`) in the MongoDB query from the name of field of the DTO
	 * @param fields
	 */
	fromDtoFields: (fields?: Array<keyof Dto>) => Array<keyof Resource> | undefined;
	/**
	 * Transform provided sort option to MongoDB sorting
	 * @param sort List of field name of the DTO (can be prefixed by `-` to reverse the order).
	 */
	fromDtoSort: <Keys extends string = keyof Dto & string>(
		sort?: Array<`-${Keys}` | Keys>,
	) => Record<string, SortOrder> | undefined;
	/**
	 * Transform a creation DTO into a Mongoose entity data
	 * @param input
	 */
	fromCreator: (input: Partial<Creator>) => Partial<Resource>;
	/**
	 * Transform a modification DTO into a Mongoose entity data
	 * @param id
	 * @param input
	 */
	fromUpdater: (id: string, input: Partial<Updater>) => PartialWithId<Resource>;
}
export type JsonOf<Type extends JsonObject> = JsonObject;
export type { JsonObject };

export type SimpleType = Record<string, JsonPrimitive | undefined>;
export type PartialWithId<Resource> = Partial<Resource> & {
	_id: InferId<Resource>;
};

export interface MongooseController<
	Dto extends JsonObject,
	Searchable extends SimpleType,
	Creator extends JsonObject,
	Updater extends JsonObject,
> {
	/**
	 * Get a paginated list of document
	 */
	getList?(
		response: Response,
		request: Request,
		filters?: SearchField<Searchable>,
		page?: { size: number; number: number },
		fields?: unknown,
		sort?: unknown,
	): Promise<JsonOf<Dto>>;

	/**
	 * Get one document by its Id
	 */
	getOne?(response: Response, request: Request, id: string, fields?: unknown): Promise<JsonOf<Dto> | never>;

	/**
	 * Create one document
	 */
	createOne?(
		response: Response,
		request: Request,
		body: JsonApiCreateRequestInterface<Creator>,
	): Promise<JsonOf<Dto> | undefined | never>;
	/**
	 * Get one document
	 */
	updateOne?(
		response: Response,
		request: Request,
		body: JsonApiUpdateRequestInterface<Updater>,
		id: string,
		fields?: unknown,
		noContent?: boolean,
	): Promise<JsonOf<Dto> | never | undefined>;
	/**
	 * Delete one document by its Id
	 */
	deleteOne?(id: string): Promise<undefined | never>;
}

export type MongooseControllerOptions<
	Dto extends JsonObject,
	Creator extends JsonObject,
	Updater extends JsonObject,
> = Partial<{
	/**
	 * Allow to remove some part of teh controller:
	 */
	disable: Partial<{
		/**
		 * if `true`, the listing of document is removed from the controller (default: `false`)
		 */
		list: boolean;
		/**
		 * if `true`, getting one document from its id is removed from the controller (default: `false`)
		 */
		get: boolean;
		/**
		 * if `true`, updating one document is removed from the controller (default: `false`)
		 */
		update: boolean;
		/**
		 * if `true`, creating a document is removed from the controller (default: `false`)
		 */
		create: boolean;
		/**
		 * if `true`, deleting one document from its id is removed from the controller (default: `false`)
		 */
		delete: boolean;
		/**
		 * if `true`, the listing and getting one document are removed from the controller, the output of the creation and modification of a document is disabled (default: `false`)
		 */
		read: boolean;
		/**
		 * if `true`, updating, creating and deleting a document are removed from the controller (default: `false`)
		 */
		write: boolean;
	}>;
	/**
	 * Allow to change the pagination size
	 */
	pageSize: Partial<{
		/**
		 * the default page size is none is provided (default: `10`)
		 */
		default: number;
		/**
		 * the maximum page size allowed. If the value requested by the user is superior, it is set to this value  (default: `200`)
		 */
		max: number;
	}>;
	/**
	 * The [`ProblemDetail`](https://github.com/sjfrhafe/nest-problem-details?tab=readme-ov-file#customize-auto-type-generation) error resolver (default: `undefined` => Resolve URL to `https://httpstatuses.com/`)
	 */
	urlResolver: ProblemDetailTypeUrlResolver;
	/**
	 * The logger to use. Used by `ProblemDetail` (default: `undefined` => no log)
	 */
	logger: LoggerService;
	/**
	 * The name of the resource to display in the outputs. Used for Json:Api, HAL (default: `undefined` => same as the `modelInjectionName` provided to the factory)
	 */
	resourceType: string;
	/**
	 * The list of document representation standard to use (default: `[instance of JsonApi, instance of Hal]`)
	 */
	representations: Array<Representation<Dto, Creator, Updater>>;
	/**
	 * List of operators to display in the swagger
	 * (default: `[ "$eq", "$neq", "$gt", "$gte", "$lt", "$lte", "$start", "$end", "$regex", "$null", "$def", "$in", "$nin", "$or", "$and" ]`)
	 */
	operators: typeof Operators;
	/**
	 * Defined how the operators parser/validator react on invalid value
	 */
	operatorValidator: Partial<{
		/**
		 * If `true` and `$and` or `$or` are defined but not allowed, escape the operator (add `\` before the operator).
		 * If `false` use the same behavior defined by `throwOnInvalidOperator`
		 * (default: `false`)
		 */
		escapeInvalidLogicalOperator: boolean;
		/**
		 * If `true` and a not allowed operator is present, throw an 400 error.
		 * Otherwise, remove the operator from the filter
		 * (default: `true`)
		 */
		throwOnInvalidOperator: boolean;
	}>;
}>;

/**
 * Create a controller class to extends
 *
 * @param modelInjectionName The name linked to the schema (same as declared in `MongooseModule.forFeature`)
 * @param converter The instance responsible to convert your DTO into Mongo Entity and vice-versa
 * @param dtoConstructor The representation of one element of your collection that you want to return (if missing or `undefined`, it's the same as `options.disable.read: true`)
 * @param creatorConstructor The representation of a new element to add to your collection that you want to receive (if missing or `undefined`, it's the same as `options.disable.create: true`)
 * @param updaterConstructor The representation of one element to update in your collection that you want to receive (if missing or `undefined`, it's the same as `options.disable.update: true`)
 * @param options Configurations of the controller
 */
export function MongooseControllerFactory<
	Resource,
	Searchable extends SimpleType,
	Dto extends JsonObject = JsonObject,
	Creator extends JsonObject = JsonObject,
	Updater extends JsonObject = JsonObject,
>(
	modelInjectionName: string,
	converter: EntityConverter<Resource, Searchable, Dto, Creator, Updater>,
	dtoConstructor?: Type<Dto>,
	creatorConstructor?: Type<Creator>,
	updaterConstructor?: Type<Updater>,
	options?: MongooseControllerOptions<Dto, Creator, Updater>,
): Type<MongooseController<Dto, Searchable, Creator, Updater>> {
	const conf: Readonly<{
		disable: {
			list: boolean;
			get: boolean;
			update: boolean;
			create: boolean;
			delete: boolean;
			read: boolean;
			write: boolean;
		};
		pageSize: {
			default: number;
			max: number;
		};
		urlResolver?: ProblemDetailTypeUrlResolver;
		logger?: LoggerService;
		resourceType: string;
		representations: Array<Representation<Dto, Creator, Updater>>;
		operators: typeof Operators;
		operatorValidator: {
			escapeInvalidLogicalOperator: boolean;
			throwOnInvalidOperator: boolean;
		};
	}> = {
		disable: {
			list: false,
			get: false,
			update: false,
			create: false,
			delete: false,
			read: false,
			write: false,
			...options?.disable,
		},
		pageSize: {
			default: 10,
			max: 200,
			...options?.pageSize,
		},
		urlResolver: options?.urlResolver,
		logger: options?.logger,
		resourceType: options?.resourceType ?? modelInjectionName,
		representations: options?.representations ?? [
			JsonApi as unknown as Representation<Dto, Creator, Updater>,
			Hal as unknown as Representation<Dto, Creator, Updater>,
		],
		operators: options?.operators ?? Operators,
		operatorValidator: {
			escapeInvalidLogicalOperator: false,
			throwOnInvalidOperator: true,
			...options?.operatorValidator,
		},
	};
	if (dtoConstructor === undefined) {
		conf.disable.read = true;
	}
	if (updaterConstructor === undefined) {
		conf.disable.update = true;
	}
	if (creatorConstructor === undefined) {
		conf.disable.create = true;
	}

	const filter = new ProblemDetailFilter(conf.urlResolver);
	if (conf.logger !== undefined) {
		filter.setLogger(conf.logger);

		filter.catch = wrap(filter.catch, undefined, (returned, args) => {
			conf.logger?.debug?.(args[0].stack);
			return returned;
		});
	}

	@UseFilters(filter)
	@ApiExtraModels(ProblemDetailResponse)
	class GooseApiController implements MongooseController<Dto, Searchable, Creator, Updater> {
		constructor(@InjectModel(modelInjectionName) private readonly model: Model<Resource>) {}

		@GetListDecorator(dtoConstructor, conf.resourceType, conf.representations, conf.operators)
		async getList(
			@Res({ passthrough: true }) response: Response,
			@Req() request: Request,
			@Query("filters") filters?: SearchField<Searchable>,
			@Query("page") page?: { size: number; number: number },
			@Query("fields", CommaListPipe) fields?: unknown,
			@Query("sort", CommaListPipe) sort?: unknown,
			@Headers("accept") accept?: unknown,
		): Promise<JsonObject> {
			console.log(filters);
			const contentType = validateContentType(conf.representations, "getCollectionResponseSwaggerExtension", accept);
			const validatedFilters = filtersValidator(
				filters,
				conf.operators,
				conf.operatorValidator.throwOnInvalidOperator,
				conf.operatorValidator.escapeInvalidLogicalOperator,
			);
			const mongoFilter = converter.fromSearchable(validatedFilters);
			const mongoProjection = converter.fromDtoFields(fields as undefined | Array<string>);
			const mongoSort = converter.fromDtoSort(sort as undefined | Array<string>);
			const pageSize = bound(1, page?.size, conf.pageSize.max, conf.pageSize.default);
			const currentPage = bound(1, page?.number, undefined, 1);
			const result = await this.model
				.find(mongoFilter, mongoProjection, {
					limit: pageSize,
					skip: (currentPage - 1) * pageSize,
					sort: mongoSort,
					lean: true,
				})
				.exec();
			const size = await this.model
				.countDocuments(mongoFilter, {
					lean: true,
				})
				.exec();

			response.contentType(contentType);
			const renderer = getRenderer<Dto>(conf.representations, contentType, "renderPage");
			return renderer(
				conf.resourceType,
				request.url,
				size,
				{ size: pageSize, current: currentPage },
				new Map(result.map((item) => [item._id as string, converter.toDto(item as Resource)])),
			);
		}

		@GetOneDecorator(dtoConstructor, conf.resourceType, conf.representations)
		async getOne(
			@Res({ passthrough: true }) response: Response,
			@Req() request: Request,
			@Param("id") id: string,
			@Query("fields", CommaListPipe) fields?: unknown,
			@Headers("accept") accept?: unknown,
		): Promise<JsonObject> {
			const contentType = validateContentType(conf.representations, "getCollectionResponseSwaggerExtension", accept);
			const mongoProjection = converter.fromDtoFields(fields as undefined | Array<string>);
			const result = await this.model
				.findById(id, mongoProjection, {
					lean: true,
				})
				.exec();

			if (result === undefined || result === null) {
				throw new ProblemDetailException(404, {
					title: "Entity not found",
					detail: `Unable to find an entity ${this.model.modelName} with id "${id}"`,
				});
			}
			response.contentType(contentType);
			const renderer = getRenderer<Dto>(conf.representations, contentType, "renderOne");
			return renderer(id, conf.resourceType, request.url, converter.toDto(result as Resource));
		}

		@CreateOneDecorator(dtoConstructor, creatorConstructor, conf.resourceType, conf.representations)
		async createOne(
			@Res({ passthrough: true }) response: Response,
			@Req() request: Request,
			@Body() body: unknown,
			@Headers("accept") accept?: unknown,
			@Headers("content-type") receiveContentType?: unknown,
		): Promise<JsonObject | undefined> {
			const requestContentType = validateContentType(
				conf.representations,
				"getCreateRequestSwaggerExtension",
				receiveContentType,
			);
			const creator = getParser<Creator>(
				conf.representations,
				requestContentType,
				"parseCreateRequest",
			)(body as JsonObject, conf.resourceType);
			const contentType = validateContentType(conf.representations, "getOneResponseSwaggerExtension", accept);
			try {
				const created = await this.model.create(converter.fromCreator(creator));
				const url = new URL(`http://example.com${request.url}`);
				for (const key of url.searchParams.keys()) {
					url.searchParams.delete(key);
				}
				url.pathname += `/${created.id}`;

				if (conf.disable.read) {
					response.status(204);
					return;
				}

				response.contentType(contentType);
				const renderer = getRenderer<Dto>(conf.representations, contentType, "renderOne");
				return renderer(created.id, conf.resourceType, url.pathname, converter.toDto(created));
			} catch (e) {
				handleMongoServerError(e, this.model.modelName);
			}
		}

		@UpdateOneDecorator(dtoConstructor, updaterConstructor, conf.resourceType, conf.representations)
		async updateOne(
			@Res({ passthrough: true }) response: Response,
			@Req() request: Request,
			@Body() body: unknown,
			@Param("id") id: string,
			@Query("fields", CommaListPipe) fields?: unknown,
			@Query("no-content") noContent?: boolean,
			@Headers("accept") accept?: unknown,
			@Headers("content-type") receiveContentType?: unknown,
		): Promise<JsonObject | undefined> {
			const requestContentType = validateContentType(
				conf.representations,
				"getUpdateRequestSwaggerExtension",
				receiveContentType,
			);
			const updater = getParser<Updater>(conf.representations, requestContentType, "parseUpdateRequest")(
				body as JsonObject,
				conf.resourceType,
				id,
			);
			const contentType = validateContentType(conf.representations, "getOneResponseSwaggerExtension", accept);

			try {
				const toUpdate = converter.fromUpdater(id, updater);
				const updated = await this.model
					.updateOne(
						{
							_id: id,
						},
						toUpdate,
						{},
					)
					.exec();

				if (updated.matchedCount === 0) {
					throw new ProblemDetailException(404, {
						title: "Entity not found",
						detail: `Unable to find an entity ${this.model.modelName} with id "${id}" to update`,
					});
				}
				if (updated.modifiedCount === 0 || noContent === true || conf.disable.read) {
					response.status(204);
					return;
				}

				const mongoProjection = converter.fromDtoFields(fields as undefined | Array<string>);
				const url = new URL(`http://example.com${request.url}`);
				for (const key of url.searchParams.keys()) {
					if (!["fields"].includes(key)) url.searchParams.delete(key);
				}
				const document = await this.model
					.findById(id, mongoProjection, {
						lean: true,
					})
					.exec();

				response.contentType(contentType);
				const renderer = getRenderer<Dto>(conf.representations, contentType, "renderOne");
				return renderer(id, conf.resourceType, url.pathname, converter.toDto(document as Resource));
			} catch (e) {
				handleMongoServerError(e, this.model.modelName);
			}
		}

		@DeleteOneDecorator()
		async deleteOne(@Param("id") id: string): Promise<undefined> {
			try {
				const result = await this.model.deleteOne({ _id: id }).exec();

				if (result.deletedCount === 0) {
					throw new ProblemDetailException(404, {
						title: "Entity not found",
						detail: `Unable to find an entity ${this.model.modelName} with id "${id}" to delete`,
					});
				}
			} catch (e) {
				handleMongoServerError(e, this.model.modelName);
			}

			return;
		}
	}

	if (conf.disable.list || conf.disable.read) {
		// @ts-ignore
		GooseApiController.prototype.getList = undefined;
	}
	if (conf.disable.get || conf.disable.read) {
		// @ts-ignore
		GooseApiController.prototype.getOne = undefined;
	}
	if (conf.disable.delete || conf.disable.write) {
		// @ts-ignore
		GooseApiController.prototype.deleteOne = undefined;
	}
	if (conf.disable.create || conf.disable.write) {
		// @ts-ignore
		GooseApiController.prototype.createOne = undefined;
	}
	if (conf.disable.update || conf.disable.write) {
		// @ts-ignore
		GooseApiController.prototype.updateOne = undefined;
	}

	return GooseApiController;
}

function handleMongoServerError(error: Error | unknown, entityName: string): never {
	if (error instanceof MongoServerError) {
		switch (error.code) {
			case MongoErrors.DuplicateKey: {
				const keys = error.keyValue ?? { "": "?" };
				const reduced = Object.entries(keys)
					.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
					.join("), (");
				throw new ProblemDetailException(409, {
					title: "Duplicate document",
					detail: `A document with the keys (${reduced}) already exist for entity "${entityName}"`,
				});
			}
			case MongoErrors.DocumentValidationFailure:
				throw new ProblemDetailException(400, {
					title: "Document validation failure",
					detail: "The document does not meet Mongodb schema validation",
				});
			default: {
				const errorName = Object.entries(MongoErrors).find(([, code]) => String(error.code) === String(code))?.[0];
				if (errorName) {
					throw new ProblemDetailException(400, {
						title: errorName.replace(/([A-Z])/g, " $1").trim(),
						detail: error.errorResponse.message ?? error.message,
					});
				}
			}
		}
	}
	if (error instanceof MongooseError) {
		const defaultValues = {
			title: error.name.replace(/([A-Z])/g, " $1").trim(),
			detail: error.message,
		};

		switch (true) {
			case error instanceof MongooseErrorNamespace.CastError:
				throw new ProblemDetailException(400, {
					...defaultValues,
					// @ts-ignore
					reason: error.reason?.message ?? undefined,
				});
		}
	}

	if (error instanceof ProblemDetailException) {
		throw error;
	}
	if (error instanceof Error) {
		throw new ProblemDetailException(500, {
			title: error.name.replace(/([A-Z])/g, " $1").trim(),
			detail: error.message,
		});
	}
	throw error;
}

function MongoFilterSchema(): object {
	return {
		type: "object",
		properties: Operators.map((name) => ({
			[name]: {
				type: {
					anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }],
				},
			},
		})),
	};
}

/*
 * Api + Swagger decorator
 */

export function DeleteOneDecorator(): MethodDecorator {
	return applyDecorators(
		Delete("/:id"),
		ApiOperation({
			summary: "Delete one element",
			description: "Delete one element by its identifier.",
		}),
		ApiParam({
			name: "id",
			description: "The unique identifier of the element to delete",
		}),
		ApiNoContentResponse({
			description: "The document have been successfully deleted",
		}),
		ApiBadRequestResponse({ description: "If the provided `id` is invalid" }),
		HttpCode(204),
		ApiNotFoundResponse({
			...ProblemDetailResponseOptions,
			description: "If the document does not exists (the identifier is linked to no document)",
		}),
	);
}
export function GetOneDecorator<Dto extends JsonObject>(
	dtoConstructor: Type<Dto> | undefined,
	resourceType: string,
	representations: Array<Representation>,
): MethodDecorator {
	if (dtoConstructor === undefined) return () => {};
	return applyDecorators(
		Get("/:id"),
		ApiOperation({
			summary: "Get one element",
			description: "Get one element by its identifier",
		}),
		ApiParam({
			name: "id",
			description: "The unique identifier of the element to get",
		}),
		ApiHeader({
			name: "accept",
			required: false,
			enum: getContentType(representations, "getOneResponseSwaggerExtension"),
		}),
		ApiBadRequestResponse({
			...ProblemDetailResponseOptions,
			description: "If the provided information are invalid/malformed",
		}),
		ApiNotFoundResponse({
			...ProblemDetailResponseOptions,
			description: "If the document does not exists (the identifier is linked to no document)",
		}),
		FieldsQuerySwagger(dtoConstructor),
		OneModelResponseSwagger(dtoConstructor, resourceType, ApiOkResponse, "The requested element", representations),
	);
}
export function CreateOneDecorator<Creator extends JsonObject, Dto extends JsonObject>(
	dtoConstructor: Type<Dto> | undefined,
	creatorConstructor: Type<Creator> | undefined,
	resourceType: string,
	representations: Array<Representation>,
): MethodDecorator {
	if (creatorConstructor === undefined) return () => {};

	const { models, responses } = getSwaggerExtension(
		representations,
		"getCreateRequestSwaggerExtension",
		creatorConstructor,
		resourceType,
	);

	return applyDecorators(
		Post("/"),
		ApiOperation({
			summary: "Create a new element",
			requestBody: {
				content: responses,
			},
		}),
		ApiExtraModels(...models),
		ApiHeader({
			name: "accept",
			required: false,
			enum: getContentType(representations, "getOneResponseSwaggerExtension"),
		}),
		ApiConflictResponse({
			...ProblemDetailResponseOptions,
			description: "If the new element is in conflict with an existing element",
		}),
		ApiBadRequestResponse({
			...ProblemDetailResponseOptions,
			description: "If the provided information are invalid/malformed",
		}),
		ApiNoContentResponse({
			description: "If the creation of the element succeed and the `read` permission is not allowed on the API",
		}),
		OneModelResponseSwagger(
			dtoConstructor,
			resourceType,
			ApiCreatedResponse,
			"The newly created element",
			representations,
		),
	);
}
export function UpdateOneDecorator<Updater extends JsonObject, Dto extends JsonObject>(
	dtoConstructor: Type<Dto> | undefined,
	updaterConstructor: Type<Updater> | undefined,
	resourceType: string,
	representations: Array<Representation>,
): MethodDecorator {
	if (updaterConstructor === undefined) return () => {};

	const { models, responses } = getSwaggerExtension(
		representations,
		"getUpdateRequestSwaggerExtension",
		updaterConstructor,
		resourceType,
	);

	return applyDecorators(
		Patch("/:id"),
		ApiExtraModels(...models),
		ApiOperation({
			summary: "Update one element",
			description:
				"Update one element by its identifier.  \nThe modification is partial, so all fields in `data.attributes` are optional",
			requestBody: {
				description: "The modification is partial, so all fields of the resource are optional",
				content: responses,
			},
		}),
		ApiQuery({
			name: "no-content",
			required: false,
			type: Boolean,
			description:
				"Indicate if the API should return the updated document (value set to `false`, or not provided) or if it should just return a `204` (value set to `true`)",
		}),
		ApiParam({
			name: "id",
			description: "The unique identifier of the element to get",
		}),
		ApiHeader({
			name: "accept",
			required: false,
			enum: getContentType(representations, "getOneResponseSwaggerExtension"),
		}),
		FieldsQuerySwagger(dtoConstructor),
		ApiNotFoundResponse({
			...ProblemDetailResponseOptions,
			description: "If the document does not exists (the identifier is linked to no document)",
		}),
		ApiConflictResponse({
			...ProblemDetailResponseOptions,
			description: "If updated element will end up in conflict with an existing element",
		}),
		ApiBadRequestResponse({
			...ProblemDetailResponseOptions,
			description: "If the provided information are invalid/malformed",
		}),
		ApiNoContentResponse({
			description:
				"If the provided data did not change the element, or if `no-content` query parameter is set to `true`, or if the `read` permission is not allowed on the API",
		}),
		OneModelResponseSwagger(
			dtoConstructor,
			resourceType,
			ApiOkResponse,
			"The new content of the updated element",
			representations,
		),
	);
}
export function GetListDecorator<Dto extends JsonObject>(
	dtoConstructor: Type<Dto> | undefined,
	resourceType: string,
	representations: Array<Representation>,
	operators: Readonly<Array<(typeof Operators)[number]>>,
): MethodDecorator {
	if (dtoConstructor === undefined) return () => {};
	const { models, responses } = getSwaggerExtension(
		representations,
		"getCollectionResponseSwaggerExtension",
		dtoConstructor,
		resourceType,
	);

	function buildOperatorsDescription() {
		let description = "";
		const descriptions = {
			values: [
				operators.includes(ValueOperator.EQUALS) && "`$eq`: Equals to",
				operators.includes(ValueOperator.NOT_EQUALS) && "`$neq`: Not equals to",
				operators.includes(ValueOperator.GREATER_THAN) && "`$gt`: Greater than",
				operators.includes(ValueOperator.GREATER_OR_EQUALS) && "`$gte`: Greater than or equal to",
				operators.includes(ValueOperator.LOWER_THAN) && "`$lt`: Lower than",
				operators.includes(ValueOperator.LOWER_OR_EQUALS) && "`$lte`: Lower than or equal to",
				operators.includes(ValueOperator.START_WITH) && "`$start`: Start with",
				operators.includes(ValueOperator.END_WITH) && "`$end`: End with",
				operators.includes(ValueOperator.REGEX) && "`$regex`: Match the regular expression",
				operators.includes(ValueOperator.IS_NULL) && "`$null`: Equal to null",
				operators.includes(ValueOperator.IS_DEFINED) && "`$def`: Is defined (<=> not null)",
			].filter(Boolean) as Array<string>,
			list: [
				operators.includes(ListOperator.IN) && "`$in`: In the list",
				operators.includes(ListOperator.NOT_IN) && "`$nin`: Not in the list",
			].filter(Boolean) as Array<string>,
			logical: [
				operators.includes(LogicalOperator.AND) && "`$and`: Must validate all expression",
				operators.includes(LogicalOperator.OR) && "`$or`: Must value at least one expression",
			].filter(Boolean) as Array<string>,
		};
		if (descriptions.values.length > 0) {
			description += "\n### Values operators:\n";
			description += `- ${descriptions.values.join("\n- ")}`;
		}
		if (descriptions.list.length > 0) {
			description += "\n### List operators:\n";
			description += `- ${descriptions.list.join("\n- ")}`;
		}
		if (descriptions.logical.length > 0) {
			description += "\n### Logical operators:\n";
			description += `- ${descriptions.logical.join("\n- ")}`;
		}

		return description;
	}

	function buildOperatorsExamples() {
		const examples: Record<string, unknown> = {};
		const exampleOperator = {
			values: {
				...(operators.includes(ValueOperator.EQUALS) ? { field1: { $eq: "bar" } } : {}),
				...(operators.includes(ValueOperator.NOT_EQUALS) ? { field2: { $neq: "foo" } } : {}),
				...(operators.includes(ValueOperator.GREATER_THAN) ? { field2: { $gt: 20 } } : {}),
				...(operators.includes(ValueOperator.GREATER_OR_EQUALS) ? { field3: { $gte: 25 } } : {}),
				...(operators.includes(ValueOperator.LOWER_THAN) ? { field4: { $lt: 20 } } : {}),
				...(operators.includes(ValueOperator.LOWER_OR_EQUALS) ? { field5: { $lte: 15 } } : {}),
				...(operators.includes(ValueOperator.START_WITH) ? { field6: { $start: "Hello" } } : {}),
				...(operators.includes(ValueOperator.END_WITH) ? { field7: { $end: "world" } } : {}),
				...(operators.includes(ValueOperator.REGEX) ? { field8: { $regex: "^https?://" } } : {}),
				...(operators.includes(ValueOperator.IS_NULL) ? { field9: { $null: 1 } } : {}),
				...(operators.includes(ValueOperator.IS_DEFINED) ? { field10: { $def: 1 } } : {}),
			},
			list: {
				...(operators.includes(ListOperator.IN) ? { field1: { $in: ["hello", "world"] } } : {}),
				...(operators.includes(ListOperator.NOT_IN) ? { field2: { $nin: ["foo", "bar"] } } : {}),
			},
		};
		if (Object.keys(exampleOperator.values).length > 0) {
			examples["Value operators"] = {
				summary: "Simple example with only value operators",
				value: { ...exampleOperator.values },
			};
		}
		if (Object.keys(exampleOperator.list).length > 0) {
			examples["List operators"] = {
				summary: "Simple example with only list operators",
				value: { ...exampleOperator.list },
			};
		}

		return examples;
	}

	return applyDecorators(
		Get("/"),
		ApiOperation({
			summary: "Get a pagination of the data collection",
			description: "Get a paginated portion (page number base pagination) of the data collection.",
		}),
		FieldsQuerySwagger(dtoConstructor),
		ApiQuery({
			name: "sort",
			isArray: true,
			required: false,
			style: "simple",
			description:
				"The ordering of the collection result.  \n" +
				'The value is a comma-separated (`U+002C COMMA`, ",") list.  \n' +
				'If the name is prefixed by a "`-`", the order will be desc.',
			enum: (Reflect.getMetadata("swagger/apiModelPropertiesArray", dtoConstructor.prototype) as Array<string>).flatMap(
				(item) => [item.substring(1), `-${item.substring(1)}`],
			),
		}),
		ApiExtraModels(...models),
		ApiQuery({
			name: "filters",
			style: "deepObject",
			explode: true,
			required: false,
			schema: {
				type: "object",
				patternProperties: {
					...Object.fromEntries(
						["$or", "$and"].map((operator) => [
							regexEscaper(operator),
							{
								type: "array",
								items: {
									type: "object",
									patternProperties: {
										".*": MongoFilterSchema(),
									},
								},
							},
						]),
					),
					"^[^$].*$": MongoFilterSchema(),
				},
			},
			description: buildOperatorsDescription(),
			examples: removeUndefined({
				"No filter": {
					value: {},
				},
				...buildOperatorsExamples(),
				"Multiple filter on one field": {
					description: "Example of multiple filter applied on the same field",
					value: {
						field1: { $gt: 20, $lt: 100 },
						field2: { $start: "Hello,", $end: "Best regards." },
					},
				},
				"Conditional operator ($or)": operators.includes(LogicalOperator.OR)
					? {
							value: {
								$or: { 0: { field1: { $eq: 10 } }, 1: { field2: { $eq: 12 } } },
							},
						}
					: undefined,
			}),
		}),
		ApiQuery({
			name: "page",
			style: "deepObject",
			explode: true,
			required: false,
			schema: {
				type: "object",
				properties: {
					size: { type: "number" },
					number: { type: "number" },
				},
			},
			example: {
				size: 20,
				number: 1,
			},
		}),
		ApiHeader({
			name: "accept",
			required: false,
			enum: getContentType(representations, "getOneResponseSwaggerExtension"),
		}),
		ApiOkResponse({
			content: responses,
			description: "The paginated list of element",
		}),
	);
}
function FieldsQuerySwagger<Dto extends JsonObject>(dataDto: Type<Dto> | undefined) {
	if (dataDto === undefined) return () => {};
	return ApiQuery({
		description:
			"List of field to display in the response.  \n" +
			'The value is a comma-separated (`U+002C COMMA`, ",") list.  \n' +
			"No or missing value will display all available fields.",
		name: "fields",
		isArray: true,
		style: "simple",
		required: false,
		enum: (Reflect.getMetadata("swagger/apiModelPropertiesArray", dataDto.prototype) as Array<string>).map((item) =>
			item.substring(1),
		),
	});
}
function OneModelResponseSwagger<Dto extends JsonObject>(
	dataDto: Type<Dto> | undefined,
	resourceType: string,
	ApiResponseDecoratorFunction: typeof ApiResponseDecorator,
	description: string,
	representations: Array<Representation>,
): MethodDecorator {
	if (dataDto === undefined) return () => {};

	const { models, responses } = getSwaggerExtension(
		representations,
		"getOneResponseSwaggerExtension",
		dataDto,
		resourceType,
	);

	return applyDecorators(
		ApiExtraModels(...models),
		ApiResponseDecoratorFunction({
			description,
			content: responses,
		}),
	);
}
class ProblemDetailResponse {
	@ApiProperty({
		type: Number,
		description: "The HTTP status code generated by the server",
	})
	status = 0;
	@ApiProperty({
		type: String,
		required: false,
		description: "URI reference that identifies the problem type",
	})
	type = "https://httpstatuses.com/0";
	@ApiProperty({
		type: String,
		description: "A short, human-readable summary of the problem type",
	})
	title = "Error title";
	@ApiProperty({
		type: String,
		description: "A human-readable explanation specific to this occurrence of the problem.",
	})
	detail = "Error details";
	@ApiProperty({
		type: String,
		required: false,
		description: "URI reference that identifies the specific occurrence of the problem.",
	})
	instance = "/url";
}
const ProblemDetailResponseOptions = {
	content: {
		"application/problem+json": {
			schema: { $ref: getSchemaPath(ProblemDetailResponse) },
		},
	},
};

export {
	SearchField,
	Operators,
	ValueOperator,
	LogicalOperator,
	ListOperator,
} from "./api.js";
export {
	toMongoFilterQuery,
	OneToOneConverter,
	toMongoOperator,
	toMongoSort,
	BaseDto,
} from "./helpers.js";

export { JsonApi, Hal, type JsonApiUpdateRequestInterface, type JsonApiCreateRequestInterface };
export { JsonLdFactory } from "./representation/json-ld.js";
export { default as SimpleJson } from "./representation/simple-json.js";
