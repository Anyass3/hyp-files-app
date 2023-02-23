import connection from '$lib/socket';
import { Pagination } from '$lib/utils';
import _ from 'lodash-es';
let connectionMsg = 'connections ready';
const notifyConnected = _.debounce((notify, settings) => {
	console.log('settings', settings);
	notify.info(connectionMsg);
	connectionMsg = 'reconnected';
});
const pathname = () => window.location.pathname;

export default {
	noStore: ['api', 'socket'],
	state: {
		api: null,
		socket: null,
		serverStore: null
	},
	actions: {
		async startConnection({ state, commit, dispatch, g }) {
			if (state.socket && state.api) {
				if (!state.socket.connected)
					return new Promise((resolve, reject) => {
						state.socket.on('signal-connect', (settings) => {
							notifyConnected(state.notify, settings);
							resolve(settings);
						});
					});
				else return;
			}
			console.log('starting connection');
			const { socket, api, serverStore } = connection();
			dispatch('socket', socket);
			dispatch('api', api);

			socket.on('sync-state', (state) => {
				dispatch('serverStore', state);
			})
			// window['sk'] = socket;
			if (socket.connected) socket.signal('signal-connect');
			socket.on('ready', () => {
				// console.log('ready connection');
				socket.signal('signal-connect');
			});

			socket.on('folder-items', ({ items = [], page = 0, total = 0 } = {}) => {
				// if (pathname() !== '/files') return;
				console.log('folderItems', { items, page, total });
				dispatch('pagination', new Pagination({ total, page }));
				if (page === 1) {
					commit('folderItems', items || []);
				} else {
					state.folderItems.update((folderItems) => [...folderItems, ...(items || [])]);
				}
			});
			socket.on('offline-access', ({ dkey, path }) => {
				// if (pathname() !== '/files') return;
				if (state.dkey.get() === dkey)
					state.folderItems.update((folderItems) =>
						folderItems.map((item) => {
							if (item.path === path) item.stat.offline = true;
							return item;
						})
					);
				else if (path === state.folder.get().path)
					state.folder.update((folder) => {
						folder.stat.offline = true;
						return folder;
					});
			});
			socket.on('sharing-progress', ({ size, loadedBytes, phrase, send }) => {
				// if (pathname() !== '/tasks') return;
				state.sharingProgress.update((sharingProgress) => {
					sharingProgress[send + phrase] = `${((loadedBytes / size) * 100).toFixed(1)}%`;
					return sharingProgress;
				});
				// console.log('loadedBytes / size', loadedBytes, size, (loadedBytes / size) * 100);
			});
			socket.on('url-download-progress', ({ url, loaded, total }) => {
				// if (pathname() !== '/tasks') return;
				state.downloadingProgress.update((downloadingProgress) => {
					downloadingProgress[url] = `${((loaded / total) * 100).toFixed(1)}%`;
					return downloadingProgress;
				});
			});
			// socket.on('offline-access-in-progress', ({ dkey, path }) => {
			// 	if (state.dkey.get() === dkey)
			// 		state.folderItems.update((folderItems) =>
			// 			folderItems.map((item) => {
			// 				if (item.path === path) item.stat['offlinePending'] = true;
			// 				return item;
			// 			})
			// 		);
			// 	// console.log(state.folderItems.get(), { dkey, path });
			// });
			socket.on('notify-danger', async (msg) => {
				// console.log(msg);
				state.notify.danger(msg, 5000);
			});
			socket.on('notify-info', async (msg) => {
				// console.log(msg);
				state.notify.info(msg);
			});

			socket.on('notify-warn', async (msg) => {
				// console.log(msg);
				state.notify.warning(msg, 5000);
			});

			socket.on('notify-success', async (msg) => {
				// console.log(msg);
				state.notify.success(msg);
			});

			socket.on('child-process:spawn', ({ pid, cm }) => {
				state.notify.info(`child-process:${cm} spawning with PID: ${pid}`);
			});

			socket.on('child-process:exit', (msg) => {
				state.notify.info(msg);
			});

			socket.on('child-process:killed', (msg) => {
				state.notify.info(msg);
			});
			// socket.on('drives', (savedDrives: Array<{ key; name }>) => {
			// 	console.log('drives', savedDrives);
			// 	const { drives } = serverStore.get();
			// 	const connecteds = drives.reduce((arr, drive) => [...arr, drive?.key], []);
			// 	savedDrives = savedDrives.map(({ key, name }) => ({
			// 		key,
			// 		name,
			// 		connected: connecteds.includes(key)
			// 	}));

			// 	commit('drives', savedDrives);
			// });
			// socket.on('drive-closed', (key) => {
			// 	// console.log('drive-closed', key);
			// 	// let drives = state.drives.get();
			// 	// drives = drives.map((drive) => {
			// 	// 	if (drive.key === key) drive.connected = false;
			// 	// 	return drive;
			// 	// });
			// 	// commit('drives', drives);
			// });
			// socket.on('drive-connected', (key) => {
			// 	// console.log('drive-connected', key);
			// 	// let drives = state.drives.get();
			// 	// drives = drives.map((drive) => {
			// 	// 	if (drive.key === key) drive.connected = true;
			// 	// 	return drive;
			// 	// });
			// 	// commit('drives', drives);
			// });
			socket.on('storage-updated', (_dkey) => {
				if (pathname() !== '/files') return;
				const dkey = state.dkey.get();
				if (dkey === dkey) {
					const dir = g('dirs', dkey, true);
					const storage = dkey !== 'fs' ? 'drive' : 'fs';
					dispatch('open', { dir, dkey, storage, silent: true });
				}
			});

			serverStore.subscribe((data) => {
				console.log('server-store', data);
			});

			socket.on('disconnection', () => {
				console.log('disconnected');
			});
			return new Promise((resolve, reject) => {
				socket.on('signal-connect', (settings) => {
					notifyConnected(state.notify, settings);
					resolve(settings);
				});
			});
		}
	}
};
