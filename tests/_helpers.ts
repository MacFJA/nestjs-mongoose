export function title(subject: { name: string } | undefined, testCase: string) {
	return `${genericTitle(subject)} ⟶ ${testCase}`;
}
export function genericTitle(subject: { name: string } | undefined) {
	return `Unit test: ${subject?.name ?? "?"}`;
}
export function inputTitle(subject: { name: string } | undefined, testCaseAction: string, testCaseIdentifier: string) {
	return title(subject, `${testCaseAction} ${"`"}${testCaseIdentifier}${"`"}`);
}
