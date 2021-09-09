import colors from 'colors';
import readChunk from 'read-chunk';
import fileType from 'file-type';
import child_process from 'child_process';
import mime from 'mime-types';
import { extname } from 'path';

export const debounce = (fn, delay = 500) => {
	let timeout;
	return (...args) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			fn(...args);
		}, delay);
	};
};

export const handleError = (fn, emitter) => {
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
export const spawnChildProcess = async (
	command,
	{ shell = false, log = false, emitter = null, ...kwargs } = {}
) => {
	return new Promise((resolve, reject) => {
		const [cm, ...cms] = command
			.split(' ')
			.filter((i) => i)
			.map((i) => i.replace(/^['"]|['"]$/g, ''));
		if (shell) command = [command];
		else {
			command = [cm, cms];
		}
		//@ts-ignore
		const child = child_process.spawn(...command, { ...kwargs, shell });
		if (log) console.log(child.pid);
		if (emitter) emitter.emit('child-process:spawn', cm, child.pid);
		(child.stdout as { on }).on('data', (data) => {
			if (log) console.log(`data:${cm}\n${data}`);
			if (emitter) emitter.emit(`child-process:data`, cm, child.pid, data);
		});
		(child.stderr as { on }).on('data', (data) => {
			if (log) console.error(`error:${cm}\n${data}`);
			if (emitter) emitter.emit('child-process:error', cm, child.pid, data);
		});
		child.on('exit', function (code, signal) {
			const msg = `child_process:${cm}::pid:${child.pid} exited code:${code}::signal:${signal}`;
			if (code) {
				reject(msg);
			} else resolve(msg);
			if (log) console.log(msg);
			if (emitter) emitter.emit('child-process:exit', child.pid, msg);
		});
	});
};
export const getRandomStr = () => {
	return Math.floor(2147483648 * Math.random()).toString(36);
};

export const getFileType = async (path) => {
	const buffer = readChunk.sync(path, 0, 4100);
	let _type = (await fileType.fromBuffer(buffer))?.mime;
	if (!_type) {
		const res = await execChildProcess(`"file" "${path}"`);
		const typeOfFile = res?.replace('\n', '')?.split?.(':')?.[1] || '';
		//@ts-ignore
		if (typeOfFile.includes('text')) _type = 'plain/text';
	}
	if (!_type) _type = mime.lookup(extname(path));
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
