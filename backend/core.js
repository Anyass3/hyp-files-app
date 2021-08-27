// import lodash from 'lodash';
import chalk from 'chalk';
import Drive from './drive.js';
import { Settings } from './settings.js';

export default async function (client, key, valueEncoding = 'utf-8') {
	// Create a new RemoteCorestore.
	const store = client.corestore();

	// Create a fresh Remotehypercore.
	const core = store.get({
		key,
		valueEncoding
	});

	await core.ready(); // wait for keys to be populated
	// key to be shared by intiator
	console.log(chalk.gray('Core Key ' + core?.key?.toString?.('hex')));
	console.log(chalk.gray('Core Writable: ' + core?.writable)); // do we possess the private key of this core?
	// core or feed events
	core.on('peer-add', async (peer) => {
		// Log when the core has any new peers.
		console.log(chalk.gray('Replicating with a new peer from ' + peer.remoteAddress));
	});
	core.on('peer-remove', async (peer) => {
		// Log when the core a peer is disconnected.
		console.log(chalk.gray('peer disconnected ' + peer.remoteAddress));
		// api.removePeer(peer.key.toString('hex'));
	});
	return core;
}
