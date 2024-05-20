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
export enum ListOperator {
	IN = "$in",
	NOT_IN = "$nin",
}

export enum LogicalOperator {
	OR = "$or",
	AND = "$and",
}
export const Operators = [
	...Object.values(ValueOperator),
	...Object.values(ListOperator),
	...Object.values(LogicalOperator),
] as const;

export type SearchFieldComparison<T extends object> = {
	[field in keyof T]: Partial<Record<ValueOperator, JsonPrimitive> | Record<ListOperator, Array<JsonPrimitive>>>;
};
export type SearchFieldLogical<T extends object> = {
	[field in LogicalOperator]: Array<Partial<SearchFieldComparison<T>>>;
};

export type SearchField<T extends object> = Partial<SearchFieldComparison<T> & SearchFieldLogical<T>>;

export function filtersValidator<T extends object>(
	input: SearchField<T> | undefined,
	allowedOperators: typeof Operators,
	throwOnInvalid: boolean,
	escapeInvalidLogical = true,
): SearchField<T> | undefined {
	if (input === undefined) return undefined;
	// Handle first level, LogicalOperator
	return objectVisitorMap(
		input,
		(key, value, depth) => {
			if (
				depth.length === 0 &&
				Object.values(LogicalOperator).includes(key as LogicalOperator) &&
				!allowedOperators.includes(key as LogicalOperator)
			) {
				if (escapeInvalidLogical) {
					return [`\\${key}`, value];
				}
				if (throwOnInvalid) {
					throw new ProblemDetailException(400, {
						title: "Invalid search criteria",
						detail: `The logical operator "${key}" is not allowed`,
					});
				}
				return [undefined, undefined];
			}
			/*
			 * Value and List operator
			 */
			// Check if operator is allowed
			if (
				depth.length === 1 &&
				(Object.values(LogicalOperator).includes(key as LogicalOperator) ||
					!allowedOperators.includes(key as LogicalOperator))
			) {
				if (throwOnInvalid) {
					throw new ProblemDetailException(400, {
						title: "Invalid search criteria",
						detail: `The operator "${key}" is not allowed`,
					});
				}
				return [undefined, undefined];
			}
			// Check if value of a List operator is a primitive, we create an array of it
			if (
				depth.length === 1 &&
				Object.values(ListOperator).includes(key as ListOperator) &&
				(["string", "number", "boolean"].includes(typeof value) || value === null)
			) {
				return [key, [value]];
			}
			// Check if value of a List operator is not an array, at this point it's an error
			if (depth.length === 1 && Object.values(ListOperator).includes(key as ListOperator) && !Array.isArray(value)) {
				if (throwOnInvalid) {
					throw new ProblemDetailException(400, {
						title: "Invalid search criteria",
						detail: `The value of operator "${key}" must be an array (provided type: "${typeof value}")`,
					});
				}
				return [undefined, undefined];
			}
			// Check if value of a Value operator is not a primitive, at this point it's an error
			if (
				depth.length === 1 &&
				Object.values(ValueOperator).includes(key as ValueOperator) &&
				!(["string", "number", "boolean"].includes(typeof value) || value === null)
			) {
				if (throwOnInvalid) {
					throw new ProblemDetailException(400, {
						title: "Invalid search criteria",
						detail: `The value of operator "${key}" must be a primitive (provided type: "${typeof value}")`,
					});
				}
				return [undefined, undefined];
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
						throwOnInvalid,
						escapeInvalidLogical,
					) ?? [[undefined, undefined]],
				)[0];
			}
			return [key, value];
		},
		true,
	);
}
