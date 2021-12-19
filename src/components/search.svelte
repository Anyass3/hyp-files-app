<script>
	import store from '$store';
	import { scale, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import SearchIcon from 'icons/SearchIcon.svelte';
	import _ from 'lodash-es';
	const search = store.g('search');
	export let hidden = true;
	import { createEventDispatcher } from 'svelte';
	const emit = createEventDispatcher();
	let input;
	const toggle = () => {
		hidden = !hidden;
		if (hidden && $search) {
			$search = '';
			emit('search');
		}
	};
	$: if ($search) hidden = false;
</script>

<div
	class="flex text-gray-700 dark:text-white items-center max-w-full w-[max-content] justify-end gap-1"
>
	{#if !hidden}
		<div
			class="w-full"
			in:scale={{ delay: 100, start: 0.9, easing: quintOut, duration: 100 }}
			out:fade={{ duration: 200 }}
		>
			<!-- svelte-ignore a11y-autofocus -->
			<input
				bind:this={input}
				bind:value={$search}
				on:input={_.throttle(() => emit('search'))}
				type="search"
				autofocus
				class="max-w-full w-64 p-2 border bg-gray-100 dark:bg-gray-500 border-gray-700 dark:border-gray-300 rounded focus:outline-none"
			/>
		</div>{/if}
	<button on:click={toggle}><SearchIcon size="2x" /></button>
</div>
