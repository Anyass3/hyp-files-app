import colors from 'colors';

export class Emitter {
	events;
	constructor() {
		this.events = {};
	}

	emit(event, ...data) {
		this.events[event]?.forEach?.(async (fn) => {
			try {
				// if (event === 'broadcast') console.log('broadcast', data[0]);
				return await fn(...data);
			} catch (error) {
				console.log(colors.red('error: emit:: ' + error.message), error.stack, data, event);
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
	return state || [];
};

interface Store {
	state: {
		isMpvInstalled?: boolean;
		savedDrives?: Array<{ key: string; name: string; connected: boolean; _private: boolean }>;
		drives?: Array<{ key: string; name: string; writable: boolean; _private: boolean }>;
		peers?: Array<{ corekey: string; drivekey: string; username: string }>;
		child_processes?: Array<{ pid: number; cm: string }>;
		dataUsage?: {};
		offlinePending?: Record<string, string[]>;
	};
}
export function makeApi(
	store: Store = {
		state: {}
	}
) {
	const { state } = store;

	state.savedDrives = [];
	state.drives = [];
	state.peers = [];
	state.child_processes = [];
	state.offlinePending = {};
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
				//@ts-ignore
				store.announceStateChange();
			}
		},
		get isMpvInstalled() {
			return state.isMpvInstalled;
		},

		async addPeer(peer) {
			state.peers.push(peer);
			//@ts-ignore
			store.announceStateChange();
		},
		async setUsername(corekey, username) {
			const { peer, idx } = await this.getPeer({ corekey }, true);
			peer['username'] = username;
			state.peers[idx] = peer;
			//@ts-ignore
			store.announceStateChange();
		},
		async removePeer(corekey) {
			const peer = await this.getPeer({ corekey });
			state.peers = state.peers.filter((peer) => corekey !== peer.corekey);
			//@ts-ignore
			store.announceStateChange();
			this.peersObj.delete(corekey);
			this.peerCores.delete(corekey);
			this.peerDrives.delete(peer.drivekey);
		},
		getPeer({ corekey, drivekey }, index = false) {
			const peer = state.peers.find(
				(peer) => corekey === peer.corekey || drivekey === peer.drivekey
			);
			if (index) {
				return { peer, idx: state.peers.indexOf(peer) };
			}
			return peer;
		},
		/// state.savedDrives
		async addSavedDrive({ key, name, connected = true, _private = false }) {
			state.savedDrives.push({ key, name, connected, _private });
			//@ts-ignore
			store.announceStateChange();
		},
		async setSavedDrive(_drives) {
			state.savedDrives = _drives;
			//@ts-ignore
			store.announceStateChange();
		},
		getSavedDrives() {
			return state.savedDrives || [];
		},
		getSavedDrive(key) {
			return state.savedDrives.find((drive) => drive.key === key);
		},
		async removeSavedDrive(key) {
			state.savedDrives = state.savedDrives.filter((drive) => drive.key !== key);
			//@ts-ignore
			store.announceStateChange();
		},
		/// state.drives
		async addDrive({ key, name, _private }, drive) {
			state.drives.push({ key, name, writable: drive.writable, _private });
			//@ts-ignore
			store.announceStateChange();
			if (drive) drives.set(key, drive);
			connectedDrives.push(key);
		},
		getDrive(key) {
			return state.drives.find((drive) => drive.key === key);
		},
		async removeDrive(key) {
			state.drives = state.drives.filter((drive) => drive.key !== key);
			//@ts-ignore
			store.announceStateChange();
			drives.delete(key);
			connectedDrives.find((dk) => dk !== key);
		},
		getDrives() {
			return state.drives;
		},
		/// state.child_processes
		async addChildProcess({ pid, cm }) {
			state.child_processes.push({ pid, cm });
			//@ts-ignore
			store.announceStateChange();
		},
		getChildProcess(pid) {
			return state.child_processes.find((c_p) => c_p.pid === pid);
		},
		async removeChildProcess(pid) {
			state.child_processes = state.child_processes.filter((c_p) => c_p.pid !== pid);
			//@ts-ignore
			store.announceStateChange();
		},
		getChildProcesses() {
			return state.child_processes;
		},
		getOfflinePending(dkey?) {
			return !dkey ? state.offlinePending : state.offlinePending[dkey] || [];
		},
		addOfflinePending(dkey, path) {
			const offlinePending = this.getOfflinePending(dkey);
			console.log('offlinePending,', offlinePending, dkey, state.offlinePending[dkey]);
			state.offlinePending[dkey] = offlinePending.concat(path);
			//@ts-ignore
			store.announceStateChange();
		},
		rmOfflinePending(dkey, path) {
			state.offlinePending[dkey] = this.getOfflinePending(dkey).filter((p) => p !== path);
			//@ts-ignore
			store.announceStateChange();
		}
	};
}

const api = makeApi();
export type API = typeof api;
