
import archiver from 'archiver';
import randomWords from 'random-words';
import fs from 'fs';
import zlib from 'zlib';
import _ from 'lodash-es';
import { join } from 'path';
import { Writable, Transform } from 'streamx';
import { getEmitter, getApi } from './state.js';
import colors from 'kleur';
import type NoiseSecretStream from '@hyperswarm/secret-stream';
import { Settings } from './settings.js';
import { fsDrive } from './drive/fs.js';
import hyperswarm from 'hyperswarm';

const config = Settings();
const api = getApi();
const emitter = getEmitter();

const hasPermission = ({ path, dkey, send }) => {
	if (dkey === 'fs') {
		try {
			fs.accessSync(fsDrive.resolvePath(path), send ? fs.constants.R_OK : fs.constants.W_OK);
		} catch (err) {
			emitter.broadcast(
				'notify-danger',
				`sorry you do not have ${send ? 'read' : 'write'} access to '${_.last(path.split('/')) || path
				}'`
			);
			return false;
		}
	}
	return true;
};
export const initiateShare = async ({ dkey, path, stat, send = true, phrase }) => {
	if (!hasPermission({ path, dkey, send })) return;
	// emitter.log({ dkey, path, stat, send, phrase });
	if (!phrase) phrase = randomWords({ exactly: 3, join: ' ' });
	const trackingKey = phrase + send;

	const swarm = new hyperswarm({})
	let connection = false;
	let cancelled = false;
	let destroyed = false;
	let _remoteStream: NoiseSecretStream;
	const cancelShare = () => {
		if (cancelled) return;
		_remoteStream?.end(undefined);
		emitter.broadcast(
			'notify-warning',
			`Cancelled ${send ? 'Sending' : 'Recieving in'} "${_.last(path.split('/')) || path}"`
		);
		cancelled = true;
		destroy();
	};
	const destroy = async () => {
		if (destroyed) return;
		api.removeSharing(trackingKey);
		emitter.off('cancel-sharing-' + trackingKey, cancelShare);
		emitter.log('sharing server connection closed');
		destroyed = true;
		await swarm.destroy().catch(console.error);
	};
	swarm.on('connection', function (remoteStream: NoiseSecretStream) {
		if (connection) {
			remoteStream.end(undefined);
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
		handleConnection({ dkey, path, stat, send, remoteStream, phrase, destroy });
	});
	swarm.on('close', async () => {
		if (!cancelled && !destroyed)
			emitter.broadcast(
				'notify-success', //@ts-ignore
				`${send ? 'Sent' : 'Recieved'} "${api.getSharing(trackingKey)?.name}"`
			);
		destroy();
	});
	emitter.on('cancel-sharing-' + trackingKey, cancelShare);
	const topic = Buffer.alloc(32).fill(`${phrase}`)
	swarm.join(topic, { server: true, client: true })
	await swarm.flush();

	api.addSharing({
		key: trackingKey,
		name: _.last(path.split('/')) || path,
		data: phrase,
		drive: api.getDrive(dkey)?.name || 'fs',
		action: send ? 'send' : 'recieve'
	});

	emitter.broadcast(
		'notify-info',
		`${send ? 'Sending' : 'Recieving in'} "${_.last(path.split('/')) || path}"`
	);
	return phrase;
};



const handleConnection = async (
	{ dkey, path, stat, remoteStream, send, phrase, destroy }
) => {
	const trackingKey = phrase + send;
	// remoteStream is E2E between you and the other peer
	// pipe  it somewhere like any duplex stream
	stat['name'] = _.last(path.split('/'));
	path = dkey === 'fs' ? fsDrive.resolvePath(path) : path;
	let localStream;

	const open = { local: true, remote: true };
	const localEnd = async () => {
		if (open.local)
			try {
				localStream.end();
			} catch (error) { }

		open.local = false;
		if (!send) {
			destroy();
			console.log('localEnd');
		}
	};
	const remoteEnd = async () => {
		if (open.remote)
			try {
				remoteStream.end();
			} catch (error) { }
		open.remote = false;
		if (!send) {
			// destroy();
			console.log('remoteEnd');
		}
	};
	const handleEvents = (stream, endFn) => {
		stream.on('error', endFn);
		stream.on('end', endFn);
		stream.on('finish', endFn);
	};

	if (send) {
		const reportProgress = new Transform({
			transform(chunk, callback) {
				(async () => {
					uploaded += chunk.length;
					emitter.broadcast('sharing-progress', {
						size: stat.size,
						loadedBytes: uploaded,
						key: trackingKey
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
			} else localStream = fsDrive.createReadStream(path);
		} else {
			const drive = api.drives.get(dkey)!;
			if (!stat.isFile) {
				localStream = archiver('zip', {
					zlib: { level: 9 } // Sets the compression level.
				});
				const files = (await drive.$listAllFiles(path))!;
				for (const name of files) {
					localStream.append(await drive.get(name), { name });
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
					localStream = fsDrive.createWriteStream(path);
				} else {
					const drive = api.drives.get(dkey);
					localStream = drive?.createWriteStream(path);
				}
				api.updateSharing({ key: trackingKey, name: remoteStat.name });
				// handleEvents(localStream, localEnd);
				return;
			}
			if (!localStream) return;
			localStream.write(chunk);
			downloaded += chunk.length;
			emitter.broadcast('sharing-progress', {
				size: remoteStat.size,
				loadedBytes: downloaded,
				key: trackingKey
			});
		};

		const stream = new Writable({
			write(chunk, callback) {
				writeChunck(chunk);
				callback();
			},
			end() {
				this.push(null)
			}
		});
		remoteStream.pipe(zlib.createGunzip()).pipe(stream);
		const streamOpened = true;
		handleEvents(stream, () => {
			if (open.local) localStream?.end?.();
			open.local = false;
			if (streamOpened) stream.end(undefined);
		});
	}
	handleEvents(remoteStream, remoteEnd);
};
