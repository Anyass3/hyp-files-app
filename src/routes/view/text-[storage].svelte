<script context="module">
	import { api, API } from '$lib/getAPi';
	import { toQueryString } from '$lib/utils';
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
		const args = {
			storage: page.params.storage,
			dkey: page.query.get('dkey'),
			path: encodeURIComponent(decodeURIComponent(page.query.get('path'))),
			ctype: page.query.get('ctype') || '',
			size: page.query.get('size')
		};
		let url = `/file` + toQueryString(args);
		const resp = await api.get(url);
		let body = resp.body;
		if (args.ctype.includes('json')) body = JSON.stringify(resp.body);
		const filename = _.last(decodeURIComponent(args.path).split('/'));
		const dir = decodeURIComponent(args.path).replace(filename, '');
		return {
			props: { ...args, body, filename, url, dir }
		};
	}
</script>

<script lang="ts">
	export let body = '',
		ctype = '',
		url = '',
		filename = '',
		dir = '',
		storage = 'fs',
		dkey = '';
	import _ from 'lodash';
	// {path,size,ctype,storage,dkey}
	import store from '$store';
	const colorScheme = store.g('colorScheme');
	const render = store.g('render');
	const canRender = store.g('canRender');
	import Render from '$components/render.svelte';
	// Import markdown-hljs library;
	import Markdown, { highlightCode } from 'markdown-hljs';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/env';
	if (browser) {
		window['_'] = _;
	}
	$: $canRender =
		filename.endsWith('.html') || filename.endsWith('.xml') || filename.endsWith('.md');
	$: console.log('filename', filename);
	let highlightedCode;

	onDestroy(() => {
		url = null;
	});

	$: {
		highlightedCode = highlightCode(
			ctype.includes('plain')
				? 'plaintext'
				: ctype.replace(/[a-z]+\//, '') || _.last(filename.split('.')),
			body
		);
	}
	$: codeStyle =
		$colorScheme === 'light'
			? 'https://unpkg.com/@highlightjs/cdn-assets@10.6.0/styles/foundation.min.css'
			: 'https://unpkg.com/@highlightjs/cdn-assets@10.6.0/styles/night-owl.min.css';
</script>

<div class="flex justify-center flex-grow h-full w-full">
	<div
		class="flex flex-col flex-grow h-full px-2 {$render && filename.endsWith('.md')
			? 'max-w-[min(64rem,100%)]'
			: 'max-w-full'}"
	>
		<div class="mt-1 dark:text-blue-200 flex-grow flex flex-col">
			{#if $canRender && $render}
				{#if filename.endsWith('.md')}
					<!-- <div>{@html }</div> -->
					<Render content={Markdown(body)} {codeStyle} {storage} {dkey} {dir} />
				{:else}
					<Render content={body} {storage} {dkey} {dir} />
				{/if}
			{:else}
				<pre><code class="hljs">
			{@html highlightedCode}
        </code></pre>
			{/if}
		</div>
	</div>
</div>

<svelte:head>
	<title>{filename}</title>
	<link rel="stylesheet" href={codeStyle} />
</svelte:head>
