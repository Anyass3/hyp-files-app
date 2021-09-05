import colors from 'colors';
import last from 'lodash/last.js';
import debounce from 'lodash/debounce.js';
import hyperdrive from 'hyperdrive';
import { EventEmitter } from 'events';

import fs from 'fs';
import { getEmitter } from './state.js';
import mime from 'mime-types';
import { extname, resolve, join } from 'path';
import { handleError, getFileType } from './utils.js';
import { Settings } from './settings.js';

const config = Settings();
const emitter = getEmitter();

export async function setDriveEvents(drive, driveName = '') {
	const debouncedUpdateNotify = debounce(
		() => emitter.broadcast('notify-info', `${driveName} drive updated`),
		1000
	);
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
	drive.on('peer-open', (peer) => {
		emitter.broadcast('notify-info', `${driveName} drive connection opened`);
		emitter.log(colors.cyan('peer-open: ' + driveName), {
			connType: peer.type,
			remotePublicKey: peer.remotePublicKey?.toString?.('hex'),
			remoteAddress: peer.remoteAddress
		});
	});

	drive.watch('/');
}
//@ts-ignore
export default class extends hyperdrive {
	promises: HyperdrivePromises;
	key: Buffer;
	discoveryKey: Buffer;
	writable: boolean;
	opened: boolean;
	closed: boolean;
	closing: boolean;
	metadata: any;
	peers: Array<any>;
	createWriteStream: typeof fs.createWriteStream;
	createReadStream: typeof fs.createReadStream;
	on: (event: string, fn: () => void) => void;
	close?: () => Promise<any>;
	constructor(store, dkey = null) {
		super(store, dkey);
		emitter.log(colors.cyan('setting up drive'));
	}
	async check(fn) {
		return await handleError(fn, emitter)();
	}
	async $ready(name) {
		await this.check(async () => {
			await this.promises.ready();

			emitter.emit('drive key', this.$key);

			emitter.log(colors.gray(`${name || ''} drive metadata: `), {
				key: this.$key,
				discoveryKey: this.discoveryKey.toString('hex'),
				writable: this.writable,
				opened: this.opened,
				byteLength: this.metadata.byteLength,
				peers: this.peers.length
			});

			// emitter.broadcast('notify-info', 'drive is ready');
		});
		return this;
	}
	get $key() {
		return this?.key?.toString?.('hex');
	}
	async $readDir(dir, { dest = '/', isdrive = true, drive = undefined } = {}) {
		return await this.check(async () => {
			let items;
			if (drive || isdrive) {
				// emitter.log('readdir is drive');
				items = await (drive || this).promises.readdir(dir);

				// emitter.log('readdir is drive and items', items);
			} else {
				// emitter.log('readdir is fs');
				items = fs.readdirSync(join(config.fs, dir));
			}
			emitter.log('readdir-dest', dest);
			return items.map((item) => ({
				name: item,
				path: join(dir, item),
				new_path: join(dest, item)
			}));
		});
	}
	async $readAllDirFiles(drive_src, dest = '/') {
		return await this.check(async () => {
			let files = [];
			let dirList;
			if (typeof drive_src === 'string') dirList = await this.$readDir(drive_src, { dest });
			else dirList = drive_src;
			for (let item of dirList) {
				const isdir = (await this.promises.stat(item.path)).isDirectory();
				const _dest = join(dest, item.new_path);
				if (isdir) {
					const items = await this.$readDir(item.path);
					if (items.length) files = [...files, ...(await this.$readAllDirFiles(item.path, dest))];
				} else {
					files = [...files, _dest];
				}
			}
			return files;
		});
	}
	async $fsMakeDir(dest) {
		return await this.check(async () => {
			if (!fs.existsSync(resolve(join(config.fs, dest))))
				fs.mkdirSync(resolve(join(config.fs, dest)));
		});
	}
	async $driveMakeDir(dir) {
		return await this.check(async () => {
			const exists = await this.promises.exists(dir);
			if (!exists) {
				await this.promises.mkdir(dir);
				// emitter.log('in drivemakedir', dir);
			}
		});
	}

