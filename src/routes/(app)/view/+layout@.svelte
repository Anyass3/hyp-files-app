<script lang="ts">
	// @ts-ignore
	import { NotificationDisplay } from '@beyonk/svelte-notifications';
	import '$lib/app.css';
	import Header from '$components/view-nav.svelte';
	import store from '$store';
	import { browser } from '$app/environment';
	import _ from 'lodash-es';
	import { navigating, page } from '$app/stores';
	import type { Writable } from 'svelte/store';
	const colorScheme = store.state.colorScheme;
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

	const instruction: Writable<'reset' | 'abort'> = store.g('instruction');

	$: if ($navigating?.to?.url.pathname === base_url + 'files') {
		$instruction = 'abort';
	}

	$: filename = _.last(decodeURIComponent($page.url.searchParams.get('path')||'').split('/'));
</script>

<svelte:head>
	{#key $page.url.pathname}
		{#if $page.url.pathname.includes('view')}
			<title>{filename}</title>
		{/if}
	{/key}
</svelte:head>

<div
	class="w-full min-h-screen mx-auto flex flex-col justify-between bg-gray-200 dark:bg-gray-800 shadow-md"
>
	<div
		class:min-h-screen={$page.url.pathname.includes('embed')}
		class="{$page.url.pathname.includes('media')
			? 'max-h-screen'
			: 'h-full'} flex flex-col flex-grow"
	>
		<Header />
		<slot />
	</div>
</div>

<NotificationDisplay />
