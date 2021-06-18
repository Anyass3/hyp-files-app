import connection from '$lib/socket';
import { sessionStoreObj } from './utils';

export default {
	noStore: ['api', 'socket', 'serverStore', 'currentdirs'],
	state: {
		api: null,
		socket: null,
		serverStore: null,
		drives: [],
		dkey: null,
		folder: [],
		currentdirs: sessionStoreObj('currentdirs', { fs: '/' })
	},
	actions: {
		async startConnection({ state, commit, dispatch }) {
			console.log('starting connection');
			if (state.socket && state.api) return;
			const { socket, api, serverStore } = connection();
			dispatch('socket', socket);
			dispatch('api', api);
			dispatch('serverStore', serverStore);
			window['sk'] = socket;
			if (socket.connected) socket.signal('signal-connect');
			socket.on('ready', () => {
				console.log('ready connection');
				socket.signal('signal-connect');
			});
			socket.on('signal-connect', (settings) => {
				console.log('settings', settings);
				// socket.signal('get-drives');
			});
			socket.on('folder', (items) => {
				console.log('folder', items);
				commit('folder', items);
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
			socket.on('drive-closed', (key) => {
				console.log('drive-closed', key);
				// let drives = state.drives.get();
				// drives = drives.map((drive) => {
				// 	if (drive.key === key) drive.connected = false;
				// 	return drive;
				// });
				// commit('drives', drives);
			});
			socket.on('drive-connected', (key) => {
				console.log('drive-connected', key);
				// let drives = state.drives.get();
				// drives = drives.map((drive) => {
				// 	if (drive.key === key) drive.connected = true;
				// 	return drive;
				// });
				// commit('drives', drives);
			});
			serverStore.subscribe((data) => {
				console.log('server-store', data);
			});
		}
	}
};
