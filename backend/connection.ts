import colors from 'kleur';
import fs from 'fs';
import { setupBee, setupCorestore } from './setup.js';
import { Settings, setSettings } from './settings.js';
import { getRandomStr, debounce } from './utils.js';
import Drive, { setDriveEvents } from './drive.js';
import startCore from './core.js';
import { getEmitter, getBeeState, API, getApi } from './state.js';
import { Connect, Extention } from './peers.js';
import { join } from 'path';
import { initiate, connect } from './share.js';
import { v4 as uuidV4 } from 'uuid';

const config = Settings();
const api = getApi();
const emitter = getEmitter();

export default async function () {
	const { bee, cleanup: pcleanup, getNamespace, setNamespace, ...privateHyp } = await setupBee();
	// const cores = bee.sub('cores');
	const drivesBee = bee.sub('drives');

	const { cleanup, ...publicHyp } = await setupCorestore();

	// let publicCoreKey = (await cores.get('public'))?.value;
	let publicDriveKey = (await drivesBee.get('public'))?.value?.key;

	// let pcore = (await cores.get('private'))?.value?.key;// private core
	const privateDrivekey = (await drivesBee.get('private'))?.value?.key;

	//functions
	async function startDrive(
		{ corestore, networker = undefined },
		dkey,
		{ _private = false, name }
	) {
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
			networker.configure(drive.discoveryKey);
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
		_private: false,
		name: 'public'
	});
	let privateDrive = await startDrive(privateHyp, privateDrivekey, {
		_private: true,
		name: 'private'
	});
	// let ext = await Extention(core); // this will be used for chats
	// let extChanged = false;
	let startedSignals = false;

	if (!publicDrive.writable) {
		// || !core.writable
		const snapshot = bee.snapshot();
		emitter.log(colors.red('snapshot: '), snapshot._checkouts);
		// if (!core.writable) {
		// 	core.close();
		// 	core = await startCore({...publicHyp});
		// 	await cores.put('public', core?.key?.toString?.('hex'));
		// }
		if (!publicDrive.writable) {
			publicDrive.close();
			publicDrive = await startDrive(publicHyp, publicDriveKey, {
				_private: false,
				name: 'public'
			});
			publicDriveKey = publicDrive?.$key;
			await drivesBee.put('public', { key: publicDrive?.$key, _private: false });
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
		await drivesBee.put('public', { key: publicDrive?.$key, _private: false });
	}
	if (!privateDrivekey && privateDrive.writable) {
		emitter.log(
			colors.red('!privateDrivekey && privateDrive.writable'),
			!privateDrivekey && privateDrive.writable
		);
		await drivesBee.put('private', { key: privateDrive?.$key, _private: true });
	}

	//init drives
	const _drives = await getBeeState(drivesBee);
	api.initDrives(_drives);
	api.cleanups.push(cleanup);
	api.cleanups.push(pcleanup);
	api.clients.set(publicDriveKey, { publicHyp });

	return async ({ channel }) => {
		emitter.log(colors.blue('channel::connect'), colors.blue(channel.key));
		api.channels.set(channel.key, channel);

		const broadcast = (ev, data) => {
			channel.signal(ev, data);
		};
		channel.on('cancel-sharing', ({ send, phrase }) => {
			emitter.emit('cancel-sharing-' + send + phrase);
		});
		{
			const drive = api.getDrive(privateDrive.$key);
			if (!drive.connected && !(privateDrive.closed || privateDrive.closing)) {
				api.updateDrive({ ...drive, saved: true, connected: true, writable: true }, privateDrive);
			}
		}
		{
			const drive = api.getDrive(publicDrive.$key);
			if (!drive.connected && !(publicDrive.closed || publicDrive.closing)) {
				api.updateDrive({ ...drive, saved: true, connected: true, writable: true }, publicDrive);
			}
		}
		// if (!core?.opened) {
		// 	emitter.log(colors.blue(`!core?.opened`), !core?.opened, core);
		// 	core = await startCore({...publicHyp, key: publicCoreKey});
		// 	ext = await Extention(core);
		// }
		if (!publicDrive?.opened) {
			emitter.log(colors.blue(`!publicDrive??.opened`), !publicDrive?.opened);
			publicDrive = await startDrive(publicHyp, publicDriveKey, {
				_private: false,
				name: 'public'
			});
			publicDriveKey = publicDrive.$key;
		}
		// advertise me
		// if (!(await core.has(0))) await core.append(publicDrive.$key);
		// NOTE:: allow to run in background for now
		// emitter.log(colors.blue('websocket client connected and client network: '), {
		// 	announce: true,
		// 	lookup: true
		// });
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
		channel.on('connect-drive', async ({ name, key, _private, storage }) => {
			if (!key?.match(/^[a-z0-9]{64}$/)) {
				emitter.broadcast('notify-warn', 'Please input a valid drive key');
				return;
			}
			const _drive = api.getDrive(key);
			if (_drive?.connected) {
				emitter.broadcast('notify-warn', 'Drive is already connected');
				return;
			}
			name = _drive?.name || name || getRandomStr();
			let drive: Drive;
			if (storage) {
				drive = new Drive(storage, key);
				await drive.$ready(name);
			} else {
				_private = _private ?? _drive?._private;
				drive = await startDrive(!_private ? publicHyp : privateHyp, key, { _private, name }); /// TODO: announce, lookup
			}
			if (_drive) {
				api.updateDrive({ ..._drive, connected: true }, drive);
			} else api.addDrive({ key: drive.$key, name, _private }, drive);
			// channel.signal('drive-connected', key);
			emitter.broadcast('notify-success', `"${name}" drive connected`);
			if (publicDriveKey === key) {
				publicDrive = drive;
			} else if (privateDrivekey === key) {
				privateDrive = drive;
			}

			// refreshSavedDrives({ key, name }, true);
		});

		channel.on('save-drive', async ({ key, name, _private, connected = true }) => {
			if (!key?.match(/[a-z0-9]{64}/)) {
				emitter.broadcast('notify-warn', 'Please input a valid drive key');
				return;
			}
			if (api.doesDriveNameExist(name, false)) {
				emitter.broadcast('notify-danger', 'Sorry drive with the same name is already saved');
				return;
			}
			const drive = api.getDrive(key);
			if (drive) {
				if (drive.saved) {
					emitter.broadcast('notify-warn', `Drive is already saved as "${drive.name}"`);
					return;
				}
				_private = _private ?? drive._private;
				name = drive.name;
				drive.saved = true;
				api.updateDrive(drive);
			} else {
				api.addDrive({ key, name, _private, connected, saved: true });
			}
			if (!name) {
				name = getRandomStr();
			}
			await drivesBee.put(name, { key, _private }); // the drives bee
			// channel.signal('drive-saved', key);
			emitter.broadcast('notify-success', `"${name}" drive saved`);
			emitter.log(`"${name}" drive saved`);
		});

		channel.on('save-and-connect-drive', async ({ name, key, _private }) => {
			if (!name) {
				emitter.broadcast('notify-warn', 'Sorry drive must have a name');
				return;
			}
			channel.emit('save-drive', { name, key, _private, connected: false });
			channel.emit('connect-drive', { name, key, _private });
		});

		channel.on('create-drive', async ({ name, _private = false }) => {
			if (!name) {
				emitter.broadcast('notify-danger', 'Sorry drive must have a name');
				return;
			}
			if (api.doesDriveNameExist(name)) {
				emitter.broadcast('notify-danger', 'Sorry drive with the same name already exists');
				return;
			}
			const drive = await startDrive(!_private ? publicHyp : privateHyp, undefined, {
				_private,
				name
			}); /// TODO: announce, lookup
			api.addDrive({ key: drive.$key, name, _private, saved: true }, drive);
			await drivesBee.put(name, { key: drive.$key, _private }); // the drives bee
			// channel.signal('drive-saved', key);
			emitter.broadcast('notify-success', `"${name}" drive created and connected`);
			emitter.log('created drive ' + drive.$key);
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
			drive.close();

			emitter.log('closed-drive', name);
			{
				const drive = api.getDrive(key);
				if (drive) {
					if (!drive.saved) {
						api.removeDrive(key);
						// await drive.promises.destroyStorage();
						// emitter.broadcast('notify-info', name + ' drive storage destroyed');
					}
					api.updateDrive({ ...drive, connected: false });
				}
			}

			// refreshSavedDrives({ key, name });
		});

		channel.on('delete-drive', async ({ key, name }) => {
			if (key === publicDriveKey || key === privateDrivekey) {
				emitter.broadcast('notify-danger', 'Sorry cannot delete default drives');
				return;
			}
			await drivesBee.del(name);
			emitter.broadcast('notify-success', `Drive "${name}" deleted`);
			// channel.signal('deleted-drive', drive);
			emitter.log(`Drive "${colors.red(name)}" deleted`);
			const drive = api.getDrive(key);
			if (!drive.connected) {
				api.removeDrive(key);
				//Todo
				// let namespace = await getNamespace(key);
				// const driveStore = (_drive._private ? privateHyp : publicHyp).corestore.namespace(
				// 	namespace
				// );
				// const drive = new Drive(driveStore, key);
				// await drive.promises.ready();
				// //@ts-ignore
				// await drive.promises.destroyStorage();
				// emitter.broadcast('notify-info', name + ' drive storage destroyed');
			} else {
				api.updateDrive({ ...drive, saved: false });
			}
		});
		channel.on('rename-drive', async ({ key, name }) => {
			if (key === publicDriveKey || key === privateDrivekey) {
				emitter.broadcast('notify-danger', 'Sorry cannot rename default drives');
				return;
			}
			if (!name) {
				emitter.broadcast('notify-danger', 'Cannot rename to empty name');
				return;
			}
			if (!key?.match(/[a-z0-9]{64}/)) {
				emitter.broadcast('notify-warn', 'Please input a valid drive key');
				return;
			}
			const drive = api.getDrive(key);
			// console.log(savedDrive, connectedDrive);
			if (!drive) {
				emitter.broadcast('notify-warn', 'Sorry drive does not exist');
				return;
			}

			if (drive.saved) {
				await drivesBee.del(drive.name);
				await drivesBee.put(name, { key, _private: drive._private }); // the drives bee
				api.updateDrive({ ...drive, name });
			}
			// channel.signal('drive-saved', key);
			const msg = `"${drive?.name}" drive renamed "${name}"`;
			emitter.broadcast('notify-success', msg);
			emitter.log(msg);
		});
		channel.on('log', async (log) => {
			// core.append(log);
		});
		channel.on('drive-list', async ({ dkey, dir, ...opts }) => {
			emitter.log('drive-list', dkey, dir, opts);
			const drive = await api.drives.get(dkey);
			const items = await drive?.$list?.(dir, false, { ...opts, filter: true });
			// emitter.log('drive-listitems', items);
			channel.signal('folder-items', items);
		});
		channel.on('fs-list', async ({ dir, ...opts }) => {
			emitter.log('fs-list', dir);
			const items = await privateDrive.$listfs(dir, { ...opts, filter: true });
			channel.signal('folder-items', items);
		});

		channel.on('offline-access', async ({ dkey, path, start, end }) => {
			const drive = await api.drives.get(dkey);
			channel.signal('offline-access-in-progress', { dkey, path });
			api.addOfflinePending(dkey, path);
			await drive?.$download?.(path, { start, end });
			channel.signal('offline-access', { dkey, path });
		});
		emitter.on('rm-offline-pending', (dkey, path) => {
			api.rmOfflinePending(dkey, path);
		});
		// channel.on('privateDrive:makedir', privateDrive.$makedir);
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
				path = join(config.fs, path);
				if (fs.statSync(path).isDirectory()) fs.rmSync(path, { recursive: true });
				else fs.rmSync(path);
				emitter.broadcast('notify-success', `${name} deleted`);
				emitter.broadcast('storage-updated', 'fs');
			}
		});
		channel.on('rename-item', async ({ oldPath, dkey, name }) => {
			if (dkey?.match(/[a-z0-9]{64}/)) {
				// const drive = await api.drives.get(dkey);
				// if ((await drive.promises.stat(path)).isDirectory()) drive.$removedir(path);
				// else drive.$remove(path);
				// emitter.broadcast('notify-success', `${name} deleted`);
			} else {
				fs.renameSync(join(config.fs, oldPath), join(config.fs, oldPath, '../', name));
				emitter.broadcast('notify-success', `${name} deleted`);
				emitter.broadcast('storage-updated', 'fs');
			}
		});
		emitter.on('broadcast', broadcast);
		channel.on('child-process:kill', (pid) => {
			emitter.log('child-process:kill', pid);
			emitter.emit('child-process:kill', pid);
		});
		channel.on('download-from-url', ({ url, dkey, filename, path }) => {
			api.downloader.download({ url, path, dkey, filename });
		});
		channel.on('cancel-download-from-url', ({ url }) => {
			api.downloader.downloading.find((file) => file.url == url)?.canceler('download cancelled');
		});
		channel.on('share send', ({ phrase, dkey, path, ...stat }) => {
			initiate({ phrase, dkey, path, stat });
		});
		channel.on('share receive', ({ phrase, dkey, path, ...stat }) => {
			connect({ phrase, dkey, path, stat });
		});
		channel.on('disconnect', async () => {
			// NOTE:: allow to run in background for now
			emitter.log(colors.dim('channel::disconnect'), colors.dim(channel.key));
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
