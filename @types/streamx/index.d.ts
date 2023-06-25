export function pipeline(stream: any, ...streams: any[]): any;
export function pipelinePromise(...streams: any[]): Promise<any>;
export function isStream(stream: any): boolean;
export function isStreamx(stream: any): boolean;
export function getStreamError(stream: any): any;
export class Stream extends EventEmitter {
	constructor(opts?: any);
	_duplexState: number;
	_readableState: any;
	_writableState: any;
	_open(cb: any): void;
	_destroy(cb: any): void;
	_predestroy(): void;
	get readable(): boolean;
	get writable(): boolean;
	get destroyed(): boolean;
	get destroying(): boolean;
	destroy(err: any): void;
	on(name: any, fn: any): typeof this;
	[Symbol.asyncIterator](): {
		[Symbol.asyncIterator](): typeof this;
		next(): Promise<any>;
	};
}
export class Writable<Data = any> extends Stream {
	static isBackpressured(ws: any): boolean;
	_writableState: WritableState;
	_writev(batch: any, cb: any): void;
	_write(data: Data, cb: any): void;
	_final(cb: any): void;
	write(data: Data): boolean;
	end(data: Data): Writable<Data>;
}
export class Readable<Data = any> extends Stream {
	static _fromAsyncIterator(ite: any, opts?: any): Readable;
	static from(data: Data, opts?: any): any;
	static isBackpressured(rs: any): boolean;
	static isPaused(rs: any): boolean;
	_readableState: ReadableState;
	_read(cb: any): void;
	pipe(dest: any, cb?: any): any;
	read(): any;
	push(data: Data): boolean;
	unshift(data: Data): void;
	resume(): Readable;
	pause(): Readable;
}
export class Duplex<Data = any> extends Readable {
	_writableState: WritableState;
	_writev(batch: any, cb: any): void;
	_write(data: Data, cb: any): void;
	_final(cb: any): void;
	write(data: Data): boolean;
	end(data: Data): Duplex<Data>;
}
export class Transform<Data = any> extends Duplex {
	_transformState: TransformState;
	_transform(data: Data, cb: any): void;
	_flush(cb: any): void;
}
export class PassThrough<Data = any> extends Transform<Data> {}
import { EventEmitter } from 'events';
declare class WritableState {
	constructor(
		stream: any,
		{
			highWaterMark,
			map,
			mapWritable,
			byteLength,
			byteLengthWritable
		}?: {
			highWaterMark?: number;
			map?: any;
			mapWritable: any;
			byteLength: any;
			byteLengthWritable: any;
		}
	);
	stream: any;
	queue: any;
	highWaterMark: number;
	buffered: number;
	error: any;
	pipeline: any;
	byteLength: any;
	map: any;
	afterWrite: any;
	afterUpdateNextTick: any;
	get ended(): boolean;
	push(data: any): boolean;
	shift(): any;
	end(data: any): void;
	autoBatch(data: any, cb: any): any;
	update(): void;
	updateNonPrimary(): void;
	updateNextTick(): void;
}
declare class ReadableState {
	constructor(
		stream: any,
		{
			highWaterMark,
			map,
			mapReadable,
			byteLength,
			byteLengthReadable
		}?: {
			highWaterMark?: number;
			map?: any;
			mapReadable: any;
			byteLength: any;
			byteLengthReadable: any;
		}
	);
	stream: any;
	queue: any;
	highWaterMark: number;
	buffered: number;
	error: any;
	pipeline: Pipeline;
	byteLength: any;
	map: any;
	pipeTo: any;
	afterRead: any;
	afterUpdateNextTick: any;
	get ended(): boolean;
	pipe(pipeTo: any, cb?: any): void;
	push(data: any): boolean;
	shift(): any;
	unshift(data: any): void;
	read(): any;
	drain(): void;
	update(): void;
	updateNonPrimary(): void;
	updateNextTick(): void;
}
declare class TransformState {
	constructor(stream: any);
	data: any;
	afterTransform: any;
	afterFinal: any;
}
declare class Pipeline {
	constructor(src: any, dst: any, cb: any);
	from: any;
	to: any;
	afterPipe: any;
	error: any;
	pipeToFinished: boolean;
	finished(): void;
	done(stream: any, err: any): void;
}
export {};
