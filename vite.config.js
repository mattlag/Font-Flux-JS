// Root Vite config: builds the publishable library (`npm run build` → dist/)
// and configures Vitest (`npm test`). The demo app has its own config at
// demo/vite.config.js, invoked explicitly via `--config demo/vite.config.js`
// in the demo:dev / demo:build scripts, so the two configs never interfere.
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
		rollupOptions: {
			external: ['brotli-wasm', /^node:/],
		},
	},
	test: {
		include: ['test/**/*.test.js'],
	},
});
