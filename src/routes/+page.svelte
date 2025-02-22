<script lang="ts">
	import Connections from '$lib/components/connections.svelte';
</script>

<Connections
	groups={[
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
	]}
/>
