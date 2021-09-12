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

	app.post('/get-file-type', async function (req, res) {
		// console.log('/get-file-type', req?.body);
		let storage = req?.body?.storage; //drive || fs
		const filePath = unescape(req.body.path);
		const fsFilePath = Path.join(config.fs, filePath);
		const dkey = req?.body?.dkey;
		if (!storage) storage = dkey?.match(/[a-z0-9]{64}/) ? 'drive' : 'fs';
		let ctype;
		if (storage === 'fs') ctype = await handleError(getFileType, emitter)(fsFilePath);
		else {
			const drive = api.drives.get(dkey);
			console.log('/get-file-type', dkey, filePath, storage);
			console.log('/get-file-type', drive.$key);
			if (drive) {
				ctype = mime.lookup(Path.extname(filePath));
				// // it's not working
				// if (!ctype) {
				// 	const stream = await drive.createReadStream(filePath, { start: 0, end: 5 });
				// 	ctype = await getDriveFileType(stream);
				// }
			}
		}
		res.send({ ctype });
	});
	app.get('/download', async (req, res) => {
		console.log('/download');
		const size = req.query.size;
		const type = req.query.type;
		const storage = req.query.storage || 'fs'; //drive || fs
		const path = decodeURIComponent(req.query.path);
		const dkey = req.query.dkey;
		// console.log('download', { size, path, storage, type, dkey });
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
		console.log('/file');
		let fileSize: string | number = req.query.size;
		const filePath = Path.join(...decodeURIComponent(req.query.path).split(','));
		const ctype: string = req.query.ctype || mime.lookup(filePath);
		const storage: string = req.query.storage || 'fs'; //drive || fs
		const dkey: string = req.query.dkey;
		console.log({ path: req.query.path, filePath, fileSize, ctype });
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
			fs.createReadStream(Path.join(config.fs, filePath)).pipe(res);
		} else {
			const drive = api.drives.get(dkey);

			if (!drive || !(drive && (await drive.promises.exists(filePath)))) {
				showError(storage, filePath);
				res.status(404).end();
				return;
			}

			if (!fileSize) {
				const stats = await drive.promises.stat(filePath);
				// console.log('stats', stats);
				fileSize = stats.size;
			}
			console.log({ fileSize, filePath });
			res.setHeader('Content-Length', fileSize);
			drive.createReadStream(filePath).pipe(res);
		}
	});
	app.post('/mpv_stream', async (req, res) => {
		const command = 'mpv ' + req.body.url;
		// console.log('commard', command);
		spawnChildProcess(command, { emitter }).catch((err) => {
			emitter.log(err);
			emitter.broadcast(err);
		});
		emitter.on('child-process:spawn', () => {
			res.status(200).end();
		});
	});
	app.get('/media', async (req, res) => {
		// Ensure there is a range given for the media
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
		let storageSys = storage === 'fs' ? fs : drive;

		if (storage === 'fs') {
			if (!fs.existsSync(Path.join(config.fs, mediaPath))) {
				showError(storage, mediaPath);
				res.status(404).end();
				return;
			}
		} else {
			if (!drive || !(drive && (await drive.promises.exists(mediaPath)))) {
				showError(storage, mediaPath);
				res.status(404).end();
				return;
			}
		}
		if (!range) {
			//in case there's no range header
			emitter.log('NO Range Header');
			const headers = {
				'Content-Length': mediaSize,
				'Content-Type': ctype
			};
			res.writeHead(200, headers);
			(storage === 'fs' ? fs : drive).createReadStream(mediaPath).pipe(res);
			return;
		}

		// range: "bytes=32324-"
		const CHUNK_SIZE = 1 * 1e6;
		const start = Number(range.replace(/\D/g, ''));
		const end = Math.min(start + CHUNK_SIZE, mediaSize - 1);

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

		(storage === 'fs' ? fs : drive).createReadStream(mediaPath, { start, end }).pipe(res);
	});
}
