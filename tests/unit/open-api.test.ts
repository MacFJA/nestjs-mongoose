import { RequestMethod } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import {
	BaseDto,
	CreateOneDecorator,
	DeleteOneDecorator,
	GetListDecorator,
	GetOneDecorator,
	ListOperator,
	LogicalOperator,
	SimpleJson,
	UpdateOneDecorator,
	ValueOperator,
} from "../../src/index.js";
import { ListFilters } from "../../src/open-api.js";
import { testDecorator, testFunction } from "../_helpers.js";

class FakeDto extends BaseDto {
	@ApiProperty() foo: string;

	constructor(foo: string) {
		super();
		this.foo = foo;
	}
}
class FakeDto2 extends FakeDto {}

void testDecorator(GetOneDecorator, "", (t) => {
	const decorate = GetOneDecorator(FakeDto, "test", [SimpleJson], { add: [], exclude: [] });

	const source = { bar: () => "hello world" };
	decorate(source, "bar", Object.getOwnPropertyDescriptor(source, "bar") ?? {});

	t.deepEqual(Reflect.getMetadataKeys(source.bar), [
		"path",
		"method",
		"swagger/apiOperation",
		"swagger/apiParameters",
		"swagger/apiResponse",
		"swagger/apiExtraModels",
	]);
	t.is(Reflect.getMetadata("path", source.bar), "/:id");
	t.is(Reflect.getMetadata("method", source.bar), RequestMethod.GET);
	t.deepEqual(Reflect.getMetadata("swagger/apiOperation", source.bar), {
		summary: "Get one element",
		description: "Get one element by its identifier.",
	});
	t.deepEqual(Reflect.getMetadata("swagger/apiParameters", source.bar), [
		{
			description: "The unique identifier of the element to get",
			in: "path",
			name: "id",
			required: true,
		},
		{
			description:
				'List of field to display in the response.  \nThe value is a comma-separated (`U+002C COMMA`, "`,`") list.  \nNo or missing value will display all available fields.',
			in: "query",
			isArray: true,
			name: "fields",
			required: false,
			schema: {
				items: { enum: ["foo"], type: "string" },
				type: "array",
			},
		},
	]);
	t.deepEqual(Reflect.getMetadata("swagger/apiResponse", source.bar), {
		200: {
			content: {
				"application/json": { schema: { allOf: [{ $ref: "#/components/schemas/FakeDto" }] } },
			},
			description: "The requested element",
			isArray: undefined,
			type: undefined,
		},
		400: {
			content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetailResponse" } } },
			description: "If the provided information are invalid/malformed",
			isArray: undefined,
			type: undefined,
		},
		404: {
			content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetailResponse" } } },
			description: "If the document does not exists (the identifier is linked to no document)",
			isArray: undefined,
			type: undefined,
		},
	});
	t.deepEqual(Reflect.getMetadata("swagger/apiExtraModels", source.bar), [FakeDto]);
});

void testDecorator(DeleteOneDecorator, "", (t) => {
	const decorate = DeleteOneDecorator();

	const source = { bar: () => "hello world" };
	decorate(source, "bar", Object.getOwnPropertyDescriptor(source, "bar") ?? {});

	t.deepEqual(Reflect.getMetadataKeys(source.bar), [
		"path",
		"method",
		"swagger/apiOperation",
		"swagger/apiParameters",
		"swagger/apiResponse",
		"__httpCode__",
	]);
	t.is(Reflect.getMetadata("path", source.bar), "/:id");
	t.is(Reflect.getMetadata("method", source.bar), RequestMethod.DELETE);
	t.deepEqual(Reflect.getMetadata("swagger/apiOperation", source.bar), {
		summary: "Delete one element",
		description: "Delete one element by its identifier.",
	});
	t.deepEqual(Reflect.getMetadata("swagger/apiParameters", source.bar), [
		{
			description: "The unique identifier of the element to delete",
			in: "path",
			name: "id",
			required: true,
		},
	]);
	t.deepEqual(Reflect.getMetadata("swagger/apiResponse", source.bar), {
		204: {
			description: "The document have been successfully deleted",
			isArray: undefined,
			type: undefined,
		},
		400: {
			content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetailResponse" } } },
			description: "If the provided `id` is invalid",
			isArray: undefined,
			type: undefined,
		},
		404: {
			content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetailResponse" } } },
			description: "If the document does not exists (the identifier is linked to no document)",
			isArray: undefined,
			type: undefined,
		},
	});
	t.is(Reflect.getMetadata("__httpCode__", source.bar), 204);
});

