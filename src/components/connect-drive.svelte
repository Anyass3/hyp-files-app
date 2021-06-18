<script>
	import store from '$store';
	const socket = store.g('socket');
	let key, name, host;
	const clear = () => {
		name = '';
		key = '';
		host = '';
	};
	clear();
</script>

<div>
	<div class="flex gap-2 flex-wrap">
		<div class="">
			<label class=" text-indigo-900 text-lg dark:text-blue-300" for="input#name">Drive Name</label
			><br />
			<input
				id="name"
				class="p-2 rounded-sm text-lg text-gray-900 text-semibold focus:ring focus:outline-none"
				bind:value={name}
				placeholder="awesome"
			/>
		</div>
		<div class="">
			<label class=" text-indigo-900 text-lg dark:text-blue-300" for="input#key">Drive Key</label
			><br />
			<input
				id="key"
				class="p-2 rounded-sm text-lg text-gray-900 text-semibold focus:ring focus:outline-none"
				bind:value={key}
				placeholder="[a-z0-9]{'{64}'}"
			/>
		</div>
		<div class="">
			<label class=" text-indigo-900 text-lg dark:text-blue-300" for="input#host">Drive Host</label
			><br />
			<input
				id="host"
				class="p-2 rounded-sm text-lg text-gray-900 text-semibold focus:ring focus:outline-none"
				bind:value={host}
				placeholder="HYPERSPACE_SOCKET"
			/>
		</div>
	</div>
	<div class="flex pt-1">
		<button
			on:click={() => {
				socket.signal('add-drive', { name, key, host });
				clear();
			}}
			class="text-black mr-1 p-2 rounded-md text-lg active:ring-1 dark:text-blue-300 bg-blue-400 dark:bg-gray-500"
			>add drive</button
		>
		<button
			on:click={() => {
				socket.signal('connect-drive', { name, key, host });
				clear();
			}}
			class="text-black mr-1 p-2  rounded-md text-lg active:ring-1 dark:text-blue-300 bg-blue-400 dark:bg-gray-500"
			>connect drive</button
		>
	</div>
</div>
