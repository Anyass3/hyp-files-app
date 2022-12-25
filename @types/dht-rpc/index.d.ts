export = DHT;
declare class DHT extends EventEmitter {
    static bootstrapper(bind: any, opts: any): DHT;
    constructor(opts?: {});
    bootstrapNodes: any;
    table: any;
    nodes: any;
    io: IO;
    concurrency: any;
    bootstrapped: boolean;
    ephemeral: boolean;
    firewalled: any;
    adaptive: boolean;
    destroyed: boolean;
    _nat: any;
    _bind: any;
    _quickFirewall: boolean;
    _forcePersistent: boolean;
    _repinging: number;
    _checks: number;
    _tick: number;
    _refreshTicks: number;
    _stableTicks: number;
    _tickInterval: NodeJS.Timer;
    _lastTick: number;
    _lastHost: any;
    _onrow: (row: any) => any;
    _nonePersistentSamples: any[];
    _bootstrapping: Promise<void>;
    get id(): any;
    get host(): any;
    get port(): any;
    get socket(): any;
    onmessage(socket: any, buf: any, rinfo: any): void;
    bind(): any;
    address(): any;
    addNode({ host, port }: {
        host: any;
        port: any;
    }): void;
    toArray(): any;
    ready(): Promise<void>;
    findNode(target: any, opts: any): Query;
    query({ target, command, value }: {
        target: any;
        command: any;
        value: any;
    }, opts: any): Query;
    ping({ host, port }: {
        host: any;
        port: any;
    }, opts: any): Promise<any>;
    request({ token, command, target, value }: {
        token?: any;
        command: any;
        target?: any;
        value?: any;
    }, { host, port }: {
        host: any;
        port: any;
    }, opts: any): Promise<any>;
    _requestToPromise(req: any, opts: any): Promise<any>;
    _bootstrap(): Promise<void>;
    refresh(): void;
    destroy(): any;
    _request(to: any, internal: any, command: any, target: any, value: any, onresponse: any, onerror: any): any;
    _sampleBootstrapMaybe(from: any, to: any): void;
    _addNodeFromNetwork(sample: any, from: any, to: any): void;
    _addNode(node: any): void;
    _removeStaleNode(node: any, lastSeen: any): void;
    _removeNode(node: any): void;
    _onwakeup(): void;
    _onfullrow(newNode: any, row: any): void;
    _repingAndSwap(newNode: any, oldNode: any): void;
    _onrequest(req: any, external: any): void;
    onrequest(req: any): boolean;
    _onresponse(res: any, external: any): void;
    _ontimeout(req: any): void;
    _pingSome(): void;
    _check(node: any): void;
    _ontick(): void;
    _updateNetworkState(onlyFirewall?: boolean): Promise<boolean>;
    _resolveBootstrapNodes(done: any): any;
    _addBootstrapNodes(nodes: any): Promise<any>;
    _checkIfFirewalled(natSampler?: any): Promise<boolean>;
    _backgroundQuery(target: any): Query;
}
declare namespace DHT {
    export const OK: number;
    export { UNKNOWN_COMMAND as ERROR_UNKNOWN_COMMAND };
    export { INVALID_TOKEN as ERROR_INVALID_TOKEN };
}
import IO from './lib/io'
import Query from './lib/query'
import { UNKNOWN_COMMAND, INVALID_TOKEN } from './lib/errors'
import { EventEmitter } from "events";
