import { JsonLdFactory } from "../../../src/representation/json-ld.js";
import { testClass, testFunction } from "../../_helpers.js";

testFunction(JsonLdFactory, "", (t) => {
	const output = JsonLdFactory("test");
	t.is(output.contentType, "application/ld+json");
	t.is(output.parseCreateRequest, undefined);
	t.is(output.parseUpdateRequest, undefined);
	t.is(output.getCreateRequestSwaggerExtension, undefined);
	t.is(output.getUpdateRequestSwaggerExtension, undefined);
	t.is(typeof output.renderOne, "function");
	t.is(typeof output.renderPage, "function");
	t.is(typeof output.getOneResponseSwaggerExtension, "function");
	t.is(typeof output.getCollectionResponseSwaggerExtension, "function");
});

testClass("JsonLd", (method) => {
	const jsonld = JsonLdFactory("test");
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
		{ "@id": "12", "@type": "color", name: "blue" },
		{ "@id": "17", "@type": "color", name: "red" },
		{ "@id": "9", "@type": "color", name: "orange" },
		{ "@id": "3", "@type": "color", name: "green" },
		{ "@id": "1497", "@type": "color", name: "yellow" },
		{ "@id": "2", "@type": "color", name: "pink" },
		{ "@id": "8", "@type": "color", name: "teal" },
	];

	method(jsonld.renderOne, "", (t) => {
		t.deepEqual(
			jsonld.renderOne("123", "people", "/people/123", {
				firstName: "John",
				lastName: "Doe",
				age: null,
				city: "unknown",
			}),
			{
				"@context": {
					"@vocab": "test",
				},
				"@id": "123",
				"@type": "people",
				firstName: "John",
				lastName: "Doe",
				age: null,
				city: "unknown",
			},
		);
	});

	method(jsonld.renderPage, "One page", (t) => {
		t.deepEqual(
			jsonld.renderPage(
				"color",
				"/colors?page[size]=10&page[number]=1&fields=name,hex",
				7,
				{ size: 10, current: 1 },
				pageResources,
			),
			{
				"@context": {
					hydra: "http://www.w3.org/ns/hydra/context.jsonld",
					"@vocab": "test",
				},
				"@id": "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10",
				"@type": "hydra:Collection",
				"hydra:totalItems": 7,
				"hydra:member": pageData,
				"hydra:view": {
					"@id": "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10",
					"@type": "hydra:PartialCollectionView",
					"hydra:first": "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10",
					"hydra:last": "/colors?fields=name%2Chex&page%5Bnumber%5D=1&page%5Bsize%5D=10",
				},
			},
		);
	});

	method(jsonld.renderPage, "page 1/3", (t) => {
		t.deepEqual(
			jsonld.renderPage(
				"color",
				"/colors?page[size]=10&page[number]=1",
				27,
				{
					size: 10,
					current: 1,
				},
				pageResources,
			),
			{
				"@context": {
					hydra: "http://www.w3.org/ns/hydra/context.jsonld",
					"@vocab": "test",
				},
				"@id": "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
				"@type": "hydra:Collection",
				"hydra:totalItems": 27,
				"hydra:member": pageData,
				"hydra:view": {
					"@id": "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
					"@type": "hydra:PartialCollectionView",
					"hydra:first": "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
					"hydra:last": "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
					"hydra:next": "/colors?page%5Bnumber%5D=2&page%5Bsize%5D=10",
				},
			},
		);
	});

	method(jsonld.renderPage, "page 2/3", (t) => {
		t.deepEqual(
			jsonld.renderPage(
				"color",
				"/colors?page[size]=10&page[number]=1",
				27,
				{
					size: 10,
					current: 2,
				},
				pageResources,
			),
			{
				"@context": {
					hydra: "http://www.w3.org/ns/hydra/context.jsonld",
					"@vocab": "test",
				},
				"@id": "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
				"@type": "hydra:Collection",
				"hydra:totalItems": 27,
				"hydra:member": pageData,
				"hydra:view": {
					"@id": "/colors?page%5Bnumber%5D=2&page%5Bsize%5D=10",
					"@type": "hydra:PartialCollectionView",
					"hydra:first": "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
					"hydra:last": "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
					"hydra:next": "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
					"hydra:previous": "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
				},
			},
		);
	});

	method(jsonld.renderPage, "page 3/3", (t) => {
		t.deepEqual(
			jsonld.renderPage(
				"color",
				"/colors?page[size]=10&page[number]=1",
				27,
				{
					size: 10,
					current: 3,
				},
				pageResources,
			),
			{
				"@context": {
					hydra: "http://www.w3.org/ns/hydra/context.jsonld",
					"@vocab": "test",
				},
				"@id": "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
				"@type": "hydra:Collection",
				"hydra:totalItems": 27,
				"hydra:member": pageData,
				"hydra:view": {
					"@id": "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
					"@type": "hydra:PartialCollectionView",
					"hydra:first": "/colors?page%5Bnumber%5D=1&page%5Bsize%5D=10",
					"hydra:last": "/colors?page%5Bnumber%5D=3&page%5Bsize%5D=10",
					"hydra:previous": "/colors?page%5Bnumber%5D=2&page%5Bsize%5D=10",
				},
			},
		);
	});
});
