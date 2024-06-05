import { ApiProperty } from "@nestjs/swagger";
import { ProblemDetailException } from "@sjfrhafe/nest-problem-details";
import test from "ava";
import sinon, { type SinonStub } from "sinon";
import { BaseDto, type Representation } from "../../../src/index.js";
import {
	getContentType,
	getParser,
	getRenderer,
	getSwaggerExtension,
	validateContentType,
} from "../../../src/representation/index.js";
import { genericTitle, title } from "../../_helpers.js";

class AttributeClass extends BaseDto {
	@ApiProperty()
	foo!: string;
	@ApiProperty()
	bar!: number;
}

function createMock<Without extends keyof Required<Representation> = never>(
	without: Array<Without> = [],
): {
	[k in keyof Required<Representation>]: k extends Without
		? undefined
		: Representation[k] extends string
			? string
			: SinonStub;
} {
	return {
		contentType: without.includes("contentType" as Without) ? undefined : "test",
		getOneResponseSwaggerExtension: without.includes("getOneResponseSwaggerExtension" as Without)
			? undefined
			: sinon.stub(),
		getCollectionResponseSwaggerExtension: without.includes("getCollectionResponseSwaggerExtension" as Without)
			? undefined
			: sinon.stub(),
		getCreateRequestSwaggerExtension: without.includes("getCreateRequestSwaggerExtension" as Without)
			? undefined
			: sinon.stub(),
		getUpdateRequestSwaggerExtension: without.includes("getUpdateRequestSwaggerExtension" as Without)
			? undefined
			: sinon.stub(),
		parseCreateRequest: without.includes("parseCreateRequest" as Without) ? undefined : sinon.stub(),
		parseUpdateRequest: without.includes("parseUpdateRequest" as Without) ? undefined : sinon.stub(),
		renderOne: without.includes("renderOne" as Without) ? undefined : sinon.stub(),
		renderPage: without.includes("renderPage" as Without) ? undefined : sinon.stub(),
	} as {
		[k in keyof Required<Representation>]: k extends Without
			? undefined
			: Representation[k] extends string
				? string
				: SinonStub;
	};
}

test(genericTitle(getSwaggerExtension), (t) => {
	const mocked = createMock([]);
	mocked.getOneResponseSwaggerExtension.returns({
		extraModels: [AttributeClass],
		schema: {},
	});
	const extension = getSwaggerExtension([mocked], "getOneResponseSwaggerExtension", AttributeClass, "foobar");
	t.is(mocked.getOneResponseSwaggerExtension.callCount, 1);
	t.is(mocked.getCollectionResponseSwaggerExtension.callCount, 0);
	t.is(mocked.getCreateRequestSwaggerExtension.callCount, 0);
	t.is(mocked.getUpdateRequestSwaggerExtension.callCount, 0);
	t.is(mocked.parseCreateRequest.callCount, 0);
	t.is(mocked.parseUpdateRequest.callCount, 0);
	t.is(mocked.renderOne.callCount, 0);
	t.is(mocked.renderPage.callCount, 0);
	t.true(extension.models.includes(AttributeClass));
	t.deepEqual(extension.responses, {
		test: {
			schema: {},
		},
	});
});

