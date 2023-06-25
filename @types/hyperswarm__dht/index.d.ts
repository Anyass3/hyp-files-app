export = HyperDHT;

type Opts = { ephemeral: boolean; bootstrap: ({ host: string; port: number } | string)[] };
declare class HyperDHT extends DHT {
	// @ts-ignore
	constructor(opts?: Partial<Opts>): void;
	static keyPair(seed: any): {
		publicKey: any;
		secretKey: any;
	};
	static hash(data: any): any;
	defaultKeyPair: any;
	listening: Set<any>;
	_router: Router;
	_sockets: any;
	_persistent: Persistent;
	bootstrapNodes: Opts['bootstrap'];
	address(): { address: string; port: number };
	ready(): Promise<void>;
	connect(remotePublicKey: any, opts?: any): any;
	createServer(opts?: any, onconnection?: any): any;
	findPeer(publicKey: any, opts?: Record<string, unknown>): any;
	lookup(target: any, opts?: Record<string, unknown>): any;
	lookupAndUnannounce(target: any, keyPair: any, opts?: Record<string, unknown>): any;
	unannounce(target: any, keyPair: any, opts?: Record<string, unknown>): any;
	announce(target: any, keyPair: any, relayAddresses: any, opts?: Record<string, unknown>): any;
	immutableGet(target: any, opts?: Record<string, unknown>): Promise<any>;
	immutablePut(
		value: any,
		opts?: Record<string, unknown>
	): Promise<{
		hash: any;
		closestNodes: any;
	}>;
	mutableGet(publicKey: any, opts?: Record<string, unknown>): Promise<any>;
	mutablePut(
		keyPair: any,
		value: any,
		opts?: Record<string, unknown>
	): Promise<{
		publicKey: any;
		closestNodes: any;
		seq: any;
		signature: any;
	}>;
	_requestAnnounce(
		keyPair: any,
		dht: any,
		target: any,
		token: any,
		from: any,
		relayAddresses: any,
		sign: any
	): Promise<any>;
	_requestUnannounce(
		keyPair: any,
		dht: any,
		target: any,
		token: any,
		from: any,
		sign: any
	): Promise<any>;
}
declare namespace HyperDHT {
	export { BOOTSTRAP_NODES as BOOTSTRAP };
	export { FIREWALL };
	export { PROTOCOL };
}
import DHT from '../dht-rpc';
import Router from './lib/router';
import Persistent from './lib/persistent';
import { BOOTSTRAP_NODES } from './lib/constants';
import { FIREWALL } from './lib/constants';
import { PROTOCOL } from './lib/constants';
