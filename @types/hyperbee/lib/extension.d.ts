export = HyperbeeExtension;
declare class HyperbeeExtension {
    static register(db: any): HyperbeeExtension;
    constructor(db: any);
    encoding: any;
    outgoing: any;
    db: any;
    active: number;
    get(version: any, key: any): void;
    iterator(snapshot: any): void;
    onmessage(buf: any, from: any): void;
    oncache(message: any, from: any): void;
    onget(message: any, from: any): void;
    oniterator(message: any, from: any): Promise<void>;
}
declare namespace HyperbeeExtension {
    export { MAX_PASSIVE_BATCH as BATCH_SIZE };
}
declare const MAX_PASSIVE_BATCH: 2048;
