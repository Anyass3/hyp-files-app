import chalk from 'chalk';
import readChunk from 'read-chunk';
import fileType from 'file-type';
import child_process from 'child_process';
import mime from 'mime-types';
import { extname } from 'path';

export const debounce = (fn, delay = 500) => {
	let timeout;
	return (...args) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			fn(...args);
		}, delay);
	};
};

export class Emitter {
	constructor() {
		this.events = {};
	}

	emit(event, ...data) {
		this.events[event]?.forEach?.(async (fn) => {
			try {
				if (event === 'broadcast') console.log('broadcast', data[0]);
				return await fn(...data);
			} catch (error) {
				console.log(chalk.red('error: this' + error.message));
				this.broadcast('notify-danger', error.message);
			}
		});
	}

	on(event, fn) {
		const fns = this.events[event] || [];
		this.events[event] = fns.concat(fn);
	}
	off(event, fn) {
		let fns = this.events[event] || [];
		this.events[event] = fns.filter((f) => f != fn);
	}

	broadcast(event, data) {
		this.emit('broadcast', event, data);
	}
	onbroadcast(fn) {
		this.on('broadcast', fn);
	}
}
export const handleError = (fn, emitter) => {
	return async (...args) => {
		// console.log('handling');
		try {
			// console.log('handling fn');
			return await fn(...args);
		} catch (error) {
			emitter.broadcast('notify-danger', error.message);
			console.log(chalk.red('error: handle'), error.stack);
		}
	};
};

export const getState = async (bee) => {
	let state = [];
	for await (const { key, value } of bee.createReadStream()) {
		state.push({ name: key, ...value });
	}
	return state;
};
export const runChildProcess = async (command) => {
	return new Promise((resolve, reject) => {
		child_process.exec(command, (err, res) => {
			if (err) return reject(err);
			else return resolve(res);
		});
	});
};
export const getRandomStr = () => {
	return Math.floor(2147483648 * Math.random()).toString(36);
};

export const getFileType = async (path) => {
	const buffer = readChunk.sync(path, 0, 4100);
	let _type = (await fileType.fromBuffer(buffer))?.mime;
	if (!_type) {
		const res = await runChildProcess(`"file" "${path}"`);
		const typeOfFile = res?.replace('\n', '')?.split?.(':')?.[1] || '';
		if (typeOfFile.includes('text')) _type = 'plain/text';
	}
	if (!_type) _type = mime.lookup(extname(path));
	return _type;
};
export const getDriveFileType = async (stream) => {
	let _type = (await fileType.fromStream(stream))?.mime;
	return _type;
};

export function makeApi(store = { state: {} }) {
	const { state } = store;
	state.savedDrives = state.savedDrives || []; // [{key,name}]
	state.drives = state.drives || []; // [{key,name}]
	state.peers = state.peers || []; // [{corekey,drivekey,username}]
	const cores = new Map();
	const drives = new Map();
	const peerCores = new Map();
	const peerDrives = new Map();
	const peersObj = new Map();
	const bees = new Map();
	const connectedDrives = [];
	const cleanups = [];
	return {
		bees,
		cleanups,
		cores,
		drives,
		peerCores,
		peerDrives,
		peersObj,
		connectedDrives,
		async addPeer(peer) {
			state.peers.push(peer);
			store.announceStateChange();
		},
		async setUsername(corekey, username) {
			const { peer, idx } = await this.getPeer({ corekey }, true);
			peer['username'] = username;
			state.peers[idx] = peer;
			store.announceStateChange();
		},
		async removePeer(corekey) {
			const peer = await this.getPeer({ corekey });
			state.peers = state.peers.filter((peer) => corekey !== peer.corekey);
			store.announceStateChange();
			this.removePeerCore(corekey);
			this.removePeerDrive(peer.drivekey);
		},
		async getPeer({ corekey, drivekey }, index = false) {
			const peer = state.peers.find(
				(peer) => corekey === peer.corekey || drivekey === peer.drivekey
			);
			if (index) {
				return { peer, idx: state.peers.indexOf(peer) };
			}
			return peer;
		},
		/// state.savedDrives
		async addSavedDrive(key, name, connected = false) {
			state.savedDrives.push({ key, name, connected });
			store.announceStateChange();
		},
		async setSavedDrive(_drives) {
			state.savedDrives = _drives;
			store.announceStateChange();
		},
		async getSavedDrives() {
			return state.savedDrives;
		},
		async getSavedDrive(key) {
			return state.savedDrives.find((drive) => drive.key === key);
		},
		async removeSavedDrive(key) {
			state.savedDrives = state.savedDrives.filter((drive) => drive.key !== key);
			store.announceStateChange();
		},
		/// state.drives
		async addDrive({ key, name, host }, drive) {
			state.drives.push({ key, name, host });
			store.announceStateChange();
			if (drive) drives.set(key, drive);
			connectedDrives.push(key);
		},
		async getDrive(key) {
			return state.drives.find((drive) => drive.key === key);
		},
		async removeDrive(key) {
			state.drives = state.drives.filter((drive) => drive.key !== key);
			store.announceStateChange();
			drives.delete(key);
			connectedDrives.find((dk) => dk !== key);
		},
		///to be removed
		///peersObj
		async addPeerObj(key, peer) {
			peersObj.set(key, peer);
		},
		async getPeerObj(key) {
			peersObj.get(key);
		},
		async removePeerObj(key, peer) {
			peersObj.delete(key, peer);
		},
		///peerCores
		async addPeerCore(key, core) {
			peerCores.set(key, core);
		},
		async getPeerCore(key) {
			peerCores.get(key);
		},
		async removePeerCore(key) {
			peerCores.delete(key);
		},
		///peerDrives
		async getPeerDrive(key) {
			peerDrives.get(key);
		},
		async addPeerDrive(key, drive) {
			peerDrives.set(key, drive);
		},
		async removePeerDrive(key) {
			peerDrives.delete(key);
		}
	};
}
