import archiver from 'archiver';
import type { Hono } from 'hono'
import bodyParser from 'body-parser';
import { prettyJSON } from 'hono/pretty-json'
import { compress } from 'hono/compress'
import { getFileType, spawnChildProcess, mime } from './utils.js';
import { join, basename } from 'path';
import { getEmitter, getApi } from './state.js';
import fs from 'fs';
import { cors } from 'hono/cors'
import colors from 'kleur';
import { Settings } from './settings.js';
import _ from 'lodash-es';
import { fsDrive } from './drive/index.js';

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

export default async function (app: Hono) {
	// ROUTES

	// app.use('*', prettyJSON());
	// app.use("*", compress());
	// app.use("*", cors());

	app.get('/thumbnail', async (c) => {
		const { req, res } = c;
		const body = await c.req.json()
		let storage = body?.storage; //drive || fs
		const dkey = body?.dkey;
		if (!storage) storage = dkey?.match(/[a-z0-9]{64}/) ? 'drive' : 'fs';
		const path = join(storage === 'fs' ? config.fs : '', decodeURIComponent(body.path));
		const drive = storage === 'fs' ? fs : api.drives.get(dkey);
	});

	app.get('/test', async (c) => {
		return c.json({ status: 'ok' })
	})

	app.post('/get-file-type', async function (c) {
		const { req, res } = c;
		const body = await c.req.json()
		let storage = body?.storage; //drive || fs
		const dkey = body?.dkey;
		if (!storage) storage = dkey?.match(/[a-z0-9]{64}/) ? 'drive' : 'fs';
		const path = join(storage === 'fs' ? config.fs : '', decodeURIComponent(body.path));
		const drive = storage === 'fs' ? fs : api.drives.get(dkey);

		const ctype = await getFileType({ path, drive }, emitter);

		emitter.log('/get-file-type', { ctype, storage, path, dkey });
		return c.json({ ctype });
	});

	app.get('/download', async (c) => {
		const { req } = c;
		const body = await c.req.json()
		const size = req.query("size") as string;
		const type = req.query("type") as string;
		const storage = (req.query("storage") || 'fs') as string; //drive || fs
		const path = decodeURIComponent(req.query("path") as string);
		const dkey = req.query("dkey") as string;
		emitter.log('download', { size, path, storage, type, dkey });
		const drive = api.drives.get(dkey);
		const filename = path.split('/').reverse()[0];

		if (storage === 'fs') {
			if (!fs.existsSync(fsDrive.resolvePath(path))) {
				showError(storage, path);
				c.status(404)
				return c.notFound();
			}
		} else if (!drive || !(drive && (await drive.exists(path)))) {
			showError(storage, path);
			c.status(404)
			return c.notFound();
		}


		c.header('Content-Length', size);

		if (type === 'file') {
			try {
				c.header('Content-Disposition', `attachment; filename=${filename}`);
			} catch (error: any) {
				emitter.broadcast('notify-danger', error.message);
			}
			if (storage === 'fs') {
				// fsDrive.createReadStream(path).pipe(res);
				// return fsDrive.createReadStream(path)
				return c.stream(async (s) => {
					await s.pipe(fsDrive.createReadStream(path));
				})
			}
			if (drive) {
				// drive?.createReadStream(path).pipe(res);
				return c.stream(async (s) => {
					await s.pipe(drive.createReadStream(path));
				})
			}
			return c.body('')
		} else if (type === 'dir') {
			c.header('Content-Type', 'application/zip');
			c.header('Content-Disposition', `attachment; filename=${filename}.zip`);
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
			// zip.pipe(res);
			return c.stream(async (s) => {
				await s.pipe(zip);
				await zip.finalize();
			})
		}
	});
	app.get('/file', async function (c) {
		const { req } = c;
		let fileSize = Number(req.query("size"));
		const _path = req.query("path") as string;
		let filePath;
		if (_.isArray(_path)) filePath = join(..._path.map((pth) => decodeURIComponent(pth)));
		else filePath = decodeURIComponent(_path);
		const ctype = (req.query("ctype") || mime.getType(filePath)) as string;
		const storage: string = (req.query("storage") || 'fs') as string; //drive || fs
		const dkey: string = req.query("dkey") as string;

		emitter.log('/file', {
			path: filePath,
			fileSize,
			ctype
		});

		c.header('Content-Type', ctype);
		c.header('x-filename', basename(filePath));
		if (storage === 'fs') {
			if (!fs.existsSync(join(config.fs, filePath))) {
				showError(storage, filePath);
				c.status(404)
				return c.notFound();
			}
			if (!fileSize) {
				fileSize = fs.statSync(join(config.fs, filePath)).size;
			}
			c.header('Content-Length', String(fileSize));

			// fsDrive.createReadStream(filePath).pipe(res);
			return c.stream(async (s) => {
				fsDrive.createReadStream(filePath)
				await s.pipe(fsDrive.createReadStream(filePath));
			})
		} else {
			const drive = api.drives.get(dkey);

			if (!drive || !(drive && (await drive.exists(filePath)))) {
				showError(storage, filePath);
				c.status(404)
				return c.notFound();
			}

			if (!fileSize) {
				const stats = await drive.stat(filePath);
				fileSize = stats.size;
			}

			c.header('Content-Length', String(fileSize));
			// drive.createReadStream(filePath).pipe(res);
			return drive.createReadStream(filePath)
			// return c.stream(async (s) => {
			// 	await s.pipe(drive.createReadStream(filePath));
			// })
		}
	});
	app.post('/mpv_stream', async (c) => {
		const body = await c.req.json()
		const command = 'mpv ' + body.url;
		spawnChildProcess(command, { emitter }).catch((err) => {
			// emitter.log(err);
			// emitter.broadcast(err);
		});
		c.status(200)
		return c.json({ status: 'ok' });
	});
	app.get('/media', async (c) => {
		const { req } = c;
		let mediaSize = Number(req.query("size"));
		const ctype: string = req.query("ctype") as string;
		const storage: string = (req.query("storage") || 'fs') as string; //drive || fs
		const mediaPath: string = join(
			storage === 'fs' ? config.fs : '',
			decodeURIComponent(req.query("path") as string)
		);
		const dkey = req.query("dkey") as string;
		const chucksize = Number(req.query("chucksize") || mediaSize);
		const range = String(req.headers.range);

		const drive = api.drives.get(dkey);
		if (storage === 'drive' && !drive) {
			showError(storage, mediaPath);
			c.status(404)
			return c.notFound();
		}

		emitter.log('/media', { mediaSize, ctype, range, storage, mediaPath });

		if (!range) {
			//in case there's no range header
			c.status(416)
			emitter.log('NO Range Header');
			return c.text('Wrong range');
		}

		if (!mediaSize) {
			try {
				if (storage === 'fs') mediaSize = fs.statSync(join(config.fs, mediaPath)).size;
				else mediaSize = (await drive!.stat(mediaPath)).size;
			} catch (err: any) {
				showError(storage, mediaPath, err.message);
				c.status(404)
				return c.body('')
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
		c.status(206)
		for (const key in headers) {
			c.header(key, headers[key]);
		}
		try {
			const stream = (storage === 'fs' ? fs : drive)!.createReadStream(mediaPath, { start, end });

			// stream.pipe(res);

			stream.on('error', (err) => {
				showError(storage, mediaPath, err.message);
				c.status(400)
				return c.text(err.message);
			});
			return c.stream(async (s) => {
				await s.pipe(stream);
			})
		} catch (err: any) {
			showError(storage, mediaPath, err.message);
			c.status(400)
			return c.text(err.message);
		}
	});
}
