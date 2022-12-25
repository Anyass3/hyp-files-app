export = BlockEncryption;
declare class BlockEncryption {
    constructor(encryptionKey: any, hypercoreKey: any);
    key: any;
    blockKey: any;
    blindingKey: any;
    padding: number;
    encrypt(index: any, block: any, fork: any): void;
    decrypt(index: any, block: any): void;
}
