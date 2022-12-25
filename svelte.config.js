import adapter from '@sveltejs/adapter-node';
import { resolve } from 'path';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({ out: 'build/gui' }),

		alias: {
			$store: resolve('src/store'),
			$components: resolve('src/components'),
			icons: resolve('node_modules/svelte-feather-icons/src/icons'),
			$icons: resolve('src/icons')
		}
	}
};

export default config;
