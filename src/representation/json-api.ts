import type { Type } from "@nestjs/common";
import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { ProblemDetailException } from "@sjfrhafe/nest-problem-details";
import type { Object as JsonObject } from "json-typescript";
import { RelativeUrl } from "../helpers.js";
import { removeUndefined } from "../utils.js";
import { type Representation, type SwaggerSchemaExtension, getPaginationLinks } from "./index.js";

export interface JsonApiUpdateRequestInterface<Data extends JsonObject> {
	data: {
		type: string;
		id: string;
		attributes: Data;
	};
	links?: {
		self: string;
	};
	meta?: JsonObject;
}
export interface JsonApiCreateRequestInterface<Data extends JsonObject> {
	data: {
		type: string;
		attributes: Data;
	};
}

function validateBody<Data extends JsonObject>(
	input: JsonObject | JsonApiUpdateRequestInterface<Data>,
	resourceType: string,
	additional?: (input: { data: { type: string; attributes: object } }) => undefined | never,
): asserts input is JsonApiUpdateRequestInterface<Data> {
	if (input === undefined || input === null || typeof input !== "object") {
		throw new ProblemDetailException(400, {
			title: "Invalid body",
			detail: "The body MUST defined and of type object",
		});
	}
	if (!Object.keys(input).includes("data") || typeof (input as { data: unknown }).data !== "object") {
		throw new ProblemDetailException(400, {
			title: "Invalid body",
			detail: 'The body MUST have a property named "data" of type object',
		});
	}
	const data = (input as { data: object }).data as Data;
	if (!Object.keys(data).includes("type") || data.type !== resourceType) {
		throw new ProblemDetailException(400, {
			title: "Invalid body",
			detail: `The body MUST have a property named 'data.type' with the value '${resourceType}'`,
		});
	}
	if (!Object.keys(data).includes("attributes") || typeof data.attributes !== "object") {
		throw new ProblemDetailException(400, {
			title: "Invalid body",
			detail: 'The body MUST have a property named "data.attributes" of type object',
		});
	}
	if (typeof additional === "function") {
		additional(input as { data: { type: string; attributes: object } });
	}
}

/*
 * Swagger implementation
 */

/* c8 ignore start */
class JsonApiCollectionResponse {
	@ApiProperty({ isArray: true, description: 'the document\'s "primary data"' })
	data = [];

	@ApiProperty({
		allOf: [
			{
				properties: Object.fromEntries(
					["self", "next", "prev", "last", "first"].map((name) => [name, { type: "string" }]),
				),
			},
			{ required: ["self", "last", "first"] },
		],
	})
	links = {};

	@ApiProperty({
		properties: {
			totalCount: { type: "number" },
			page: {
				type: "object",
				properties: {
					count: { type: "number" },
					size: { type: "number" },
					current: { type: "number" },
				},
			},
		},
		description: "Non-standard meta-information",
	})
	meta = {
		totalCount: 0,
		page: {
			count: 1,
			size: 10,
			current: 1,
		},
	};
}

class JsonApiSimpleResponse {
	@ApiProperty()
	data = {};

	@ApiProperty({ allOf: [{ properties: { self: { type: "string" } } }, { required: ["self"] }] })
	links = {};

	@ApiProperty({ required: false, type: Object })
	meta = {};
}

class JsonApiCreateRequest {
	@ApiProperty()
	data = {};
}

class JsonApiUpdateRequest {
	@ApiProperty()
	data = {};
}

class JsonApiDataResource {
	@ApiProperty({ type: String })
	type = "resource";

	@ApiProperty({ type: String })
	id = "1";

	@ApiProperty()
	attributes: JsonObject = {};
}

class JsonApiDataResourceOptionalId {
	@ApiProperty({ type: String })
	type = "resource";

	@ApiProperty({ type: String, required: false })
	id = "1";

	@ApiProperty()
	attributes: JsonObject = {};
}
/* c8 ignore end */
/*
 * Swagger schema
 */

function ApiResourceSwaggerSchema<Dto extends JsonObject>(
	attribute: Type<Dto>,
	resourceType: string,
	idOptional = false,
): SwaggerSchemaExtension {
	return {
		extraModels: [idOptional ? JsonApiDataResourceOptionalId : JsonApiDataResource, attribute],
		schema: {
			allOf: [
				{ $ref: getSchemaPath(idOptional ? JsonApiDataResourceOptionalId : JsonApiDataResource) },
				{
					properties: {
						type: { /*const: resourceType,*/ default: resourceType },
						attributes: { $ref: getSchemaPath(attribute) },
					},
				},
			],
		},
	};
}

