export namespace COMMANDS {
	const PEER_HANDSHAKE: number;
	const PEER_HOLEPUNCH: number;
	const FIND_PEER: number;
	const LOOKUP: number;
	const ANNOUNCE: number;
	const UNANNOUNCE: number;
	const MUTABLE_PUT: number;
	const MUTABLE_GET: number;
	const IMMUTABLE_PUT: number;
	const IMMUTABLE_GET: number;
}
export var BOOTSTRAP_NODES: {
	host: string;
	port: number;
}[];
export namespace FIREWALL {
	const UNKNOWN: number;
	const OPEN: number;
	const CONSISTENT: number;
	const RANDOM: number;
}
export namespace ERROR {
	const NONE: number;
	const ABORTED: number;
	const VERSION_MISMATCH: number;
	const SEQ_REUSED: number;
	const SEQ_TOO_LOW: number;
}
export namespace PROTOCOL {
	const TCP: number;
	const UTP: number;
}
export namespace NS {
	const ANNOUNCE_1: any;
	export { ANNOUNCE_1 as ANNOUNCE };
	const UNANNOUNCE_1: any;
	export { UNANNOUNCE_1 as UNANNOUNCE };
	const MUTABLE_PUT_1: any;
	export { MUTABLE_PUT_1 as MUTABLE_PUT };
	const PEER_HANDSHAKE_1: any;
	export { PEER_HANDSHAKE_1 as PEER_HANDSHAKE };
	const PEER_HOLEPUNCH_1: any;
	export { PEER_HOLEPUNCH_1 as PEER_HOLEPUNCH };
}
