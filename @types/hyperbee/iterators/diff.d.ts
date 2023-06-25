export = DiffIterator;
declare class DiffIterator {
    constructor(left: any, right: any, opts?: {});
    left: TreeIterator;
    right: TreeIterator;
    limit: any;
    open(): Promise<void>;
    next(): Promise<{
        left: any;
        right: any;
    }>;
    _next(): Promise<{
        left: any;
        right: any;
    }>;
    close(): Promise<void>;
}
declare class TreeIterator {
    constructor(batch: any, opts?: any);
    batch: any;
    stack: any[];
    lt: any;
    lte: boolean;
    gt: any;
    gte: boolean;
    seeking: boolean;
    encoding: any;
    open(): Promise<void>;
    _seek(tree: any): Promise<boolean>;
    peek(): any;
    skip(): void;
    nextKey(): Promise<any>;
    next(): Promise<any>;
    close(): any;
}