const JsonApi: Required<Representation> = {
	contentType: "application/vnd.api+json",

	getCollectionResponseSwaggerExtension<Dto extends JsonObject>(
		attribute: Type<Dto>,
		resourceType: string,
	): SwaggerSchemaExtension {
		const resourceSchema = ApiResourceSwaggerSchema(attribute, resourceType);
		return {
			extraModels: [JsonApiCollectionResponse, ...resourceSchema.extraModels],
			schema: {
				allOf: [
					{ $ref: getSchemaPath(JsonApiCollectionResponse) },
					{
						properties: {
							data: {
								type: "array",
								items: resourceSchema.schema,
							},
						},
					},
				],
			},
		};
	},
	getCreateRequestSwaggerExtension<Dto extends JsonObject>(
		attribute: Type<Dto>,
		resourceType: string,
	): SwaggerSchemaExtension {
		const resourceSchema = ApiResourceSwaggerSchema(attribute, resourceType, true);
		return {
			extraModels: [JsonApiCreateRequest, ...resourceSchema.extraModels],
			schema: {
				allOf: [
					{ $ref: getSchemaPath(JsonApiCreateRequest) },
					{
						properties: {
							data: resourceSchema.schema,
						},
					},
				],
			},
		};
	},
	getOneResponseSwaggerExtension<Dto extends JsonObject>(
		attribute: Type<Dto>,
		resourceType: string,
	): SwaggerSchemaExtension {
		const resourceSchema = ApiResourceSwaggerSchema(attribute, resourceType);
		return {
			extraModels: [JsonApiSimpleResponse, ...resourceSchema.extraModels],
			schema: {
				allOf: [
					{ $ref: getSchemaPath(JsonApiSimpleResponse) },
					{
						properties: {
							data: resourceSchema.schema,
						},
					},
				],
			},
		};
	},
	getUpdateRequestSwaggerExtension<Dto extends JsonObject>(
		attribute: Type<Dto>,
		resourceType: string,
	): SwaggerSchemaExtension {
		const resourceSchema = ApiResourceSwaggerSchema(attribute, resourceType);
		return {
			extraModels: [JsonApiUpdateRequest, ...resourceSchema.extraModels],
			schema: {
				allOf: [
					{ $ref: getSchemaPath(JsonApiUpdateRequest) },
					{
						properties: {
							data: resourceSchema.schema,
						},
					},
				],
			},
		};
	},
	renderOne<Dto extends JsonObject>(id: string, type: string, self: string, resource: Dto) {
		const url = RelativeUrl.from(self);
		return {
			data: {
				id,
				type,
				attributes: resource,
			},
			links: {
				self: url.toString(),
			},
		};
	},
	renderPage<Dto extends JsonObject>(
		type: string,
		self: string,
		count: number,
		pageData: { size: number; current: number },
		resources: Map<string, Dto>,
	) {
		const { first, last, next, previous: prev, self: url, totalPage } = getPaginationLinks(count, pageData, self);
		return {
			data: Array.from(resources.entries()).map(([id, resource]) => ({
				id,
				type,
				attributes: resource,
			})),
			links: removeUndefined({
				self: url,
				first,
				last,
				next,
				prev,
			}),
			meta: {
				totalCount: count,
				page: {
					size: Number(pageData.size),
					count: totalPage,
					current: Number(pageData.current),
				},
			},
		};
	},
	parseCreateRequest<Creator extends JsonObject>(input: JsonObject, type: string): Creator {
		validateBody<Creator>(input, type);
		return input.data.attributes;
	},
	parseUpdateRequest<Updater extends JsonObject>(input: JsonObject, type: string, id: string): Updater {
		validateBody<Updater>(input, type, (input) => {
			const data = input.data as JsonApiUpdateRequestInterface<Updater>["data"];
			if (!Object.keys(data).includes("id") || typeof (data.id as unknown) !== "string") {
				throw new ProblemDetailException(400, {
					title: "Invalid body",
					detail: 'The body MUST have a property named "data.id" of type string',
				});
			}
			if (data.id !== id) {
				throw new ProblemDetailException(400, {
					title: "Invalid body",
					detail:
						'The Id provided in the property named "data.id" must be the same as the id in the URL path parameter',
				});
			}
		});
		return input.data.attributes;
	},
};
export default JsonApi;
