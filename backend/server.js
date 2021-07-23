import { ConnectionsAcceptor, newServerKeypair as newKeypair } from 'connectome/server';
import chalk from 'chalk';
import { MirroringStore } from 'connectome/stores';
import hyperspace from './hyperspace.js';
import { getDriveFileType, getFileType, makeApi } from './utils.js';
import fs from 'fs';
// import mime from 'mime-types';
// import path from 'path';
import zlib from 'zlib';
import AdmZip from 'adm-zip';
import bodyParser from 'body-parser';
import express from 'express';
import http from 'http';

const stdin = process.stdin;
stdin.resume();
stdin.setEncoding('utf8');
const _h = process.argv.indexOf('-h');
let HOST = 'localhost';
if (process.argv[_h] === '-h') HOST = process.argv[_h + 1];
console.log('process.argv', process.argv, 'host=' + HOST);
async function serveRoutes(app, api = makeApi()) {
	// ROUTES

	app.use(bodyParser.json());

	app.get('/pipe', async function (req, res) {
		const file = '/home/abdoulie/projects/tella/frontend/src/icons/hmm';
		res.setHeader('Content-Length', fs.statSync(file).size);
		res.setHeader('Content-Type', await getFileType(file));
		fs.createReadStream(file).pipe(res);
		// res.sendFile(file);
	});

	app.get('/send', async function (req, res) {
		const file = '/home/abdoulie/MEGAsync Downloads/mufti2';
		console.log(await getFileType(file));
		console.log(await getFileType('/home/abdoulie/projects/tella/frontend/src/icons/hmm'));
		res.sendFile(file);
	});

	app.post('/get-file-type', async function (req, res) {
		console.log('/get-file-type');
		const storage = req.body.storage || 'fs'; //drive || fs
		const filePath = unescape(req.body.path);
		const dkey = req.body.dkey;
		let ctype;
		if (storage === 'fs') ctype = await getFileType(filePath);
		else {
			const Drive = api.drives.get(dkey);
			console.log('/get-file-type', dkey, filePath, storage);
			console.log('/get-file-type', Drive.key);
			if (Drive) {
				// ctype = mime.lookup(path.extname(filePath));
				if (!ctype) {
					const stream = await Drive.drive.createReadStream(filePath);
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
				res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
				fs.createReadStream(path).pipe(res);
			} else {
				const Drive = api.drives.get(dkey);
				const filename = path.split('/').reverse()[0];
				res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
				if (Drive) {
					Drive.drive.createReadStream(path).pipe(res);
				}
			}
		} else if (type === 'dir') {
			res.setHeader('Content-Type', 'application/zip');
			const filename = path.split('/').reverse()[0];
			res.setHeader('Content-Disposition', `attachment; filename=${filename}.zip`);
			const zip = AdmZip();
			if (storage === 'fs') {
				zip.addLocalFolder(path, filename);
			} else {
				const Drive = api.drives.get(dkey);
				if (Drive) {
					const files = await Drive.listAllFiles(path);
					for (const file of files) {
						zip.addFile(file, await Drive.read(file));
					}
				}
			}
			res.send(zip.toBuffer());
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
			fs.createReadStream(imgPath).pipe(res);
		} else {
			const Drive = api.drives.get(dkey);
			if (Drive) {
				const imgStream = Drive.drive.createReadStream(imgPath);
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
			const text = fs.readFileSync(filePath);
			console.log('text', text);
			res.send(text);
		} else {
			const Drive = api.drives.get(dkey);
			if (Drive) {
				const text = await Drive.read(filePath);
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
			const pdf = fs.readFileSync(pdfPath);
			res.send(pdf);
		} else {
			const Drive = api.drives.get(dkey);
			if (Drive) {
				const pdf = await Drive.read(pdfPath);
				res.send(pdf);
			}
		}
	});

	app.get('/media', function (req, res) {
		console.log('/media');
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
			const mediaStream = fs.createReadStream(mediaPath, { start, end });
			mediaStream.pipe(res);
		} else {
			const Drive = api.drives.get(dkey);
			if (Drive) {
				const mediaStream = Drive.drive.createReadStream(mediaPath, { start, end });
				mediaStream.pipe(res);
			}
		}
	});
}

async function start() {
	const port = process.env.PORT || 3788;
	const app = express();

	const mirroringStore = new MirroringStore({ peers: [], drives: [] });
	const api = makeApi(mirroringStore);

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
		onConnect: async ({ channel }) => onConnect({ channel, api })
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
	process.on('SIGINT', async () => {
		console.log(chalk.cyan('cleaning up ...'));
		for (let cleanup of api.cleanups) await cleanup();
		process.exit();
	});
}

start();
