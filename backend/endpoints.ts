import archiver from 'archiver';
import bodyParser from 'body-parser';
import getThumbnail from 'simple-thumbnail'
import { getFileType, spawnChildProcess, mime, getRandomStr, toArrayBuffer } from './utils.js';
import { join, basename } from 'path';
import { getEmitter, getApi } from './state.js';
import fs from 'fs';
import fsp from 'fs/promises'
import cors from 'cors';
import colors from 'kleur';
import compression from 'compression';
import { Settings } from './settings.js';
import _ from 'lodash-es';
import { fsDrive } from './drive/index.js';
import Hyperbee from 'hyperbee';

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

export default async function (app, bee: Hyperbee) {
	// ROUTES

	app.use(bodyParser.json());
	app.use(compression());
	app.use(cors());

	app.get('/thumbnail', async (req, res) => {
		// const hex = req.query.hex as string;
		// const { size, path, storage, ctype, dkey } = JSON.parse(Buffer.from(hex, 'hex').toString('utf-8'))
		const url = decodeURIComponent(req.query.url as string);
		const filePath = '.storage/thumbnails/' + getRandomStr() + '.png';
		const thumbnails = bee.sub('thumbnails', { valueEncoding: 'binary', keyEncoding: 'utf-8' })
		let file: Buffer | undefined
		file = (await thumbnails.get(url))?.value
		console.log('file', file, url, filePath)
		let seek = `00:00:01`

		{
			const _url = new URL(url)

			const size = Number(_url.searchParams.get('size') || 0) / 1024 / 1024
			if (size < 2) seek = `00:00:30`
			else if (size < 3) seek = `00:01:00`
			else if (size < 4) seek = `00:01:30`
			else if (size < 5) seek = `00:02:00`
			else if (size < 6) seek = `00:02:30`
			else if (size < 7) seek = `00:03:00`
			else if (size < 8) seek = `00:03:30`
			else if (size < 9) seek = `00:04:00`
			else seek = `00:04:30`
		}
		let shouldSave = false
		try {
			if (!file) {
				await getThumbnail(url, filePath, '400x?', { seek }).catch(err => console.error(err))
				file = await fsp.readFile(filePath)
				shouldSave = true
			}
			console.log('bee', (await thumbnails.get(url)), file)
		} catch (error) {

		}
		// if (!file) return res.status(404).end()
		res.setHeader('Content-Type', 'image/png');
		res.setHeader('Content-Length', file?.byteLength || 0);
		// const readStream = fs.createReadStream(filePath)

		// readStream.on('error', (err) => {
		// 	fs.unlink(filePath, () => {
		// 		console.log('deleted')
		// 	})
		// })

		// readStream.on('close', () => {
		// 	fs.unlink(filePath, () => {
		// 		console.log('deleted')
		// 	})
		// })
		res.on('error', (err) => {
			console.log('error', err)
		})
		res.send(file)
		res.on('close', async () => {
			if (shouldSave) {
				console.log('file;shouldSave', { file, url, filePath })
				try {
					await thumbnails.put(url, file)
				} catch (error) {
					console.error(error)
				}
			}
			console.log('res:closed!')
		})
		// readStream.pipe(res);
		// if (shouldSave) {
		// console.log('file;shouldSave', { file, url, filePath })
		// await thumbnails.put(url, file)
		// }
		console.log('done!')


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
		const hex = req.query.hex || '' as string;
		const { size, path, storage, ctype, type, dkey } = JSON.parse(Buffer.from(hex, 'hex').toString('utf-8'))
		// const type = req.query.type as string;
		// const storage = (req.query.storage || 'fs') as string; //drive || fs
		// const path = decodeURIComponent(req.query.path as string);
		// const dkey = req.query.dkey as string;


		// const minutes = Number(_url.searchParams.get('size')||0)/1024
		emitter.log('download', { size, path, storage, type, dkey });
		const drive = api.drives.get(dkey);
		const filename = path.split('/').reverse()[0];

		if (storage === 'fs') {
			if (!fs.existsSync(fsDrive.resolvePath(path))) {
				showError(storage, path);
				res.status(404).end();
				return;
			}
		} else if (!drive || !(drive && (await drive.exists(path)))) {
			showError(storage, path);
			res.status(404).end();
			return;
		}


		res.setHeader('Content-Length', size);

		if (type === 'file') {
			try {
				res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
			} catch (error: any) {
				emitter.broadcast('notify-danger', error.message);
			}
			if (storage === 'fs') {
				fsDrive.createReadStream(path).pipe(res);
			} else {
				drive?.createReadStream(path).pipe(res);
			}
		} else if (type === 'dir') {
			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Disposition', `attachment; filename=${filename}.zip`);
			const zip = archiver('zip', {
				zlib: { level: 9 } // Sets the compression level.
			});
			if (storage === 'fs') {
				zip.directory(fsDrive.resolvePath(path), '/', { name: filename });
			} else {
				const files = await drive!.$listAllFiles(path);
				for (const name of files || []) {
					zip.append(await drive!.get(name), { name });
				}
			}
			zip.pipe(res);
			zip.finalize();
		}
	});
	app.get('/file', async function (req, res) {
		const hex = req.query.hex || '' as string;
		let { size: fileSize, path, storage, ctype = mime.getType(path), dkey } = JSON.parse(Buffer.from(hex, 'hex').toString('utf-8'))
		// let fileSize = req.query.size as string | number;
		const _path = req.query.path || path as string;
		let filePath;
		if (_.isArray(_path)) filePath = join(..._path.map((pth) => decodeURIComponent(pth)));
		else filePath = _path as string;
		// const ctype = (req.query.ctype || mime.getType(filePath)) as string;

		emitter.log('/file', {
			path: filePath,
			fileSize,
			ctype
		});

		res.setHeader('Content-Type', ctype);
		res.setHeader('x-filename', basename(filePath));
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

			fsDrive.createReadStream(filePath).pipe(res);
		} else {
			const drive = api.drives.get(dkey);

			if (!drive || !(drive && (await drive.exists(filePath)))) {
				showError(storage, filePath);
				res.status(404).end();
				return;
			}

			if (!fileSize) {
				const stats = await drive.stat(filePath);
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
		const hexData = JSON.parse(Buffer.from(req.query.hex, 'hex').toString('utf-8'))
		let mediaSize = Number(req.query.size || hexData.size);
		const ctype: string = (req.query.ctype || hexData.ctype) as string;
		const storage: string = (req.query.storage || hexData.storage || 'fs') as string; //drive || fs
		const mediaPath: string = join(
			storage === 'fs' ? config.fs : '',
			decodeURIComponent(req.query.path || '' as string) || hexData.path
		);
		const dkey = (req.query.dkey || hexData.dkey) as string;
		const chucksize = Number(req.query.chucksize || mediaSize);
		const range = String(req.headers.range);

		const drive = api.drives.get(dkey);
		if (storage === 'drive' && !drive) {
			showError(storage, mediaPath);
			res.status(404).end();
			return;
		}

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
				else mediaSize = (await drive!.stat(mediaPath)).size;
			} catch (err: any) {
				showError(storage, mediaPath, err.message);
				return res.end();
			}
		}
		const ranges = range.replace(/bytes=/, '').split('-');

		const CHUNK_SIZE = chucksize;
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
			const stream = (storage === 'fs' ? fs : drive)!.createReadStream(mediaPath, { start, end });

			stream.pipe(res);

			stream.on('error', (err) => {
				showError(storage, mediaPath, err.message);
				return res.end();
			});
			return;
		} catch (err: any) {
			showError(storage, mediaPath, err.message);
			return res.end();
		}
	});
}
