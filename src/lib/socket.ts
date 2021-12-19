import { browser } from '$app/env'; // @ts-ignore
import { connect } from 'connectome';
import { port } from './getAPi';

export default () => {
	if (!browser) return;

	const protocol = 'dmtapp/hyp';

	const connector = connect({ protocol, port });
	// console.log('store', store);
	return {
		socket: connector,
		api: connector.remoteObject?.('dmtapp:hyp'),
		serverStore: connector.state
	};
};
