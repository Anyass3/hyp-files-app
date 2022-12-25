export = ConnectionSet;
declare class ConnectionSet {
    _byPublicKey: Map<any, any>;
    get size(): number;
    has(publicKey: any): boolean;
    get(publicKey: any): any;
    add(connection: any): void;
    delete(connection: any): void;
    [Symbol.iterator](): IterableIterator<any>;
}
