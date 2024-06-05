import type { PipeTransform } from "@nestjs/common";
import type { Object as JsonObject, Primitive as JsonPrimitive, Value as JsonValue } from "json-typescript";
import type { FilterQuery, HydratedDocument, SortOrder } from "mongoose";
import {
	type FlattenObject,
	ListOperator,
	LogicalOperator,
	type SearchField,
	type SearchFieldComparison,
	ValueOperator,
} from "./api.js";
import type { EntityConverter, PartialWithId } from "./index.js";
import { regexEscaper } from "./utils.js";

export function toMongoOperator<
	Operator = ListOperator | LogicalOperator | ValueOperator,
	Value = JsonPrimitive | Array<JsonPrimitive> | SearchFieldComparison<object>,
>(operator: Operator, value: Value): [Operator, Value] {
	switch (operator) {
		case ValueOperator.START_WITH:
			return [ValueOperator.REGEX as Operator, `^${regexEscaper(String(value))}` as Value];
		case ValueOperator.END_WITH:
			return [ValueOperator.REGEX as Operator, `${regexEscaper(String(value))}$` as Value];
		case ValueOperator.IS_NULL:
			return [ValueOperator.EQUALS as Operator, null as Value];
		case ValueOperator.IS_DEFINED:
			return ["$ne" as Operator, null as Value];
		case ValueOperator.NOT_EQUALS:
			return ["$ne" as Operator, value];
	}
	return [operator, value];
}

/**
 * Transform a received filter into a MongoDB query filter
 * @param inputQuery
 */
export function toMongoFilterQuery<Resource extends object = object>(
	inputQuery?: SearchField<Resource>,
): FilterQuery<object> {
	if (inputQuery === undefined) {
		return {};
	}
	function _visitField(input: object): object {
		let fields = Object.entries(input).map(([operator, value]) => {
			return toMongoOperator(operator, value);
		});

		const regexs = fields.filter(([operator]) => operator === ValueOperator.REGEX);
		if (regexs.length > 1) {
			fields = [
				...fields.filter(([operator]) => operator !== ValueOperator.REGEX),
				["$all", regexs.map(([, value]) => new RegExp(value))],
			];
		}
		const nes = fields.filter(([operator]) => operator === "$ne");
		if (nes.length > 1) {
			fields = [
				...fields.filter(([operator]) => operator !== "$ne"),
				[ListOperator.NOT_IN, nes.map(([, value]) => value)],
			];
		}
		const nins = fields.filter(([operator]) => operator === ListOperator.NOT_IN);
		if (nins.length > 1) {
			fields = [
				...fields.filter(([operator]) => operator !== ListOperator.NOT_IN),
				[ListOperator.NOT_IN, nins.flatMap(([, value]) => value)],
			];
		}
		return Object.fromEntries(fields);
	}

	function _visitQuery(input: object): object {
		return Object.fromEntries(
			Object.entries(input).map(([field, value]) => {
				return [field, _visitField(value)];
			}),
		);
	}

	return Object.fromEntries(
		Object.entries(inputQuery).map(([key, value]) => {
			if (Object.values(LogicalOperator).includes(key as LogicalOperator)) {
				return [key, (value as Array<object>).map((item) => _visitQuery(item))];
			}
			return [key, _visitField(value)];
		}),
	);
}

/**
 * Transform a list of field name and negate field name into a MongoDB sort parameter
 * @param input
 */
export function toMongoSort(input: Array<string>): Record<string, SortOrder> {
	return Object.fromEntries(
		input.map((item) => {
			const direction = item.startsWith("-") ? -1 : 1;
			const name = direction === -1 ? item.substring(1) : item;
			return [name, direction];
		}),
	);
}

/**
 * A preconfigured converter that output a MongoDB Entity as is come from the database
 */
export class OneToOneConverter<Entity extends JsonObject = JsonObject>
	implements EntityConverter<Entity, Entity, Entity, Entity>
{
	fromCreator(input: Partial<Entity>): Partial<Entity> {
		return input;
	}

	fromUpdater(id: string, input: Partial<Entity>): PartialWithId<Entity> {
		return { ...input, _id: id } as unknown as PartialWithId<Entity>;
	}

	toDto(input: Partial<Entity> | HydratedDocument<Entity>): Partial<Entity> {
		return input;
	}

	fromSearchable(input?: SearchField<Entity> | undefined): FilterQuery<Entity> {
		return input != null ? toMongoFilterQuery(input) : {};
	}

	fromDtoFields(
		fields?: Array<keyof FlattenObject<Entity>> | undefined,
	): Array<keyof FlattenObject<Entity>> | undefined {
		return fields;
	}

	fromDtoSort(sort?: Array<string> | undefined): Record<string, SortOrder> | undefined {
		if (sort === undefined) return undefined;
		return toMongoSort(sort);
	}
}

/* c8 ignore next 10 */
// @ts-ignore
export abstract class BaseDto<Data extends JsonObject = JsonObject> implements JsonObject, Data {
	[any: string]: JsonValue;
}

export class CommaListPipe implements PipeTransform {
	transform(value?: string) {
		if (typeof value === "string") {
			return value
				.trim()
				.split(/,\s*/)
				.filter((item) => item.length > 0);
		}
		return undefined;
	}
}

export class RelativeUrl {
	private constructor(private url: URL) {}
	static from(relative: string | RelativeUrl): RelativeUrl {
		if (relative instanceof RelativeUrl) {
			return RelativeUrl.from(relative.toString());
		}
		return new RelativeUrl(new URL(relative, "http://example.com"));
	}
	setParam(name: string, value: string): this {
		this.url.searchParams.set(name, value);
		return this;
	}
	removeParam(name: string): this {
		this.url.searchParams.delete(name);
		return this;
	}
	onlyKeepParams(names: Array<string>): this {
		for (const key of this.url.searchParams.keys()) {
			if (!names.includes(key)) this.url.searchParams.delete(key);
		}
		return this;
	}
	toString(): string {
		this.url.searchParams.sort();
		return this.url.toString().substring("http://example.com".length);
	}
}
