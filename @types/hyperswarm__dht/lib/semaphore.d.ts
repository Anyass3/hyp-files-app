export = Semaphore;
declare class Semaphore {
	constructor(limit?: number);
	limit: number;
	active: number;
	waiting: any[];
	destroyed: boolean;
	_onwait: (resolve: any) => void;
	wait(): Promise<any>;
	signal(): void;
	flush(): Promise<void>;
	destroy(): void;
}
