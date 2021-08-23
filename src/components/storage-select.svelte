<script>
	import { browser } from '$app/env';

	import store from '$store';
	const serverStore = store.g('serverStore');
	const dkey = store.g('dkey');
	$: drives = [...($serverStore?.drives || []), { name: 'file system', key: 'fs' }];
	$: if (browser && drives?.length) {
		if (!drives.some((drive) => drive.key === $dkey)) {
			$dkey = 'fs';
		}
	}
</script>

<div class="p-1">
	<label class=" text-blue-700 dark:text-blue-300" for="select">storage</label>
	<select
		bind:value={$dkey}
		class="w-full border bg-gray-100 focus:bg-gray-50 rounded px-3 py-2 outline-none"
	>
		{#each drives as { key, name }}
			<option class="py-1" value={key}>{name}</option>
		{/each}
	</select>
</div>
