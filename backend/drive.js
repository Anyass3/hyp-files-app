import chalk from 'chalk';
import lodash from 'lodash';
import hyperdrive from 'hyperdrive';
import fs from 'fs';
import { emitter } from './utils.js';
import path from 'path';
import { Settings } from './settings.js';

export default class {
	constructor(store, dkey = null) {
		console.log(chalk.cyan('setting up drive'));
		this.drive = hyperdrive(store, dkey);
	}
	async ready() {
		await this.drive.promises.ready();

		emitter.emit('drive key', this.drive.key.toString('hex'));

		console.log(chalk.gray('drive key ' + this.drive.key.toString('hex'))); // the drive's public key, used to identify it
		// console.log('    Discovery Key:', this.drive.discoveryKey.toString('hex')); // the drive's discovery key for the DHT
		console.log(chalk.gray('Drive Writable: ' + this.drive.writable)); // do we possess the private key of this drive?
		return this;
	}
	get key() {
		return this.drive?.key?.toString?.('hex');
	}
	get writable() {
		return this.drive.writable;
	}

	async readDir(dir, { desc = '/', isdrive = true } = {}) {
		let items;
		if (isdrive) items = await this.drive.promises.readdir(dir);
		else items = fs.readdirSync(dir);
		return items.map((item) => ({
			name: item,
			path: path.join(dir, item),
			new_path: desc.endsWith('/')
				? path.join(lodash.last(dir.split('/')) || '/', item)
				: '/' + item
		}));
	}
	async readAllDirFiles(drive_src, desc = '/') {
		let files = [];
		let dirList;
		if (typeof drive_src === 'string') dirList = await this.readDir(drive_src, { desc });
		else dirList = drive_src;
		for (let item of dirList) {
			const isdir = (await this.drive.promises.stat(item.path)).isDirectory();
			const _desc = path.join(desc, item.new_path);
			if (isdir) {
				const items = await this.readDir(item.path);
				if (items.length) files = [...files, ...(await this.readAllDirFiles(item.path, desc))];
			} else {
				files = [...files, _desc];
			}
		}
		return files;
	}
	async fsMakeDir(desc) {
		if (!fs.existsSync(path.resolve(desc))) fs.mkdirSync(path.resolve(desc));
	}
	async driveMakeDir(dir) {
		const exists = await this.drive.promises.exists(dir);
		if (!exists) await this.drive.promises.mkdir(dir);
	}
	async fsWriteDir(dirList, fs_desc) {
		for (let item of dirList) {
			const isdir = (await this.drive.promises.stat(item.path)).isDirectory();
			const _fs_desc = path.resolve(path.join(Settings().export || '', fs_desc, item.new_path));
			if (isdir) {
				await this.fsMakeDir(_fs_desc);
				const items = await this.readDir(item.path);
				if (items.length) await this.fsWriteDir(items, fs_desc);
			} else {
				const descFile = fs.createWriteStream(_fs_desc);
				this.drive.createReadStream(item.path).pipe(descFile);
			}
		}
	}
	async driveWriteDir(dirList, drive_desc) {
		for (let item of dirList) {
			const isdir = fs.statSync(item.path).isDirectory();
			const _drive_desc = path.join(drive_desc, item.new_path);
			if (isdir) {
				await this.driveMakeDir(_drive_desc);
				const items = await this.readDir(item.path, { isdrive: false });
				if (items.length) await this.driveWriteDir(items, drive_desc);
			} else {
				const descFile = this.drive.createWriteStream(_drive_desc);
				fs.createReadStream(item.path).pipe(descFile);
			}
		}
	}

