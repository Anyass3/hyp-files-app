export namespace handshake {
    function preencode(state: any, m: any): void;
    function preencode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function decode(state: any): {
        mode: any;
        noise: any;
        peerAddress: any;
        relayAddress: any;
    };
    function decode(state: any): {
        mode: any;
        noise: any;
        peerAddress: any;
        relayAddress: any;
    };
}
export namespace noisePayload {
    function preencode(state: any, m: any): void;
    function preencode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function decode(state: any): {
        version: any;
        error: any;
        firewall: any;
        protocols: any;
        holepunch: {
            id: any;
            relays: any;
        };
        addresses: any;
    };
    function decode(state: any): {
        version: any;
        error: any;
        firewall: any;
        protocols: any;
        holepunch: {
            id: any;
            relays: any;
        };
        addresses: any;
    };
}
export namespace holepunch {
    function preencode(state: any, m: any): void;
    function preencode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function decode(state: any): {
        mode: any;
        id: any;
        payload: any;
        peerAddress: any;
    };
    function decode(state: any): {
        mode: any;
        id: any;
        payload: any;
        peerAddress: any;
    };
}
export namespace holepunchPayload {
    function preencode(state: any, m: any): void;
    function preencode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function decode(state: any): {
        error: any;
        firewall: any;
        round: any;
        connected: boolean;
        punching: boolean;
        addresses: any;
        remoteAddress: any;
        token: any;
        remoteToken: any;
    };
    function decode(state: any): {
        error: any;
        firewall: any;
        round: any;
        connected: boolean;
        punching: boolean;
        addresses: any;
        remoteAddress: any;
        token: any;
        remoteToken: any;
    };
}
export namespace peer {
    function preencode(state: any, m: any): void;
    function preencode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function decode(state: any): {
        publicKey: any;
        relayAddresses: any;
    };
    function decode(state: any): {
        publicKey: any;
        relayAddresses: any;
    };
}
export var peers: any;
export namespace announce {
    function preencode(state: any, m: any): void;
    function preencode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function decode(state: any): {
        peer: {
            publicKey: any;
            relayAddresses: any;
        };
        refresh: any;
        signature: any;
    };
    function decode(state: any): {
        peer: {
            publicKey: any;
            relayAddresses: any;
        };
        refresh: any;
        signature: any;
    };
}
export namespace mutableSignable {
    function preencode(state: any, m: any): void;
    function preencode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function decode(state: any): {
        seq: any;
        value: any;
    };
    function decode(state: any): {
        seq: any;
        value: any;
    };
}
export namespace mutablePutRequest {
    function preencode(state: any, m: any): void;
    function preencode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function decode(state: any): {
        publicKey: any;
        seq: any;
        value: any;
        signature: any;
    };
    function decode(state: any): {
        publicKey: any;
        seq: any;
        value: any;
        signature: any;
    };
}
export namespace mutableGetResponse {
    function preencode(state: any, m: any): void;
    function preencode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function encode(state: any, m: any): void;
    function decode(state: any): {
        seq: any;
        value: any;
        signature: any;
    };
    function decode(state: any): {
        seq: any;
        value: any;
        signature: any;
    };
}
