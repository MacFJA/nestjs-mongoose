import type { Type } from "@nestjs/common";
import type { ApiExtraModels } from "@nestjs/swagger";
import type { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface.js";
import { ProblemDetailException } from "@sjfrhafe/nest-problem-details";
import type { Object as JsonObject } from "json-typescript";
import { RelativeUrl } from "../helpers.js";

/**
 * Render one document
 *
 * @param id the MongoDB id of the document
 * @param type the value of `resourceType` (or the value of `modelInjectionName`)
 * @param self the URL pathname of the controller
 * @param resource the DTO version of the MongoDB document
 * @return A JSON compatible representation of the document
 */
export type RenderOne<Resource extends JsonObject> = (
	id: string,
	type: string,
	self: string,
	resource: Partial<Resource>,
) => JsonObject;
/**
 * Render a paginated list of documents
 *
 * @param type the value of `resourceType` (or the value of `modelInjectionName`)
 * @param self the URL pathname of the controller
 * @param pageData the current information about the page (the size of a page, and the current page number)
 * @param resources list of item of the page. The key of the map is the MongoDB id of the document, the value the DTO version
 * @return A JSON compatible representation of the document collection
 */
export type RenderPage<Resource extends JsonObject> = (
	type: string,
	self: string,
	count: number,
	pageData: { size: number; current: number },
	resources: Map<string, Partial<Resource>>,
) => JsonObject;
/**
 * Extract the `Creator` resource from the creation request body
 *
 * @param input the JSON receive by the controller
 * @param type the value of `resourceType` (or the value of `modelInjectionName`)
 */
export type ParseCreate<Creator extends JsonObject> = (input: JsonObject, type: string) => Creator | never;
/**
 * Extract the `Updater` resource from the modification request body
 *
 * @param input the JSON receive by the controller
 * @param type the value of `resourceType` (or the value of `modelInjectionName`)
 * @param id the identifier of the document to update
 */
export type ParseUpdate<Updater extends JsonObject> = (input: JsonObject, type: string, id: string) => Updater | never;

type SwaggerExtensionMaker<Input extends JsonObject = JsonObject> = (
	/**
	 * The class of a DTO
	 */
	attribute: Type<Input>,
	/**
	 * The value of `resourceType` (of the configuration), or the value of `modelInjectionName`
	 */
	resourceType: string,
) => SwaggerSchemaExtension;
export interface OneResponseSwaggerExtension<Dto extends JsonObject> extends SwaggerExtensionMaker<Dto> {}
export interface CollectionResponseSwaggerExtension<Dto extends JsonObject> extends SwaggerExtensionMaker<Dto> {}
export interface CreateRequestSwaggerExtension<Creator extends JsonObject> extends SwaggerExtensionMaker<Creator> {}
export interface UpdateRequestSwaggerExtension<Updater extends JsonObject> extends SwaggerExtensionMaker<Updater> {}

/*
 * Swagger schema
 */
export interface SwaggerSchemaExtension {
	/**
	 * List of class to inject in the OpenApi definition
	 */
	extraModels: Parameters<typeof ApiExtraModels>;
	/**
	 * The linked OpenApi schema
	 */
	schema: SchemaObject;
}

export type Representation<
	// biome-ignore lint/suspicious/noExplicitAny: In many case the exact typing is not useful to resolve
	Dto extends JsonObject = any,
	// biome-ignore lint/suspicious/noExplicitAny: In many case the exact typing is not useful to resolve
	Creator extends JsonObject = any,
	// biome-ignore lint/suspicious/noExplicitAny: In many case the exact typing is not useful to resolve
	Updater extends JsonObject = any,
> = {
	/**
	 * This function is call to render a document
	 */
	readonly renderOne?: RenderOne<Dto>;
	/**
	 * This function is call to render a paginated list of documents
	 */
	readonly renderPage?: RenderPage<Dto>;
	/**
	 * Get OpenApi extra information for representing the response of a document
	 */
	readonly getOneResponseSwaggerExtension?: OneResponseSwaggerExtension<Dto>;
	/**
	 * Get OpenApi extra information for representing the response of a paginated list of document
	 */
	readonly getCollectionResponseSwaggerExtension?: CollectionResponseSwaggerExtension<Dto>;
	/**
	 * Get OpenApi extra information for representing the creation body request of a document
	 */
	readonly getCreateRequestSwaggerExtension?: CreateRequestSwaggerExtension<Creator>;
	/**
	 * Get OpenApi extra information for representing the modification body request of a document
	 */
	readonly getUpdateRequestSwaggerExtension?: UpdateRequestSwaggerExtension<Updater>;
	/**
	 * Transform the body of creation request into the Creator Dto object
	 */
	readonly parseCreateRequest?: ParseCreate<Creator>;
	/**
	 * Transform the body of modification request into the Updater Dto object
	 */
	readonly parseUpdateRequest?: ParseUpdate<Updater>;
	/**
	 * Indicate the output MIME type of your representation, it is also use (with the `Accept` header, or `Content-type` header) to determine which representation to use.
	 */
	readonly contentType: string;
};

export function getSwaggerExtension<Data extends JsonObject, R extends Representation = Representation>(
	representations: Array<R>,
	functionName: keyof R & `${string}SwaggerExtension`,
	attribute: Type<Data>,
	resourceType: string,
): { models: Parameters<typeof ApiExtraModels>; responses: Record<string, { schema: SchemaObject }> } {
	const availableRepresentation = representations.filter(
		(representation) => representation[functionName] !== undefined,
	);
	return availableRepresentation.reduce(
		(carry, representation) => {
			const extra = (representation[functionName] as SwaggerExtensionMaker<Data>)(attribute, resourceType);
			carry.models.push(...extra.extraModels);
			carry.responses[representation.contentType] = { schema: extra.schema };
			return carry;
		},
		{ models: [], responses: {} } as {
			models: Parameters<typeof ApiExtraModels>;
			responses: Record<string, { schema: SchemaObject }>;
		},
	);
}

export function getRenderer<Dto extends JsonObject, R extends Representation<Dto> = Representation<Dto>>(
	representations: Array<R>,
	contentType: string,
	functionName: keyof R & `renderOne`,
): RenderOne<Dto> | never;
export function getRenderer<Dto extends JsonObject, R extends Representation<Dto> = Representation<Dto>>(
	representations: Array<R>,
	contentType: string,
	functionName: keyof R & `renderPage`,
): RenderPage<Dto> | never;
export function getRenderer<Dto extends JsonObject, R extends Representation<Dto> = Representation<Dto>>(
	representations: Array<R>,
	contentType: string,
	functionName: keyof R & `render${string}`,
): RenderOne<Dto> | RenderPage<Dto> | never;
export function getRenderer<Dto extends JsonObject, R extends Representation<Dto> = Representation<Dto>>(
	representations: Array<R>,
	contentType: string,
	functionName: keyof R & `render${string}`,
): RenderOne<Dto> | RenderPage<Dto> | never {
	const renderer = representations.find((representation) => representation.contentType === contentType)?.[
		functionName
	] as RenderOne<Dto> | RenderPage<Dto> | undefined;
	if (renderer === undefined) {
		throw new ProblemDetailException(500, {
			title: "No content renderer found",
			detail: "Unable to find a renderer to display the result",
		});
	}

	return renderer;
}

export function getParser<
	Updater extends JsonObject,
	// biome-ignore lint/suspicious/noExplicitAny: In many case the exact typing is not useful to resolve
	R extends Representation<any, any, Updater> = Representation<any, any, Updater>,
>(
	representations: Array<R>,
	contentType: string,
	functionName: keyof R & `parseUpdateRequest`,
): ParseUpdate<Updater> | never;
export function getParser<
	Creator extends JsonObject,
	// biome-ignore lint/suspicious/noExplicitAny: In many case the exact typing is not useful to resolve
	R extends Representation<any, Creator> = Representation<any, Creator>,
>(
	representations: Array<R>,
	contentType: string,
	functionName: keyof R & `parseCreateRequest`,
): ParseCreate<Creator> | never;
export function getParser<
	Creator extends JsonObject,
	Updater extends JsonObject,
	// biome-ignore lint/suspicious/noExplicitAny: In many case the exact typing is not useful to resolve
	R extends Representation<any, Creator, Updater> = Representation<any, Creator, Updater>,
>(
	representations: Array<R>,
	contentType: string,
	functionName: keyof R & `parse${string}`,
): ParseUpdate<Updater> | ParseCreate<Creator> | never;
export function getParser<
	Creator extends JsonObject,
	Updater extends JsonObject,
	// biome-ignore lint/suspicious/noExplicitAny: In many case the exact typing is not useful to resolve
	R extends Representation<any, Creator, Updater> = Representation<any, Creator, Updater>,
>(
	representations: Array<R>,
	contentType: string,
	functionName: keyof R & `parse${string}`,
): ParseUpdate<Updater> | ParseCreate<Creator> | never {
	const parser = representations.find((representation) => representation.contentType === contentType)?.[functionName] as
		| ParseUpdate<Updater>
		| ParseCreate<Creator>
		| undefined;
	if (parser === undefined) {
		throw new ProblemDetailException(500, {
			title: "No content parser found",
			detail: "Unable to find a parser to read the request",
		});
	}

	return parser;
}

export function getContentType<R extends Representation = Representation>(
	representations: Array<R>,
	functionName: keyof R & `${string}SwaggerExtension`,
): Array<string> {
	return representations
		.filter((representation) => representation[functionName] !== undefined)
		.map((representation) => representation.contentType);
}

export function validateContentType<R extends Representation = Representation>(
	representations: Array<R>,
	functionName: keyof R & `${string}SwaggerExtension`,
	contentType?: unknown,
): string | never {
	const types = getContentType<R>(representations, functionName);
	if (types.length === 0) {
		throw new ProblemDetailException(500, {
			title: "No output",
			detail: "No output format provided",
		});
	}
	const finalContentType = contentType === undefined || typeof contentType !== "string" ? types[0] : contentType;

	if (!types.includes(finalContentType as string)) {
		throw new ProblemDetailException(500, {
			title: "Unknown Accept header",
			detail: `The provided Accept header ("${finalContentType}") is not in the list of possible response`,
		});
	}
	return finalContentType;
}

export function getPaginationLinks(
	count: number,
	pageData: { size: number; current: number },
	self: string,
): {
	totalPage: number;
	first: string;
	last: string;
	next: string | undefined;
	previous: string | undefined;
	self: string;
} {
	const totalPage = Math.ceil(count / pageData.size);
	const url = RelativeUrl.from(self);
	url.setParam("page[size]", String(pageData.size));
	url.setParam("page[number]", String(pageData.current));
	const first = RelativeUrl.from(url);
	first.setParam("page[number]", String(1));
	const last = RelativeUrl.from(url);
	last.setParam("page[number]", String(totalPage));
	const previous = pageData.current > 1 ? RelativeUrl.from(url) : undefined;
	const next = pageData.current < totalPage ? RelativeUrl.from(url) : undefined;
	if (previous != null) {
		previous.setParam("page[number]", String(pageData.current - 1));
	}
	if (next != null) {
		next.setParam("page[number]", String(pageData.current + 1));
	}
	return {
		totalPage,
		first: first.toString(),
		last: last.toString(),
		next: next?.toString(),
		previous: previous?.toString(),
		self: url.toString(),
	};
}
