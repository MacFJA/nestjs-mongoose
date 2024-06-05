import test from "ava";

import { ProblemDetailException } from "@sjfrhafe/nest-problem-details";
import type { JsonObject } from "../../../src/index.js";
import JsonApi from "../../../src/representation/json-api.js";
import { genericTitle, inputTitle, property, title } from "../../_helpers.js";

test(genericTitle(property("JsonApi", JsonApi.renderOne)), (t) => {
	t.deepEqual(
		JsonApi.renderOne("123", "people", "/people/123", {
			firstName: "John",
			lastName: "Doe",
			age: null,
			city: "unknown",
		}),
		{
			data: {
				id: "123",
				type: "people",
				attributes: {
					firstName: "John",
					lastName: "Doe",
					age: null,
					city: "unknown",
				},
			},
			links: {
				self: "/people/123",
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
	{ id: "12", type: "color", attributes: { name: "blue" } },
	{ id: "17", type: "color", attributes: { name: "red" } },
	{ id: "9", type: "color", attributes: { name: "orange" } },
	{ id: "3", type: "color", attributes: { name: "green" } },
	{ id: "1497", type: "color", attributes: { name: "yellow" } },
	{ id: "2", type: "color", attributes: { name: "pink" } },
	{ id: "8", type: "color", attributes: { name: "teal" } },
];

test(title(property("JsonApi", JsonApi.renderPage), "One page"), (t) => {
	t.deepEqual(
		JsonApi.renderPage(
			"color",
			"/colors?page[size]=10&page[number]=1&fields=name,hex",
			7,
			{ size: 10, current: 1 },
			pageResources,
		),
		{
			data: pageData,
			links: {
				self: "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10",
				first: "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10",
				last: "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10",
			},
			meta: {
				totalCount: 7,
				page: {
					size: 10,
					count: 1,
					current: 1,
				},
			},
		},
	);
});

test(title(property("JsonApi", JsonApi.renderPage), "page 1/3"), (t) => {
	t.deepEqual(
		JsonApi.renderPage("color", "/colors?page[size]=10&page[number]=1", 27, { size: 10, current: 1 }, pageResources),
		{
			data: pageData,
			links: {
				self: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
				first: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
				last: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
				next: "/colors?page%5Bnumber%5D=2&page%5Bsize%5D=10",
			},
			meta: {
				totalCount: 27,
				page: {
					size: 10,
					count: 3,
					current: 1,
				},
			},
		},
	);
});

test(title(property("JsonApi", JsonApi.renderPage), "page 2/3"), (t) => {
	t.deepEqual(
		JsonApi.renderPage("color", "/colors?page[size]=10&page[number]=1", 27, { size: 10, current: 2 }, pageResources),
		{
			data: pageData,
			links: {
				self: "/colors?page%5Bnumber%5D=2&page%5Bsize%5D=10",
				first: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
				last: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
				next: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
				prev: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
			},
			meta: {
				totalCount: 27,
				page: {
					size: 10,
					count: 3,
					current: 2,
				},
			},
		},
	);
});

test(title(property("JsonApi", JsonApi.renderPage), "page 3/3"), (t) => {
	t.deepEqual(
		JsonApi.renderPage("color", "/colors?page[size]=10&page[number]=1", 27, { size: 10, current: 3 }, pageResources),
		{
			data: pageData,
			links: {
				self: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
				first: "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
				last: "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
				prev: "/colors?page%5Bnumber%5D=2&page%5Bsize%5D=10",
			},
			meta: {
				totalCount: 27,
				page: {
					size: 10,
					count: 3,
					current: 3,
				},
			},
		},
	);
});

test(title(property("JsonApi", JsonApi.parseCreateRequest), "valid"), (t) => {
	t.deepEqual(
		JsonApi.parseCreateRequest(
			{
				data: {
					type: "people",
					attributes: {
						firstName: "John",
						lastName: "Doe",
						age: null,
						city: "unknown",
					},
				},
			},
			"people",
		),
		{
			firstName: "John",
			lastName: "Doe",
			age: null,
			city: "unknown",
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseCreateRequest), "Invalid type", "root"), (t) => {
	t.throws(() => JsonApi.parseCreateRequest("foobar" as unknown as JsonObject, "people"), {
		instanceOf: ProblemDetailException,
	});
});
test(inputTitle(property("JsonApi", JsonApi.parseCreateRequest), "Invalid type", "data"), (t) => {
	t.throws(
		() =>
			JsonApi.parseCreateRequest(
				{
					data: "foobar",
				},
				"people",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseCreateRequest), "Invalid type", "data.type"), (t) => {
	t.throws(
		() =>
			JsonApi.parseCreateRequest(
				{
					data: {
						type: 20,
						attributes: {
							firstName: "John",
							lastName: "Doe",
							age: null,
							city: "unknown",
						},
					},
				},
				"people",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseCreateRequest), "Invalid type", "data.attributes"), (t) => {
	t.throws(
		() =>
			JsonApi.parseCreateRequest(
				{
					data: {
						type: "people",
						attributes: "foobar",
					},
				},
				"people",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseCreateRequest), "Invalid content", "type"), (t) => {
	t.throws(
		() =>
			JsonApi.parseCreateRequest(
				{
					data: {
						type: "person",
						attributes: {
							firstName: "John",
							lastName: "Doe",
							age: null,
							city: "unknown",
						},
					},
				},
				"people",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseCreateRequest), "Missing node", "data"), (t) => {
	t.throws(
		() =>
			JsonApi.parseCreateRequest(
				{
					type: "person",
					attributes: {
						firstName: "John",
						lastName: "Doe",
						age: null,
						city: "unknown",
					},
				},
				"people",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseCreateRequest), "Missing node", "data.type"), (t) => {
	t.throws(
		() =>
			JsonApi.parseCreateRequest(
				{
					data: {
						attributes: {
							firstName: "John",
							lastName: "Doe",
							age: null,
							city: "unknown",
						},
					},
				},
				"people",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseCreateRequest), "Missing node", "data.attributes"), (t) => {
	t.throws(
		() =>
			JsonApi.parseCreateRequest(
				{
					data: {
						type: "person",
						firstName: "John",
						lastName: "Doe",
						age: null,
						city: "unknown",
					},
				},
				"people",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});

test(title(property("JsonApi", JsonApi.parseUpdateRequest), "valid"), (t) => {
	t.deepEqual(
		JsonApi.parseUpdateRequest(
			{
				data: {
					id: "123",
					type: "people",
					attributes: {
						firstName: "John",
						lastName: "Doe",
						age: null,
						city: "unknown",
					},
				},
			},
			"people",
			"123",
		),
		{
			firstName: "John",
			lastName: "Doe",
			age: null,
			city: "unknown",
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Invalid content", "type"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					data: {
						id: "123",
						type: "person",
						attributes: {
							firstName: "John",
							lastName: "Doe",
							age: null,
							city: "unknown",
						},
					},
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Invalid content", "id"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					data: {
						id: "1234",
						type: "people",
						attributes: {
							firstName: "John",
							lastName: "Doe",
							age: null,
							city: "unknown",
						},
					},
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Missing node", "data"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					id: "123",
					type: "person",
					attributes: {
						firstName: "John",
						lastName: "Doe",
						age: null,
						city: "unknown",
					},
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Missing node", "data.type"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					id: "123",
					data: {
						attributes: {
							firstName: "John",
							lastName: "Doe",
							age: null,
							city: "unknown",
						},
					},
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Missing node", "data.attributes"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					id: "123",
					data: {
						type: "person",
						firstName: "John",
						lastName: "Doe",
						age: null,
						city: "unknown",
					},
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Missing node", "data.id"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					type: "people",
					data: {
						attributes: {
							firstName: "John",
							lastName: "Doe",
							age: null,
							city: "unknown",
						},
					},
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Invalid type", "root"), (t) => {
	t.throws(() => JsonApi.parseUpdateRequest("foobar" as unknown as JsonObject, "people", "123"), {
		instanceOf: ProblemDetailException,
	});
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Invalid type", "data"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					data: "foobar",
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Invalid type", "data.type"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					data: {
						id: "123",
						type: 20,
						attributes: {
							firstName: "John",
							lastName: "Doe",
							age: null,
							city: "unknown",
						},
					},
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Invalid type", "data.attributes"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					data: {
						id: "123",
						type: "people",
						attributes: "foobar",
					},
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
test(inputTitle(property("JsonApi", JsonApi.parseUpdateRequest), "Invalid type", "data.id"), (t) => {
	t.throws(
		() =>
			JsonApi.parseUpdateRequest(
				{
					data: {
						id: 123,
						type: "people",
						attributes: {
							firstName: "John",
							lastName: "Doe",
							age: null,
							city: "unknown",
						},
					},
				},
				"people",
				"123",
			),
		{
			instanceOf: ProblemDetailException,
		},
	);
});
