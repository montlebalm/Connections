<script lang="ts">
	import { range } from '$lib/range';
	import { shuffleArray } from '$lib/shuffleArray';
	import { type Group } from '$lib/types';

	//
	// Props
	//

	const {
		groups,
		numMaxGuesses
	}: {
		groups: Group[];
		numMaxGuesses: number;
	} = $props();

	//
	// State
	//

	let guesses: string[][] = $state([]);

	let numGuessesRemaining = $derived(numMaxGuesses - guesses.length);

	let selectedWords: string[] = $state([]);

	let completedGroupIndexes: number[] = $state([]);

	const completedGroups = $derived(completedGroupIndexes.map((index) => groups[index]));

	const remainingWords = $derived(
		range(0, groups.length)
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
			deselectWords();
			completedGroupIndexes.push(groupIndex);
			return;
		}

		guesses.push(selectedWords.slice());
	}
</script>

<main>
	<div class="preamble">Create four groups of four!</div>
	<div class="board">
		{#each completedGroups as group}
			<div class="group" data-difficulty={group.difficulty}>
				<div class="group-text">
					<div class="group-text-theme">{group.theme}</div>
					{group.words.join(', ')}
				</div>
			</div>
		{/each}
		{#each remainingWordsRandom as word}
			{#key word}
				<button
					class="word"
					data-selected={selectedWords.includes(word)}
					onclick={() => toggleWord(word)}
				>
					{word}
				</button>
			{/key}
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
			<button
				class="control"
				data-variant="primary"
				disabled={!isSubmitEnabled}
				onclick={() => submitSelection()}>Submit</button
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
		margin: 200px auto;
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
		animation-duration: 750ms;
		animation-name: group-enter;
		animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		height: 80px;
		justify-content: center;
		width: 100%;
	}

	@keyframes group-enter {
		0% {
			scale: 0;
		}

		50% {
			scale: 1.1;
		}

		100% {
			scale: 1;
		}
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

	.group-text {
		align-items: center;
		animation-duration: 500ms;
		animation-name: group-text-enter;
		color: var(--color-grey-1);
		display: flex;
		flex-direction: column;
		font-size: 1rem;
		gap: 4px;
		text-transform: uppercase;
	}

	@keyframes group-text-enter {
		0% {
			opacity: 0;
		}

		100% {
			opacity: 1;
		}
	}

	.group-text-theme {
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
		align-items: center;
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

	.control[data-variant='primary']:not([disabled]) {
		background: var(--color-grey-1);
		border-color: var(--color-grey-1);
		color: var(--color-white);
	}
</style>
