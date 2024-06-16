import { Body, Headers, type LoggerService, Param, Query, Req, Res, type Type, UseFilters } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ApiExtraModels } from "@nestjs/swagger";
import {
	ProblemDetailException,
	ProblemDetailFilter,
	type ProblemDetailTypeUrlResolver,
} from "@sjfrhafe/nest-problem-details";
import type { Request, Response } from "express";
import type { Object as JsonObject } from "json-typescript";
import * as MongoErrors from "mongo-errors";
import { MongoServerError } from "mongodb";
import type { FilterQuery, HydratedDocument, InferId, Model, SortOrder } from "mongoose";
import { MongooseError, Error as MongooseErrorNamespace } from "mongoose";
import { type DotKeys, FilterParserAction, Operators, type SearchField, filtersValidator, getDotKeys } from "./api.js";
import { CommaListPipe, RelativeUrl } from "./helpers.js";
import {
	CreateOneDecorator,
	DeleteOneDecorator,
	GetListDecorator,
	GetOneDecorator,
	ProblemDetailResponse,
	UpdateOneDecorator,
} from "./open-api.js";
import Hal from "./representation/hal.js";
import { type Representation, getParser, getRenderer, validateContentType } from "./representation/index.js";
import JsonApi, {} from "./representation/json-api.js";
import { addExcludeArray, bound, filterArray, wrap } from "./utils.js";

/**
 * Converter between the Mongoose Entity and the Nest DTO
 */
export interface EntityConverter<
	Resource extends object,
	Dto extends JsonObject = JsonObject,
	Creator extends JsonObject = JsonObject,
	Updater extends JsonObject = JsonObject,
