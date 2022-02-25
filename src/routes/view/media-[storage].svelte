<script context="module">
	/**
	 * @type {import('@sveltejs/kit').Load}
	 */
	export async function load({ url, fetch, params, session }) {
		const args = {
			storage: params.storage,
			path: encodeURIComponent(decodeURIComponent(url.searchParams.get('path'))),
			ctype: url.searchParams.get('ctype') || 'video',
			dkey: url.searchParams.get('dkey'),
			size: url.searchParams.get('size')
			// chucksize: 10000
		};
		let mediaUrl =
			API + `/${args.ctype.includes('image') ? 'file' : 'media'}` + toQueryString(args);
		const filename = decodeURIComponent(args.path).split('/').reverse()[0];
		return {
			props: { ctype: args.ctype, url: mediaUrl, filename }
		};
	}
</script>

<script>
	export let url, ctype, filename;
	import { scale } from 'svelte/transition';
	import { backOut, quintOut } from 'svelte/easing';
	import { API } from '$lib/getAPi';
	import { toQueryString } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import { navigating } from '$app/stores';
	// {path,size,ctype,storage,dkey}
	onDestroy(async () => {
		if (node) node.src = null;
	});
	onMount(async () => {
		if (node) {
			if (!node.src) node.src = url;
		}
	});
	let node;
</script>

<div
	in:scale={{ delay: 100, start: 0.8, easing: backOut, duration: 200 }}
	out:scale={{ start: 0.9, easing: quintOut, duration: 100 }}
	class="flex-grow flex justify-center items-center"
>
	{#if ctype?.includes('audio')}
		<!-- svelte-ignore a11y-media-has-caption -->
		<audio bind:this={node} id="media" controls autoplay alt={filename}>
			<source src={url} type={ctype} />
			This media file is not supported by this browser
		</audio>
	{:else if ctype?.includes('video')}
		<!-- svelte-ignore a11y-media-has-caption -->
		<video bind:this={node} id="media" controls autoplay alt={filename}>
			<source src={url} type={ctype.includes('x-matroska') ? 'video/webm' : ctype} />
			This media file is not supported by this browser
		</video>
		<!-- <VideoPlayer class="media" source={url} width="" height="" /> -->
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
