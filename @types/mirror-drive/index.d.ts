export = MirrorDrive;
declare class MirrorDrive {
    constructor(src: any, dst: any, opts?: {});
    src: any;
    dst: any;
    prefix: any;
    dryRun: boolean;
    prune: boolean;
    includeEquals: boolean;
    filter: any;
    metadataEquals: any;
    batch: boolean;
    count: {
        files: number;
        add: number;
        remove: number;
        change: number;
    };
    bytesRemoved: number;
    bytesAdded: number;
    iterator: AsyncGenerator<{
        op: string;
        key: any;
        bytesRemoved: any;
        bytesAdded: any;
    }, void, unknown>;
    done(): Promise<void>;
    _mirror(): AsyncGenerator<{
        op: string;
        key: any;
        bytesRemoved: any;
        bytesAdded: any;
    }, void, unknown>;
    [Symbol.asyncIterator](): AsyncGenerator<{
        op: string;
        key: any;
        bytesRemoved: any;
        bytesAdded: any;
    }, void, unknown>;
}