void testDecorator(UpdateOneDecorator, "", (t) => {
	const decorate = UpdateOneDecorator(FakeDto, FakeDto2, "test", [SimpleJson], { add: [], exclude: [] });

	const source = { bar: () => "hello world" };
	decorate(source, "bar", Object.getOwnPropertyDescriptor(source, "bar") ?? {});

	t.deepEqual(Reflect.getMetadataKeys(source.bar), [
		"path",
		"method",
		"swagger/apiExtraModels",
		"swagger/apiOperation",
		"swagger/apiParameters",
		"swagger/apiResponse",
	]);
	t.is(Reflect.getMetadata("path", source.bar), "/:id");
	t.is(Reflect.getMetadata("method", source.bar), RequestMethod.PATCH);
	t.deepEqual(Reflect.getMetadata("swagger/apiExtraModels", source.bar), [FakeDto2, FakeDto]);
	t.deepEqual(Reflect.getMetadata("swagger/apiOperation", source.bar), {
		summary: "Update one element",
		description:
			"Update one element by its identifier.  \nThe modification is partial, so all fields in `data.attributes` are optional.",
		requestBody: {
			content: {
				"application/json": { schema: { allOf: [{ $ref: "#/components/schemas/FakeDto2" }] } },
			},
			description: "The modification is partial, so all fields of the resource are optional",
		},
	});
	t.deepEqual(Reflect.getMetadata("swagger/apiParameters", source.bar), [
		{
			description:
				"Indicate if the API should return the updated document (value set to `false`, or not provided) or if it should just return a `204` (value set to `true`)",
			in: "query",
			name: "no-content",
			required: false,
			type: Boolean,
		},
		{
			description: "The unique identifier of the element to update",
			in: "path",
			name: "id",
			required: true,
		},

		{
			description: `List of field to display in the response.  \nThe value is a comma-separated (\`U+002C COMMA\`, "\`,\`") list.  \nNo or missing value will display all available fields.`,
			in: "query",
			isArray: true,
			name: "fields",
			required: false,
			schema: {
				items: { enum: ["foo"], type: "string" },
				type: "array",
			},
		},
	]);
	t.deepEqual(Reflect.getMetadata("swagger/apiResponse", source.bar), {
		200: {
			content: {
				"application/json": {
					schema: {
						allOf: [{ $ref: "#/components/schemas/FakeDto" }],
					},
				},
			},
			description: "The new content of the updated element",
			isArray: undefined,
			type: undefined,
		},
		204: {
			description:
				"If the provided data did not change the element, or if `no-content` query parameter is set to `true`, or if the `read` permission is not allowed on the API",
			isArray: undefined,
			type: undefined,
		},
		400: {
			content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetailResponse" } } },
			description: "If the provided information are invalid/malformed",
			isArray: undefined,
			type: undefined,
		},
		404: {
			content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetailResponse" } } },
			description: "If the document does not exists (the identifier is linked to no document)",
			isArray: undefined,
			type: undefined,
		},
		409: {
			content: {
				"application/problem+json": {
					schema: { $ref: "#/components/schemas/ProblemDetailResponse" },
				},
			},
			description: "If updated element will end up in conflict with an existing element",
			isArray: undefined,
			type: undefined,
		},
	});
});

