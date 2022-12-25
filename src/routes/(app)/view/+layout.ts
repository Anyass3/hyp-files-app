import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url, params }) => {
	return {
		storage: params.storage || 'fs',
		path: encodeURIComponent(decodeURIComponent(url.searchParams.get('path') || '')) || '',
		ctype: url.searchParams.get('ctype') || '',
		dkey: url.searchParams.get('dkey') || '',
		size: url.searchParams.get('size') || ''
	};
};
