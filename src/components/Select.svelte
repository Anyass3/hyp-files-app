<script lang="ts">
	import SearchIcon from 'icons/SearchIcon.svelte';
	import ChevronDownIcon from 'icons/ChevronDownIcon.svelte';
	import { createEventDispatcher } from 'svelte';
	import { truncate, clickOutside } from '$lib/utils';
	export let items: { name: string; key: string; src?: string }[] = [],
		focused = false,
		selected: typeof items[0] | undefined = undefined;
	$: options = items;
	const dispatch = createEventDispatcher();

	const filter = (ev: any) => {
		const searchKey = ev.target?.value?.toLowerCase() || '';
		if (searchKey) options = items.filter(({ name }) => name.toLowerCase().includes(searchKey));
		else options = items;
	};
	const search = false;
	let changedKey: number;
	let input;
</script>

<div
	class="relative border-2 transition rounded"
	class:focused
	use:clickOutside={[
		() => {
			focused = false;
			selected = selected;
		}
	]}
>
	<div class="flex-grow flex items-center py-1 px-3">
		{#key changedKey}
			{#if !selected || search}
				<div class="icon">
					<SearchIcon size="1x" />
				</div>
			{:else if selected.src}
				<img src={selected.src} class=" rounded-full w-4 h-4 inline-block" alt="" />
			{/if}
			{#key selected}
				<input
					bind:this={input}
					type="text"
					class="p-1 focus:outline-none flex-grow w-full dark:text-white"
					style="background-color: inherit;"
					class:active={selected?.name}
					placeholder={focused ? 'Search Storage' : 'Select Storage'}
					on:keyup={filter}
					value={selected?.name || ''}
					on:focus={() => (focused = true)}
				/>
			{/key}
		{/key}
		<div class="icon" on:click={input?.focus}>
			<ChevronDownIcon size="1x" />
		</div>
	</div>
	{#if focused}
		<div class=" absolute w-full mt-1 focused p-2 z-20 rounded">
			{#each options as option}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div
					class="p-2 flex justify-between w-full  rounded-sm shadow"
					tabindex="-1"
					on:click={() => {
						selected = option;
						focused = false;
						dispatch('change', option.key);
						changedKey = Math.random();
						console.log(selected, option);
					}}
				>
					<div>
						{#if option.src}
							<img src={option.src} class=" rounded-full w-4 h-4 inline-block" alt="" />
						{/if}
						<span>{option.name}</span>
					</div>
					<div class="text-xs">{truncate(option.key, 5)}</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="postcss">
	.focused {
		@apply bg-gray-100 focus:bg-gray-50;
	}
	:global(.dark) .focused {
		@apply bg-gray-500 text-white;
	}
	.active {
		@apply text-lg font-medium;
	}
</style>
