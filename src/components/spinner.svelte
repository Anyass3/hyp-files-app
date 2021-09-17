<script>
	export let size = 60;
	export let speed = 850;
	export let color = 'rgba(0,0,0,0.4)';
	export let thickness = 6;
	export let gap = 60;
	export let radius = 45;
	let dash;
	$: dash = (2 * Math.PI * radius * (100 - gap)) / 100;
</script>

<div class="grid place-items-center w-full pt-10">
	<svg
		height={size}
		width={size}
		style="animation-duration:{speed}ms;"
		class="svelte-spinner"
		viewBox="0 0 100 100"
	>
		<circle
			role="presentation"
			cx="50"
			cy="50"
			r={radius}
			stroke={color}
			fill="none"
			stroke-width={thickness}
			stroke-dasharray="{dash},100"
			stroke-linecap="round"
		/>
	</svg>
</div>

<style>
	.svelte-spinner {
		transition-property: transform;
		animation-name: svelte-spinner_infinite-spin;
		animation-iteration-count: infinite;
		animation-timing-function: linear;
	}
	@keyframes svelte-spinner_infinite-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
