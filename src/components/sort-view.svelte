<script lang="ts">
	import store from '$store';
	import PlusCircleIcon from 'icons/PlusCircleIcon.svelte';
	import MinusCircleIcon from 'icons/MinusCircleIcon.svelte';
	import ListIcon from 'icons/ListIcon.svelte';
	import GridIcon from 'icons/GridIcon.svelte';
	import CaretDown from '$icons/CaretDown.svelte';
	import { scale, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	const ordering = store.g('ordering');
	const sorting = store.g('sorting');
	export let hidden = true;
	export let layout: 'grid' | 'list' = 'grid';
	import { createEventDispatcher } from 'svelte';
	import { clickOutside } from '$lib/utils';
	const emit = createEventDispatcher();
	let canEmit = false;

	const toggleSort = () => {
		hidden = !hidden;
		canEmit = true;
	};
	const toggleView = () => {
		layout = layout === 'grid' ? 'list' : 'grid';
	};
	let selecteds = false;
	const size = '2x';
	const change = (..._) => {
		if (canEmit) emit('change');
	};
	$: change($sorting, $ordering);
</script>

<div class="relative" use:clickOutside={() => (hidden = true)}>
	<div class="flexy h-full">
		<button
			on:click={toggleView}
			class="flex justify-center items-center p-1 m-auto border border-transparent bg-gray-100 dark:bg-gray-700  dark:text-white {!hidden
				? 'border-gray-100 dark:border-gray-400'
				: ''}"
		>
			{#if layout === 'list'}
				<ListIcon {size} />
			{:else if layout === 'grid'}
				<GridIcon {size} />
			{/if}
		</button>
		<button
			on:click={toggleSort}
			class="flex justify-center items-center p-1 m-auto border border-transparent bg-gray-100 dark:bg-gray-700  dark:text-white {!hidden
				? 'border-gray-100 dark:border-gray-400'
				: ''}"
		>
			<CaretDown {size} />
		</button>
	</div>
	{#if !hidden}
		<div
			in:scale={{ delay: 100, start: 0.8, easing: quintOut, duration: 200 }}
			out:fade={{ duration: 200 }}
			class="absolute bg-gray-100 dark:bg-gray-500 shadow min-w-max text-lg p-2 rounded z-30 capitalize"
		>
			<div class="flexy py-1">
				<button><PlusCircleIcon {size} /></button><span>100%</span><button
					><MinusCircleIcon {size} /></button
				>
			</div>
			<div class="borderly py-1 flexy flex-col sort">
				<p class="text-xl dark:text-white">Sort</p>
				<button class=" flexy w-full">
					<label
						for="sorting-name"
						class="text-blue-600 dark:text-blue-100 flex-grow dark:active:text-blue-300 active:text-blue-400 cursor-pointer px-1"
						>Name</label
					>
					<input id="sorting-name" type="radio" bind:group={$sorting} name="name" value={'name'} />
				</button>
				<button class=" flexy w-full">
					<label
						for="sorting-date-modified"
						class="text-blue-600 dark:text-blue-100 flex-grow dark:active:text-blue-300 active:text-blue-400 cursor-pointer px-1"
						>Date Modified</label
					>
					<input
						id="sorting-date-modified"
						type="radio"
						bind:group={$sorting}
						name="date"
						value={'date'}
					/>
				</button>
				<button class=" flexy w-full">
					<label
						for="sorting-size"
						class="text-blue-600 dark:text-blue-100 flex-grow dark:active:text-blue-300 active:text-blue-400 cursor-pointer px-1"
						>Size</label
					>
					<input id="sorting-size" type="radio" bind:group={$sorting} name="size" value={'size'} />
				</button>
				<button class=" flexy w-full">
					<label
						for="sorting-type"
						class="text-blue-600 dark:text-blue-100 flex-grow dark:active:text-blue-300 active:text-blue-400 cursor-pointer px-1"
						>Type</label
					>
					<input id="sorting-type" type="radio" bind:group={$sorting} name="type" value={'type'} />
				</button>
			</div>

			<div class="borderly py-1 flexy flex-col sort">
				<p class="text-xl dark:text-white">Order</p>
				<button class=" flexy w-full">
					<label
						for="sorting-ascending"
						class="text-blue-600 dark:text-blue-100 flex-grow dark:active:text-blue-300 active:text-blue-400 cursor-pointer px-1"
						>Ascending</label
					>
					<input
						id="sorting-ascending"
						type="radio"
						bind:group={$ordering}
						name="ascending"
						value={1}
					/>
				</button>
				<button class=" flexy w-full">
					<label
						for="sorting-descending"
						class="text-blue-600 dark:text-blue-100 flex-grow dark:active:text-blue-300 active:text-blue-400 cursor-pointer px-1"
						>Descending</label
					>
					<input
						id="sorting-descending"
						type="radio"
						bind:group={$ordering}
						name="descending"
						value={-1}
					/>
				</button>
			</div>
		</div>
	{/if}
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
	.sort label {
		text-align: left;
	}
</style>
