export function wait(miliseconds: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => resolve(), miliseconds);
	});
}
