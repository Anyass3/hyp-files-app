export class ReadStream extends Readable<any, any, any, true, false, import("streamx").ReadableEvents<any>> {
    constructor(core: any, opts?: {});
    core: any;
    start: any;
    end: any;
    snapshot: boolean;
    live: boolean;
    _openP(): Promise<void>;
    _readP(): Promise<void>;
}
export class WriteStream extends Writable<any, any, any, false, true, import("streamx").WritableEvents<any>> {
    constructor(core: any);
    core: any;
    _writevP(batch: any): Promise<void>;
}
import { Readable } from "streamx";
import { Writable } from "streamx";
