<script lang="ts">
	import store from '$store';
	import { createEventDispatcher } from 'svelte';
	import { truncate, debounce, getPosition } from '$lib/utils';
	import { crossfade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Spinner from '$components/spinner.svelte';
	import BottomInfo from '$components/bottom-info.svelte';
	import FolderIcon from 'icons/FolderIcon.svelte';
	import FileIcon from 'icons/FileIcon.svelte';
	import type { Writable } from 'svelte/store';
	const files = store.g('folderItems');

	const loading: Writable<loading | false> = store.g('loading');

	const dispatch = createEventDispatcher();
	const selected: Writable<ToolTip> = store.g('selected');
	const mainEvent = (ev, open = true) => {
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
	const [send, receive] = crossfade({
		duration: (d) => Math.sqrt(d * 100),
		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 400,
				easing: quintOut,
				css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
	});
	$: if ($files) $loading = false;
</script>

<div
	data-files={true}
	class="flex-grow"
	on:dblclick={(ev) => mainEvent(ev)}
	on:click={(ev) => mainEvent(ev, false)}
>
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
		{#each $files || [] as { name, path, stat } (path)}
			<div
				class:selected={$selected?.path === path}
				in:receive={{ key: path }}
				class="group anchor-tooltip context-menu__item border border-no-color bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white group-hover:bg-gray-300 rounded-[3px]  dark:group-hover:bg-gray-500"
				tabindex="-1"
				data-data={JSON.stringify({ ...stat, path, name })}
			>
				<div class="relative">
					<button class="cursor-pointer w-36 h-32 overflow-hidden">
						<div class="flex justify-center">
							{#if stat.isFile === true || (stat.isFile !== false && stat.isFile !== 'dir')}
								<FileIcon size="4x" />
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
