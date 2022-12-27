import { SyncStore } from 'connectome/stores';
import { Channel } from 'connectome/typings/index.js';
import EventEmitter from 'events';
import { Downloader } from './utils.js';

export class Emitter extends EventEmitter {
	constructor() {
		super();
	}

	emit(event: string, ...data) {
		return super.emit(event, ...data);
	}

	broadcast(event: string, data?) {
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
	sync(channelList: any);
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
		downloading?: Record<'url' | 'path' | 'filename' | 'dkey', string>[];
		dataUsage?: Record<string, any>;
		offlinePending?: Record<string, string[]>;
	};
}

export const makeApi = <A extends Store>(
	protocolStore = {
		state: {}
	} as A
) => {
	// const { state } = protocolStore;
	const state={} as Store['state']

	state.sharing = [];
	state.downloading = [];
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
	const channels = new Map<string, Channel>();
	const clients = new Map();
	let downloader: Downloader;
	const cleanups = [];
	const bootstrap_nodes: { host: string; port: number }[] = [];
	return {
		downloader,
		protocolStore,
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

		syncState(c?: Channel) {
			console.log(state)
			if (c) return c.signal('sync-state', state);

			channels.forEach((c) => {
				c.signal('sync-state', state)
			})
		},
		async setIsMpvInstalled(val) {
			if (val !== state.isMpvInstalled) {
				state.isMpvInstalled = val;
				//@ts-ignore
				protocolStore.announceStateChange(); this.syncState();
			}
		},
		get isMpvInstalled() {
			return state.isMpvInstalled;
		},

		async addPeer(peer) {
			state.peers.push(peer);
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
		},
		async setUsername(corekey, username) {
			const { peer, idx } = await this.getPeer({ corekey }, true);
			peer['username'] = username;
			state.peers[idx] = peer;
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
		},
		async removePeer(corekey) {
			const peer = await this.getPeer({ corekey });
			state.peers = state.peers.filter((peer) => corekey !== peer.corekey);
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
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
			console.log('addDrive',key,!!drive)
			if (drive) {
				drives.set(key, drive);
				writable = drive.writable;
			}

			state.drives.push({ key, name, writable: writable, _private, saved, connected });
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
		},
		getDrive(key) {
			return state.drives.find((drive) => drive.key === key);
		},
		async removeDrive(key) {
			state.drives = state.drives.filter((drive) => drive.key !== key);
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
			drives.delete(key);
		},
		getDrives() {
			return state.drives;
		},
		initDrives(drives) {
			return (state.drives = drives);
		},
		async updateDrive({ key, name, _private, saved, writable, connected }, drive?) {
			console.log('updateDrive', key)
			if (drive) {
				drives.set(key, drive);
				writable = drive.writable;
			}

			state.drives = state.drives.map((d) => {
				if (d.key === key) d = { key, name, _private, saved, writable, connected };
				return d;
			});
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
		},
		doesDriveNameExist(name, connected?) {
			return state.drives.find((drive) => drive.name === name && drive.connected === connected);
		},
		/// state.child_processes
		async addChildProcess({ pid, cm }) {
			state.child_processes.push({ pid, cm });
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
		},
		getChildProcess(pid) {
			return state.child_processes.find((c_p) => c_p.pid === pid);
		},
		async removeChildProcess(pid) {
			state.child_processes = state.child_processes.filter((c_p) => c_p.pid !== pid);
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
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
			protocolStore.announceStateChange(); this.syncState();
		},
		rmOfflinePending(dkey, path) {
			state.offlinePending[dkey] = this.getOfflinePending(dkey).filter((p) => p !== path);
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
		},
		/// state.sharing
		async addSharing({ send, name, phrase, drive }) {
			state.sharing.push({ send, name, phrase, drive });
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
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
			protocolStore.announceStateChange(); this.syncState();
		},
		async removeSharing(phrase, send) {
			state.sharing = state.sharing.filter((s) => !(s.phrase === phrase && s.send === send));
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
		},
		/// state.downloading
		async addDownloading({ url, path, filename, dkey }) {
			state.downloading.push({ url, path, filename, dkey });
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
			console.log(state.downloading);
		},
		getDownloading(url) {
			return url ? state.downloading.find((file) => file.url == url) : state.downloading;
		},
		async updateDownloading({ url, ...rest }) {
			state.downloading.map((file) => {
				if (file.url == url) file = { ...file, ...rest };
				return file;
			});
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
		},
		async removeDownloading(url) {
			state.downloading = state.downloading.filter((file) => file.url != url);
			//@ts-ignore
			protocolStore.announceStateChange(); this.syncState();
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
	const state = [];
	for await (const { key, value } of bee.createReadStream()) {
		state.push({ name: key, ...value, saved: true });
	}
	return state || [];
};
let api: API;
export const getApi = () => {
	if (!api) {
		const store = new SyncStore();
		api = makeApi(store as any);
		api.downloader = new Downloader(getEmitter(), api);
	}
	return api;
};
