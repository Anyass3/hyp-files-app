import chalk from 'chalk';
import lodash from 'lodash';
import hyperdrive from 'hyperdrive';
import fs from 'fs';
import { getEmitter } from './state.js';
import path from 'path';
import { handleError } from './utils.js';
import { Settings } from './settings.js';

const config = Settings();

export default class extends hyperdrive {
	constructor(store, dkey = null) {
		super(store, dkey);
		console.log(chalk.cyan('setting up drive'));
		this.emitter = getEmitter();
		// this.emitter.broadcast('notify-info', 'greeting from drive');
	}
	async check(fn) {
		return await handleError(fn, this.emitter)();
	}
	async $ready(name) {
		await this.check(async () => {
			await this.promises.ready();

			this.emitter.emit('drive key', this.$key);

			// console.log(chalk.gray('drive key ' + this.$key)); // the drive's public key, used to identify it
			// console.log(chalk.gray('Discovery Key:' + this.discoveryKey.toString('hex'))); // the drive's discovery key for the DHT
			// console.log(chalk.gray('Drive Writable: ' + this.writable)); // do we possess the private key of this drive?

			console.log(chalk.gray(`${name || ''} drive metadata: `), this.metadata); // do we possess the private key of this drive?

			// this.emitter.broadcast('notify-info', 'drive is ready');
		});
		return this;
	}
	get $key() {
		return this?.key?.toString?.('hex');
	}
	async $readDir(dir, { dest = '/', isdrive = true, drive } = {}) {
		return await this.check(async () => {
			let items;
			if (drive || isdrive) {
				// console.log('readdir is drive');
				items = await (drive || this).promises.readdir(dir);

				// console.log('readdir is drive and items', items);
			} else {
				// console.log('readdir is fs');
				items = fs.readdirSync(path.join(config.fs, dir));
			}
			console.log('readdir-dest', dest);
			return items.map((item) => ({
				name: item,
				path: path.join(dir, item),
				new_path: path.join(dest, item)
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
				const _dest = path.join(dest, item.new_path);
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
			if (!fs.existsSync(path.resolve(path.join(config.fs, dest))))
				fs.mkdirSync(path.resolve(path.join(config.fs, dest)));
		});
	}
	async $driveMakeDir(dir) {
		return await this.check(async () => {
			const exists = await this.promises.exists(dir);
			if (!exists) {
				await this.promises.mkdir(dir);
				console.log('in drivemakedir', dir);
			}
		});
	}

	async $fsWriteDir(dirList, fs_dest, { drive }) {
		await this.check(async () => {
			for (let item of dirList) {
				const isdir = drive
					? (await drive.promises.stat(item.path)).isDirectory()
					: fs.statSync(path.join(config.fs, item.path)).isDirectory();
				if (isdir) {
					await this.$fsMakeDir(item.new_path);
					const items = await this.$readDir(item.path, {
						dest: item.new_path,
						drive,
						isdrive: !!drive
					});
					console.log(items);
					if (items.length) await this.$fsWriteDir(items, fs_dest, { drive });
				} else {
					await this.$fsMakeDir(item.new_path.split('/')[0]);
					const destFile = fs.createWriteStream(path.join(config.fs, item.new_path));
					if (drive) drive.createReadStream(item.path).pipe(destFile);
					else fs.createReadStream(path.join(config.fs, item.path)).pipe(destFile);
				}
			}
		});
	}
	async $driveWriteDir(dirList, dest, { drive, isdrive }) {
		await this.check(async () => {
			for (let item of dirList) {
				const isdir = isdrive
					? (await drive.promises.stat(item.path)).isDirectory()
					: fs.statSync(path.join(config.fs, item.path)).isDirectory();
				if (isdir) {
					await this.$driveMakeDir(item.new_path);
					console.log('drive=>', !!drive);
					const items = await this.$readDir(item.path, {
						drive,
						dest: item.new_path,
						isdrive: !!drive
					});
					// console.log('items in drivewritedir', items, dest);
					if (items?.length) await this.$driveWriteDir(items, dest, { drive, isdrive });
				} else {
					await this.$driveMakeDir(item.new_path.split('/')[0]);
					const destFile = this.createWriteStream(item.new_path);
					// console.log('b4 read stream');
					if (drive) drive.createReadStream(item.path).pipe(destFile);
					else fs.createReadStream(path.join(config.fs, item.path)).pipe(destFile);
				}
			}
		});
	}

	// GRUD
	async $list(dir = '/', recursive = false) {
		return await this.check(async () => {
			// console.log('in list', dir);
			let list = await this.promises.readdir(dir, { recursive, includeStats: true });
			list = list.map((item) => ({
				name: item.name,
				path: path.join(dir, item.name),
				stat: { isFile: item.stat.isFile(), size: item.stat.size }
			}));
			// console.log('\tListing:', list);
			return list;
		});
	}
	async $listAllFiles(dir = '/') {
		return await this.check(async () => {
			let list = await this.$list(dir, true);
			list = list.filter((item) => item.stat.isFile);
			return list.map((item) => item.path);
		});
	}
	async $listAllDirs(dir = '/') {
		return await this.check(async () => {
			let list = await this.$list(dir, true);
			list = list.filter((item) => !item.stat.isFile);
			return list.map((item) => item.path);
		});
	}
	async $listfs(dir = '/') {
		dir = path.join(config.fs, dir);
		return await this.check(async () => {
			let list = fs.readdirSync(dir);
			list = list.map((item) => {
				const _path = path.join(dir, item);
				const stat = fs.statSync(_path);
				return {
					name: item,
					path: _path.replace(config.fs, ''),
					stat: { isFile: stat.isFile(), size: stat.size }
				};
			});
			console.log('\tListing:', list);
			return list;
		});
	}
	async $write(file, ...content) {
		return await this.check(async () => {
			await this.promises.writeFile(file, content.join(' '));
			const message = '✓ written ' + file;
			console.log(chalk.green('\t' + message));
		});
	}
	async $put(...args) {
		return await this.check(async () => {
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
				console.log(chalk.green('\t downloaded all '));
				return 'downloaded all';
			} else
				for (let dir of dirs) {
					await this.promises.download(dir);
					console.log(chalk.green('\t downloaded: ' + dir));
				}
			return 'downloaded' + dirs.join(', ');
		});
	}
	async $makedir(...dirs) {
		return await this.check(async () => {
			for (let dir of dirs) {
				await this.promises.mkdir(dir);
				console.log(chalk.green('\t✓ makedir ' + dir));
			}
		});
	}
	async $copy(source, dest) {
		return await this.check(async () => {
			this.createReadStream(source).pipe(this.createWriteStream(dest));
			console.log(chalk.green('\t copied: ' + source + ' ' + dest));
			return 'copied: ' + source + ' ' + dest;
		});
	}
	async $removedir(...dirs) {
		return await this.check(async () => {
			//neeeds_work
			for (let dir of dirs) {
				const files = await this.$listAllFiles(dir);
				console.log('files', files);
				await this.$remove(...files);
				const dirs = await this.$listAllDirs(dir);
				console.log('dirs', dirs);
				for (let dir of dirs.reverse()) {
					//deleting the now empty directories
					await this.promises.rmdir(dir);
				}
				if (await this.promises.exists(dir)) await this.promises.rmdir(dir);
				console.log(chalk.green('\t✓ removed dir ' + dir));
			}
			return '✓ removed dir ' + dirs.join(', ');
		});
	}
	async $remove(...files) {
		return await this.check(async () => {
			for (let file of files) {
				await this.promises.unlink(file); // delete the copy
				console.log(chalk.green('\t✓ rm ' + file));
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
			console.log('dest.isdrive', dest.isdrive);
			console.log('src.isdrive', src.isdrive, !!src.drive);
			const isFile = (src.isdrive
				? await srcDrive.promises.stat(src.path)
				: fs.statSync(path.join(config.fs, src.path))
			).isFile();
			console.log('isFile', isFile);
			const destStorage = dest.isdrive ? destDrive : fs;
			const srcStorage = src.isdrive ? srcDrive : fs;
			const makeDir = dest.isdrive ? '$driveMakeDir' : '$fsMakeDir';
			const writeDir = dest.isdrive ? '$driveWriteDir' : '$fsWriteDir';
			if (isFile) {
				if (dest.path.endsWith('/') || dest.path === '.') {
					const filename = lodash.last(src.path.split('/'));
					dest.path = path.join(dest.path, filename);
				}
				if (!dest.isdrive) dest.path = path.join(config.fs, dest.path);
				if (!src.isdrive) src.path = path.join(config.fs, src.path);
				const destFile = destStorage.createWriteStream(dest.path);
				srcStorage.createReadStream(src.path).pipe(destFile);
			} else {
				if (dest.path.endsWith('/')) {
					const dirname = src.path.split('/').reverse()[src.path.endsWith('/') ? 1 : 0];
					dest.path = path.join(dest.path, dirname);
				} else {
					let dirname = '';
					if (!src.path.endsWith('/')) dirname = src.path.split('/').reverse()[0];
					dest.path = path.join(dest.path, dirname);
				}
				console.log('dest.path new', dest.path);
				const items = await srcDrive.$readDir(src.path, {
					dest: dest.path,
					drive: src.drive,
					isdrive: src.isdrive
				});
				console.log('ITEMS', items);
				await destDrive[makeDir](dest.path);
				await destDrive[writeDir](items, dest.path, src);
			}
			if (!dest.isdrive) this.emitter.broadcast('storage-updated', 'fs');
			// console.log(chalk.green('\t✓ exported drive:' + src.path + ' to fs:' + dest.path));
			// return '✓ exported drive:' + src.path + ' to fs:' + path.join('', dest.path);
		});
	}
}
