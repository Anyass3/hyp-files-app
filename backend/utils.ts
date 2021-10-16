import colors from 'colors';
import readChunk from 'read-chunk';
import fileType from 'file-type';
import child_process from 'child_process';
import _ from 'lodash-es';
import mime from 'mime';
import { extname, join } from 'path';
import type { ReadStream } from 'fs';

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
	let ctype = mime.lookup(extname(path));
	if (['application/octet-stream', 'video/mp2t'].includes(ctype) || !ctype) {
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
