import { browser } from '$app/env';
import { goto } from '$app/navigation';
import { notifier } from '@beyonk/svelte-notifications';
import { API, api } from '$lib/getAPi';
import { toQueryString } from '$lib/utils';
import { extractLang } from '$lib/md-hljs';

const isMedia = (ctype, img = true) => {
	if (!ctype) ctype = '';
	return (
		ctype.includes('video') || ctype.includes('audio') || (img ? ctype.includes('image') : false)
	);
};

export default {
	noStore: ['base_url', 'notify'],
	storeType: {
		colorScheme: 'localPersistantStore',
		clipboard: 'sessionPersistantStore',
		render: 'sessionPersistantStore'
	},
	state: {
		// @ts-ignore
		base_url: import.meta.env.BASE_URL.replace('_app/', ''),
		context_menu: [],
		pos: { x: 0, y: 0 },
		clipboard: null,
		tooltip: false,
		notify: notifier,
		hideFilemenu: true,
		render: false,
		canRender: false,
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
		open({ dispatch }, { path, isFile, size, storage, dkey, dir, ctype, inBrowser, silent }) {
			if (isFile) {
				dispatch('openFile', { path, size, storage, dkey, ctype, inBrowser });
			} else {
				dispatch('openFolder', { dir, path, dkey, silent, storage });
			}
		},
		async openFile({ state }, { path, size, storage, dkey, ctype, inBrowser = false }: any = {}) {
			if (!ctype || ctype === 'application/octet-stream') {
				const res = await api.post('/get-file-type', {
					path: encodeURIComponent(path),
					dkey,
					storage
				});
				if (res.ok) {
					ctype = res.body.ctype;
					// console.log({ ctype });
				}
			}
			const view_args =
				storage + toQueryString({ path: encodeURIComponent(path), dkey, ctype, size });
			if (isMedia(ctype, true)) {
				if (!ctype.includes('image') && !inBrowser && state.serverStore.get().isMpvInstalled) {
					const url =
						API +
						'/media' +
						toQueryString({ storage, path: encodeURIComponent(path), dkey, ctype, size });
					api.post('/mpv_stream', {
						url
					});
				} else {
					const url = `/view/media-${view_args}`;
					goto(url);
				}
			} else if (ctype.includes('pdf')) {
				const url = `/view/embed-${view_args}`;
				goto(url);
			} else {
				const language = extractLang(ctype, path);
				if (ctype.includes('text') || language) {
					const url = `/view/text-${view_args}&language=${language}`;
					goto(url);
				} else if (ctype === 'application/x-empty')
					state.notify.info('It seems this file is empty');
				else if (ctype) state.notify.warning('sorry  cannot open file type: ' + ctype);
			}
		},
		openFolder({ state, commit, dispatch }, { dir, path, dkey, silent, storage }) {
			dir = dir || '/';
			if (path) {
				dir = path;
				commit('updateDirs', dkey, path);
			}
			if (!state.socket) return;
			if (!silent) {
				// commit('folder', []);
				dispatch('loading', 'load-page');
			}
			const opts = { dir, show_hidden: state.show_hidden.get() };
			if (storage === 'fs') {
				state.socket.on('ready', () => {
					state.socket.signal('fs-list', opts);
				});
				state.socket.signal('fs-list', opts);
			} else {
				state.socket.on('ready', () => {
					state.socket.signal('drive-list', { ...opts, dkey });
				});
				state.socket.signal('drive-list', { ...opts, dkey });
			}
		},
		setupMenuItems(
			{ dispatch, g, state },
			{ size, storage, dkey, isFile, path, dir, name, ctype }
		) {
			// console.log({ size, storage, dkey, isFile, path, ctype });
			const items: ContextMenuItems = [
				{
					name: 'open',
					action: () => {
						// console.log('open', { size, storage, dkey, isFile, dir, path });
						dispatch('open', { size, storage, dkey, isFile, dir, path, ctype });
						dispatch('context_menu', []);
					}
				},
				{
					name: 'play in browser',
					action: () => {
						dispatch('openFile', { size, storage, dkey, isFile, path, ctype, inBrowser: true });
						dispatch('context_menu', []);
					},
					disabled: !isMedia(ctype, false),
					hidden: !isMedia(ctype, false) || !isFile
				},
				{
					name: 'download',
					action: () => {
						dispatch('context_menu', []);
						const link = document.createElement('a');
						link.href =
							API +
							`/download?storage=${storage}&dkey=${dkey}&type=${
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
						const dest = { path: !isFile && !path.endsWith('/') ? path + '/' : path, dkey, name };
						// console.log('dest', dest);
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
					},
					disabled: !g('clipboard').get()
				},
				{
					name: 'delete',
					action: () => {
						state.socket.signal('delete-path-item', { path, dkey, name });
						dispatch('context_menu', []);
					}
				},
				{
					name: 'make offline',
					action() {},
					options: {},
					disabled: true,
					hidden: true
				}
			];
			dispatch('context_menu', items);
		},
		setupMainMenuItems({ dispatch, commit, g, state }, { storage, dkey, dir, name }) {
			const items: ContextMenuItems = [
				{
					name: 'new',
					action() {},
					options: {},
					disabled: true
				},
				{
					name: 'make offline',
					action() {},
					options: {},
					disabled: true,
					hidden: storage === 'fs'
				},
				{
					name: 'upload',
					action() {},
					options: {},
					disabled: true
				},
				{
					name: 'paste',
					action: () => {
						const src = g('clipboard').get();
						const dest = { path: dir.endsWith('/') ? dir : dir + '/', dkey, name };
						// console.log('dest', dest);
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
					},
					disabled: !g('clipboard').get()
				}
			];
			dispatch('context_menu', items);
		}
	}
};
