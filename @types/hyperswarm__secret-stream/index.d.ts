import type { Duplex } from '../streamx';
import Handshake = require('./lib/handshake');
declare class NoiseSecretStream extends Duplex {
	static keyPair(seed: any): {
		publicKey: any;
		secretKey: any;
	};
	static id(handshakeHash: any, isInitiator: any, id: any): any;
	constructor(isInitiator: any, rawStream: any, opts?: {});
	noiseStream: this;
	isInitiator: boolean;
	rawStream: any;
	publicKey: any;
	remotePublicKey: any;
	handshakeHash: any;
	userData: any;
	opened: Promise<any>;
	_rawStream: any;
	_handshake: Handshake;
	_handshakePattern: any;
	_handshakeDone: any;
	_state: number;
	_len: number;
	_tmp: number;
	_message: any;
	_openedDone: any;
	_startDone: any;
	_drainDone: any;
	_outgoingPlain: any;
	_outgoingWrapped: any;
	_utp: any;
	_setup: boolean;
	_ended: number;
	_encrypt: any;
	_decrypt: any;
	_timeout: any;
	_timeoutMs: number;
	_keepAlive: any;
	_keepAliveMs: number;
	setTimeout(ms: any): void;
	setKeepAlive(ms: any): void;
	start(rawStream: any, opts?: {}): void;
	_continueOpen(err: any): void;
	_onkeypairpromise(p: any): void;
	_onkeypair(keyPair: any): void;
	_startHandshake(handshake: any, keyPair: any): void;
	_onrawerror(err: any): void;
	_onrawclose(): void;
	_onrawdata(data: any): void;
	_onrawend(): void;
	_onrawdrain(): void;
	_incoming(): void;
	_onhandshakert(h: any): any;
	_setupSecretStream(
		tx: any,
		rx: any,
		handshakeHash: any,
		publicKey: any,
		remotePublicKey: any
	): void;
	_resolveOpened(val: any): void;
	_clearTimeout(): void;
	_clearKeepAlive(): void;
	alloc(len: any): any;
}

export = NoiseSecretStream;
