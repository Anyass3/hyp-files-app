<script>
	import store from '$store';
	const serverStore = store.g('serverStore');
	const socket = store.g('socket');
	let cls =
		'mt-2 p-2 rounded bg-gray-100 dark:bg-gray-600 border-gray-200 shadow border-t-2 dark:border-t-0';

	export { cls as class };

	$: child_processes = $serverStore?.child_processes || [];
</script>

<div class={cls}>
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
</div>
