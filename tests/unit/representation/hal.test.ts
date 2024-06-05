import test from "ava";

import Hal from "../../../src/representation/hal.js";
import { genericTitle, property, title } from "../../_helpers.js";

test(genericTitle(Hal.renderOne), (t) => {
	t.deepEqual(
		Hal.renderOne?.("123", "people", "/people/123", {
			firstName: "John",
			lastName: "Doe",
			age: null,
			city: "unknown",
		}),
		{
			type: "people",
			firstName: "John",
			lastName: "Doe",
			age: null,
			city: "unknown",
			_links: {
				self: { href: "/people/123" },
			},
		},
	);
});

const pageResources = new Map([
	["12", { name: "blue" }],
	["17", { name: "red" }],
	["9", { name: "orange" }],
	["3", { name: "green" }],
	["1497", { name: "yellow" }],
	["2", { name: "pink" }],
	["8", { name: "teal" }],
]);
const pageData = [
	{ name: "blue" },
	{ name: "red" },
	{ name: "orange" },
	{ name: "green" },
	{ name: "yellow" },
	{ name: "pink" },
	{ name: "teal" },
];

test(title(property("Hal", Hal.renderPage), "One page"), (t) => {
	t.deepEqual(
		Hal.renderPage?.(
			"color",
			"/colors?page[size]=10&page[number]=1&fields=name,hex",
			7,
			{ size: 10, current: 1 },
			pageResources,
		),
		{
			_embedded: { color: pageData },
			_links: {
				self: { href: "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10" },
				first: { href: "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10" },
				last: { href: "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10" },
			},
			count: 7,
			total: 7,
			type: "color",
		},
	);
});

test(title(property("Hal", Hal.renderPage), "page 1/3"), (t) => {
	t.deepEqual(
		Hal.renderPage?.("color", "/colors?page[size]=10&page[number]=1", 27, { size: 10, current: 1 }, pageResources),
		{
			_embedded: { color: pageData },
			_links: {
				self: { href: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10" },
				first: { href: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10" },
				last: { href: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10" },
				next: { href: "/colors?page%5Bnumber%5D=2&page%5Bsize%5D=10" },
			},
			count: 7,
			total: 27,
			type: "color",
		},
	);
});

test(title(property("Hal", Hal.renderPage), "page 2/3"), (t) => {
	t.deepEqual(
		Hal.renderPage?.("color", "/colors?page[size]=10&page[number]=1", 27, { size: 10, current: 2 }, pageResources),
		{
			_embedded: { color: pageData },
			_links: {
				self: { href: "/colors?page%5Bnumber%5D=2&page%5Bsize%5D=10" },
				first: { href: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10" },
				last: { href: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10" },
				next: { href: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10" },
				prev: { href: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10" },
			},
			count: 7,
			total: 27,
			type: "color",
		},
	);
});

test(title(property("Hal", Hal.renderPage), "page 3/3"), (t) => {
	t.deepEqual(
		Hal.renderPage?.("color", "/colors?page[size]=10&page[number]=1", 27, { size: 10, current: 3 }, pageResources),
		{
			_embedded: { color: pageData },
			_links: {
				self: { href: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10" },
				first: { href: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10" },
				last: { href: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10" },
				prev: { href: "/colors?page%5Bnumber%5D=2&page%5Bsize%5D=10" },
			},
			count: 7,
			total: 27,
			type: "color",
		},
	);
});

test(genericTitle("Hal.parseCreateRequest"), (t) => {
	t.is(Hal.parseCreateRequest, undefined);
});

test(genericTitle("Hal.parseUpdateRequest"), (t) => {
	t.is(Hal.parseUpdateRequest, undefined);
});
