<script lang="ts">
	import { page } from '$app/stores';
	import store from '$store';
	import light_mode from '$lib/light_mode.svg';
	import dark_mode from '$lib/dark_mode.svg';
	const colorScheme = store.state.colorScheme;
	export let cls = '';
</script>

<div class="md:flex md:justify-between {cls}">
	<div class="hidden md:block">
		<a href="/" sveltekit:prefetch class:active={$page.path === '/'} class="anchor text-3xl">Hyp</a>
	</div>
	<div class="flex justify-between flex-md-row flex-col">
		{#each ['file-manager', 'chat'] as navLink}
			<div class="nav-link lead3">
				<a
					sveltekit:prefetch
					class="anchor p-3 capitalize"
					class:active={$page.path === '/' + navLink}
					href={`/${navLink}`}>{navLink}</a
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
				<span class="inline-block ml-1">dark mode</span>
			</button>
		{:else}
			<button
				class="p-2 text-blue-50 border rounded-full dark:bg-gray-800 border-gray-400 dark:hover:bg-gray-600 flex justify-between ml-6 md:ml-0"
				on:click={() => store.commit('setColorScheme', 'light')}
			>
				<img src={light_mode} alt="light" />
				<span class="inline-block ml-1">light mode</span>
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
