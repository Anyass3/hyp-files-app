<script>
	import store from '$store';
	import MenuIcon from 'icons/MenuIcon.svelte';
	import FilePlusIcon from 'icons/FilePlusIcon.svelte';
	import FolderPlusIcon from 'icons/FolderPlusIcon.svelte';
	import CopyIcon from 'icons/CopyIcon.svelte';
	import ScissorsIcon from 'icons/ScissorsIcon.svelte';
	import ClipboardIcon from 'icons/ClipboardIcon.svelte';

	const show_hidden = store.g('show_hidden');
	export let hidden = true;
	import { createEventDispatcher } from 'svelte';
	const emit = createEventDispatcher();
	const toggle = () => {
		hidden = !hidden;
	};
	let selecteds = false;
	const size = '1.5x';
</script>

<div class="relative flexy flex-col">
	<button
		on:click={toggle}
		class="flex justify-center items-center p-1 m-auto border border-transparent bg-gray-100 dark:bg-gray-700  dark:text-white {!hidden
			? 'border-gray-100 dark:border-gray-400'
			: ''}"><MenuIcon {size} /></button
	>
	<div
		class="absolute -right-1 top-9 bg-gray-100 dark:bg-gray-500 shadow min-w-max text-base p-2 rounded-sm dark:text-white"
		class:hidden
	>
		<div class="flexy py-2">
			<button><FilePlusIcon {size} /></button><button><FolderPlusIcon {size} /></button>
		</div>
		<div class="flexy borderly py-2">
			<span>Edit</span>
			<button><ScissorsIcon {size} /></button>
			<button><CopyIcon {size} /></button>
			<button><ClipboardIcon {size} /></button>
		</div>
		<div class="borderly py-2">
			<button class="flexy w-full">
				<label
					for="show-hidden"
					class="text-blue-600 dark:text-blue-100 flex-grow dark:active:text-blue-300 active:text-blue-400 cursor-pointer px-1"
					>show hidden files</label
				>
				<input
					id="show-hidden"
					type="checkbox"
					bind:checked={$show_hidden}
					on:change={() => emit('toggleHidden')}
				/>
			</button>
		</div>
		<div class="borderly py-2">
			<button class="flexy w-full ">
				<label
					for="select-all"
					class="text-blue-600 flex-grow text-left dark:text-blue-100 dark:active:text-blue-300 active:text-blue-400 cursor-pointer px-1"
					>select all</label
				>
				<input
					id="select-all"
					type="checkbox"
					bind:checked={selecteds}
					on:change={() => emit('selectAll')}
				/>
			</button>
		</div>
	</div>
</div>

<style lang="postcss">
	.flexy {
		@apply flex justify-between items-center;
	}
	button:active {
		transform: scale(0.97);
	}
	.borderly {
		@apply border-t-[.1px] border-black;
	}
	:global(.dark) .borderly {
		@apply border-white;
	}
</style>
