<script lang="ts">
	// @ts-ignore
	import { NotificationDisplay } from '@beyonk/svelte-notifications';
	import ContextMenu from '$components/context-menu.svelte';
	import Snackbar from '$components/snack-bar.svelte';
	import '$lib/app.css';
	import Nav from '$components/nav.svelte';
	import store from '$store';
	import Prompt from '$components/prompt.svelte';
	import { dev, browser } from '$app/environment';
	import { page, navigating } from '$app/stores';
	const colorScheme = store.g('colorScheme');
	import type { Writable } from 'svelte/store';
	const base_url = store.g('base_url');

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
	const instruction: Writable<'reset' | 'abort'> = store.g('instruction');
	$: if ($navigating?.to?.url.pathname === base_url + 'files') {
		$instruction = 'abort';
	}
</script>

<svelte:head>
	{#key $page.url.pathname}
		{#if !$page.url.pathname.includes('view')}
			<title>HYP {$page.url.pathname.slice(1)}</title>
		{/if}
	{/key}
</svelte:head>

<Prompt />
<div
	id="main"
	class="w-full min-h-screen mx-auto flex flex-col justify-between bg shadow-md select-none"
>
	<div class="h-full flex flex-col flex-grow">
		<Nav />
		<slot />
	</div>
</div>
<Snackbar />
<NotificationDisplay />
{#if $page.url.pathname === base_url + 'files'}
	<ContextMenu />
{/if}
