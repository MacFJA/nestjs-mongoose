import { Delete, Get, HttpCode, Patch, Post, type Type, applyDecorators } from "@nestjs/common";
import {
	ApiBadRequestResponse,
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiExtraModels,
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
import type { Object as JsonObject } from "json-typescript";
import { ListOperator, LogicalOperator, Operators, ValueOperator, getDotKeys } from "./api.js";
import type { AddExcludeField } from "./index.js";
import { type Representation, getSwaggerExtension } from "./representation/index.js";
import { addExcludeArray, regexEscaper, removeUndefined } from "./utils.js";

/**
 * Decorator of the DELETE /{id} REST action.
 *
 * Contains Swagger information,
 * Route definition
 * @decorator
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
		ApiBadRequestResponse({
			...ProblemDetailResponseOptions,
			description: "If the provided `id` is invalid",
		}),
		HttpCode(204),
		ApiNotFoundResponse({
			...ProblemDetailResponseOptions,
			description: "If the document does not exists (the identifier is linked to no document)",
		}),
	);
}
/**
 * Decorator of the GET /{id} REST action.
 *
 * Contains Swagger information,
 * Route definition
 * @decorator
 */
export function GetOneDecorator<Dto extends JsonObject>(
	dtoConstructor: Type<Dto> | undefined,
	resourceType: string,
	representations: Array<Representation>,
	projectionFields: AddExcludeField = { add: [], exclude: [] },
): MethodDecorator {
	if (dtoConstructor === undefined) return () => {};
	return applyDecorators(
		Get("/:id"),
		ApiOperation({
			summary: "Get one element",
			description: "Get one element by its identifier.",
		}),
		ApiParam({
			name: "id",
			description: "The unique identifier of the element to get",
		}),
		ApiBadRequestResponse({
			...ProblemDetailResponseOptions,
			description: "If the provided information are invalid/malformed",
		}),
		ApiNotFoundResponse({
			...ProblemDetailResponseOptions,
			description: "If the document does not exists (the identifier is linked to no document)",
		}),
		FieldsQuerySwagger(dtoConstructor, projectionFields),
		OneModelResponseSwagger(dtoConstructor, resourceType, ApiOkResponse, "The requested element", representations),
	);
}
/**
 * Decorator of the POST / REST action.
 *
 * Contains Swagger information,
 * Route definition
 * @decorator
 */
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
/**
 * Decorator of the PATCH /{id} REST action.
 *
 * Contains Swagger information,
 * Route definition
 * @decorator
 */
export function UpdateOneDecorator<Updater extends JsonObject, Dto extends JsonObject>(
	dtoConstructor: Type<Dto> | undefined,
	updaterConstructor: Type<Updater> | undefined,
	resourceType: string,
	representations: Array<Representation>,
	projectionFields: AddExcludeField = { add: [], exclude: [] },
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
				"Update one element by its identifier.  \nThe modification is partial, so all fields in `data.attributes` are optional.",
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
			description: "The unique identifier of the element to update",
		}),
		FieldsQuerySwagger(dtoConstructor, projectionFields),
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
/**
 * Decorator of the GET / REST action.
 *
 * Contains Swagger information,
 * Route definition
 * @decorator
 */
