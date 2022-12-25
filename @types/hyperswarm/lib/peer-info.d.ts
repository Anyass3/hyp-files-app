export = PeerInfo;
declare class PeerInfo extends EventEmitter {
    constructor({ publicKey, relayAddresses }: {
        publicKey: any;
        relayAddresses: any;
    });
    publicKey: any;
    relayAddresses: any;
    reconnecting: boolean;
    proven: boolean;
    banned: boolean;
    tried: boolean;
    queued: boolean;
    client: boolean;
    topics: any[];
    attempts: number;
    priority: number;
    _index: number;
    _flushTick: number;
    _seenTopics: Set<any>;
    get server(): boolean;
    get prioritized(): boolean;
    _getPriority(): 1 | 0 | 2 | 3 | 4;
    _connected(): void;
    _disconnected(): void;
    _deprioritize(): void;
    _reset(): void;
    _updatePriority(): boolean;
    _topic(topic: any): void;
    reconnect(val: any): void;
    ban(val: any): void;
}
import { EventEmitter } from "events";
