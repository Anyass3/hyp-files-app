declare class HyperBee {
	constructor(feed: any, opts?: {});
	_feed: Feed;
	keyEncoding: any;
	valueEncoding: any;
	extension: any;
	metadata: any;
	lock: any;
	sep: any;
	readonly: boolean;
	prefix: any;
	_unprefixedKeyEncoding: any;
	_sub: boolean;
	_checkout: any;
	_ready: any;
	get feed(): Feed;
	ready(): any;
	_open(): Promise<any>;
	get version(): number;
	update(): any;
	getRoot(opts?: any, batch?: HyperBee): Promise<TreeNode>;
	getKey(seq: any): Promise<any>;
	getBlock(seq: any, opts?: any, batch?: HyperBee): Promise<BlockEntry>;
	peek(opts?: any): Promise<any>;
	createRangeIterator(opts?: {}, active?: any): any;
	createReadStream(opts?: any): any;
	createHistoryStream(opts?: any): any;
	createDiffStream(right: any, opts?: any): any;
	get(key: any, opts?: any): Promise<any>;
	put(key: any, value: any, opts?: any): Promise<void>;
	batch(opts?: any): Batch;
	del(key: any, opts?: any): Promise<void>;
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
	siblings(
		parent: any
	): Promise<{
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
	constructor(tree: any, autoFlush: any, cache: any, options?: {});
	tree: any;
	keyEncoding: any;
	valueEncoding: any;
	blocks: Map<any, any>;
	autoFlush: any;
	rootSeq: number;
	root: any;
	length: number;
	options: {};
	overwrite: boolean;
	locked: any;
	onseq: any;
	ready(): any;
	lock(): Promise<void>;
	get version(): any;
	getRoot(): any;
	getKey(seq: any): Promise<any>;
	getBlock(seq: any): Promise<any>;
	_onwait(key: any): void;
	peek(range: any): Promise<any>;
	get(key: any): Promise<any>;
	put(key: any, value: any): Promise<void>;
	del(key: any): Promise<void>;
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

declare class HyperdrivePromises {
	constructor(drive: any);
	drive: any;
	get key(): any;
	get discoveryKey(): any;
	get version(): any;
	get metadata(): any;
	get writable(): any;
	ready(): Promise<any>;
	close(): Promise<any>;
	create(name: any, opts?: any): Promise<any>;
	createReadStream(name: any, opts?: any): any;
	readFile(name: any, opts?: any): Promise<any>;
	createWriteStream(name: any, opts?: any): any;
	writeFile(name: any, buf: any, opts?: any): Promise<any>;
	createDiffStream(other: any, prefix: any, opts?: any): any;
	createDirectoryStream(name: any, opts?: any): any;
	replicate(isInitiator: any, opts?: any): any;
	truncate(name: any, size: any): Promise<any>;
	mkdir(name: any, opts?: any): Promise<any>;
	lstat(name: any, opts?: any): Promise<any>;
	stat(name: any, opts?: any): Promise<any>;
	info(name: any): Promise<any>;
	access(name: any, opts?: any): Promise<any>;
	exists(name: any, opts?: any): Promise<any>;
	readdir(name: any, opts?: any): Promise<any>;
	unlink(name: any): Promise<any>;
	rmdir(name: any): Promise<any>;
	checkout(version: any, opts?: any): any;
	destroyStorage(): Promise<any>;
	stats(path: any, opts?: any): Promise<any>;
	watchStats(path: any, opts?: any): any;
	mirror(): any;
	download(path: any, opts?: any): Promise<any>;
	watch(name: any, onchange: any): any;
	mount(path: any, key: any, opts?: any): Promise<any>;
	extension(name: any, message: any): any;
	createMountStream(opts?: any): any;
	unmount(path: any): Promise<any>;
	symlink(target: any, linkname: any): Promise<any>;
	readlink(name: any): Promise<any>;
	getAllMounts(opts?: any): Promise<any>;
	setMetadata(path: any, key: any, value: any): Promise<any>;
	removeMetadata(path: any, key: any): Promise<any>;
	copy(from: any, to: any): Promise<any>;
	createTag(name: any, version: any): Promise<any>;
	getAllTags(): Promise<any>;
	deleteTag(name: any): Promise<any>;
	getTaggedVersion(name: any): Promise<any>;
}

declare function Core(createStorage: any, key: any, opts?: any): Feed;
declare class Feed {
	constructor(createStorage: any, key: any, opts?: any);
	on: (event: string, fn: () => void) => void;
	noiseKeyPair: any;
	live: boolean;
	sparse: boolean;
	length: number;
	byteLength: number;
	maxRequests: any;
	key: any;
	discoveryKey: any;
	secretKey: any;
	bitfield: any;
	tree: any;
	writable: boolean;
	readable: boolean;
	downloading: boolean;
	uploading: boolean;
	allowPush: boolean;
	peers: any[];
	ifAvailable: any;
	extensions: any;
	crypto: any;
	_onwrite: any;
	_expectedLength: number;
	_indexing: boolean;
	_createIfMissing: boolean;
	_overwrite: boolean;
	_storeSecretKey: boolean;
	_alwaysIfAvailable: boolean;
	_merkle: any;
	_storage: any;
	_batch: any;
	timeouts: any;
	_seq: number;
	_waiting: any[];
	_selections: any[];
	_reserved: any;
	_synced: any;
	_downloadingSet: boolean;
	_stats: {
		downloadedBlocks: number;
		downloadedBytes: number;
		uploadedBlocks: number;
		uploadedBytes: number;
	};
	_codec: any;
	_sync: any;
	get remoteLength(): number;
	get stats(): {
		peers: any[];
		totals: {
			downloadedBlocks: number;
			downloadedBytes: number;
			uploadedBlocks: number;
			uploadedBytes: number;
		};
	};
	replicate(initiator: any, opts?: any): any;
	registerExtension(name: any, handlers: any): Extension;
	onextensionupdate(): void;
	setDownloading(downloading: any): void;
	setUploading(uploading: any): void;
	ready: any;
	update(opts?: any): Promise<any>;
	setExpectedLength(len: any): void;
	truncate(newLength: any): Promise<any>;
	_ifAvailable(w: any, minLength: any): void;
	_ifAvailableGet(w: any): void;
	_writeStateReloader(): Promise<any>;
	_reloadMerkleState(): Promise<any>;
	_reloadMerkleStateBeforeAppend(work: any, values: any): Promise<any>;
	_open(): Promise<any>;
	download(range: any): Promise<any>;
	undownload(range: any): void;
	digest(index: any): any;
	proof(index: any, opts?: any): Promise<any>;
	_readyAndProof(index: any, opts?: any): Promise<any>;
	put(index: any, data: any, proof: any): Promise<any>;
	cancel(start: any, end: any): void;
	_cancel(start: any, end: any): void;
	clear(start: any, end: any, opts?: any): Promise<any>;
	signature(index: any): Promise<any>;
	verify(index: any, signature: any): Promise<any>;
	rootHashes(index: any): Promise<any>;
	seek(bytes: any, opts?: any): Promise<any>;
	_ifAvailableSeek(w: any): void;
	_seek(offset: any): Promise<any>;
	_readyAndSeek(bytes: any, opts?: any): Promise<any>;
	_getBuffer(index: any): Promise<any>;
	_putBuffer(index: any, data: any, proof: any, from: any): Promise<any>;
	_readyAndPut(index: any, data: any, proof: any): Promise<any>;
	_write(index: any, data: any, nodes: any, sig: any, from: any): Promise<any>;
	_writeAfterHook(index: any, data: any, nodes: any, sig: any, from: any): Promise<any>;
	_writeDone(index: any, data: any, nodes: any, from: any): Promise<any>;
	_verifyAndWrite(
		index: any,
		data: any,
		proof: any,
		localNodes: any,
		trustedNode: any,
		from: any,
		cb: any
	): void;
	_verifyRootsAndWrite(
		index: any,
		data: any,
		top: any,
		proof: any,
		nodes: any,
		from: any,
		cb: any
	): void;
	_getRootsToVerify(verifiedBy: any, top: any, remoteNodes: any): Promise<any>;
	_announce(message: any, from: any): void;
	_unannounce(message: any): void;
	downloaded(start: any, end: any): Promise<any>;
	has(start: any, end: any): Promise<any>;
	head(opts?: any): Promise<any>;
	get(index: any, opts?: any): Promise<any>;
	_readyAndGet(index: any, opts?: any): Promise<any>;
	getBatch(start: any, end: any, opts?: any): Promise<any>;
	_getBatch(start: any, end: any, opts?: any): Promise<any>;
	_readyAndGetBatch(start: any, end: any, opts?: any): Promise<any>;
	_updatePeers(): void;
	createWriteStream(opts?: any): any;
	createReadStream(opts?: any): any;
	finalize(): Promise<any>;
	append(batch: any): Promise<any>;
	flush(): Promise<any>;
	destroyStorage(): Promise<any>;
	_close(): Promise<any>;
	_forceClose(cb: any, error: any): void;
	_destroy(err: any): void;
	_appendHook(batch: any): Promise<any>;
	_append(batch: any): Promise<any>;
	_readyAndAppend(batch: any): Promise<any>;
	_readyAndCancel(start: any, end: any): void;
	_pollWaiting(): void;
	_syncBitfield(): Promise<any>;
	_roots(index: any): Promise<any>;
	audit(): Promise<any>;
	extension(name: any, message: any): void;
}

interface Extension {
	constructor(name, opts);
	_registerExtension(peer);
	_unregisterExtension(peer);
	broadcast(message);
	send(message, peer);
	destroy();
}
