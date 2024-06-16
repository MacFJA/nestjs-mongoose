import { ApiProperty } from "@nestjs/swagger";
import {
	FilterParserAction,
	ListOperator,
	LogicalOperator,
	ValueOperator,
	filtersValidator,
	getDotKeys,
} from "../../src/api.js";
import { testFunction } from "../_helpers.js";

testFunction(filtersValidator, "All valid", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown; hello: unknown; baz: unknown }>(
			{
				[LogicalOperator.AND]: [{ foo: { $eq: "bar" } }, { hello: { $neq: "world" } }],
				baz: { $start: "foobar" },
			},
			[LogicalOperator.AND, ValueOperator.EQUALS, ValueOperator.NOT_EQUALS, ValueOperator.START_WITH],
			["foo", "hello", "baz"],
			FilterParserAction.THROW,
		),
		{
			$and: [{ foo: { $eq: "bar" } }, { hello: { $neq: "world" } }],
			baz: { $start: "foobar" },
		},
	);
});

testFunction(filtersValidator, "Logical operator + invalid value operator: remove", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown; hello: unknown; baz: unknown }>(
			{
				[LogicalOperator.AND]: [{ foo: { $eq: "bar" } }, { hello: { $neq: "world" } }],
			},
			[ValueOperator.EQUALS, LogicalOperator.AND],
			["foo", "hello", "baz"],
			FilterParserAction.REMOVE,
		),
		{
			[LogicalOperator.AND]: [{ foo: { $eq: "bar" } }, { hello: {} }],
		},
	);
});

testFunction(filtersValidator, "No logical operator: remove", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown; hello: unknown; baz: unknown }>(
			{
				[LogicalOperator.AND]: [{ foo: { $eq: "bar" } }, { hello: { $neq: "world" } }],
				baz: { $start: "foobar" },
			},
			[ValueOperator.EQUALS, ValueOperator.NOT_EQUALS, ValueOperator.START_WITH],
			["foo", "hello", "baz"],
			FilterParserAction.REMOVE,
		),
		{
			baz: { $start: "foobar" },
		},
	);
});

testFunction(filtersValidator, "No logical operator: throw", (t) => {
	t.throws(() =>
		filtersValidator<{ foo: unknown; hello: unknown; baz: unknown }>(
			{
				[LogicalOperator.AND]: [{ foo: { $eq: "bar" } }, { hello: { $neq: "world" } }],
				baz: { $start: "foobar" },
			},
			[ValueOperator.EQUALS, ValueOperator.NOT_EQUALS, ValueOperator.START_WITH],
			["foo", "hello", "baz"],
			FilterParserAction.THROW,
		),
	);
});
testFunction(filtersValidator, "List operator: primitive to array", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $in: "foobar" as unknown as Array<string> },
			},
			[ListOperator.IN],
			["foo"],
			FilterParserAction.THROW,
		),
		{
			foo: { $in: ["foobar"] },
		},
	);
});
testFunction(filtersValidator, "List operator: valid", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $in: ["foobar"] },
			},
			[ListOperator.IN],
			["foo"],
			FilterParserAction.THROW,
		),
		{
			foo: { $in: ["foobar"] },
		},
	);
});
testFunction(filtersValidator, "List operator: invalid, removed", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $in: { hello: "world" } as unknown as Array<string> },
			},
			[ListOperator.IN],
			["foo"],
			FilterParserAction.REMOVE,
		),
		{
			foo: {},
		},
	);
});
testFunction(filtersValidator, "Value operator: invalid, throw", (t) => {
	t.throws(() =>
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $eq: { hello: "world" } as unknown as string },
			},
			[ValueOperator.EQUALS],
			["foo"],
			FilterParserAction.THROW,
		),
	);
});
testFunction(filtersValidator, "Value operator: invalid, removed", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $eq: { hello: "world" } as unknown as string },
			},
			[ValueOperator.EQUALS],
			["foo"],
			FilterParserAction.REMOVE,
		),
		{
			foo: {},
		},
	);
});
testFunction(filtersValidator, "List operator: invalid, throw", (t) => {
	t.throws(() =>
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $in: { hello: "world" } as unknown as Array<string> },
			},
			[ListOperator.IN],
			["foo"],
			FilterParserAction.THROW,
		),
	);
});
testFunction(filtersValidator, "Invalid operator: removed", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $eq: "bar" },
			},
			[],
			["foo"],
			FilterParserAction.REMOVE,
		),
		{
			foo: {},
		},
	);
});
testFunction(filtersValidator, "Invalid operator: throw", (t) => {
	t.throws(() =>
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $eq: "bar" },
			},
			[],
			["foo"],
			FilterParserAction.THROW,
		),
	);
});
testFunction(filtersValidator, "Primitive: null", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $eq: null },
			},
			[ValueOperator.EQUALS],
			["foo"],
			FilterParserAction.THROW,
		),
		{
			foo: { $eq: null },
		},
	);
});
testFunction(filtersValidator, "Primitive: string", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $eq: "bar" },
			},
			[ValueOperator.EQUALS],
			["foo"],
			FilterParserAction.THROW,
		),
		{
			foo: { $eq: "bar" },
		},
	);
});
testFunction(filtersValidator, "Primitive: number", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $eq: 10 },
			},
			[ValueOperator.EQUALS],
			["foo"],
			FilterParserAction.THROW,
		),
		{
			foo: { $eq: 10 },
		},
	);
});
testFunction(filtersValidator, "Primitive: boolean", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{
				foo: { $eq: false },
			},
			[ValueOperator.EQUALS],
			["foo"],
			FilterParserAction.THROW,
		),
		{
			foo: { $eq: false },
		},
	);
});
testFunction(filtersValidator, "Invalid field: removed", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown; bar: unknown }>(
			{
				foo: { $eq: false },
				bar: { $eq: true },
			},
			[ValueOperator.EQUALS],
			["foo"],
			FilterParserAction.REMOVE,
		),
		{
			foo: { $eq: false },
		},
	);
});
testFunction(filtersValidator, "Invalid field: throw", (t) => {
	t.throws(() =>
		filtersValidator<{ foo: unknown; bar: unknown }>(
			{
				foo: { $eq: "bar" },
				bar: { $eq: true },
			},
			[],
			["foo"],
			FilterParserAction.THROW,
		),
	);
});

