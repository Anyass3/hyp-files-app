<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
		if (browser) {
			store.dispatch('startConnection');
		}
		return {};
	}
</script>

<script lang="ts">
	import { NotificationDisplay } from '@beyonk/svelte-notifications';
	import ContextMenu from '$components/context-menu.svelte';
	import Snackbar from '$components/snack-bar.svelte';
	import 'tailwindcss/tailwind.css';
	import '$lib/app.css';
	import Header from '$components/nav.svelte';
	import store from '$store';
	import Prompt from '$components/prompt.svelte';
	import { dev, browser } from '$app/env';
	import { page } from '$app/stores';
	const colorScheme = store.g('colorScheme');
	import { InterObserver, NavInterObserver } from '$lib/utils';

	$: ((theme) => {
		if (browser) {
			if (theme === 'dark') {
				document.body.classList.add('dark');
			} else {
				document.body.classList.remove('dark');
			}
		}
	})($colorScheme);
	// $: console.log('page', $page);
</script>

<Prompt />
<div
	id="main"
	class="w-full min-h-screen mx-auto flex flex-col justify-between bg shadow-md select-none"
>
	<div class="h-full flex flex-col flex-grow">
		<Header />
		<!-- <div class="w-screen h-2" use:NavInterObserver /> -->
		<slot />
	</div>
</div>
<Snackbar />
<NotificationDisplay />
{#if $page.path === '/files'}
	<ContextMenu />
{/if}
