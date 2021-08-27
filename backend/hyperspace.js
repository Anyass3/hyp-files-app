import chalk from 'chalk';
import fs from 'fs';
import { setupBee, setupHyperspace } from './setup.js';
import { Settings, setSettings } from './settings.js';
import { getRandomStr, debounce } from './utils.js';
import Drive, { setDriveEvents } from './drive.js';
import startCore from './core.js';
import { getEmitter, getBeeState, makeApi } from './state.js';
import { Connect, Extention } from './peers.js';
import Path from 'path';
import { v4 as uuidV4 } from 'uuid';
// import lodash from 'lodash';

const config = Settings();
const emitter = getEmitter();

async function startDrive(
	client,
	dkey,
	{ replicate = false, name, announce = false, lookup = false }
) {
	const drive = new Drive(client.corestore(), dkey);
	await drive.$ready(name);
	if (replicate) client.replicate(drive.metadata);
	else
		client.network.configure(drive.metadata, {
			announce,
			lookup
		});
	return drive;
}

export default async function () {
	const { bee, client: privateClient, cleanup: pcleanup } = await setupBee();

	const cores = bee.sub('cores');
	const drives = bee.sub('drives');

	const { client: publicClient, cleanup } = await setupHyperspace({
		host: config.publicHost || undefined
	});

	// let publicCoreKey = (await cores.get('public'))?.value;
	let publicDriveKey = (await drives.get('public'))?.value?.key;

	// let pcore = (await cores.get('private'))?.value?.key;// private core
	let privateDrivekey = (await drives.get('private'))?.value?.key;
	// let core = await startCore(publicClient, publicCoreKey);
	let publicDrive = await startDrive(publicClient, publicDriveKey, {
		replicate: true,
		name: 'public'
	});
	let privateDrive = await startDrive(privateClient, privateDrivekey, {
		replicate: false,
		name: 'private'
	});
	// let ext = await Extention(core); // this will be used for chats
	// let extChanged = false;
	let startedSignals = false;

	if (!publicDrive.writable) {
		// || !core.writable
		const snapshot = bee.snapshot();
		emitter.log(chalk.red('snapshot: '), snapshot);
		// if (!core.writable) {
		// 	core.close();
		// 	core = await startCore(publicClient);
		// 	await cores.put('public', core?.key?.toString?.('hex'));
		// }
		if (!publicDrive.writable) {
			publicDrive.close();
			publicDrive = await startDrive(publicClient, publicDriveKey, {
				replicate: true,
				name: 'public'
			});
			await drives.put('public', { key: publicDrive?.$key, replicate: true });
		}
	}
	// if (!publicCoreKey && core.writable) {
	// 	emitter.log(
	// 		chalk.red('!publicCoreKey && core.writable'),
	// 		!publicCoreKey && core.writable,
	// 		publicCoreKey,
	// 		core?.key?.toString?.('hex')
	// 	);
	// 	await cores.put('public', core?.key?.toString?.('hex'));
	// }
	if (!publicDriveKey && publicDrive.writable) {
		emitter.log(
			chalk.red('!publicDriveKey && publicDrive.writable'),
			!publicDriveKey && publicDrive.writable
		);
		await drives.put('public', { key: publicDrive?.$key, replicate: true });
	}
	if (!privateDrivekey && privateDrive.writable) {
		emitter.log(
			chalk.red('!privateDrivekey && privateDrive.writable'),
			!privateDrivekey && privateDrive.writable
		);
		await drives.put('private', { key: privateDrive?.$key, replicate: false });
	}

	setDriveEvents(publicDrive, 'public');
	setDriveEvents(privateDrive, 'private');

	return async ({ channel, api = makeApi() }) => {
		emitter.log('channel::connect', channel.key);
		api.channels.set(channel.key, channel);
		const broadcast = (ev, data) => {
			channel.signal(ev, data);
		};

		if (
			!(await api.getDrive(privateDrive.$key)) &&
			!(privateDrive.closed || privateDrive.closing)
		) {
			api.addDrive({ key: privateDrive.$key, name: 'private' }, privateDrive);
		}
		if (!(await api.getDrive(publicDrive.$key)) && !(publicDrive.closed || publicDrive.closing)) {
			api.addDrive({ key: publicDrive.$key, name: 'public' }, publicDrive);
		}
		// if (!core?.opened) {
		// 	emitter.log(chalk.blue(`!core?.opened`), !core?.opened, core);
		// 	core = await startCore(publicClient, publicCoreKey);
		// 	ext = await Extention(core);
		// }
		if (!publicDrive?.opened) {
			emitter.log(chalk.blue(`!publicDrive??.opened`), !publicDrive?.opened);
			publicDrive = await startDrive(publicClient, publicDriveKey, {
				replicate: false,
				name: 'public'
			});
			publicDriveKey = publicDrive.$key;
		}
		//init saved drives
		(async function () {
			if (startedSignals) return;
			const _drives = ((await getBeeState(drives)) || []).map(({ key, ...kvs }) => ({
				key,
				...kvs,
				connected: api.connectedDrives.includes(key)
			}));
			api.setSavedDrive(_drives);
			api.cleanups.push(cleanup);
			api.cleanups.push(pcleanup);
			api.clients.set(publicDriveKey, { publicClient });
		})();

		// advertise me
		// if (!(await core.has(0))) await core.append(publicDrive.$key);
		// NOTE:: allow to run in background for now
		// emitter.log(chalk.blue('websocket client connected and client network: '), {
		// 	announce: true,
		// 	lookup: true
		// });
		// publicClient.replicate(core);
		if (!(publicDrive.closed || publicDrive.closing)) publicClient.replicate(publicDrive.metadata);

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
			const { peerCore, peerDrive, peerExt } = await Connect(publicClient, corekey, api);
		});
		channel.on('connect-drive', async ({ name, key, host, replicate = true }) => {
			if (!key?.match(/[a-z0-9]{64}/)) {
				emitter.broadcast('notify-warn', 'please input a valid drive key');
				return;
			}
			let instance = { client: replicate ? publicClient : privateClient };

			if (!replicate && host) {
				host = Settings().privateHost;
				if (!host) {
					host = uuidV4();
					setSettings('host', host);
				}
			}
			if (host) {
				instance = await setupHyperspace({ host });
				api.cleanups.push(instance.cleanup);
			}
			if (!name) name = getRandomStr();
			const _drive = await startDrive(instance.client, key, { replicate, name }); /// TODO: announce, lookup
			api.addDrive({ key: _drive.$key, name, host }, _drive);
			// channel.signal('drive-connected', key);
			emitter.broadcast('notify-success', `${name} drive connected`);
			if (await drives.get(name)) {
				emitter.log('close-drive', key);
				const _drives = ((await api.getSavedDrives()) || []).map((_drive) => {
					if (_drive.key === key) _drive.connected = true;
					return _drive;
				});
				api.setSavedDrive(_drives);
			}
			setDriveEvents(_drive, name, instance);
			if (publicDriveKey === key) {
				publicDrive = _drive;
				// publicClient.network.configure(drive, { announce: true, lookup: true });
				publicClient.replicate(publicDrive.metadata);
			} else if (privateDrivekey === key) {
				privateDrive = _drive;
				publicClient.network.configure(privateDrive.metadata, { announce: false, lookup: false });
			}
		});

		channel.on('save-drive', async ({ key, name, host, replicate = true }) => {
			if (!key?.match(/[a-z0-9]{64}/)) {
				emitter.broadcast('notify-warn', 'please input a valid drive key');
				return;
			}
			if (!name) {
				let _drive = api.getSavedDrive(key);
				if (_drive) name = _drive.name;
				else name = getRandomStr();
			}
			await drives.put(name, { key, host, replicate }); // the drives bee
			api.addSavedDrive(key, name, true);
			// channel.signal('drive-saved', key);
			emitter.broadcast('notify-success', `${name} drive saved`);
			emitter.log('saved-drive');
		});

		channel.on('add-drive', async ({ name, key, host, replicate = true }) => {
			channel.emit('connect-drive', { name, key, host, replicate });
			channel.emit('save-drive', { name, key, host, replicate });
		});

		channel.on('check-drive', async (name) => {
			const _drive = await drives.get(name);
			channel.signal('checked-drive', _drive);
		});

		channel.on('get-drives', async () => {
			const _drives = await getBeeState(drives);
			emitter.log('get-drives', _drives);
			channel.signal('drives', _drives);
		});
		channel.on('close-drive', async ({ key, name }) => {
			const _drive = api.drives.get(key);
			if (!_drive) return;
			const client = api.clients.get(key) || publicClient;
			client.network.configure(_drive.metadata, { announce: false, lookup: false });

			emitter.log('closing-drive', name);
			_drive.close();

			emitter.log('closed-drive');
			api.removeDrive(key);
			if (await drives.get(name)) {
				const _drives = ((await api.getSavedDrives()) || []).map((_drive) => {
					if (_drive.key === key) _drive.connected = false;
					return _drive;
				});
				api.setSavedDrive(_drives);
			}
		});
		channel.on('delete-drive', async ({ key, name }) => {
			const _drive = drives.del(name) || { name };
			api.removeSavedDrive(key);
			emitter.broadcast('notify-success', `drive "${name}" deleted`);
			// channel.signal('deleted-drive', _drive);
			emitter.log(chalk.red('deleted-drive'));
		});
		channel.on('log', async (log) => {
			// core.append(log);
		});
		channel.on('drive-list', async ({ dkey, dir, ...opts }) => {
			emitter.log('drive-list', dkey, dir, opts);
			const _drive = await api.drives.get(dkey);
			const items = await _drive?.$list?.(dir, false, { ...opts, paginate: true });
			// emitter.log('drive-listitems', items);
			channel.signal('folder', items);
		});
		channel.on('drive-download', async ({ dkey, dir }) => {
			const _drive = await api.drives.get(dkey);
			const items = (await _drive?.$download?.(dir)) || [];
			// emitter.log('drive-listitems', items, _drive);
			channel.signal('folder', items);
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
				const _drive = await api.drives.get(dkey);
				if ((await _drive.promises.stat(path)).isDirectory()) _drive.$removedir(path);
				else _drive.$remove(path);
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
			// emitter.log('child-process:kill', pid);
			emitter.emit('child-process:kill', pid);
		});
		channel.on('disconnect', async () => {
			// NOTE:: allow to run in background for now
			emitter.log('channel::disconnect', channel.key);
			// emitter.log(chalk.red('websocket client disconnected and client network: '), {
			// 	announce: false,
			// 	lookup: false
			// });
			// publicClient.network.configure(core, { announce: false, lookup: false });
			emitter.off('broadcast', broadcast);
			api.channels.delete(channel.key);
			// if (Array.from(api.channels.keys()).length === 0) {
			// 	const connectedDrives = await api.getDrives();
			// 	emitter.log('closing connectedDrives', connectedDrives);
			// 	for (let { key, name } of connectedDrives) {
			// 		channel.emit('close-drive', { key, name });
			// 	}
			// }
		});
		startedSignals = true;
	};
}
