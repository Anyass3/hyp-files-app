<script context="module">
	import { api, API } from '$lib/getAPi';
	import { toQueryString } from '$lib/utils';
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
		const args = {
			storage: page.params.storage,
			path: page.query.get('path'),
			ctype: page.query.get('ctype'),
			dkey: page.query.get('dkey'),
			size: page.query.get('size')
		};
		let url = `/textfile` + toQueryString(args);
		const resp = await api.get(url);
		let body = resp.body;
		if (args.ctype.includes('json')) body = JSON.stringify(resp.body);

		const filename = args.path.split('/').reverse()[0];
		console.log('resp-text', resp);
		return {
			props: { ctype: args.ctype, body, filename, url }
		};
	}
</script>

<script>
	export let body = '',
		ctype = '',
		url = '',
		filename = '';
	// {path,size,ctype,storage,dkey}
	import store from '$store';
	const colorScheme = store.g('colorScheme');
	const render = store.g('render');
	import Render from '$components/render.svelte';
	// Import markdown-hljs library;
	import { highlightCode, marked } from 'markdown-hljs';
	const canRender =
		filename.includes('html') || filename.includes('xml') || ctype.includes('markdown');
	let highlightedCode;

	$: {
		try {
			highlightedCode = highlightCode(ctype.replace(/[a-z]+\//, ''), body);
		} catch (error) {
			console.log('language unknown');
		}
	}
</script>

<div class="flex flex-col flex-grow">
	<div class="flex justify-around text-lg dark:text-blue-300">
		<div>Type: {ctype}</div>
		{#if canRender}
			<div>
				<button
					on:click={() => ($render = !$render)}
					class="bg-blue-200 p-1 rounded-sm text-lg text-gray-700 active:ring-1 active:ring-blue-300 capitalize"
					>{$render ? 'un' : ''}render</button
				>
			</div>
		{/if}
		<div>Filename: {filename}</div>
	</div>
	<div class="border-t-2 border-gray-600 mt-1 dark:text-blue-200 flex-grow flex flex-col">
		{#if canRender && $render}
			{#if ctype.includes('markdown')}
				<!-- <div>{@html }</div> -->
				<Render content={marked(body)} />
			{:else}
				<iframe src={API + url} frameborder="0" class="w-full flex-grow" title="filename" />
				<!-- <Render content={body} /> -->
			{/if}
		{:else}
			<pre><code class="hljs">
			{@html highlightedCode}
        </code></pre>
		{/if}
	</div>
</div>

<svelte:head>
	<title>{filename}</title>
	{#if $colorScheme === 'light'}
		<link
			rel="stylesheet"
			href="https://unpkg.com/@highlightjs/cdn-assets@10.6.0/styles/foundation.min.css"
		/>
	{:else}
		<link
			rel="stylesheet"
			href="https://unpkg.com/@highlightjs/cdn-assets@10.6.0/styles/night-owl.min.css"
		/>
	{/if}
</svelte:head>
