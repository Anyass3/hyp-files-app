<script>
	import StorageSelect from '$components/storage-select.svelte';
	import Sharing from '$components/sharing.svelte';
	import Drives from '$components/drives.svelte';
	import ChildProcess from '$components/child-process.svelte';
</script>

<svelte:head>
	<title>tasks</title>
</svelte:head>
<div
	class="flex h-full flex-col px-2 md:px-8 gap-8 flex-grow bg-gray-50 border border-gray-500 dark:bg-gray-800 rounded-sm dark:text-blue-100 select-none"
>
	<ChildProcess />
	<Sharing />
</div>
