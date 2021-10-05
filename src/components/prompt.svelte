<script>
	import store from '$store';
	import { scale, fade } from 'svelte/transition';
	import { backOut, quadIn } from 'svelte/easing';
	let backdrop_key;

	const prompt = store.state.prompt;

	function dismiss() {
		$prompt.ondismiss().then(() => store.dispatch('hidePrompt'));
	}

	function accept() {
		$prompt
			.onaccept()
			.then(() => store.dispatch('hidePrompt'))
			.catch((er) => store.state.notify.danger(er));
	}

	function backdrop(ev) {
		if (ev.target === ev.currentTarget) {
			if ($prompt.backdrop) dismiss();
			else backdrop_key = Math.random();
		}
	}
</script>

{#if $prompt.visible}
	{#key backdrop_key}
		<div
			transition:fade={{ delay: 100, duration: 200 }}
			on:click={backdrop}
			style="background-color: rgba(0,0,0,0.5)"
			class=" px-1 flex fixed m-auto top-0 items-center select-none justify-center w-screen h-screen z-50"
		>
			<div
				in:scale={{ delay: 100, start: 0.8, easing: backOut, duration: 250 }}
				out:scale={{ start: 0.9, easing: quadIn, duration: 200 }}
				class="w-96 max-w-full rounded-lg h-auto bg-gray-100 dark:bg-gray-600 px-4"
			>
				<div class="p-4 font-semibold text-blue-700 dark:text-blue-300 break-words">
					{$prompt.message}
				</div>
				{#if $prompt.input}
					<div class="p-4">
						{#if $prompt.input.label}
							<label for="prompt-input" class="dark:text-blue-300">{$prompt.input.label}</label>
						{/if}
						<!-- svelte-ignore a11y-autofocus -->
						<input
							id="prompt-input"
							type="text"
							autofocus
							bind:value={$prompt.input.value}
							class="p-1 w-full border border-gray-400 dark:bg-gray-200"
						/>
					</div>
				{/if}
				<div class="border-gray-300 p-4 flex justify-between border-t-1 dark:text-white">
					<button
						on:click={dismiss}
						class="hover:ring active:ring-4 capitalize active:bg-red-300 hover:text-red-600  focus:outline-transparent hover:ring-red-300 border-2 p-2 font-bold rounded-md border-red-500"
						>{$prompt.dismissText}</button
					>
					<button
						on:click={accept}
						class="hover:ring active:ring-4 capitalize active:bg-blue-300 hover:text-blue-600  focus:outline-transparent hover:ring-blue-300 border-2 p-2 font-bold rounded-md border-blue-500 hover:opacity-80"
						>{$prompt.acceptText}</button
					>
				</div>
			</div>
		</div>
	{/key}
{/if}
