<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
		const args = {
			storage: page.params.storage,
			path: escape(page.query.get('path')),
			ctype: page.query.get('ctype'),
			dkey: page.query.get('dkey'),
			size: page.query.get('size')
		};
		const url =
			API +
			`/pdf?storage=${args.storage}&dkey=${args.dkey}&ctype=${args.ctype}&size=${args.size}&path=${args.path}`;
		// for (let arg in args) {
		// 	if (args[arg]) url += `&${arg}=${args[arg]}`;
		// }
		const filename = args.path.split('/').reverse()[0];
		return {
			props: { ctype: args.ctype, url, filename }
		};
	}
</script>

<script>
	export let url, ctype, filename;
	import { scale } from 'svelte/transition';
	import { backOut, quintOut } from 'svelte/easing';
	import { API } from '$lib/getAPi';

	// {path,size,ctype,storage,dkey}
</script>

<svelte:head>
	<title>{filename}</title>
</svelte:head>
<embed src={url} type={ctype} class="flex-grow" />

<style>
	#media {
		position: absolute;
		top: 0px;
		right: 0px;
		bottom: 0px;
		left: 0px;
		max-height: 100%;
		max-width: 100%;
		margin: auto;
	}
</style>
