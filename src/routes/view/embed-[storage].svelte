<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ url, fetch, params, session }) {
		const args = {
			storage: params.storage,
			path: encodeURIComponent(decodeURIComponent(url.searchParams.get('path'))),
			ctype: url.searchParams.get('ctype'),
			dkey: url.searchParams.get('dkey'),
			size: url.searchParams.get('size')
		};
		const embedUrl = API + '/file' + toQueryString(args);
		return {
			props: { ctype: args.ctype, url: embedUrl }
		};
	}
</script>

<script>
	export let url, ctype;
	import { API } from '$lib/getAPi';
	import { onDestroy } from 'svelte';
	import { toQueryString } from '$lib/utils';
	onDestroy(() => {
		url = null;
		if (node) node.src = null;
	});
	let node;
</script>

<embed bind:this={node} src={url} type={ctype} class="flex-grow" />
