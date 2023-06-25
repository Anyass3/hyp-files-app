export = RetryTimer;
declare class RetryTimer {
	constructor(
		push: any,
		{
			backoffs,
			jitter
		}?: {
			backoffs?: number[];
			jitter?: number;
		}
	);
	jitter: number;
	backoffs: number[];
	_sTimer: BulkTimer;
	_mTimer: BulkTimer;
	_lTimer: BulkTimer;
	_selectRetryTimer(peerInfo: any): BulkTimer;
	add(peerInfo: any): any;
	destroy(): void;
}
import BulkTimer = require('./bulk-timer');
