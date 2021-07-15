<script lang="ts">
	import store from '$store';
	import Files from '$components/files.svelte';
	import StorageSelect from '$components/storage-select.svelte';
	import { browser } from '$app/env';
	import { goto } from '$app/navigation';
	import { truncate } from '$lib/utils';
	import { api } from '$lib/getAPi';
	const dkey = store.g('dkey');
	const show_hidden = store.g('show_hidden');
	// let show_hidden = true;
	$: dir = store.g('currentdirs')($dkey, '/');
	$: storage = $dkey !== 'fs' ? 'drive' : 'fs';

	const socket = store.g('socket');
	const files = store.g('folder');
	// console.log('store', store, socket, socket.signal);
	const open = async ({ path, isFile, size }: any = {}) => {
		console.log('path', path);
		if (isFile) {
			const resp = await api.post('/get-file-type', { storage, path, dkey: $dkey });

			if (resp.ok) {
				path = escape(path);
				console.log('resp', resp); // @ts-ignore
				const ctype = resp.body.ctype || '';
				console.log({ storage, path, dkey: $dkey, ctype, size });
				if (ctype.includes('video') || ctype.includes('audio') || ctype.includes('image')) {
					const url = `/view/media-${storage}?dkey=${$dkey}&ctype=${ctype}&size=${size}&path=${path}`;
					goto(url);
				} else if (ctype.includes('text') || ctype.includes('json')) {
					const url = `/view/text-${storage}?dkey=${$dkey}&ctype=${ctype}&size=${size}&path=${path}`;
					goto(url);
				} else if (ctype.includes('pdf')) {
					const url = `/_api/pdf?storage=${storage}&dkey=${$dkey}&ctype=${ctype}&size=${size}&path=${path}`;
					window.open(url, '_blank').focus();
				}
			}
		} else {
			if (path) {
				$dir = path;
			}
			$dir = $dir || '/';
			if (!socket) return;
			if (storage === 'fs') {
				socket.on('ready', () => {
					socket.signal('fs-list', $dir);
				});
				socket.signal('fs-list', $dir);
			} else {
				socket.on('ready', () => {
					socket.signal('drive-list', { dir: $dir, dkey: $dkey });
				});
				socket.signal('drive-list', { dir: $dir, dkey: $dkey });
			}
		}
	};

	let dirlist: Array<{ name; path }>;

	$: dirlist = $dir.split('/').reduce((arr, name) => {
		let path;
		if (arr.length === 0) path = name || '';
		else if (arr[arr.length - 1].path === '/') path = '/' + name;
		else path = arr[arr.length - 1].path + '/' + name;
		return [...arr, { name: name || 'root', path: path || '/' }];
	}, []);

	$: console.log('dkey', $dkey);
	$: console.log('dirlist', dirlist);
	$: console.log('$dir', $dir);

	$: if (browser || $dkey) {
		open();
	}
</script>

<div class="p-2">
	<div class="flex justify-between">
		<div class="flex">
			{#if $dir === '/'}
				<button class="anchor-tooltip">
					<span
						class="text-indigo-400 dark:text-indigo-100 dark:active:text-indigo-300 active:text-indigo-500 cursor-pointer px-1"
						on:dblclick={() => open({ path: '/' })}>root</span
					>
					<span class="tooltip">{'root'}</span>
				</button>
			{:else}
				{#each dirlist as item}
					<button class="anchor-tooltip">
						{#if item.name !== '/'}
							<span>/</span>
						{/if}
						<span
							class="text-indigo-400 dark:text-indigo-100 dark:active:text-indigo-300 active:text-indigo-500 cursor-pointer px-1"
							on:dblclick={() => open({ path: item.path })}>{truncate(item.name)}</span
						>
						<span class="tooltip">{item.name}</span>
					</button>
				{/each}
			{/if}
		</div>
		<button
			><label
				for="#show-hidden"
				class="text-indigo-400 dark:text-indigo-100 dark:active:text-indigo-300 active:text-indigo-500 cursor-pointer px-1"
				>hidden</label
			><input id="show-hidden" type="checkbox" bind:checked={$show_hidden} /></button
		>
		<StorageSelect />
		<!-- <ConnectDrive /> -->
	</div>
	<Files files={$files} on:open={(ev) => open(ev.detail.kwargs)} show_hidden={$show_hidden} />
</div>
