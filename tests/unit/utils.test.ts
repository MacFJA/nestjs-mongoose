import { addExcludeArray, bound, filterArray, flatObjectKeys, objectMap, regexEscaper, wrap } from "../../src/utils.js";
import { testFunction, testFunctionTestCase } from "../_helpers.js";

for (const [input, expected] of [
	[".+", "\\.\\+"],
	["Count balance: 50$", "Count balance: 50\\$"],
	["The Quick Brown Fox", "The Quick Brown Fox"],
	["Buy it. use it. break it. fix it.", "Buy it\\. use it\\. break it\\. fix it\\."],
	["(*.*)", "\\(\\*\\.\\*\\)"],
	["｡^･ｪ･^｡", "｡\\^･ｪ･\\^｡"],
	["😊 *_* +_+ ... 👍", "😊 \\*_\\* \\+_\\+ \\.\\.\\. 👍"],
	["\\d \\D (?:)", "\\\\d \\\\D \\(\\?:\\)"],
]) {
	// testFunction(regexEscaper, input, (t) => t.is(regexEscaper(input), expected));
	testFunction(regexEscaper, testFunctionTestCase({ input }, expected), (t) => t.is(regexEscaper(input), expected));
}

testFunction(objectMap, "Map key only", (t) => {
	t.deepEqual(
		objectMap({ foo: "bar" }, (k) => `${k}bar`),
		{ foobar: "bar" },
	);
});
testFunction(objectMap, "Map value only", (t) => {
	t.deepEqual(
		objectMap({ foo: "bar" }, undefined, (v) => `${v}bar`),
		{ foo: "barbar" },
	);
});
testFunction(objectMap, "Map value only (use key)", (t) => {
	t.deepEqual(
		objectMap({ foo: "bar" }, undefined, (v, k) => `${k}bar`),
		{ foo: "foobar" },
	);
});
testFunction(objectMap, "Map all", (t) => {
	t.deepEqual(
		objectMap(
			{ foo: "bar" },
			(k) => k.split("").reverse().join(""),
			(v, nk, ok) => `${nk}:${v}:${ok}`,
		),
		{ oof: "oof:bar:foo" },
	);
});

testFunction(wrap, "before", (t) => {
	t.plan(1);
	const original = (input: string): void => {
		t.is(input, "changed to before");
	};
	const wrapped = wrap(original, (args) => ["changed to before"] as Parameters<typeof original>);
	wrapped("hello");
});
testFunction(wrap, "after", (t) => {
	const original = (input: string): string => {
		return input;
	};
	const wrapped = wrap(original, undefined, (out) => "changed to after");

	t.is(original("hello"), "hello");
	t.is(wrapped("hello"), "changed to after");
	t.is(original("hello"), "hello");
});

for (const [input, expected] of [
	[[1, 2, 3, 2], 2],
	[[1, -2, 3, 2], 1],
	[[1, 4, 3, 2], 3],
	[[1, undefined, 3, 2], 2],
	[[1, 2, undefined, 2], 2],
	[[1, 20, undefined, 2], 20],
	[[1, undefined, undefined, 2], 2],
	[[undefined, undefined, undefined, 2], 2],
	[[10, undefined, undefined, 2], 10],
] as Array<[Parameters<typeof bound>, number]>) {
	const [min, value, max, fallback] = input;
	testFunction(bound, testFunctionTestCase({ min, value, max, fallback }, expected), (t) =>
		t.is(bound(min, value, max, fallback), expected),
	);
}

testFunction(flatObjectKeys, "Flat source", (t) => {
	t.deepEqual(flatObjectKeys({ foo: 1, bar: 1 }), ["foo", "bar"]);
});
testFunction(flatObjectKeys, "Nested object", (t) => {
	t.deepEqual(flatObjectKeys({ foo: { bar: 1 } }), ["foo.bar"]);
});
testFunction(flatObjectKeys, "Nested object, with parent", (t) => {
	t.deepEqual(flatObjectKeys({ foo: { bar: 1 } }, true), ["foo", "foo.bar"]);
});

testFunction(addExcludeArray, "3 empty", (t) => {
	t.deepEqual(addExcludeArray([], [], []), []);
});
testFunction(addExcludeArray, "no add, no exclude", (t) => {
	t.deepEqual(addExcludeArray(["foo", "bar"], [], []), ["foo", "bar"]);
});
testFunction(addExcludeArray, "no exclude", (t) => {
	t.deepEqual(addExcludeArray(["foo", "bar"], ["hello", "world"], []), ["foo", "bar", "hello", "world"]);
});
testFunction(addExcludeArray, "duplicate, no exclude", (t) => {
	t.deepEqual(addExcludeArray(["foo", "bar"], ["foo"], []), ["foo", "bar", "foo"]);
});
testFunction(addExcludeArray, "exclude unknown", (t) => {
	t.deepEqual(addExcludeArray(["foo", "bar"], ["hello"], ["world"]), ["foo", "bar", "hello"]);
});
testFunction(addExcludeArray, "exclude from base", (t) => {
	t.deepEqual(addExcludeArray(["foo", "bar"], ["hello"], ["foo"]), ["bar", "hello"]);
});
testFunction(addExcludeArray, "exclude from add", (t) => {
	t.deepEqual(addExcludeArray(["foo", "bar"], ["hello"], ["hello"]), ["foo", "bar"]);
});
testFunction(addExcludeArray, "exclude from both", (t) => {
	t.deepEqual(addExcludeArray(["foo", "bar"], ["hello"], ["hello", "bar"]), ["foo"]);
});

testFunction(filterArray, "2 empty", (t) => {
	t.deepEqual(filterArray([], []), []);
});
testFunction(filterArray, "allowed empty", (t) => {
	t.deepEqual(filterArray(["foo", "bar"], []), []);
});
testFunction(filterArray, "allowed unmatched", (t) => {
	t.deepEqual(filterArray([], ["foo", "bar"]), []);
});
testFunction(filterArray, "partial matched", (t) => {
	t.deepEqual(filterArray(["foo", "bar"], ["foo"]), ["foo"]);
});
testFunction(filterArray, "all matched", (t) => {
	t.deepEqual(filterArray(["foo", "bar"], ["foo", "bar"]), ["foo", "bar"]);
});
