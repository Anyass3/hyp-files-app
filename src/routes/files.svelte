<script lang="ts">
	import store from '$store';
	import Files from '$components/files.svelte';
	import StorageSelect from '$components/storage-select.svelte';
	import { browser } from '$app/env';
	import FolderIcon from 'icons/FolderIcon.svelte';
	import { goto } from '$app/navigation';
	import { throttle, debounce, getPosition, truncate, InterObserver } from '$lib/utils';
	import Spinner from '$components/spinner.svelte';
	import type { Writable } from 'svelte/store';
	import { onMount } from 'svelte';
	const dkey = store.g('dkey');
	const loading: Writable<loading> = store.g('loading');
	const show_hidden = store.g('show_hidden');
	// const hideFilemenu = store.g('hideFilemenu');
	let pagination = store.state.pagination;
	const isIntersecting = () => {
		if ($pagination.has_next) {
			// console.log('is intersecting', { ...pagination, offset: pagination.offset });
			$pagination.next();
			const opts = {
				dir,
				offset: $pagination.offset,
				page: $pagination.page,
				show_hidden: $show_hidden
			};
			if (storage === 'drive') opts['dkey'] = $dkey;
			store.state.socket.signal(`${storage}-list`, opts);
			$loading = 'load-next-page';
		}
	};
	$: dirs = store.g('dirs', $dkey);

	$: dir = $dirs[$dkey];
	$: storage = $dkey !== 'fs' ? 'drive' : 'fs';

	$: options = { dkey: $dkey, dir, storage };

	// const socket = store.g('socket');

	const pos = store.g('pos');

	const open = async (detail: any = {}) => {
		// if (detail.path && !detail.isFile) $dir = detail.path;
		console.log('options', options);
		store.dispatch('open', { ...detail, ...options });
	};

	const setMainContextMenu = async (ev) => {
		if (ev.target.dataset?.files) {
			ev.preventDefault();
			$pos = getPosition(ev);
			const name = options.dir.endsWith('/')
				? options.dir.split('/').reverse()[1]
				: options.dir.split('/').reverse()[0];
			store.dispatch('setupMainMenuItems', { ...options, name });
		} else {
			const element = ev.path.find((el) => el?.dataset?.data);
			if (element) {
				ev.preventDefault();
				$pos = getPosition(ev);
				const data = JSON.parse(element.dataset.data);
				store.dispatch('setupMenuItems', { ...data, ...options });
			}
		}
	};

	let dirlist: Array<{ name; path }>;

	$: dirlist = dir.split('/').reduce((arr, name) => {
		// console.log(arr, name);
		let path;
		if (arr.length === 0) path = name || '';
		else if (arr[arr.length - 1].path === '/') path = '/' + name;
		else path = arr[arr.length - 1].path + '/' + name;
		return [...arr, { name: name || 'root', path: path || '/' }];
	}, []);

	// $: console.log('dkey', $dkey);
	// $: console.log('dirlist', dirlist);
	// $: console.log('$loading', $loading);

	$: if ($dkey || $show_hidden) {
		open();
	}
	onMount(() => open());
	let scrollY = 0;
	let lastScroll = scrollY;
	$: hideFilemenu = scrollY > 0 && scrollY >= lastScroll;
</script>

<svelte:window
	bind:scrollY
	on:scroll|passive={throttle(() => {
		// $hideFilemenu = scrollY > 0 && lastScroll <= scrollY;
		lastScroll = scrollY;
	}, 10000)}
/>

<svelte:head>
	<title>Files</title>
</svelte:head>

<div
	class="px-2 flex-grow md:px-10 relative pb-2 flex flex-col"
	id="files"
	data-files={true}
	on:contextmenu={setMainContextMenu}
>
	<div
		class:hidden={hideFilemenu}
		class="flex justify-between flex-wrap flex-col-reverse md:flex-row sticky z-30 top-[7%] bg shadow border-b-2 pb-1"
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
							<span
								class="text-blue-600 dark:text-blue-100 dark:active:text-blue-300 active:text-blue-400 cursor-pointer border-2 border-gray-400 dark:border-gray-200 rounded"
								on:click={() => open({ path: item.path })}
							>
								{#if item.name === 'root'}
									<FolderIcon class=" w-6 h-6 md:h-8 md:w-8" />
								{:else}
									{truncate(item.name, 10)}
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
	<Files on:open={(ev) => open(ev.detail)} />
	<div
		class="w-full h-1"
		use:InterObserver={{
			isIntersecting
		}}
	/>
	{#if $pagination.has_next}
		<div class="grid place-items-center">
			{#if $loading === 'load-next-page'}
				<div class="grid place-items-center w-full pt-10">
					<Spinner />
				</div>
			{:else if !$loading}
				<button
					on:click={isIntersecting}
					class="btn bg-blue-500 text-white p-2 m-2 dark:bg-blue-200 dark:text-gray-500"
					>next</button
				>
			{/if}
		</div>
	{/if}
</div>
