module.exports = {
	mode: 'jit',
	purge: ['./src/**/*.{html,js,svelte,ts}', './src/**/**/*.{js,ts,svelte}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				glight: '#f5f5f5',
				primary: '#1976d2',
				danger: '#d32f2f',
				success: '#388e3c'
			}
		}
	},
	plugins: []
};
