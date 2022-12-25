export = Bridge;
declare class Bridge extends Duplex<any, any, any, any, true, true, import("streamx").DuplexEvents<any, any>> {
    constructor(noiseStream: any);
    noiseStream: any;
    _ondrain: any;
    reverse: ReversePassThrough;
    get publicKey(): any;
    get remotePublicKey(): any;
    get handshakeHash(): any;
}
import { Duplex } from "streamx";
declare class ReversePassThrough extends Duplex<any, any, any, any, true, true, import("streamx").DuplexEvents<any, any>> {
    constructor(s: any);
    _stream: any;
    _ondrain: any;
}
