import colors from 'kleur';
import last from 'lodash-es/last.js';
import debounce from 'lodash-es/debounce.js';
import throttle from 'lodash-es/throttle.js';
import hyperdrive from 'hyperdrive-x';

import { getEmitter } from '../state.js';
import { handleError, getFileType, sort } from '../utils.js';
import { Settings } from '../settings.js';
import { check, getList, getSearch } from './utils.js';

const config = Settings();
const emitter = getEmitter();


export async function setDriveEvents(drive, driveName = '') {
	const debouncedUpdateNotify = debounce(
		() => emitter.broadcast('notify-info', `${driveName} drive updated`),
		1000
	);
	const throttledDriveOpenNotify = throttle((msg) => emitter.broadcast('notify-info', msg), 10000);
	drive.on('metadata-download', (index, data, feed) => {
		emitter.dataUsage({ driveName, byteLength: data.byteLength, sub: 'download' });
		// emitter.log('metadata-download', { index, data, feed });
		//Emitted when data has been downloaded for the metadata feed.
	});

	drive.on('metadata-upload', (index, data, feed) => {
		emitter.dataUsage({ driveName, byteLength: data.byteLength, sub: 'upload' });
		// emitter.log('metadata-upload', { index, data, feed });
		//Emitted when data has been uploaded for the metadata feed.
	});

	drive.on('content-download', (index, data, feed) => {
		emitter.dataUsage({ driveName, byteLength: data.byteLength, sub: 'download' });
		// console.log('content-download', { index, data, feed });
		//Emitted when data has been downloaded for the content feed.
	});

	drive.on('content-upload', (index, data, feed) => {
		emitter.dataUsage({ driveName, byteLength: data.byteLength, sub: 'upload' });
		// emitter.log('content-upload', { index, data, feed });
	});

	drive.on('update', () => {
		debouncedUpdateNotify();
		emitter.broadcast('storage-updated', drive.$key);
		emitter.log(colors.cyan('updated: ' + driveName));
	});

	drive.files.core.on('append', () => {
		debouncedUpdateNotify();
		emitter.broadcast('storage-updated', drive.$key);
		emitter.log(colors.cyan('updated: ' + driveName));
	});

	drive.on('peer-open', (peer) => {
		throttledDriveOpenNotify(`${driveName} drive connection opened`);
		emitter.log(colors.cyan('peer-open: ' + driveName), {
			connType: peer.type,
			remotePublicKey: peer.remotePublicKey?.toString?.('hex'),
			remoteAddress: peer.remoteAddress
		});
	});

	// drive.watch('/');
}

export class Drive extends hyperdrive {
	constructor(store, dkey = undefined) {
		super(store, dkey, config.fs);
		emitter.log(colors.cyan('setting up drive'), dkey);
	}
	get closing(): boolean {
		return this.core.closing
	}

	async $ready(name) {
		await check(async () => {
			await this.ready();

			emitter.emit('drive key', this.$key);

			const info = await this.core.info({ storage: true })
			emitter.log(colors.gray(`${name || ''} drive metadata: `), {
				...info,
				key: this.$key,
				discoveryKey: this.discoveryKey.toString('hex'),
			});

			// emitter.broadcast('notify-info', 'drive is ready');
		});
		return this;
	}
	get $key() {
		return this?.key?.toString?.('hex');
	}

	// get items
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
			sorting = 'name',
			recursive = false
		} = {}
	) {
		// returns both files and dirs
		//@ts-ignore
		const result = await check(async () => {
			emitter.log('in list', dir);
			return await getList(this, await this.list(dir, { search: filter ? getSearch(show_hidden, search) : '', recursive, withStats: true, readable: true }), { filter, sorting, ordering, limit, offset, page })
		});
		return result;
	}
	async $listAllFiles(dir = '/') {
		// returns only files
		const result = await check(async () => {
			let list = await this.list(dir, { recursive: true, fileOnly: true });
			return list.map((item) => item.path);
		});
		return result;
	}

	async $download(paths = [], { name = '', ...opts } = {}) {
		if (typeof paths === 'string') paths = [paths];
		return await check(async () => {
			if (paths.length === 0) {
				await this.download('/', opts);
				emitter.log(colors.green('\t downloaded all '));
				emitter.broadcast('notify-success', 'Downloaded all files in ' + name + ' drive');
			} else
				for (const path of paths) {
					await this.download(path, opts);
					emitter.emit('rm-offline-pending', this.key, path);
					emitter.log(colors.green('\t downloaded: ' + path));
				}
			emitter.broadcast(
				'notify-success',
				`Downloaded ${paths.map((p) => last(p.split('/'))).join(',')} in ${name} drive`
			);
		});
	}
	async $removedir(...dirs) {
		return await check(async () => {
			for (const dir of dirs) {
				await this.rmDir(dir, { recursive: true });
				emitter.log(colors.green('\t✓ removed dir ' + dir));
			}
			return '✓ removed dir ' + dirs.join(', ');
		});
	}
	async $remove(...files) {
		return await check(async () => {
			for (const file of files) {
				await this.del(file); // delete the copy
				emitter.log(colors.green('\t✓ rm ' + file));
			}
			return '✓ removed ' + files.join(', ');
		});
	}

}
