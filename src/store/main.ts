// import { api, serverEndpoint } from '$lib/connectionBuilder';
import { dev, browser } from '$app/env';

export default {
	noStore: ['base_url'],
	state: {
		// @ts-ignore
		base_url: import.meta.env.BASE_URL.replace('_app/', ''),
		colorScheme: null
	},
	mutations: {
		setColorScheme(state, value: string) {
			state.colorScheme.set(value);
			localStorage.setItem('colorScheme', value);
		}
	},
	actions: {
		initColorScheme({ commit }) {
			if (browser)
				if (
					localStorage.colorScheme === 'dark' ||
					(!('colorScheme' in localStorage) &&
						window.matchMedia('(prefers-color-scheme: dark)').matches)
				) {
					commit('colorScheme', 'dark');
					console.log('dark');
				} else {
					commit('colorScheme', 'light');
					console.log('light');
				}
		}
	}
};
