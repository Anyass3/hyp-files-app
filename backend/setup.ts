import colors from 'kleur';
import type { CorestoreNetworker } from './types';
import Corestore from 'corestore';
import Networker from '@corestore/networker';
import { Settings, setSettings } from './settings.js';
import Hyperbee from 'hyperbee';
import { getEmitter, getBeeState, getApi } from './state.js';
import { v4 as uuidV4 } from 'uuid';
import { resolve, join } from 'path';
import { toPromises } from 'hypercore-promisifier';
import fs from 'fs';
// const Networker = {};
// #TODO create a change host name to avoid storage misplacement
const api = getApi();
const emitter = getEmitter();

export const setupCorestore = async (
	{ storage = Settings().publicStorage, oldStorage = null, network = true } = {} as {
		storage?;
		oldStorage?;
		network?: boolean;
	}
) => {
	let parentStorage = Settings().storage;
	if (!parentStorage) {
		parentStorage = './.storage';
		setSettings('storage', parentStorage);
	}
	if (!storage) {
		storage = 'public';
		setSettings('publicStorage', storage);
	}
	// let server;
	let storagePath = resolve(join(parentStorage, storage));
	if (oldStorage) {
		const oldStoragePath = resolve(join(parentStorage, oldStorage));
		if (fs.existsSync(oldStoragePath)) {
			try {
				fs.renameSync(oldStoragePath, storagePath);
			} catch (error) {
				setSettings('privateStorage', oldStorage);
				storagePath = oldStoragePath;
			}
		}
	}
	const corestore = new Corestore(storagePath);
	await corestore.ready();
	if (network) {
		const networker = new Networker(corestore, {
			bootstrap: api.bootstrap_nodes
		}) as CorestoreNetworker;
		return {
			corestore,
			networker,
			async cleanup() {
				// await corestore.close();
				await networker.close();
			}
		};
	}

	return {
		corestore,
		async cleanup() {
			// await corestore.close();
		}
	};
};

export async function setupBee(newbee = false) {
	let beekey;
	const oldStorage = Settings().privateStorage;
	const storage = uuidV4().replace(/-/g, '');
	// console.log('storage', storage, oldStorage);
	// at every startup it creates a new unique private storage path
	// for security even our pc cannot access our drive without knowing the storage path
	setSettings('privateStorage', storage);

	const { corestore, cleanup } = await setupCorestore({ storage, oldStorage, network: false });

	if (!newbee) beekey = Settings().beekey || undefined;
	const mainStore = corestore.namespace('main-feeds-store');
	// Create a Hyperbee
	let bee = new Hyperbee(mainStore.get({ key: beekey, name: 'awesome-bee-db' }), {
		keyEncoding: 'utf8',
		valueEncoding: 'json'
	});

	await bee.ready();
	// console.log(' ready');
	if (!bee.feed.writable) {
		bee.feed.close();
		bee = new Hyperbee(mainStore.get({ name: 'awesome-bee-db' }), {
			keyEncoding: 'utf8',
			valueEncoding: 'json'
		});
		await bee.ready();
		beekey = bee.feed.key.toString('hex');
		setSettings('beekey', beekey);
	}
	console.log(colors.gray('Hyperbee initiated, key: ' + beekey));

	if (!beekey) {
		beekey = bee.feed.key.toString('hex');
		setSettings('beekey', beekey);
	}
	const loggerKey = await bee.sub('cores').get('logger');
	console.log(colors.gray('loggerKey:'), loggerKey);

	const logger = toPromises(mainStore.get({ name: 'logger', valueEncoding: 'json' }));
	await logger.ready(); // wait for keys to be populated

	// logger.on('append', async () => {
	// 	if (Settings().debug) {
	// 		try {
	// 			const log = await logger.get(logger.length - 1);
	// 			console.log(log.datetime, ...log.data);
	// 		} catch (error) {
	// 			console.log('logger:error', error);
	// 		}
	// 	}
	// });

	emitter.on('logger', async (...data) => {
		const log = { datetime: colors.gray(new Date().toLocaleString()), data };
		if (Settings().debug) console.log(log.datetime, ...log.data);
		if (!Settings().log) return;
		await logger.append(log);
	});

	emitter.log(colors.gray('Core Key ' + logger?.key?.toString?.('hex')));
	emitter.log(colors.gray('Core Writable: ' + logger?.writable)); // do we possess the private key of this core?

	if (!loggerKey) {
		bee.sub('cores').put('logger', logger.key.toString('hex'));
	}

	const dataUsageBee = bee.sub('data-usage', { valueEncoding: 'utf-8' });

	emitter.on(
		'set-data-usage',
		async ({ driveName = 'other', byteLength = 0, sub = 'download' } = {}) => {
			const today = new Date().toLocaleString('en', { dateStyle: 'short' });
			const subDriveUsageBee = dataUsageBee.sub(driveName).sub(sub);
			const todayUsage = await subDriveUsageBee.get(today);
			const currentUsage = (parseInt(todayUsage?.value) || 0) + byteLength;
			subDriveUsageBee.put(today, currentUsage);
			emitter.emit('data-usage', { driveName, currentUsage, sub });
			emitter.log('data-usage', { driveName, currentUsage, sub, todayUsage, byteLength });
			return currentUsage;
		}
	);

	const corestoresBee = bee.sub('core-stores-db');

	const getNamespace = async (key) => {
		const namespace = key ? (await corestoresBee.get(key))?.value : null;
		emitter.log('getNamespace', { key, namespace });
		return namespace;
	};
	const setNamespace = async (key, namespace) => {
		corestoresBee.put(key, namespace);
	};

	// for await (const { key, value } of dataUsageBee
	// 	.sub('server')
	// 	.sub('download')
	// 	.createReadStream()) {
	// 	console.log('data-usage', { key, value });
	// }
	return { bee, corestore, cleanup, getNamespace, setNamespace };
}