> {
	/**
	 * Transform a document from MongoDB into the DTO you want to display
	 * @param input The document from MongoDB
	 */
	toDto: (input: HydratedDocument<Resource> | Partial<Resource>) => Partial<Dto>;
	/**
	 * Mapping of the filtering provided to a MongoDB FilterQuery
	 * @param input
	 */
	fromSearchable: (input?: SearchField<Dto>) => FilterQuery<Resource>;
	/**
	 * Mapping of field to select (`projection`) in the MongoDB query from the name of field of the DTO
	 * @param fields
	 */
	fromDtoFields: (fields?: Array<DotKeys<Dto>>) => Array<DotKeys<Resource>> | undefined;
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

export type PartialWithId<Resource> = Partial<Resource> & {
	_id: InferId<Resource>;
};

export interface MongooseController<Dto extends JsonObject, Creator extends JsonObject, Updater extends JsonObject> {
	/**
	 * Get a paginated list of document
	 */
	getList?(
		response: Response,
		request: Request,
		filters?: SearchField<Dto>,
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
	createOne?(response: Response, request: Request, body: JsonOf<Creator>): Promise<JsonOf<Dto> | undefined | never>;
	/**
	 * Get one document
	 */
	updateOne?(
		response: Response,
		request: Request,
		body: JsonOf<Updater>,
		id: string,
		fields?: unknown,
		noContent?: boolean,
	): Promise<JsonOf<Dto> | never | undefined>;
	/**
	 * Delete one document by its Id
	 */
	deleteOne?(id: string): Promise<undefined | never>;
}

export type AddExcludeField = {
	/**
	 * List of field to remove
	 * (default: `[]`)
	 */
	exclude: Array<string>;
	/**
	 * List of field to add
	 * (default: `[]`)
	 */
	add: Array<string>;
};
export type MongooseControllerOptions<
	Dto extends JsonObject,
	Creator extends JsonObject,
	Updater extends JsonObject,
> = Partial<{
	/**
	 * Allow to remove some part of the controller
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
	 * Configuration of the list filter
	 */
	filter: Partial<{
		/**
		 * List of operators to display in the swagger
		 * (default: `[ "$eq", "$neq", "$gt", "$gte", "$lt", "$lte", "$start", "$end", "$regex", "$null", "$def", "$in", "$nin", "$or", "$and" ]`)
		 */
		operators: typeof Operators;
		/**
		 * Define how the filter parser should handle invalid operator or field.
		 * (default: `FilterParserAction.THROW`)
		 */
		actionOnInvalid: FilterParserAction;
		/**
		 * Filter fields options
		 */
		fields: Partial<AddExcludeField>;
	}>;
	/**
	 * Sort fields options
	 */
	sort: Partial<AddExcludeField>;
	/**
	 * Projection (display) fields options
	 */
	projection: Partial<AddExcludeField>;
}>;

/**
 * Create a controller class to extends
 *
 * @param modelInjectionName The name linked to the schema (same as declared in `MongooseModule.forFeature`)
 * @param converter The instance responsible to convert your DTO into Mongo Entity and vice-versa
 * @param dtoConstructor The class representation of one element of your collection that you want to return (if missing or `undefined`, it's the same as `options.disable.read: true`)
 * @param creatorConstructor The class representation of a new element to add to your collection that you want to receive (if missing or `undefined`, it's the same as `options.disable.create: true`)
 * @param updaterConstructor The class representation of one element to update in your collection that you want to receive (if missing or `undefined`, it's the same as `options.disable.update: true`)
 * @param options Configurations of the controller
 */
export function MongooseControllerFactory<
	Resource extends object,
	Dto extends JsonObject = JsonObject,
	Creator extends JsonObject = JsonObject,
	Updater extends JsonObject = JsonObject,
>(
	modelInjectionName: string,
	converter: EntityConverter<Resource, Dto, Creator, Updater>,
	dtoConstructor?: Type<Dto>,
	creatorConstructor?: Type<Creator>,
	updaterConstructor?: Type<Updater>,
	options?: MongooseControllerOptions<Dto, Creator, Updater>,
): Type<MongooseController<Dto, Creator, Updater>> {
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
		filter: {
			operators: typeof Operators;
			actionOnInvalid: FilterParserAction;
			fields: AddExcludeField;
		};
		sort: AddExcludeField;
		projection: AddExcludeField;
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
		filter: {
			operators: options?.filter?.operators ?? Operators,
			actionOnInvalid: options?.filter?.actionOnInvalid ?? FilterParserAction.THROW,
			fields: {
				add: options?.filter?.fields?.add ?? [],
				exclude: options?.filter?.fields?.exclude ?? [],
			},
		},
		sort: {
			add: options?.sort?.add ?? [],
			exclude: options?.sort?.exclude ?? [],
		},
		projection: {
			add: options?.projection?.add ?? [],
			exclude: options?.projection?.exclude ?? [],
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
	class GooseApiController implements MongooseController<Dto, Creator, Updater> {
		constructor(@InjectModel(modelInjectionName) private readonly model: Model<Resource>) {}

		@GetListDecorator(
			dtoConstructor,
			conf.resourceType,
			conf.representations,
			conf.pageSize.max,
			conf.filter.operators,
			conf.filter.fields,
			conf.sort,
			conf.projection,
		)
		async getList(
			@Res({ passthrough: true }) response: Response,
			@Req() request: Request,
			@Query("filters") filters?: SearchField<Dto>,
			@Query("page") page?: { size: number; number: number },
			@Query("fields", CommaListPipe) fields?: unknown,
			@Query("sort", CommaListPipe) sort?: unknown,
			@Headers("accept") accept?: unknown,
		): Promise<JsonObject> {
			const contentType = validateContentType(conf.representations, "getCollectionResponseSwaggerExtension", accept);
			const validatedFilters = filtersValidator(
				filters,
				conf.filter.operators,
				addExcludeArray(getDotKeys(dtoConstructor), conf.filter.fields.add, conf.filter.fields.exclude),
				conf.filter.actionOnInvalid,
			);
			const mongoFilter = converter.fromSearchable(validatedFilters);
			const mongoProjection = converter.fromDtoFields(
				fields !== undefined ? filterArray(fields as Array<DotKeys<Dto>>, getDotKeys(dtoConstructor)) : undefined,
			);
			const mongoSort = converter.fromDtoSort(
				filterArray(
					(sort as Array<string> | undefined) ?? [],
					addExcludeArray(getDotKeys(dtoConstructor), conf.sort.add, conf.sort.exclude),
				),
			);
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

		@GetOneDecorator(dtoConstructor, conf.resourceType, conf.representations, conf.projection)
		async getOne(
			@Res({ passthrough: true }) response: Response,
			@Req() request: Request,
			@Param("id") id: string,
			@Query("fields", CommaListPipe) fields?: unknown,
			@Headers("accept") accept?: unknown,
		): Promise<JsonObject> {
			const contentType = validateContentType(conf.representations, "getCollectionResponseSwaggerExtension", accept);
			const mongoProjection = converter.fromDtoFields(fields as undefined | Array<DotKeys<Dto>>);
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

		@UpdateOneDecorator(dtoConstructor, updaterConstructor, conf.resourceType, conf.representations, conf.projection)
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

				const mongoProjection = converter.fromDtoFields(fields as undefined | Array<DotKeys<Dto>>);
				const url = RelativeUrl.from(request.url);
				url.onlyKeepParams(["fields"]);
				const document = await this.model
					.findById(id, mongoProjection, {
						lean: true,
					})
					.exec();

				response.contentType(contentType);
				const renderer = getRenderer<Dto>(conf.representations, contentType, "renderOne");
				return renderer(id, conf.resourceType, url.toString(), converter.toDto(document as Resource));
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

		if (error instanceof MongooseErrorNamespace.CastError) {
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

export {
	type SearchField,
	Operators,
	ValueOperator,
	LogicalOperator,
	ListOperator,
	type DotKeys,
	type FlattenObject,
	FilterParserAction,
} from "./api.js";
export {
	toMongoFilterQuery,
	OneToOneConverter,
	toMongoOperator,
	toMongoSort,
	BaseDto,
} from "./helpers.js";

export { JsonApi, Hal };
export type {
	Representation,
	ParseCreate,
	RenderOne,
	RenderPage,
	ParseUpdate,
	SwaggerSchemaExtension,
	OneResponseSwaggerExtension,
	UpdateRequestSwaggerExtension,
	CollectionResponseSwaggerExtension,
	CreateRequestSwaggerExtension,
} from "./representation/index.js";
export { JsonLdFactory } from "./representation/json-ld.js";
export { default as SimpleJson } from "./representation/simple-json.js";
export {
	UpdateOneDecorator,
	CreateOneDecorator,
	GetOneDecorator,
	GetListDecorator,
	DeleteOneDecorator,
} from "./open-api.js";
