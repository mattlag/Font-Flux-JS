import { readFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const pkg = JSON.parse(
	readFileSync(resolve(__dirname, '../package.json'), 'utf-8'),
);

export default defineConfig({
	root: resolve(__dirname),
	base: './',
	build: {
		outDir: resolve(__dirname, 'dist'),
		emptyOutDir: true,
	},
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__BUILD_DATE__: JSON.stringify(new Date().toISOString().split('T')[0]),
	},
	resolve: {
		alias: {
			// The demo consumes the library exactly as an external npm consumer
			// would \u2014 only the public `font-flux-js` entry point, no subpaths.
			// This alias points the bare specifier at the source so the demo
			// always reflects the working tree without needing a `npm run build`.
			'font-flux-js': resolve(__dirname, '../src/main.js'),
		},
	},
	server: {
		port: 5174,
	},
});
