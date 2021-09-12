<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ page, fetch, session, context }) {
		const args = {
			storage: page.params.storage,
			path: encodeURIComponent(decodeURIComponent(page.query.get('path'))),
			ctype: page.query.get('ctype') || 'video',
			dkey: page.query.get('dkey'),
			size: page.query.get('size')
		};
		let url = API + `/${args.ctype.includes('image') ? 'file' : 'media'}` + toQueryString(args);
		const filename = decodeURIComponent(args.path).split('/').reverse()[0];
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
	import { toQueryString } from '$lib/utils';
	import { onDestroy } from 'svelte';
	// {path,size,ctype,storage,dkey}
	// console.log('url', url);

	onDestroy(() => {
		url = null;
	});
</script>

<svelte:head>
	<title>{filename}</title>
</svelte:head>
<div
	in:scale={{ delay: 100, start: 0.8, easing: backOut, duration: 200 }}
	out:scale={{ start: 0.9, easing: quintOut, duration: 100 }}
	class="flex-grow flex justify-center items-center"
>
	{#if ctype?.includes('audio')}
		<!-- svelte-ignore a11y-media-has-caption -->
		<audio id="media" controls autoplay alt={filename}>
			<source src={url} type={ctype} />
			This media file is supported by this browser
		</audio>
	{:else if ctype?.includes('video')}
		<!-- svelte-ignore a11y-media-has-caption -->
		<video id="media" controls autoplay alt={filename}>
			<source src={url} type={ctype.includes('x-matroska') ? 'video/webm' : ctype} />
			This media file is supported by this browser
		</video>
	{:else}
		<img id="media" src={url} alt={filename} />
	{/if}
</div>

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
