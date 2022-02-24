import colors from 'colors';
import fileType from 'file-type';
import child_process from 'child_process';
import _ from 'lodash-es';
import mime from 'mime';
import Path from 'path';
import fs from 'fs';
import type { ReadStream } from 'fs';
import axios from 'axios';
import type { Canceler } from 'axios';
import type { Emitter, API } from './state';
import { Settings, setSettings } from './settings.js';

mime.define({ 'text/python': ['py'] });
export { mime };
export const debounce = (fn, delay = 500) => {
	let timeout;
	return (...args) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			fn(...args);
		}, delay);
	};
};

export const handleError = (fn: (...args) => void, emitter) => {
	return (...args) => {
		try {
			return fn(...args);
		} catch (error) {
			emitter.broadcast('notify-danger', error.message);
			emitter.log(colors.red('handleError:'), colors.red(error.stack));
		}
	};
};

export const execChildProcess: (command: string) => Promise<string> = async (command) => {
	return new Promise((resolve, reject) => {
		child_process.exec(command, (err, res) => {
			if (err) return reject(err);
			else return resolve(res);
		});
	});
};

interface SpawnChildProcessOptions {
	shell?: boolean;
	log?: boolean;
	emitter?: any;
	stdin?: ReadStream;
	broadcast?: boolean;
	kwargs?: Record<string, any>;
}
type SpawnChildProcess = (
	command: string,
	SpawnChildProcessOptions?
) => Promise<{ msg: string; data: string; errors: string }>;

