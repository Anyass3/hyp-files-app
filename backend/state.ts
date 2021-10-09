import colors from 'colors';
//@ts-ignore
import { MirroringStore } from 'connectome/stores';

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

	broadcast(event, data?) {
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

interface Store {
	mirror(channelList: any);
	state: {
		isMpvInstalled?: boolean;
		drives?: {
			key: string;
			name: string;
			writable: boolean;
			_private: boolean;
			connected: boolean;
			saved: boolean;
		}[];
		peers?: { corekey: string; drivekey: string; username: string }[];
		child_processes?: { pid: number; cm: string }[];
		sharing?: { send: boolean; name: string; phrase: string; drive: string }[];
		dataUsage?: {};
		offlinePending?: Record<string, string[]>;
	};
}

export const makeApi = <A extends Store>(
	mirroringStore = {
		state: {}
	} as A
) => {
	const { state } = mirroringStore;

	state.sharing = [];
	state.drives = [];
	state.peers = [];
	state.child_processes = [];
	state.offlinePending = {};
	state.dataUsage = {
		total: 0,
		today: 0,
		drives: []
	}; //TODO: {total; today; drives:[ {dkey;name;today;total} ] }
	const cores = new Map();
	const drives = new Map();
	const peerCores = new Map();
	const peerDrives = new Map();
	const peersObj = new Map();
	const bees = new Map();
	const channels = new Map();
	const clients = new Map();
	const cleanups = [];
	let bootstrap_nodes: { host: string; port: number }[] = [];
	return {
		mirroringStore,
		bees,
		bootstrap_nodes,
		clients,
		channels,
		cleanups,
		cores,
		drives,
		peerCores,
		peerDrives,
		peersObj,
		async setIsMpvInstalled(val) {
			if (val !== state.isMpvInstalled) {
				state.isMpvInstalled = val;
				//@ts-ignore
				mirroringStore.announceStateChange();
			}
		},
		get isMpvInstalled() {
			return state.isMpvInstalled;
		},

		async addPeer(peer) {
			state.peers.push(peer);
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		async setUsername(corekey, username) {
			const { peer, idx } = await this.getPeer({ corekey }, true);
			peer['username'] = username;
			state.peers[idx] = peer;
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		async removePeer(corekey) {
			const peer = await this.getPeer({ corekey });
			state.peers = state.peers.filter((peer) => corekey !== peer.corekey);
			//@ts-ignore
			mirroringStore.announceStateChange();
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
		/// state.drives
		async addDrive(
			{ key, name, _private, saved = false, connected = true, writable = false },
			drive?
		) {
			if (drive) {
				drives.set(key, drive);
				writable = drive.writable;
			}

			state.drives.push({ key, name, writable: writable, _private, saved, connected });
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		getDrive(key) {
			return state.drives.find((drive) => drive.key === key);
		},
		async removeDrive(key) {
			state.drives = state.drives.filter((drive) => drive.key !== key);
			//@ts-ignore
			mirroringStore.announceStateChange();
			drives.delete(key);
		},
		getDrives() {
			return state.drives;
		},
		initDrives(drives) {
			return (state.drives = drives);
		},
		async updateDrive({ key, name, _private, saved, writable, connected }, drive?) {
			if (drive) {
				drives.set(key, drive);
				writable = drive.writable;
			}

			state.drives = state.drives.map((d) => {
				if (d.key === key) d = { key, name, _private, saved, writable, connected };
				return d;
			});
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		doesDriveNameExist(name, connected?) {
			return state.drives.find((drive) => drive.name === name && drive.connected === connected);
		},
		/// state.child_processes
		async addChildProcess({ pid, cm }) {
			state.child_processes.push({ pid, cm });
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		getChildProcess(pid) {
			return state.child_processes.find((c_p) => c_p.pid === pid);
		},
		async removeChildProcess(pid) {
			state.child_processes = state.child_processes.filter((c_p) => c_p.pid !== pid);
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		getChildProcesses() {
			return state.child_processes;
		},
		/// state.offlinePending
		getOfflinePending(dkey?) {
			return !dkey ? state.offlinePending : state.offlinePending[dkey] || [];
		},
		addOfflinePending(dkey, path) {
			const offlinePending = this.getOfflinePending(dkey);
			emitter.log('offlinePending,', offlinePending, dkey, state.offlinePending[dkey]);
			state.offlinePending[dkey] = offlinePending.concat(path);
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		rmOfflinePending(dkey, path) {
			state.offlinePending[dkey] = this.getOfflinePending(dkey).filter((p) => p !== path);
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		/// state.sharing
		async addSharing({ send, name, phrase, drive }) {
			state.sharing.push({ send, name, phrase, drive });
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		getSharing(phrase?, send?) {
			return phrase
				? state.sharing.find((s) => s.phrase === phrase && s.send === send)
				: state.sharing;
		},
		async updateSharing({ phrase, name, send }) {
			state.sharing.map((s) => {
				if (s.phrase === phrase && s.send === send) s.name = name;
				return s;
			});
			//@ts-ignore
			mirroringStore.announceStateChange();
		},
		async removeSharing(phrase, send) {
			state.sharing = state.sharing.filter((s) => !(s.phrase === phrase && s.send === send));
			//@ts-ignore
			mirroringStore.announceStateChange();
		}
	};
};
export type API = ReturnType<typeof makeApi>;

let emitter: Emitter;
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
		state.push({ name: key, ...value, saved: true });
	}
	return state || [];
};
let api: API;
export const getApi = () => {
	if (!api) {
		const mirroringStore = new MirroringStore();
		api = makeApi(mirroringStore);
	}
	return api;
};
