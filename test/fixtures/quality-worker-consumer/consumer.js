import { FontFlux } from 'font-flux-js';

// An application entry has DOM side effects and does not export the library.
document.body.dataset.loaded = 'true';

globalThis.runBuiltWorkerProbe = async () => {
	const instance = FontFlux.create({ family: 'Built worker consumer' });
	const source = instance.export({ format: 'sfnt' }), before = source.slice(0);
	const cache = FontFlux.createInspectionCache(), controller = new AbortController();
	const stats = { created: 0, terminated: 0, urls: [], callerFactoryCalls: 0 };
	const NativeWorker = globalThis.Worker;
	globalThis.Worker = class extends NativeWorker {
		constructor(url, options) {
			super(url, options);
			stats.created++;
			stats.urls.push(String(url));
		}
		terminate() {
			stats.terminated++;
			super.terminate();
		}
	};
	const originalInspect = FontFlux.inspect;
	FontFlux.inspect = () => { throw new Error('Main-thread inspection is forbidden in this probe.'); };
	const options = {
		maxDurationMs: 15000,
		entryURL: 'https://untrusted.invalid/consumer.js',
		browserWorkerFactory: () => { stats.callerFactoryCalls++; throw new Error('Caller factory must be ignored.'); },
	};
	try {
		const inspection = await FontFlux.inspectAsync(source, { ...options, cache });
		inspection.diagnostics.issues.push({ code: 'CALLER_MUTATION' });
		const reused = await FontFlux.inspectAsync(source, { ...options, cache });
		const woff2Stages = [];
		const compressed = await (await fetch('./font.woff2')).arrayBuffer();
		const woff2 = await FontFlux.inspectAsync(compressed, { ...options, onProgress: (progress) => woff2Stages.push(progress.stage) });
		const damaged = source.slice(0);
		new DataView(damaged).setUint16(6, 0);
		const requests = [{ id: 'sfnt.search-fields' }];
		const review = await FontFlux.planRepairsAsync(damaged, requests, options);
		const applied = await FontFlux.applyRepairsAsync(damaged, JSON.parse(JSON.stringify(review)), options);
		const repaired = await FontFlux.repairAsync(damaged, requests, options);
		const preflight = await instance.preflightAsync({
			...options, format: 'sfnt', originalSource: { bytes: new Uint8Array(damaged), options: {} },
		});
		let cancelled;
		try {
			await FontFlux.inspectAsync(source, {
				...options, signal: controller.signal,
				onProgress: (progress) => {
					if (progress.stage === 'loading' && progress.status === 'started') controller.abort();
				},
			});
			cancelled = 'unexpected-result';
		} catch (error) { cancelled = error.name; }
		const app = await import(/* @vite-ignore */ import.meta.url);
		return {
			valid: inspection.diagnostics.valid, cacheHit: reused.cache.status,
			detachedCache: !reused.diagnostics.issues.some((issue) => issue.code === 'CALLER_MUTATION'),
			applied: applied.state, repaired: repaired.state, preflight: preflight.state, cancelled,
			reviewDigest: applied.review.planFingerprint === review.planFingerprint,
			originalEvidence: preflight.stages[0].report.diagnostics.issues.some((issue) => issue.code === 'BAD_SEARCH_RANGE'),
			unchanged: new Uint8Array(source).every((byte, index) => byte === new Uint8Array(before)[index]),
			appExportsFontFlux: 'FontFlux' in app,
			engineIdentity: inspection.cache.entryURL, appURL: import.meta.url,
			woff2Format: woff2.format, initializedCodec: woff2Stages.includes('codec-initialization'),
			decodedWoff2: !woff2.diagnostics.issues.some((issue) => issue.code === 'WOFF2_DECODE_FAILED'),
			stats,
		};
	} finally {
		globalThis.Worker = NativeWorker;
		FontFlux.inspect = originalInspect;
	}
};

globalThis.runBlockedWorkerProbe = async () => {
	const source = FontFlux.create({ family: 'CSP refuses workers' }).export({ format: 'sfnt' });
	const original = FontFlux.inspect;
	FontFlux.inspect = () => { throw new Error('No main-thread fallback is permitted.'); };
	try {
		await FontFlux.inspectAsync(source, { maxDurationMs: 10000 });
		return 'unexpected-result';
	} catch (error) { return error.name; }
	finally { FontFlux.inspect = original; }
};
