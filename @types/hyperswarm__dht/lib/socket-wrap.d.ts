export = SocketWrap;
declare class SocketWrap extends EventEmitter {
	constructor(socket: any, defaultTTL: any);
	socket: any;
	ttl: any;
	_defaultTTL: any;
	_unwrapped: boolean;
	_pending: number;
	_queue: any[];
	_onflushbound: any;
	_onmessagebound: any;
	unwrap(): any;
	close(): void;
	send(buf: any, start: any, end: any, port: any, host: any, onflush?: any): void;
	sendTTL(ttl: any, buf: any, start: any, end: any, port: any, host: any, onflush?: any): void;
	_send(
		requeue: any,
		ttl: any,
		buf: any,
		start: any,
		end: any,
		port: any,
		host: any,
		onflush: any
	): boolean;
	_wrap(onflush: any): (err: any) => void;
	_onflush(): void;
}
import { EventEmitter } from 'events';
