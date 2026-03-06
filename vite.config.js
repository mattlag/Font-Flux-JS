import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/main.js'),
			name: 'FontFluxJS',
			fileName: 'font-flux-js',
			formats: ['es'],
		},
		outDir: 'dist',
	},
	test: {
		include: ['test/**/*.test.js'],
	},
});
