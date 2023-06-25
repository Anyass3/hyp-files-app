export = SocketPairer;
declare class SocketPairer {
	constructor(dht: any, server: any);
	dht: any;
	_server: any;
	_destroying: Promise<any>;
	_pairs: any[];
	_incoming: any[];
	_activeConnections: Set<any>;
	_socketPool: Map<any, any>;
	_oninactive: () => void;
	_notify(inc: any): void;
	_addPair(p: any): void;
	_finalize(inc: any): any;
	onconnection(tcp: any, rawSocket: any): void;
	addPool(publicKey: any, socket: any, address: any): boolean;
	getPool(publicKey: any, refresh: any): any;
	gcPool(publicKey: any, now: any): void;
	pair(handshake: any): Pair;
	remoteServerAddress(): {
		host: any;
		port: any;
	};
	localServerAddress(): {
		host: string;
		port: any;
	};
	destroy(): Promise<any>;
}
declare class Pair {
	constructor(sockets: any, handshake: any);
	handshake: any;
	socket: SocketWrap;
	nat: Nat;
	payload: Payload;
	onconnection: typeof noop;
	ondestroy: typeof noop;
	destroyed: boolean;
	punching: boolean;
	connected: boolean;
	holepunched: boolean;
	remoteFirewall: number;
	remoteAddresses: any[];
	remoteHolepunching: boolean;
	_index: number;
	_timeout: NodeJS.Timeout;
	_sleeper: Sleeper;
	_reopening: Promise<void>;
	_started: any;
	_sockets: any;
	_allSockets: any[];
	_onutpconnectionbound: (rawSocket: any) => void;
	_onmessagebound: (buf: any, rinfo: any) => void;
	_directConnections: any[];
	get connecting(): boolean;
	open(): SocketWrap;
	unstable(): boolean;
	reopen(): Promise<boolean>;
	_reopen(): Promise<void>;
	updateRemote({
		punching,
		firewall,
		addresses,
		verified
	}: {
		punching: any;
		firewall: any;
		addresses: any;
		verified: any;
	}): void;
	ping(addr: any, socket?: SocketWrap): Promise<any>;
	openSession(addr: any, socket?: SocketWrap): Promise<any>;
	punch(): Promise<boolean>;
	_punching: Promise<boolean>;
	_punch(): Promise<boolean>;
	_consistentProbe(): Promise<void>;
	_autoDestroy(): void;
	_randomProbes(remoteAddr: any): Promise<void>;
	_keepAliveRandomNat(remoteAddr: any): Promise<void>;
	_openBirthdaySockets(remoteAddr: any): Promise<void>;
	_ontcpconnection(rawSocket: any, data: any, ended: any): void;
	_onutpconnection(rawSocket: any, data: any, ended: any, from: any): void;
	_destroyOtherConnections(rawSocket: any): void;
	_shutdown(skip: any): void;
	_onmessage(socket: any, buf: any, rinfo: any): Promise<void>;
	_findWrap(utp: any): any;
	_makeSocket(): SocketWrap;
	_reset(): void;
	connect(addrs: any, from: any, to: any, relayed: any): boolean;
	connectUTP(addr: any, socket: any): void;
	_connect(addr: any): void;
	destroy(): void;
	_unref(): void;
}
import SocketWrap = require('./socket-wrap');
import Nat = require('./nat');
import Payload = require('./secure-payload');
declare function noop(): void;
import Sleeper = require('./sleeper');
