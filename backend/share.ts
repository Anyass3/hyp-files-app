import DHT from '@hyperswarm/dht';
import hypercrypto from 'hypercore-crypto';
import crypto from 'crypto';
import archiver from 'archiver';
import randomWords from 'random-words';
import fs, { ReadStream, WriteStream } from 'fs';
import zlib from 'zlib';
import _ from 'lodash';
import { join } from 'path';
import { Writable } from 'stream';
import { getEmitter, makeApi } from './state.js';
import colors from 'colors';
import { Settings } from './settings.js';

const config = Settings();
const emitter = getEmitter();

const handleConnection = async (api, { dkey, path, stat, remoteStream, send, phrase }, server?) => {
	// remoteStream is E2E between you and the other peer
	// pipe  it somewhere like any duplex stream
	stat['name'] = _.last(path.split('/'));
	path = join(dkey === 'fs' ? config.fs : '', path);
	let localStream;

	let open = { local: true, remote: true };
	const localEnd = async () => {
		// if (open.local) localStream.end();
		open.local = false;
		if (!open.remote && server) await server.close();
	};
	const remoteEnd = async () => {
		// if (open.remote) remoteStream.end();
		open.remote = false;
		if (!open.local && server) await server.close();
	};
	const handleEvents = (stream, endFn) => {
		stream.on('error', endFn);
		stream.on('end', endFn);
		stream.on('finish', endFn);
	};

	if (send) {
		// local ==> remote

		if (dkey === 'fs') {
			if (!stat.isFile) {
				localStream = archiver('zip', {
					zlib: { level: 9 } // Sets the compression level.
				});
				localStream.directory(path, '/', { name: stat.name });
				stat.name = stat.name + '.zip';
				localStream.finalize();
			} else localStream = fs.createReadStream(path);
		} else {
			const drive = api.drives.get(dkey);
			if (!stat.isFile) {
				localStream = archiver('zip', {
					zlib: { level: 9 } // Sets the compression level.
				});
				const files = await drive.$listAllFiles(path);
				for (const name of files) {
					localStream.append(await drive.$read(name), { name });
				}
				stat.name = stat.name + '.zip';
				localStream.finalize();
			} else localStream = drive.createReadStream(path);
		}

		remoteStream.write(zlib.gzipSync(JSON.stringify(stat)));
		localStream.pipe(zlib.createGzip()).on('error', localEnd).pipe(remoteStream);
		handleEvents(localStream, localEnd);
	} else {
		// local <== remote

		let writing = false;
		const writeChunck = (chunk) => {
			if (!writing) {
				writing = true;
				let remoteStat = JSON.parse(chunk.toString());
				if (stat) console.log('recieve', stat, remoteStat);
				if (!stat.isFile) path = join(path, remoteStat.name);
				if (dkey === 'fs') {
					localStream = fs.createWriteStream(path);
				} else {
					const drive = api.drives.get(dkey);
					localStream = drive.createWriteStream(path);
				}
				handleEvents(localStream, localEnd);
			} else {
				//@ts-ignore
				localStream.write(chunk);
				console.log(chunk);
			}
		};

		const stream = new Writable({
			write(chunk, encoding, callback) {
				//@ts-ignore
				writeChunck(chunk);
				callback();
			}
		});
		remoteStream.pipe(zlib.createGunzip()).pipe(stream);
		stream.on('finish', () => {
			//@ts-ignore
			localStream.end();
		});
	}
	handleEvents(remoteStream, remoteEnd);
};

export const initiate = async (api, { dkey, path, stat, send = true, phrase }) => {
	const node = new DHT({});
	if (!phrase) phrase = randomWords({ exactly: 3, join: ' ' });
	const seed = hypercrypto.data(Buffer.from(phrase));
	const server = node.createServer();
	server.on('connection', function (remoteStream) {
		console.log('server Remote public key', remoteStream.remotePublicKey);
		console.log('server Local public key', remoteStream.publicKey); // same as keyPair.publicKey
		handleConnection(api, { dkey, path, stat, send, remoteStream, phrase }, server);
	});
	server.on('close', () => {
		console.log('sharing server connection closed');
	});

	// make a ed25519 keypair to listen on
	const keyPair = DHT.keyPair(seed);

	// this makes the server accept connections on this keypair
	await server.listen(keyPair);
	return phrase;
};

export const connect = (api, { dkey, path, stat, send = false, phrase }) => {
	if (!phrase) phrase = randomWords({ exactly: 3, join: ' ' });
	const seed = hypercrypto.data(Buffer.from(phrase));
	const keyPair = DHT.keyPair(seed);
	const node = new DHT({});
	const remoteStream = node.connect(keyPair.publicKey, { keyPair });

	remoteStream.on('open', function () {
		console.log('Remote public key', remoteStream.remotePublicKey);
		console.log('Local public key', remoteStream.publicKey); // same as keyPair.publicKey
		handleConnection(api, { dkey, path, stat, send, remoteStream, phrase });
	});
};
