import { Client as HyperspaceClient, Server as HyperspaceServer } from 'hyperspace';
import chalk from 'chalk';
import { Settings, setSettings } from './settings.js';
import Hyperbee from 'hyperbee';
import { v4 as uuidV4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// #TODO create a change host name to avoid storage misplacement

export const setupHyperspace = async ({ host = Settings().host, oldhost } = {}) => {
	if (!host) {
		host = 'AwesomeSocket';
		setSettings('host', host);
	}
	let client;
	let server;

	let storage = path.resolve(path.join('./storage', host));
	if (oldhost) {
		const oldstorage = path.resolve(path.join('./storage', oldhost));
		if (fs.existsSync(oldstorage)) {
			fs.renameSync(oldstorage, storage);
		}
	}
	try {
		client = new HyperspaceClient({
			host
		});
		await client.ready();
		console.log('daemon already running');
	} catch (e) {
		console.log(e.message);
		// no daemon, start it in-process
		server = new HyperspaceServer({
			storage,
			host
		});
		await server.ready();
		console.log('server is ready');

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

export async function setupBee({ replicate = false, newbee = false } = {}) {
	let host;
	let beekey;
	let oldhost;
	if (!replicate) {
		oldhost = Settings().privateHost;
		host = uuidV4().replace(/-/g, '');
		console.log('host', host);
		// at every startup it creates a new unique private host
		// for security even our pc cannot access our drive without knowing the host
		// because we are not going to advertise it.
		setSettings('privateHost', host);
	}
	// Setup the Hyperspace Daemon connection
	const { client, cleanup } = await setupHyperspace({ host, oldhost });
	console.log('Hyperspace daemon connected, status:');
	console.log(await client.status());

	if (!newbee) beekey = Settings().beekey || undefined;

	// Create a Hyperbee
	console.log('Create a Hyperbee');
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
	client.network.configure(bee.feed, { announce: replicate, lookup: replicate });
	// await client.replicate(bee.feed); // i don't wanna advertice my bee
	const cores = bee.sub('cores');
	const drives = bee.sub('drives');
	console.log('bee no probs');
	return { bee, client, cores, drives, cleanup };
}
