<script lang="ts">
	import { browser } from '$app/environment';

	import store from '$store';
	import Select from './Select.svelte';
	export let label = true;
	const serverStore = store.g('serverStore');
	const dkey = store.g('dkey');

	let drives: { name: string; key: string }[];

	$: drives = [
		{ name: 'file system', key: 'fs' },
		...($serverStore?.drives || [])
			.filter((d) => d.connected)
			.map(({ name, key }) => ({
				name,
				key
			}))
	];
	$: if (browser && ($serverStore?.drives || [])?.length) {
		if (!drives.some((drive) => drive.key === $dkey)) {
			$dkey = 'fs';
		}
	}
	$: selected = drives.find((d) => d.key === $dkey);
	$: console.log(selected);
</script>

<div class="p-1">
	{#if label}
		<label class=" text-blue-700 dark:text-blue-300" for="select">storage</label>
	{/if}
	<Select {selected} items={drives} on:change={(ev) => ($dkey = ev.detail)} />
</div>
