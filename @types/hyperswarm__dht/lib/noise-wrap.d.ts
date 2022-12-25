export = NoiseWrap;
declare class NoiseWrap {
    constructor(keyPair: any, remotePublicKey: any);
    isInitiator: boolean;
    remotePublicKey: any;
    keyPair: any;
    handshake: any;
    send(payload: any): any;
    recv(buf: any): any;
    final(): {
        isInitiator: boolean;
        publicKey: any;
        remotePublicKey: any;
        remoteId: any;
        holepunchSecret: Buffer;
        hash: any;
        rx: any;
        tx: any;
    };
}
