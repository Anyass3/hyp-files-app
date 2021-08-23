import { ConnectionsAcceptor, newServerKeypair as newKeypair } from 'connectome/server';
import chalk from 'chalk';
import { MirroringStore } from 'connectome/stores';
import hyperspace from './hyperspace.js';
import { handleError, makeApi } from './utils.js';
import { getEmitter } from './state.js';
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
console.log('process.argv', process.argv, 'host=' + HOST);

const emitter = getEmitter();

const enhanceChannel = (channel) => {
	return {
		emit: (...args) => {
			// console.log('in emit', args[0]);
			try {
				channel.emit(...args);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				console.log(chalk.red('error: ' + error.message));
			}
		},
		on: (...args) => {
			// console.log('in on', args[0]);
			const listener = handleError(args[1], emitter);
			try {
				channel.on(args[0], listener);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				console.log(chalk.red('error: ' + error.message));
			}
		},
		signal: (...args) => {
			// console.log('in signal', args[0]);
			try {
				channel.signal(...args);
			} catch (error) {
				if (emitter) emitter.broadcast('notify-danger', error.message);
				console.log(chalk.red('error: ' + error.message));
			}
		},
		get key() {
			return channel._remotePubkeyHex;
		}
	};
};
async function start() {
	const mirroringStore = new MirroringStore({ peers: [], drives: [] });
	const api = makeApi(mirroringStore);

	process.on('SIGINT', async () => {
		console.log(chalk.cyan('cleaning up ...'));
		for (let cleanup of api.cleanups) await cleanup();
		process.exit();
	});
	process.on('uncaughtExceptionMonitor', async (err, origin) => {
		console.log(chalk.red('uncaughtExceptionMonitor'), err, origin);
		console.log(chalk.cyan('cleaning up ...'));
		for (let cleanup of api.cleanups) await cleanup();
		process.exit();
	});

	const port = process.env.PORT || 3788;
	const app = express();

	endpoints(app, api);

	const server = http.Server(app);
	const keypair = newKeypair();
	const acceptor = new ConnectionsAcceptor({ port, server, keypair });

	acceptor.on('protocol_added', ({ protocol, lane }) => {
		console.log(`💡 Connectome protocol ${chalk.cyan(protocol)}/${chalk.cyan(lane)} ready.`);
		// console.log('acceptor', acceptor);
	});
	const onConnect = await hyperspace();
	const channelList = acceptor.registerProtocol({
		protocol: 'dmtapp',
		lane: 'hyp',
		onConnect: async ({ channel }) => onConnect({ channel: enhanceChannel(channel), api })
	});
	mirroringStore.mirror(channelList);

	channelList.on('new_channel', (channel) => {
		channel.attachObject('dmtapp:hyp', api);
		console.log(chalk.cyan(`channel.attachObject => dmtapp:hyp`));
	});

	// start websocket server
	acceptor.start();

	console.log(
		chalk.green(`Connectome → Running websocket connections acceptor on port ${port} ...`)
	);

	server.listen(port, HOST);
}

start();
