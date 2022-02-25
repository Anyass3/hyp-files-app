<script lang="ts">
	import store from '$store';
	const socket = store.g('socket');
	let key, name, _private: boolean, storage;
	const clear = () => {
		name = '';
		key = '';
		_private = false;
		storage = '';
	};
	clear();
	let new_drive = false;
	// $: console.log(key, name, _private);
</script>

<div>
	<div class="flex gap-2">
		<button
			class="btn uppercase dark:border-slate-100"
			class:active={!new_drive}
			on:click={() => (new_drive = false)}>connect</button
		>
		<button
			class="btn uppercase dark:border-slate-100"
			class:active={new_drive}
			on:click={() => (new_drive = true)}>new</button
		>
	</div>
	<div class="flex gap-2 flex-wrap">
		{#if new_drive}
			<div class="">
				<label class="" for="input#name">Drive Name</label><br />
				<input id="name" bind:value={name} class="dark:ring-gray-400" placeholder="awesome" />
			</div>
			<div>
				<label class="pb-2" for="connect-drive-key">Private</label><br />
				<input type="checkbox" bind:checked={_private} class="dark:ring-gray-400 w-10 h-10" />
			</div>
		{:else}
			<div class="">
				<label class="  " for="connect-drive-name">Drive Name</label><br />
				<input
					id="connect-drive-name"
					bind:value={name}
					class="dark:ring-gray-400"
					placeholder="awesome"
				/>
			</div>
			<div class="">
				<label class="  " for="connect-drive-key">Drive Key</label><br />
				<input
					id="connect-drive-key"
					bind:value={key}
					class="dark:ring-gray-400"
					placeholder="[a-z0-9]{'{64}'}"
				/>
			</div>
			<div class="">
				<label for="connect-drive-storage">storage(optional)</label><br />
				<input
					id="connect-drive-storage"
					bind:value={storage}
					class="dark:ring-gray-400"
					placeholder="storage"
				/>
			</div>
		{/if}
	</div>
	<div class="flex pt-3">
		{#if new_drive}
			<button
				on:click={() => {
					socket.signal('create-drive', { name, _private });
					clear();
				}}
				class="text-white mr-1 p-2 rounded-md text-xl active:ring ring-blue-500 dark:ring-gray-500  bg-blue-600 dark:bg-gray-600"
				>Create a New</button
			>
		{:else}
			<button
				on:click={() => {
					socket.signal('save-and-connect-drive', { name, key });
					clear();
				}}
				class="text-white mr-1 p-2 rounded-md text-xl active:ring ring-blue-500 dark:ring-gray-500  bg-blue-600 dark:bg-gray-600"
				>Connect and Save Drive</button
			>
			<button
				on:click={() => {
					socket.signal('connect-drive', { name, key, storage });
					clear();
				}}
				class="text-white mr-1 p-2  rounded-md text-xl active:ring ring-blue-500 dark:ring-gray-500  bg-blue-600 dark:bg-gray-600"
				>Connect Drive</button
			>
		{/if}
	</div>
</div>

<style lang="postcss">
	input {
		@apply bg-gray-50 p-2 rounded-sm text-lg text-gray-900 font-semibold focus:ring ring-blue-400  focus:outline-none border;
	}
	.active {
		@apply border-b-2 border-blue-600;
	}
</style>
