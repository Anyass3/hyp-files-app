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
	import '$lib/app.css';
	import Header from '$components/view-nav.svelte';
	import store from '$store';
	import { browser } from '$app/env';
	import _ from 'lodash-es';
	import { getStores, navigating, page, session } from '$app/stores';
	import type { Writable } from 'svelte/store';
	const colorScheme = store.state.colorScheme;
	const base_url = store.g('base_url');
	// console.log($page.path.includes('media'));
	// store.dispatch('initColorScheme');

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
	$: if ($navigating?.to.path === base_url + 'files') {
		$instruction = 'abort';
	}
	$: filename = _.last(decodeURIComponent($page.query.get('path')).split('/'));
</script>

<svelte:head>
	{#key $page.path}
		{#if $page.path.includes('view')}
			<title>{filename}</title>
		{/if}
	{/key}
</svelte:head>

<div
	class="w-full min-h-screen mx-auto flex flex-col justify-between bg-gray-200 dark:bg-gray-800 shadow-md"
>
	<div
		class:min-h-screen={$page.path.includes('embed')}
		class="{$page.path.includes('media') ? 'max-h-screen' : 'h-full'} flex flex-col flex-grow"
	>
		<Header />
		<slot />
	</div>
</div>

<NotificationDisplay />