	async $fsWriteDir(dirList, fs_dest, { drive }) {
		await this.check(async () => {
			for (let item of dirList) {
				const isdir = drive
					? (await drive.promises.stat(item.path)).isDirectory()
					: fs.statSync(join(config.fs, item.path)).isDirectory();
				if (isdir) {
					await this.$fsMakeDir(item.new_path);
					const items = await this.$readDir(item.path, {
						dest: item.new_path,
						drive,
						isdrive: !!drive
					});
					emitter.log(items);
					if (items.length) await this.$fsWriteDir(items, fs_dest, { drive });
				} else {
					await this.$fsMakeDir(item.new_path.split('/')[0]);
					const destFile = fs.createWriteStream(join(config.fs, item.new_path));
					if (drive) drive.createReadStream(item.path).pipe(destFile);
					else fs.createReadStream(join(config.fs, item.path)).pipe(destFile);
				}
			}
		});
	}
	async $driveWriteDir(dirList, dest, { drive, isdrive }) {
		await this.check(async () => {
			for (let item of dirList) {
				const isdir = isdrive
					? (await drive.promises.stat(item.path)).isDirectory()
					: fs.statSync(join(config.fs, item.path)).isDirectory();
				if (isdir) {
					await this.$driveMakeDir(item.new_path);
					emitter.log('drive=>', !!drive);
					const items = await this.$readDir(item.path, {
						drive,
						dest: item.new_path,
						isdrive: !!drive
					});
					// emitter.log('items in drivewritedir', items, dest);
					if (items?.length) await this.$driveWriteDir(items, dest, { drive, isdrive });
				} else {
					await this.$driveMakeDir(item.new_path.split('/')[0]);
					const destFile = this.createWriteStream(item.new_path);
					// emitter.log('b4 read stream');
					if (drive) drive.createReadStream(item.path).pipe(destFile);
					else fs.createReadStream(join(config.fs, item.path)).pipe(destFile);
				}
			}
		});
	}

	// GRUD
	async $list(
		dir = '/',
		recursive = false,
		{ offset = 0, limit = 50, page = 1, paginate = false, show_hidden = true } = {}
	) {
		// returns both files and dirs
		let total = 0;
		return await this.check(async () => {
			// emitter.log('in list', dir);
			// console.log({ page, paginate, show_hidden, limit, offset });
			let list = await this.promises.readdir(dir, { recursive, includeStats: true });
			if (paginate) {
				if (!show_hidden) list = list.filter((file) => !/^\./.exec(file));
				total = list.length;
				list = list.slice(offset, offset + limit);
			}
			list = list.map((item) => ({
				name: item.name,
				path: join(dir, item.name),
				stat: {
					isFile: item.stat.isFile(),
					size: item.stat.size,
					ctype: mime.lookup(extname(item.name))
				}
			}));
			// emitter.log('\tListing:', list);
			return paginate ? { items: list, total, page } : list;
		});
	}
	async $listAllFiles(dir = '/') {
		// returns only files
		return await this.check(async () => {
			let list = await this.$list(dir, true);
			list = list.filter((item) => item.stat.isFile);
			return list.map((item) => item.path);
		});
	}
	async $listAllDirs(dir = '/') {
		// returns only dirs
		return await this.check(async () => {
			let list = await this.$list(dir, true);
			list = list.filter((item) => !item.stat.isFile);
			return list.map((item) => item.path);
		});
	}
	async $listfs(
		dir = '/',
		{ offset = 0, limit = 50, page = 1, paginate = false, show_hidden = true } = {}
	) {
		dir = join(config.fs, dir);
		let total = 0;
		return await this.check(async () => {
			let list = fs.readdirSync(dir);
			if (paginate) {
				if (!show_hidden) list = list.filter((file) => !/^\./.exec(file));
				total = list.length;
				list = list.slice(offset, offset + limit);
			}
			//@ts-ignore
			list = list.map((item) => {
				let _path = join(dir, item);
				const stat = fs.statSync(_path);
				_path = _path.replace(config.fs, '');
				if (!_path.startsWith('/')) _path = '/' + _path;
				return {
					name: item,
					path: _path,
					stat: { isFile: stat.isFile(), size: stat.size, ctype: mime.lookup(extname(item)) }
				};
			});
			emitter.log('\tListing:', list);
			return paginate ? { items: list, total, page } : list;
		});
	}
	async $write(file, ...content) {
		return await this.check(async () => {
			await this.promises.writeFile(file, content.join(' '));
			const message = '✓ written ' + file;
			emitter.log(colors.green('\t' + message));
		});
	}
	async $put(...args) {
		return await this.check(async () => {
			//@ts-ignore
			await this.$write(...args);
		});
	}
	async $read(file, endcoding) {
		return await this.check(async () => {
			const content = await this.promises.readFile(file, endcoding);
			return content;
		});
	}
	async $download(...dirs) {
		return await this.check(async () => {
			if (dirs.length === 0) {
				await this.promises.download('/');
				emitter.log(colors.green('\t downloaded all '));
				return 'downloaded all';
			} else
				for (let dir of dirs) {
					await this.promises.download(dir);
					emitter.log(colors.green('\t downloaded: ' + dir));
				}
			return 'downloaded' + dirs.join(', ');
		});
	}
	async $makedir(...dirs) {
		return await this.check(async () => {
			for (let dir of dirs) {
				await this.promises.mkdir(dir);
				emitter.log(colors.green('\t✓ makedir ' + dir));
			}
		});
	}
	async $copy(source, dest) {
		return await this.check(async () => {
			this.createReadStream(source).pipe(this.createWriteStream(dest));
			emitter.log(colors.green('\t copied: ' + source + ' ' + dest));
			return 'copied: ' + source + ' ' + dest;
		});
	}
	async $removedir(...dirs) {
		return await this.check(async () => {
			//neeeds_work
			for (let dir of dirs) {
				const files = await this.$listAllFiles(dir);
				emitter.log('files', files);
				await this.$remove(...files);
				const dirs = await this.$listAllDirs(dir);
				emitter.log('dirs', dirs);
				for (let dir of dirs.reverse()) {
					//deleting the now empty directories
					await this.promises.rmdir(dir);
				}
				if (await this.promises.exists(dir)) await this.promises.rmdir(dir);
				emitter.log(colors.green('\t✓ removed dir ' + dir));
			}
			return '✓ removed dir ' + dirs.join(', ');
		});
	}
	async $remove(...files) {
		return await this.check(async () => {
			for (let file of files) {
				await this.promises.unlink(file); // delete the copy
				emitter.log(colors.green('\t✓ rm ' + file));
			}
			return '✓ removed ' + files.join(', ');
		});
	}
	async $export(drive_src = './', fs_dest = './') {
		this.$__copy__(
			{ path: drive_src, isdrive: true, drive: undefined },
			{ path: fs_dest, isdrive: false, drive: undefined }
		);
	}
	async $import(fs_src = './', drive_dest = './') {
		this.$__copy__(
			{ path: fs_src, isdrive: false, drive: undefined },
			{ path: drive_dest, isdrive: true, drive: undefined }
		);
	}

