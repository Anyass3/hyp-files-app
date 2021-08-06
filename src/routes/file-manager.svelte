<script lang="ts">
	import store from '$store';
	import Files from '$components/files.svelte';
	import StorageSelect from '$components/storage-select.svelte';
	import { browser } from '$app/env';
	import FolderIcon from 'icons/FolderIcon.svelte';
	import { goto } from '$app/navigation';
	import { throttle, debounce, getPosition, truncate } from '$lib/utils';
	import { api } from '$lib/getAPi';
	import NavItems from '$components/navItems.svelte';
	const dkey = store.g('dkey');
	const show_hidden = store.g('show_hidden');
	const hideFilemenu = store.g('hideFilemenu');
	$: dirs = store.g('dirs', $dkey);
	$: console.log('dirs', $dirs);

	// let show_hidden = true;

	$: dir = $dirs[$dkey];
	$: storage = $dkey !== 'fs' ? 'drive' : 'fs';

	$: options = { dkey: $dkey, dir, storage };

	// const socket = store.g('socket');
	const files = store.g('folder');

	const pos = store.g('pos');
	// console.log('store', store, socket, socket.signal);
	const open = async (detail: any = {}) => {
		// if (detail.path && !detail.isFile) $dir = detail.path;
		store.dispatch('open', { ...detail, ...options });
	};

	const setContextMenu = async (data: ContextMenuEventDetail) => {
		$pos = data.pos;
		store.dispatch('setupMenuItems', { ...data, ...options });
	};
	const setMainContextMenu = async (ev) => {
		if (ev.target.id === 'file-manager') {
			ev.preventDefault();
			$pos = getPosition(ev);
			const name = options.dir.endsWith('/')
				? options.dir.split('/').reverse()[1]
				: options.dir.split('/').reverse()[0];
			store.dispatch('setupMainMenuItems', { ...options, name });
		}
	};

	let dirlist: Array<{ name; path }>;

	$: dirlist = dir.split('/').reduce((arr, name) => {
		console.log(arr, name);
		let path;
		if (arr.length === 0) path = name || '';
		else if (arr[arr.length - 1].path === '/') path = '/' + name;
		else path = arr[arr.length - 1].path + '/' + name;
		return [...arr, { name: name || 'root', path: path || '/' }];
	}, []);

	$: console.log('dkey', $dkey);
	$: console.log('dirlist', dirlist);
	$: console.log('$dir', dir);

	$: if (browser || $dkey) {
		open();
	}
	let scrollY = 0;
	let lastScroll = scrollY;
</script>

<svelte:window
	bind:scrollY
	on:scroll|passive={throttle(() => {
		$hideFilemenu = scrollY > 0 && lastScroll <= scrollY;
		lastScroll = scrollY;
	}, 10000)}
/>

<div class="px-2 flex-grow md:px-10 relative" id="file-manager" on:contextmenu={setMainContextMenu}>
	<div
		class:hidden={scrollY > lastScroll}
		class="flex justify-between flex-wrap flex-col-reverse md:flex-row sticky z-10 top-[7%] md:top-[13%] bg-white dark:bg-gray-800 shadow border-b-2 pb-1"
	>
		<div class="flex text-base md:text-2xl overflow-x-auto gap-1">
			{#if dir === '/'}
				<button class="anchor-tooltip">
					<div class="flex">
						<span
							class="text-blue-500  dark:text-blue-100 dark:active:text-blue-300 active:text-blue-500 cursor-pointer border-2 border-gray-400 dark:border-gray-200 rounded"
							on:click={() => open({ path: '/' })}
							><FolderIcon size="1x" class=" w-6 h-6 md:h-8 md:w-8" /></span
						>
						<span class="tooltip">{'root'}</span>
					</div>
				</button>
			{:else}
				{#each dirlist as item}
					<button class="anchor-tooltip">
						<div class="flex">
							<!-- {#if item.name !== '/'}
								<span class="text-gray-900 dark:text-gray-200 text-3xl">/</span>
							{/if} -->
							<span
								class="text-blue-600 dark:text-blue-100 dark:active:text-blue-300 active:text-blue-400 cursor-pointer border-2 border-gray-400 dark:border-gray-200 rounded"
								on:click={() => open({ path: item.path })}
							>
								{#if item.name === 'root'}
									<FolderIcon class=" w-6 h-6 md:h-8 md:w-8" />
								{:else}
									{truncate(item.name)}
								{/if}
							</span>
							<span class="tooltip">{item.name}</span>
						</div>
					</button>
				{/each}
			{/if}
		</div>
		<div class="flex gap-1">
			<button
				><label
					for="show-hidden"
					class="text-blue-600 text-2xl dark:text-blue-100 dark:active:text-blue-300 active:text-blue-400 cursor-pointer px-1"
					>hidden</label
				><input id="show-hidden" type="checkbox" bind:checked={$show_hidden} /></button
			>
			<StorageSelect />
			<!-- <ConnectDrive /> -->
		</div>
	</div>
	<Files
		on:contextmenu={({ detail }) => setContextMenu(detail)}
		files={$files}
		on:open={(ev) => open(ev.detail)}
		show_hidden={$show_hidden}
	/>
</div>
