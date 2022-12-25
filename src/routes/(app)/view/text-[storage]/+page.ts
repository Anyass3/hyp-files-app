
import { toQueryString } from '$lib/utils';
import type { PageLoad } from './$types';
import _ from 'lodash-es';

const filterPath = (_path: string[]) =>
	_path.filter((path, idx) =>
		((idx !== 0 || _path[idx + 1]?.startsWith('/')) && path === '/') || path === './'
			? false
			: path
	);

export const load: PageLoad = async ({ url, parent }) => {
	const args = await parent()

	let pathList = url.searchParams.getAll('path').map((v) => decodeURIComponent(v));

	pathList = filterPath(pathList);

	let [lastPath, ...dirs] = [...pathList].reverse();
	dirs.reverse();

	const filename = _.last(_.last(pathList)?.split('/')) || '';

	dirs.push(lastPath.replace(filename, ''));

	dirs = filterPath(dirs);

	args.path = pathList
		.reduce((paths, path) => `${paths}path=${encodeURIComponent(path)}&`, '')
		.replace(/^(path=)/, '')

	const dir = dirs
		.reduce((paths, path) => `${paths}path=${encodeURIComponent(path)}&`, '')
		.replace(/(^(path=)|(&$))/g, '');

	let urlPath = `/file` + toQueryString(args);

	return {
		...args,
		filename,
		url: urlPath,
		dir,
		language: url.searchParams.get('language')
	};
};