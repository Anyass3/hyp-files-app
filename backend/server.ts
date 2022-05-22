import { Connectome, newServerKeypair as newKeypair } from 'connectome/server';
import type { Channel } from 'connectome/typings';
import DHT from '@hyperswarm/dht';
import colors from 'colors';
//@ts-ignore
import hyperspace from './connection.js';
import { execChildProcess, handleError, spawnChildProcess } from './utils.js';
import { getEmitter, getApi } from './state.js';
import express from 'express';
import http from 'http';
import endpoints from './endpoints.js';

const stdin = process.stdin;
stdin.resume();
stdin.setEncoding('utf8');
let HOST = 'localhost';
if (process.argv.includes('--host')) HOST = '0.0.0.0';

const emitter = getEmitter();
const api = getApi();

const enhanceChannel = (channel: Channel) => {
	return {
		emit: (event, data) => {
			// emitter.log('in emit', args[0]);
			try {
				channel.emit(event, data);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				emitter.log(colors.red('error: ' + error.message));
			}
		},
		on: (event, listener) => {
			// emitter.log('in on', args[0]);
			listener = handleError(listener, emitter);
			try {
				channel.on(event, listener);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				emitter.log(colors.red('error: ' + error.message));
			}
		},
		signal: (event, data) => {
			// emitter.log('in signal', args[0]);
			try {
				channel.signal(event, data);
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
const manageChildProcess = () => {
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
	const getBootstrap = ({ address, port }) => ({ host: address, port });
	const bootstrapper1 = new DHT({ ephemeral: true });
	await bootstrapper1.ready();

	const bootstrapper2 = new DHT({
		bootstrap: [getBootstrap(bootstrapper1.address())],
		ephemeral: false
	});
	await bootstrapper2.ready();
	api.bootstrap_nodes = [
		...bootstrapper1.bootstrapNodes,
		getBootstrap(bootstrapper1.address()),
		getBootstrap(bootstrapper2.address())
	];

	console.log(colors.cyan('bootstrap_nodes'), api.bootstrap_nodes);
	console.log('starting');

	manageChildProcess();
	//@ts-ignore
	const port: number = process.env.PORT || 3788;
	const app = express();

	endpoints(app);
	//@ts-ignore
	const server = new http.Server(app);
	const keypair = newKeypair();
	const connectome = new Connectome({ port, server, keypair });

	connectome.on('protocol_added', ({ protocol }) => {
		emitter.log(`💡 Connectome protocol ${colors.cyan(protocol)} ready.`);
		// emitter.log('connectome', connectome);
	});
	const onConnect = await hyperspace();
	const channelList = connectome.registerProtocol({
		protocol: 'dmtapp/hyp',
		onConnect: async ({ channel }) => onConnect({ channel: enhanceChannel(channel) })
	});
	api.protocolStore.syncOver(channelList);

	channelList.on('new_channel', async (channel: Channel) => {
		channel.attachObject('dmtapp:hyp', api);
		emitter.log(colors.cyan(`channel.attachObject => dmtapp:hyp`));
		// make sure mpv is installed after every new connectome connection
		// it might be uninstalled anytime
		//@ts-ignore
		let isMpvInstalled = false;

		try {
			isMpvInstalled = (await execChildProcess('apt list --installed mpv'))
				.toLowerCase()
				.includes('installed');
		} catch (error) {
			try {
				isMpvInstalled = (await execChildProcess('dnf list --installed mpv'))
					.toLowerCase()
					.includes('installed');
			} catch (error) {
				//
			}
		}
		emitter.log('isMpvInstalled', isMpvInstalled);
		api.setIsMpvInstalled(isMpvInstalled);
	});

	// start websocket server
	connectome.start();

	emitter.log(
		colors.green(`Connectome → Running websocket connections connectome on port ${port} ...`)
	);
	//@ts-ignore
	server.listen(port, HOST);
}

/**
 * @starts the app
 */

start();

/**
 * @handles exections and process exits
 */
process.on('SIGINT', async () => {
	emitter.broadcast('notify-warn', 'closing server ...');
	emitter.log(colors.cyan('cleaning up ...'));
	// api.cleanups.forEach(async (cleanup) => {
	// 	await cleanup();
	// 	console.log('doen');
	// });
	const timeout = setTimeout(() => {
		emitter.broadcast('notify-danger', 'server closed');
		process.exit();
	}, 50000);
	for (const cleanup of api.cleanups) await cleanup();
	clearTimeout(timeout);
	console.log('process exit');
	emitter.broadcast('notify-danger', 'server closed');
	process.exit();
});
let uncaughtExceptions = 0;
let uncaughtExceptionsTimeoutId;
process.on('uncaughtException', async (err, origin) => {
	clearTimeout(uncaughtExceptionsTimeoutId);
	emitter.log(colors.red('uncaughtException'), err, origin);
	emitter.broadcast('notify-danger', err.message);
	if (uncaughtExceptions > 5) {
		emitter.broadcast(
			'notify-danger',
			uncaughtExceptions + ' uncaughtException in 30 secs. closing server ...'
		);
		emitter.log(colors.cyan('cleaning up ...'));
		for (let cleanup of api.cleanups) await cleanup();
		process.exit();
	} else {
		uncaughtExceptions += 1;
		uncaughtExceptionsTimeoutId = setTimeout(() => (uncaughtExceptions = 0), 30000);
	}
});
