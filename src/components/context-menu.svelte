<script lang="ts">
	import { scale, fade } from 'svelte/transition';
	import { backOut, quadIn } from 'svelte/easing';
	import { browser } from '$app/env';

	import { navigating } from '$app/stores';
	import store from '$store';
	import { onMount } from 'svelte';
	import type { Writable } from 'svelte/store';

	const menuItems: Writable<ContextMenuItems> = store.g('context_menu');
	const position = store.g('pos'); //{clientX, clientY}
	let cls = '';
	export { cls as class };
	$: pos = $position || { x: 0, y: 0 };

	// let menu;
	const hideMenu = (ev) => {
		// console.log('hidemenu', ev, ev.keyCode);
		if (ev.keyCode === 27 || ev.type !== 'keyup') {
			$menuItems = [];
		}
	};
	$: if (navigating) {
		$menuItems = [];
	}

	let main;
	if (browser) {
		main = document.querySelector('div#main');
	}
	const getLimits = (m) => {
		const l1 = (innerWidth - m) / 2;
		const l2 = (innerWidth + m) / 2;
		return { l1, l2 };
	};

	const menuAction = (menu) => {
		/**
		 * Positions the menu properly.
		 *
		 * @param {Object} { x: number, y: number };
		 */
		if (!main) main = document.querySelector('div#main');

		const parent = document.getElementById('file-manager');
		let dimention = { x: 0, y: 0 };
		let menuPos = { x: 0, y: 0 };
		dimention.x = menu.offsetWidth;
		dimention.y = menu.offsetHeight;

		const parentWidth = parent.offsetWidth;
		const parentHeight = window.innerHeight;
		//X
		const limits = getLimits(parentWidth);
		if (pos.x + 3 + 200 < limits.l2) {
			// console.log('x==>', limits.l2);
			menuPos.x = pos.x + 3;
		} else if (limits.l1 < pos.x - 3 - 200) {
			// console.log('x<==', limits.l1);
			menuPos.x = pos.x - 3 - 200;
		}
		// else console.log('limits', limits);

		//Y
		if (pos.y - 5 - dimention.y > 50) {
			// console.log('y=UP');
			menuPos.y = pos.y - 5 - dimention.y;
		} else if (parentHeight > pos.y + 5 + dimention.y) {
			// console.log('y=DOWN');
			menuPos.y = Math.max(pos.y + 5, 50);
		}

		menu.style.left = menuPos.x + 'px';
		menu.style.top = menuPos.y + 'px';

		main.addEventListener('click', hideMenu);
		window.addEventListener('keyup', hideMenu);
		window.addEventListener('resize', hideMenu);
	};
	onMount(() => {
		return () => {
			// console.log('cleaningg up context menu');
			window.removeEventListener('keyup', hideMenu);
			window.removeEventListener('resize', hideMenu);
			main.removeEventListener('click', hideMenu);
		};
	});
	$: hidden = ($menuItems?.length || 0) === 0;
	// $: console.log('menuItems', $menuItems);
</script>

{#key pos}
	<div
		use:menuAction
		transition:fade={{ delay: 100, duration: 200 }}
		class:hidden
		id="context-menu__view"
		class=" fixed z-20 {cls}"
	>
		<div
			in:scale={{ delay: 100, start: 0.8, easing: backOut, duration: 250 }}
			out:scale={{ start: 0.9, easing: quadIn, duration: 200 }}
			class="flex p-2 bg-white dark:bg-gray-700 bg-opacity-95 dark:bg-opacity-95  flex-col min-w-[200px] min-h-[200px] rounded-md shadow-2xl gap-3 md:gap-4 text-gray-800 dark:text-blue-200"
		>
			{#each $menuItems as { name, action, options,disabled=false, hidden=false } (name)}
				<div
					class="hover:bg-gray-200 dark:hover:bg-gray-500 px-1 rounded"
					class:disabled
					class:hidden
				>
					<button
						{disabled}
						on:click={action()}
						class="block text-left w-full text-xl text-gray-900 dark:text-blue-300 capitalize"
						>{name}</button
					>
				</div>
			{/each}
		</div>
	</div>
{/key}

<style lang="postcss">
	.disabled button {
		@apply text-gray-300 cursor-not-allowed;
	}
	:global(.dark) .disabled button {
		/* color: rgb(156, 163, 175) !important; */
		@apply text-gray-500;
	}
	.disabled:hover {
		background-color: transparent !important;
	}
</style>
