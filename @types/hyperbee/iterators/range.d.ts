export = RangeIterator;
declare class RangeIterator {
    constructor(db: any, opts?: {});
    db: any;
    stack: any[];
    opened: boolean;
    _limit: any;
    _gIncl: boolean;
    _gKey: any;
    _lIncl: boolean;
    _lKey: any;
    _reverse: boolean;
    _version: number;
    _checkpoint: any;
    _nexting: boolean;
    snapshot(version?: any): {
        version: any;
        gte: any;
        gt: any;
        lte: any;
        lt: any;
        limit: any;
        reverse: boolean;
        ended: boolean;
        checkpoint: any[];
    };
    open(): Promise<void>;
    _open(): Promise<void>;
    next(): Promise<any>;
}
