export = Nat;
declare class Nat {
	constructor(dht: any, socket: any);
	_samplesHost: any[];
	_samplesFull: any[];
	_visited: Map<any, any>;
	_resolve: (value: any) => void;
	_minSamples: number;
	_autoSampling: boolean;
	dht: any;
	socket: any;
	sampled: number;
	firewall: number;
	addresses: any[];
	analyzing: Promise<any>;
	autoSample(retry?: boolean): void;
	destroy(): void;
	unfreeze(): void;
	frozen: boolean;
	freeze(): void;
	_updateFirewall(): void;
	_updateAddresses(): void;
	update(): void;
	add(addr: any, from: any): void;
}
