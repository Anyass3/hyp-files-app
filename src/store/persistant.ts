import { browser } from '$app/env';

export default {
	storeType: 'localPersistantStore',
	state: {
		clipboard: null,
		colorScheme:
			browser && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
		render: false,
		dirs: { fs: '/' },
		show_hidden: true,
		dkey: 'fs'
	}
};
