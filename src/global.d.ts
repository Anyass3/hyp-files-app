/// <reference types="@sveltejs/kit" />

interface ContextMenuItem {
	name: string;
	action?: Function;
	disabled?: bool;
	hidden?: bool;
	options?: { emit?: Function };
	items?: ContextMenuItems;
}

declare type ContextMenuItems = Array<ContextMenuItem>;

interface ContextMenuEventDetail {
	name?: string;
	isFile?: boolean;
	path?: string;
	pos: { x: number; y: number };
}
interface ImportMetaEnv {
	VITE_API_URL: string;
	VITE_API_PORT: number;
}

declare type loading = 'load-next-page' | 'load-page';
