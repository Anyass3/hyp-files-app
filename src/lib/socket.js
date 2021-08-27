import { browser } from '$app/env'; // @ts-ignore
import { ConnectedStore } from 'connectome/stores';

export default () => {
	if (!browser) return;
	const address = window.location.hostname;

	const port = '3788';

	const protocol = 'dmtapp';

	const lane = 'hyp';

	const store = new ConnectedStore({ address, protocol, port, lane });
	// console.log('store', store);
	return {
		socket: store.connector,
		api: store.remoteObject?.bind?.(store)?.('dmtapp:hyp'),
		serverStore: store
	};
};
