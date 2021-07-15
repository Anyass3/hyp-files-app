<script lang="ts">
	import store from '$store';
	const dkey = store.g('dkey');
	let storage = $dkey !== 'fs' ? 'drive' : 'fs';
	$: storage = $dkey !== 'fs' ? 'drive' : 'fs';
	// export let view = 'text';

	export let path = '';
	export let stat: { isFile: boolean | string; size: number };
	stat.isFile = stat.isFile ? 'file' : 'dir';
	let cls = '';
	export { cls as class };
	let href = `/_api/download?storage=${storage}&dkey=${$dkey}&type=${stat.isFile}&size=${
		stat.size
	}&path=${escape(path)}`;
</script>

<div
	class="p-2 bg-gray-200 dark:bg-gray-600 w-full rounded min-h-[200px] shadow-lg text-base absolute z-20 top-3/4 bg-opacity-80 {cls}"
>
	<div class="flex flex-col justify-center gap-3 md:gap-4 text-gray-800 dark:text-indigo-200">
		<div><a rel="external" {href} class="capitalize">download</a></div>
	</div>
</div>
