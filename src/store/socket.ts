import connection from '$lib/socket';
import { Pagination } from '$lib/utils';

export default {
	noStore: ['api', 'socket', 'serverStore', 'pagination'],
	storeType: {
		dkey: 'sessionPersistantStore',
		show_hidden: 'sessionPersistantStore',
		dirs: 'sessionPersistantStore'
	},
	state: {
		api: null,
		pagination: {},
		loading: 'load-page',
		socket: null,
		serverStore: null,
		drives: [],
		dkey: 'fs',
		folder: [],
		dirs: { fs: '/' },
		show_hidden: true
	},
	actions: {
		async startConnection({ state, commit, dispatch, g }) {
			console.log('starting connection');
			if (state.socket && state.api) return;
			const { socket, api, serverStore } = connection();
			dispatch('socket', socket);
			dispatch('api', api);
			dispatch('serverStore', serverStore);
			// window['sk'] = socket;
			if (socket.connected) socket.signal('signal-connect');
			socket.on('ready', () => {
				// console.log('ready connection');
				socket.signal('signal-connect');
			});

			socket.on('signal-connect', (settings) => {
				console.log('settings', settings);
				state.notify.info('connections ready');
			});
			socket.on('folder', ({ items = [], page = 0, total = 0 } = {}) => {
				// console.log('folder', { items, page, total });
				dispatch('pagination', new Pagination({ total, page }));
				if (page === 1) {
					commit('folder', items || []);
				} else {
					state.folder.update((folder) => [...folder, ...(items || [])]);
				}
			});
			socket.on('notify-danger', async (msg) => {
				// console.log(msg);
				state.notify.danger(msg, 10000);
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
		}
	}
};
