<script lang="ts">
	import type { PageData } from './$types';
	export let data: PageData;
	import { onDestroy } from 'svelte';
	import { toQueryString } from '$lib/utils';
	import { API } from '$lib/getAPi';

	let embedUrl: string | null = API + '/file' + toQueryString(data);
	onDestroy(() => {
		embedUrl = null;
		if (node) (node.src as any) = null;
	});
	let node: HTMLEmbedElement;
</script>

<embed bind:this={node} src={embedUrl} type={data.ctype} class="flex-grow" />
