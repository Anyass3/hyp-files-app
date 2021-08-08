import PromptSync from 'prompt-sync';
import { Client as HyperspaceClient, Server as HyperspaceServer } from 'hyperspace';
import chalk from 'chalk';
import lodash from 'lodash';
import hyperdrive from 'hyperdrive';
import fs from 'fs';
import path from 'path';
const prompt = PromptSync({ sigint: true });
const stdin = process.stdin;
stdin.resume();
stdin.setEncoding('utf8');
let KEY, DKEY;
process.argv.forEach((arg) => {
	const k = /^key=([\w-]+)$/.exec(arg)?.[1];
	const dk = /^dkey=([\w-]+)$/.exec(arg)?.[1];
	if (k) KEY = k;
	else if (dk) DKEY = dk;
});
console.log('process.argv', 'key=' + KEY, 'dkey=' + DKEY);
///home/abdoulie/Downloads/learn german
const emitter = {
	events: {},
	emit(event, ...data) {
		this.events[event]?.forEach?.(async (fn) => {
			try {
				return await fn(...data);
			} catch (error) {
				console.log(chalk.red('error: ' + error.message));
			}
		});
	},
	on(event, fn) {
		const fns = this.events[event] || [];
		this.events[event] = fns.concat(fn);
	}
};

stdin.on('data', async (text) => {
	const msg = /(?:msg) +(.+)/.exec(text)?.[1];
	const feed = /(?:log) +(.+)/.exec(text)?.[1];
	const drive = /(?:drive) +([\w]+)(?: +(.+))*/.exec(text);
	if (msg) {
		emitter.emit('message', msg);
	} else if (feed) {
		emitter.emit('feed', feed);
	} else if (drive?.[1]) {
		const event = `drive:${drive[1]}`;
		const args = drive[2]?.trim?.()?.split?.(/[ ]+/) || [];
		emitter.emit(event, ...args);
	}
});

