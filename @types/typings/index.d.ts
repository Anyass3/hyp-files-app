export interface Item {
	name: string;
	stat: {
		isFile: boolean;
		ctype: string;
		mtime: number;
		size: number;
		// items: number;
	};
	path: string;
}


export type ReportProgressAction = 'send' | 'recieve' | 'copy' | 'delete' | 'move' | 'rename' | 'upload' | 'download' | 'sync' | 'paste';
export interface ReportProgressOpts {
	size: number;
	name: string;
	data: string;
	drive: string;
	key?: string;
	action: ReportProgressAction
}

export type ReportProgress = Required<ReportProgressOpts> & { loadedBytes: number }

export type BasicReportProgress = Omit<ReportProgress, 'size' | 'loadedBytes'> & { size?: number; loadedBytes?: number };