export = Core;
declare class Core {
    static open(storage: any, opts?: {}): Promise<any>;
    static createAuth(crypto: any, { publicKey, secretKey }: {
        publicKey: any;
        secretKey: any;
    }, opts?: {}): {
        sign: any;
        verify(signable: any, signature: any): any;
    };
    static resume(oplogFile: any, treeFile: any, bitfieldFile: any, dataFile: any, opts?: any): Promise<import("./core")>;
    constructor(header: any, crypto: any, oplog: any, tree: any, blocks: any, bitfield: any, auth: any, legacy: any, onupdate: any);
    onupdate: any;
    header: any;
    crypto: any;
    oplog: any;
    tree: any;
    blocks: any;
    bitfield: any;
    defaultAuth: any;
    truncating: number;
    _maxOplogSize: number;
    _autoFlush: number;
    _verifies: {
        batch: any;
        bitfield: {
            drop: boolean;
            start: any;
            length: number;
        };
        value: any;
        from: any;
    }[];
    _verifiesFlushed: any;
    _mutex: Mutex;
    _legacy: any;
    _shouldFlush(): boolean;
    _flushOplog(): Promise<void>;
    _appendBlocks(values: any): any;
    _writeBlock(batch: any, index: any, value: any): Promise<void>;
    userData(key: any, value: any): Promise<void>;
    truncate(length: any, fork: any, auth?: any): Promise<void>;
    append(values: any, auth?: any, hooks?: {}): Promise<any>;
    _signed(batch: any, hash: any, auth?: any): any;
    _verifyExclusive({ batch, bitfield, value, from }: {
        batch: any;
        bitfield: any;
        value: any;
        from: any;
    }): Promise<boolean>;
    _verifyShared(): Promise<boolean>;
    _verified: Promise<boolean>;
    verify(proof: any, from: any): Promise<boolean>;
    reorg(batch: any, from: any): Promise<boolean>;
    _truncate(batch: any, from: any): Promise<void>;
    close(): Promise<void>;
}
import Mutex = require("./mutex");
