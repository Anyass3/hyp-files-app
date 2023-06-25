// @ts-ignore
import { SyncStore } from 'connectome/stores';
import type { Channel } from 'connectome/typings/index.js';
import EventEmitter from 'events';
import { Downloader, getRandomStr } from './utils.js';
import _ from 'lodash-es';
import { Transform } from "streamx"
import { BasicReportProgress, ReportProgress, ReportProgressOpts } from 'typings';
import { Drive } from './drive/hyper.js';

export class Emitter extends EventEmitter {
	constructor() {
		super();
	}

	emit(event: string, ...data: any[]) {
		return super.emit(event, ...data);
	}

	broadcast(event: string, data?: any) {
		this.emit('broadcast', event, data);
	}
	log(...data: any[]) {
		this.emit('logger', ...data);
	}
	dataUsage(data: any) {
		this.emit('set-data-usage', data);
	}
	onbroadcast(fn: (event: string, data?: any) => void) {
		this.on('broadcast', fn);
	}
}

interface Store {
	sync(channelList: any): void;
	state: {
		isMpvInstalled?: boolean;
		drives: {
			key: string;
			name: string;
			writable: boolean;
			_private: boolean;
			connected: boolean;
			saved: boolean;
		}[];
		peers: { corekey: string; drivekey: string; username: string }[];
		child_processes: { pid: number; cm: string }[];
		sharing: BasicReportProgress[]
		downloading: Record<'url' | 'path' | 'filename' | 'dkey', string>[];
		dataUsage: Record<string, any>;
		offlinePending: Record<string, string[]>;
	};
}

