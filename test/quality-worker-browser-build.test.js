import { readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox } from '@playwright/test';
import { build } from 'vite';
import { expect, it } from 'vitest';

it.each([
	['source', '../src/main.js'],
	['distribution', '../dist/font-flux-js.js'],
])('runs disposable production-bundled %s workers from a DOM consumer without FontFlux exports', async (entryName, entryPath) => {
	const root = fileURLToPath(new URL('./fixtures/quality-worker-consumer', import.meta.url));
	const outDir = resolve(root, `.build-${process.pid}-${entryName}`);
	const server = createServer(async (request, response) => {
		const url = new URL(request.url, 'http://localhost');
		const path = resolve(outDir, `.${url.pathname === '/' || url.pathname === '/blocked.html' ? '/index.html' : url.pathname}`);
		if (relative(outDir, path).startsWith('..')) { response.writeHead(403).end(); return; }
		try {
			const body = await readFile(url.pathname === '/font.woff2' ? new URL('./sample fonts/oblegg.woff2', import.meta.url) : path);
			const type = { '.js': 'text/javascript', '.html': 'text/html', '.wasm': 'application/wasm', '.css': 'text/css' }[extname(path)];
			response.writeHead(200, {
				'Content-Type': type ?? 'application/octet-stream',
				'Content-Security-Policy': `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' data:; worker-src ${url.pathname === '/blocked.html' ? "'none'" : "'self'"}`,
			});
			response.end(body);
		} catch { response.writeHead(404).end(); }
	});
	try {
		await build({
			root, configFile: false, logLevel: 'error',
			resolve: { alias: { 'font-flux-js': fileURLToPath(new URL(entryPath, import.meta.url)) } },
			build: { outDir, emptyOutDir: true },
		});
		await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
		const origin = `http://127.0.0.1:${server.address().port}`;
		for (const engine of [chromium, firefox]) {
			const browser = await engine.launch({ headless: true });
			try {
				const page = await browser.newPage();
				await page.goto(origin);
				await page.waitForFunction(() => typeof globalThis.runBuiltWorkerProbe === 'function');
				const result = await page.evaluate(() => globalThis.runBuiltWorkerProbe());
				expect(result).toMatchObject({
					valid: true, cacheHit: 'hit', detachedCache: true, applied: 'verified', repaired: 'verified',
					preflight: 'verified', cancelled: 'AbortError', reviewDigest: true, originalEvidence: true,
					unchanged: true, appExportsFontFlux: false,
					woff2Format: 'woff2', initializedCodec: true, decodedWoff2: true,
					stats: { created: 7, terminated: 7, callerFactoryCalls: 0 },
				});
				expect(result.engineIdentity).toBe(result.appURL);
				expect(result.stats.urls.every((url) => new URL(url).pathname.includes('quality-worker-entry'))).toBe(true);
				await page.goto(`${origin}/blocked.html`);
				await page.waitForFunction(() => typeof globalThis.runBlockedWorkerProbe === 'function');
				expect(await page.evaluate(() => globalThis.runBlockedWorkerProbe())).toBe('QualityWorkerError');
			} finally { await browser.close(); }
		}
	} finally {
		if (server.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
		await rm(outDir, { recursive: true, force: true });
	}
}, 120000);
