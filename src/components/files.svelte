<script lang="ts">
	import store from '$store';
	import { createEventDispatcher } from 'svelte';
	import { truncate, debounce, getPosition, doubleTap } from '$lib/utils';
	import { crossfade } from 'svelte/transition';
	import _ from 'lodash-es';
	import { quintOut } from 'svelte/easing';
	import Spinner from '$components/spinner.svelte';
	import FIleExtIcon from '$components/fileExtIcon.svelte';
	import BottomInfo from '$components/bottom-info.svelte';
	import FolderIcon from 'icons/FolderIcon.svelte';
	import FileIcon from 'icons/FileIcon.svelte';
	import FileTextIcon from 'icons/FileTextIcon.svelte';
	import MusicIcon from 'icons/MusicIcon.svelte';
	import ImageIcon from 'icons/ImageIcon.svelte';
	// import PDFIcon from '$icons/PDFIcon.svelte';
	import CodeIcon from 'icons/CodeIcon.svelte';
	import FilmIcon from 'icons/FilmIcon.svelte';
	import type { Writable } from 'svelte/store';
	import { extractLang } from '$lib/md-hljs';
	const files = store.g('folderItems');

	const loading: Writable<loading | false> = store.g('loading');

	const dispatch = createEventDispatcher();
	const selected: Writable<ToolTip> = store.g('selected');

	const mainEvent = (ev, open = true) => {
		onDoubletap(ev);
		const element = ev.path.find((el) => el?.dataset?.data);
		if (element) {
			ev.preventDefault();
			const data = JSON.parse(element.dataset.data);
			if (open)
				dispatch('open', {
					...data
				});
			else $selected = data;
		} else {
			$selected = null;
		}
	};
	const onDoubletap = doubleTap(mainEvent);
	const [send, receive] = crossfade({
		duration: (d) => Math.sqrt(d * 50),
		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 200,
				easing: quintOut,
				css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
	});
	$: if ($files) $loading = false;
	// $: console.log($files);
</script>

<div data-files={true} class="flex-grow" on:click={(ev) => mainEvent(ev, false)}>
	{#if $loading === 'load-page'}
		<div class="grid place-items-center w-full pt-10">
			<Spinner />
		</div>
	{/if}
	<div
		class="flex justify-between gap-2 flex-wrap pt-1 pb-[8rem]"
		class:hidden={$loading === 'load-page'}
		data-files={true}
	>
		{#each $files || [] as { name, path, stat } (path + stat.isFile)}
			<div
				class:selected={$selected?.path === path}
				in:receive={{ key: path }}
				class="group anchor-tooltip context-menu__item border border-no-color bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-white group-hover:bg-gray-300 rounded-[3px]  dark:group-hover:bg-gray-500"
				tabindex="-1"
				data-data={JSON.stringify({ ...stat, path, name })}
			>
				<div class="relative">
					<!-- <div class="tooltip -top-8 h-[min-content]">
						<p>{name}</p>
						<p>Type: {stat.isFile ? stat.ctype : 'Folder'}</p>
						<p>
							Modified: {new Date(stat.mtime).toLocaleString('en', {
								dateStyle: 'short',
								timeStyle: 'short'
							})}
						</p>
					</div> -->
					<button class="cursor-pointer w-36 h-32 overflow-hidden">
						<div class="flex justify-center">
							{#if stat.isFile}
								{#if stat.ctype.includes('audio')}
									<MusicIcon size="4x" />
								{:else if stat.ctype.includes('video')}
									<FilmIcon size="4x" />
								{:else if stat.ctype.includes('image')}
									<ImageIcon size="4x" />
								{:else if extractLang(stat.ctype, path)}
									<CodeIcon size="4x" />
								{:else if stat.ctype.includes('text')}
									<FileTextIcon size="4x" />
								{:else if stat.ctype.includes('pdf')}
									<FIleExtIcon size="3x" ext={_.last(path.split('.'))} class="" />
								{:else}
									<FileIcon size="4x" />
								{/if}
							{:else}
								<FolderIcon size="4x" />
							{/if}
						</div>
						<p class="text-semibold text-center select-none dark:text-white break-words p-1">
							{truncate(name)}
						</p>
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>
<BottomInfo />

<style lang="postcss">
	.selected {
		@apply bg-gray-300 border-gray-400;
		border-color: rgba(156, 163, 175, 1) !important;
	}
	:global(.dark) .selected {
		@apply bg-gray-500;
	}
	.border-no-color {
		border-color: transparent;
	}
</style>
