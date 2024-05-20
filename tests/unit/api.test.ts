import test from "ava";
import { ListOperator, LogicalOperator, ValueOperator, filtersValidator } from "../../src/api.js";
import { title } from "../_helpers.js";

test(title(filtersValidator, "All valid"), (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown; hello: unknown; baz: unknown }>(
			{
				[LogicalOperator.AND]: [{ foo: { $eq: "bar" } }, { hello: { $neq: "world" } }],
				baz: { $start: "foobar" },
			},
			[LogicalOperator.AND, ValueOperator.EQUALS, ValueOperator.NOT_EQUALS, ValueOperator.START_WITH],
			false,
			true,
		),
		{
			$and: [{ foo: { $eq: "bar" } }, { hello: { $neq: "world" } }],
			baz: { $start: "foobar" },
		},
	);
});

test(title(filtersValidator, "No logical operator: escape"), (t) => {
	t.deepEqual(
		filtersValidator<{ foo: unknown; hello: unknown; baz: unknown }>(
			{
				[LogicalOperator.AND]: [{ foo: { $eq: "bar" } }, { hello: { $neq: "world" } }],
				baz: { $start: "foobar" },
			},
			[ValueOperator.EQUALS, ValueOperator.NOT_EQUALS, ValueOperator.START_WITH],
			false,
			true,
		),
		{
			"\\$and": [{ foo: { $eq: "bar" } }, { hello: { $neq: "world" } }],
			baz: { $start: "foobar" },
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
			false,
			false,
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
			true,
			false,
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
			true,
			false,
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
			true,
			false,
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
			false,
			false,
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
			true,
			false,
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
			false,
			false,
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
			true,
			false,
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
			false,
			false,
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
			true,
			false,
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
			false,
			false,
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
			false,
			false,
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
			false,
			false,
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
			false,
			false,
		),
		{
			foo: { $eq: false },
		},
	);
});
