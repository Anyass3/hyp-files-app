<script lang="ts">
	import { scale, fly, fade } from 'svelte/transition';
	import { backOut, quadIn, sineIn } from 'svelte/easing';
	import store from '$store';
	import { onDestroy, onMount } from 'svelte';
	import type { derived, Writable } from 'svelte/store';
	import position from '$lib/position';
	import { getSize } from '$lib/utils';

	const selected: Writable<ToolTip> = store.g('selected');
	let cls = '';
	export { cls as class };

	const hide = () => {
		$selected = null;
	};

	onDestroy(hide);

	$: hidden = !$selected?.path;
</script>

<div class:hidden class=" fixed z-20 {cls} bottom-0 right-0">
	{#key $selected}
		<div
			in:fade={{ delay: 50, duration: 100 }}
			class="p-1 bg bg-opacity-95 dark:bg-opacity-95  border min-w-[fit-content] min-h-[fit-content] rounded-md shadow-2xl text-gray-800 dark:text-blue-200"
		>
			"{$selected?.name}" selected
			{#if $selected?.isFile}
				({getSize($selected.size)})
			{:else}
				(containing {$selected?.items} items)
			{/if}
		</div>
	{/key}
</div>
