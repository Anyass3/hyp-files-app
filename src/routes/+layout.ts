import { browser } from '$app/environment';
import store from '$store';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	if (browser) {
		store.dispatch('startConnection');
	}
	return {};
};
