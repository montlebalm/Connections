export class GameState {
	numGroups: number;

	guesses: string[][] = $state([]);

	numMistakesRemaining: number = $state(4);

	completedGroupIndexes: number[] = $state([]);

	state: 'playing' | 'won' | 'lost' = $derived.by(() => {
		if (this.numMistakesRemaining === -1) return 'lost';
		if (this.completedGroupIndexes.length === this.numGroups) return 'won';
		return 'playing';
	});

	constructor(numGroups: number) {
		this.numGroups = numGroups;
	}
}
