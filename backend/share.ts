import DHT from '@hyperswarm/dht';
import hypercrypto from 'hypercore-crypto';
import archiver from 'archiver';
import randomWords from 'random-words';
import fs, { ReadStream, WriteStream } from 'fs';
import zlib from 'zlib';
import _ from 'lodash-es';
import { join } from 'path';
import { Writable, Transform } from 'stream';
import { getEmitter, getApi } from './state.js';
import colors from 'kleur';
import { Settings } from './settings.js';

const config = Settings();
const api = getApi();
const emitter = getEmitter();

const hasPermission = ({ path, dkey, send }) => {
	if (dkey === 'fs') {
		try {
			fs.accessSync(path, send ? fs.constants.R_OK : fs.constants.W_OK);
		} catch (err) {
			emitter.broadcast(
				'notify-danger',
				`sorry you do not have ${send ? 'read' : 'write'} access to '${
					_.last(path.split('/')) || path
				}'`
			);
			return false;
		}
	}
	return true;
};

const handleConnection = async (
	{ dkey, path, stat, remoteStream, send, phrase, node },
	server?
) => {
	// remoteStream is E2E between you and the other peer
	// pipe  it somewhere like any duplex stream
	stat['name'] = _.last(path.split('/'));
	path = join(dkey === 'fs' ? config.fs : '', path);
	let localStream;

	const open = { local: true, remote: true };
	const localEnd = async () => {
		if (open.local)
			try {
				localStream.end();
			} catch (error) {}

		open.local = false;
		if (!open.remote && server) {
			await server.close();
		}
	};
	const remoteEnd = async () => {
		if (open.remote)
			try {
				remoteStream.end();
			} catch (error) {}
		open.remote = false;
		if (!open.local && server) {
			await server.close();
		}
	};
	const handleEvents = (stream, endFn) => {
		stream.on('error', endFn);
		stream.on('end', endFn);
		stream.on('finish', endFn);
	};

	if (send) {
		const reportProgress = new Transform({
			transform(chunk, encoding, callback) {
				_.debounce(async () => {
					uploaded += chunk.length;
					emitter.broadcast('sharing-progress', {
						size: stat.size,
						loadedBytes: uploaded,
						phrase,
						send
					});
				})();
				callback(null, chunk);
			}
		});
		// local ==> remote
		let uploaded = 0;
		if (dkey === 'fs') {
			if (!stat.isFile) {
				localStream = archiver('zip', {
					zlib: { level: 9 } // Sets the compression level.
				});
				localStream.directory(path, '/', { name: stat.name });
				stat.name = stat.name + '.zip';
				localStream.finalize();
				stat.size = localStream._readableState.length || stat.size;
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
				stat.size = localStream._readableState.length || stat.size;
			} else localStream = drive.createReadStream(path);
		}

		remoteStream.write(zlib.gzipSync(JSON.stringify(stat)));
		localStream.pipe(reportProgress).pipe(zlib.createGzip()).pipe(remoteStream);
		handleEvents(localStream, localEnd);
	} else {
		// local <== remote
		let remoteStat;
		let downloaded = 0;
		const writeChunck = (chunk) => {
			if (!remoteStat) {
				remoteStat = JSON.parse(chunk.toString()) || {};
				emitter.log('recieving::stats', stat, remoteStat);
				if (!stat.isFile) path = join(path, remoteStat.name);
				if (dkey === 'fs') {
					localStream = fs.createWriteStream(path);
				} else {
					const drive = api.drives.get(dkey);
					localStream = drive.createWriteStream(path);
				}
				api.updateSharing({ phrase, name: remoteStat.name, send });
				// handleEvents(localStream, localEnd);
			} else {
				//@ts-ignore
				localStream.write(chunk);
				_.debounce(async () => {
					downloaded += chunk.length;
					emitter.broadcast('sharing-progress', {
						size: remoteStat.size,
						loadedBytes: downloaded,
						phrase,
						send
					});
				})();
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
		const streamOpened = true;
		handleEvents(stream, () => {
			//@ts-ignore
			if (open.local) localStream?.end?.();
			open.local = true;
			if (streamOpened) stream.end();
		});
	}
	handleEvents(remoteStream, remoteEnd);
};

export const initiate = async ({ dkey, path, stat, send = true, phrase }) => {
	if (!hasPermission({ path, dkey, send })) return;
	emitter.log({ dkey, path, stat, send, phrase });
	const node = new DHT({ bootstrap: api.bootstrap_nodes });
	if (!phrase) phrase = randomWords({ exactly: 3, join: ' ' });
	const seed = hypercrypto.data(Buffer.from(phrase));
	const server = node.createServer();
	let connection = false;
	let cancelled = false;
	let destroyed = false;
	let _remoteStream;
	const cancelShare = () => {
		if (cancelled) return;
		_remoteStream?.end();
		server.close();
		emitter.broadcast(
			'notify-warning',
			`Cancelled ${send ? 'Sending' : 'Recieving in'} "${_.last(path.split('/')) || path}"`
		);
		cancelled = true;
	};
	const destroy = async () => {
		if (destroyed) return;
		api.removeSharing(phrase, send);
		emitter.off('cancel-sharing-' + send + phrase, cancelShare);
		emitter.log('sharing server connection closed');
		destroyed = true;
		await node.destroy();
	};
	server.on('connection', function (remoteStream) {
		if (connection) {
			remoteStream.end();
			return;
		}
		connection = true;

		remoteStream.on('error', (error) => {
			emitter.broadcast('notify-danger', error?.message);
			destroy();
		});
		remoteStream.on('close', destroy);
		_remoteStream = remoteStream;
		emitter.log(
			colors.gray('server Remote public key'),
			remoteStream.remotePublicKey.toString('hex')
		);
		emitter.log(colors.gray('server Local public key'), remoteStream.publicKey.toString('hex')); // same as keyPair.publicKey
		handleConnection({ dkey, path, stat, send, remoteStream, phrase, node }, server);
	});
	server.on('close', async () => {
		if (!cancelled && !destroyed)
			emitter.broadcast(
				'notify-success', //@ts-ignore
				`${send ? 'Sent' : 'Recieved'} "${api.getSharing(phrase, send)?.name}"`
			);
		destroy();
	});
	emitter.on('cancel-sharing-' + send + phrase, cancelShare);
	// make a ed25519 keypair to listen on
	const keyPair = DHT.keyPair(seed);

	// this makes the server accept connections on this keypair
	await server.listen(keyPair);

	api.addSharing({
		send,
		name: _.last(path.split('/')) || path,
		phrase,
		drive: api.getDrive(dkey)?.name || 'fs'
	});

	emitter.broadcast(
		'notify-info',
		`${send ? 'Sending' : 'Recieving in'} "${_.last(path.split('/')) || path}"`
	);
	return phrase;
};

export const connect = ({ dkey, path, stat, send = false, phrase }) => {
	if (!hasPermission({ path, dkey, send })) return;
	if (!phrase) phrase = randomWords({ exactly: 3, join: ' ' });
	const seed = hypercrypto.data(Buffer.from(phrase));
	const keyPair = DHT.keyPair(seed);
	const node = new DHT({ bootstrap: api.bootstrap_nodes });
	const remoteStream = node.connect(keyPair.publicKey, { keyPair });
	let destroyed = false;
	const cancelShare = async () => {
		if (destroyed) return;
		remoteStream.end();
		api.removeSharing(phrase, send);
		emitter.off('cancel-sharing-' + send + phrase, cancelShare);
		destroyed = true;
		emitter.broadcast(
			'notify-warning',
			`Cancelled ${send ? 'Sending' : 'Recieving in'} "${_.last(path.split('/')) || path}"`
		);
		await node.destroy();
	};
	emitter.on('cancel-sharing-' + send + phrase, cancelShare);

	remoteStream.on('open', function () {
		emitter.log(
			colors.gray('Client Remote public key'),
			remoteStream.remotePublicKey.toString('hex')
		);
		emitter.log(colors.gray('Client Local public key'), remoteStream.publicKey.toString('hex')); // same as keyPair.publicKey
		handleConnection({ dkey, path, stat, send, remoteStream, phrase, node });
	});
	remoteStream.on('error', async (error) => {
		if (destroyed) return;
		emitter.broadcast('notify-danger', error?.message);
		api.removeSharing(phrase, send);
		emitter.off('cancel-sharing-' + send + phrase, cancelShare);
		destroyed = true;
		await node.destroy();
	});
	remoteStream.on('close', async () => {
		if (destroyed) return;
		console.log(api.getSharing(phrase, send), api.getSharing());
		emitter.broadcast(
			'notify-success', //@ts-ignore
			`${send ? 'Sent' : 'Recieved'} "${api.getSharing(phrase, send)?.name}"`
		);
		api.removeSharing(phrase, send);
		emitter.off('cancel-sharing-' + send + phrase, cancelShare);
		destroyed = true;
		await node.destroy();
	});
	api.addSharing({
		send,
		name: _.last(path.split('/')) || path,
		phrase,
		drive: api.getDrive(dkey)?.name || 'fs'
	});
	emitter.broadcast(
		'notify-info',
		`${send ? 'Sending' : 'Recieving in'} "${_.last(path.split('/')) || path}"`
	);
};
