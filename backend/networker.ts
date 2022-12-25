import Networker from '@corestore/networker';

export default class extends Networker {
	// _open() {
	// 	const self = this;
	// 	if (this.swarm) return;
	// 	this.swarm = new Hyperswarm({
	// 		...this.opts,
	// 		announceLocalNetwork: true,
	// 		queue: { multiplex: true }
	// 	});
	// 	this.swarm.on('error', (err) => this.emit('error', err));
	// 	this.swarm.on('connection', (socket, info) => {
	// 		console.log('conntion');
	// 		const isInitiator = !!info.client;
	// 		if (socket.remoteAddress === '::ffff:127.0.0.1' || socket.remoteAddress === '127.0.0.1')
	// 			return null;
	// 		var finishedHandshake = false;
	// 		var processed = false;
	// 		const protocolStream = new HypercoreProtocol(isInitiator, { ...this._replicationOpts });
	// 		protocolStream.on('handshake', () => {
	// 			const deduped = info.deduplicate(protocolStream.publicKey, protocolStream.remotePublicKey);
	// 			if (!deduped) {
	// 				finishedHandshake = true;
	// 				self._addStream(protocolStream);
	// 			}
	// 			if (!processed) {
	// 				processed = true;
	// 				this._streamsProcessed++;
	// 				this.emit('stream-processed');
	// 			}
	// 		});
	// 		protocolStream.on('close', () => {
	// 			this.emit('stream-closed', protocolStream, info, finishedHandshake);
	// 			if (!processed) {
	// 				processed = true;
	// 				this._streamsProcessed++;
	// 				this.emit('stream-processed');
	// 			}
	// 		});
	// 		pump(socket, protocolStream, socket, (err) => {
	// 			if (err) this.emit('replication-error', err);
	// 			this._removeStream(protocolStream);
	// 		});
	// 		this.emit('stream-opened', protocolStream, info);
	// 		this._streamsProcessing++;
	// 	});
	// }
}
