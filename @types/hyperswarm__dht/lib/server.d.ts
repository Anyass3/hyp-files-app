export = Server;
declare class Server extends EventEmitter {
	constructor(dht: any, opts?: {});
	dht: any;
	target: any;
	relayAddresses: any;
	closed: boolean;
	firewall: any;
	holepunch: any;
	createHandshake: any;
	createSecretStream: any;
	_protocols: number;
	_shareLocalAddress: boolean;
	_keyPair: any;
	_announcer: Announcer;
	_connects: Map<any, any>;
	_holepunches: any[];
	_listening: boolean;
	_closing: Promise<void>;
	get publicKey(): any;
	onconnection(encryptedSocket: any): void;
	address(): {
		publicKey: any;
		host: any;
		port: any;
	};
	close(): Promise<void>;
	_close(): Promise<void>;
	listen(keyPair?: any, opts?: {}): Promise<void>;
	_addHandshake(
		k: any,
		noise: any,
		clientAddress: any,
		{
			from,
			to: serverAddress
		}: {
			from: any;
			to: any;
		}
	): Promise<{
		round: number;
		reply: any;
		pair: any;
		protocols: number;
		firewalled: boolean;
		clearing: any;
	}>;
	_clearLater(hs: any, id: any, k: any): void;
	_clear(hs: any, id: any, k: any): void;
	_onpeerhandshake(
		{
			noise,
			peerAddress
		}: {
			noise: any;
			peerAddress: any;
		},
		req: any
	): Promise<{
		socket: any;
		noise: any;
	}>;
	_onpeerholepunch(
		{
			id,
			peerAddress,
			payload
		}: {
			id: any;
			peerAddress: any;
			payload: any;
		},
		req: any
	): Promise<{
		socket: any;
		payload: any;
	}>;
	_abort(h: any): {
		socket: any;
		payload: any;
	};
}
import { EventEmitter } from 'events';
import Announcer = require('./announcer');
