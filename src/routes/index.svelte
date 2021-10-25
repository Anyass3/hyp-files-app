<script>
	import StorageSelect from '$components/storage-select.svelte';
	import ConnectDrive from '$components/connect-drive.svelte';
	import Drives from '$components/drives.svelte';
	import ChildProcess from '$components/child-process.svelte';
</script>

<div
	class="flex h-full flex-col px-2 md:px-8 py-4 gap-8 flex-grow bg-gray-50 border-t border-gray-500 dark:bg-gray-800 rounded-sm dark:text-blue-100 select-none"
>
	<h3 class="text-blue-500 dark:text-white text-5xl">Drive Manager</h3>

	<div
		class=" mt-2  p-2 rounded-lg border-gray-500 shadow-sm border-[.3px] text-gray-800 text-xl  dark:text-blue-100"
	>
		<ConnectDrive />
	</div>
	<Drives
		class="mt-2 p-2 rounded-lg border-gray-500 shadow-sm border-[.3px] text-gray-800 text-xl  dark:text-blue-100"
	/>
</div>
