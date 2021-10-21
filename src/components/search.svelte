<script>
	import store from '$store';
	import SearchIcon from 'icons/SearchIcon.svelte';
	import _ from 'lodash-es';
	const search = store.g('search');
	export let hidden = true;
	import { createEventDispatcher } from 'svelte';
	const emit = createEventDispatcher();
	const toggle = () => {
		hidden = !hidden;
		if (hidden && $search) {
			$search = '';
			emit('search');
		}
	};
</script>

<div class="flex text-gray-700 dark:text-white">
	<div class:hidden>
		<!-- svelte-ignore a11y-autofocus -->
		<input
			bind:value={$search}
			on:input={_.throttle(() => emit('search'))}
			type="search"
			autofocus
			class="w-full p-1 border bg-gray-100 dark:bg-gray-500 border-gray-700 dark:border-gray-300 rounded"
		/>
	</div>
	<button on:click={toggle}><SearchIcon size="1.5x" /></button>
</div>
