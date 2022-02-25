import preprocess from 'svelte-preprocess';
import { resolve } from 'path';
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		preprocess({
			postcss: true
		})
	],

	kit: {
		adapter: adapter({ out: 'build/gui' }),
		vite: {
			resolve: {
				alias: {
					$store: resolve('src/store'),
					$components: resolve('src/components'),
					icons: resolve('node_modules/svelte-feather-icons/src/icons'),
					$icons: resolve('src/icons')
				}
			}
		}
	}
};

export default config;
