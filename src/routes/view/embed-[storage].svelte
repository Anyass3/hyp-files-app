<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session }) {
		const args = {
			storage: page.params.storage,
			path: encodeURIComponent(decodeURIComponent(page.query.get('path'))),
			ctype: page.query.get('ctype'),
			dkey: page.query.get('dkey'),
			size: page.query.get('size')
		};
		const url = API + '/file' + toQueryString(args);
		return {
			props: { ctype: args.ctype, url }
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
