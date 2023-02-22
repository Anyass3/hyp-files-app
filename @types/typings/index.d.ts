
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
