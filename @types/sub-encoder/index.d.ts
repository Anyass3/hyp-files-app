export = SubEncoder;
declare class SubEncoder {
    constructor(prefix: any, encoding: any, parent?: any);
    userEncoding: any;
    prefix: any;
    lt: any;
    _encodeRangeUser(r: any): any;
    _addPrefix(key: any): any;
    encode(key: any): any;
    encodeRange(range: any): any;
    decode(key: any): any;
    sub(prefix: any, encoding: any): import(".pnpm/hyperdrive@11.2.0/node_modules/sub-encoder");
}