	// GRUD
	async list(dir = '/', recursive = false) {
		let list = await this.drive.promises.readdir(dir, { recursive, includeStats: true });
		list = list.map((item) => ({
			name: item.name,
			path: path.join(dir, item.name),
			stat: { isFile: item.stat.isFile(), size: item.stat.size }
		}));
		console.log('\tListing:', list);
		return list;
	}
	async listAllFiles(dir = '/') {
		let list = await this.list(dir, true);
		list = list.filter((item) => item.stat.isFile);
		return list.map((item) => item.path);
	}
	async listfs(dir = '/') {
		let list = fs.readdirSync(dir);
		list = list.map((item) => {
			const _path = path.join(dir, item);
			const stat = fs.statSync(_path);
			return {
				name: item,
				path: _path,
				stat: { isFile: stat.isFile(), size: stat.size }
			};
		});
		console.log('\tListing:', list);
		return list;
	}
	async write(file, ...content) {
		await this.drive.promises.writeFile(file, content.join(' '));
		const message = '✓ written ' + file;
		console.log(chalk.green('\t' + message));
		return message;
	}
	async put(...args) {
		await this.write(...args);
	}
	async read(file, endcoding) {
		const content = await this.drive.promises.readFile(file, endcoding);
		console.log('\tContent:', content);
		return content;
	}
	async download(...dirs) {
		if (dirs.length === 0) {
			await this.drive.promises.download('/');
			console.log(chalk.green('\t downloaded all '));
			return 'downloaded all';
		} else
			for (let dir of dirs) {
				await this.drive.promises.download(dir);
				console.log(chalk.green('\t downloaded: ' + dir));
			}
		return 'downloaded' + dirs.join(', ');
	}
	async makedir(...dirs) {
		for (let dir of dirs) {
			await this.drive.promises.mkdir(dir);
			console.log(chalk.green('\t✓ makedir ' + dir));
		}
		return 'downloaded' + dirs.join(', ');
	}
	async copy(source, desc) {
		this.drive.createReadStream(source).pipe(this.drive.createWriteStream(desc));
		console.log(chalk.green('\t copied: ' + source + ' ' + desc));
		return 'copied: ' + source + ' ' + desc;
	}
	async removedir(...dirs) {
		//neeeds_work
		for (let dir of dirs) {
			await this.drive.promises.rmdir(dir, { recursive: true });
			console.log(chalk.green('\t✓ removed dir ' + dir));
		}
		return '✓ removed dir ' + dirs.join(', ');
	}
	async remove(...files) {
		for (let file of files) {
			await this.drive.promises.unlink(file); // delete the copy
			console.log(chalk.green('\t✓ rm ' + file));
		}
		return '✓ removed ' + files.join(', ');
	}
	async export(drive_src = './', fs_desc = './') {
		const isFile = (await this.drive.promises.stat(drive_src)).isFile();
		if (isFile) {
			if (fs_desc.endsWith('/') || fs_desc === '.') {
				const filename = lodash.last(drive_src.split('/'));
				fs_desc = path.join(fs_desc, filename);
			}
			const descFile = fs.createWriteStream(path.resolve(fs_desc));
			this.drive.createReadStream(drive_src).pipe(descFile);
		} else {
			const items = await this.readDir(drive_src, { desc: fs_desc });
			await this.fsMakeDir(fs_desc);
			await this.fsWriteDir(items, fs_desc);
		}
		console.log(chalk.green('\t✓ exported drive:' + drive_src + ' to fs:' + fs_desc));
		return (
			'✓ exported drive:' + drive_src + ' to fs:' + path.join(Settings().export || '', fs_desc)
		);
	}
	async import(fs_src = './', drive_desc = './') {
		const isFile = fs.statSync(fs_src).isFile();
		if (isFile) {
			if (drive_desc.endsWith('/') || drive_desc === '.') {
				const filename = lodash.last(fs_src.split('/'));
				drive_desc = path.join(drive_desc, filename);
			}
			const descFile = this.drive.createWriteStream(drive_desc);
			fs.createReadStream(fs_src).pipe(descFile);
		} else {
			const items = await this.readDir(fs_src, { desc: drive_desc, isdrive: false });
			await this.driveMakeDir(drive_desc);
			await this.driveWriteDir(items, drive_desc);
		}
		console.log(chalk.green('\t✓ imported fs:' + fs_src + ' to drive:' + drive_desc));
		return '✓ imported fs:' + fs_src + ' to drive:' + drive_desc;
	}
}