async function startHyperSpace() {
	const sharedKey = KEY || prompt('Input a hypercore key to clone or press enter: ') || undefined;
	let isDriveSetup = false;
	// return;
	// Setup the Hyperspace Daemon connection
	// =
	const { client, cleanup } = await setupHyperspace();
	console.log('Hyperspace daemon connected, status:');
	console.log(await client.status());

	{
		let prevlogIdx = -1;
		const setPrevlogIdx = (idx) => (prevlogIdx = idx - 1);
		let logging = false;
		// Create a new RemoteCorestore.
		const store = client.corestore();

		// Create a fresh Remotehypercore.
		const core = store.get({
			key: sharedKey,
			valueEncoding: 'utf-8'
		});

		await core.ready(); // wait for some keys to be populated

		// let's create a new drive
		if (core.writable) {
			setupDrive(client.corestore(), DKEY);
			isDriveSetup = true;
		}
		emitter.on('drive key', async (key) => {
			if (core.writable) await core.append(key);
		});
		const setupNonIntiatorDrive = async () => {
			// runs only once
			console.log('listening...');
			if (!isDriveSetup) {
				setupDrive(client.corestore(), await Log(true));
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

		// Append a block to the RemoteHypercore. Only intiators can append
		if (core.writable) await core.append('greeting logs!');

		// logger funtion for none intiators
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

		// core or feed events
		core.on('peer-add', async (peer) => {
			// Log when the core has any new peers.
			console.log(chalk.gray('(local) Replicating with a new peer from ' + peer.remoteAddress));
		});
		core.on('peer-remove', async (peer) => {
			// Log when the core a peer is disconnected.
			console.log(chalk.gray('(local) peer disconnected ' + peer.remoteAddress));
		});
		core.on('append', () => {
			if (!core.writable && core.length && !logging) setupNonIntiatorDrive();
			else Log();
		});

		// Start seeding the Hypercore on the Hyperswarm network.
		console.log(chalk.gray('(local) seeding the Hypercore on the Hyperswarm network'));
		client.replicate(core);

		// key to be shared by intiator
		console.log(chalk.gray('Core Key ' + core?.key?.toString?.('hex')));
		console.log(chalk.gray('Core Writable: ' + core?.writable)); // do we possess the private key of this core?

		// listens for msg or log inputs
		// msg = /(?:msg) (.+)/
		// log = /(?:log) (.+)/
		emitter.on('message', (msg) => {
			messenger.broadcast(msg);
			console.log(chalk.greenBright('sent'));
		});
		emitter.on('feed', async (feed) => {
			if (core.writable) {
				await core.append(feed);
				console.log(chalk.greenBright('logged'));
			} else {
				console.log(chalk.red("You don't have write log access"));
			}
		});

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

		process.on('SIGINT', cleanup);
	}
}

async function setupDrive(store, dkey = null) {
	console.log(chalk.cyan('setting up drive'));
	const drive = hyperdrive(store, dkey);
	await drive.promises.ready();
	emitter.emit('drive key', drive.key.toString('hex'));
	console.log(chalk.gray('drive key ' + drive.key.toString('hex'))); // the drive's public key, used to identify it
	// console.log('    Discovery Key:', drive.discoveryKey.toString('hex')); // the drive's discovery key for the DHT
	console.log(chalk.gray('Drive Writable: ' + drive.writable)); // do we possess the private key of this drive?

	// some useful funtions
	const readDir = async (dir, { dest = '/', isdrive = true } = {}) => {
		let items;
		if (isdrive) items = await drive.promises.readdir(dir);
		else items = fs.readdirSync(dir);
		return items.map((item) => ({
			name: item,
			path: path.join(dir, item),
			new_path: dest.endsWith('/')
				? path.join(lodash.last(dir.split('/')) || '/', item)
				: '/' + item
		}));
	};
	const fsMakeDir = async (dest) => {
		if (!fs.existsSync(path.resolve(dest))) fs.mkdirSync(path.resolve(dest));
	};
	const driveMakeDir = async (dir) => {
		const exists = await drive.promises.exists(dir);
		if (!exists) await drive.promises.mkdir(dir);
	};
	const fsWriteDir = async (dirList, fs_dest) => {
		for (let item of dirList) {
			const isdir = (await drive.promises.stat(item.path)).isDirectory();
			const _fs_dest = path.resolve(path.join(fs_dest, item.new_path));
			if (isdir) {
				await fsMakeDir(_fs_dest);
				const items = await readDir(item.path);
				if (items.length) await fsWriteDir(items, fs_dest);
			} else {
				const destFile = fs.createWriteStream(_fs_dest);
				drive.createReadStream(item.path).pipe(destFile);
			}
		}
	};
	const driveWriteDir = async (dirList, drive_dest) => {
		for (let item of dirList) {
			const isdir = fs.statSync(item.path).isDirectory();
			const _drive_dest = path.join(drive_dest, item.new_path);
			if (isdir) {
				await driveMakeDir(_drive_dest);
				const items = await readDir(item.path, { isdrive: false });
				if (items.length) await driveWriteDir(items, drive_dest);
			} else {
				const destFile = drive.createWriteStream(_drive_dest);
				fs.createReadStream(item.path).pipe(destFile);
			}
		}
	};

	emitter.on('drive:ls', async (dir = '/') => {
		const list = await drive.promises.readdir(dir, { recursive: true, includeStats: true });
		console.log(
			'\tListing:',
			list.map((item) => ({
				name: item.name,
				path: item.path,
				stat: { isFile: item.stat.isFile(), size: item.stat.size }
			}))
		);
	});
	emitter.on('drive:write', async (file, ...content) => {
		await drive.promises.writeFile(file, content.join(' '));
		console.log(chalk.green('\t✓ written ' + file));
	});
	emitter.on('drive:put', async (...args) => {
		emitter.emit('drive:write', ...args);
	});
	emitter.on('drive:read', async (file) => {
		const content = await drive.promises.readFile(file, 'utf8');
		console.log('\tContent:', content);
	});
	emitter.on('drive:dl', async (...dirs) => {
		if (dirs.length === 0) {
			await drive.promises.download('/');
			console.log(chalk.green('\t downloaded all '));
		} else
			for (let dir of dirs) {
				await drive.promises.download(dir);
				console.log(chalk.green('\t downloaded: ' + dir));
			}
	});
	emitter.on('drive:mkdir', async (...dirs) => {
		for (let dir of dirs) {
			await drive.promises.mkdir(dir);
			console.log(chalk.green('\t✓ mkdir ' + dir));
		}
	});
	emitter.on('drive:cp', async (source, dest) => {
		drive.createReadStream(source).pipe(drive.createWriteStream(dest));
		console.log(chalk.green('\t copied: ' + source + ' ' + dest));
	});
	emitter.on('drive:rmdir', async (...dirs) => {
		for (let dir of dirs) {
			await drive.promises.rmdir(dir, { recursive: true });
			console.log(chalk.green('\t✓ rmdir ' + dir));
		}
	});
	emitter.on('drive:rm', async (...files) => {
		for (let file of files) {
			await drive.promises.unlink(file); // delete the copy
			console.log(chalk.green('\t✓ rm ' + file));
		}
	});
	emitter.on('drive:export', async (drive_src = './', fs_dest = './') => {
		const isFile = (await drive.promises.stat(drive_src)).isFile();
		if (isFile) {
			if (fs_dest.endsWith('/') || fs_dest === '.') {
				const filename = lodash.last(drive_src.split('/'));
				fs_dest = path.join(fs_dest, filename);
			}
			const destFile = fs.createWriteStream(path.resolve(fs_dest));
			drive.createReadStream(drive_src).pipe(destFile);
		} else {
			const items = await readDir(drive_src, { dest: fs_dest });
			await fsMakeDir(fs_dest);
			await fsWriteDir(items, fs_dest);
		}
		console.log(chalk.green('\t✓ exported drive:' + drive_src + ' to fs:' + fs_dest));
	});
	emitter.on('drive:import', async (fs_src = './', drive_dest = './') => {
		const isFile = fs.statSync(fs_src).isFile();
		if (isFile) {
			if (drive_dest.endsWith('/') || drive_dest === '.') {
				const filename = lodash.last(fs_src.split('/'));
				drive_dest = path.join(drive_dest, filename);
			}
			const destFile = drive.createWriteStream(drive_dest);
			fs.createReadStream(fs_src).pipe(destFile);
		} else {
			const items = await readDir(fs_src, { dest: drive_dest, isdrive: false });
			await driveMakeDir(drive_dest);
			await driveWriteDir(items, drive_dest);
		}
		console.log(chalk.green('\t✓ imported fs:' + fs_src + ' to drive' + drive_dest));
	});
}

async function setupHyperspace() {
	let client;
	let server;

	try {
		client = new HyperspaceClient({
			host: 'hyperspace-demo-copy'
		});
		await client.ready();
	} catch (e) {
		// no daemon, start it in-process
		server = new HyperspaceServer({
			storage: './storage/hyperspace-storage-1-copy',
			host: 'hyperspace-demo-copy'
		});
		await server.ready();

		server.on('client-open', () => {
			console.log(chalk.blue('A HyperspaceClient has connected'));
		});
		server.on('client-close', () => {
			console.log(chalk.blue('A HyperspaceClient has disconnected'));
		});

		client = new HyperspaceClient({
			host: 'hyperspace-demo-copy'
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
			process.exit();
		}
	};
}

startHyperSpace();
