import testRunner, { type ImplementationFn } from "ava";

export function property(objectName: string, subject: { name: string } | undefined): { name: string } {
	return {
		name: `${objectName}.${subject?.name ?? "?"}`,
	};
}
export function title(subject: { name: string } | string | undefined, testCase: string) {
	return `${genericTitle(subject)} ⟶ ${testCase}`;
}
export function genericTitle(subject: { name: string } | string | undefined) {
	const name = typeof subject === "string" ? subject : subject?.name ?? "?";
	return `Unit test: ${name}`;
}
export function inputTitle(
	subject: { name: string } | string | undefined,
	testCaseAction: string,
	testCaseIdentifier: string,
) {
	return title(subject, `${testCaseAction} ${"`"}${testCaseIdentifier}${"`"}`);
}

export type FunctionTestCase<Args extends Array<unknown> = Array<unknown>, Context = unknown> = (
	subject: { name: string } | string | undefined,
	testCase: string,
	exec: ImplementationFn<Args, Context>,
) => Promise<void>;
export function testClass(subject: { name: string } | string | undefined, exec: (method: FunctionTestCase) => void) {
	let titlePrefix = "\x1b[2mclass\x1b[0m ";
	if (typeof subject === "string") {
		titlePrefix += `\x1b[1m${subject}\x1b[0m`;
	} else if (subject === undefined) {
		titlePrefix += "\x1b[41m ? \x1b[0m";
	} else {
		titlePrefix += `\x1b[1m${subject.name}\x1b[0m`;
	}
	titlePrefix += "\x1b[2m.\x1b[0m";

	exec(async (method, testCase, exec) => {
		let methodTitle = "";
		if (typeof method === "string") {
			methodTitle += `\x1b[3m${method}()\x1b[0m`;
		} else if (method === undefined) {
			methodTitle += "\x1b[41m ? \x1b[0m()";
		} else {
			methodTitle += `\x1b[3m${method.name}()\x1b[0m`;
		}
		if (testCase) {
			methodTitle += ` \x1b[37;2m⟶\x1b[0m \x1b[33m${testCase}\x1b[0m`;
		}
		await testRunner(titlePrefix + methodTitle, exec);
	});
}
export const testFunction: FunctionTestCase = async (subject, testCase, exec) => {
	let methodTitle = "\x1b[2mfunction\x1b[0m ";
	if (typeof subject === "string") {
		methodTitle += `\x1b[3m${subject}()\x1b[0m`;
	} else if (subject === undefined) {
		methodTitle += "\x1b[41m ? \x1b[0m";
	} else {
		methodTitle += `\x1b[3m${subject.name}()\x1b[0m`;
	}
	if (testCase) {
		methodTitle += ` \x1b[37;2m⟶\x1b[0m \x1b[33m${testCase}\x1b[0m`;
	}
	await testRunner(methodTitle, exec);
};
export function testFunctionTestCase(args: Record<string, unknown>, result: unknown): string {
	const argTitle = (label: string, value: unknown): string => {
		const prefix = `\x1b[0;2;100m${label}:\x1b[0;33m `;
		if (Array.isArray(value)) {
			return prefix + JSON.stringify(value);
		}
		return `${prefix}${JSON.stringify(value)}`;
	};
	const separatorTitle = (char: string): string => {
		return `\x1b[33;2m${char}\x1b[22m`;
	};
	const resultTitle = (result: unknown) => {
		const displayValue = Array.isArray(result) ? `[${String(result)}]` : String(result);
		return `${separatorTitle(" = ")}\x1b[0;36m${displayValue}\x1b[0m`;
	};

	return (
		Object.entries(args)
			.map(([label, value]) => argTitle(label, value))
			.join(separatorTitle(", ")) + resultTitle(result)
	);
}
export const testDecorator: FunctionTestCase = async (subject, testCase, exec) => {
	let methodTitle = "\x1b[2mdecorator\x1b[0m ";
	if (typeof subject === "string") {
		methodTitle += `\x1b[3m@${subject}()\x1b[0m`;
	} else if (subject === undefined) {
		methodTitle += "\x1b[41m ? \x1b[0m";
	} else {
		methodTitle += `\x1b[3m@${subject.name}()\x1b[0m`;
	}
	if (testCase) {
		methodTitle += ` \x1b[37;2m⟶\x1b[0m \x1b[33m${testCase}\x1b[0m`;
	}
	await testRunner(methodTitle, exec);
};
