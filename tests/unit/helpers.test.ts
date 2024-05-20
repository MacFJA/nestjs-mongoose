import test from "ava";
import {
	CommaListPipe,
	OneToOneConverter,
	toMongoFilterQuery,
	toMongoOperator,
	toMongoSort,
} from "../../src/helpers.js";
import { inputTitle, title } from "../_helpers.js";

for (const [[operator, value], expected] of [
	[
		["$start", "hello"],
		["$regex", "^hello"],
	],
	[
		["$start", "hello."],
		["$regex", "^hello\\."],
	],

	[
		["$end", "world"],
		["$regex", "world$"],
	],
	[
		["$end", "50$"],
		["$regex", "50\\$$"],
	],

	[
		["$null", ""],
		["$eq", null],
	],
	[
		["$null", 1],
		["$eq", null],
	],
	[
		["$null", true],
		["$eq", null],
	],
	[
		["$null", false],
		["$eq", null],
	],
	[
		["$null", 0],
		["$eq", null],
	],
	[
		["$null", [0, 1]],
		["$eq", null],
	],

	[
		["$def", ""],
		["$ne", null],
	],
	[
		["$def", 1],
		["$ne", null],
	],
	[
		["$def", true],
		["$ne", null],
	],
	[
		["$def", false],
		["$ne", null],
	],
	[
		["$def", 0],
		["$ne", null],
	],
	[
		["$def", [0, 1]],
		["$ne", null],
	],

	[
		["$neq", ""],
		["$ne", ""],
	],
	[
		["$neq", 1],
		["$ne", 1],
	],
	[
		["$neq", true],
		["$ne", true],
	],
	[
		["$neq", false],
		["$ne", false],
	],
	[
		["$neq", 0],
		["$ne", 0],
	],
	[
		["$neq", "foo"],
		["$ne", "foo"],
	],
	[
		["$eq", "foo"],
		["$eq", "foo"],
	],
]) {
	// test(`Unit test: ${toMongoOperator.name} ⟶ Transforming: ${operator}: ${JSON.stringify(value)}`, (t) =>
	test(inputTitle(toMongoOperator, "Transforming", `${operator}: ${JSON.stringify(value)}`), (t) =>
		t.deepEqual(toMongoOperator(operator, value), expected as unknown as [string, string | number | boolean | null]),
	);
}

test(title(toMongoFilterQuery, "Simple query"), (t) => {
	t.deepEqual(
		toMongoFilterQuery({
			foo: { $eq: "bar" },
		}),
		{
			foo: { $eq: "bar" },
		},
	);
});
test(title(toMongoFilterQuery, "Multiple operator"), (t) => {
	t.deepEqual(
		toMongoFilterQuery({
			foo: { $lt: 10, $gt: 2 },
		}),
		{
			foo: { $lt: 10, $gt: 2 },
		},
	);
});
test(title(toMongoFilterQuery, "$start operator"), (t) => {
	t.deepEqual(
		toMongoFilterQuery({
			foo: { $start: "bar" },
		}),
		{
			foo: { $regex: "^bar" },
		},
	);
});
test(title(toMongoFilterQuery, "$start + $end operators"), (t) => {
	t.deepEqual(
		toMongoFilterQuery({
			foo: { $start: "bar", $end: "hello" },
		}),
		{
			foo: { $all: [/^bar/, /hello$/] },
		},
	);
});
test(title(toMongoFilterQuery, "$def operator"), (t) => {
	t.deepEqual(
		toMongoFilterQuery({
			foo: { $def: true },
		}),
		{
			foo: { $ne: null },
		},
	);
});
test(title(toMongoFilterQuery, "$def + $neq operators"), (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: unknown }>({
			foo: { $def: true, $neq: "bar" },
		}),
		{
			foo: { $nin: [null, "bar"] },
		},
	);
});
test(title(toMongoFilterQuery, "$def + $neq + $nin operators"), (t) => {
	t.deepEqual(
		toMongoFilterQuery({
			foo: { $def: true, $neq: "bar", $nin: ["hello", "world"] },
		}),
		{
			foo: { $nin: ["hello", "world", null, "bar"] },
		},
	);
});
test(title(toMongoFilterQuery, "$or operator"), (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: unknown; bar: unknown }>({
			$or: [{ foo: { $eq: "bar" } }, { bar: { $neq: "foo" } }],
		}),
		{
			$or: [{ foo: { $eq: "bar" } }, { bar: { $ne: "foo" } }],
		},
	);
});

test(title(toMongoFilterQuery, "empty / undefined query"), (t) => {
	t.deepEqual(toMongoFilterQuery({}), {});
	t.deepEqual(toMongoFilterQuery(undefined), {});
});

for (const [input, expected] of [
	["name", { name: 1 }],
	["-name", { name: -1 }],
	["name,-age", { name: 1, age: -1 }],
	["-age,name", { age: -1, name: 1 }],
] as Array<[string, Record<string, -1 | 1>]>) {
	test(inputTitle(toMongoSort, "Transforming", input), (t) => {
		const actual = toMongoSort(input.split(","));
		t.deepEqual(actual, expected);
	});
}

const oneToOne = new OneToOneConverter();
test(title(OneToOneConverter, "fromCreator"), (t) => t.deepEqual(oneToOne.fromCreator({ foo: "bar" }), { foo: "bar" }));
test(title(OneToOneConverter, "fromUpdater"), (t) =>
	t.deepEqual(oneToOne.fromUpdater("123", { foo: "bar" }), {
		foo: "bar",
		_id: "123",
	}),
);
test(title(OneToOneConverter, "toDto"), (t) => t.deepEqual(oneToOne.toDto({ foo: "bar" }), { foo: "bar" }));
test(title(OneToOneConverter, "fromSearchable: classic"), (t) =>
	t.deepEqual(oneToOne.fromSearchable({ foo: { $neq: "bar" } }), {
		foo: { $ne: "bar" },
	}),
);
test(title(OneToOneConverter, "fromSearchable: undefined"), (t) => t.deepEqual(oneToOne.fromSearchable(undefined), {}));
test(title(OneToOneConverter, "fromDtoFields"), (t) =>
	t.deepEqual(oneToOne.fromDtoFields(["foo", "bar"]), ["foo", "bar"]),
);
test(inputTitle(OneToOneConverter, "fromDtoSort", "foo,-bar"), (t) =>
	t.deepEqual(oneToOne.fromDtoSort(["foo", "-bar"]), { foo: 1, bar: -1 }),
);
test(inputTitle(OneToOneConverter, "fromDtoSort", "undefined"), (t) =>
	t.is(oneToOne.fromDtoSort(undefined), undefined),
);

for (const [input, expected] of [
	["foo,bar", ["foo", "bar"]],
	["foo, bar", ["foo", "bar"]],
	["foo,, bar", ["foo", "bar"]],
	["foo, ,bar", ["foo", "bar"]],
	["foo,bar,", ["foo", "bar"]],
	[",foo,bar", ["foo", "bar"]],
	[",foo,bar,", ["foo", "bar"]],
	[",", []],
	[",,", []],
	["", []],
	[1, undefined],
] as Array<[string, Array<string> | undefined]>) {
	test(inputTitle(CommaListPipe, "Transforming", input), (t) =>
		t.deepEqual(new CommaListPipe().transform(input), expected),
	);
}
test(title(CommaListPipe, "Transforming undefined"), (t) =>
	t.deepEqual(new CommaListPipe().transform(undefined), undefined),
);
