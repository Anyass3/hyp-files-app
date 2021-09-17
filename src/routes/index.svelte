<script>
	import StorageSelect from '$components/storage-select.svelte';
	import ConnectDrive from '$components/connect-drive.svelte';
	import Drives from '$components/drives.svelte';
	import ChildProcess from '$components/child-process.svelte';
</script>

<svelte:head>
	<title>Hyp</title>
</svelte:head>
<div
	class="flex justify-between h-full mx-2 gap-2 flex-grow flex-wrap bg-gray-50 dark:bg-gray-800 rounded-sm dark:text-blue-100 select-none"
>
	<div class="w-full h-full  mt-2 p-2 border-gray-200 dark:border-t-0">
		<h3 class="text-blue-500 dark:text-white text-5xl">Drive Manager</h3>
		<div class="flex justify-between flex-wrap text-gray-900">
			<StorageSelect />
			<!-- <ConnectDrive /> -->
		</div>
		<div
			class=" mt-2  p-2 rounded-lg border-gray-500 shadow-sm border-[.3px] text-gray-800 text-xl  dark:text-blue-100"
		>
			<ConnectDrive />
		</div>
		<Drives
			class="mt-2 p-2 rounded-lg border-gray-500 shadow-sm border-[.3px] text-gray-800 text-xl  dark:text-blue-100"
		/>
		<ChildProcess
			class=" mt-2  p-2 rounded-lg border-gray-500 shadow-sm border-[.3px] text-gray-800 text-xl  dark:text-blue-100"
		/>
	</div>
	<!-- <div class="w-full h-full border border-gray-500">
		<h3>chat Manager</h3>
	</div> -->
</div>
