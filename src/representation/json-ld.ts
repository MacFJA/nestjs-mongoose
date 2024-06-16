import type { Type } from "@nestjs/common";
import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import type { Object as JsonObject } from "json-typescript";
import { RelativeUrl } from "../helpers.js";
import { removeUndefined } from "../utils.js";
import { type Representation, type SwaggerSchemaExtension, getPaginationLinks } from "./index.js";

/* c8 ignore start */
class JsonLdSimpleResponse {
	@ApiProperty({ name: "@context", properties: { "@vocab": { type: "string" } } })
	context = {};
	@ApiProperty({ name: "@id", type: String })
	id = "";
	@ApiProperty({ name: "@type", type: String })
	type = "";
}
class JsonLdCollectionResponse {
	@ApiProperty({
		name: "@context",
		properties: {
			"@vocab": { type: "string" },
			hydra: { type: "string", default: "http://www.w3.org/ns/hydra/context.jsonld" },
		},
	})
	context = {};
	@ApiProperty({ name: "@id", type: String })
	id = "";
	@ApiProperty({ name: "@type", type: String, default: "hydra:Collection" })
	type = "";
	@ApiProperty({ name: "hydra:totalItems", type: Number })
	hydraTotalItems = 0;
	@ApiProperty({ name: "hydra:member" })
	hydraMember = [];
	@ApiProperty({
		name: "hydra:view",
		allOf: [
			{
				properties: {
					"@id": { type: "string" },
					"@type": { type: "string", default: "hydra:PartialCollectionView" },
					"hydra:first": { type: "string" },
					"hydra:previous": { type: "string" },
					"hydra:next": { type: "string" },
					"hydra:last": { type: "string" },
				},
				required: ["@id", "@type", "hydra:first", "hydra:last"],
			},
		],
	})
	hydraView = {};
}
class JsonLdResource {
	@ApiProperty({ name: "@id", type: String })
	id = "";
	@ApiProperty({ name: "@type", type: String })
	type = "";
}
/* c8 ignore end */

function getResourceSwaggerSchema<Dto extends JsonObject>(
	attribute: Type<Dto>,
	resourceType: string,
): SwaggerSchemaExtension {
	return {
		extraModels: [attribute, JsonLdResource],
		schema: {
			allOf: [
				{ $ref: getSchemaPath(JsonLdResource) },
				{ $ref: getSchemaPath(attribute) },
				{
					properties: {
						"@type": { type: "string", default: resourceType },
					},
				},
			],
		},
	};
}

export function JsonLdFactory(
	context: string,
): Representation &
	Required<
		Pick<
			Representation,
			"renderOne" | "renderPage" | "getOneResponseSwaggerExtension" | "getCollectionResponseSwaggerExtension"
		>
	> {
	function toEntity<Dto extends JsonObject>(id: string, type: string, resource: Dto): JsonObject {
		return {
			"@id": id,
			"@type": type,
			...resource,
		};
	}

	return {
		contentType: "application/ld+json",

		renderOne<Dto extends JsonObject>(id: string, type: string, self: string, resource: Dto) {
			const url = RelativeUrl.from(self);
			return {
				"@context": {
					"@vocab": context,
				},
				...toEntity(id, type, resource),
			};
		},
		renderPage<Dto extends JsonObject>(
			type: string,
			self: string,
			count: number,
			pageData: { size: number; current: number },
			resources: Map<string, Dto>,
		) {
			const { first, last, next, previous, self: url, totalPage } = getPaginationLinks(count, pageData, self);

			return {
				"@context": {
					hydra: "http://www.w3.org/ns/hydra/context.jsonld",
					"@vocab": context,
				},
				"@id": first,
				"@type": "hydra:Collection",
				"hydra:totalItems": count,
				"hydra:member": Array.from(resources.entries()).map(([id, resource]) => toEntity(id, type, resource)),
				"hydra:view": removeUndefined({
					"@id": url,
					"@type": "hydra:PartialCollectionView",
					"hydra:first": first,
					"hydra:previous": previous,
					"hydra:next": next,
					"hydra:last": last,
				}),
			};
		},
		getOneResponseSwaggerExtension(attribute, resourceType): SwaggerSchemaExtension {
			const resourceExtension = getResourceSwaggerSchema(attribute, resourceType);
			return {
				extraModels: [JsonLdSimpleResponse, ...resourceExtension.extraModels],
				schema: {
					allOf: [
						{ $ref: getSchemaPath(JsonLdSimpleResponse) },
						{
							properties: {
								"@context": {
									properties: { "@vocab": { default: context } },
								},
							},
						},
						resourceExtension.schema,
					],
				},
			};
		},
		getCollectionResponseSwaggerExtension(attribute, resourceType) {
			const resourceExtension = getResourceSwaggerSchema(attribute, resourceType);
			return {
				extraModels: [JsonLdCollectionResponse, ...resourceExtension.extraModels],
				schema: {
					allOf: [
						{ $ref: getSchemaPath(JsonLdCollectionResponse) },
						{
							properties: {
								"@context": {
									properties: { "@vocab": { default: context } },
								},
								"hydra:member": {
									type: "array",
									items: resourceExtension.schema,
								},
							},
						},
					],
				},
			};
		},
	};
}
export default JsonLdFactory;
