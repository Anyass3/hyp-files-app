<script lang="ts">
	import { page } from '$app/stores';
	import SideBarSwipe, { opened, applied, toggle } from 'sidebar-swipe';
	import MenuIcon from 'icons/MenuIcon.svelte';
	import NavItems from '$components/navItems.svelte';
	import store from '$store';
	const base_url = store.g('base_url');
	// $: console.log('applied', $applied);
	// $: console.log('opened', $opened);
</script>

<div id="nav-sm" class="mobile mb-1 p-2 sticky-top bg">
	<div class="flex justify-between">
		<div class="nav-item">
			<a
				href={base_url}
				sveltekit:prefetch
				class:active={$page.url.pathname === base_url}
				class="btn lead3 anchor">Hyp</a
			>
		</div>
		<div class="nav-item">
			<a
				sveltekit:prefetch
				class="anchor btn capitalize lead3"
				class:active={$page.url.pathname === base_url + 'files'}
				href={base_url + 'files'}>files</a
			>
		</div>
		<button class="nav-item" on:click={toggle}>
			<MenuIcon size="2x" class="dark:text-blue-100" />
		</button>
	</div>
</div>

<SideBarSwipe
	width="80"
	backdropOpacity="0.2"
	maxScreenWidth="768"
	transitionDuration="300"
	transitionTimingFunc="cubic-bezier(0.9, 0.28, 0.08, 1.13)"
	class="rounded"
	><NavItems />
</SideBarSwipe>

<div id="nav-md" class="desktop bg select-none md:px-10 py-2 sticky-top">
	<NavItems />
</div>
