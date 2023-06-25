export = Query;
declare class Query extends Readable<
	any,
	any,
	any,
	true,
	false,
	import('streamx').ReadableEvents<any>
> {
	constructor(dht: any, target: any, internal: any, command: any, value: any, opts?: {});
	dht: any;
	k: any;
	target: any;
	internal: any;
	command: any;
	value: any;
	errors: number;
	successes: number;
	concurrency: any;
	inflight: number;
	map: any;
	maxSlow: any;
	closestReplies: any[];
	_slow: number;
	_slowdown: boolean;
	_seen: Map<any, any>;
	_pending: any[];
	_fromTable: boolean;
	_commit: any;
	_commiting: boolean;
	_onvisitbound: any;
	_onerrorbound: any;
	_oncyclebound: any;
	get closestNodes(): any[];
	finished(): Promise<any>;
	_addFromTable(): void;
	_isCloser(id: any): boolean;
	_addPending(node: any, ref: any): boolean;
	_readMore(): void;
	_flush(): void;
	_endAfterCommit(ps: any): void;
	_dec(req: any): void;
	_onvisit(m: any, req: any): void;
	_onerror(_: any, req: any): void;
	_oncycle(req: any): void;
	_downHint(node: any, down: any): void;
	_pushClosest(m: any): void;
	_compare(a: any, b: any): number;
	_visit(to: any): void;
}
import { Readable } from 'streamx';
