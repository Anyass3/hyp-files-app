import { browser } from '$app/env';
import { notifier } from '@beyonk/svelte-notifications';
import { writable } from 'svelte/store';
function createSnackBar() {
	const { subscribe, set, update } = writable(null);

	return {
		subscribe,
		show: (value: string) =>
			update((va) => {
				setTimeout(() => update((val) => (val = null)), 5000);
				return (va = value);
			})
	};
}
export default {
	noStore: ['notify', 'base_url', 'snackBar'],
	state: {
		snackBar: createSnackBar(),
		drives: [],
		folder: {},
		folderItems: [],
		sharingProgress: {},
		pagination: {},
		loading: 'load-page',
		context_menu: [],
		pos: { x: 0, y: 0 },
		selected: null,
		canRender: false,
		notify: notifier,
		base_url: import.meta.env.BASE_URL.replace('_app/', '')
	},
	getters: {
		dirs(state, key, value = false) {
			if (key) {
				let dir = state.dirs.get()?.[key];
				if (dir && value === true) return dir;
				else if (!dir || (value && typeof value !== 'boolean')) {
					state.dirs.update((dirs) => {
						dirs[key] = value || '/';
						state.dirs.set(dirs);
						return dirs;
					});
				}
			}
			return state.dirs;
		},
		drives(state, dkey) {
			const drives = [
				...(state.serverStore.get().drives?.drives || []),
				{ name: 'file system', key: 'fs' }
			];
			return dkey ? drives : drives.find((drive) => drive.dkey === dkey);
		}
	},
	mutations: {
		setColorScheme(state, value: string) {
			state.colorScheme.set(value);
			localStorage.setItem('colorScheme', value);
		},
		updateDirs(state, key, value = '') {
			state.dirs.update((dirs) => {
				dirs[key] = value;
				return dirs;
			});
		}
	}
};
