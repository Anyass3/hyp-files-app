export class ReadStream extends Readable {
    constructor(core: any, opts?: {});
    core: any;
    start: any;
    end: any;
    snapshot: boolean;
    live: boolean;
    _openP(): Promise<void>;
    _readP(): Promise<void>;
}
export class WriteStream extends Writable {
    constructor(core: any);
    core: any;
    _writevP(batch: any): Promise<void>;
}
import type { Readable, Writable } from "stream";
