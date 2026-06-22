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
			// would — only the public `font-flux-js` entry point, no subpaths.
			// This alias points the bare specifier at the source so the demo
			// always reflects the working tree without needing a `npm run build`.
			'font-flux-js': resolve(__dirname, '../src/main.js'),
		},
	},
	plugins: [
		{
			name: 'wasm-mime-type',
			// `server.middlewares` is not a real Vite option — middleware must be
			// registered through the `configureServer` plugin hook. Without this,
			// brotli-wasm's `.wasm` request falls through to the SPA fallback and
			// is served as `index.html` (text/html), which makes
			// `WebAssembly.instantiateStreaming` fail with an "Incorrect response
			// MIME type" / "expected magic word" error.
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url && req.url.includes('.wasm')) {
						res.setHeader('Content-Type', 'application/wasm');
						res.setHeader('Cache-Control', 'no-cache');
					}
					next();
				});
			},
		},
	],
	server: {
		port: 5174,
		fs: {
			allow: [resolve(__dirname, '..'), resolve(__dirname, '../node_modules')],
		},
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
	},
	optimizeDeps: {
		// brotli-wasm ships a `.wasm` asset that Vite's dep optimizer can mangle;
		// excluding it lets the package load its WASM via its own URL resolution.
		exclude: ['brotli-wasm'],
		esbuildOptions: {
			target: 'esnext',
		},
	},
});
