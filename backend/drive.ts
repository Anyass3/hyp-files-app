import colors from 'kleur';
import last from 'lodash-es/last.js';
import debounce from 'lodash-es/debounce.js';
import throttle from 'lodash-es/throttle.js';
import hyperdrive from 'hyperdrive';

import fs, { ReadStream, WriteStream } from 'fs';
import { getEmitter } from './state.js';
import { extname, resolve, join } from 'path';
import { handleError, getFileType, mime } from './utils.js';
import { Settings } from './settings.js';

const config = Settings();
const emitter = getEmitter();

interface PathObj {
	isdrive?: boolean;
	path?: string;
	new_path?: string;
	drive?: Hyperdrive;
}

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
	drive.on('peer-open', (peer) => {
		throttledDriveOpenNotify(`${driveName} drive connection opened`);
		emitter.log(colors.cyan('peer-open: ' + driveName), {
			connType: peer.type,
			remotePublicKey: peer.remotePublicKey?.toString?.('hex'),
			remoteAddress: peer.remoteAddress
		});
	});

	drive.watch('/');
}
//@ts-ignore
class Hyperdrive extends hyperdrive {
	constructor(store, dkey = null) {
		super(store, dkey);
		emitter.log(colors.cyan('setting up drive'));
	}
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
		//@ts-ignore
		const result: Promise<Array<any>> = this.check(async () => {
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

		return result;
	}
	async $readAllDirFiles(drive_src, dest = '/') {
		//@ts-ignore
		const result: Promise<Array<any>> = this.check(async () => {
			let files = [];
			let dirList: PathObj[];
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

		return result;
	}
	async $fsMakeDir(dest: string) {
		return await this.check(async () => {
			if (!fs.existsSync(resolve(join(config.fs, dest))))
				fs.mkdirSync(resolve(join(config.fs, dest)));
		});
	}
	async $driveMakeDir(dir: string) {
		return await this.check(async () => {
			const exists = await this.promises.exists(dir);
			if (!exists) {
				await this.promises.mkdir(dir);
				// emitter.log('in drivemakedir', dir);
			}
		});
	}

	async $fsWriteDir(dirList: PathObj[], fs_dest: string, { drive }) {
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
					const destStream: WriteStream = fs.createWriteStream(join(config.fs, item.new_path));
					// emitter.log('b4 read stream');
					const srcStream: ReadStream = drive
						? drive.createReadStream(item.path)
						: fs.createReadStream(join(config.fs, item.path));
					srcStream.pipe(destStream);
					// await new Promise((resolve) => {
					// 	srcStream.on('end', resolve);
					// 	srcStream.on('close', resolve);
					// 	srcStream.on('error', resolve);
					// 	destStream.on('finish', resolve);
					// 	destStream.on('error', resolve);
					// });
					// emitter.broadcast('notify-info', 'copy success ' + last(item.path.split('/')));
				}
			}
		});
	}
	async $driveWriteDir(dirList: PathObj[], dest: string, { drive, isdrive }) {
		await this.check(async () => {
			for (let item of dirList) {
				const isdir = isdrive
					? (await drive.promises.stat(item.path)).isDirectory()
					: fs.statSync(join(config.fs, item.path)).isDirectory();
				if (isdir) {
					await this.$driveMakeDir(item.new_path);
					// emitter.log('drive=>', !!drive);
					const items = await this.$readDir(item.path, {
						drive,
						dest: item.new_path,
						isdrive: !!drive
					});
					// emitter.log('items in drivewritedir', items, dest);
					if (items?.length) await this.$driveWriteDir(items, dest, { drive, isdrive });
				} else {
					await this.$driveMakeDir(item.new_path.split('/')[0]);
					const destStream: WriteStream = this.createWriteStream(item.new_path);
					// emitter.log('b4 read stream');
					const srcStream: ReadStream = drive
						? drive.createReadStream(item.path)
						: fs.createReadStream(join(config.fs, item.path));
					srcStream.pipe(destStream);
					// await new Promise((resolve) => {
					// 	srcStream.on('end', resolve);
					// 	srcStream.on('close', resolve);
					// 	srcStream.on('error', resolve);
					// 	destStream.on('finish', resolve);
					// });
				}
			}
		});
	}
	async $sort(list, { sorting, ordering }) {
		if (sorting === 'name') {
			list.sort((a, b) => {
				return ordering * a.name.localeCompare(b.name);
			});
		} else if (sorting === 'date') {
			list.sort((a, b) => {
				return ordering * (a.stat.mtime - b.stat.mtime);
			});
		} else if (sorting === 'size') {
			list.sort((a, b) => {
				return ordering * (a.stat.size - b.stat.size);
			});
		} else if (sorting === 'type') {
			list.sort((a, b) => {
				let sort = 0;
				if (a.stat.isFile && b.stat.isFile) sort = a.stat.ctype.localeCompare(b.stat.ctype);
				else if (!a.stat.isFile && !b.stat.isFile) a.name.localeCompare(b.name);
				else sort = a.stat.isFile ? 1 : -1;
				return ordering * sort;
			});
		}
		return list;
	}

	// get items
	async $list(
		dir = '/',
		recursive = false,
		{
			offset = 0,
			limit = 100,
			page = 1,
			filter = false,
			show_hidden = true,
			ordering = 1,
			search = '',
			sorting = 'name'
		} = {}
	) {
		// returns both files and dirs
		let total = 0;
		//@ts-ignore
		const result: Promise<Array<any>> = await this.check(async () => {
			// emitter.log('in list', dir);
			// console.log({ page, paginate, show_hidden, limit, offset });
			let list: {
				name: string;
				stat: Record<string, any>;
				path: string;
			}[] = await this.promises.readdir(dir, { recursive, includeStats: true });
			if (filter) {
				if (!show_hidden) list = list.filter((item) => !/^\./.exec(item.name));
				if (search) list = list.filter((item) => item.name.includes(search));
			}
			const self = this;
			list = await Promise.all(
				list.map(async (item) => {
					const stats = await this.promises.stats(item.path);
					const isFile = item.stat.isFile();
					const path = join(dir, item.name).replace(/\\/g, '/');
					return {
						name: item.name,
						path,
						stat: {
							isFile,
							ctype: isFile ? await getFileType({ path, drive: self }) : false,
							mtime: item.stat.mtime,
							...(isFile
								? { size: item.stat.size }
								: {
										items: (await this.promises.readdir(path)).length
								  }),
							offline: stats.blocks === stats.downloadedBlocks
						}
					};
				})
			);
			if (filter) {
				list = await this.$sort(list, { sorting, ordering });
				total = list.length;
				list = list.slice(offset, offset + limit);
			}
			return filter ? { items: list, total, page } : list;
		});
		return result;
	}
	async $listfs(
		dir = '/',
		{
			offset = 0,
			limit = 100,
			page = 1,
			filter = false,
			show_hidden = true,
			ordering = 1,
			search = '',
			sorting = 'type'
		} = {}
	) {
		dir = join(config.fs, dir);
		let total = 0;
		const self = this;
		return await this.check(async () => {
			let list = fs.readdirSync(dir);
			// console.log({ page, paginate, show_hidden, limit, offset });
			// console.log('list', list);
			if (filter) {
				if (!show_hidden) list = list.filter((file) => !/^\./.exec(file));
				if (search) list = list.filter((item) => item.includes(search));
			}

			const getItems = (path) => {
				try {
					return fs.readdirSync(path).length;
				} catch (error) {
					emitter.log(colors.red(error.message));
					return 0;
				}
			};
			//@ts-ignore
			list = await Promise.all(
				list.map(async (item) => {
					let path = join(dir, item);
					const stat = fs.statSync(path);
					path = path.replace(join(config.fs), '').replace(/\\/g, '/');
					if (!path.match(/^[A-Z]:/) && !path.startsWith('/')) path = '/' + path;
					const isFile = stat.isFile();
					return {
						name: item,
						path,
						stat: {
							isFile,
							...(isFile ? { size: stat.size } : { items: getItems(join(config.fs, path)) }),
							ctype: isFile ? await getFileType({ path, drive: fs }) : false,
							mtime: stat.mtime
						}
					};
				})
			);
			if (filter) {
				list = await this.$sort(list, { sorting, ordering });
				total = list.length;
				list = list.slice(offset, offset + limit);
			}
			emitter.log('dir:', list);
			return filter ? { items: list, total, page } : list;
		});
	}
	async $listAllFiles(dir = '/') {
		// returns only files
		//@ts-ignore
		const result: Promise<Array<any>> = await this.check(async () => {
			let list = await this.$list(dir, true);
			list = list.filter((item) => item.stat.isFile);
			return list.map((item) => item.path);
		});
		return result;
	}
	async $listAllDirs(dir = '/') {
		// returns only dir
		//@ts-ignore
		const result: Promise<Array<any>> = this.check(async () => {
			let list = await this.$list(dir, true);
			list = list.filter((item) => !item.stat.isFile);
			return list.map((item) => item.path);
		});

		return result;
	}

	// GRUD
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
	async $read(file, encoding) {
		return await this.check(async () => {
			const content = await this.promises.readFile(file, encoding);
			return content;
		});
	}
	async $download(paths = [], { name = '', ...opts } = {}) {
		if (typeof paths === 'string') paths = [paths];
		return await this.check(async () => {
			if (paths.length === 0) {
				await this.promises.download('/', opts);
				emitter.log(colors.green('\t downloaded all '));
				emitter.broadcast('notify-success', 'Downloaded all files in ' + name + ' drive');
			} else
				for (let path of paths) {
					await this.promises.download(path, opts);
					emitter.emit('rm-offline-pending', this.key, path);
					emitter.log(colors.green('\t downloaded: ' + path));
				}
			emitter.broadcast(
				'notify-success',
				`Downloaded ${paths.map((p) => last(p.split('/'))).join(',')} in ${name} drive`
			);
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
	async $copy(source: string, dest: string) {
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

	async $__copy__(src: PathObj, dest: PathObj) {
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
			const isFile = (
				src.isdrive
					? await srcDrive.promises.stat(src.path)
					: fs.statSync(join(config.fs, src.path))
			).isFile();
			emitter.log('isFile', isFile);
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
				const destStream = destStorage.createWriteStream(dest.path);

				const srcStream = srcStorage.createReadStream(src.path);

				srcStream.on('error', (err) => {
					emitter.broadcast('notify-danger', err.message);
				});
				destStream.on('error', (err) => {
					emitter.broadcast('notify-danger', err.message);
				});
				srcStream.pipe(destStream);
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
				await destDrive[writeDir](items, dest.path, { drive: src.drive, isdrive: src.isdrive });
			}
			if (!dest.isdrive) emitter.broadcast('storage-updated', 'fs');
			// emitter.log(colors.green('\t✓ exported drive:' + src.path + ' to fs:' + dest.path));
			// return '✓ exported drive:' + src.path + ' to fs:' + join('', dest.path);
		});
	}
}

export default Hyperdrive;
