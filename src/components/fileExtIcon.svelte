<script>
	export let ext;
	let customClass = '';
	export { customClass as class };
	export let size = '1x';
	if (size !== '100%') {
		size = size.slice(-1) === 'x' ? size.slice(0, size.length - 1) + 'em' : parseInt(size) + 'px';
	}
</script>

<div class="flex justify-center items-end {customClass}" style="width: {size};height:{size};">
	<span class="uppercase text-4xl" style="font-family: cursive;">{ext}</span>
</div>
