export = HistoryIterator;
declare class HistoryIterator {
    constructor(batch: any, opts?: {});
    batch: any;
    options: {};
    live: boolean;
    gte: number;
    lt: number;
    reverse: boolean;
    limit: any;
    encoding: any;
    open(): Promise<void>;
    next(): Promise<any>;
    close(): any;
}
