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
