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

<script>
	import { NotificationDisplay } from '@beyonk/svelte-notifications';
	import 'tailwindcss/tailwind.css';
	import '$lib/app.css';
	import Header from '$components/view-nav.svelte';
	import store from '$store';
	import { browser } from '$app/env';
	import { getStores, navigating, page, session } from '$app/stores';
	const colorScheme = store.state.colorScheme;
	console.log($page.path.includes('media'));
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
</script>

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
