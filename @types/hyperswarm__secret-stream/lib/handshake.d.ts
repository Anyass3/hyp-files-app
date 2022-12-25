export = Handshake;
declare class Handshake {
    static keyPair(seed: any): {
        publicKey: any;
        secretKey: any;
    };
    constructor(isInitiator: any, keyPair: any, remotePublicKey: any, pattern: any);
    isInitiator: any;
    keyPair: any;
    noise: any;
    destroyed: boolean;
    recv(data: any): {
        data: any;
        remotePublicKey: any;
        hash: any;
        tx: any;
        rx: any;
    };
    send(): {
        data: any;
        remotePublicKey: any;
        hash: any;
        tx: any;
        rx: any;
    };
    destroy(): void;
    _return(data: any): {
        data: any;
        remotePublicKey: any;
        hash: any;
        tx: any;
        rx: any;
    };
}
