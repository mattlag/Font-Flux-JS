import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { createInspectionCache, inspectInWorker, repairInWorker, runQualityWorker } from '../src/validate/workflow-worker.js';

const entryURL = new URL('../src/font_flux.js', import.meta.url).href;
const instrumentedEntry = new URL('./fixtures/quality-worker-entry.js', import.meta.url).href;
function bytes() {
	return FontFlux.create({ family: 'Worker test' }).export({ format: 'sfnt' });
}

describe('disposable cancellable Node module workers', () => {
	it('ignores browser factories in Node and excludes them from cloning and cache identity', async () => {
		const input = bytes(), cache = createInspectionCache();
		const first = await inspectInWorker(input, { entryURL, cache, browserWorkerFactory: () => { throw new Error('Browser only.'); } });
		const second = await inspectInWorker(input, { entryURL, cache, browserWorkerFactory: () => { throw new Error('Different browser factory.'); } });
		expect(first.cache.status).toBe('miss');
		expect(second.cache).toMatchObject({ status: 'hit', key: first.cache.key });
		expect(second.diagnostics.valid).toBe(true);
	});

	it('inspects exact snapshots with ordered progress and without detaching caller views', async () => {
		const source = new Uint8Array(bytes()), padded = new Uint8Array(source.length + 8);
		padded.set(source, 4);
		const steps = [];
		const result = await inspectInWorker(padded.subarray(4, -4), { entryURL, onProgress: (progress) => steps.push(progress) });
		expect(result.format).toBe('sfnt');
		expect(result.diagnostics.valid).toBe(true);
		expect(padded.subarray(4, -4)).toEqual(source);
		expect(steps.map((step) => `${step.stage}:${step.status}`)).toEqual([
			'loading:started', 'loading:completed', 'decode-and-traversal:started', 'decode-and-traversal:completed',
		]);
		expect(steps.map((step) => step.sequence)).toEqual([0, 1, 2, 3]);
	});

	it('plans and verifies repairs inside one worker without transferring WeakMap-bound plans', async () => {
		const input = bytes(); new DataView(input).setUint16(6, 0);
		const original = input.slice(0), progress = [];
		const result = await repairInWorker(input, [{ id: 'sfnt.search-fields' }], { entryURL, onProgress: (event) => progress.push(event.stage) });
		expect(result.state).toBe('verified');
		expect(FontFlux.inspect(result.buffer).diagnostics.valid).toBe(true);
		expect(input).toEqual(original);
		expect(progress).toContain('planning');
		expect(progress).toContain('application-and-verification');
	});

	it('initializes WOFF2 in its own worker, independent of main-thread codec state', async () => {
		const input = readFileSync(new URL('./sample fonts/oblegg.woff2', import.meta.url)), stages = [];
		const report = await inspectInWorker(input, { entryURL, onProgress: (event) => stages.push(event.stage) });
		expect(report.format).toBe('woff2');
		expect(stages).toContain('codec-initialization');
		expect(report.diagnostics.issues.some((entry) => entry.code === 'WOFF2_DECODE_FAILED')).toBe(false);
	});

	for (const phase of ['decode', 'traversal', 'planning', 'verification']) {
		it(`terminates a genuinely blocked worker during ${phase}, using deterministic coordination`, async () => {
			const input = bytes(), before = input.slice(0), controller = new AbortController();
			if (['planning', 'verification'].includes(phase)) new DataView(input).setUint16(6, 0);
			const coordination = new SharedArrayBuffer(8), state = new Int32Array(coordination);
			const options = { entryURL: instrumentedEntry, signal: controller.signal, holdPhase: phase, coordination, maxDurationMs: 10000 };
			const operation = ['planning', 'verification'].includes(phase)
				? repairInWorker(input, [{ id: 'sfnt.search-fields' }], options) : inspectInWorker(input, options);
			const assertion = expect(operation).rejects.toMatchObject({ name: 'AbortError' });
			const wait = Atomics.waitAsync(state, 0, 0, 9000);
			await wait.value;
			expect(Atomics.load(state, 0)).toBe(1);
			controller.abort();
			await assertion;
			if (!['planning', 'verification'].includes(phase)) expect(input).toEqual(before);
			else expect(new DataView(input).getUint16(6)).toBe(0);
		});
	}

	it('bounds input/deadline and rejects unavailable modules or unserializable options without fallback', async () => {
		await expect(inspectInWorker(bytes(), { entryURL, maxInputBytes: 1 })).rejects.toThrow(/maxInputBytes/);
		await expect(inspectInWorker(bytes(), { entryURL, maxDurationMs: 1 })).rejects.toMatchObject({ code: 'QUALITY_WORKER_DEADLINE' });
		await expect(inspectInWorker(bytes(), { entryURL, invalidCallback: () => {} })).rejects.toThrow(/structured-cloneable/);
		await expect(inspectInWorker(bytes(), { entryURL: new URL('./missing-worker.js', import.meta.url).href })).rejects.toThrow();
		await expect(inspectInWorker(bytes(), { entryURL, workerResourceLimits: { unsupported: 1 } })).rejects.toThrow(/Invalid worker resource/);
		await expect(runQualityWorker('invalid', bytes(), { entryURL })).rejects.toThrow(/operation/);
		await expect(inspectInWorker(bytes(), { entryURL: 'data:text/javascript,export{}' })).rejects.toThrow(/entryURL/);
	});

	it('rejects pre-aborted work and progress callback failure with cleanup', async () => {
		const controller = new AbortController(); controller.abort();
		await expect(inspectInWorker(bytes(), { entryURL, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
		await expect(inspectInWorker(bytes(), { entryURL, onProgress: () => { throw new Error('callback failed'); } })).rejects.toThrow(/callback failed/);
	});

	it('discards stale source results and waits for asynchronous progress handlers', async () => {
		const input = bytes();
		await expect(inspectInWorker(input, { entryURL, onProgress: (progress) => {
			if (progress.stage === 'loading') new Uint8Array(input)[0] = 9;
		} })).rejects.toMatchObject({ code: 'QUALITY_WORKER_STALE_INPUT' });
		const stages = [];
		const report = await inspectInWorker(bytes(), { entryURL, onProgress: async (progress) => {
			await Promise.resolve();
			stages.push(progress.stage);
		} });
		expect(report.diagnostics.valid).toBe(true);
		expect(stages).toHaveLength(4);
	});
});
