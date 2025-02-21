export function range(start: number, end: number): number[] {
	const output: number[] = [];

	for (let i = start; i < end; i++) {
		output.push(i);
	}

	return output;
}
