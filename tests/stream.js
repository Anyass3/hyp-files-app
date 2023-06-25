import Hyperswarm from 'hyperswarm';
import { Writable, Transform, Readable } from 'streamx';
const phrase = 'hello world';
const writable = new Writable({
	write(chunk, cb) {
		console.log(chunk);
		cb();
	}
});
let i = 0;
const readable = new Readable({
	read(cb) {
		if (i > 10) {
			this.push(null);
			cb(null);
			return;
		}
		this.push('hi idx' + i);
		i++;
		cb();
	}
});

const s1 = new Hyperswarm();
const s2 = new Hyperswarm();

s1.on('connection', async (socket, info) => {
	console.log('s1 connection');
	// readable.pipe(socket);

	for await (const data of socket) {
		console.log('socket data', data);
		socket.write(data);
	}
	socket.write(null);
});

s2.on('connection', (socket, info) => {
	console.log('s2 connection');
	socket.on('end', () => {
		console.log('s2 end');
	});
	socket.on('close', () => {
		console.log('s2 close');
	});
	socket.on('error', (err) => {
		console.log('s2 error', err);
	});
	socket.on('data', (data) => {
		console.log('s2 data', data);
	});
});

const topic = Buffer.alloc(32).fill(`v-${phrase}`);
(async () => {
	s1.join(topic, { server: true, client: true });
	await s1.flush();
	console.log('s1 flushed');
})();

(async () => {
	s2.join(topic, { server: true, client: true });
	await s2.flush();
	console.log('s2 flushed');
})();

writable.on('end', (a) => {
	console.log('writable end', a);
});
writable.on('close', (a) => {
	console.log('writable close', a);
});
readable.on('end', (a) => {
	console.log('readable end', a);
});
readable.on('close', (a) => {
	console.log('readable close', a);
});

// readable.pipe(writable);
