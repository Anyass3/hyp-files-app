export = Oplog;
declare class Oplog {
    constructor(storage: any, { pageSize, headerEncoding, entryEncoding }?: {
        pageSize?: number;
        headerEncoding?: any;
        entryEncoding?: any;
    });
    storage: any;
    headerEncoding: any;
    entryEncoding: any;
    flushed: boolean;
    byteLength: number;
    length: number;
    _headers: number[];
    _pageSize: number;
    _entryOffset: number;
    _addHeader(state: any, len: any, headerBit: any, partialBit: any): void;
    _decodeEntry(state: any, enc: any): {
        header: number;
        partial: boolean;
        byteLength: number;
        message: any;
    };
    open(): Promise<{
        header: any;
        entries: any[];
    }>;
    _readAll(): Promise<any>;
    flush(header: any): Promise<any>;
    _writeHeaderAndTruncate(i: any, bit: any, buf: any): Promise<any>;
    append(batch: any, atomic?: boolean): Promise<any>;
    close(): Promise<any>;
    _append(buf: any, count: any): Promise<any>;
}
