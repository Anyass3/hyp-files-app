<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { truncate, debounce } from '$lib/utils';
	import Options from '$components/options.svelte';
	import { FolderIcon, FileIcon } from 'svelte-feather-icons';
	export let files = [];
	export let show_hidden = false;
	$: _files = files;
	let active;

	$: (async (show_hidden) => {
		console.log('show-hidden', show_hidden);
		if (!show_hidden) {
			_files = files.filter((file) => !/^\./.exec(file.name));
		} else _files = files;
	})(show_hidden);
	const dispatch = createEventDispatcher();

	function open(path, stat) {
		dispatch('open', {
			kwargs: { ...stat, path }
		});
		debounce(() => (active = null), 500)();
	}
	function options(path) {
		active = path;
	}
	$: console.log('active', active);
</script>

<div>
	<div class="flex justify-start gap-2 flex-wrap pt-1 border-t-2 border-gray-400">
		{#if files.length > 0}
			{#each _files as { name, path, stat }}
				<div class="group anchor-tooltip" tabindex="-1" on:click={debounce(() => (active = path))}>
					<div class="relative">
						<button
							class="bg-gray-400 group-hover:bg-gray-300 rounded-[3px]  dark:group-hover:bg-gray-500 active:ring cursor-pointer w-36 h-24 overflow-hidden"
							on:dblclick={() => open(path, stat)}
						>
							<div class="flex justify-center">
								{#if stat.isFile}
									<FileIcon size="4x" />
								{:else}
									<FolderIcon size="4x" />
								{/if}
							</div>
							<p class="text-semibold text-center select-none">{truncate(name)}</p>
						</button>
						{#if active === path}
							<Options {path} {stat} class="hidden group-hover:block" />
						{/if}
					</div>
					<div class="tooltip">
						<div class="flex flex-col">
							<span class="text-semibold">name: {name}</span>
							<span>size: {stat.size}</span>
							<span>type: {!stat.isFile ? 'folder' : 'file'}</span>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="text-3xl text-indigo-400 dark:text-indigo-300">this folder is empty</div>
		{/if}
	</div>
</div>
