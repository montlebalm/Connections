<script lang="ts">
	//
	// TODO
	// - Disable submit button until 4 are selected
	// - Position in the center
	// - Scale to viewport
	// - Add shake animation
	// - Prevent duplicate guesses
	//

	//
	// Data
	//

	const groups = [
		{
			difficulty: 1,
			theme: 'Comment after an insult',
			words: ['burn', 'ouch', 'snap', 'zing']
		},
		{
			difficulty: 2,
			theme: 'Tiny amount, with "A"',
			words: ['bit', 'little', 'mite', 'tad']
		},
		{
			difficulty: 3,
			theme: 'Bit of citrus garnish',
			words: ['slice', 'twist', 'wedge', 'zest']
		},
		{
			difficulty: 4,
			theme: 'Bungle, with "up"',
			words: ['foul', 'louse', 'muck', 'screw']
		}
	];

	const groupIndexes = [0, 1, 2, 3];

	const numMaxGuesses = 5;

	//
	// State
	//

	let numGuessesRemaining = $state(numMaxGuesses);

	let selectedWords: String[] = $state([]);

	let completedGroupIndexes = $state([0, 2]);
	const completedGroups = $derived(completedGroupIndexes.map((index) => groups[index]));

	const remainingGroupIndexes = $derived(groupIndexes.filter((index) => !completedGroupIndexes.includes(index)));
	const remainingWords = $derived(
		remainingGroupIndexes
			.map((index) => groups[index])
			.flatMap((g) => g.words)
	);
	const remainingWordsRandom = $derived(remainingWords.toSorted(() => Math.random() - Math.random()));

	const gameState: 'playing' | 'won' | 'lost' = $derived.by(() => {
		if (numGuessesRemaining === 0) return 'lost';
		if (completedGroupIndexes.length === groups.length) return 'won';
		return 'playing';
	});

	//
	// Handlers
	//

	function toggleWord(word: string): void {
		// Deselect word
		if (selectedWords.includes(word)) {
			const wordIndex = selectedWords.indexOf(word);
			selectedWords.splice(wordIndex, 1);
			return;
		}

		// Select word
		if (selectedWords.length < 4) {
			selectedWords.push(word);
			return;
		}
	}

	function deselectWords(): void {
		selectedWords.length = 0;
	}

	function shuffleWords(): void {
		// TODO: fix shuffle
		// remainingWordsRandom = words.toSorted(() => Math.random() - Math.random());
	}

	function submitSelection(): void {
		const groupIndex = groups.findIndex((group) => 
			group.words.every((word) => selectedWords.includes(word))
		);

		if (groupIndex !== -1) {
			completedGroupIndexes.push(groupIndex);

			deselectWords();
		} else if (numGuessesRemaining === 0) {
			alert('Game over :(');
		} else {
			numGuessesRemaining -= 1;
		}
	}
</script>

<main>
	<div class="board">
		{#each completedGroups as group}
			<div
				class="group"
				data-difficulty={group.difficulty}
			>
				<div class="group-theme">{group.theme}</div>
				{group.words.join(', ')}
			</div>
		{/each}
		{#each remainingWordsRandom as word, i}
			<button
				class="word"
				data-selected={selectedWords.includes(word)}
				onclick={() => toggleWord(word)}
			>
				{word}
			</button>
		{/each}
	</div>
	<div class="mistakes">
		{#if numGuessesRemaining > 0}
			Guesses remaining:
			{#each new Array(numGuessesRemaining) as _}
				<span class="mistake-dot" />
			{/each}
		{:else}
			Game over
		{/if}
	</div>
	<div class="controls">
		<button onclick={() => deselectWords()}>Deselect</button>
		<button onclick={() => shuffleWords()}>Shuffle</button>
		<button
			disabled={selectedWords.length < 4}
			onclick={() => submitSelection()}
		>
			Submit
		</button>
	</div>
</main>

<style lang="scss">
	main {
		align-items: center;
		display: flex;
		flex-direction: column;
		gap: 20px;
		height: 300px;
		justify-content: center;
		margin: 100px auto;
		width: 600px;
	}

	.board {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		width: 100%;
	}

	.group {
		align-items: center;
		border-radius: 8px;
		color: #333;
		display: flex;
		flex-direction: column;
		font-size: 1rem;
		gap: 4px;
		height: 80px;
		justify-content: center;
		text-transform: uppercase;
		width: 100%;

		&[data-difficulty="1"] {
			background: #f9df6d;
		}

		&[data-difficulty="2"] {
			background: #a0c35a;
		}

		&[data-difficulty="3"] {
			background: #b0c4ef;
		}

		&[data-difficulty="4"] {
			background: #ba81c5;
		}
	}

	.group-theme {
		font-weight: bold;
	}

	.word {
		background: #eee;
		border: none;
		border-radius: 8px;
		color: #333;
		font-size: 1rem;
		font-weight: bold;
		height: 80px;
		padding: 0;
		text-transform: uppercase;
		transition: background 200ms ease,
			color 200ms ease;
		width: 144px;

		&[data-selected="true"] {
			background: #666;
			color: white;
		}
	}

	.mistakes {
		display: flex;
		gap: 8px;
	}

	.mistake-dot {
		background: #666;
		border-radius: 50%;
		height: 16px;
		width: 16px;
	}

	.controls {
		display: flex;
		gap: 16px;
	}
</style>
