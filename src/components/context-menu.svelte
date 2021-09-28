<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import { backOut, quadIn } from 'svelte/easing';
	import { browser } from '$app/env';

	import Spinner from '$components/spinner.svelte';
	import store from '$store';
	import { onDestroy, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import position from '$lib/position';

	const pos = store.g('pos');

	const menuItems: Writable<ContextMenuItems> = store.g('context_menu');
	let cls = '';
	export { cls as class };

	// let menu;
	const hide = () => {
		$menuItems = [];
	};

	onDestroy(hide);

	$: hidden = ($menuItems?.length || 0) === 0;
	// $: console.log('menuItems', $menuItems);
</script>

{#key $pos}
	<div
		use:position={hide}
		transition:fade={{ delay: 100, duration: 200 }}
		class:hidden
		id="context-menu__view"
		class=" fixed z-50 {cls}"
	>
		<div
			in:scale={{ delay: 100, start: 0.8, easing: backOut, duration: 250 }}
			out:scale={{ start: 0.9, easing: quadIn, duration: 200 }}
			class="flex p-2 bg-white dark:bg-gray-700 bg-opacity-95 dark:bg-opacity-95  flex-col min-w-[200px] min-h-[200px] rounded-md shadow-2xl gap-3 md:gap-4 text-gray-800 dark:text-blue-200"
		>
			{#each $menuItems as { name, action, options,disabled=false, hidden=false,pending } (name)}
				<div
					class="hover:bg-gray-200 dark:hover:bg-gray-500 px-1 rounded"
					class:disabled={disabled || pending}
					class:hidden
				>
					<button
						{disabled}
						on:click={action()}
						class=" text-left w-full text-xl text-gray-900 dark:text-blue-300 capitalize flex items-center gap-1"
						>{name}
						{#if pending}
							<Spinner size={20} thickness={2} />
						{/if}
					</button>
				</div>
			{/each}
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
