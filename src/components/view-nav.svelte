<script lang="ts">
	import { page } from '$app/stores';
	import store from '$store';
	import ArrowLeftIcon from 'icons/ArrowLeftIcon.svelte';
	import light_mode from '$lib/light_mode.svg';
	import dark_mode from '$lib/dark_mode.svg';
	const colorScheme = store.state.colorScheme;
	export let cls = '';
</script>

<div class="flex justify-between z-50 bg-transparent select-none {cls}">
	<div>
		<a
			href="/file-manager"
			class:active={$page.path === '/file-manager'}
			class="p-1 snav-link font-bold bg-gray-200 dark:bg-gray-800 lead3 anchor rounded-md"
			><div class="flex"><span><ArrowLeftIcon size="1x" /></span><span>Hyp</span></div></a
		>
	</div>
	<div class="nav-link ">
		{#if $colorScheme === 'light'}
			<button
				class="p-1 border rounded-full bg-gray-200 dark:bg-gray-800 border-gray-300 hover:bg-gray-400"
				on:click={() => store.commit('setColorScheme', 'dark')}
			>
				<img src={dark_mode} alt="dark" />
			</button>
		{:else}
			<button
				class="p-1 border rounded-full bg-gray-200 dark:bg-gray-500 border-gray-400 hover:bg-gray-300 dark:hover:bg-gray-300"
				on:click={() => store.commit('setColorScheme', 'light')}
			>
				<img src={light_mode} alt="light" />
			</button>
		{/if}
	</div>
</div>
