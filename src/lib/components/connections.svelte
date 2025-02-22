<script lang="ts">
	import { range } from '$lib/range';
	import { shuffleArray } from '$lib/shuffleArray';
	import { type Group } from '$lib/types';
	import { wait } from '$lib/wait';

	//
	// Props
	//

	const {
		groups
	}: {
		groups: Group[];
	} = $props();

	//
	// State
	//

	let guesses: string[][] = $state([]);

	let numMistakesRemaining = $state(4);

	let selectedWords: string[] = $state([]);
	let submittedWords: string[] = $state([]);
	let erroredWords: string[] = $state([]);

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
		if (numMistakesRemaining === -1) return 'lost';
		if (completedGroupIndexes.length === groups.length) return 'won';
		return 'playing';
	});

	const isActionable = $derived(
		gameState === 'playing' && !submittedWords.length && !erroredWords.length
	);

	const isShuffleEnabled = $derived(isActionable);

	const isDeselectEnabled = $derived(isActionable && selectedWords.length > 0);

	const isSubmitEnabled = $derived(isActionable && selectedWords.length === 4);

	//
	// Handlers
	//

	function handleToggleWord(word: string): void {
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

	function handleDeselect(): void {
		selectedWords = [];
	}

	function handleShuffle(): void {
		remainingWordsRandom = shuffleArray(remainingWords);
	}

	async function handleSubmit(): Promise<void> {
		// Check for duplicate guess
		const hasAlreadyGuessed = guesses.some((guess) =>
			guess.every((word) => selectedWords.includes(word))
		);
		if (hasAlreadyGuessed) {
			alert('Duplicate guess');
			return;
		}

		await animateSubmit();

		// Success
		const groupIndex = groups.findIndex((group) =>
			group.words.every((word) => selectedWords.includes(word))
		);
		if (groupIndex !== -1) {
			await wait(600);

			handleDeselect();
			completedGroupIndexes.push(groupIndex);

			return;
		}

		// Error
		await animateSubmitError();
		numMistakesRemaining -= 1;
		guesses.push(selectedWords.slice());
	}

	async function animateSubmit(): Promise<void> {
		// Sort words in the order that they appear in the grid
		submittedWords = selectedWords.toSorted(
			(a, b) => remainingWordsRandom.indexOf(a) - remainingWordsRandom.indexOf(b)
		);

		return new Promise<void>((resolve) => {
			setTimeout(() => {
				submittedWords = [];

				resolve();
			}, 650);
		});
	}

	async function animateSubmitError(): Promise<void> {
		erroredWords = selectedWords;

		return new Promise<void>((resolve) => {
			setTimeout(() => {
				// Reset error animation
				erroredWords = [];

				resolve();
			}, 1000);
		});
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
					data-errored={erroredWords.includes(word)}
					data-selected={selectedWords.includes(word)}
					data-submitted={submittedWords.includes(word)}
					onclick={() => handleToggleWord(word)}
					style="--selected-index: {submittedWords.indexOf(word)}"
				>
					{word}
				</button>
			{/key}
		{/each}
	</div>
	<div class="mistakes">
		{#if gameState === 'playing'}
			Mistakes remaining:
			{#each new Array(numMistakesRemaining) as _}
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
			<button class="control" disabled={!isShuffleEnabled} onclick={() => handleShuffle()}
				>Shuffle</button
			>
			<button class="control" disabled={!isDeselectEnabled} onclick={() => handleDeselect()}
				>Deselect All</button
			>
			<button
				class="control"
				data-variant="primary"
				disabled={!isSubmitEnabled}
				onclick={() => handleSubmit()}>Submit</button
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

		--ease-in-quad: cubic-bezier(0.55, 0.085, 0.68, 0.53);
		--ease-in-cubic: cubic-bezier(0.55, 0.055, 0.675, 0.19);
		--ease-in-quart: cubic-bezier(0.895, 0.03, 0.685, 0.22);
		--ease-in-quint: cubic-bezier(0.755, 0.05, 0.855, 0.06);
		--ease-in-expo: cubic-bezier(0.95, 0.05, 0.795, 0.035);
		--ease-in-circ: cubic-bezier(0.6, 0.04, 0.98, 0.335);
		--ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
		--ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);
		--ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
		--ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1);
		--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
		--ease-out-circ: cubic-bezier(0.075, 0.82, 0.165, 1);
		--ease-in-out-quad: cubic-bezier(0.455, 0.03, 0.515, 0.955);
		--ease-in-out-cubic: cubic-bezier(0.645, 0.045, 0.355, 1);
		--ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);
		--ease-in-out-quint: cubic-bezier(0.86, 0, 0.07, 1);
		--ease-in-out-expo: cubic-bezier(1, 0, 0, 1);
		--ease-in-out-circ: cubic-bezier(0.785, 0.135, 0.15, 0.86);
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
		animation-duration: 900ms;
		animation-name: group-enter;
		animation-timing-function: var(--ease-out-quint);
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

	.word[data-submitted='true'] {
		animation-delay: calc(var(--selected-index) * 100ms);
		animation-duration: 400ms;
		animation-name: word-submit;
		animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
	}

	@keyframes word-submit {
		0% {
			transform: translateY(0);
		}

		50% {
			transform: translateY(-4px);
		}

		100% {
			transform: translateY(0);
		}
	}

	.word[data-errored='true'] {
		animation-delay: 500ms;
		animation-duration: 400ms;
		animation-name: word-error;
		animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
	}

	@keyframes word-error {
		0% {
			transform: translateX(0);
		}

		20% {
			transform: translateX(-4px);
		}

		40% {
			transform: translateX(4px);
		}

		60% {
			transform: translateX(-4px);
		}

		80% {
			transform: translateX(4px);
		}

		100% {
			transform: translateY(0);
		}
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
		border-radius: 20px;
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
