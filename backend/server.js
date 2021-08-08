import { ConnectionsAcceptor, newServerKeypair as newKeypair } from 'connectome/server';
import chalk from 'chalk';
import { MirroringStore } from 'connectome/stores';
import hyperspace from './hyperspace.js';
import { getDriveFileType, getFileType, handleError, makeApi } from './utils.js';
import { getEmitter } from './state.js';
import fs from 'fs';
import mime from 'mime-types';
import Path from 'path';
import archiver from 'archiver';
import bodyParser from 'body-parser';
import express from 'express';
import http from 'http';
import compression from 'compression';
import { Settings } from './settings.js';

const config = Settings();

const stdin = process.stdin;
stdin.resume();
stdin.setEncoding('utf8');
let HOST = 'localhost';
const _h = process.argv.indexOf('-h');
if (process.argv[_h] === '-h') HOST = process.argv[_h + 1];
console.log('process.argv', process.argv, 'host=' + HOST);

const emitter = getEmitter();

async function serveRoutes(app, api = makeApi()) {
	// ROUTES

	app.use(bodyParser.json());
	app.use(compression());

	app.post('/get-file-type', async function (req, res) {
		console.log('/get-file-type', req?.body);
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
				if (!ctype) {
					const stream = await drive.createReadStream(filePath);
					ctype = await getDriveFileType(stream);
				}
			}
		}
		console.log({ storage, filePath, dkey, ctype });
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

	app.get('/media', function (req, res) {
		// Ensure there is a range given for the media
		const range = req.headers.range;
		if (!range) {
			res.status(400).send('Requires Range header');
		}

		const mediaSize = req.query.size;
		const ctype = req.query.ctype;
		const storage = req.query.storage || 'fs'; //drive || fs
		const mediaPath = unescape(req.query.path);
		const dkey = req.query.dkey;

		// range: "bytes=32324-"
		const CHUNK_SIZE = 1 * 1e6;
		const start = Number(range.replace(/\D/g, ''));
		const end = Math.min(start + CHUNK_SIZE, mediaSize - 1);

		console.log(`media chunks => ${start}::${end}`);

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
			const mediaStream = fs.createReadStream(Path.join(config.fs, mediaPath), { start, end });
			mediaStream.pipe(res);
		} else {
			const drive = api.drives.get(dkey);
			if (drive) {
				const mediaStream = drive.createReadStream(mediaPath, { start, end });
				mediaStream.pipe(res);
			}
		}
	});
}

const enhanceChannel = (channel) => {
	return {
		emit: (...args) => {
			// console.log('in emit', args[0]);
			try {
				channel.emit(...args);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				console.log(chalk.red('error: ' + error.message));
			}
		},
		on: (...args) => {
			// console.log('in on', args[0]);
			const listener = handleError(args[1], emitter);
			try {
				channel.on(args[0], listener);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				console.log(chalk.red('error: ' + error.message));
			}
		},
		signal: (...args) => {
			// console.log('in signal', args[0]);
			try {
				channel.signal(...args);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				console.log(chalk.red('error: ' + error.message));
			}
		},
		get key() {
			return channel._remotePubkeyHex;
		}
	};
};
async function start() {
	const port = process.env.PORT || 3788;
	const app = express();

	const mirroringStore = new MirroringStore({ peers: [], drives: [] });
	const api = makeApi(mirroringStore);

	process.on('SIGINT', async () => {
		console.log(chalk.cyan('cleaning up ...'));
		for (let cleanup of api.cleanups) await cleanup();
		process.exit();
	});
	process.on('uncaughtExceptionMonitor', async (err, origin) => {
		console.log(chalk.red('uncaughtExceptionMonitor'), err, origin);
		console.log(chalk.cyan('cleaning up ...'));
		for (let cleanup of api.cleanups) await cleanup();
		process.exit();
	});

	serveRoutes(app, api);

	const server = http.Server(app);
	const keypair = newKeypair();
	const acceptor = new ConnectionsAcceptor({ port, server, keypair });

	acceptor.on('protocol_added', ({ protocol, lane }) => {
		console.log(`💡 Connectome protocol ${chalk.cyan(protocol)}/${chalk.cyan(lane)} ready.`);
		// console.log('acceptor', acceptor);
	});
	const onConnect = await hyperspace();
	const channelList = acceptor.registerProtocol({
		protocol: 'dmtapp',
		lane: 'hyp',
		onConnect: async ({ channel }) => onConnect({ channel: enhanceChannel(channel), api })
	});
	mirroringStore.mirror(channelList);

	channelList.on('new_channel', (channel) => {
		channel.attachObject('dmtapp:hyp', api);
		console.log(chalk.cyan(`channel.attachObject => dmtapp:hyp`));
	});

	// start websocket server
	acceptor.start();

	console.log(
		chalk.green(`Connectome → Running websocket connections acceptor on port ${port} ...`)
	);

	server.listen(port, HOST);
}

start();
