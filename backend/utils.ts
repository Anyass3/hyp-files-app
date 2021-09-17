import colors from 'colors';
import readChunk from 'read-chunk';
import fileType from 'file-type';
import child_process from 'child_process';
import mime from 'mime';
import { extname } from 'path';
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
	return async (...args) => {
		// console.log('handling');
		try {
			// console.log('handling fn');
			return await fn(...args);
		} catch (error) {
			emitter.broadcast('notify-danger', error.message);
			console.log(colors.red('error: handle'), error.stack);
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
	{ shell = false, log = false, emitter, stdin, broadcast = true, ...kwargs } = {}
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
		console.log(...command);
		if (log) console.log(child.pid);
		if (emitter) emitter.emit('child-process:spawn', { cm, pid: child.pid, broadcast });

		let data = '';
		let errors = '';

		(child.stdout as { on }).on('data', (_data) => {
			data += _data;
			if (log) console.log(`data:${cm}\n${_data}`);
			if (emitter)
				emitter.emit(`child-process:data`, { cm, pid: child.pid, data: _data, broadcast });
		});

		(child.stderr as { on }).on('data', (error) => {
			errors += error;
			if (log) console.error(`error:${cm}\n${error}`);
			if (emitter) emitter.emit('child-process:error', { cm, pid: child.pid, error, broadcast });
		});
		if (stdin) {
			stdin.on('error', (err) => {
				console.error(err);
				emitter.broadcast('notify-danger', err.message);
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
			if (log) console.log(msg);
			if (emitter) emitter.emit('child-process:exit', { pid: child.pid, msg, broadcast });
		});
	});
};
export const getRandomStr = () => {
	return Math.floor(2147483648 * Math.random()).toString(36);
};

export const getFileType = async (buffer) => {
	// const buffer = readChunk.sync(path, 0, 4100);
	let _type = await fileType.fromBuffer(buffer);
	// if (!_type) {
	// 	const res = await execChildProcess(`"file" "${path}"`);
	// 	const typeOfFile = res?.replace('\n', '')?.split?.(':')?.[1] || '';
	// 	//@ts-ignore
	// 	if (typeOfFile.includes('text')) _type = 'plain/text';
	// }
	// if (!_type) _type = mime.lookup(extname(path));
	console.log({ _type });
	return _type;
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
