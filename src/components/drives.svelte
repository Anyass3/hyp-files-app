<script>
	import { copyToClipboard, doubleTap } from '$lib/utils';
	import EditIcon from 'icons/EditIcon.svelte';
	import XIcon from 'icons/XIcon.svelte';
	import SaveIcon from 'icons/SaveIcon.svelte';
	import TrashIcon from 'icons/TrashIcon.svelte';
	import CopyIcon from 'icons/CopyIcon.svelte';

	import store from '$store';
	const snackBar = store.g('snackBar');
	const serverStore = store.g('serverStore');
	const socket = store.g('socket');
	let cls =
		'mt-2 p-2 rounded bg-gray-100 dark:bg-gray-600 border-gray-200 shadow border-t-2 dark:border-t-0';

	export { cls as class };

	$: drives = $serverStore?.drives || [];
	const copyKey = (node, key) => {
		const ondoubleTap = doubleTap(() =>
			copyToClipboard(key)
				.then((r) => {
					if (r) snackBar.show('Copied drive key to clipboard');
					else snackBar.show('Could not copy drive key to clipboard');
				})
				.catch((_) => snackBar.show('Could not copy drive key to clipboard'))
		);
		node.onclick = () => {
			ondoubleTap(key);
		};
		return {
			destroy() {
				node.onclick = undefined;
			}
		};
	};
</script>

<div class={cls}>
	<h3 class="text-blue-500 dark:text-white text-3xl">Drives</h3>
	{#each drives as { name, key, connected, saved, writable, _private } (key + name)}
		<div
			class="flex justify-between mt-1 bg-blue-100 p-1 rounded dark:bg-gray-700 active:ring-1 ring-blue-200 dark:ring-gray-600"
		>
			<div class="flex gap-2 items-center">
				<button
					class="anchor-tooltip relative"
					on:click={() =>
						copyToClipboard(key)
							.then((r) => {
								if (r) snackBar.show('Copied drive key to clipboard');
								else snackBar.show('Could not copy drive key to clipboard');
							})
							.catch((_) => snackBar.show('Could not copy drive key to clipboard'))}
				>
					<span class="tooltip ">Copy Drive Key</span>
					<CopyIcon size="1x" />
				</button><button
					class="anchor-tooltip relative"
					on:click={() =>
						store.dispatch('showPrompt', {
							onaccept: (name) => socket.signal('rename-drive', { key, name }),
							message: `Rename Drive "${name}"`,
							input: {
								value: name,
								required: 'Cannot rename with empty name'
							},
							acceptText: 'Rename'
						})}
				>
					<span class="tooltip ">Rename Drive</span>
					<EditIcon size="1x" />
				</button>
				{name}
			</div>
			<div class="flex gap-1">
				{#if !['public', 'private'].includes(name)}
					{#if saved}
						<button
							on:click={() =>
								store.dispatch('showPrompt', {
									onaccept: () => socket.signal('delete-drive', { key, name }),
									acceptText: 'Delete Drive',
									message: 'Just trying to make sure'
								})}
							class="bg-red-200 p-1 mx-1 active:ring-1 rounded-md text-red-700 anchor-tooltip relative"
						>
							<span class="tooltip right-8">Remove from saved</span>
							<TrashIcon size="1x" /></button
						>
					{:else}
						<button
							on:click={() => socket.signal('save-drive', { key, name })}
							class="bg-blue-200 p-1 mx-1 active:ring-1 rounded-md text-blue-700 anchor-tooltip relative"
						>
							<span class="tooltip right-8">Add to saved</span>
							<SaveIcon size="1x" /></button
						>
					{/if}
				{/if}
				{#if connected}
					<button
						on:click={() =>
							store.dispatch('showPrompt', {
								onaccept: () => socket.signal('close-drive', { key, name }),
								acceptText: 'Disconnect Drive',
								message: 'Just trying to make sure'
							})}
						class="bg-red-200 p-1 mx-1 active:ring-1 rounded-md text-red-700 anchor-tooltip relative"
					>
						<span class="tooltip right-8">Close Drive</span>
						<XIcon size="1x" /></button
					>
				{:else}
					<button
						on:click={() => socket.signal('connect-drive', { key, name })}
						class="bg-green-200 p-1 mx-1 active:ring-1 rounded-md text-green-700">connect</button
					>
				{/if}
			</div>
		</div>
	{/each}
</div>
