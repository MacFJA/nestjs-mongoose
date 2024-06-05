import { ApiProperty, getSchemaPath } from "@nestjs/swagger";
import { removeUndefined } from "../utils.js";
import { type Representation, getPaginationLinks } from "./index.js";

/* c8 ignore start */
class HalLink {
	@ApiProperty({ type: String, required: true })
	href = "";
}

class HalSimpleResponse {
	@ApiProperty({
		allOf: [{ properties: { self: { $ref: getSchemaPath(HalLink) } } }, { required: ["self"] }],
		required: true,
	})
	_links = {
		self: "",
	};
	@ApiProperty({ type: String })
	type = "";
}

class HalCollectionResponse {
	@ApiProperty({ isArray: true, description: 'the document\'s "primary data"' })
	_embedded = [];

	@ApiProperty({
		allOf: [
			{
				properties: Object.fromEntries(
					["self", "next", "prev", "first", "last"].map((name) => [name, { $ref: getSchemaPath(HalLink) }]),
				),
			},
			{ required: ["self", "first", "last"] },
		],
		required: true,
	})
	_links = {
		self: "",
		next: "",
		prev: "",
		first: "",
		last: "",
	};
	@ApiProperty({ type: String })
	type = "";
	@ApiProperty({ type: Number, description: "Number of element returned for the current page" })
	count = 0;
	@ApiProperty({ type: Number, description: "Total number of matching element" })
	total = 0;
}
/* c8 ignore end */

const Hal: Representation = {
	contentType: "application/hal+json",
	getCollectionResponseSwaggerExtension: (attribute, resourceType) => {
		return {
			extraModels: [attribute, HalCollectionResponse, HalLink],
			schema: {
				allOf: [
					{ $ref: getSchemaPath(HalCollectionResponse) },
					{
						properties: {
							_embedded: {
								type: "array",
								items: {
									$ref: getSchemaPath(attribute),
								},
							},
							type: {
								default: resourceType,
							},
						},
					},
				],
			},
		};
	},
	getCreateRequestSwaggerExtension: undefined,
	getOneResponseSwaggerExtension: (attribute, resourceType) => {
		return {
			extraModels: [attribute, HalSimpleResponse, HalLink],
			schema: {
				allOf: [
					{ $ref: getSchemaPath(HalSimpleResponse) },
					{ $ref: getSchemaPath(attribute) },
					{
						properties: {
							type: {
								default: resourceType,
							},
						},
					},
				],
			},
		};
	},
	getUpdateRequestSwaggerExtension: undefined,
	renderOne: (id, type, self, resource) => ({
		_links: {
			self: { href: self },
		},
		type,
		...resource,
	}),
	renderPage: (type, self, count, pageData, resources) => {
		const { first, last, next, previous, self: url, totalPage } = getPaginationLinks(count, pageData, self);

		return {
			_links: removeUndefined({
				self: { href: url },
				next: next ? { href: next } : undefined,
				prev: previous ? { href: previous } : undefined,
				first: { href: first },
				last: { href: last },
			}),
			_embedded: {
				[type]: Array.from(resources.values()),
			},
			type,
			count: resources.size,
			total: count,
		};
	},
};
export default Hal;
