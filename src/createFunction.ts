// eslint-disable-next-line @typescript-eslint/ban-types
export function createFunction(functionStr: string): Function {
	// eslint-disable-next-line no-new-func,no-eval
	return Function(`return (${functionStr})`)()
}
