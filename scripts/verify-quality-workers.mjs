import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { cpus, platform, release, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createInspectionCache, inspectInWorker } from '../src/validate/workflow-worker.js';

if (process.argv.includes('--browser')) {
	const { createServer } = await import('vite');
	const { chromium, firefox } = await import('@playwright/test');
	const cacheDir = resolve(import.meta.dirname, `../node_modules/.vite-quality-workers-${process.pid}`);
	const server = await createServer({
		root: resolve(import.meta.dirname, '..'), cacheDir, configFile: false, logLevel: 'error',
		optimizeDeps: { noDiscovery: true, include: ['pako'] },
		server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
	});
	await server.listen();
	try {
		const origin = server.resolvedUrls.local[0];
		for (const engine of [chromium, firefox]) {
			const browser = await engine.launch({ headless: true });
			try {
				const page = await browser.newPage();
				await page.route('**/worker-probe', (route) => route.fulfill({
					contentType: 'text/html', body: '<!doctype html><title>Worker probe</title>',
					headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' },
				}));
				await page.goto(`${origin}worker-probe`);
				const result = await page.evaluate(async (origin) => {
					const { FontFlux } = await import(`${origin}src/font_flux.js`);
					const { inspectInWorker, repairInWorker, planInWorker, applyPlanInWorker, preflightInWorker, createInspectionCache } = await import(`${origin}src/validate/workflow-worker.js`);
					const entryURL = `${origin}src/font_flux.js`;
					const input = FontFlux.create({ family: 'Browser worker' }).export({ format: 'sfnt' });
					let heartbeats = 0;
					const heartbeat = setInterval(() => heartbeats++, 1);
					const progress = [];
					try {
						const cache = createInspectionCache({ maxEntries: 2, maxBytes: 1024 * 1024 });
						const inspection = await inspectInWorker(input, { entryURL, cache, onProgress: (event) => progress.push(event.stage) });
						inspection.diagnostics.issues.push({ code: 'CALLER_MUTATION' });
						const reused = await inspectInWorker(input, { entryURL, cache });
						new DataView(input).setUint16(6, 0);
						const repaired = await repairInWorker(input, [{ id: 'sfnt.search-fields' }], { entryURL });
						const review = await planInWorker(input, [{ id: 'sfnt.search-fields' }], { entryURL, projectRevision: 'browser-review' });
						const saved = JSON.parse(JSON.stringify(review));
						const applied = await applyPlanInWorker(input, saved, { entryURL, projectRevision: 'browser-review' });
						const authored = FontFlux.create({ family: 'Authored browser' }).data;
						const authoredResult = await preflightInWorker(authored, { entryURL, format: 'sfnt' });
						const edited = FontFlux.open(input).data;
						edited.font.familyName = 'Edited browser';
						const preflight = await preflightInWorker(edited, { entryURL, format: 'sfnt', originalSource: { bytes: new Uint8Array(input), options: {} } });
						const aborted = [];
						for (const phase of ['decode', 'traversal', 'planning', 'verification', 'preflight']) {
							const coordination = new SharedArrayBuffer(8), state = new Int32Array(coordination), controller = new AbortController();
							const options = { entryURL: `${origin}test/fixtures/quality-worker-entry.js`, coordination, holdPhase: phase, signal: controller.signal, maxDurationMs: 15000 };
							const work = phase === 'preflight' ? preflightInWorker(authored, options)
								: ['decode', 'traversal'].includes(phase) ? inspectInWorker(input, options)
									: repairInWorker(input, [{ id: 'sfnt.search-fields' }], options);
							const completion = work.then(() => 'unexpected-result', (error) => error.name);
							await new Promise((resolve, reject) => {
								const deadline = performance.now() + 12000;
								const check = () => {
									if (Atomics.load(state, 0) === 1) resolve();
									else if (performance.now() > deadline) reject(new Error('Worker phase coordination deadline exceeded.'));
									else requestAnimationFrame(check);
								};
								check();
							});
							controller.abort();
							aborted.push(await completion);
						}
						const coreCancelled = [];
						for (const phase of ['inspection', 'planning', 'application', 'verification']) {
							const controller = new AbortController();
							try {
								await repairInWorker(input, [{ id: 'sfnt.search-fields' }], { entryURL, signal: controller.signal, onProgress: (event) => {
									if (event.origin === 'core' && event.stage === phase && event.status === 'started') controller.abort();
								} });
								coreCancelled.push('unexpected-result');
							} catch (error) { coreCancelled.push(error.name); }
						}
						return {
							valid: inspection.diagnostics.valid, state: repaired.state, heartbeats, progress, aborted,
							sourceUnchanged: new DataView(input).getUint16(6) === 0,
							cacheHit: reused.cache.status === 'hit',
							detachedCache: !reused.diagnostics.issues.some((issue) => issue.code === 'CALLER_MUTATION'),
							reviewedState: applied.state, reviewDigest: applied.review.planFingerprint === saved.planFingerprint, coreCancelled,
							preflightState: preflight.state, authoredState: authoredResult.state,
							originalEvidence: preflight.stages[0].report.diagnostics.issues.some((issue) => issue.code === 'BAD_SEARCH_RANGE'),
							editedOutput: FontFlux.open(preflight.buffer).info.familyName,
						};
					} finally { clearInterval(heartbeat); }
				}, origin);
				assert.equal(result.valid, true);
				assert.equal(result.state, 'verified');
				assert(result.heartbeats > 0);
				assert(result.sourceUnchanged);
				assert.deepEqual(result.aborted, Array(5).fill('AbortError'));
				assert.deepEqual(result.coreCancelled, Array(4).fill('AbortError'));
				assert(result.cacheHit && result.detachedCache && result.reviewDigest);
				assert.equal(result.reviewedState, 'verified');
				assert.equal(result.preflightState, 'verified');
				assert.equal(result.authoredState, 'verified');
				assert(result.originalEvidence);
				assert.equal(result.editedOutput, 'Edited browser');
				await page.route('**/csp-probe', (route) => route.fulfill({
					contentType: 'text/html', body: '<!doctype html><title>CSP worker probe</title>',
					headers: { 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; worker-src 'none'" },
				}));
				await page.goto(`${origin}csp-probe`);
				const csp = await page.evaluate(async (origin) => {
					const { inspectInWorker } = await import(`${origin}src/validate/workflow-worker.js`);
					try { await inspectInWorker(new Uint8Array([0, 1, 0, 0]), { entryURL: `${origin}src/font_flux.js`, maxDurationMs: 5000 }); return 'unexpected'; }
					catch (error) { return error.name; }
				}, origin);
				assert.equal(csp, 'QualityWorkerError');
				console.log(JSON.stringify({ browser: engine.name(), ...result, csp }));
			} finally { await browser.close(); }
		}
	} finally { await server.close(); await rm(cacheDir, { recursive: true, force: true }); }
} else {
	const records = [];
	const record = (value) => { records.push(value); console.log(JSON.stringify(value)); };
	const filename = 'NotoSerifCJK-Regular-otc-online-test.ttc';
	const bytes = await readFile(new URL(`../test/sample fonts/${filename}`, import.meta.url));
	const faceCount = bytes.readUInt32BE(8);
	const entryURL = new URL('../src/font_flux.js', import.meta.url).href;
	const options = {
		entryURL, maxInputBytes: 64 * 1024 * 1024, maxDurationMs: 60000,
		workerResourceLimits: { maxOldGenerationSizeMb: 1024 },
	};
	const cache = createInspectionCache({ maxEntries: 2, maxBytes: 4 * 1024 * 1024, ttlMs: 120000 });
	const sourceFingerprint = createHash('sha256').update(bytes).digest('hex');
	const coveredFaces = [], skippedFaces = [], cancelledFaces = [];
	record({
		recordedAt: new Date().toISOString(),
		runtime: process.version, os: `${platform()} ${release()}`, cpu: cpus()[0]?.model, logicalCpus: cpus().length,
		physicalMemoryMiB: Math.round(totalmem() / 1048576), fixture: filename, inputBytes: bytes.length,
		requestedFaces: Array.from({ length: faceCount }, (_, index) => index),
		execution: 'sequential one face/worker at a time; each completed report is immediately reinspected through explicit content-keyed cache',
		budgets: { deadlineMs: options.maxDurationMs, inputMiB: 64, workerOldGenerationMiB: 1024 },
		memoryCaveat: 'VM old-generation limit is not a process/RSS cap. Sampled RSS includes main plus worker and may miss transient peaks.',
	});
	const measure = async (label, faceIndex, limits) => {
		let peakRss = process.memoryUsage().rss, ticks = 0;
		const sample = setInterval(() => { peakRss = Math.max(peakRss, process.memoryUsage().rss); ticks++; }, 20);
		const started = performance.now();
		try {
			const report = await inspectInWorker(bytes, { ...options, faceIndex, ...limits });
			const checks = report.checks?.length ? report.checks : (report.diagnostics?.faces || []).flatMap((face) => face.checks || []);
			const skippedChecks = checks.filter((check) => check.coverage === 'not-checked' || ['blocked', 'unsupported', 'skipped'].includes(check.outcome));
			const skipCounts = {};
			for (const check of skippedChecks) skipCounts[check.outcome] = (skipCounts[check.outcome] || 0) + 1;
			record({
				label, faceIndex, elapsedMs: Math.round(performance.now() - started), sampledProcessRssMiB: Math.round(peakRss / 1048576),
				mainThreadHeartbeats: ticks, format: report.format, valid: report.diagnostics?.valid, complete: report.complete,
				issues: report.diagnostics?.issues.length,
				skippedCheckCounts: skipCounts,
				limitIssues: (report.diagnostics?.issues || []).filter((entry) => /LIMIT|SKIP/.test(entry.code)).map((entry) => ({ code: entry.code, message: entry.message })),
				cache: report.cache ? { status: report.cache.status, stored: report.cache.stored, workerStarted: report.cache.workerStarted, payloadBytes: report.cache.payloadBytes } : null,
			});
			return report;
		} finally { clearInterval(sample); }
	};
	await measure('lower-glyph-budget', 0, { maxGlyphs: 1000 });
	for (let faceIndex = 0; faceIndex < faceCount; faceIndex++) {
		try {
			const baseline = await measure('baseline', faceIndex, { cache });
			assert.equal(baseline.cache.inputFingerprint, sourceFingerprint);
			coveredFaces.push(faceIndex);
			const repeated = await measure('content-keyed-reuse', faceIndex, { cache });
			assert.equal(repeated.cache.status, 'hit');
			assert.equal(repeated.cache.key, baseline.cache.key);
			const controller = new AbortController(), observed = [];
			const started = performance.now();
			await assert.rejects(inspectInWorker(bytes, {
				...options, faceIndex, signal: controller.signal, onProgress: (event) => {
					observed.push(`${event.stage}:${event.status}`);
					if (event.stage === 'decode-and-traversal' && event.status === 'started') controller.abort();
				},
			}), (error) => error.name === 'AbortError');
			cancelledFaces.push(faceIndex);
			record({ label: 'cancel-active-worker', faceIndex, elapsedMs: Math.round(performance.now() - started), outcome: 'AbortError', returnedCandidate: false, observed });
		} catch (error) {
			skippedFaces.push({ faceIndex, reason: error.message });
			record({ label: 'face-incomplete', faceIndex, error: error.message });
		}
	}
	assert.equal(createHash('sha256').update(bytes).digest('hex'), sourceFingerprint);
	record({ coveredFaces, skippedFaces, cancelledFaces, sourceFingerprint, sourceUnchanged: true, cache: cache.stats });
	if (process.argv.includes('--record'))
		await writeFile(new URL('../docs/quality-worker-baseline.jsonl', import.meta.url), records.map((value) => JSON.stringify(value)).join('\n') + '\n');
	if (skippedFaces.length) throw new Error('Some CJK face verification did not complete; see explicit face-incomplete records.');
}
