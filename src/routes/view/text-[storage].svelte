<script context="module" lang="ts">
	import { api, API } from '$lib/getAPi';
	import { toQueryString } from '$lib/utils';
	import type { Load } from '@sveltejs/kit';

	const filterPath = (_path) =>
		_path.filter((path, idx) =>
			((idx !== 0 || _path[idx + 1]?.startsWith('/')) && path === '/') || path === './'
				? false
				: path
		);
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export const load: Load = async ({ page, fetch, session }) => {
		let pathList = page.query.getAll('path').map((v) => decodeURIComponent(v));
		pathList = filterPath(pathList);
		let [lastPath, ...dirs] = [...pathList].reverse();
		dirs.reverse();
		const filename = _.last(_.last(pathList).split('/'));
		dirs.push(lastPath.replace(filename, ''));

		dirs = filterPath(dirs);
		const args = {
			storage: page.params.storage,
			dkey: page.query.get('dkey'),
			path: pathList
				.reduce((paths, path) => `${paths}path=${encodeURIComponent(path)}&`, '')
				.replace(/^(path=)/, ''),
			ctype: page.query.get('ctype') || '',
			size: page.query.get('size')
		};

		const dir = dirs
			.reduce((paths, path) => `${paths}path=${encodeURIComponent(path)}&`, '')
			.replace(/(^(path=)|(&$))/g, '');

		let url = `/file` + toQueryString(args);
		return {
			props: {
				...args,
				filename,
				url,
				dir,
				language: page.query.get('language')
			}
		};
	};
</script>

<script lang="ts">
	export let ctype = '',
		url = '',
		filename = '',
		dir = '',
		storage = 'fs',
		language: string,
		dkey = '';
	import _ from 'lodash-es';
	// {path,size,ctype,storage,dkey}
	import store from '$store';
	const colorScheme = store.g('colorScheme');
	const render = store.g('render');
	const canRender = store.g('canRender');
	import Spinner from '$components/spinner.svelte';
	import Render from '$components/render.svelte';
	// Import markdown-hljs library;
	import { extractLang, highlightCode, Markdown } from '$lib/md-hljs';
	import { onDestroy } from 'svelte';
	// import { browser } from '$app/env';
	// if (browser) {
	// 	window['_'] = _;
	// }
	let loading = true;
	let body;
	(async () => {
		const resp = await api.get(url);
		body = resp.body;
		if (ctype.includes('json'))
			if (typeof body !== 'string') body = JSON.stringify(body, undefined, 2);
		loading = false;
	})();

	$: $canRender =
		filename.endsWith('.html') || filename.endsWith('.xml') || filename.endsWith('.md');
	// $: console.log('filename', filename);
	let highlightedCode;

	onDestroy(() => {
		url = null;
	});
	// console.log(language);
	if (!language) language = extractLang(ctype, filename);
	// console.log(language);
	$: {
		highlightedCode = highlightCode(body, language, false);
	}
	$: codeStyle = $colorScheme === 'light' ? '/hljs/foundation.css' : '/hljs/nord.css';
</script>

<div class="flex justify-center flex-grow h-full w-full">
	{#if loading}
		<div class="grid place-items-center w-full pt-10">
			<Spinner size={200} thickness={2} />
		</div>
	{:else}
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
	{/if}
</div>

<svelte:head>
	<link rel="stylesheet" href={codeStyle} />
</svelte:head>
