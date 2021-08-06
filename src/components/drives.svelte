<script>
	import store from '$store';
	const serverStore = store.g('serverStore');
	const socket = store.g('socket');
	let cls =
		'mt-2 p-2 rounded bg-gray-100 dark:bg-gray-600 border-gray-200 shadow border-t-2 dark:border-t-0';

	export { cls as class };

	$: drives = $serverStore?.drives || [];
	$: savedDrives = $serverStore?.savedDrives || [];
	// $: connectedDrives = drives.reduce((arr, drive) => [...arr, drive?.key], []);
	console.log('serverStore', $serverStore);
</script>

<div class={cls}>
	<h3 class="text-blue-500 dark:text-white text-3xl">Saved Drives</h3>
	{#each savedDrives as { name, key, connected, host } (key)}
		<div
			class="flex justify-between mt-1 bg-blue-100 p-1 rounded dark:bg-gray-700 active:ring-1 ring-blue-200 dark:ring-gray-600"
		>
			<div>{name}</div>
			<div class="flex gap-1">
				{#if !['public', 'private'].includes(name)}
					<button
						on:click={() => socket.signal('delete-drive', { key, name })}
						class="bg-red-200 p-1 mx-1 active:ring-1 rounded-md text-red-700">delete</button
					>
				{/if}
				{#if connected}
					<button
						on:click={() => socket.signal('close-drive', { key, name })}
						class="bg-red-200 p-1 mx-1 active:ring-1 rounded-md text-red-700">off</button
					>
					<button class="bg-green-200 p-1 rounded-sm text-green-700">connected</button>
				{:else}
					<button
						on:click={() => socket.signal('connect-drive', { key, name, host })}
						class="bg-green-200 p-1 mx-1 active:ring-1 rounded-md text-green-700">on</button
					>
					<button class="bg-red-200 p-1 rounded-sm text-red-700">not connected</button>
				{/if}
			</div>
		</div>
	{/each}
</div>
<div class={cls}>
	<h3 class="text-blue-500 dark:text-white text-3xl">Connected Drives</h3>
	{#each drives as { name, key, host } (key)}
		<div
			class="flex justify-between mt-1 bg-blue-100 p-1 rounded dark:bg-gray-700 active:ring-1 ring-blue-200 dark:ring-gray-600"
		>
			<div>{name}</div>
			<div class="flex gap-1">
				{#if !savedDrives.find((drive) => drive.key === key)}
					<button
						on:click={() => socket.signal('save-drive', { key, name, host })}
						class="bg-blue-200 p-1 mx-1 active:ring-1 rounded-md text-blue-700">save</button
					>
				{/if}
				<button
					on:click={() => socket.signal('close-drive', { key, name })}
					class="bg-red-200 p-1 mx-1 active:ring-1 rounded-md text-red-700">disconnect</button
				>
			</div>
		</div>
	{/each}
</div>
