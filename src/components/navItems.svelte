<script lang="ts">
	import { page } from '$app/stores';
	import store from '$store';
	import light_mode from '$lib/light_mode.svg';
	import dark_mode from '$lib/dark_mode.svg';
	const colorScheme = store.state.colorScheme;
	const base_url = store.g('base_url');
	export let cls = '';
</script>

<div class="flex flex-col md:flex-row md:justify-between {cls} gap-6">
	<div class="hidden md:block h-[fit-content]">
		<a
			href={base_url}
			sveltekit:prefetch
			class:active={$page.url.pathname === base_url + '/'}
			class="anchor text-3xl nav-item py-1 pr-2">Hyp</a
		>
	</div>
	<div class="flex justify-between flex-md-row flex-col gap-6 p-4 md:p-0">
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
		{#if $colorScheme === 'light'}
			<button
				class=" p-2 text-blue-500 border rounded-full border-gray-300 hover:bg-gray-400 flex justify-between ml-6 md:ml-0"
				on:click={() => store.commit('setColorScheme', 'dark')}
			>
				<img src={dark_mode} alt="dark" />
			</button>
		{:else}
			<button
				class="p-2 text-blue-50 border rounded-full dark:bg-gray-800 border-gray-400 dark:hover:bg-gray-600 flex justify-between ml-6 md:ml-0"
				on:click={() => store.commit('setColorScheme', 'light')}
			>
				<img src={light_mode} alt="light" />
			</button>
		{/if}
	</div>
</div>

<style lang="postcss">
	@media (min-width: 768px) {
		.flex-md-row {
			-webkit-box-orient: horizontal !important;
			-webkit-box-direction: normal !important;
			-ms-flex-direction: row !important;
			-webkit-flex-direction: row !important;
			flex-direction: row !important;
		}
	}
</style>
