<script lang="ts">
	import { page } from '$app/stores';
	import store from '$store';
	import light_mode from '$lib/light_mode.svg';
	import dark_mode from '$lib/dark_mode.svg';
	const colorScheme = store.state.colorScheme;
	const base_url = store.g('base_url');
</script>

<div class="flex justify-between gap-6 bg select-none md:px-10 py-2 sticky-top">
	<div class="h-[fit-content]">
		<a
			href={base_url}
			sveltekit:prefetch
			class:active={$page.url.pathname === base_url + '/'}
			class="anchor text-3xl nav-item py-1 pr-2">Hyp</a
		>
	</div>
	<div class="flex justify-between gap-6 p-4 md:p-0">
		{#each ['files', 'tasks'] as navLink}
			<div>
				<a
					sveltekit:prefetch
					class="anchor text-3xl capitalize nav-item"
					class:active={$page.url.pathname === base_url + navLink}
					href={base_url + `${navLink}`}>{navLink}</a
				>
			</div>
		{/each}
	</div>
	<div>
		<button
			class:hidden={$colorScheme === 'dark'}
			class=" p-2 text-blue-500 border rounded-full border-gray-300 hover:bg-gray-400 flex justify-between ml-6 md:ml-0"
			on:click={() => store.commit('setColorScheme', 'dark')}
		>
			<img src={dark_mode} alt="dark" />
		</button>
		<button
			class:hidden={$colorScheme === 'light'}
			class="p-2 text-blue-50 border rounded-full dark:bg-gray-800 border-gray-400 dark:hover:bg-gray-600 flex justify-between ml-6 md:ml-0"
			on:click={() => store.commit('setColorScheme', 'light')}
		>
			<img src={light_mode} alt="light" />
		</button>
	</div>
</div>
