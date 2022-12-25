export = Replicator;
declare class Replicator {
    constructor(core: any, key: any, { eagerUpgrade, allowFork, onpeerupdate, onupload }?: {
        eagerUpgrade?: boolean;
        allowFork?: boolean;
        onpeerupdate?: typeof noop;
        onupload?: typeof noop;
    });
    key: any;
    discoveryKey: any;
    core: any;
    eagerUpgrade: boolean;
    allowFork: boolean;
    onpeerupdate: typeof noop;
    onupload: typeof noop;
    peers: any[];
    findingPeers: number;
    _inflight: InflightTracker;
    _blocks: BlockTracker;
    _hashes: BlockTracker;
    _queued: any[];
    _seeks: any[];
    _upgrade: UpgradeRequest;
    _reorgs: any[];
    _ranges: any[];
    _hadPeers: boolean;
    _ifAvailable: number;
    _updatesPending: number;
    _applyingReorg: boolean;
    cork(): void;
    uncork(): void;
    broadcastRange(start: any, length: any, drop?: boolean): void;
    localUpgrade(): void;
    addUpgrade(session: any): {
        context: UpgradeRequest;
        session: any;
        sindex: number;
        rindex: number;
        resolve: any;
        reject: any;
        promise: any;
    };
    addBlock(session: any, index: any, fork?: any): any;
    addSeek(session: any, seeker: any): {
        context: SeekRequest;
        session: any;
        sindex: number;
        rindex: number;
        resolve: any;
        reject: any;
        promise: any;
    };
    addRange(session: any, { start, end, length, blocks, linear }?: {
        start?: number;
        end?: number;
        length?: number;
        blocks?: any;
        linear?: boolean;
    }): {
        context: RangeRequest;
        session: any;
        sindex: number;
        rindex: number;
        resolve: any;
        reject: any;
        promise: any;
    };
    cancel(ref: any): void;
    clearRequests(session: any): void;
    _addUpgradeMaybe(): UpgradeRequest;
    _checkUpgradeIfAvailable(): void;
    _addUpgrade(): UpgradeRequest;
    _addReorg(fork: any, peer: any): any;
    _shouldUpgrade(peer: any): boolean;
    _autoUpgrade(peer: any): boolean;
    _addPeer(peer: any): void;
    _removePeer(peer: any): void;
    _queueBlock(b: any): void;
    _resolveBlocksLocally(): Promise<void>;
    _resolveBlockRequest(tracker: any, fork: any, index: any, value: any, req: any): boolean;
    _resolveUpgradeRequest(req: any): boolean;
    _clearInflightBlock(tracker: any, req: any): void;
    _clearInflightUpgrade(req: any): void;
    _clearInflightSeeks(req: any): void;
    _clearInflightReorgs(req: any): void;
    _clearOldReorgs(fork: any): void;
    _updateNonPrimary(): Promise<void>;
    _clearRequest(peer: any, req: any): void;
    _onnodata(peer: any, req: any): void;
    _ondata(peer: any, req: any, data: any): void;
    _onreorgdata(peer: any, req: any, data: any): Promise<void>;
    _applyReorg(f: any): Promise<void>;
    _maybeUpdate(): boolean;
    _updateFork(peer: any): any;
    _updatePeer(peer: any): boolean;
    _updatePeerNonPrimary(peer: any): boolean;
    updatePeer(peer: any): void;
    updateAll(): void;
    attachTo(protomux: any): void;
    _makePeer(protomux: any): boolean;
}
declare function noop(): void;
declare class InflightTracker {
    _requests: any[];
    _free: any[];
    add(req: any): any;
    get(id: any): any;
    remove(id: any): void;
    [Symbol.iterator](): Generator<any, void, unknown>;
}
declare class BlockTracker {
    constructor(core: any);
    _core: any;
    _fork: any;
    _indexed: Map<any, any>;
    _additional: any[];
    isEmpty(): boolean;
    has(fork: any, index: any): boolean;
    get(fork: any, index: any): any;
    add(fork: any, index: any): any;
    remove(fork: any, index: any): any;
    update(fork: any): void;
    [Symbol.iterator](): Generator<any, void, undefined>;
}
declare class UpgradeRequest extends Attachable {
    constructor(replicator: any, fork: any, length: any);
    fork: any;
    length: any;
    inflight: any[];
    replicator: any;
}
declare class SeekRequest extends Attachable {
    constructor(seeks: any, fork: any, seeker: any);
    fork: any;
    seeker: any;
    inflight: any[];
    seeks: any;
}
declare class RangeRequest extends Attachable {
    constructor(ranges: any, fork: any, start: any, end: any, linear: any, blocks: any);
    fork: any;
    start: any;
    end: any;
    linear: any;
    blocks: any;
    ranges: any;
    userStart: any;
    userEnd: any;
}
declare class Attachable {
    resolved: boolean;
    refs: any[];
    attach(session: any): {
        context: Attachable;
        session: any;
        sindex: number;
        rindex: number;
        resolve: any;
        reject: any;
        promise: any;
    };
    detach(r: any): boolean;
    _detach(r: any): any;
    gc(): void;
    _cancel(r: any): void;
    _unref(): void;
    resolve(val: any): void;
    reject(err: any): void;
}
