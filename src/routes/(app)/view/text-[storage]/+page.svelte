<script lang="ts">
	import _ from 'lodash-es';
	import store from '$store';
	const colorScheme = store.g('colorScheme');
	const render = store.g('render');
	const canRender = store.g('canRender');
	import Spinner from '$components/spinner.svelte';
	import Render from '$components/render.svelte';
	// Import markdown-hljs library;
	import { extractLang, highlightCode, Markdown } from '$lib/md-hljs';
	import { onDestroy } from 'svelte';
	import { api } from '$lib/getAPi';
	import type { PageData } from './$types';

	export let data: PageData;

	let loading = true;
	let body: string;

	(async () => {
		const resp = await api.get(data.url);
		body = resp.body;
		if (data.ctype.includes('json'))
			if (typeof body !== 'string') body = JSON.stringify(body, undefined, 2);
		loading = false;
	})();

	$: $canRender =
		data.filename.endsWith('.html') ||
		data.filename.endsWith('.xml') ||
		data.filename.endsWith('.md');
	// $: console.log('filename', filename);
	let highlightedCode: string;

	onDestroy(() => {
		(data.url as any) = null;
	});

	$: {
		highlightedCode = highlightCode(
			body,
			data.language || extractLang(data.ctype, data.filename),
			false
		);
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
			class="flex flex-col flex-grow h-full px-2 {$render && data.filename.endsWith('.md')
				? 'max-w-[min(64rem,100%)]'
				: 'max-w-full'}"
		>
			<div class="mt-1 dark:text-blue-200 flex-grow flex flex-col">
				{#if $canRender && $render}
					{#if data.filename.endsWith('.md')}
						<Render
							content={Markdown(body)}
							{codeStyle}
							storage={data.storage}
							dkey={data.dkey}
							dir={data.dir}
						/>
					{:else}
						<Render content={body} storage={data.storage} dkey={data.dkey} dir={data.dir} />
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
