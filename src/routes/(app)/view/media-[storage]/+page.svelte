<script lang="ts">
	import { scale } from 'svelte/transition';
	import { backOut, quintOut } from 'svelte/easing';
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { API } from '$lib/getAPi';
	import { toQueryString } from '$lib/utils';

	export let data: PageData;

	$: if (!data.ctype) data.ctype = 'video';

	const mediaUrl =
		API + `/${data.ctype?.includes('image') ? 'file' : 'media'}` + toQueryString(data);
	const filename = decodeURIComponent(data.path).split('/').reverse()[0];

	onDestroy(async () => {
		if (node) (node.src as any) = null;
	});
	onMount(async () => {
		if (node) {
			if (!node.src) node.src = mediaUrl;
		}
	});
	let node: HTMLAudioElement;
</script>

<div
	in:scale={{ delay: 100, start: 0.8, easing: backOut, duration: 200 }}
	out:scale={{ start: 0.9, easing: quintOut, duration: 100 }}
	class="flex-grow flex justify-center items-center"
>
	{#if data.ctype?.includes('audio')}
		<!-- svelte-ignore a11y-media-has-caption -->
		<audio bind:this={node} id="media" controls autoplay alt={filename}>
			<source src={mediaUrl} type={data.ctype} />
			This media file is not supported by this browser
		</audio>
	{:else if data.ctype?.includes('video')}
		<!-- svelte-ignore a11y-media-has-caption -->
		<video bind:this={node} id="media" controls autoplay alt={filename}>
			<source src={mediaUrl} type={data.ctype.includes('x-matroska') ? 'video/webm' : data.ctype} />
			This media file is not supported by this browser
		</video>
		<!-- <VideoPlayer class="media" source={mediaUrl} width="" height="" /> -->
	{:else}
		<img id="media" src={mediaUrl} alt={filename} />
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