void testDecorator(CreateOneDecorator, "", (t) => {
	const decorate = CreateOneDecorator(FakeDto, FakeDto2, "test", [SimpleJson]);

	const source = { bar: () => "hello world" };
	decorate(source, "bar", Object.getOwnPropertyDescriptor(source, "bar") ?? {});

	t.deepEqual(Reflect.getMetadataKeys(source.bar), [
		"path",
		"method",
		"swagger/apiOperation",
		"swagger/apiExtraModels",
		"swagger/apiResponse",
	]);
	t.is(Reflect.getMetadata("path", source.bar), "/");
	t.is(Reflect.getMetadata("method", source.bar), RequestMethod.POST);
	t.deepEqual(Reflect.getMetadata("swagger/apiExtraModels", source.bar), [FakeDto2, FakeDto]);
	t.deepEqual(Reflect.getMetadata("swagger/apiOperation", source.bar), {
		summary: "Create a new element",
		requestBody: {
			content: {
				"application/json": { schema: { allOf: [{ $ref: "#/components/schemas/FakeDto2" }] } },
			},
		},
	});
	t.deepEqual(Reflect.getMetadata("swagger/apiResponse", source.bar), {
		201: {
			content: {
				"application/json": {
					schema: {
						allOf: [{ $ref: "#/components/schemas/FakeDto" }],
					},
				},
			},
			description: "The newly created element",
			isArray: undefined,
			type: undefined,
		},
		204: {
			description: "If the creation of the element succeed and the `read` permission is not allowed on the API",
			isArray: undefined,
			type: undefined,
		},
		400: {
			content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetailResponse" } } },
			description: "If the provided information are invalid/malformed",
			isArray: undefined,
			type: undefined,
		},
		409: {
			content: {
				"application/problem+json": {
					schema: { $ref: "#/components/schemas/ProblemDetailResponse" },
				},
			},
			description: "If the new element is in conflict with an existing element",
			isArray: undefined,
			type: undefined,
		},
	});
});

