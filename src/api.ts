import type { Type } from "@nestjs/common";
import { ProblemDetailException } from "@sjfrhafe/nest-problem-details";
import type { Primitive as JsonPrimitive } from "json-typescript";
import { ArrayItem, objectVisitorMap } from "./utils.js";

export enum ValueOperator {
	EQUALS = "$eq",
	NOT_EQUALS = "$neq",
	GREATER_THAN = "$gt",
	GREATER_OR_EQUALS = "$gte",
	LOWER_THAN = "$lt",
	LOWER_OR_EQUALS = "$lte",
	START_WITH = "$start",
	END_WITH = "$end",
	REGEX = "$regex",
	IS_NULL = "$null",
	IS_DEFINED = "$def",
}

/**
 * List operators.
 */
export enum ListOperator {
	/**
	 * Operator for matching several possible value of a field
	 */
	IN = "$in",
	/**
	 * Operator for refusing all field that contains one of the value in the list
	 */
	NOT_IN = "$nin",
}

/**
 * Logical operators
 */
export enum LogicalOperator {
	/**
	 * Operator to make an "or" query
	 */
	OR = "$or",
	/**
	 * Operator to make an "and" query
	 */
	AND = "$and",
}
export const Operators = [
	...Object.values(ValueOperator),
	...Object.values(ListOperator),
	...Object.values(LogicalOperator),
] as const;

export type SearchFieldComparison<T extends object> = {
	[field in keyof T]: Partial<Record<ValueOperator, JsonPrimitive> & Record<ListOperator, Array<JsonPrimitive>>>;
};
export type SearchFieldLogical<T extends object> = {
	[field in LogicalOperator]: Array<Partial<SearchFieldComparison<T>>>;
};

// Types
export type FlattenObject<Source extends object> = {
	[Key in keyof Source]: (
		x: Source[Key] extends object ? PrependKey<Key, FlattenObject<Source[Key]>> : Record<Key, Source[Key]>,
	) => void;
}[keyof Source] extends (x: infer I) => void
	? { [K in keyof I]: I[K] }
	: never;

type PrependKey<Key extends PropertyKey, Source> = {
	[P in Exclude<keyof Source, symbol> as `${Exclude<Key, symbol>}.${P}`]: Source[P];
};
export type DotKeys<Source extends object> = keyof FlattenObject<Source>;

export type SearchField<T extends object> = Partial<
	SearchFieldComparison<FlattenObject<T>> & SearchFieldLogical<FlattenObject<T>>
>;

export enum FilterParserAction {
	THROW = 0,
	REMOVE = 1,
	DO_NOTHING = 2,
}

export function filtersValidator<T extends object>(
	input: SearchField<T> | undefined,
	allowedOperators: typeof Operators,
	allowedFields: Array<string>,
	actionOnInvalid: FilterParserAction,
): SearchField<T> | undefined {
	if (input === undefined) return undefined;
	function onInvalid(key: string, value: unknown, message: string): [string | undefined, unknown] | never {
		switch (actionOnInvalid) {
			case FilterParserAction.THROW:
				throw new ProblemDetailException(400, {
					title: "Invalid search criteria",
					detail: message,
				});
			case FilterParserAction.REMOVE:
				return [undefined, undefined];
			case FilterParserAction.DO_NOTHING:
				return [key, value];
		}
	}
	return objectVisitorMap(
		input,
		(key, value, depth) => {
			// Root + Logical + field
			if (depth.length === 0) {
				// Logical
				if (
					Object.values(LogicalOperator).includes(key as LogicalOperator) &&
					!allowedOperators.includes(key as LogicalOperator)
				) {
					return onInvalid(key, value, `The logical operator "${key}" is not allowed`);
				}

				// Field
				if (!allowedFields.includes(key) && !Object.values(LogicalOperator).includes(key as LogicalOperator)) {
					return onInvalid(key, value, `The field "${key}" is not allowed`);
				}
			}
			/*
			 * Value and List operator
			 */
			// Check if operator is allowed
			if (
				depth.length === 1 &&
				(Object.values(LogicalOperator).includes(key as LogicalOperator) ||
					!allowedOperators.includes(key as (typeof Operators)[number]))
			) {
				return onInvalid(key, value, `The operator "${key}" is not allowed`);
			}
			// Checks on ListOperator
			if (depth.length === 1 && Object.values(ListOperator).includes(key as ListOperator)) {
				// Check if value of a List operator is a primitive, we create an array of it
				if (["string", "number", "boolean"].includes(typeof value) || value === null) {
					return [key, [value]];
				}
				// Check if value of a List operator is not an array, at this point it's an error
				if (!Array.isArray(value)) {
					return onInvalid(
						key,
						value,
						`The value of operator "${key}" must be an array (provided type: "${typeof value}")`,
					);
				}
			}
			// Check if value of a Value operator is not a primitive, at this point it's an error
			if (
				depth.length === 1 &&
				Object.values(ValueOperator).includes(key as ValueOperator) &&
				!(["string", "number", "boolean"].includes(typeof value) || value === null)
			) {
				return onInvalid(
					key,
					value,
					`The value of operator "${key}" must be a primitive (provided type: "${typeof value}")`,
				);
			}
			/**
			 * Check if we are in a Logical sub validation
			 */
			if (
				depth.length === 2 &&
				depth[1] === ArrayItem &&
				Object.values(LogicalOperator).includes(depth[0] as LogicalOperator)
			) {
				return Object.entries(
					filtersValidator(
						Object.fromEntries([[key, value]]) as SearchField<T>,
						allowedOperators.filter(
							(operator) => !Object.values(LogicalOperator).includes(operator as LogicalOperator),
						),
						allowedFields,
						actionOnInvalid,
					) ?? [[undefined, undefined]],
				)[0];
			}
			return [key, value];
		},
		true,
	);
}

export function getDotKeys<T extends object, R = DotKeys<T>>(dtoConstructor: Type<T> | undefined): Array<R> {
	if (dtoConstructor === undefined) return [];
	const props =
		(Reflect.getMetadata("swagger/apiModelPropertiesArray", dtoConstructor.prototype) as Array<string>)?.map((item) =>
			item.substring(1),
		) ?? [];
	return props.flatMap((prop) => {
		const apiMeta = Reflect.getMetadata("swagger/apiModelProperties", dtoConstructor.prototype, prop);
		const type = apiMeta.type;

		if (typeof type === "function" && type !== Number && type !== String && type !== Boolean) {
			return getDotKeys(type).map((key) => `${prop}.${key}`);
		}
		return [prop];
	}) as Array<R>;
}
