import colors from 'colors';
import fs from 'fs';
import { setupBee, setupCorestore } from './setup.js';
import { Settings, setSettings } from './settings.js';
import { getRandomStr, debounce } from './utils.js';
import Drive, { setDriveEvents } from './drive.js';
import startCore from './core.js';
import { getEmitter, getBeeState, makeApi } from './state.js';
import { Connect, Extention } from './peers.js';
import Path from 'path';
import { v4 as uuidV4 } from 'uuid';

const config = Settings();
const emitter = getEmitter();

export default async function () {
	const { bee, cleanup: pcleanup, getNamespace, setNamespace, ...privateHyp } = await setupBee();
	// const cores = bee.sub('cores');
	const drivesBee = bee.sub('drives');

	const { cleanup, ...publicHyp } = await setupCorestore();

	// let publicCoreKey = (await cores.get('public'))?.value;
	let publicDriveKey = (await drivesBee.get('public'))?.value?.key;

	// let pcore = (await cores.get('private'))?.value?.key;// private core
	let privateDrivekey = (await drivesBee.get('private'))?.value?.key;

	//functions
	async function startDrive(
		{ corestore, networker = undefined },
		dkey,
		{ replicate = false, name, announce = false, lookup = false }
	) {
		// console.log('networker', !!networker, announce, lookup, replicate);
		let newNamespace = false;
		let namespace = await getNamespace(dkey);
		if (!namespace) {
			newNamespace = true;
			namespace = uuidV4().replace(/-/g, '');
		}
		const driveStore = corestore.namespace(namespace);
		const drive = new Drive(driveStore, dkey);
		await drive.$ready(name);
		if (newNamespace) setNamespace(drive.$key, namespace);

		if (networker) {
			// if (replicate)
			// 	networker.configure(drive.discoveryKey, {
			// 		server: true,
			// 		client: !drive.writable
			// 	});
			// else
			networker.configure(drive.discoveryKey, {
				server: drive.writable,
				client: !drive.writable
			});
		}

		drive.on('close', () => {
			if (networker)
				networker.configure(drive.discoveryKey, {
					server: false,
					client: false
				});
			driveStore.close();
			emitter.broadcast('notify-info', `${name} drive connection closed`);
			emitter.log(colors.cyan('closed ' + name));
		});

		setDriveEvents(drive, name);
		return drive;
	}

	// let core = await startCore({...publicHyp, key: publicCoreKey});
	let publicDrive = await startDrive(publicHyp, publicDriveKey, {
		replicate: true,
		name: 'public'
	});
	let privateDrive = await startDrive(privateHyp, privateDrivekey, {
		replicate: false,
		name: 'private'
	});
	// let ext = await Extention(core); // this will be used for chats
	// let extChanged = false;
	let startedSignals = false;

	if (!publicDrive.writable) {
		// || !core.writable
		const snapshot = bee.snapshot();
		emitter.log(colors.red('snapshot: '), snapshot);
		// if (!core.writable) {
		// 	core.close();
		// 	core = await startCore({...publicHyp});
		// 	await cores.put('public', core?.key?.toString?.('hex'));
		// }
		if (!publicDrive.writable) {
			publicDrive.close();
			publicDrive = await startDrive(publicHyp, publicDriveKey, {
				replicate: true,
				name: 'public'
			});
			await drivesBee.put('public', { key: publicDrive?.$key, replicate: true });
		}
	}
	// if (!publicCoreKey && core.writable) {
	// 	emitter.log(
	// 		colors.red('!publicCoreKey && core.writable'),
	// 		!publicCoreKey && core.writable,
	// 		publicCoreKey,
	// 		core?.key?.toString?.('hex')
	// 	);
	// 	await cores.put('public', core?.key?.toString?.('hex'));
	// }
	if (!publicDriveKey && publicDrive.writable) {
		emitter.log(
			colors.red('!publicDriveKey && publicDrive.writable'),
			!publicDriveKey && publicDrive.writable
		);
		await drivesBee.put('public', { key: publicDrive?.$key, replicate: true });
	}
	if (!privateDrivekey && privateDrive.writable) {
		emitter.log(
			colors.red('!privateDrivekey && privateDrive.writable'),
			!privateDrivekey && privateDrive.writable
		);
		await drivesBee.put('private', { key: privateDrive?.$key, replicate: false });
	}

	return async ({ channel, api = makeApi() }) => {
		emitter.log('channel::connect', channel.key);
		api.channels.set(channel.key, channel);

		const refreshSavedDrives = async ({ key, name }, connected = false) => {
			if (await drivesBee.get(name)) {
				const drives = api.getSavedDrives().map((drive) => {
					if (drive.key === key) drive.connected = connected;
					return drive;
				});
				api.setSavedDrive(drives);
			}
		};
		const broadcast = (ev, data) => {
			channel.signal(ev, data);
		};

		if (!api.getDrive(privateDrive.$key) && !(privateDrive.closed || privateDrive.closing)) {
			api.addDrive({ key: privateDrive.$key, name: 'private' }, privateDrive);
		}
		if (!api.getDrive(publicDrive.$key) && !(publicDrive.closed || publicDrive.closing)) {
			api.addDrive({ key: publicDrive.$key, name: 'public' }, publicDrive);
		}
		// if (!core?.opened) {
		// 	emitter.log(colors.blue(`!core?.opened`), !core?.opened, core);
		// 	core = await startCore({...publicHyp, key: publicCoreKey});
		// 	ext = await Extention(core);
		// }
		if (!publicDrive?.opened) {
			emitter.log(colors.blue(`!publicDrive??.opened`), !publicDrive?.opened);
			publicDrive = await startDrive(publicHyp, publicDriveKey, {
				replicate: false,
				name: 'public'
			});
			publicDriveKey = publicDrive.$key;
		}
		//init saved drives
		(async function () {
			if (startedSignals) return;
			const _drives = (await getBeeState(drivesBee)).map(({ key, ...kvs }) => ({
				key,
				...kvs,
				connected: api.connectedDrives.includes(key)
			}));
			api.setSavedDrive(_drives);
			api.cleanups.push(cleanup);
			api.cleanups.push(pcleanup);
			api.clients.set(publicDriveKey, { publicHyp });
		})();

		// advertise me
		// if (!(await core.has(0))) await core.append(publicDrive.$key);
		// NOTE:: allow to run in background for now
		// emitter.log(colors.blue('websocket client connected and client network: '), {
		// 	announce: true,
		// 	lookup: true
		// });
		// publicHyp.replicate(core);
		if (!(publicDrive.closed || publicDrive.closing))
			publicHyp.networker.configure(publicDrive.discoveryKey, { server: true, client: false });

		// async function onmessage(msg, peer) {
		// 	emitter.log('.onmessage', peer);
		// 	channel.signal('message', { msg, peer });
		// }

		// if (!extChanged) {
		// 	ext.on('info', async ({ corekey, drivekey, username }, peer) => {
		// 		emitter.log('hi there :: info');
		// 	});
		// }

		channel.on('message', async ({ message, peer }) => {
			emitter.log('channel.onmessage', peer);
			// ext.emit(message, peer);
		});

		channel.on('signal-connect', async () => {
			emitter.log('getting settings');
			channel.signal('signal-connect', Settings());
			channel.emit('get-drives');
		});

		channel.on('set-settings', Settings);

		channel.on('join peer', async (corekey) => {
			// const { peerCore, peerDrive, peerExt } = await Connect(publicHyp, corekey, api);
		});
		channel.on('connect-drive', async ({ name, key, replicate = true }) => {
			if (!key?.match(/^[a-z0-9]{64}$/)) {
				emitter.broadcast('notify-warn', 'please input a valid drive key');
				return;
			}
			const network = privateDrivekey !== key;
			const savedDrives = await getBeeState(drivesBee);
			emitter.log('saved-drives', savedDrives);

			if (!name) name = getRandomStr();
			const drive = await startDrive(network ? publicHyp : privateHyp, key, { replicate, name }); /// TODO: announce, lookup
			api.addDrive({ key: drive.$key, name }, drive);
			// channel.signal('drive-connected', key);
			emitter.broadcast('notify-success', `${name} drive connected`);
			if (publicDriveKey === key) {
				publicDrive = drive;
			} else if (privateDrivekey === key) {
				privateDrive = drive;
			}
			refreshSavedDrives({ key, name }, true);
		});

		channel.on('save-drive', async ({ key, name, network = false, replicate = true }) => {
			if (!key?.match(/[a-z0-9]{64}/)) {
				emitter.broadcast('notify-warn', 'please input a valid drive key');
				return;
			}
			if (!name) {
				let drive = api.getSavedDrive(key);
				if (drive) name = drive.name;
				else name = getRandomStr();
			}
			await drivesBee.put(name, { key, network, replicate }); // the drives bee
			api.addSavedDrive(key, name, true);
			// channel.signal('drive-saved', key);
			emitter.broadcast('notify-success', `${name} drive saved`);
			emitter.log('saved-drive');
		});

		channel.on('add-drive', async ({ name, key, network = false, replicate = true }) => {
			channel.emit('connect-drive', { name, key, network, replicate });
			channel.emit('save-drive', { name, key, network, replicate });
		});

		channel.on('check-drive', async (name) => {
			const drive = await drivesBee.get(name);
			channel.signal('checked-drive', drive);
		});

		channel.on('get-drives', async () => {
			const _drives = await getBeeState(drivesBee);
			emitter.log('get-drives', _drives);
			channel.signal('drives', _drives);
		});
		channel.on('close-drive', async ({ key, name }) => {
			const drive = api.drives.get(key);
			if (!drive) return;

			emitter.log('closing-drive', name);
			await drive.close();

			emitter.log('closed-drive', name);

			api.removeDrive(key);
			refreshSavedDrives({ key, name });
		});

		channel.on('delete-drive', async ({ key, name }) => {
			const drive = drivesBee.del(name) || { name };
			api.removeSavedDrive(key);
			emitter.broadcast('notify-success', `drive "${name}" deleted`);
			// channel.signal('deleted-drive', drive);
			emitter.log(colors.red('deleted-drive'));
		});
		channel.on('log', async (log) => {
			// core.append(log);
		});
		channel.on('drive-list', async ({ dkey, dir, ...opts }) => {
			emitter.log('drive-list', dkey, dir, opts);
			const drive = await api.drives.get(dkey);
			const items = await drive?.$list?.(dir, false, { ...opts, paginate: true });
			// emitter.log('drive-listitems', items);
			channel.signal('folder', items);
		});

		channel.on('drive-download', async ({ dkey, dir }) => {
			const drive = await api.drives.get(dkey);
			await drive?.$download?.(dir);
		});
		channel.on('fs-list', async ({ dir, ...opts }) => {
			emitter.log('fs-list', dir);
			const items = await privateDrive.$listfs(dir, { ...opts, paginate: true });
			channel.signal('folder', items);
		});
		channel.on('privateDrive:makedir', privateDrive.$makedir);
		channel.on('paste-copied', async ({ src, dest }) => {
			emitter.log({ src, dest });
			publicDrive.$__copy__(
				{
					path: src.path,
					isdrive: !!src.dkey?.match(/[a-z0-9]{64}/),
					drive: await api.drives.get(src.dkey)
				},
				{
					path: dest.path,
					isdrive: !!dest.dkey?.match(/[a-z0-9]{64}/),
					drive: await api.drives.get(dest.dkey)
				}
			);
		});
		channel.on('delete-path-item', async ({ path, dkey, name }) => {
			if (dkey?.match(/[a-z0-9]{64}/)) {
				const drive = await api.drives.get(dkey);
				if ((await drive.promises.stat(path)).isDirectory()) drive.$removedir(path);
				else drive.$remove(path);
				emitter.broadcast('notify-success', `${name} deleted`);
			} else {
				path = Path.join(config.fs, path);
				if (fs.statSync(path).isDirectory()) fs.rmdirSync(path, { recursive: true });
				else fs.unlinkSync(path);
				emitter.broadcast('notify-success', `${name} deleted`);
				emitter.broadcast('storage-updated', 'fs');
			}
		});
		channel.on('privateDrive:list', privateDrive.$list);
		emitter.on('broadcast', broadcast);
		channel.on('child-process:kill', (pid) => {
			emitter.log('child-process:kill', pid);
			emitter.emit('child-process:kill', pid);
		});
		channel.on('disconnect', async () => {
			// NOTE:: allow to run in background for now
			emitter.log('channel::disconnect', channel.key);
			// emitter.log(colors.red('websocket client disconnected and client network: '), {
			// 	announce: false,
			// 	lookup: false
			// });
			// publicHyp.network.configure(core, { announce: false, lookup: false });
			emitter.off('broadcast', broadcast);
			api.channels.delete(channel.key);
			// if (Array.from(api.channels.keys()).length === 0) {
			// 	const connectedDrives = api.getDrives();
			// 	emitter.log('closing connectedDrives', connectedDrives);
			// 	for (let { key, name } of connectedDrives) {
			// 		channel.emit('close-drive', { key, name });
			// 	}
			// }
		});
		startedSignals = true;
	};
}
