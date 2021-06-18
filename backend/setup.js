import { Client as HyperspaceClient, Server as HyperspaceServer } from 'hyperspace';
import chalk from 'chalk';
import { Settings, setSettings } from './settings.js';
import Hyperbee from 'hyperbee';
import { getRandomStr } from './utils.js';

export const setupHyperspace = async ({
	host = undefined,
	storage = './storage/hyp-storage-1'
} = {}) => {
	let client;
	let server;

	try {
		client = new HyperspaceClient({
			host
		});
		console.log('daemon already running...');
		await client.ready();
	} catch (e) {
		// no daemon, start it in-process
		server = new HyperspaceServer({
			storage,
			host
		});
		await server.ready();

		server.on('client-open', () => {
			console.log(chalk.blue('A HyperspaceClient has connected'));
		});
		server.on('client-close', () => {
			console.log(chalk.blue('A HyperspaceClient has disconnected'));
		});

		client = new HyperspaceClient({
			host
		});
		await client.ready();
	}

	return {
		client,
		async cleanup() {
			await client.close();
			if (server) {
				console.log('Shutting down Hyperspace, this may take a few seconds...');
				if (server.opened) await server.stop();
				console.log(chalk.red('server closed'), server.closed);
			}
		}
	};
};

export async function setupBee({ _public = false, newbee = false } = {}) {
	let pHost;
	let beekey;
	if (!_public) {
		pHost = Settings().privateHost;
		if (pHost) {
			pHost = getRandomStr();
			setSettings('privateHost', pHost);
		}
	}
	// Setup the Hyperspace Daemon connection
	const { client, cleanup } = await setupHyperspace({ host: pHost });
	console.log('Hyperspace daemon connected, status:');
	console.log(await client.status());

	if (!newbee) beekey = Settings().beekey || undefined;

	// Create a Hyperbee
	let bee = new Hyperbee(client.corestore().get({ key: beekey, name: 'awesome-bee-db' }), {
		keyEncoding: 'utf8',
		valueEncoding: 'json'
	});
	await bee.ready();
	if (!bee.feed.writable) {
		bee.feed.close();
		bee = new Hyperbee(client.corestore().get({ name: 'awesome-bee-db' }), {
			keyEncoding: 'utf8',
			valueEncoding: 'json'
		});
		await bee.ready();
		beekey = bee.feed.key.toString('hex');
		setSettings('beekey', beekey);
	}

	if (!beekey) {
		beekey = bee.feed.key.toString('hex');
		setSettings('beekey', beekey);
	}

	console.log('bee initiated, key:');
	console.log('\t', beekey);
	client.network.configure(bee.feed.discoveryKey, { announce: _public, lookup: _public });
	// await client.replicate(bee.feed); // i don't wanna advertice my bee
	const cores = bee.sub('cores');
	const drives = bee.sub('drives');
	return { bee, client, cores, drives, cleanup };
}
