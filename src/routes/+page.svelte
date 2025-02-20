<script lang="ts">
	//
	// Todo
	// - Position in the center
	// - Scale to viewport
	//
	// Animation
	// - Shuffle smoothly moves cards positions
	// - Shake animation for incorrect guesses
	//
	// Bugs
	// - Word background animation after correct submission
	//

	//
	// Constants
	//

	import { shuffleArray } from '$lib/shuffleArray';

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

	let guesses: string[][] = $state([]);

	let numGuessesRemaining = $derived(numMaxGuesses - guesses.length);

	let selectedWords: string[] = $state([]);

	let completedGroupIndexes: number[] = $state([]);

	const completedGroups = $derived(completedGroupIndexes.map((index) => groups[index]));

	const remainingWords = $derived(
		groupIndexes
			.filter((index) => !completedGroupIndexes.includes(index))
			.flatMap((index) => groups[index].words)
	);

	let remainingWordsRandom: string[] = $state([]);
	$effect(() => {
		remainingWordsRandom = shuffleArray(remainingWords);
	});

	const gameState: 'playing' | 'won' | 'lost' = $derived.by(() => {
		if (numGuessesRemaining === 0) return 'lost';
		if (completedGroupIndexes.length === groups.length) return 'won';
		return 'playing';
	});

	const isSubmitEnabled = $derived(selectedWords.length === 4 && gameState === 'playing');

	const isDeselectEnabled = $derived(selectedWords.length > 0);

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
		selectedWords = [];
	}

	function shuffleWords(): void {
		remainingWordsRandom = shuffleArray(remainingWords);
	}

	function submitSelection(): void {
		// Check for duplicate guess
		const hasAlreadyGuessed = guesses.some((guess) =>
			guess.every((word) => selectedWords.includes(word))
		);
		if (hasAlreadyGuessed) {
			alert('Duplicate guess');
			return;
		}

		// Find matching group
		const groupIndex = groups.findIndex((group) =>
			group.words.every((word) => selectedWords.includes(word))
		);

		if (groupIndex !== -1) {
			completedGroupIndexes.push(groupIndex);

			deselectWords();
		} else {
			guesses.push(selectedWords.slice());
		}
	}
</script>

<main>
	<div class="board">
		{#each completedGroups as group}
			<div class="group" data-difficulty={group.difficulty}>
				<div class="group-theme">{group.theme}</div>
				{group.words.join(', ')}
			</div>
		{/each}
		{#each remainingWordsRandom as word}
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
		{#if gameState === 'playing'}
			Guesses remaining:
			{#each new Array(numGuessesRemaining) as _}
				<span class="mistake-dot"></span>
			{/each}
		{:else if gameState === 'won'}
			You did it!
		{:else if gameState === 'lost'}
			Game over
		{/if}
	</div>
	{#if gameState === 'playing'}
		<div class="controls">
			<button class="control" onclick={() => shuffleWords()}>Shuffle</button>
			<button class="control" disabled={!isDeselectEnabled} onclick={() => deselectWords()}
				>Deselect All</button
			>
			<button class="control" disabled={!isSubmitEnabled} onclick={() => submitSelection()}
				>Submit</button
			>
		</div>
	{/if}
</main>

<style lang="css">
	:root {
		--color-white: #fff;
		--color-grey-1: #333;
		--color-grey-2: #666;
		--color-grey-3: #ccc;
		--color-grey-4: #eee;
	}

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
		color: var(--color-grey-1);
		display: flex;
		flex-direction: column;
		font-size: 1rem;
		gap: 4px;
		height: 80px;
		justify-content: center;
		text-transform: uppercase;
		width: 100%;
	}

	.group[data-difficulty='1'] {
		background: #f9df6d;
	}

	.group[data-difficulty='2'] {
		background: #a0c35a;
	}

	.group[data-difficulty='3'] {
		background: #b0c4ef;
	}

	.group[data-difficulty='4'] {
		background: #ba81c5;
	}

	.group-theme {
		font-weight: bold;
	}

	.word {
		background: var(--color-grey-4);
		border: none;
		border-radius: 8px;
		color: var(--color-grey-1);
		font-size: 1rem;
		font-weight: bold;
		height: 80px;
		padding: 0;
		text-transform: uppercase;
		transition:
			background 200ms ease,
			color 200ms ease;
		width: 144px;
	}

	.word[data-selected='true'] {
		background: var(--color-grey-2);
		color: var(--color-white);
	}

	.mistakes {
		display: flex;
		gap: 8px;
	}

	.mistake-dot {
		background: var(--color-grey-2);
		border-radius: 50%;
		height: 16px;
		width: 16px;
	}

	.controls {
		display: flex;
		gap: 16px;
	}

	.control {
		background: var(--color-white);
		border: 1px solid var(--color-grey-2);
		border-radius: 16px;
		font-size: 1em;
		padding: 8px 16px;
	}

	.control[disabled] {
		border-color: var(--color-grey-3);
		color: var(--color-grey-3);
	}
</style>