	async $__copy__(src, dest) {
		//{path, isdrive}
		//src=>drive
		//dest=>fs
		return await this.check(async () => {
			const destDrive = dest.drive || this;
			const srcDrive = src.drive || this;
			if (!destDrive.writable) {
				throw new Error('sorry this drive is not writable');
			}
			// emitter.log('dest.isdrive', dest.isdrive);
			// emitter.log('src.isdrive', src.isdrive, !!src.drive);
			const isFile = (src.isdrive
				? await srcDrive.promises.stat(src.path)
				: fs.statSync(join(config.fs, src.path))
			).isFile();
			// emitter.log('isFile', isFile);
			const destStorage = dest.isdrive ? destDrive : fs;
			const srcStorage = src.isdrive ? srcDrive : fs;
			const makeDir = dest.isdrive ? '$driveMakeDir' : '$fsMakeDir';
			const writeDir = dest.isdrive ? '$driveWriteDir' : '$fsWriteDir';
			if (isFile) {
				if (dest.path.endsWith('/') || dest.path === '.') {
					const filename = last(src.path.split('/'));
					dest.path = join(dest.path, filename);
				}
				if (!dest.isdrive) dest.path = join(config.fs, dest.path);
				if (!src.isdrive) src.path = join(config.fs, src.path);
				const destFile = destStorage.createWriteStream(dest.path);
				srcStorage.createReadStream(src.path).pipe(destFile);
			} else {
				if (dest.path.endsWith('/')) {
					const dirname = src.path.split('/').reverse()[src.path.endsWith('/') ? 1 : 0];
					dest.path = join(dest.path, dirname);
				} else {
					let dirname = '';
					if (!src.path.endsWith('/')) dirname = src.path.split('/').reverse()[0];
					dest.path = join(dest.path, dirname);
				}
				// emitter.log('dest.path new', dest.path);
				const items = await srcDrive.$readDir(src.path, {
					dest: dest.path,
					drive: src.drive,
					isdrive: src.isdrive
				});
				// emitter.log('ITEMS', items);
				await destDrive[makeDir](dest.path);
				await destDrive[writeDir](items, dest.path, src);
			}
			if (!dest.isdrive) emitter.broadcast('storage-updated', 'fs');
			// emitter.log(colors.green('\t✓ exported drive:' + src.path + ' to fs:' + dest.path));
			// return '✓ exported drive:' + src.path + ' to fs:' + join('', dest.path);
		});
	}
}
