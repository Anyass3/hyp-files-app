export = HyperBee;
declare class HyperBee {
	constructor(feed: Hypercore, opts?: {});
	_feed: Hypercore;
	keyEncoding: any;
	valueEncoding: any;
	extension: any;
	metadata: any;
	lock: {
		(): Promise<any>;
		readonly locked: any;
	};
	sep: any;
	readonly: boolean;
	prefix: any;
	_unprefixedKeyEncoding: any;
	_sub: boolean;
	_checkout: any;
	_ready: any;
	get feed(): Hypercore;
	ready(): any;
	get version(): number;
	update(): any;
	getRoot(ensureHeader: any, opts: any, batch?: HyperBee): Promise<TreeNode>;
	getKey(seq: any): Promise<any>;
	getBlock(seq: any, opts: any, batch?: HyperBee): Promise<BlockEntry>;
	peek(opts: any): Promise<any>;
	createRangeIterator(opts?: {}, active?: any): RangeIterator;
	createReadStream(
		opts: any
	): Readable<any, any, any, true, false, import('streamx').ReadableEvents<any>>;
	createHistoryStream(
		opts: any
	): Readable<any, any, any, true, false, import('streamx').ReadableEvents<any>>;
	createDiffStream(
		right: any,
		opts: any
	): Readable<any, any, any, true, false, import('streamx').ReadableEvents<any>>;
	get(key: any, opts: any): Promise<any>;
	put(key: any, value: any, opts: any): Promise<void>;
	batch(opts: any): Batch;
	del(key: any, opts: any): Promise<void>;
	checkout(version: any): HyperBee;
	snapshot(): HyperBee;
	sub(prefix: any, opts?: {}): HyperBee;
}
declare class TreeNode {
	static create(block: any): TreeNode;
	constructor(block: any, keys: any, children: any, offset: any);
	block: any;
	offset: any;
	keys: any;
	children: any;
	changed: boolean;
	insertKey(key: any, child?: any, overwrite?: boolean): Promise<boolean>;
	removeKey(index: any): void;
	siblings(parent: any): Promise<{
		left: any;
		index: number;
		right: any;
	}>;
	merge(node: any, median: any): void;
	split(): Promise<{
		left: TreeNode;
		median: any;
		right: TreeNode;
	}>;
	getChildNode(index: any): Promise<any>;
	setKey(index: any, key: any): void;
	getKey(index: any): Promise<any>;
	indexChanges(index: any, seq: any): number;
}
declare class BlockEntry {
	constructor(seq: any, tree: any, entry: any);
	seq: any;
	tree: any;
	index: Pointers;
	indexBuffer: any;
	key: any;
	value: any;
	isDeletion(): boolean;
	final(): {
		seq: any;
		key: any;
		value: any;
	};
	getTreeNode(offset: any): TreeNode;
}
declare class Batch {
	constructor(tree: any, batchLock: any, cache: any, options?: {});
	tree: any;
	keyEncoding: any;
	valueEncoding: any;
	blocks: Map<any, any>;
	autoFlush: boolean;
	rootSeq: number;
	root: any;
	length: number;
	options: {};
	overwrite: boolean;
	locked: any;
	batchLock: any;
	onseq: any;
	ready(): any;
	lock(): Promise<void>;
	get version(): any;
	getRoot(ensureHeader: any): any;
	getKey(seq: any): Promise<any>;
	getBlock(seq: any): Promise<any>;
	_onwait(key: any): void;
	peek(range: any): Promise<any>;
	get(key: any): Promise<any>;
	put(key: any, value: any): Promise<void>;
	_put(key: any, value: any): Promise<void>;
	del(key: any): Promise<void>;
	_del(key: any): Promise<void>;
	destroy(): void;
	flush(): Promise<void>;
	_unlockMaybe(): void;
	_unlock(): void;
	_append(root: any, seq: any, key: any, value: any): Promise<void>;
	_appendBatch(raw: any): Promise<void>;
}
declare class Pointers {
	constructor(buf: any);
	levels: any;
	get(i: any): any;
	hasKey(seq: any): boolean;
}

import { Readable } from 'streamx';
import Hypercore from 'hypercore';
import RangeIterator from './iterators/range';
