import mime from 'mime-types';
import Path from 'path';
import archiver from 'archiver';
import bodyParser from 'body-parser';
import {
	execChildProcess,
	getDriveFileType,
	getFileType,
	handleError,
	spawnChildProcess
} from './utils.js';
import { getEmitter, makeApi } from './state.js';
import fs from 'fs';
import cors from 'cors';
import chalk from 'chalk';
import compression from 'compression';
import { Settings } from './settings.js';

const config = Settings();
const emitter = getEmitter();

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
		const path = unescape(req.query.path);
		const dkey = req.query.dkey;
		console.log('download', { size, path, storage, type, dkey });

		if (type === 'file') {
			if (storage === 'fs') {
				console.log('/download/sendFile');
				const filename = path.split('/').reverse()[0];
				try {
					res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
				} catch (error) {
					emitter.broadcast('notify-danger', error.message);
				}
				fs.createReadStream(Path.join(config.fs, path)).pipe(res);
			} else {
				const drive = api.drives.get(dkey);
				const filename = path.split('/').reverse()[0];
				try {
					res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
				} catch (error) {
					emitter.broadcast('notify-danger', error.message);
				}
				if (drive) {
					drive.createReadStream(path).pipe(res);
				}
			}
		} else if (type === 'dir') {
			res.setHeader('Content-Type', 'application/zip');
			const filename = path.split('/').reverse()[0];
			res.setHeader('Content-Disposition', `attachment; filename=${filename}.zip`);
			// const zip = AdmZip();
			const zip = archiver('zip', {
				zlib: { level: 9 } // Sets the compression level.
			});
			if (storage === 'fs') {
				zip.directory(Path.join(config.fs, path), '/', { name: filename });
			} else {
				const drive = api.drives.get(dkey);
				if (drive) {
					const files = await drive.$listAllFiles(path);
					for (const name of files) {
						zip.append(await drive.$read(name), { name });
					}
				}
			}
			zip.pipe(res);
			zip.finalize();
		}
	});
	app.get('/image', async function (req, res) {
		console.log('/image');
		const imgsize = req.query.size;
		const ctype = req.query.ctype;
		const storage = req.query.storage || 'fs'; //drive || fs
		const imgPath = unescape(req.query.path);
		const dkey = req.query.dkey;

		res.setHeader('Content-Length', imgsize);
		res.setHeader('Content-Type', ctype);

		if (storage === 'fs') {
			fs.createReadStream(Path.join(config.fs, imgPath)).pipe(res);
		} else {
			const drive = api.drives.get(dkey);
			if (drive) {
				const imgStream = drive.createReadStream(imgPath);
				imgStream.pipe(res);
			}
		}
	});
	app.get('/textfile', async function (req, res) {
		console.log('/textfile');
		const filesize = req.query.size;
		const ctype = req.query.ctype;
		const storage = req.query.storage || 'fs'; //drive || fs
		const filePath = unescape(req.query.path);
		const dkey = req.query.dkey;

		res.setHeader('Content-Length', filesize);
		res.setHeader('Content-Type', ctype);

		if (storage === 'fs') {
			const text = fs.readFileSync(Path.join(config.fs, filePath));
			console.log('text', text);
			res.send(text);
		} else {
			const drive = api.drives.get(dkey);
			if (drive) {
				const text = await drive.$read(filePath);
				res.send(text);
			}
		}
	});
	app.get('/pdf', async (req, res) => {
		console.log('/pdf');
		const pdfSize = req.query.size;
		const ctype = req.query.ctype;
		const storage = req.query.storage || 'fs'; //drive || fs
		const pdfPath = unescape(req.query.path);
		const dkey = req.query.dkey;
		let filename = pdfPath.split('/').reverse()[0];
		if (!filename?.split?.('.')?.[1]) filename += '.pdf';
		res.setHeader('Content-Length', pdfSize);
		res.setHeader('Content-Type', ctype);
		// res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
		if (storage === 'fs') {
			const pdf = fs.readFileSync(Path.join(config.fs, pdfPath));
			res.send(pdf);
		} else {
			const drive = api.drives.get(dkey);
			if (drive) {
				const pdf = await drive.$read(pdfPath);
				res.send(pdf);
			}
		}
	});

	app.post('/mpv_stream', async (req, res) => {
		const command = 'mpv ' + req.body.url;
		// console.log('commard', command);
		spawnChildProcess(command, { emitter });
		emitter.on('child-process:spawn', () => {
			res.status(200).end();
		});
	});
	app.get('/media', async (req, res) => {
		// Ensure there is a range given for the media
		const mediaSize = req.query.size;
		const ctype = req.query.ctype;
		const storage = req.query.storage || 'fs'; //drive || fs
		const mediaPath = Path.join(storage === 'fs' ? config.fs : '', unescape(req.query.path));
		const dkey = req.query.dkey;
		const range = req.headers.range;
		emitter.log('/media', { mediaSize, ctype, range, storage });
		if (!range) {
			//in case there's no range header
			emitter.log('NO Range Header');
			const headers = {
				'Content-Length': mediaSize,
				'Content-Type': ctype
			};
			res.writeHead(200, headers);
			if (storage === 'fs') {
				if (!fs.existsSync(mediaPath)) {
					emitter.log(chalk.red(storage + '::' + mediaPath + '::media-path do not exist'));
					emitter.broadcast(
						'notify-danger',
						storage + '::' + mediaPath + '::media-path do not exist'
					);
					return;
				}
				fs.createReadStream(mediaPath).pipe(res);
			} else {
				const drive = api.drives.get(dkey);
				if (drive) {
					if (!(await drive.promises.exists(mediaPath))) {
						emitter.log(chalk.red(storage + '::' + mediaPath + '::media-path do not exist'));
						emitter.broadcast(
							'notify-danger',
							storage + '::' + mediaPath + '::media-path do not exist'
						);
						return;
					}
					drive.createReadStream(mediaPath).pipe(res);
				}
			}
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

		if (storage === 'fs') {
			if (!fs.existsSync(mediaPath)) {
				emitter.log(chalk.red(storage + '::' + mediaPath + '::media-path do not exist'));
				emitter.broadcast(
					'notify-danger',
					storage + '::' + mediaPath + '::media-path do not exist'
				);
				return;
			}
			fs.createReadStream(mediaPath, { start, end }).pipe(res);
		} else {
			const drive = api.drives.get(dkey);
			if (drive) {
				if (!(await drive.promises.exists(mediaPath))) {
					emitter.log(chalk.red(storage + '::' + mediaPath + '::media-path do not exist'));
					emitter.broadcast(
						'notify-danger',
						storage + '::' + mediaPath + '::media-path do not exist'
					);
					return;
				}
				drive.createReadStream(mediaPath, { start, end }).pipe(res);
			}
		}
	});
}