export const makeApi = <A extends Store>(
	protocolStore = {
		state: {}
	} as A
) => {
	// const { state } = protocolStore;
	const state = {} as Store['state'];

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
	const drives = new Map<string, Drive>();
	const peerCores = new Map();
	const peerDrives = new Map();
	const peersObj = new Map();
	const bees = new Map();
	const channels = new Map<string, Channel>();
	const clients = new Map();
	let downloader: Downloader | undefined;
	const cleanups: (() => Promise<void>)[] = [];
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
			// console.log(state)
			if (c) return c.signal('sync-state', state);

			channels.forEach((c) => {
				c.signal('sync-state', state);
			});
		},
		async setIsMpvInstalled(val: boolean) {
			if (val !== state.isMpvInstalled) {
				state.isMpvInstalled = val;
				this.syncState();
			}
		},
		get isMpvInstalled() {
			return state.isMpvInstalled;
		},

		async addPeer(peer: { corekey: string; drivekey: string; username: string; }) {
			state.peers.push(peer);
			this.syncState();
		},
		async setUsername(corekey: string, username: string) {
			const { peer, idx } = (await this.getPeer({ corekey }, true)) as any;
			peer['username'] = username;
			state.peers[idx] = peer;
			this.syncState();
		},
		async removePeer(corekey: string) {
			const peer = await this.getPeer({ corekey });
			state.peers = state.peers.filter((peer) => corekey !== peer.corekey);
			this.syncState();
			this.peersObj.delete(corekey);
			this.peerCores.delete(corekey);
			this.peerDrives.delete((peer as any)?.drivekey || '');
		},
		getPeer({ corekey, drivekey }: { corekey?: string; drivekey?: string }, index = false) {
			const peer = state.peers.find(
				(peer) => corekey === peer.corekey || drivekey === peer.drivekey
			);
			if (index && peer) {
				return { peer, idx: state.peers.indexOf(peer) };
			}
			return peer;
		},
		/// state.drives
		async addDrive(
			{ key = '', name = '', _private = false, saved = false, connected = true, writable = false },
			drive?: any
		) {
			console.log('addDrive', key, !!drive);
			if (drive) {
				drives.set(key, drive);
				writable = drive.writable;
			}

			state.drives.push({ key, name, writable: writable, _private, saved, connected });
			this.syncState();
		},
		getDrive(key: string) {
			return state.drives.find((drive) => drive.key === key);
		},
		async removeDrive(key: string) {
			state.drives = state.drives.filter((drive) => drive.key !== key);
			this.syncState();
			drives.delete(key);
		},
		getDrives() {
			return state.drives;
		},
		initDrives(drives: any[]) {
			return (state.drives = drives);
		},
		async updateDrive({ key, name, _private, saved, writable, connected }: {
			key: string;
			name: string;
			writable: boolean;
			_private: boolean;
			connected: boolean;
			saved: boolean;
		}, drive?: Drive) {
			console.log('updateDrive', key);
			if (drive) {
				drives.set(key, drive);
				writable = drive.writable;
			}

			state.drives = state.drives.map((d) => {
				if (d.key === key) d = { key, name, _private, saved, writable, connected };
				return d;
			});
			this.syncState();
		},
		doesDriveNameExist(name: string, connected?: boolean) {
			return state.drives.find((drive) => drive.name === name && drive.connected === connected);
		},
		/// state.child_processes
		async addChildProcess({ pid, cm }: { pid: number; cm: string }) {
			state.child_processes.push({ pid, cm });
			this.syncState();
		},
		getChildProcess(pid: number) {
			return state.child_processes.find((c_p) => c_p.pid === pid);
		},
		async removeChildProcess(pid: number) {
			state.child_processes = state.child_processes.filter((c_p) => c_p.pid !== pid);
			this.syncState();
		},
		getChildProcesses() {
			return state.child_processes;
		},
		/// state.offlinePending
		getOfflinePending(dkey?: string) {
			return !dkey ? state.offlinePending : state.offlinePending[dkey] || [];
		},
		addOfflinePending(dkey: string, path: any) {
			const offlinePending = this.getOfflinePending(dkey) as string[];
			emitter.log('offlinePending,', offlinePending, dkey, state.offlinePending[dkey]);
			state.offlinePending[dkey] = offlinePending.concat(path);
			this.syncState();
		},
		rmOfflinePending(dkey: string, path: any) {
			state.offlinePending[dkey] = (this.getOfflinePending(dkey) as string[]).filter((p) => p !== path);
			this.syncState();
		},
		/// state.sharing
		async addSharing({ key, name, data, drive, action }: BasicReportProgress) {
			state.sharing.push({ key, name, data, drive, action });
			this.syncState();
		},
		getSharing(key?: string) {
			return key
				? state.sharing.find((s) => s.key == key)
				: state.sharing;
		},
		async updateSharing({ name, key }: { name: string; key: string }) {
			state.sharing.map((s) => {
				if (s.key == key) s.name = name;
				return s;
			});
			this.syncState();
		},
		async removeSharing(key: string) {
			state.sharing = state.sharing.filter((s) => (s.key !== key));
			this.syncState();
		},
		/// state.downloading
		async addDownloading({ url, path, filename, dkey }: { url: string; path: string; filename: string; dkey: string }) {
			state.downloading.push({ url, path, filename, dkey });
			this.syncState();
			console.log(state.downloading);
		},
		getDownloading(url: string) {
			return url ? state.downloading.find((file) => file.url == url) : state.downloading;
		},
		async updateDownloading({ url, ...rest }: { url: string; path?: string; filename?: string; dkey?: string }) {
			state.downloading.map((file) => {
				if (file.url == url) file = { ...file, ...rest };
				return file;
			});
			this.syncState();
		},
		async removeDownloading(url: string) {
			state.downloading = state.downloading.filter((file) => file.url != url);
			this.syncState();
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

export const getBeeState = async (bee: any) => {
	const state: any[] = [];
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

export const reportProgress = ({ action, size = 0, name = '', data = '', drive = '', key } = {} as ReportProgressOpts) => {
	let loadedBytes = 0;
	key = key?.trim() || getRandomStr()

	return new Transform({
		transform(chunk: string | any[], callback: (arg0: null, arg1: any) => void) {
			_.debounce(async () => {
				loadedBytes += chunk.length;
				emitter.broadcast('sharing-progress', {
					size,
					name, drive,
					key,
					loadedBytes,
					data,
					action
				});
			})();
			callback(null, chunk);
		}

	});
}