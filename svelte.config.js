import preprocess from 'svelte-preprocess';
import { resolve } from 'path';

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
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		vite: {
			resolve: {
				alias: {
					$store: resolve('src/store'),
					$components: resolve('src/components'),
					icons: resolve('node_modules/svelte-feather-icons/src/icons'),
					$icons: resolve('src/icons')
				}
			},
			server: {
				proxy: {
					'/_api': {
						target: 'http://127.0.0.1:3788',
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/_api/, '')
					}
				}
			}
		}
	}
};

export default config;
