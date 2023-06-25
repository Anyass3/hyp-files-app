import type * as fs from 'fs'
import { EventEmitter } from 'events'
import Hyperbee from '../hyperbee'
import Hypercore from '../hypercore'
import HyperBlobs from "../hyperblobs"
export = Hyperdrive;

interface Entry {
	seq: number,
	key: string,
	value: {
		executable: Boolean, // whether the blob at path is an executable
		linkname: null | string // if entry not symlink, otherwise a string to the entry this links to
		blob: { // a Hyperblob id that can be used to fetch the blob associated with this entry
			blockOffset: number,
			blockLength: number,
			byteOffset: number,
			byteLength: number
		},
		metadata: null | Record<string, any>
	}
}

declare class Hyperdrive extends ReadyResource {
	static normalizePath(name: any): any;
	constructor(corestore: any, key: any, opts?: Record<string, string>);
	[Symbol.asyncIterator](): typeof Symbol.asyncIterator;
	_onwait: any;
	corestore: any;
	db: Hyperbee;
	files: Hyperbee;
	core: Hypercore;
	blobs: HyperBlobs;
	supportsMetadata: boolean;
	_openingBlobs: Promise<boolean>;
	_checkout: any;
	_batching: boolean;
	get id(): any;
	get key(): any;
	get discoveryKey(): any;
	get contentKey(): any;
	get version(): any;
	get writable(): any;
	get readable(): any;
	findingPeers(): any;
	replicate(isInitiator: any, opts?: any): any;
	update(opts?: any): any;
	_makeCheckout(snapshot: any): Hyperdrive;
	checkout(version: any): Hyperdrive;
	batch(): Hyperdrive;
	flush(): Promise<void>;
	_openBlobsFromHeader(opts?: any): Promise<boolean>;
	getBlobs(): Promise<any>;
	get(name: any): Promise<any>;
	put(name: any, buf: any, { executable, metadata }?: {
		executable?: boolean;
		metadata?: any;
	}): Promise<any>;
	del(name: any): Promise<any>;
	compare(a: any, b: any): 0 | 1 | -1;
	clear(name: any, opts?: any): Promise<any>;
	clearAll(opts?: any): Promise<any>;
	purge(): Promise<void>;
	symlink(name: any, dst: any, { metadata }?: {
		metadata?: any;
	}): Promise<any>;
	entry(name: string, opts?: any): Promise<Entry>;
	exists(name: any): Promise<boolean>;
	watch(folder: any): any;
	diff(length: any, folder: any, opts?: any): any;
	downloadDiff(length: any, folder: any, opts?: any): Promise<void>;
	downloadRange(dbRanges: any, blobRanges: any): Promise<void>;
	entries(opts?: any): any;
	download(folder: string, opts?: any): any;
	list(folder?: string, { recursive }?: {
		recursive?: boolean;
	}): any;
	readdir(folder?: string): Readable;
	mirror(out: any, opts?: any): MirrorDrive;
	createReadStream(name: any, opts?: any): Readable;
	createWriteStream(name: any, { executable, metadata }?: {
		executable?: boolean;
		metadata?: any;
	}): Writable;
	[Symbol.asyncIterator](): any;
}
import ReadyResource = require("../ready-resource");
import { Readable } from "../streamx";
import MirrorDrive = require("../mirror-drive");
import { Writable } from "../streamx";

