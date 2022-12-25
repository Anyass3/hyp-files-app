export = BlockStore;
declare class BlockStore {
    constructor(storage: any, tree: any);
    storage: any;
    tree: any;
    get(i: any): Promise<any>;
    put(i: any, data: any, offset: any): Promise<any>;
    putBatch(i: any, batch: any, offset: any): Promise<any>;
    clear(): Promise<any>;
    close(): Promise<any>;
    _read(offset: any, size: any): Promise<any>;
    _write(offset: any, data: any): Promise<any>;
}
