import { browser } from '$app/env';

export default {
	storeType: {
		//
		//store persists in localStorage
		colorScheme: 'localPersistantStore',
		render: 'localPersistantStore',
		//
		//persists in sessionStorage
		clipboard: 'sessionPersistantStore',
		dirs: 'sessionPersistantStore',
		show_hidden: 'sessionPersistantStore',
		dkey: 'sessionPersistantStore'
	},
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
