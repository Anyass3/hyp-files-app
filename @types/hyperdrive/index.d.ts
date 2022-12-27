import type * as fs from 'fs'
export=hyperrive;

declare class hyperrive extends EventEmitter {
	constructor(corestore: any, key: any, opts?: Record<string, string>);
	_onwait: any;
	corestore: any;
	db: any;
	files: any;
	blobs: any;
	supportsMetadata: boolean;
	opening: Promise<any>;
	opened: boolean;
	_openingBlobs: Promise<boolean>;
	_checkout: any;
	_batching: boolean;
	_closing: Promise<any>;
	get key(): Buffer;
	get discoveryKey(): Buffer;
	get contentKey(): Buffer;
	get core(): any;
	get version(): any;
	findingPeers(): any;
	update(): any;
	ready(): Promise<any>;
	checkout(len: any): Hyperdrive;
	batch(): Hyperdrive;
	flush(): any;
	close(): Promise<any>;
	_close(): Promise<any>;
	_openBlobsFromHeader(opts: any): Promise<boolean>;
	_open(): Promise<any>;
	getBlobs(): Promise<any>;
	get(name: any): Promise<any>;
	put(name: any, buf: any, { executable, metadata }?: {
		executable?: boolean;
		metadata?: any;
	}): Promise<any>;
	del(name: any): Promise<any>;
	symlink(name: any, dst: any, { metadata }?: {
		metadata?: any;
	}): Promise<any>;
	entry(name: any): any;
	diff(length: any, folder: any, opts: any): any;
	downloadDiff(length: any, folder: any, opts: any): Promise<void>;
	downloadRange(dbRanges: any, blobRanges: any): Promise<void>;
	entries(opts: any): any;
	download(folder: string, opts: any): any;
	list(folder?: string, { recursive }?: {
		recursive?: boolean;
	}): any;
	readdir(folder?: string): any;
	mirror(out: any, opts: any): any;
	createReadStream: (path: fs.PathLike, options?: BufferEncoding)=> fs.ReadStream;
	createWriteStream(name: fs.PathLike, { executable, metadata }?: {
		executable?: boolean;
		metadata?: any;
	}): fs.WriteStream;
	[Symbol.asyncIterator](): any;
}