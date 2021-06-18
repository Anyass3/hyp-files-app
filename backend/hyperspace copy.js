import chalk from 'chalk';
import { MirroringStore } from 'connectome/stores';
import { setupBee } from './setup.js';
import { Settings, setSettings } from './settings.js';
import { emitter, getState, makeApi } from './utils.js';
import Drive from './drive.js';
import lodash from 'lodash';

async function startHyperCore({ client, sharedKey, isPrivate = false, dkey } = {}) {
	let isDriveSetup = false;
	let drive;

	let prevlogIdx = -1;
	const setPrevlogIdx = (idx) => (prevlogIdx = idx - 1);
	let logging = false;
	// Create a new RemoteCorestore.
	const store = client.corestore();

	// Create a fresh Remotehypercore.
	console.log('!!sharedKey', !!sharedKey, sharedKey);
	const core = store.get({
		key: sharedKey,
		valueEncoding: 'utf-8'
	});
	await core.ready(); // wait for keys to be populated

	if (core.writable) {
		await core.append(Settings().username);
		// let's create a new drive
		drive = await Drive(client.corestore(), dkey);
		isDriveSetup = true;
		await core.append(drive.key);
	}

	const setupNonIntiatorDrive = async () => {
		// runs only once
		console.log('listening...');
		if (!isDriveSetup) {
			drive = await Drive(client.corestore(), await Log(true));
			isDriveSetup = true;
		}
	};

	// create a messenger ext. any peer can send and recieve messages
	const messenger = core.registerExtension('chat', {
		encoding: 'utf-8',
		onmessage: (msg, peer) => {
			console.log(chalk.blue(`msg ${peer.remoteAddress}:`), chalk.green(msg));
		}
	});

	// logger for none intiators
	const Log = async (dkey = false) => {
		if (!core.writable) {
			for (let idx of lodash.range(prevlogIdx + 1, core.length)) {
				const feed = await core.get(idx);
				console.log(chalk.blue(`log ${idx + 1}:`), chalk.green(feed));
			}
		} else client.replicate(core);
		setPrevlogIdx(core.length);
		if (core.length) logging = true;
		if (dkey && core.length > 1) return await core.get(1);
	};

	core.on('append', () => {
		if (!core.writable && core.length && !logging) setupNonIntiatorDrive();
		else Log();
	});

	// Start seeding the Hypercore on the Hyperswarm network.
	console.log(chalk.gray('(local) seeding the Hypercore on the Hyperswarm network'));
	if (!isPrivate) client.replicate(core);

	// key to be shared by intiator
	console.log(chalk.gray('Core Key ' + core?.key?.toString?.('hex')));
	console.log(chalk.gray('Core Writable: ' + core?.writable)); // do we possess the private key of this core?

	// listens for msg or log inputs
	// msg = /(?:msg) (.+)/
	// log = /(?:log) (.+)/
	// emitter.on('message', (msg) => {
	// 	messenger.broadcast(msg);
	// 	console.log(chalk.greenBright('sent'));
	// });
	// emitter.on('feed', async (feed) => {
	// 	if (core.writable) {
	// 		await core.append(feed);
	// 		console.log(chalk.greenBright('logged'));
	// 	} else {
	// 		console.log(chalk.red("You don't have write log access"));
	// 	}
	// });

	if (!core.writable)
		setInterval(async () => {
			if (core.length && !logging) setupNonIntiatorDrive();
			try {
				// updates the log or feed
				await core.update();
			} catch (error) {
				// console.log(error.message, core.length);
			}
		}, 3000);
	return { core, drive };
}

export default async function onConnect({ channel }) {
	console.log(chalk.blue(`channel connected`));

	const store = new MirroringStore({ peers: [] });
	const api = await makeApi(store);
	channel.attachObject('dmtapp:hyp:peers', api);

	const { client, cores, drives, cleanup } = await setupBee();
	let publicCoreKey = (await cores.get('public'))?.value;
	let publicDriveKey = (await drives.get('public'))?.value;
	// let private_core = (await cores.get('private'))?.value;
	// let private_drive = (await drives.get('private'))?.value;
	const { drive, core } = await startHyperCore({
		client,
		key: publicCoreKey,
		dkey: publicDriveKey
	});

	if (!publicCoreKey && core.writable) {
		cores.put('public', core?.key?.toString?.('hex'));
	}
	if (!publicDriveKey && drive.writable) {
		cores.put('public', drive.key);
	}
	// core or feed events
	core.on('peer-add', async (peer) => {
		// Log when the core has any new peers.
		console.log(chalk.gray('Replicating with a new peer from ' + peer.remoteAddress));
	});
	core.on('peer-remove', async (peer) => {
		// Log when the core a peer is disconnected.
		console.log(chalk.gray('peer disconnected ' + peer.remoteAddress));
		api.removePeer(peer.key.toString('hex'));
	});

	emitter.on('setup peer drive', async (dkey, peerCore) => {
		console.log('hi there :: peer drive');
		const corekey = peerCore.key.toString('hex');
		const drivekey = peerDrive.key;
		api.addPeer({
			corekey,
			drivekey,
			name: peerCore.get(0)
		});
		api.addPeerCore(corekey, peerCore);
		api.addPeerDrive(drivekey, peerDrive.drive);
	});

	channel.on('get settings', async () => {
		console.log('getting settings');
		channel.signal('settings', Settings());
	});

	channel.on('set settings', Settings);

	// channel.on('disconnect', cleanup);
}
