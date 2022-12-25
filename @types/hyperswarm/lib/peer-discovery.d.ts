export = PeerDiscovery;
declare class PeerDiscovery {
    constructor(swarm: any, topic: any, { server, client, onpeer, onerror }: {
        server?: boolean;
        client?: boolean;
        onpeer?: typeof noop;
        onerror?: typeof noop;
    });
    swarm: any;
    topic: any;
    isClient: boolean;
    isServer: boolean;
    destroyed: boolean;
    _onpeer: typeof noop;
    _onerror: typeof noop;
    _activeQuery: any;
    _timer: NodeJS.Timeout;
    _currentRefresh: Promise<void>;
    _closestNodes: any;
    _firstAnnounce: boolean;
    _refreshLater(eager: any): void;
    _refresh(): Promise<void>;
    refresh({ client, server }?: {
        client?: boolean;
        server?: boolean;
    }): Promise<void>;
    flushed(): Promise<void>;
    destroy(): Promise<any>;
}
declare function noop(): void;
