export = Mutex;
declare class Mutex {
    locked: boolean;
    destroyed: boolean;
    _destroying: Promise<any>;
    _destroyError: any;
    _queue: any[];
    _enqueue: (resolve: any, reject: any) => number;
    lock(): Promise<any>;
    unlock(): void;
    destroy(err: any): Promise<any>;
}
