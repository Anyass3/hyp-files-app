/// <reference types="@sveltejs/kit" />

interface ContextMenuItem {
	name: string;
	action?: Function;
	options?: { disabled?: bool; emit?: Function };
	items?: ContextMenuItems;
}

type ContextMenuItems = Array<ContextMenuItem>;

interface ContextMenuEventDetail {
	name?: string;
	isFile?: boolean;
	path?: string;
	pos: { x: number; y: number };
}
