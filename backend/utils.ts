import colors from 'kleur';
import { fileTypeFromStream } from 'file-type';
import child_process from 'child_process';
import _ from 'lodash-es';
import mime from 'mime';
import Path from 'path';
import fs from 'fs';
import type { ReadStream } from 'fs';
import axios from 'axios';
import type { Canceler } from 'axios';
import type { Emitter, API } from './state';
import { Settings } from './settings.js';
import { Transform } from 'stream';
import { SocksProxyAgent } from 'socks-proxy-agent';

mime.define({ 'text/python': ['py'] });
export { mime };
export const torAgent = new SocksProxyAgent('socks5://127.0.0.1:9050');

export const handleError = <RT extends any>(fn: (...args) => RT, emitter) => {
	return (...args) => {
		try {
			return fn(...args);
		} catch (error: any) {
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
		const child = child_process.spawn(...command, { ...kwargs, shell }) as child_process.ChildProcessWithoutNullStreams;
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
			ctype = _.last(data.split(':'))?.trim();
		} catch (error) { }
	}
	return ctype;
};

export const getDriveFileType = async (stream) => {
	const _type = (await fileTypeFromStream(stream))?.mime;
	return _type;
};

export const toQueryString = async (obj = {}) => {
	const queryString = '';
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
	return `${name} (${Number(
		_.max(files.map((file) => /.+\((?<num>[0-9]+)\)(\.[\w]+)?$/.exec(file)?.groups?.num || 0))
	) + 1
		})${ext}`;
};
export class Downloader {
	emitter: Emitter;
	api: API;
	iterationCount = 0;
	max: number;
	tor: boolean;
	constructor(emitter: Emitter, api, { max = 0, tor = true } = {}) {
		this.emitter = emitter;
		this.api = api;
		this.max = max;
		this.tor = tor;
	}
	pending: Array<{ url: string; filename: string; dkey: string; path: string }> = [];
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

	async download(item?: { url: string; dkey: string; filename: string; path: string }) {
		if (item) {
			if (
				this.pending.find((file) => file.url == item.url) ||
				this.downloading.find((file) => file.url == item.url)
			) {
				this.emitter.broadcast('notify-info', 'already downloading the url');
				return;
			}
			this.pending.push(item);
			this.api.addDownloading(item);
		}
		if (this.downloading.length <= this.max) {
			this.next();
		}
	}
	async downloadEnd(url) {
		this.downloading = this.downloading.filter((item) => item.url != url);
		this.download(undefined);
		this.api.removeDownloading(url);
	}

	private async _download({
		url,
		dkey,
		path,
		filename = ''
	}: {
		url: string;
		dkey: string;
		filename: string;
		path: string;
	}) {
		const cancelToken = axios.CancelToken.source();

		//start download
		this.downloading.push({ url, canceler: cancelToken.cancel });
		console.log({ url, canceler: cancelToken.cancel });
		const httpsAgent = this.tor ? torAgent : undefined;
		const response = await axios({
			url,
			method: 'GET',
			responseType: 'stream',
			cancelToken: cancelToken.token,
			httpsAgent
		});
		console.log('response success', response.headers);

		let writer;
		let addExt;
		if (!filename) {
			filename =
				response.headers['x-filename'] ||
				response.headers['content-disposition']?.split('=')[1] ||
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
		this.api.updateDownloading({ url, filename });

		if (dkey != 'fs') {
			const drive = this.api.drives.get(dkey);
			if (drive) {
				filename = checkFilename(await drive.readdir(path, { nameOnly: true }), filename);
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

		//write stream
		let loaded = 0;
		const filesize = response.headers['content-length'];
		const reportProgress = _.throttle(async () => {
			// console.log('reporting progress', { loaded });
			this.emitter.broadcast('url-download-progress', { url, loaded, total: filesize });
		});
		const streamTransform = new Transform({
			transform(chunk, encoding, callback) {
				loaded += chunk.length;
				if (loaded % 3 == 0)
					reportProgress();
				callback(null, chunk);
			}
		});
		response.data.pipe(streamTransform).pipe(writer);
		console.log('starting', { url, cancel: cancelToken.cancel });

		await new Promise((resolve, reject) => {
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

export function sort(list, { sorting, ordering }) {
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
