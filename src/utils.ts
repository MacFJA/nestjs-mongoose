// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
export function regexEscaper(input: string) {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function bound(
	min: number | undefined,
	value: number | undefined,
	max: number | undefined,
	fallback: number,
): number {
	let final = value ?? fallback;
	if (min !== undefined) {
		final = Math.max(min, final);
	}
	if (max !== undefined) {
		final = Math.min(max, final);
	}
	return final;
}

export function removeUndefined(input: Record<string, unknown | undefined>): Record<string, NonNullable<unknown>> {
	return Object.fromEntries(
		Object.entries(input)
			.filter(([, value]) => value !== undefined)
			.map(([key, value]) => {
				if (typeof value === "object" && value !== null) {
					if (Array.isArray(value)) {
						return [key, value];
					}
					return [key, removeUndefined(value as Record<string, unknown | undefined>)];
				}
				return [key, value];
			}),
	) as Record<string, NonNullable<unknown>>;
}

export function objectMap<Input extends object, Output extends object = Input>(
	input: Input,
	keyTransform?: (key: string, index: number) => string,
	valueTransform?: (value: unknown, newKey: string, oldKey: string, index: number) => unknown,
): Output {
	return Object.fromEntries(
		Object.entries(input).map(([key, value], index) => {
			const newKey = keyTransform ? keyTransform(key, index) : key;
			const newValue = valueTransform ? valueTransform(value, newKey, key, index) : value;
			return [newKey, newValue];
		}),
	) as Output;
}

export const ArrayItem = Symbol();
export function objectVisitorMap<T extends object>(
	input: T,
	visitor: (key: string, value: unknown, depth: Array<string | symbol>) => [string | undefined, unknown],
	recursive = true,
	depth: Array<string | symbol> = [],
): T {
	if (typeof input === "object" && input !== null) {
		return Object.fromEntries(
			Object.entries(input)
				.map(([key, value]) => {
					const [newKey, newValue] = visitor(key, value, depth);
					if (newKey === undefined) {
						return [undefined, undefined];
					}

					if (typeof newValue === "object" && newValue !== null && recursive) {
						if (Array.isArray(newValue)) {
							return [
								newKey,
								newValue.map((item) => objectVisitorMap(item, visitor, true, [...depth, key, ArrayItem])),
							];
						}
						return [newKey, objectVisitorMap(newValue, visitor, true, [...depth, key])];
					}
					return [newKey, newValue];
				})
				.filter(([key]) => key !== undefined),
		) as T;
	}
	return input;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic function typing
export function wrap<source extends (...args: any) => any>(
	fn: source,
	before?: (args: Parameters<source>) => Parameters<source>,
	after?: (returned: unknown, args: Parameters<source>) => unknown,
) {
	return function (this: unknown, ...sourceArg: Parameters<source>) {
		const newArgs = before ? before(sourceArg) : sourceArg;
		const returned = fn.apply(this, newArgs);
		return after ? after(returned, newArgs) : returned;
	};
}

export function flatObjectKeys(input: object, withParent = false): Array<string> {
	return Object.entries(input).flatMap(([key, value]) => {
		if (["string", "number", "boolean"].includes(typeof value) || value === null || Array.isArray(value)) {
			return [key];
		}
		const children = flatObjectKeys(value, withParent).map((child) => `${key}.${child}`);
		return withParent ? [key, ...children] : children;
	});
}

export function addExcludeArray<T>(base: Array<unknown>, add: Array<unknown>, exclude: Array<unknown>): Array<T> {
	return [...base, ...add].filter((item) => !exclude.includes(item)) as Array<T>;
}
export function filterArray<T>(base: Array<unknown>, allowed: Array<unknown>): Array<T> {
	return base.filter((item) => allowed.includes(item)) as Array<T>;
}
