import Path from 'path';
import archiver from 'archiver';
import bodyParser from 'body-parser';
import {
	execChildProcess,
	getDriveFileType,
	getFileType,
	handleError,
	spawnChildProcess,
	mime
} from './utils.js';
import { getEmitter, makeApi } from './state.js';
import fs from 'fs';
import cors from 'cors';
import colors from 'colors';
import compression from 'compression';
import { Settings } from './settings.js';
import _ from 'lodash';

const config = Settings();
const emitter = getEmitter();

const showError = (storage: string, mediaPath: string) => {
	emitter.broadcast('notify-danger', storage + '::' + mediaPath + '::media-path do not exist');
	emitter.log(colors.red(storage + '::' + mediaPath + '::media-path do not exist'));
};

export default async function (app, api = makeApi()) {
	// ROUTES

	app.use(bodyParser.json());
	app.use(compression());
	app.use(cors());
	app.get('/test', (reg, res) => {
		const query = reg.query;
		console.log(query, query.val);
		res.send(query.val);
	});

	app.post('/get-file-type', async function (req, res) {
		let storage = req?.body?.storage; //drive || fs
		const filePath = decodeURIComponent(req.body.path);
		const dkey = req?.body?.dkey;
		if (!storage) storage = dkey?.match(/[a-z0-9]{64}/) ? 'drive' : 'fs';
		let ctype = mime.lookup(Path.extname(filePath));
		const drive = api.drives.get(dkey);
		if (ctype === 'application/octet-stream' || !ctype) {
			const stream = await (storage === 'fs' ? fs : drive).createReadStream(
				Path.join(storage === 'fs' ? config.fs : '', filePath),
				{
					start: 0,
					end: 100
				}
			);
			const { data } = await spawnChildProcess('file --mime-type -', {
				broadcast: false,
				emitter,
				stdin: stream
			});
			ctype = _.last(data.split(':')).trim();
		}
		res.send({ ctype });
		console.log('/get-file-type', { ctype, storage, path: filePath, dkey });
	});

	app.get('/download', async (req, res) => {
		const size = req.query.size;
		const type = req.query.type;
		const storage = req.query.storage || 'fs'; //drive || fs
		const path = decodeURIComponent(req.query.path);
		const dkey = req.query.dkey;
		emitter.log('download', { size, path, storage, type, dkey });
		const drive = api.drives.get(dkey);
		const filename = path.split('/').reverse()[0];

		if (storage === 'fs') {
			if (!fs.existsSync(Path.join(config.fs, path))) {
				showError(storage, path);
				res.status(404).end();
				return;
			}
		} else {
			if (!drive || !(drive && (await drive.promises.exists(path)))) {
				showError(storage, path);
				res.status(404).end();
				return;
			}
		}
		res.setHeader('Content-Length', size);

		if (type === 'file') {
			try {
				res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
			} catch (error) {
				emitter.broadcast('notify-danger', error.message);
			}
			if (storage === 'fs') {
				fs.createReadStream(Path.join(config.fs, path)).pipe(res);
			} else {
				drive.createReadStream(path).pipe(res);
			}
		} else if (type === 'dir') {
			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Disposition', `attachment; filename=${filename}.zip`);
			const zip = archiver('zip', {
				zlib: { level: 9 } // Sets the compression level.
			});
			if (storage === 'fs') {
				zip.directory(Path.join(config.fs, path), '/', { name: filename });
			} else {
				const files = await drive.$listAllFiles(path);
				for (const name of files) {
					zip.append(await drive.$read(name), { name });
				}
			}
			zip.pipe(res);
			zip.finalize();
		}
	});
	app.get('/file', async function (req, res) {
		let fileSize: string | number = req.query.size;
		const _path = req.query.path;
		let filePath;
		if (_.isArray(_path)) filePath = Path.join(..._path.map((pth) => decodeURIComponent(pth)));
		else filePath = decodeURIComponent(_path);
		const ctype: string = req.query.ctype || mime.lookup(filePath);
		const storage: string = req.query.storage || 'fs'; //drive || fs
		const dkey: string = req.query.dkey;

		emitter.log('/file', {
			path: filePath,
			fileSize,
			ctype
		});

		res.setHeader('Content-Type', ctype);
		if (storage === 'fs') {
			if (!fs.existsSync(Path.join(config.fs, filePath))) {
				showError(storage, filePath);
				res.status(404).end();
				return;
			}
			if (!fileSize) {
				fileSize = fs.statSync(Path.join(config.fs, filePath)).size;
			}
			res.setHeader('Content-Length', fileSize);
			fs.createReadStream(Path.join(config.fs, filePath));
		} else {
			const drive = api.drives.get(dkey);

			if (!drive || !(drive && (await drive.promises.exists(filePath)))) {
				showError(storage, filePath);
				res.status(404).end();
				return;
			}

			if (!fileSize) {
				const stats = await drive.promises.stat(filePath);
				fileSize = stats.size;
			}

			res.setHeader('Content-Length', fileSize);
			drive.createReadStream(filePath).pipe(res);
		}
	});
	app.post('/mpv_stream', async (req, res) => {
		const command = 'mpv ' + req.body.url;
		spawnChildProcess(command, { emitter }).catch((err) => {
			emitter.log(err);
			emitter.broadcast(err);
		});
		res.status(200).end();
	});
	app.get('/media', async (req, res) => {
		const mediaSize: number = req.query.size;
		const ctype: string = req.query.ctype;
		const storage: string = req.query.storage || 'fs'; //drive || fs
		const mediaPath: string = Path.join(
			storage === 'fs' ? config.fs : '',
			decodeURIComponent(req.query.path)
		);
		const dkey = req.query.dkey;
		const range = req.headers.range;

		const drive = api.drives.get(dkey);

		emitter.log('/media', { mediaSize, ctype, range, storage });

		if (!range) {
			//in case there's no range header
			emitter.log('NO Range Header');
			res.status(416).end('Wrong range');
			return;
		}

		let ranges = range.replace(/bytes=/, '').split('-');
		// range: "bytes=32324-"
		const CHUNK_SIZE = 5024;
		const start = Number(ranges[0]);
		const end = Math.min(Number(ranges[1]) || start + CHUNK_SIZE, mediaSize - 1);

		emitter.log(`media chunks => ${start}::${end}`);

		const contentLength = end - start + 1;
		const headers = {
			'Content-Range': `bytes ${start}-${end}/${mediaSize}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': contentLength,
			'Content-Type': ctype
		};

		// Partial Content
		res.writeHead(206, headers);

		const stream = (storage === 'fs' ? fs : drive).createReadStream(mediaPath, { start, end });

		stream.on('open', () => {
			stream.pipe(res);
		});

		stream.on('error', (err) => {
			showError(storage, mediaPath);
			return res.end(err);
		});
	});
}
