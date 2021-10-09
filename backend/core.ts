// import lodash from 'lodash';
import colors from 'colors';
import { Settings } from './settings.js';

export default async function ({ corestore, networker, key, valueEncoding = 'utf-8', writable }) {
	console.log('startCore', { key, writable });
	let core = corestore.get({
		key,
		valueEncoding
	});

	await core.ready(); // wait for keys to be populated
	if (writable && !core.writable) {
		await core.close();
		core = corestore.get();
		await core.ready(); // wait for keys to be populated
	}

	if (networker)
		networker.configure(core.discoveryKey, {
			server: core.writable,
			client: !core.writable
		});
	// key to be shared by intiator
	console.log(colors.gray('Core Key ' + core?.key?.toString?.('hex')));
	console.log(colors.gray('Core Writable: ' + core?.writable)); // do we possess the private key of this core?
	// core or feed events
	core.on('peer-add', async (peer) => {
		// Log when the core has any new peers.
		console.log(colors.gray('Replicating with a new peer from ' + peer.remoteAddress));
	});
	core.on('peer-remove', async (peer) => {
		// Log when the core a peer is disconnected.
		console.log(colors.gray('peer disconnected ' + peer.remoteAddress));
		// api.removePeer(peer.key.toString('hex'));
	});
	return core;
}
