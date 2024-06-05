import type { Type } from "@nestjs/common";
import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import type { Object as JsonObject } from "json-typescript";
import type { Representation, SwaggerSchemaExtension } from "./index.js";

/*
 * Swagger implementation
 */

/* c8 ignore start */
class SimpleJsonCollectionResponse {
	@ApiProperty({ isArray: true, description: 'the document\'s "primary data"' })
	items = [];
	@ApiProperty({ type: Number })
	page = 0;
	@ApiProperty({ type: Number })
	limit = 0;
	@ApiProperty({ type: Number })
	total = 0;
}

/*
 * Swagger schema
 */

function ApiResourceSwaggerSchema<Dto extends JsonObject>(attribute: Type<Dto>): SwaggerSchemaExtension {
	return {
		extraModels: [attribute],
		schema: { allOf: [{ $ref: getSchemaPath(attribute) }] },
	};
}

/* c8 ignore end */

const SimpleJson: Representation = {
	contentType: "application/json",

	getCollectionResponseSwaggerExtension<Dto extends JsonObject>(
		attribute: Type<Dto>,
		resourceType: string,
	): SwaggerSchemaExtension {
		const resourceSchema = ApiResourceSwaggerSchema(attribute);
		return {
			extraModels: [SimpleJsonCollectionResponse, ...resourceSchema.extraModels],
			schema: {
				allOf: [
					{ $ref: getSchemaPath(SimpleJsonCollectionResponse) },
					{
						properties: {
							items: {
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
		return ApiResourceSwaggerSchema(attribute);
	},
	getOneResponseSwaggerExtension<Dto extends JsonObject>(
		attribute: Type<Dto>,
		resourceType: string,
	): SwaggerSchemaExtension {
		return ApiResourceSwaggerSchema(attribute);
	},
	getUpdateRequestSwaggerExtension<Dto extends JsonObject>(
		attribute: Type<Dto>,
		resourceType: string,
	): SwaggerSchemaExtension {
		return ApiResourceSwaggerSchema(attribute);
	},
	renderOne<Dto extends JsonObject>(id: string, type: string, self: string, resource: Dto) {
		return resource;
	},
	renderPage<Dto extends JsonObject>(
		type: string,
		self: string,
		count: number,
		pageData: { size: number; current: number },
		resources: Map<string, Dto>,
	) {
		return {
			items: Object.fromEntries(resources.entries()),
			page: Number(pageData.current),
			limit: Number(pageData.size),
			total: count,
		};
	},
	parseCreateRequest<Creator extends JsonObject>(input: Creator, type: string): Creator {
		return input;
	},
	parseUpdateRequest<Updater extends JsonObject>(input: Updater, type: string, id: string): Updater {
		return input;
	},
};
export default SimpleJson;
