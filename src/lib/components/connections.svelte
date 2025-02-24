<script lang="ts">
	import { flip } from 'svelte/animate';
	import { shuffleArray } from '$lib/shuffleArray';
	import { type Group, type WordPositions } from '$lib/types';
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

	const guesses: string[][] = $state([]);

	let numMistakesRemaining: number = $state(4);

	const completedGroupIndexes: number[] = $state([]);

	const gameState: 'playing' | 'won' | 'lost' = $derived.by(() => {
		if (numMistakesRemaining === -1) return 'lost';
		if (completedGroupIndexes.length === groups.length) return 'won';
		return 'playing';
	});

	let selectedWords: string[] = $state([]);
	let submittedWords: string[] = $state([]);
	let erroredWords: string[] = $state([]);

	const completedGroups: Group[] = $derived(completedGroupIndexes.map((index) => groups[index]));

	let remainingWords = $state(
		shuffleArray(
			groups
				.filter((_, index) => !completedGroupIndexes.includes(index))
				.flatMap((group) => group.words)
		)
	);

	let isAnimating = $state(false);

	const isActionable = $derived(gameState === 'playing' && !isAnimating);

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
		remainingWords = shuffleArray(remainingWords);
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

		isAnimating = true;

		// Start the "hop" animation by assigning to `submittedWords`
		submittedWords = selectedWords.toSorted(
			// Sort words as they appear in the grid so they'll hop in order
			(a, b) => remainingWords.indexOf(a) - remainingWords.indexOf(b)
		);
		await wait(1200);

		// Clear the submitted words so that they don't "hop" again when reordered
		const submittedWordsCopy = submittedWords.slice();
		submittedWords = [];

		// Success
		const matchedGroup = groups.find((group) =>
			group.words.every((word) => selectedWords.includes(word))
		);
		if (matchedGroup) {
			const nextRemainingWords = remainingWords.filter(
				(word) => !submittedWordsCopy.includes(word)
			);
			remainingWords = submittedWordsCopy.concat(nextRemainingWords);

			// Wait for words to reorder and the group to animate
			await wait(1000);

			// Track completed group
			const matchedGroupIndex = groups.indexOf(matchedGroup);
			completedGroupIndexes.push(matchedGroupIndex);

			// Clean up word positions
			remainingWords = nextRemainingWords;

			// Reset state
			handleDeselect();
			isAnimating = false;

			return;
		}

		// Error
		await animateSubmitError();
		numMistakesRemaining -= 1;
		guesses.push(selectedWords.slice());
		isAnimating = false;
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
		<div class="words">
			{#each remainingWords as word, i (word)}
				<button
					animate:flip={{ duration: () => (selectedWords.length ? 500 : 0) }}
					class="word"
					data-errored={erroredWords.includes(word)}
					data-selected={selectedWords.includes(word)}
					data-submitted={submittedWords.includes(word)}
					onclick={() => handleToggleWord(word)}
					style:--selected-index={submittedWords.indexOf(word)}
				>
					{word}
				</button>
			{/each}
		</div>
	</div>
	<div class="mistakes">
		{#if gameState === 'playing'}
			Mistakes remaining:
			{#each { length: numMistakesRemaining }}
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
		animation-duration: 800ms;
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

	.words {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.word {
		background: var(--color-grey-4);
		border: none;
		border-radius: 8px;
		color: var(--color-grey-1);
		cursor: pointer;
		font-size: 1rem;
		font-weight: bold;
		height: 80px;
		padding: 0;
		position: relative;
		text-transform: uppercase;
		transition:
			background 200ms ease,
			color 200ms ease;
		width: 144px;
	}

	.word[data-selected='true'] {
		background: var(--color-grey-2);
		color: var(--color-white);
		z-index: 1;
	}

	.word[data-submitted='true'] {
		animation-delay: calc(var(--selected-index) * 100ms);
		animation-duration: 400ms;
		animation-name: word-submit;
		animation-timing-function: var(--ease-out-quint);
	}

	@keyframes word-submit {
		0% {
			top: 0;
		}

		50% {
			top: -4px;
		}

		100% {
			top: 0;
		}
	}

	.word[data-errored='true'] {
		animation-delay: 500ms;
		animation-duration: 400ms;
		animation-name: word-error;
		animation-timing-function: var(--ease-out-quint);
	}

	@keyframes word-error {
		0% {
			left: 0;
		}

		20% {
			left: -4px;
		}

		40% {
			left: 4px;
		}

		60% {
			left: -4px;
		}

		80% {
			left: 4px;
		}

		100% {
			left: 0;
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
		cursor: pointer;
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
