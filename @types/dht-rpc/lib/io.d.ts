export = IO;
declare class IO {
    constructor(table: any, { maxWindow, bind, firewalled, onrequest, onresponse, ontimeout }?: {
        maxWindow?: number;
        bind?: number;
        firewalled?: boolean;
        onrequest: any;
        onresponse?: typeof noop;
        ontimeout?: typeof noop;
    });
    table: any;
    inflight: any[];
    clientSocket: any;
    serverSocket: any;
    firewalled: boolean;
    ephemeral: boolean;
    congestion: CongestionWindow;
    onrequest: any;
    onresponse: typeof noop;
    ontimeout: typeof noop;
    _pending: any;
    _rotateSecrets: number;
    _tid: number;
    _secrets: any[];
    _drainInterval: NodeJS.Timer;
    _destroying: Promise<any>;
    _binding: Promise<void>;
    _bind: number;
    onmessage(socket: any, buffer: any, rinfo: any): void;
    token(addr: any, i: any): any;
    destroy(): Promise<any>;
    bind(): Promise<void>;
    _bindSockets(): Promise<void>;
    _drain(): void;
    createRequest(to: any, token: any, internal: any, command: any, target: any, value: any): Request;
}
declare class CongestionWindow {
    constructor(maxWindow: any);
    _i: number;
    _total: number;
    _window: number[];
    _maxWindow: any;
    isFull(): boolean;
    recv(): void;
    send(): void;
    drain(): void;
}
declare function noop(): void;
declare class Request {
    static decode(io: any, socket: any, from: any, state: any): Request;
    constructor(io: any, socket: any, tid: any, from: any, to: any, token: any, internal: any, command: any, target: any, value: any);
    socket: any;
    tid: any;
    from: any;
    to: any;
    token: any;
    command: any;
    target: any;
    value: any;
    internal: any;
    sent: number;
    retries: number;
    destroyed: boolean;
    oncycle: typeof noop;
    onerror: typeof noop;
    onresponse: typeof noop;
    _buffer: any;
    _io: any;
    _timeout: NodeJS.Timeout;
    reply(value: any, opts?: {}): void;
    error(code: any, opts?: {}): void;
    relay(value: any, to: any, opts: any): void;
    send(force?: boolean): void;
    sendReply(error: any, value: any, token: any, hasCloserNodes: any): void;
    _sendNow(): void;
    destroy(err: any): void;
    _sendReply(error: any, value: any, token: any, hasCloserNodes: any, from: any, socket: any, onflush: any): void;
    _encodeRequest(token: any, value: any, to: any, socket: any): any;
}