testFunction(filtersValidator, "Invalid field: do nothing", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown; bar: unknown }>(
			{
				foo: { $eq: false },
				bar: { $eq: true },
			},
			[ValueOperator.EQUALS],
			["foo"],
			FilterParserAction.DO_NOTHING,
		),
		{
			foo: { $eq: false },
			bar: { $eq: true },
		},
	);
});
testFunction(filtersValidator, "undefined input", (t) => {
	t.is(
		filtersValidator<{ foo: unknown; bar: unknown }>(
			undefined,
			[ValueOperator.EQUALS],
			["foo"],
			FilterParserAction.DO_NOTHING,
		),
		undefined,
	);
});

testFunction(filtersValidator, "Empty logical operator 1", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{ $or: undefined },
			[ValueOperator.EQUALS, LogicalOperator.OR],
			["foo"],
			FilterParserAction.THROW,
		),
		{
			$or: undefined,
		},
	);
});
testFunction(filtersValidator, "Empty logical operator 2", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{ $or: [] },
			[ValueOperator.EQUALS, LogicalOperator.OR],
			["foo"],
			FilterParserAction.THROW,
		),
		{
			$or: [],
		},
	);
});
testFunction(filtersValidator, "Empty logical operator 3", (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown }>(
			{ $or: [{}] },
			[ValueOperator.EQUALS, LogicalOperator.OR],
			["foo"],
			FilterParserAction.THROW,
		),
		{
			$or: [{}],
		},
	);
});

class SimpleClass {
	@ApiProperty()
	foo!: string;
	@ApiProperty()
	bar!: number;
}
class NestedClass {
	@ApiProperty()
	foobar!: SimpleClass;
	@ApiProperty()
	baz!: boolean;
}
class NotAnnotatedClass {
	foobar!: SimpleClass;
	baz!: boolean;
}
testFunction(getDotKeys, "undefined", (t) => {
	t.deepEqual(getDotKeys(undefined), []);
});
testFunction(getDotKeys, "Simple", (t) => {
	t.deepEqual(getDotKeys(SimpleClass), ["foo", "bar"]);
});
testFunction(getDotKeys, "Nested", (t) => {
	t.deepEqual(getDotKeys(NestedClass), ["foobar.foo", "foobar.bar", "baz"]);
});
testFunction(getDotKeys, "Unannotated class", (t) => {
	t.deepEqual(getDotKeys(NotAnnotatedClass), []);
});
