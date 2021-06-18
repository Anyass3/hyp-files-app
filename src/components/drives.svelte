<script>
	import store from '$store';
	const serverStore = store.g('serverStore');
	const socket = store.g('socket');

	$: drives = $serverStore?.drives || [];
	$: savedDrives = $serverStore?.savedDrives || [];
	// $: connectedDrives = drives.reduce((arr, drive) => [...arr, drive?.key], []);
	console.log('serverStore', $serverStore);
</script>

<div class=" mt-2 p-2 rounded-sm  bg-blue-200 dark:bg-gray-600 dark:text-blue-300">
	<h3 class="text-semibold text-2xl">saved drives</h3>
	{#each savedDrives as { name, key, connected, host } (key)}
		<div class="flex justify-between mt-1">
			<div>{name}</div>
			<div class="flex gap-1">
				{#if !['public', 'private'].includes(name)}
					<button
						on:click={() => socket.signal('delete-drive', { key, name })}
						class="bg-red-100 p-1 mx-1 active:ring-1 rounded-md text-red-500">delete</button
					>
				{/if}
				{#if connected}
					<button
						on:click={() => socket.signal('close-drive', { key, name })}
						class="bg-red-100 p-1 mx-1 active:ring-1 rounded-md text-red-500">off</button
					>
					<button class="bg-green-100 p-1 rounded-sm text-green-500">connected</button>
				{:else}
					<button
						on:click={() => socket.signal('connect-drive', { key, name, host })}
						class="bg-green-100 p-1 mx-1 active:ring-1 rounded-md text-green-500">on</button
					>
					<button class="bg-red-100 p-1 rounded-sm text-red-500">not connected</button>
				{/if}
			</div>
		</div>
	{/each}
</div>
<div class="mt-2  p-2 rounded-sm bg-blue-200 dark:bg-gray-600 dark:text-blue-300">
	<h3 class="text-semibold text-2xl">connected drives</h3>
	{#each drives as { name, key } (key)}
		<div class="flex justify-between mt-1">
			<div>{name}</div>
			<div class="flex gap-1">
				{#if !savedDrives.find((drive) => drive.key === key)}
					<button
						on:click={() => socket.signal('save-drive', { key, name })}
						class="bg-blue-100 p-1 mx-1 active:ring-1 rounded-md text-blue-500">save</button
					>
				{/if}
				<button
					on:click={() => socket.signal('close-drive', { key, name })}
					class="bg-red-100 p-1 mx-1 active:ring-1 rounded-md text-red-500">disconnect</button
				>
			</div>
		</div>
	{/each}
</div>
