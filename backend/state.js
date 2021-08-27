import chalk from 'chalk';

export class Emitter {
	constructor() {
		this.events = {};
	}

	emit(event, ...data) {
		this.events[event]?.forEach?.(async (fn) => {
			try {
				// if (event === 'broadcast') console.log('broadcast', data[0]);
				return await fn(...data);
			} catch (error) {
				console.log(chalk.red('error: this' + error.message), error.stack);
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
	log(...data) {
		this.emit('logger', ...data);
	}
	dataUsage(data) {
		this.emit('set-data-usage', data);
	}
	onbroadcast(fn) {
		this.on('broadcast', fn);
	}
}

let emitter;
export const getEmitter = () => {
	// console.log('get emitter');
	if (!emitter) {
		// console.log('new emitter');
		emitter = new Emitter();
	}
	return emitter;
};

export const getBeeState = async (bee) => {
	let state = [];
	for await (const { key, value } of bee.createReadStream()) {
		state.push({ name: key, ...value });
	}
	return state;
};

export function makeApi(store = { state: { isMpvInstalled: false } }) {
	const { state } = store;
	state.savedDrives = []; // [{key,name}]
	state.drives = []; // [{key,name}]
	state.peers = []; // [{corekey,drivekey,username}]
	state.child_processes = []; // [{pid,cm}]
	state.dataUsage = {
		total: 0,
		today: 0,
		drives: []
	}; // {total; today; drives:[ {dkey;name;today;total} ] }
	const cores = new Map();
	const drives = new Map();
	const peerCores = new Map();
	const peerDrives = new Map();
	const peersObj = new Map();
	const bees = new Map();
	const channels = new Map();
	const clients = new Map();
	const connectedDrives = [];
	const cleanups = [];
	return {
		bees,
		clients,
		channels,
		cleanups,
		cores,
		drives,
		peerCores,
		peerDrives,
		peersObj,
		connectedDrives,
		async setIsMpvInstalled(val) {
			if (val !== state.isMpvInstalled) {
				state.isMpvInstalled = val;
				store.announceStateChange();
			}
		},
		get isMpvInstalled() {
			return state.isMpvInstalled;
		},

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
			this.peersObj.delete(corekey);
			this.peerCores.delete(corekey);
			this.peerDrives.delete(peer.drivekey);
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
		async getDrives() {
			return state.drives;
		},
		/// state.child_processes
		async addChildProcess({ pid, cm }) {
			state.child_processes.push({ pid, cm });
			store.announceStateChange();
		},
		async getChildProcess(pid) {
			return state.child_processes.find((c_p) => c_p.pid === pid);
		},
		async removeChildProcess(pid) {
			state.child_processes = state.child_processes.filter((c_p) => c_p.pid !== pid);
			store.announceStateChange();
		},
		async getChildProcesses() {
			return state.child_processes;
		}
	};
}
