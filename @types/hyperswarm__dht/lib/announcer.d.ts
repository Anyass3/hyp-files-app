export = Announcer;
declare class Announcer {
    constructor(dht: any, keyPair: any, target: any, opts?: {});
    dht: any;
    keyPair: any;
    target: any;
    relays: any[];
    stopped: boolean;
    record: any;
    _refreshing: boolean;
    _closestNodes: any;
    _active: Promise<void>;
    _sleeper: Sleeper;
    _signAnnounce: any;
    _signUnannounce: any;
    _serverRelays: Map<any, any>[];
    isRelay(addr: any): boolean;
    refresh(): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    _background(): Promise<void>;
    _update(): Promise<void>;
    _unannounceAll(relays: any): Promise<PromiseSettledResult<void>[]>;
    _unannounce(to: any): Promise<void>;
    _commit(msg: any, relays: any): Promise<void>;
    _cycle(): void;
}
import Sleeper = require("./sleeper");
