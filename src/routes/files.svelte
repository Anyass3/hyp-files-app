<script lang="ts">
	import store from '$store';
	import Files from '$components/files.svelte';
	import Search from '$components/search.svelte';
	import { fade } from 'svelte/transition';

	import StorageSelect from '$components/storage-select.svelte';
	import FilesMenu from '$components/files-menu.svelte';
	import SortView from '$components/sort-view.svelte';
	import HomeIcon from 'icons/HomeIcon.svelte';
	import { throttle, getPosition, truncate, InterObserver } from '$lib/utils';
	import Spinner from '$components/spinner.svelte';
	import type { Writable } from 'svelte/store';
	const dkey = store.g('dkey');
	import _ from 'lodash-es';
	const loading: Writable<loading> = store.g('loading');
	const selected: Writable<ToolTip> = store.g('selected');
	const instruction: Writable<'reset' | 'abort'> = store.g('instruction');
	const socket = store.state.socket;
	let pagination = store.state.pagination;
	let canFetchNext = true;
	const isIntersecting = () => {
		if ($pagination.has_next && canFetchNext) {
			$pagination.next();
			const opts = {
				dir,
				...store.g('opts')
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

	const pos = store.g('pos');

	const open: (detail?: Record<string, any>) => Promise<void> = _.debounce(async (detail) => {
		let _instruction = $instruction;
		$instruction = undefined;
		if (_instruction === 'reset') {
			$pagination.page = 0;
			canFetchNext = false;
		} else if (_instruction === 'abort' && store.g('folderItems').get().length) return;
		store.dispatch('open', { ...detail, ...options }).then(() => (canFetchNext = true));
	});
	let filesMenuhidden = true;

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
				$selected = data;
			}
		}
	};

	let dirlist: Array<{ name; path }>;

	$: dirlist = dir.split('/').reduce((arr, name) => {
		let path;
		if (arr.length === 0) path = name || '';
		else if (arr[arr.length - 1].path === '/') path = '/' + name;
		else path = arr[arr.length - 1].path + '/' + name;
		return [...arr, { name: name || 'root', path: path || '/' }];
	}, []);

	$: if ($dkey) {
		open();
	}

	let scrollY = 0;

	let lastScroll = scrollY;
	$: hideFilemenu = scrollY > 0 && scrollY >= lastScroll;
	socket?.on('ready', () => open());
</script>

<svelte:window
	bind:scrollY
	on:scroll|passive={throttle(() => {
		// $hideFilemenu = scrollY > 0 && lastScroll <= scrollY;
		lastScroll = scrollY;
	}, 10000)}
/>
<div
	class="px-2 flex-grow md:px-10 relative pb-6 flex flex-col"
	id="files"
	data-files={true}
	on:contextmenu={setMainContextMenu}
>
	<div
		class:hidden={hideFilemenu}
		class="flex justify-between flex-wrap flex-col-reverse md:flex-row sticky z-30 top-[3.5rem] bg shadow border-b-2"
	>
		<div class="flex text-base md:text-lg flex-wrap gap-[2px]">
			{#if dir === '/'}
				<button class="anchor-tooltip">
					<div class="flex">
						<span
							class="text-blue-500  dark:text-blue-100 dark:active:text-blue-300 active:text-blue-500 cursor-pointer border-2 border-gray-400 dark:border-gray-200 rounded"
							on:click={() => open({ path: '/' })}
							><HomeIcon
								size="1x"
								class="w-[1.35rem] h-[1.35rem] md:h-[1.7rem] md:w-[1.7rem]"
							/></span
						>
						<span class="tooltip" style="position: fixed;left:0;bottom:0">{'root'}</span>
					</div>
				</button>
			{:else}
				{#each dirlist as item}
					<button class="anchor-tooltip">
						<div class="flex">
							<span
								class="text-blue-600 px-1 dark:text-blue-100 dark:active:text-blue-300 active:text-blue-400 cursor-pointer border border-gray-400 dark:border-gray-200 rounded"
								on:click={() => open({ path: item.path })}
							>
								{#if item.name === 'root'}
									<HomeIcon class="w-[1.35rem] h-[1.35rem] md:h-[1.7rem] md:w-[1.7rem]" />
								{:else}
									{truncate(item.name, 10)}
								{/if}
							</span>
							<span class="tooltip" style="position: fixed;left:0;bottom:0">{item.name}</span>
						</div>
					</button>
				{/each}
			{/if}
		</div>
		<div class="flex gap-1 justify-between flex-wrap">
			<Search
				on:search={() => {
					$instruction = 'reset';
					open();
				}}
			/>
			<SortView
				on:change={() => {
					$instruction = 'reset';
					open();
				}}
			/>
			<FilesMenu
				on:toggleHidden={() => {
					$instruction = 'reset';
					open({ silent: true });
				}}
				bind:hidden={filesMenuhidden}
			/>
			<StorageSelect label={false} />
		</div>
	</div>
	<Files on:open={(ev) => open(ev.detail)} />
	{#if $pagination.has_next}
		<div
			class="grid place-items-center transition-opacity "
			use:InterObserver={{
				isIntersecting
			}}
		>
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
