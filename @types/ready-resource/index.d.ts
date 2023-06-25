export = ReadyResource;
declare class ReadyResource extends EventEmitter {
    constructor();
    opening: Promise<void>;
    closing: Promise<void>;
    opened: boolean;
    closed: boolean;
    ready(): Promise<void>;
    close(): Promise<void>;
    _open(): Promise<void>;
    _close(): Promise<void>;
}
import EventEmitter = require("events");