test(title(getRenderer, "found"), (t) => {
	const fakeRepresentation = createMock();
	const renderer = getRenderer([fakeRepresentation], "test", "renderOne");
	t.is(
		fakeRepresentation.getOneResponseSwaggerExtension.callCount,
		0,
		"getOneResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
	t.is(renderer, fakeRepresentation.renderOne);
});
test(title(getRenderer, "not found"), (t) => {
	const fakeRepresentation = createMock(["renderOne"]);
	t.throws(() => getRenderer([fakeRepresentation], "test", "renderOne"), { instanceOf: ProblemDetailException });
	t.is(
		fakeRepresentation.getOneResponseSwaggerExtension.callCount,
		0,
		"getOneResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
});
test(title(getRenderer, "no representation"), (t) => {
	t.throws(() => getRenderer([], "test", "renderOne"), { instanceOf: ProblemDetailException });
});

test(title(getParser, "found"), (t) => {
	const fakeRepresentation = createMock();
	const parser = getParser([fakeRepresentation], "test", "parseCreateRequest");
	t.is(
		fakeRepresentation.getOneResponseSwaggerExtension.callCount,
		0,
		"getOneResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
	t.is(parser, fakeRepresentation.parseCreateRequest);
});
test(title(getParser, "No parser"), (t) => {
	const fakeRepresentation = createMock(["parseCreateRequest"]);
	t.throws(() => getParser([fakeRepresentation], "test", "parseCreateRequest"), { instanceOf: ProblemDetailException });
	t.is(
		fakeRepresentation.getOneResponseSwaggerExtension.callCount,
		0,
		"getOneResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
});
test(title(getParser, "No content type"), (t) => {
	const fakeRepresentation = createMock();
	t.throws(() => getParser([fakeRepresentation], "test2", "parseCreateRequest"), {
		instanceOf: ProblemDetailException,
	});
	t.is(
		fakeRepresentation.getOneResponseSwaggerExtension.callCount,
		0,
		"getOneResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
});

test(title(getContentType, "found"), (t) => {
	const fakeRepresentation = createMock();
	const types = getContentType([fakeRepresentation], "getOneResponseSwaggerExtension");
	t.is(
		fakeRepresentation.getOneResponseSwaggerExtension.callCount,
		0,
		"getOneResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
	t.deepEqual(types, ["test"]);
});
test(title(getContentType, "no function"), (t) => {
	const fakeRepresentation = createMock(["getOneResponseSwaggerExtension"]);
	const types = getContentType([fakeRepresentation], "getOneResponseSwaggerExtension");
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
	t.deepEqual(types, []);
});

test(title(validateContentType, "default to first if not specified"), (t) => {
	const fakeRepresentation = createMock();
	const type = validateContentType([fakeRepresentation], "getOneResponseSwaggerExtension");
	t.is(
		fakeRepresentation.getOneResponseSwaggerExtension.callCount,
		0,
		"getOneResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
	t.deepEqual(type, "test");
});
test(title(validateContentType, "Match"), (t) => {
	const fakeRepresentation = createMock();
	const type = validateContentType([fakeRepresentation], "getOneResponseSwaggerExtension", "test");
	t.is(
		fakeRepresentation.getOneResponseSwaggerExtension.callCount,
		0,
		"getOneResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
	t.deepEqual(type, "test");
});
test(title(validateContentType, "Fail if not content type exist"), (t) => {
	const fakeRepresentation = createMock(["getOneResponseSwaggerExtension"]);
	t.throws(() => validateContentType([fakeRepresentation], "getOneResponseSwaggerExtension", "test"), {
		instanceOf: ProblemDetailException,
	});
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
});
test(title(validateContentType, "Fail if content type don't match"), (t) => {
	const fakeRepresentation = createMock();
	t.throws(() => validateContentType([fakeRepresentation], "getOneResponseSwaggerExtension", "test2"), {
		instanceOf: ProblemDetailException,
	});
	t.is(
		fakeRepresentation.getOneResponseSwaggerExtension.callCount,
		0,
		"getOneResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCollectionResponseSwaggerExtension.callCount,
		0,
		"getCollectionResponseSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getCreateRequestSwaggerExtension.callCount,
		0,
		"getCreateRequestSwaggerExtension have not been call",
	);
	t.is(
		fakeRepresentation.getUpdateRequestSwaggerExtension.callCount,
		0,
		"getUpdateRequestSwaggerExtension have not been call",
	);
	t.is(fakeRepresentation.parseCreateRequest.callCount, 0, "parseCreateRequest have not been call");
	t.is(fakeRepresentation.parseUpdateRequest.callCount, 0, "parseUpdateRequest have not been call");
	t.is(fakeRepresentation.renderOne.callCount, 0, "renderOne have not been call");
	t.is(fakeRepresentation.renderPage.callCount, 0, "renderPage have not been call");
});
