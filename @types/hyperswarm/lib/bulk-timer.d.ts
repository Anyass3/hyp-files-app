export = BulkTimer;
declare class BulkTimer {
    constructor(time: any, fn: any);
    _time: any;
    _fn: any;
    _interval: NodeJS.Timer;
    _next: any[];
    _pending: any[];
    _destroyed: boolean;
    destroy(): void;
    _ontick(): void;
    add(info: any): void;
}
