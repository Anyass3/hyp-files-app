<script>
	import store from '$store';
	const serverStore = store.g('serverStore');
	const socket = store.g('socket');
	import Spinner from '$components/spinner.svelte';

	$: sharing = $serverStore?.sharing || [];
	const sharingProgress = store.g('sharingProgress');
</script>

<div
	class="p-2 rounded-lg border-gray-500 shadow-sm border-[.3px] text-gray-800 text-xl  dark:text-blue-100"
>
	<h3 class="text-blue-500 dark:text-white text-3xl">Sharing</h3>
	{#each sharing as { send, name, phrase, drive } (send + phrase)}
		<div
			class="flex flex-col gap-4 mt-1 bg-blue-100 p-1 rounded dark:bg-gray-700 ring-blue-200 dark:ring-gray-600 flex-wrap"
		>
			<div class="flex justify-between gap-4">
				<div class="flex gap-4">
					<div class="uppercase">{send ? 'Sending' : 'Receiving'}:</div>
					<div class="text-blue-600">{drive}</div>
				</div>
				<div>{name}</div>
			</div>
			<div class="flex justify-between gap-4">
				<div>
					PHRASE: <span
						class:select-text={!$sharingProgress[send + phrase]}
						class="select-text text-lg text-blue-400">{phrase}</span
					>
				</div>
				<div class="bg-green-200 p-1 rounded text-green-700 flex items-center">
					{#if $sharingProgress[send + phrase]}
						{$sharingProgress[send + phrase]}
					{:else}
						<Spinner size={25} thickness={4} />
					{/if}
				</div>
				<button
					class="text-white bg-red-500 btn"
					on:click={() => socket.signal('cancel-sharing', { send, phrase })}>Cancel</button
				>
			</div>
		</div>
	{/each}
	{#if !sharing.length}
		<p class="dark:text-gray-100">Not Sending or Receiving any file(s)</p>
	{/if}
</div>
