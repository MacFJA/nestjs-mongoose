import test from "ava";
import { bound, objectMap, regexEscaper, wrap } from "../../src/utils.js";
import { inputTitle, title } from "../_helpers.js";

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
	test(inputTitle(regexEscaper, "Escaping", input), (t) => t.is(regexEscaper(input), expected));
}

test(title(objectMap, "Map key only"), (t) => {
	t.deepEqual(
		objectMap({ foo: "bar" }, (k) => `${k}bar`),
		{ foobar: "bar" },
	);
});
test(title(objectMap, "Map value only"), (t) => {
	t.deepEqual(
		objectMap({ foo: "bar" }, undefined, (v) => `${v}bar`),
		{ foo: "barbar" },
	);
});
test(title(objectMap, "Map value only (use key)"), (t) => {
	t.deepEqual(
		objectMap({ foo: "bar" }, undefined, (v, k) => `${k}bar`),
		{ foo: "foobar" },
	);
});
test(title(objectMap, "Map all"), (t) => {
	t.deepEqual(
		objectMap(
			{ foo: "bar" },
			(k) => k.split("").reverse().join(""),
			(v, nk, ok) => `${nk}:${v}:${ok}`,
		),
		{ oof: "oof:bar:foo" },
	);
});

test(title(wrap, "before"), (t) => {
	t.plan(1);
	const original = (input: string): void => {
		t.is(input, "changed to before");
	};
	const wrapped = wrap(original, (args) => ["changed to before"] as Parameters<typeof original>);
	wrapped("hello");
});
test(title(wrap, "after"), (t) => {
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
	test(inputTitle(bound, "Min, Value, Max, Default", input.join(", ")), (t) =>
		t.is(bound(min, value, max, fallback), expected),
	);
}
