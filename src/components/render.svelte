<script>
	export let content = '';
	const shadow = (node) => {
		const shadowroot = node.attachShadow({ mode: 'open' });
		shadowroot.innerHTML = content;
	};
</script>

<div use:shadow />
