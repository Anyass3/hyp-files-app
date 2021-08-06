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
			<label class="  " for="input#name">Drive Name</label><br />
			<input id="name" bind:value={name} class="dark:ring-gray-400" placeholder="awesome" />
		</div>
		<div class="">
			<label class="  " for="input#key">Drive Key</label><br />
			<input id="key" bind:value={key} class="dark:ring-gray-400" placeholder="[a-z0-9]{'{64}'}" />
		</div>
		<div class="">
			<label class=" " for="input#host">Drive Host</label><br />
			<input
				id="host"
				class="dark:ring-gray-400"
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
			class="text-white mr-1 p-2 rounded-md text-xl active:ring ring-blue-500 dark:ring-gray-500  bg-blue-600 dark:bg-gray-600"
			>Add Drive</button
		>
		<button
			on:click={() => {
				socket.signal('connect-drive', { name, key, host });
				clear();
			}}
			class="text-white mr-1 p-2  rounded-md text-xl active:ring ring-blue-500 dark:ring-gray-500  bg-blue-600 dark:bg-gray-600"
			>Connect Drive</button
		>
	</div>
</div>

<style lang="postcss">
	input {
		@apply bg-gray-50 p-2 rounded-sm text-lg text-gray-900 font-semibold focus:ring ring-blue-400  focus:outline-none border;
	}
</style>
