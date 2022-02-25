<script lang="ts">
	import { page } from '$app/stores';
	import store from '$store';
	// import ArrowLeftIcon from 'icons/ArrowLeftIcon.svelte';
	import _ from 'lodash-es';
	import light_mode from '$lib/light_mode.svg';
	import dark_mode from '$lib/dark_mode.svg';
	const colorScheme = store.state.colorScheme;
	export let cls = '';
	const path = decodeURIComponent(_.last($page.query.getAll('path')));
	const canRender = path.endsWith('.html') || path.endsWith('.xml') || path.endsWith('.md');
	const render = store.g('render');
	const base_url = store.g('base_url');

	let showNav = false;
	const handleIt = (ev) => {
		if (ev.target === ev.currentTarget) showNav = !showNav;
	};
</script>

<div
	on:click={handleIt}
	class="flex justify-between select-none z-[1000] {cls} opacity-50 hover:opacity-100 top-0 w-full fixed min-h-[.8rem] {!showNav
		? 'bg-gray-300 dark:bg-gray-500'
		: 'bg-transparent'}"
>
	{#if showNav}
		<div class="">
			<a
				href="{base_url}files"
				class:active={$page.url.pathname === base_url + 'files'}
				class="nav-link font-bold bg-gray-200 dark:bg-gray-800 anchor rounded-md"
				><div class="flex">
					<span class="ml-0 md:ml-2 pb-[.4rem]">Files</span>
				</div></a
			>
		</div>
		{#if canRender}
			<div class="z-50">
				<button
					on:click={() => ($render = !$render)}
					class="bg-blue-200 p-1 m-1 rounded-sm text-sm text-gray-700 active:ring-1 active:ring-blue-300 capitalize"
					>{$render ? 'un' : ''}render</button
				>
			</div>
		{/if}
		<div class="nav-link ">
			{#if $colorScheme === 'light'}
				<button
					class="p-1 border rounded-full bg-gray-200 border-gray-300 hover:bg-gray-400"
					on:click={() => store.commit('setColorScheme', 'dark')}
				>
					<img src={dark_mode} width="20" alt="dark" />
				</button>
			{:else}
				<button
					class="p-1 border rounded-full dark:bg-gray-800 border-gray-400 dark:hover:bg-gray-600"
					on:click={() => store.commit('setColorScheme', 'light')}
				>
					<img src={light_mode} width="20" alt="light" />
				</button>
			{/if}
		</div>
	{/if}
</div>
