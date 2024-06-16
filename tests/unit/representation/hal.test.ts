import Hal from "../../../src/representation/hal.js";
import { testClass } from "../../_helpers.js";

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

testClass("Hal", (method) => {
	method(Hal.renderOne, "", (t) => {
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

	method(Hal.renderPage, "One Page", (t) => {
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

	method(Hal.renderPage, "page 1/3", (t) => {
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

	method(Hal.renderPage, "page 2/3", (t) => {
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

	method(Hal.renderPage, "page 3/3", (t) => {
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

	method("parseCreateRequest", "", (t) => {
		t.is(Hal.parseCreateRequest, undefined);
	});

	method("parseUpdateRequest", "", (t) => {
		t.is(Hal.parseUpdateRequest, undefined);
	});
});
