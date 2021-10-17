<script>
	import store from '$store';
	import SearchIcon from 'icons/SearchIcon.svelte';

	export let hidden = true;
	import { createEventDispatcher } from 'svelte';
	const emit = createEventDispatcher();
	const toggle = () => {
		hidden = !hidden;
	};
</script>

<div class="flex text-gray-700 dark:text-white">
	<div class:hidden>
		<input
			type="text"
			class="w-full p-1 border bg-gray-100 dark:bg-gray-500 border-gray-700 dark:border-gray-300 rounded"
		/>
	</div>
	<button on:click={toggle}><SearchIcon size="1.5x" /></button>
</div>
