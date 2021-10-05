<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	import store from '$store';
	const snackBar = store.g('snackBar');
</script>

{#key $snackBar}
	<div
		in:fly={{ y: 20, duration: 1000 }}
		out:fly={{ delay: 10, y: 40, duration: 1000 }}
		id="snackbar"
		class:show={$snackBar}
		class="snackbar"
	>
		<span class="message">{$snackBar}</span>
	</div>
{/key}

<style>
	.snackbar {
		display: none;
		background-color: transparent;
		color: transparent;
		text-align: center;
		/* justify-content: center; */
		position: fixed;
		z-index: 9999;
		min-width: 100%;
		padding-left: 2.5rem;
		/* left: 50%; */
		bottom: 2rem;
		-webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
		animation: fadein 0.5s, fadeout 0.5s 2.5s;
		font-size: 17px;
	}
	.message {
		background-color: #333;
		color: #fff;
		border-radius: 2px;
		padding: 1rem;
	}

	.show {
		display: flex !important;
	}
</style>
