<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import { backOut, quadIn } from 'svelte/easing';
	import store from '$store';
	import { onDestroy, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import position from '$lib/position';

	const pos = store.g('pos');

	const tooltip: Writable<ToolTip> = store.g('selected');
	let cls = '';
	export { cls as class };

	// let menu;
	const hide = () => {
		$tooltip = null;
	};

	onDestroy(hide);

	$: hidden = !$tooltip?.path;
</script>

{#key $pos}
	<div
		use:position={hide}
		transition:fade={{ delay: 100, duration: 200 }}
		class:hidden
		id="tooltip-menu__view"
		class=" fixed z-20 {cls}"
	>
		<div
			in:scale={{ delay: 100, start: 0.8, easing: backOut, duration: 250 }}
			out:scale={{ start: 0.9, easing: quadIn, duration: 200 }}
			class="flex p-2 bg-gray-200 dark:bg-gray-600 bg-opacity-95 dark:bg-opacity-95  flex-col min-w-[200px] min-h-[200px] rounded-md shadow-2xl gap-3 md:gap-4 text-gray-800 dark:text-blue-200"
		>
			<!--  -->
		</div>
	</div>
{/key}

<style lang="postcss">
	.disabled button {
		@apply text-gray-300 cursor-not-allowed;
	}
	:global(.dark) .disabled button {
		/* color: rgb(156, 163, 175) !important; */
		@apply text-gray-500;
	}
	.disabled:hover {
		background-color: transparent !important;
	}
</style>
