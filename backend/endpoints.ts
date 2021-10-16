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
import { extname, join } from 'path';
import { getEmitter, getApi } from './state.js';
import fs from 'fs';
import cors from 'cors';
import colors from 'colors';
import compression from 'compression';
import { Settings } from './settings.js';
import _ from 'lodash-es';

const config = Settings();
const emitter = getEmitter();
const api = getApi();

const showError = (storage: string, mediaPath: string, message = 'media-path do not exist') => {
	emitter.broadcast(
		'notify-danger',
		storage + '::' + _.last(mediaPath.split('/')) + '::' + message
	);
	emitter.log(colors.red(storage + '::' + mediaPath + '::' + message));
};

export default async function (app) {
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
		const dkey = req?.body?.dkey;
		if (!storage) storage = dkey?.match(/[a-z0-9]{64}/) ? 'drive' : 'fs';
		const path = join(storage === 'fs' ? config.fs : '', decodeURIComponent(req.body.path));
		const drive = storage === 'fs' ? fs : api.drives.get(dkey);

		const ctype = await getFileType({ path, drive }, emitter);

		res.send({ ctype });
		emitter.log('/get-file-type', { ctype, storage, path, dkey });
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
			if (!fs.existsSync(join(config.fs, path))) {
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
				fs.createReadStream(join(config.fs, path)).pipe(res);
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
				zip.directory(join(config.fs, path), '/', { name: filename });
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
		if (_.isArray(_path)) filePath = join(..._path.map((pth) => decodeURIComponent(pth)));
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
			if (!fs.existsSync(join(config.fs, filePath))) {
				showError(storage, filePath);
				res.status(404).end();
				return;
			}
			if (!fileSize) {
				fileSize = fs.statSync(join(config.fs, filePath)).size;
			}
			res.setHeader('Content-Length', fileSize);
			fs.createReadStream(join(config.fs, filePath)).pipe(res);
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
			// emitter.log(err);
			// emitter.broadcast(err);
		});
		res.status(200).end();
	});
	app.get('/media', async (req, res) => {
		let mediaSize: number = req.query.size;
		const ctype: string = req.query.ctype;
		const storage: string = req.query.storage || 'fs'; //drive || fs
		const mediaPath: string = join(
			storage === 'fs' ? config.fs : '',
			decodeURIComponent(req.query.path)
		);
		const dkey = req.query.dkey;
		const range = req.headers.range;

		const drive = api.drives.get(dkey);

		emitter.log('/media', { mediaSize, ctype, range, storage, mediaPath });

		if (!range) {
			//in case there's no range header
			res.status(416).end('Wrong range');
			emitter.log('NO Range Header');
			return;
		}

		if (!mediaSize) {
			try {
				if (storage === 'fs') mediaSize = fs.statSync(join(config.fs, mediaPath)).size;
				else mediaSize = await drive.promises.stat(mediaPath).size;
			} catch (err) {
				showError(storage, mediaPath, err.message);
				return res.end();
			}
		}
		let ranges = range.replace(/bytes=/, '').split('-');

		const CHUNK_SIZE = 512000; //500kb
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
		try {
			const stream = (storage === 'fs' ? fs : drive).createReadStream(mediaPath, { start, end });

			stream.pipe(res);

			stream.on('error', (err) => {
				showError(storage, mediaPath, err.message);
				return res.end();
			});
			return;
		} catch (err) {
			showError(storage, mediaPath, err.message);
			return res.end();
		}
	});
}
