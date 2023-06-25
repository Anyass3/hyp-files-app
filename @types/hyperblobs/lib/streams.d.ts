export class BlobReadStream extends Readable {
    constructor(core: any, id: any, opts?: {});
    id: any;
    core: any;
    _prefetch: any;
    _lastPrefetch: any;
    _pos: any;
    _end: any;
    _index: number;
    _relativeOffset: number;
    _bytesRead: number;
    _open(cb: any): any;
    _destroy(cb: any): void;
    _read(cb: any): any;
}
export class BlobWriteStream extends Writable {
    constructor(core: any, lock: any, opts?: any);
    id: {};
    core: any;
    _lock: any;
    _release: any;
    _batch: any[];
    _open(cb: any): void;
    _final(cb: any): void;
    _destroy(cb: any): void;
    _append(cb: any): any;
    _write(data: any, cb: any): any;
}
import { Readable } from "../../streamx";
import { Writable } from "../../streamx";
