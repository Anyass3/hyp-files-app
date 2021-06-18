<script>
	import { scale, fade } from 'svelte/transition';
	import { backOut, quadIn } from 'svelte/easing';
	export let show = false;

	function backdrop(ev) {
		if (ev.target === ev.currentTarget) show = false;
	}
</script>

{#if show}
	<div
		transition:fade={{ delay: 100, duration: 200 }}
		on:click={backdrop}
		style="background-color: rgba(0,0,0,0.5)"
		class=" px-1 flex fixed m-auto top-0 items-center select-none justify-center w-screen h-screen"
	>
		<div
			in:scale={{ delay: 100, start: 0.8, easing: backOut, duration: 250 }}
			out:scale={{ start: 0.9, easing: quadIn, duration: 200 }}
			class="w-96 max-w-full rounded-lg h-auto bg-gray-100 px-4"
		>
			<slot />
		</div>
	</div>
{/if}
