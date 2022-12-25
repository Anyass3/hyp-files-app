export = HolepunchRouter;
declare class HolepunchRouter {
    constructor(dht: any, opts: any);
    dht: any;
    servers: Map<any, any>;
    forwards: any;
    set(target: any, state: any): void;
    get(target: any): any;
    delete(target: any): void;
    peerHandshake(target: any, { noise, peerAddress, relayAddress, socket }: {
        noise: any;
        peerAddress: any;
        relayAddress: any;
        socket: any;
    }, to: any): Promise<{
        noise: any;
        relayed: boolean;
        serverAddress: any;
        clientAddress: any;
    }>;
    onpeerhandshake(req: any): Promise<void>;
    peerHolepunch(target: any, { id, payload, peerAddress, socket }: {
        id: any;
        payload: any;
        peerAddress: any;
        socket: any;
    }, to: any): Promise<{
        from: any;
        to: any;
        payload: any;
        peerAddress: any;
    }>;
    onpeerholepunch(req: any): Promise<void>;
}
