export = Bitfield;
declare class Bitfield {
    static open(storage: any): Promise<any>;
    constructor(storage: any, buf: any);
    pageSize: number;
    pages: any;
    unflushed: any[];
    storage: any;
    resumed: boolean;
    get(index: any): any;
    set(index: any, val: any): void;
    setRange(start: any, length: any, val: any): void;
    page(i: any): any;
    clear(): Promise<any>;
    close(): Promise<any>;
    flush(): Promise<any>;
}
