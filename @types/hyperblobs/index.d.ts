export = Hyperblobs;
declare class Hyperblobs {
    constructor(core: any, opts?: {});
    core: any;
    blockSize: any;
    _lock: any;
    _core: any;
    get feed(): any;
    get locked(): any;
    put(blob: any, opts?: any): Promise<any>;
    get(id: any, opts?: any): Promise<any>;
    clear(id: any, opts?: any): Promise<any>;
    createReadStream(id: any, opts?: any): BlobReadStream;
    createWriteStream(opts?: any): BlobWriteStream;
}
import { BlobReadStream } from "./lib/streams";
import { BlobWriteStream } from "./lib/streams";
