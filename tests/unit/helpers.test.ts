import {
	CommaListPipe,
	OneToOneConverter,
	RelativeUrl,
	toMongoFilterQuery,
	toMongoOperator,
	toMongoSort,
} from "../../src/helpers.js";
import { flatObjectKeys } from "../../src/utils.js";
import { testClass, testFunction, testFunctionTestCase } from "../_helpers.js";

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
	testFunction(toMongoOperator, testFunctionTestCase({ operator, value: value }, JSON.stringify(expected)), (t) =>
		t.deepEqual(toMongoOperator(operator, value), expected as unknown as [string, string | number | boolean | null]),
	);
}

testFunction(toMongoFilterQuery, "Simple query", (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: string }>({
			foo: { $eq: "bar" },
		}),
		{
			foo: { $eq: "bar" },
		},
	);
});
testFunction(toMongoFilterQuery, "Multiple operator", (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: number }>({
			foo: { $lt: 10, $gt: 2 },
		}),
		{
			foo: { $lt: 10, $gt: 2 },
		},
	);
});
testFunction(toMongoFilterQuery, "$start operator", (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: string }>({
			foo: { $start: "bar" },
		}),
		{
			foo: { $regex: "^bar" },
		},
	);
});
testFunction(toMongoFilterQuery, "$start + $end operators", (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: string }>({
			foo: { $start: "bar", $end: "hello" },
		}),
		{
			foo: { $all: [/^bar/, /hello$/] },
		},
	);
});
testFunction(toMongoFilterQuery, "$def operator", (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: string }>({
			foo: { $def: true },
		}),
		{
			foo: { $ne: null },
		},
	);
});
testFunction(toMongoFilterQuery, "$def + $neq operators", (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: string }>({
			foo: { $def: true, $neq: "bar" },
		}),
		{
			foo: { $nin: [null, "bar"] },
		},
	);
});
testFunction(toMongoFilterQuery, "$def + $neq + $nin operators", (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: string }>({
			foo: { $def: true, $neq: "bar", $nin: ["hello", "world"] },
		}),
		{
			foo: { $nin: ["hello", "world", null, "bar"] },
		},
	);
});
testFunction(toMongoFilterQuery, "$or operator", (t) => {
	t.deepEqual(
		toMongoFilterQuery<{ foo: unknown; bar: unknown }>({
			$or: [{ foo: { $eq: "bar" } }, { bar: { $neq: "foo" } }],
		}),
		{
			$or: [{ foo: { $eq: "bar" } }, { bar: { $ne: "foo" } }],
		},
	);
});

testFunction(toMongoFilterQuery, "empty / undefined query", (t) => {
	t.deepEqual(toMongoFilterQuery({}), {});
	t.deepEqual(toMongoFilterQuery(undefined), {});
});

for (const [input, expected] of [
	["name", { name: 1 }],
	["-name", { name: -1 }],
	["name,-age", { name: 1, age: -1 }],
	["-age,name", { age: -1, name: 1 }],
] as Array<[string, Record<string, -1 | 1>]>) {
	testFunction(toMongoSort, input, (t) => {
		const actual = toMongoSort(input.split(","));
		t.deepEqual(actual, expected);
	});
}

const oneToOne = new OneToOneConverter<{ foo: string; bar: string }>();
testClass(OneToOneConverter, (method) => {
	method(OneToOneConverter.prototype.fromCreator, "", (t) =>
		t.deepEqual(oneToOne.fromCreator({ foo: "bar" }), { foo: "bar" }),
	);
});
testClass(OneToOneConverter, (method) => {
	method(OneToOneConverter.prototype.fromUpdater, "", (t) =>
		t.deepEqual(oneToOne.fromUpdater("123", { foo: "bar" }), {
			foo: "bar",
			_id: "123",
		}),
	);
});
testClass(OneToOneConverter, (method) => {
	method(OneToOneConverter.prototype.toDto, "", (t) => t.deepEqual(oneToOne.toDto({ foo: "bar" }), { foo: "bar" }));
});
testClass(OneToOneConverter, (method) => {
	method(OneToOneConverter.prototype.fromSearchable, "classic", (t) =>
		t.deepEqual(oneToOne.fromSearchable({ foo: { $neq: "bar" } }), {
			foo: { $ne: "bar" },
		}),
	);
});
testClass(OneToOneConverter, (method) => {
	method(OneToOneConverter.prototype.fromSearchable, "undefined", (t) =>
		t.deepEqual(oneToOne.fromSearchable(undefined), {}),
	);
});
testClass(OneToOneConverter, (method) => {
	method(OneToOneConverter.prototype.fromDtoFields, "", (t) =>
		t.deepEqual(oneToOne.fromDtoFields(["foo", "bar"]), ["foo", "bar"]),
	);
});
testClass(OneToOneConverter, (method) => {
	method(OneToOneConverter.prototype.fromDtoSort, "foo,-bar", (t) =>
		t.deepEqual(oneToOne.fromDtoSort(["foo", "-bar"]), { foo: 1, bar: -1 }),
	);
});
testClass(OneToOneConverter, (method) => {
	method(OneToOneConverter.prototype.fromDtoSort, "undefined", (t) => t.is(oneToOne.fromDtoSort(undefined), undefined));
});

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
	testClass(CommaListPipe, (method) => {
		method(CommaListPipe.prototype.transform, testFunctionTestCase({ input }, expected), (t) =>
			t.deepEqual(new CommaListPipe().transform(input), expected),
		);
	});
}
testClass(CommaListPipe, (method) => {
	method(CommaListPipe.prototype.transform, "undefined", (t) =>
		t.deepEqual(new CommaListPipe().transform(undefined), undefined),
	);
});

testFunction(flatObjectKeys, "without parent", (t) => {
	t.deepEqual(flatObjectKeys({ foo: { bar: "hello" }, baz: "world" }), ["foo.bar", "baz"]);
});

testFunction(flatObjectKeys, "with parent", (t) => {
	t.deepEqual(flatObjectKeys({ foo: { bar: "hello" }, baz: "world" }, true), ["foo", "foo.bar", "baz"]);
});

testClass(RelativeUrl, (method) => {
	method(RelativeUrl.prototype.removeParam, "", (t) => {
		const url = RelativeUrl.from("/hello?value=world&foo=bar");
		url.removeParam("foo");
		t.is(url.toString(), "/hello?value=world");
	});
});
testClass(RelativeUrl, (method) => {
	method(RelativeUrl.prototype.onlyKeepParams.name, "", (t) => {
		const url = RelativeUrl.from("/hello?value=world&foo=bar");
		url.onlyKeepParams(["foo"]);
		t.is(url.toString(), "/hello?foo=bar");
	});
});
