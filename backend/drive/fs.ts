
import colors from 'kleur';
import * as fs from 'fs'
import { Settings } from '../settings.js';
import { join } from 'path';
import { getEmitter } from '../state.js';
import { LocalDrive } from 'hyperdrive-x';
import { check, getList, getSearch } from './utils.js';

const emitter = getEmitter();
const config = Settings();

export class FsDrive extends LocalDrive {
    constructor() {
        super(config.fs)
    }

    async $list(
        dir = '/',
        {
            offset = 0,
            limit = 100,
            page = 1,
            filter = false,
            show_hidden = true,
            ordering = 1,
            search = '',
            sorting = 'type',
            recursive = false
        } = {}
    ) {
        dir = join(config.fs, dir);
        return await check(async () => {

            return await getList(this, await this.filesGenerator(dir, { search: filter ? getSearch(show_hidden, search) : '', recursive, withStats: true }), { filter, sorting, ordering, limit, offset, page })

        });
    }
}

export const fsDrive = new FsDrive();