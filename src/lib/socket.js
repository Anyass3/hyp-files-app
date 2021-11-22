import { browser } from '$app/env'; // @ts-ignore
import { connect } from 'connectome';
import { port } from './getAPi';

export default () => {
	if (!browser) return;
	const address = window.location.hostname;

	const protocol = 'dmtapp/hyp';

	const connector = connect({ address, protocol, port });
	// console.log('store', store);
	return {
		socket: connector,
		api: connector.remoteObject?.bind?.('dmtapp:hyp'),
		serverStore: connector.state
	};
};
