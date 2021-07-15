// import { api, serverEndpoint } from '$lib/connectionBuilder';
import { dev, browser } from '$app/env';

export default {
	noStore: ['base_url'],
	storeType: { colorScheme: 'localPersistantStore' },
	state: {
		// @ts-ignore
		base_url: import.meta.env.BASE_URL.replace('_app/', ''),
		colorScheme:
			browser && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
	},
	mutations: {
		setColorScheme(state, value: string) {
			state.colorScheme.set(value);
			localStorage.setItem('colorScheme', value);
		}
	},
	actions: {}
};
