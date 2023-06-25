export = CorestoreNetworker;

declare class CorestoreNetworker {
	constructor(corestore: any, opts?: Record<string, any>);
	corestore: any;
	opts?: Record<string, string>;
	keyPair: any;
	_replicationOpts: {
		encrypt: boolean;
		live: boolean;
		keyPair: any;
		onauthenticate: any;
	};
	streams: any;
	peers: any;
	_joined: any;
	_flushed: any;
	_configurations: any;
	_extensions: any;
	_streamsProcessing: number;
	_streamsProcessed: number;
	swarm: Hyperswarm;
	_replicate(protocolStream: any): void;
	_flush(keyString: any, keyBuf: any, client: any): Promise<void>;
	_join(discoveryKey: any, opts?: Record<string, string>): Promise<void>;
	_leave(discoveryKey: any): any;
	_registerAllExtensions(peer: any): void;
	_unregisterAllExtensions(peer: any): void;
	_addStream(stream: any): void;
	_removeStream(stream: any): void;
	_open(): void;
	_close(): Promise<any>;
	close(): Promise<any>;
	listen(): any;
	status(discoveryKey: any): any;
	allStatuses(): any[];
	configure(discoveryKey: any, opts?: Record<string, any>): Promise<any>;
	_configure(discoveryKey: any, opts?: any): Promise<any>;
	joined(discoveryKey: any): any;
	flushed(discoveryKey: any): any;
	registerExtension(name: any, handlers: any): any;
}
