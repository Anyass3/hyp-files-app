/// <reference types="@sveltejs/kit" />

interface ContextMenuItem {
	name: string;
	action?: Function;
	disabled?: bool;
	hidden?: bool;
	options?: { emit?: Function };
	items?: ContextMenuItems;
	pending?: boolean;
}

declare type ContextMenuItems = Array<ContextMenuItem>;

interface ContextMenuEventDetail {
	name?: string;
	isFile?: boolean;
	path?: string;
	pos: { x: number; y: number };
}
interface ToolTip {
	name: string;
	path: string;
	isFile: boolean;
	size: number;
	ctype: string;
	mtime: string;
	blocks: number;
	items: number;
}

interface ImportMetaEnv {
	VITE_API_URL: string;
	VITE_API_PORT: number;
	API_URL: number;
	BASE_URL: string;
}

interface ImportMeta {
	env: ImportMetaEnv;
}

declare type loading = 'load-next-page' | 'load-page';
