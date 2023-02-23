import { ReadDir } from "hyperdrive-x/lib/typings.js";
import { join } from "path";
import { getEmitter } from "../state.js";
import { getFileType, handleError, sort } from "../utils.js";
import type { Drive, FsDrive } from "./index.js";

const emitter = getEmitter();

export const getSearch = (show_hidden: boolean, search: string) => {

    if (!show_hidden && !search) return /^[^\.]/
    if (show_hidden && search) return RegExp(search);
    if (!show_hidden && search) return RegExp(`^[\\.]?.*${search}`)

    return search
}

export const getList = async (self: Drive | FsDrive, readable: any, { filter, sorting, ordering, limit, offset, page }) => {
    let items = []

    for await (const item of readable) {
        const isFile = item.stat.isFile();
        item.path = join('/', item.path);
        items.push({
            name: item.name,
            path: item.path,
            stat: {
                isFile,
                ctype: isFile ? await getFileType({ path: item.path, drive: self }) : false,
                mtime: item.stat.mtimeMs,
                size: item.stat.size,
                // items: item.stat.itemsCount
                // offline: stats.blocks === stats.downloadedBlocks
            }
        })

    }
    if (!items.length) return (filter ? { items: [], total: 0, page: 1 } : []);

    if (filter) {
        items = sort(items, { sorting, ordering });
        const total = items.length;
        items = items.slice(offset, offset + limit);
        return { items: items, total, page }
    }
    return items;
}

export async function check<F extends (...args) => any>(fn: F) {
    return await handleError<ReturnType<F>>(fn, emitter)();
}