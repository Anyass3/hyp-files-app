import { browser } from '$app/environment';
import { connect } from 'connectome';
import { port } from './getAPi';

export default () => {
	if (!browser) return;

	const protocol = 'dmtapp/hyp';

	const connector = connect({ protocol, port });
	// console.log('store', store);
	connector.connectionState.subscribe(state=>{
		console.log(state)
	})
	connector.state.subscribe(state=>{
		console.log(state)
	})
	return {
		socket: connector,
		api: connector.remoteObject?.('dmtapp:hyp'),
		serverStore: connector.state
	};
};