void testDecorator(GetListDecorator, "", (t) => {
	const decorate = GetListDecorator(
		FakeDto,
		"test",
		[SimpleJson],
		20,
		[ValueOperator.EQUALS, ListOperator.IN, LogicalOperator.OR],
		{ add: [], exclude: [] },
		{ add: [], exclude: [] },
		{ add: [], exclude: [] },
	);

	const source = { bar: () => "hello world" };
	decorate(source, "bar", Object.getOwnPropertyDescriptor(source, "bar") ?? {});

	t.deepEqual(Reflect.getMetadataKeys(source.bar), [
		"path",
		"method",
		"swagger/apiOperation",
		"swagger/apiParameters",
		"swagger/apiExtraModels",
		"swagger/apiResponse",
	]);
	t.is(Reflect.getMetadata("path", source.bar), "/");
	t.is(Reflect.getMetadata("method", source.bar), RequestMethod.GET);
	t.deepEqual(Reflect.getMetadata("swagger/apiOperation", source.bar), {
		summary: "Get a pagination of the data collection",
		description: "Get a paginated portion (page number based pagination) of the data collection.",
	});
	t.deepEqual(Reflect.getMetadata("swagger/apiParameters", source.bar), [
		{
			description: `List of field to display in the response.  \nThe value is a comma-separated (\`U+002C COMMA\`, "\`,\`") list.  \nNo or missing value will display all available fields.`,
			in: "query",
			isArray: true,
			name: "fields",
			required: false,
			schema: {
				items: { enum: ["foo"], type: "string" },
				type: "array",
			},
		},
		{
			description: `The ordering of the collection result.  \nThe value is a comma-separated (\`U+002C COMMA\`, "\`,\`") list.  \nIf the name is prefixed by a "\`-\`", the order will be desc.`,
			in: "query",
			isArray: true,
			name: "sort",
			required: false,
			schema: {
				items: {
					enum: ["foo", "-foo"],
					type: "string",
				},
				type: "array",
			},
		},
		{
			description:
				"\n### Values operators:\n" +
				"Operators to use on a field for a single value\n" +
				"- `$eq`: Equals to\n" +
				"### List operators:\n" +
				"Operators to use on a field for a list value\n" +
				"- `$in`: In the list\n" +
				"### Logical operators:\n" +
				"Operators to use on a list expression\n" +
				"Can only be use at the root of the filter\n" +
				"- `$or`: Must validate at least one expression\n" +
				"### Fields:\n" +
				"Available fields to use\n" +
				"- `foo`",
			examples: {
				"Conditional operator ($or)": {
					value: {
						$or: {
							0: { field1: { $eq: 10 } },
							1: { field2: { $eq: 12 } },
						},
					},
				},
				"List operators": {
					summary: "Simple example with only list operators",
					value: {
						field1: { $in: ["hello", "world"] },
					},
				},
				"Multiple filter on one field": {
					description: "Example of multiple filter applied on the same field",
					value: {
						field1: { $gt: 20, $lt: 100 },
						field2: { $end: "Best regards.", $start: "Hello," },
					},
				},
				"No filter": {
					value: {},
				},
				"Value operators": {
					summary: "Simple example with only value operators",
					value: { field1: { $eq: "bar" } },
				},
			},
			explode: true,
			in: "query",
			name: "filters",
			required: false,
			schema: {
				patternProperties: {
					"\\$and": {
						items: {
							patternProperties: {
								".*": { $ref: "#/components/schemas/ListFilters" },
							},
							type: "object",
						},
						type: "array",
					},
					"\\$or": {
						items: {
							patternProperties: {
								".*": { $ref: "#/components/schemas/ListFilters" },
							},
							type: "object",
						},
						type: "array",
					},
					"^[^$].*$": { $ref: "#/components/schemas/ListFilters" },
				},
				type: "object",
			},
			style: "deepObject",
		},
		{
			description: "Select which page to get.  \nThe maximum allowed value for `size` is `20`",
			example: {
				number: 1,
				size: 20,
			},
			explode: true,
			in: "query",
			name: "page",
			required: false,
			schema: {
				properties: {
					number: { type: "number" },
					size: { type: "number" },
				},
				type: "object",
			},
			style: "deepObject",
		},
	]);
	t.deepEqual(
		Reflect.getMetadata("swagger/apiExtraModels", source.bar).map((f: { name: string }) => f.name),
		["SimpleJsonCollectionResponse", FakeDto.name, ListFilters.name],
	);
	t.deepEqual(Reflect.getMetadata("swagger/apiResponse", source.bar), {
		200: {
			content: {
				"application/json": {
					schema: {
						allOf: [
							{ $ref: "#/components/schemas/SimpleJsonCollectionResponse" },
							{
								properties: { items: { items: { allOf: [{ $ref: "#/components/schemas/FakeDto" }] }, type: "array" } },
							},
						],
					},
				},
			},
			description: "The paginated list of element",
			isArray: undefined,
			type: undefined,
		},
		400: {
			content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetailResponse" } } },
			description: "If the provided information are invalid/malformed",
			isArray: undefined,
			type: undefined,
		},
	});
});

void testFunction(GetOneDecorator, "No DTO", (t) => {
	t.is(GetOneDecorator(undefined, "test", [SimpleJson]).toString(), "() => { }");
});
void testFunction(CreateOneDecorator, "No DTO", (t) => {
	t.is(CreateOneDecorator(undefined, undefined, "test", [SimpleJson]).toString(), "() => { }");
});
void testFunction(UpdateOneDecorator, "No DTO", (t) => {
	t.is(UpdateOneDecorator(undefined, undefined, "test", [SimpleJson]).toString(), "() => { }");
});
void testFunction(GetListDecorator, "No DTO", (t) => {
	t.is(
		GetListDecorator(undefined, "test", [SimpleJson], 20, [
			ValueOperator.EQUALS,
			ListOperator.IN,
			LogicalOperator.OR,
		]).toString(),
		"() => { }",
	);
});
