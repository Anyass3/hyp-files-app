import chalk from 'chalk';
import { setupBee, setupHyperspace } from './setup.js';
import { Settings, setSettings } from './settings.js';
import { getRandomStr, getState, makeApi } from './utils.js';
import Drive from './drive.js';
import lodash from 'lodash';

async function startCore(client, key) {
	// Create a new RemoteCorestore.
	const store = client.corestore();

	// Create a fresh Remotehypercore.
	const core = store.get({
		key,
		valueEncoding: 'utf-8'
	});
	await core.ready(); // wait for keys to be populated
	// key to be shared by intiator
	console.log(chalk.gray('Core Key ' + core?.key?.toString?.('hex')));
	console.log(chalk.gray('Core Writable: ' + core?.writable)); // do we possess the private key of this core?
	// core or feed events
	core.on('peer-add', async (peer) => {
		// Log when the core has any new peers.
		console.log(chalk.gray('Replicating with a new peer from ' + peer.remoteAddress));
	});
	core.on('peer-remove', async (peer) => {
		// Log when the core a peer is disconnected.
		console.log(chalk.gray('peer disconnected ' + peer.remoteAddress));
		// api.removePeer(peer.key.toString('hex'));
	});
	return core;
}
async function startDrive(client, dkey, _public = true) {
	const drive = new Drive(client.corestore(), dkey);
	await drive.ready();
	client.network.configure(drive.drive.discoveryKey, { announce: _public, lookup: _public });
	return drive;
}

async function Extention(core, peer = '') {
	// create a messenger ext. any peer can send and recieve messages
	const events = {};
	const ext = {
		on: async (event, fn) => {
			const fns = events[event] || [];
			events[event] = fns.concat(fn);
		}
	};
	const _ext = core.registerExtension(peer + 'extention', {
		encoding: 'json',
		onmessage: ({ event, data }, peer) => {
			console.log(chalk.blue(`ext ${peer.remoteAddress}:`), event, chalk.green(data));
			events[event]?.forEach?.(async (fn) => {
				try {
					return await fn(data);
				} catch (error) {
					console.log(chalk.red('error: ' + error.message));
				}
			});
			// if (event === 'info') oninfo(data, peer);
			// else onmessage(data, peer);
		}
	});
	ext.send = (data, peer) => {
		_ext.send({ event: 'message', data }, peer);
	};
	ext.emit = (event, data, peer) => {
		_ext.send({ event, data }, peer);
	};
	ext.info = ({ corekey, drivekey, username = Settings().username }, peer) => {
		let info = {
			event: 'info',
			data: {
				corekey,
				drivekey,
				username
			}
		};
		if (peer) _ext.send(info, peer);
		else _ext.broadcast(info);
	};
	ext.broadcast = (event, data) => {
		_ext.broadcast({ event, data });
	};

	ext.on('update-core', async () => {
		core.update();
	});
	if (core.writable) {
		core.on('append', async () => {
			ext.broadcast('update-core');
			const idx = core.length - 1;
			console.log(chalk.blue('log: ' + idx), await core.get(idx));
		});
	}
	return ext;
}

async function Connect(client, corekey, api) {
	// if I joined with another peer's public key
	const core = await startCore(client, corekey);
	const drive = await Drive(client.corestore(), await core.get(0));
	corekey = core.key.toString('hex');
	api.addPeer({
		corekey,
		drivekey: drive.key
	});
	api.addPeerCore(corekey, core);
	api.addPeerDrive(drive.key, drive);
	core.on('close', async () => {
		api.removePeer(corekey);
		api.removePeerObj(corekey);
		api.removePeerCore(corekey);
		api.removePeerDrive(core.get(1));
	});
	const { ext } = Extention(core);
	return { core, drive, ext };
}

async function setDriveEvents(_drive, name = '', { cleanup } = {}) {
	_drive.drive.on('peer-add', (peer) => {
		console.log(chalk.cyan('new peer joined: ' + name), peer);
	});
	_drive.drive.on('update', () => {
		console.log(chalk.cyan('updated: ' + name));
	});
	_drive.drive.on('peer-open', (peer) => {
		console.log(chalk.cyan('peer-open: ' + name), peer);
	});
	_drive.drive.on('close', () => {
		if (cleanup) cleanup(false);
		console.log(chalk.cyan('closed ' + name));
	});
	// console.log(_drive.drive, _drive.drive.update);
	// if (!_drive.drive.writable)
	// 	setInterval(async () => {
	// 		try {
	// 			// updates the log or feed
	// 			await _drive.drive.update();
	// 		} catch (error) {
	// 			console.log(error.message);
	// 		}
	// 	}, 3000);
}

