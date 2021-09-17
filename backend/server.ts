//@ts-ignore
import { ConnectionsAcceptor, newServerKeypair as newKeypair } from 'connectome/server';
import colors from 'colors';
//@ts-ignore
import { MirroringStore } from 'connectome/stores';
import hyperspace from './connection.js';
import { execChildProcess, handleError, spawnChildProcess } from './utils.js';
import { getEmitter, makeApi } from './state.js';
import express from 'express';
import http from 'http';
import endpoints from './endpoints.js';
// import { Settings } from './settings.js';

// const config = Settings();

const stdin = process.stdin;
stdin.resume();
stdin.setEncoding('utf8');
let HOST = 'localhost';
const _h = process.argv.indexOf('-h');
if (process.argv[_h] === '-h') HOST = process.argv[_h + 1];
const emitter = getEmitter();
// console.log('process.argv', process.argv, 'host=' + HOST);

const enhanceChannel = (channel) => {
	return {
		emit: (...args) => {
			// emitter.log('in emit', args[0]);
			try {
				channel.emit(...args);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				emitter.log(colors.red('error: ' + error.message));
			}
		},
		on: (...args) => {
			// emitter.log('in on', args[0]);
			const listener = handleError(args[1], emitter);
			try {
				channel.on(args[0], listener);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				emitter.log(colors.red('error: ' + error.message));
			}
		},
		signal: (...args) => {
			// emitter.log('in signal', args[0]);
			try {
				channel.signal(...args);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				emitter.log(colors.red('error: ' + error.message));
			}
		},
		get key() {
			return channel._remotePubkeyHex;
		}
	};
};
const manageChildProcess = (api = makeApi()) => {
	emitter.on('child-process:spawn', async ({ cm, pid, broadcast }) => {
		emitter.log('spawn', { cm, pid });
		if (broadcast) emitter.broadcast('child-process:spawn', { cm, pid });
		api.addChildProcess({ pid, cm });
	});
	emitter.on('child-process:data', async ({ cm, pid, data, broadcast }) => {
		// emitter.log('data', { cm, pid, data: data.toString() });
		// emitter.broadcast('child-process:data', { cm, pid, data });
	});
	emitter.on('child-process:error', async ({ cm, pid, error, broadcast }) => {
		// emitter.log('error', { cm, pid, error: error.toString() });
		// emitter.broadcast('child-process:error', { cm, pid, error });
	});
	emitter.on('child-process:exit', async ({ pid, msg, broadcast }) => {
		emitter.log('exit', { pid, msg });
		api.removeChildProcess(pid);
		if (broadcast) emitter.broadcast('child-process:exit', msg);
	});
	emitter.on('child-process:kill', async (pid) => {
		spawnChildProcess('kill -9 ' + pid, { log: true })
			.then((_) => {})
			.catch((err) => {
				emitter.log(err);
				//  emitter.broadcast(err);
			});
	});
};
async function start() {
	const mirroringStore = new MirroringStore({ peers: [], drives: [] });
	const api = makeApi(mirroringStore);
	console.log('starting');

	process.on('SIGINT', async () => {
		emitter.broadcast('notify-warn', 'closing server ...');
		emitter.log(colors.cyan('cleaning up ...'));
		// api.cleanups.forEach(async (cleanup) => {
		// 	await cleanup();
		// 	console.log('doen');
		// });
		for (const cleanup of api.cleanups) await cleanup();
		console.log('process exit');
		process.exit();
	});
	process.on('uncaughtExceptionMonitor', async (err, origin) => {
		emitter.broadcast('notify-danger', 'uncaughtException::closing server ...');
		emitter.log(colors.red('uncaughtExceptionMonitor'), err, origin);
		emitter.log(colors.cyan('cleaning up ...'));
		for (let cleanup of api.cleanups) await cleanup();
		process.exit();
	});
	manageChildProcess(api);
	const port = process.env.PORT || 3788;
	const app = express();

	endpoints(app, api);
	//@ts-ignore
	const server = new http.Server(app);
	const keypair = newKeypair();
	const acceptor = new ConnectionsAcceptor({ port, server, keypair });

	acceptor.on('protocol_added', ({ protocol, lane }) => {
		emitter.log(`💡 Connectome protocol ${colors.cyan(protocol)}/${colors.cyan(lane)} ready.`);
		// emitter.log('acceptor', acceptor);
	});
	const onConnect = await hyperspace();
	const channelList = acceptor.registerProtocol({
		protocol: 'dmtapp',
		lane: 'hyp',
		onConnect: async ({ channel }) => onConnect({ channel: enhanceChannel(channel), api })
	});
	mirroringStore.mirror(channelList);

	channelList.on('new_channel', async (channel) => {
		channel.attachObject('dmtapp:hyp', api);
		emitter.log(colors.cyan(`channel.attachObject => dmtapp:hyp`));
		// make sure mpv is installed after every new connectome connection
		// it might be uninstalled anytime
		//@ts-ignore
		const isMpvInstalled = (await execChildProcess('apt list --installed mpv')).includes(
			'installed'
		);
		emitter.log('isMpvInstalled', isMpvInstalled);
		api.setIsMpvInstalled(isMpvInstalled);
	});

	// start websocket server
	acceptor.start();

	emitter.log(
		colors.green(`Connectome → Running websocket connections acceptor on port ${port} ...`)
	);
	//@ts-ignore
	server.listen(port, HOST);
}

start();
