<script context="module">
	import { browser, dev } from '$app/env';

	// we don't need any JS on this page, though we'll load
	// it in dev so that we get hot module replacement...
	export const hydrate = dev;

	// ...but if the client-side router is already loaded
	// (i.e. we came here from elsewhere in the app), use it
	export const router = browser;

	// since there's no dynamic data here, we can prerender
	// it so that it gets served as a static asset in prod
	export const prerender = true;
</script>

<script lang="ts">
	import { page } from '$app/stores';
	import SideBarSwipe, { opened, applied, toggle } from 'sidebar-swipe';
	import MenuIcon from 'icons/MenuIcon.svelte';
	import NavItems from '$components/navItems.svelte';
	$: console.log('applied', $applied);
	$: console.log('opened', $opened);
</script>

<div id="nav-sm" class="mobile mb-1 p-3 sticky-top">
	<div class="flex justify-between">
		<div>
			<a href="/" sveltekit:prefetch class:active={$page.path === '/'} class="btn lead3 anchor"
				>Hyp</a
			>
		</div>
		<button class="" on:click={toggle}>
			<MenuIcon size="2x" />
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
<div id="nav-md" class="desktop md:px-10 py-3 sticky-top">
	<NavItems />
</div>
