export = MerkleTree;
declare class MerkleTree {
    static open(storage: any, opts?: {}): Promise<import("./merkle-tree")>;
    constructor(storage: any, roots: any, fork: any, signature: any);
    crypto: any;
    fork: any;
    roots: any;
    length: number;
    byteLength: number;
    signature: any;
    storage: any;
    unflushed: Map<any, any>;
    flushing: Map<any, any>;
    truncated: boolean;
    truncateTo: number;
    addNode(node: any): void;
    batch(): MerkleTreeBatch;
    seek(bytes: any, padding: any): ByteSeeker;
    hash(): any;
    signable(hash?: any): any;
    getRoots(length: any): Promise<any[]>;
    upgradeable(length: any): Promise<boolean>;
    get(index: any, error?: boolean): Promise<any>;
    flush(): Promise<void>;
    _flushTruncation(): Promise<any>;
    _flushNodes(): Promise<any>;
    clear(): Promise<void>;
    close(): Promise<any>;
    truncate(length: any, fork?: any): Promise<MerkleTreeBatch>;
    reorg(proof: any): Promise<ReorgBatch>;
    verify(proof: any): Promise<MerkleTreeBatch>;
    proof({ block, hash, seek, upgrade }: {
        block: any;
        hash: any;
        seek: any;
        upgrade: any;
    }): Promise<{
        fork: any;
        block: any;
        hash: any;
        seek: any;
        upgrade: any;
    }>;
    missingNodes(index: any): Promise<number>;
    nodes(index: any): Promise<number>;
    byteRange(index: any): Promise<any[]>;
    byteOffset(index: any): Promise<number>;
}
declare class MerkleTreeBatch {
    constructor(tree: any);
    fork: any;
    roots: any[];
    length: any;
    ancestors: any;
    byteLength: any;
    signature: any;
    treeLength: any;
    treeFork: any;
    tree: any;
    nodes: any[];
    upgraded: boolean;
    hash(): any;
    signable(hash?: any): any;
    signableLegacy(hash?: any): any;
    append(buf: any): void;
    appendRoot(node: any, ite: any): void;
    commitable(): boolean;
    commit(): void;
    _commitUpgrade(): void;
    byteOffset(index: any): Promise<any>;
}
declare class ByteSeeker {
    constructor(tree: any, bytes: any, padding?: number);
    tree: any;
    bytes: any;
    padding: number;
    start: any;
    end: any;
    nodes(): any;
    _seek(bytes: any): Promise<any[]>;
    update(): Promise<any[]>;
}
declare class ReorgBatch extends MerkleTreeBatch {
    diff: any;
    want: {
        nodes: number;
        start: number;
        end: number;
    };
    get finished(): boolean;
    update(proof: any): boolean | Promise<boolean>;
    _update(nodes: any): Promise<boolean>;
    _updateDiffRoot(diff: any): boolean;
}
