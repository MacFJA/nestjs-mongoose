import test from "ava";
import { FilterParserAction, ListOperator, LogicalOperator, ValueOperator, filtersValidator } from "../../src/api.js";
import { title } from "../_helpers.js";

test(title(filtersValidator, "All valid"), (t) => {
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

test(title(filtersValidator, "Logical operator + invalid value operator: remove"), (t) => {
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

test(title(filtersValidator, "No logical operator: remove"), (t) => {
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

test(title(filtersValidator, "No logical operator: throw"), (t) => {
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
test(title(filtersValidator, "List operator: primitive to array"), (t) => {
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
test(title(filtersValidator, "List operator: valid"), (t) => {
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
test(title(filtersValidator, "List operator: invalid, removed"), (t) => {
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
test(title(filtersValidator, "Value operator: invalid, throw"), (t) => {
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
test(title(filtersValidator, "Value operator: invalid, removed"), (t) => {
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
test(title(filtersValidator, "List operator: invalid, throw"), (t) => {
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
test(title(filtersValidator, "Invalid operator: removed"), (t) => {
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
test(title(filtersValidator, "Invalid operator: throw"), (t) => {
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
test(title(filtersValidator, "Primitive: null"), (t) => {
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
test(title(filtersValidator, "Primitive: string"), (t) => {
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
test(title(filtersValidator, "Primitive: number"), (t) => {
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
test(title(filtersValidator, "Primitive: boolean"), (t) => {
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
test(title(filtersValidator, "Invalid field: removed"), (t) => {
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
test(title(filtersValidator, "Invalid field: throw"), (t) => {
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

test(title(filtersValidator, "Invalid field: do nothing"), (t) => {
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
test(title(filtersValidator, "undefined input"), (t) => {
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

test(title(filtersValidator, "Empty logical operator 1"), (t) => {
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
test(title(filtersValidator, "Empty logical operator 2"), (t) => {
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
test(title(filtersValidator, "Empty logical operator 3"), (t) => {
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
