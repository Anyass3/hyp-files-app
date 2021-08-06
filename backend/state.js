import { Emitter } from './utils.js';

let emitter;

export const getEmitter = () => {
	console.log('get emitter');
	if (!emitter) {
		console.log('new emitter');
		emitter = new Emitter();
	}
	return emitter;
};
