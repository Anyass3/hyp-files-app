<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
		const args = {
			storage: page.params.storage,
			path: encodeURIComponent(decodeURIComponent(page.query.get('path'))),
			ctype: page.query.get('ctype'),
			dkey: page.query.get('dkey'),
			size: page.query.get('size')
		};
		const url = API + '/file' + toQueryString(args);
		const filename = decodeURIComponent(args.path).split('/').reverse()[0];
		return {
			props: { ctype: args.ctype, url, filename }
		};
	}
</script>

<script>
	export let url, ctype, filename;
	import { API } from '$lib/getAPi';
	import { onDestroy } from 'svelte';
	import { toQueryString } from '$lib/utils';
	onDestroy(() => {
		url = null;
		if (node) node.src = null;
	});
	let node;
</script>

<svelte:head>
	<title>{filename}</title>
</svelte:head>
<embed bind:this={node} src={url} type={ctype} class="flex-grow" />
