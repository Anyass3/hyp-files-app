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
	import 'tailwindcss/tailwind.css';
	import '$lib/app.css';
	import Header from '$components/nav.svelte';
	import store from '$store';
	import Prompt from '$components/prompt.svelte';
	import { dev, browser } from '$app/env';
	const colorScheme = store.state.colorScheme;
	store.dispatch('initColorScheme');
	import { NavInterObserver } from '$lib/utils';

	$: ((theme) => {
		if (browser) {
			if (theme === 'dark') {
				document.querySelector('html').classList.add('dark');
			} else {
				document.querySelector('html').classList.remove('dark');
			}
		}
	})($colorScheme);
</script>

<Prompt />
<div
	class="w-full min-h-screen mx-auto flex flex-col justify-between bg-gray-100 dark:bg-gray-800 shadow-md"
>
	<div class="h-full flex flex-col flex-grow">
		<Header />
		<span class="w-1 h-1" use:NavInterObserver />
		<slot />
	</div>
</div>

<footer
	class="bg-gradient-to-r from-green-400 to-blue-500 flex flex-col justify-center items-center p-4 "
>
	<!-- hmm -->
</footer>

<style>
	footer a {
		font-weight: bold;
	}

	@media (min-width: 480px) {
		footer {
			padding: 40px 0;
		}
	}
</style>