export default async function () {
	const { bee, client: pclient, cores, drives, cleanup: pcleanup } = await setupBee();
	const { client, cleanup } = await setupHyperspace({ host: Settings().publicHost || undefined });

	let publicCoreKey = (await cores.get('public'))?.value?.key;
	let publicDriveKey = (await drives.get('public'))?.value?.key;
	// let pcore = (await cores.get('private'))?.value?.key;
	let pdrivekey = (await drives.get('private'))?.value?.key;
	console.log(chalk.red('pdrivekey: ' + pdrivekey + ' ' + publicDriveKey));
	let core = await startCore(client, publicCoreKey);
	let drive = await startDrive(client, publicDriveKey);
	let pdrive = await startDrive(pclient, pdrivekey, false);
	let ext = await Extention(core);
	let extChanged = false;
	let startedSignals = false;

	if (!drive.writable || !core.writable) {
		const snapshot = bee.snapshot();
		console.log(chalk.red('snapshot'), snapshot);
		if (!core.writable) {
			core.close();
			core = await startCore(client);
			await cores.put('public', core?.key?.toString?.('hex'));
		}
		if (!drive.writable) {
			drive.drive.close();
			drive = await startDrive(client, publicDriveKey);
			await drives.put('public', { key: drive?.key, _public: true });
		}
	}
	if (!publicCoreKey && core.writable) {
		console.log(chalk.red('!publicCoreKey && core.writable'), !publicCoreKey && core.writable);
		await cores.put('public', core?.key?.toString?.('hex'));
	}
	if (!publicDriveKey && drive.writable) {
		console.log(chalk.red('!publicDriveKey && drive.writable'), !publicDriveKey && drive.writable);
		await drives.put('public', { key: drive?.key, _public: true });
	}
	if (!pdrivekey && pdrive.writable) {
		console.log(chalk.red('!pdrivekey && pdrive.writable'), !pdrivekey && pdrive.writable);
		await drives.put('private', { key: pdrive?.key, _public: false });
	}
	setDriveEvents(drive, 'public');
	setDriveEvents(pdrive, 'private');

	return async ({ channel, api = makeApi() }) => {
		console.log(chalk.red(drive.drive.closed, drive.drive.closing));
		if (!(await api.getDrive(pdrive.key)) && !(pdrive.drive.closed || pdrive.drive.closing)) {
			api.addDrive(pdrive.key, 'private', pdrive);
		}
		if (!(await api.getDrive(drive.key)) && !(drive.drive.closed || drive.drive.closing)) {
			api.addDrive(drive.key, 'public', drive);
		}
		if (!core?.opened) {
			console.log(chalk.blue(`!core?.opened`), !core?.opened, core);
			core = await startCore(client, publicCoreKey);
			ext = await Extention(core);
		}
		if (!drive?.drive?.opened) {
			console.log(chalk.blue(`!drive?.drive?.opened`), !drive?.drive?.opened);
			drive = await startDrive(client, publicDriveKey);
		}
		//init saved drives
		(async function () {
			if (startedSignals) return;
			const _drives = ((await getState(drives)) || []).map(({ key, ...kvs }) => ({
				key,
				...kvs,
				connected: api.connectedDrives.includes(key)
			}));
			api.setSavedDrive(_drives);
			api.cleanups.push(cleanup);
			api.cleanups.push(pcleanup);
		})();

		// advertise me
		if (!(await core.has(0))) await core.append(drive.key);
		console.log(chalk.blue('websocket client connected and client network: '), {
			announce: true,
			lookup: true
		});
		client.replicate(core);
		if (!(drive.drive.closed || drive.drive.closing)) client.replicate(drive.drive);

		// async function onmessage(msg, peer) {
		// 	console.log('.onmessage', peer);
		// 	channel.signal('message', { msg, peer });
		// }

		if (!extChanged) {
			ext.on('info', async ({ corekey, drivekey, username }, peer) => {
				console.log('hi there :: info');
			});
		}

		channel.on('message', async ({ message, peer }) => {
			console.log('channel.onmessage', peer);
			ext.emit(message, peer);
		});

		channel.on('signal-connect', async () => {
			console.log('getting settings');
			channel.signal('signal-connect', Settings());
			channel.emit('get-drives');
		});

		channel.on('set-settings', Settings);
		channel.on('join peer', async (corekey) => {
			const { peerCore, peerDrive, peerExt } = await Connect(client, corekey, api);
		});
		channel.on('connect-drive', async ({ name, key, host, public: _public = true }) => {
			let instance = { client: _public ? client : pclient };
			if (host) {
				instance = await setupHyperspace({ host });
				api.cleanups.push(instance.cleanup);
			}
			if (!name) name = getRandomStr();
			const _drive = await startDrive(instance.client, key, _public);
			api.addDrive(_drive.key, name, _drive);
			channel.signal('drive-connected', key);
			if (await drives.get(name)) {
				console.log('close-drive', key);
				const _drives = ((await api.getSavedDrives()) || []).map((_drive) => {
					if (_drive.key === key) _drive.connected = true;
					return _drive;
				});
				api.setSavedDrive(_drives);
			}
			setDriveEvents(_drive, name, instance);
			if (publicDriveKey === key) {
				drive = _drive;
				client.replicate(drive.drive);
			} else if (pdrivekey === key) {
				pdrive = _drive;
				client.network.configure(pdrive.drive.discovrykey, { announce: false, lookup: false });
			}
		});
		channel.on('add-drive', async ({ name, key, host, public: _public = true }) => {
			let instance = { client: _public ? client : pclient };
			if (host) {
				instance = await setupHyperspace({ host });
				api.cleanups.push(instance.cleanup);
			}
			if (!name) name = getRandomStr();
			const newdrive = await startDrive(instance.client, key, _public);

			await drives.put(name, { key: newdrive.key, host, _public });
			const _drives = ((await getState(drives)) || []).map(({ key, ...kvs }) => ({
				key,
				...kvs,
				connected: api.connectedDrives.includes(key)
			}));
			api.setSavedDrive(_drives);
			api.addDrive(newdrive.key, name, newdrive);
			// channel.signal('drives', _drives);
		});
		channel.on('save-drive', async ({ key, name, host, _public = true }) => {
			if (!name) {
				_drive = api.getSavedDrive(key);
				name = _drive.name;
			}
			await drives.put(name, { key, host, _public }); // the drives bee
			api.addSavedDrive(key, name, true);
			channel.signal('drive-saved', key);
			console.log('saved-drive');
		});
		channel.on('check-drive', async (name) => {
			const _drive = await drives.get(name);
			channel.signal('checked-drive', _drive);
		});

		channel.on('get-drives', async () => {
			const _drives = await getState(drives);
			console.log(_drives);
			channel.signal('drives', _drives);
		});
		channel.on('close-drive', async ({ key, name }) => {
			const _drive = api.drives.get(key);
			_drive.drive.close();
			api.removeDrive(key);
			channel.signal('drive-closed', key);
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
			channel.signal('deleted-drive', _drive);
			console.log(chalk.red('deleted-drive'));
		});
		channel.on('log', async (log) => {
			core.append(log);
		});
		channel.on('drive-list', async ({ dkey, dir }) => {
			console.log('drive-list', dkey, dir);
			const _drive = await api.drives.get(dkey);
			const items = (await _drive?.list?.(dir)) || [];
			// console.log('drive-listitems', items, _drive);
			channel.signal('folder', items);
		});
		channel.on('drive-download', async ({ dkey, dir }) => {
			console.log('drive-list', dkey, dir);
			const _drive = await api.drives.get(dkey);
			const items = (await _drive?.list?.(dir)) || [];
			// console.log('drive-listitems', items, _drive);
			channel.signal('folder', items);
		});
		channel.on('fs-list', async (dir) => {
			console.log('fs-list');
			const items = await pdrive.listfs(dir);
			channel.signal('folder', items);
		});
		channel.on('pdrive:makedir', pdrive.makedir);
		channel.on('pdrive:list', pdrive.list);
		channel.on('pdrive:list', pdrive.list);
		channel.on('pdrive:list', pdrive.list);

		channel.on('disconnect', async () => {
			console.log(chalk.red('websocket client disconnected and client network: '), {
				announce: false,
				lookup: false
			});
			client.network.configure(core, { announce: false, lookup: false });
		});
		startedSignals = true;
	};
}
