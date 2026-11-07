// Root Vite config: builds the publishable library (`npm run build` → dist/)
// and configures Vitest (`npm test`). The demo app has its own config at
// demo/vite.config.js, invoked explicitly via `--config demo/vite.config.js`
// in the demo:dev / demo:build scripts, so the two configs never interfere.
import { readFileSync } from 'node:fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const pkg = JSON.parse(
	readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);
const banner = `/*!
 * Font Flux JS v${pkg.version}
 * Copyright (c) 2026 ${pkg.author}
 * Licensed under ${pkg.license}. See LICENSE for details.
 */`;

export default defineConfig({
	base: './',
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
			output: {
				banner,
			},
		},
	},
	test: {
		include: ['test/**/*.test.js'],
	},
});
