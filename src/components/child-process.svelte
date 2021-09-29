<script>
	import store from '$store';
	const serverStore = store.g('serverStore');
	const socket = store.g('socket');

	$: child_processes = $serverStore?.child_processes || [];
</script>

<div
	class="mt-2  p-2 rounded-lg border-gray-500 shadow-sm border-[.3px] text-gray-800 text-xl  dark:text-blue-100"
>
	<h3 class="text-blue-500 dark:text-white text-3xl">child process</h3>
	{#each child_processes as { pid, cm } (pid)}
		<div
			class="flex justify-between mt-1 bg-blue-100 p-1 rounded dark:bg-gray-700 ring-blue-200 dark:ring-gray-600"
		>
			<div>{cm}</div>
			<div>{pid}</div>
			<button
				class="text-white bg-red-500 btn"
				on:click={() => socket.signal('child-process:kill', pid)}>kill</button
			>
		</div>
	{/each}
	{#if !child_processes.length}
		<p class="dark:text-gray-100">No app child_process running</p>
	{/if}
</div>