export function GetListDecorator<Dto extends JsonObject>(
	dtoConstructor: Type<Dto> | undefined,
	resourceType: string,
	representations: Array<Representation>,
	maxPageLimit: number,
	operators: Readonly<Array<(typeof Operators)[number]>> = Operators,
	filterFields: AddExcludeField = { add: [], exclude: [] },
	sortFields: AddExcludeField = { add: [], exclude: [] },
	projectionFields: AddExcludeField = { add: [], exclude: [] },
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
				/* c8 ignore start */
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
				/* c8 ignore end */
			].filter(Boolean) as Array<string>,
			list: [
				/* c8 ignore start */
				operators.includes(ListOperator.IN) && "`$in`: In the list",
				operators.includes(ListOperator.NOT_IN) && "`$nin`: Not in the list",
				/* c8 ignore end */
			].filter(Boolean) as Array<string>,
			logical: [
				/* c8 ignore start */
				operators.includes(LogicalOperator.AND) && "`$and`: Must validate all expression",
				operators.includes(LogicalOperator.OR) && "`$or`: Must validate at least one expression",
				/* c8 ignore end */
			].filter(Boolean) as Array<string>,
			fields: addExcludeArray(getDotKeys(dtoConstructor), filterFields.add, filterFields.exclude).map(
				(v) => `\`${v}\``,
			),
		};
		if (descriptions.values.length > 0) {
			description += "\n### Values operators:\n";
			description += "Operators to use on a field for a single value\n";
			description += `- ${descriptions.values.join("\n- ")}`;
		}
		if (descriptions.list.length > 0) {
			description += "\n### List operators:\n";
			description += "Operators to use on a field for a list value\n";
			description += `- ${descriptions.list.join("\n- ")}`;
		}
		if (descriptions.logical.length > 0) {
			description += "\n### Logical operators:\n";
			description += "Operators to use on a list expression\n";
			description += "Can only be use at the root of the filter\n";
			description += `- ${descriptions.logical.join("\n- ")}`;
		}
		if (descriptions.fields.length > 0) {
			description += "\n### Fields:\n";
			description += "Available fields to use\n";
			description += `- ${descriptions.fields.join("\n- ")}`;
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
			description: "Get a paginated portion (page number based pagination) of the data collection.",
		}),
		FieldsQuerySwagger(dtoConstructor, projectionFields),
		ApiQuery({
			name: "sort",
			isArray: true,
			required: false,
			// style: "simple",
			description:
				"The ordering of the collection result.  \n" +
				'The value is a comma-separated (`U+002C COMMA`, "`,`") list.  \n' +
				'If the name is prefixed by a "`-`", the order will be desc.',
			enum: addExcludeArray(getDotKeys(dtoConstructor), sortFields.add, sortFields.exclude).flatMap((field) => [
				String(field),
				`-${String(field)}`,
			]),
		}),
		ApiExtraModels(...models, ListFilters),
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
									patternProperties: { ".*": { $ref: getSchemaPath(ListFilters) } },
								},
							},
						]),
					),
					"^[^$].*$": { $ref: getSchemaPath(ListFilters) },
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
			description: `Select which page to get.  \nThe maximum allowed value for \`size\` is \`${maxPageLimit}\``,
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
		ApiOkResponse({
			content: responses,
			description: "The paginated list of element",
		}),
		ApiBadRequestResponse({
			...ProblemDetailResponseOptions,
			description: "If the provided information are invalid/malformed",
		}),
	);
}
function FieldsQuerySwagger<Dto extends JsonObject>(dataDto: Type<Dto> | undefined, fields: AddExcludeField) {
	if (dataDto === undefined) return () => {};
	return ApiQuery({
		description:
			"List of field to display in the response.  \n" +
			'The value is a comma-separated (`U+002C COMMA`, "`,`") list.  \n' +
			"No or missing value will display all available fields.",
		name: "fields",
		isArray: true,
		// style: "simple",
		required: false,
		enum: addExcludeArray(getDotKeys(dataDto), fields.add, fields.exclude),
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
/* c8 ignore start */
export class ProblemDetailResponse {
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
/* c8 ignore end */
const ProblemDetailResponseOptions = {
	content: {
		"application/problem+json": {
			schema: { $ref: getSchemaPath(ProblemDetailResponse) },
		},
	},
};

export class ListFilters {
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$def" })
	def?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$end" })
	end?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$eq" })
	eq?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$gt" })
	gt?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$gte" })
	gte?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$lt" })
	lt?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$lte" })
	lte?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$neq" })
	neq?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$null" })
	null?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$regex" })
	regex?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: false, required: false, name: "$start" })
	start?: string | number;

	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: true, required: false, name: "$in" })
	in?: string | number;
	@ApiProperty({ oneOf: [{ type: "string" }, { type: "number" }], isArray: true, required: false, name: "$nin" })
	nin?: string | number;
}
