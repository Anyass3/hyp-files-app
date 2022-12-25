export = Hyperswarm;
declare class Hyperswarm extends EventEmitter {
    constructor(opts?: {});
    keyPair: any;
    dht: DHT;
    server: any;
    destroyed: boolean;
    maxPeers: any;
    maxClientConnections: any;
    maxServerConnections: any;
    maxParallel: any;
    connections: Set<any>;
    peers: Map<any, any>;
    explicitPeers: Set<any>;
    listening: any;
    _discovery: Map<any, any>;
    _timer: RetryTimer;
    _queue: any;
    _allConnections: ConnectionSet;
    _pendingFlushes: any[];
    _flushTick: number;
    _drainingQueue: boolean;
    _connecting: number;
    _clientConnections: number;
    _serverConnections: number;
    _firewall: any;
    _enqueue(peerInfo: PeerInfo): void;
    _requeue(batch: any): void;
    _flushMaybe(peerInfo: PeerInfo): void;
    _shouldConnect(): boolean;
    _shouldRequeue(peerInfo: PeerInfo): boolean;
    _connect(peerInfo: PeerInfo): void;
    _connectDone(): void;
    _attemptClientConnections(): void;
    _handleFirewall(remotePublicKey: any, payload: any): any;
    _handleServerConnection(conn: any): any;
    _upsertPeer(publicKey: any, relayAddresses: any): PeerInfo;
    _handlePeer(peer: any, topic: any): void;
    status(key: any): any;
    listen(): any;
    join(topic: any, opts?: {}): PeerDiscovery;
    leave(topic: any): any;
    joinPeer(publicKey: any): void;
    leavePeer(publicKey: any): void;
    flush(): Promise<any>;
    clear(): Promise<PromiseSettledResult<any>[]>;
    destroy(): Promise<void>;
}
import { EventEmitter } from "events";
import RetryTimer from "./lib/retry-timer"
import ConnectionSet from "./lib/connection-set"

import DHT = require('@hyperswarm/dht');
import PeerInfo from './lib/peer-info'
import PeerDiscovery from './lib/peer-discovery'
