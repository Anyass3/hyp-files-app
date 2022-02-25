<script>
	import { copyToClipboard, doubleTap } from '$lib/utils';

	import store from '$store';
	const snackBar = store.g('snackBar');
	const serverStore = store.g('serverStore');
	const socket = store.g('socket');
	import Spinner from '$components/spinner.svelte';
	import _ from 'lodash-es';

	$: downloading = $serverStore?.downloading || [];
	const downloadingProgress = store.g('downloadingProgress');
	$: console.log(downloading, $downloadingProgress);

	$: getDriveName = (dkey) => ($serverStore?.drives || []).find((drive) => drive.key == dkey)?.name;
</script>

<div
	class="p-2 rounded-lg border-gray-500 shadow-sm border-[.3px] text-gray-800 text-xl  dark:text-blue-100"
>
	<h3 class="text-blue-500 dark:text-white text-3xl">Downloading</h3>
	{#each downloading as { filename, path, url, dkey } (url)}
		<div
			class="flex flex-col gap-4 mt-1 bg-blue-100 p-1 rounded dark:bg-gray-700 ring-blue-200 dark:ring-gray-600 flex-wrap"
		>
			<div class="flex justify-between gap-4">
				<div class="flex gap-4 text-xs">
					<div class="uppercase">saving in</div>
					<div class="text-blue-600">{_.last(path.split('/')) || '/'} ({getDriveName(dkey)})</div>
				</div>
				<div>filename: {filename}</div>
			</div>
			<div class="flex justify-between gap-4">
				<div>
					URL: <span
						class:select-text={!$downloadingProgress[url]}
						class="select-text text-lg text-blue-400">{url.slice(0, 20)}...</span
					>
				</div>
				<div class="bg-green-200 p-1 rounded text-green-700 flex items-center">
					{#if $downloadingProgress[url]}
						{$downloadingProgress[url]}
					{:else}
						<Spinner size={25} thickness={4} />
					{/if}
				</div>
				<button
					class="text-white bg-red-500 btn"
					on:click={() => socket.signal('cancel-downloading', { url })}>Cancel</button
				>
			</div>
		</div>
	{/each}
	{#if !downloading.length}
		<p class="dark:text-gray-100">Not downloading any file(s)</p>
	{/if}
</div>
