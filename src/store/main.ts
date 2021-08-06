// import { api, serverEndpoint } from '$lib/connectionBuilder';
import { dev, browser } from '$app/env';
import { goto } from '$app/navigation';
import { notifier } from '@beyonk/svelte-notifications';
import { api } from '$lib/getAPi';

export default {
	noStore: ['base_url', 'notify'],
	storeType: { colorScheme: 'localPersistantStore', clipboard: 'sessionPersistantStore' },
	state: {
		// @ts-ignore
		base_url: import.meta.env.BASE_URL.replace('_app/', ''),
		context_menu: [],
		pos: { x: 0, y: 0 },
		clipboard: {},
		notify: notifier,
		hideFilemenu: true,
		colorScheme:
			browser && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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
	},
	actions: {
		open: async (
			{ state, commit, dispatch, g },
			{ path, isFile, size, storage, dkey, dir }: any = {}
		) => {
			if (isFile) {
				const resp = await api.post('/get-file-type', { storage, path, dkey });
				if (resp.ok) {
					path = escape(path);
					console.log('resp', resp); // @ts-ignore
					const ctype = resp.body.ctype || '';
					console.log({ storage, path, dkey, ctype, size });
					if (ctype.includes('video') || ctype.includes('audio') || ctype.includes('image')) {
						const url = `/view/media-${storage}?dkey=${dkey}&ctype=${ctype}&size=${size}&path=${path}`;
						goto(url);
					} else if (ctype.includes('text') || ctype.includes('json')) {
						const url = `/view/text-${storage}?dkey=${dkey}&ctype=${ctype}&size=${size}&path=${path}`;
						goto(url);
					} else if (ctype.includes('pdf')) {
						const url = `/_api/pdf?storage=${storage}&dkey=${dkey}&ctype=${ctype}&size=${size}&path=${path}`;
						window.open(url, '_blank').focus();
					}
				}
			} else {
				dir = dir || '/';
				if (path) {
					dir = path;
					commit('updateDirs', dkey, path);
				}
				if (!state.socket) return;
				if (storage === 'fs') {
					state.socket.on('ready', () => {
						state.socket.signal('fs-list', dir);
					});
					state.socket.signal('fs-list', dir);
				} else {
					state.socket.on('ready', () => {
						state.socket.signal('drive-list', { dir, dkey });
					});
					state.socket.signal('drive-list', { dir, dkey });
				}
			}
		},
		setupMenuItems(
			{ dispatch, commit, g, state },
			{ size, storage, dkey, isFile, path, dir, name }
		) {
			console.log({ size, storage, dkey, isFile, path });
			const items = [
				{
					name: 'open',
					action: () => {
						console.log('open', { size, storage, dkey, isFile, dir, path });
						dispatch('open', { size, storage, dkey, isFile, dir, path });
						dispatch('context_menu', []);
					}
				},
				{
					name: 'download',
					action: () => {
						dispatch('context_menu', []);
						const link = document.createElement('a');
						link.href = `/_api/download?storage=${storage}&dkey=${dkey}&type=${
							isFile ? 'file' : 'dir'
						}&size=${size}&path=${escape(path)}`;
						document.body.appendChild(link);
						link.target = '_blank';
						link.click();
						link.remove();
					}
				},
				{
					name: 'copy',
					action: () => {
						dispatch('clipboard', {
							path,
							dkey,
							name
						});
						state.notify.success(`${path.split('/').reverse()[0]} copied`);
						dispatch('context_menu', []);
					}
				},
				{
					name: 'paste',
					action: () => {
						const src = g('clipboard').get();
						const dest = { path, dkey, name };
						const event = `${src.path}-${dest.path}`;
						state.socket.signal('paste-copied', { src, dest });
						dispatch('context_menu', []);

						const onpaste = (payload) => {
							if (payload.dest.path === dest.path && payload.src.path === src.path) {
								state.socket.off(event, onpaste);
								state.success('pasted ' + src.name + ' to ' + dest.name);
							}
						};

						state.socket.on(event, onpaste);
					}
				},
				{
					name: 'delete',
					action: () => {
						state.socket.signal('delete-path-item', { path, dkey, name });
						dispatch('context_menu', []);
					}
				}
			];
			dispatch('context_menu', items);
		},
		setupMainMenuItems({ dispatch, commit, g, state }, { storage, dkey, dir, name }) {
			const items = [
				{
					name: 'new',
					action() {},
					options: {}
				},
				{
					name: 'paste',
					action: () => {
						const src = g('clipboard').get();
						const dest = { path: dir.endsWith('/') ? dir : dir + '/', dkey, name };
						const event = `${src.path}-${dest.path}`;
						state.socket.signal('paste-copied', { src, dest });
						dispatch('context_menu', []);

						const onpaste = (payload) => {
							if (payload.dest.path === dest.path && payload.src.path === src.path) {
								state.socket.off(event, onpaste);
								state.success('pasted ' + src.name + ' to ' + dest.name);
							}
						};

						state.socket.on(event, onpaste);
					}
				}
			];
			dispatch('context_menu', items);
		}
	}
};
