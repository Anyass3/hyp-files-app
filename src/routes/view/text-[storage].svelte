<script context="module">
	import { api } from '$lib/getAPi';
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
		let url = `/textfile?`;
		for (let arg in args) {
			if (args[arg]) url += `&${arg}=${args[arg]}`;
		}
		const resp = await api.get(url);
		let body = resp.body;
		if (args.ctype.includes('json')) body = JSON.stringify(resp.body);

		const filename = args.path.split('/').reverse()[0];
		console.log('resp-text', resp);
		return {
			props: { ctype: args.ctype, body, filename }
		};
	}
</script>

<script>
	export let body = '',
		ctype,
		filename = '';
	// {path,size,ctype,storage,dkey}
	import store from '$store';
	const colorScheme = store.state.colorScheme;
	let render = false;
	// Import markdown-hljs library;
	import { highlightCode } from 'markdown-hljs';
	let file_ext = filename.split('.').reverse()[0];
	const isHtml = filename.includes('html') || (!file_ext && /<[a-z]+>/.exec(body));
	if (isHtml) file_ext = 'html';
	let highlightedCode;

	$: highlightedCode = highlightCode(file_ext, body);
</script>

<div class="flex flex-col">
	<div class="flex justify-around text-lg dark:text-blue-300">
		<div>filetype:{ctype}</div>
		{#if isHtml}
			<div>
				<button
					on:click={() => (render = !render)}
					class="bg-blue-200 p-1 rounded-sm text-lg text-gray-700 active:ring-1 active:ring-blue-300"
					>{render ? 'un' : ''}render html</button
				>
			</div>
		{/if}
		<div>filename:{filename}</div>
	</div>
	<div class="border-t-2 border-gray-600 mt-1 dark:text-blue-200">
		{#if render}
			{@html body}
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
