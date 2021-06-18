<script>
	import StorageSelect from '$components/storage-select.svelte';
	import ConnectDrive from '$components/connect-drive.svelte';
	import Drives from '$components/drives.svelte';
</script>

<div
	class="flex justify-between h-full mx-2 gap-2 flex-grow flex-wrap bg-gray-200 dark:bg-gray-700 rounded-md"
>
	<div class="w-full h-full  p-3 ">
		<h3 class="dark:text-blue-400 text-semibold text-3xl">Drive Manager</h3>
		<div class="flex justify-between flex-wrap">
			<StorageSelect />
			<!-- <ConnectDrive /> -->
		</div>
		<Drives />
		<div class=" mt-2  p-2 rounded-sm bg-blue-200 dark:bg-gray-600 dark:text-blue-300">
			<ConnectDrive />
		</div>
	</div>
	<div class="w-full h-full border border-gray-500">
		<h3>chat Manager</h3>
	</div>
</div>
