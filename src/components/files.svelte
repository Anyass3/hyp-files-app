<script lang="ts">
	import store from '$store';
	import { createEventDispatcher } from 'svelte';
	import { truncate, debounce, getPosition } from '$lib/utils';
	import { scale, fade, slide, crossfade } from 'svelte/transition';
	import { backOut, quadIn, quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import Spinner from '$components/spinner.svelte';
	import FolderIcon from 'icons/FolderIcon.svelte';
	import FileIcon from 'icons/FileIcon.svelte';
	import type { Writable } from 'svelte/store';
	const files = store.g('folder');

	const loading: Writable<loading> = store.g('loading');

	const dispatch = createEventDispatcher();

	function open(path, stat) {
		// if (path && !stat.isFile) $dir = path;
		dispatch('open', {
			...stat,
			path
		});
		// debounce(() => (active = null), 500)();
	}
	function contextMenu(ev, name, path, stat) {
		const pos = getPosition(ev);
		dispatch('contextmenu', { ...stat, path, name, pos });
		// debounce(() => (active = null), 500)();
	}
	const [send, receive] = crossfade({
		duration: (d) => Math.sqrt(d * 200),
		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 600,
				easing: quintOut,
				css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
	});
	// function options(path) {
	// 	if (active === path) active = '';
	// 	else active = path;
	// }
	$: console.log('files', $files);
</script>

<div data-main-menu={true}>
	{#if $loading === 'load-page'}
		<div class="grid place-items-center w-full pt-10">
			<Spinner />
		</div>
	{/if}
	<div
		data-main-menu={true}
		class="flex justify-between gap-2 flex-wrap pt-1"
		class:hidden={$loading === 'load-page'}
	>
		{#if $files?.length}
			{#each $files as { name, path, stat } (path)}
				<div
					in:receive={{ key: path }}
					out:send={{ key: path }}
					animate:flip={{ duration: 50 }}
					on:contextmenu|preventDefault={(ev) => contextMenu(ev, name, path, stat)}
					class="group anchor-tooltip context-menu__item"
					tabindex="-1"
				>
					<div class="relative">
						<button
							class="bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white group-hover:bg-gray-300 rounded-[3px]  dark:group-hover:bg-gray-500 active:ring cursor-pointer w-36 h-32 overflow-hidden"
							on:dblclick={() => open(path, stat)}
						>
							<div class="flex justify-center">
								{#if stat.isFile === true || (stat.isFile !== false && stat.isFile !== 'dir')}
									<FileIcon size="4x" />
								{:else}
									<FolderIcon size="4x" />
								{/if}
							</div>
							<p class="text-semibold text-center select-none dark:text-white">
								{truncate(name)}
							</p>
						</button>
						<!-- {#if active === path}
							<Options {path} {stat} class="hidden group-hover:block" />
						{/if} -->
					</div>
					<div class="tooltip">
						<div class="flex flex-col">
							<span class="text-semibold whitespace-wrap">name: {name}</span>
							<span>size: {stat.size}</span>
							<span>type: {!stat.isFile ? 'folder' : 'file'}</span>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="text-4xl md:text-7xl text-blue-400 dark:text-blue-300 p-3 md:p-4 lg:p-6">
				this folder is empty
			</div>
		{/if}
	</div>
</div>