export const spawnChildProcess: SpawnChildProcess = async (
	command,
	{ shell = false, emitter, stdin, broadcast = true, ...kwargs } = {}
) => {
	return new Promise((resolve, reject) => {
		const [cm, ...cms] = command
			.split(' ')
			.filter((i) => i)
			.map((i) => i.replace(/^['"]|['"]$/g, ''));
		//@ts-ignore
		if (shell) command = [command];
		else {
			//@ts-ignore
			command = [cm, cms];
		}
		//@ts-ignore
		const child = child_process.spawn(...command, { ...kwargs, shell });
		if (emitter) emitter.log(...command);
		if (emitter) emitter.emit('child-process:spawn', { cm, pid: child.pid, broadcast });

		let data = '';
		let errors = '';

		(child.stdout as { on }).on('data', (_data) => {
			data += _data;
			if (emitter)
				emitter.emit(`child-process:data`, { cm, pid: child.pid, data: _data, broadcast });
		});

		(child.stderr as { on }).on('data', (error) => {
			errors += error;
			if (emitter) {
				emitter.emit('child-process:error', { cm, pid: child.pid, error, broadcast });
				// emitter.log(colors.red(error.toString('hex')));
			}
		});
		if (stdin) {
			stdin.on('error', (err) => {
				if (emitter) {
					emitter.broadcast('notify-danger', err.message);
					emitter.log(colors.red(err.message));
				}
				// emitter.emit('child-process:kill', child.pid);
				child.kill();
			});
			stdin.pipe(child.stdin);
		}

		child.on('exit', function (code, signal) {
			const msg = `child_process:${cm}::pid:${child.pid} exited code:${code}::signal:${signal}`;
			if (code) {
				reject({ msg, data, errors });
			} else resolve({ msg, data, errors });
			if (emitter) emitter.emit('child-process:exit', { pid: child.pid, msg, broadcast });
		});
	});
};
export const getRandomStr = () => {
	return Math.floor(2147483648 * Math.random()).toString(36);
};

export const getFileType = async ({ path, drive }, emitter?) => {
	let ctype = mime.getType(Path.extname(path));
	if (['application/octet-stream', 'item/mp2t'].includes(ctype) || !ctype) {
		try {
			const stream = await drive.createReadStream(path, {
				start: 0,
				end: 100
			});
			const { data } = await spawnChildProcess('file --mime-type -', {
				broadcast: false,
				emitter,
				stdin: stream
			});
			ctype = _.last(data.split(':')).trim();
		} catch (error) {}
	}
	return ctype;
};

export const getDriveFileType = async (stream) => {
	let _type = (await fileType.fromStream(stream))?.mime;
	return _type;
};

export const toQueryString = async (obj = {}) => {
	let queryString = '';
	try {
		return Object.entries(obj)
			.reduce((q, arr) => `${q}&${arr.join('=')}`, queryString)
			.replace(/^&/, '?');
	} catch (_) {
		return queryString;
	}
};
export const checkFilename = (files: string[], filename: string) => {
	if (files.length == 0) return filename;
	let [name, ext = ''] = filename.split('.');
	if (ext) ext = '.' + ext;
	const regex = RegExp(`${_.escapeRegExp(name)}(\\s\\([0-9]+\\))?${_.escapeRegExp(ext)}`);
	files = files.filter((file) => file.match(regex));
	if (files.length == 0) return filename;
	if (!files.includes(filename)) return filename;
	if (files.length == 1) return `${name} (1)${ext}`;
	return `${name} (${
		Number(
			_.max(files.map((file) => /.+\((?<num>[0-9]+)\)(\.[\w]+)?$/.exec(file)?.groups?.num || 0))
		) + 1
	})${ext}`;
};
export class Downloader {
	emitter: Emitter;
	api: API;
	iterationCount = 0;
	max: number;
	constructor(emitter: Emitter, api, max = 0) {
		this.emitter = emitter;
		this.api = api;
		this.max = max;
	}
	pending: Array<{ url: string; filename: string; dkey?: string; path: string }> = [];
	downloading: Array<{ url: string; canceler: Canceler }> = [];

	private next() {
		const item = this.pending.shift();

		if (item) {
			this._download(item).catch((error) => {
				this.emitter.broadcast('url-download-error', { url: item.url });
				this.downloadEnd(item.url);
				console.log('download error', error);
			});
			this.iterationCount++;
			console.log('starting download of =>', item);
		}
		return { item, total: this.iterationCount };
	}

	async download(item: { url: string; dkey?: string; filename: string; path: string }) {
		if (item) this.pending.push(item);
		if (this.downloading.length <= this.max) {
			this.next();
		}
	}
	async downloadEnd(url) {
		this.downloading = this.downloading.filter((item) => item.url != url);
		this.download(undefined);
	}

	private async _download({
		url,
		dkey,
		path,
		filename = ''
	}: {
		url: string;
		dkey?: string;
		filename: string;
		path: string;
	}) {
		const cancelToken = axios.CancelToken.source();

		//start download
		this.downloading.push({ url, canceler: cancelToken.cancel });
		console.log({ url, canceler: cancelToken.cancel });

		const response = await axios({
			url,
			method: 'GET',
			onDownloadProgress: ({ loaded, total }) => {
				this.emitter.broadcast('url-download-progress', { url, progress: (loaded / total) * 100 });
			},
			responseType: 'stream',
			cancelToken: cancelToken.token
		});
		console.log('response success', response);
		let writer;
		let addExt;
		if (!filename) {
			filename =
				response.headers['x-filename'] ||
				decodeURIComponent(Path.basename(url.replace(/(\?.*)|(https?:\/\/)/g, ''))) ||
				getRandomStr();
			if (Path.extname(filename) != '.' + mime.getExtension(response.headers['content-type']))
				addExt = true;
			console.log(
				Path.extname(filename),
				mime.getExtension(response.headers['content-type']),
				addExt
			);
		}
		if (!Path.extname(filename) || addExt) {
			filename = filename + '.' + mime.getExtension(response.headers['content-type']);
		}
		if (dkey != 'fs') {
			const drive = this.api.drives.get(dkey);
			if (drive) {
				filename = checkFilename(await drive.promises.readdir(path), filename);
				writer = drive?.createWriteStream(Path.join(path, filename));
			}
		} else {
			filename = checkFilename(fs.readdirSync(Path.join(Settings().fs, path)), filename);
			writer = fs.createWriteStream(Path.join(Settings().fs, path, filename));
		}
		if (!writer) {
			this.emitter.broadcast('url-download-error', { url });
			console.log('no writer');
			this.downloadEnd(url);
			return;
		}
		response.data.pipe(writer);
		console.log('starting', { url, cancel: cancelToken.cancel });

		new Promise((resolve, reject) => {
			writer.on('finish', () => {
				this.emitter.broadcast('url-download-ended', { url });
				resolve(url);
			});
			writer.on('error', () => {
				this.emitter.broadcast('url-download-error', { url });
				resolve(url);
			});
		});
		this.downloadEnd(url);
	}
}
