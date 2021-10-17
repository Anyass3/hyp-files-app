<script>
	export let size = '100%';
	export let strokeWidth = 2;
	let customClass = '';
	export { customClass as class };

	if (size !== '100%') {
		size = size.slice(-1) === 'x' ? size.slice(0, size.length - 1) + 'em' : parseInt(size) + 'px';
	}
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	fill="none"
	viewBox="0 0 24 24"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	class={customClass}
>
	<path
		d="M3.204 5h9.592L8 10.481 3.204 5zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z"
	/>
</svg>
