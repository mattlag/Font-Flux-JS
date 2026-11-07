import { describe, expect, it, vi } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import {
	applyPlanInWorker, createInspectionCache, fingerprintRepairPlan, inspectInWorker,
	planInWorker, repairInWorker,
} from '../src/validate/workflow-worker.js';
import { lookupInspection, storeInspection } from '../src/validate/workflow-cache.js';

const entryURL = new URL('../src/font_flux.js', import.meta.url).href;
function bytes() {
	return FontFlux.create({ family: 'Reviewed worker' }).export({ format: 'sfnt' });
}
function damaged() {
	const input = bytes(); new DataView(input).setUint16(6, 0); return input;
}
const requests = [{ id: 'sfnt.search-fields' }];

describe('explicit bounded immutable inspection reuse', () => {
	it('hashes fresh content and canonical options, returning detached reports with provenance', async () => {
		const cache = createInspectionCache(), input = bytes(), stages = [];
		const first = await inspectInWorker(input, { entryURL, cache, profile: 'structural', maxGlyphs: 65535 });
		expect(first.cache).toMatchObject({ status: 'miss', stored: true, workerStarted: true, fingerprintFreshlyComputed: true });
		first.diagnostics.issues.push({ code: 'CALLER_MUTATION' });
		first.coverage[0].reason = 'changed by caller';
		const second = await inspectInWorker(input.slice(0), {
			maxGlyphs: 65535, profile: 'structural', cache, entryURL,
			onProgress: (progress) => stages.push(progress),
		});
		expect(second.cache).toMatchObject({ status: 'hit', workerStarted: false, inputFingerprint: first.cache.inputFingerprint, optionsFingerprint: first.cache.optionsFingerprint });
		expect(second.diagnostics.issues.some((issue) => issue.code === 'CALLER_MUTATION')).toBe(false);
		expect(second.coverage[0].reason).not.toBe('changed by caller');
		expect(stages).toEqual([expect.objectContaining({ stage: 'cache', status: 'hit' })]);
		expect(cache.stats).toMatchObject({ entries: 1, hits: 1, misses: 1, writes: 1 });
	});

	it('never aliases content, options or entry URLs, even for the same mutated input object', async () => {
		const cache = createInspectionCache(), input = bytes();
		const first = await inspectInWorker(input, { entryURL, cache });
		new DataView(input).setUint16(6, 0);
		const changed = await inspectInWorker(input, { entryURL, cache });
		expect(changed.cache.status).toBe('miss');
		expect(changed.cache.inputFingerprint).not.toBe(first.cache.inputFingerprint);
		const lowered = await inspectInWorker(input, { entryURL, cache, maxGlyphs: 1 });
		expect(lowered.cache.status).toBe('miss');
		expect(lowered.cache.optionsFingerprint).not.toBe(changed.cache.optionsFingerprint);
		const alternateEntry = await inspectInWorker(input, { entryURL: `${entryURL}#different-entry`, cache });
		expect(alternateEntry.cache.status).toBe('miss');
		expect(alternateEntry.cache.key).not.toBe(changed.cache.key);
	});

	it('enforces LRU and byte admission bounds without exposing mutable storage', async () => {
		const cache = createInspectionCache({ maxEntries: 1, maxBytes: 1024 * 1024 });
		await inspectInWorker(bytes(), { entryURL, cache });
		await inspectInWorker(damaged(), { entryURL, cache });
		expect(cache.stats).toMatchObject({ entries: 1, evictions: 1 });
		expect(cache.stats.payloadBytes).toBeLessThanOrEqual(cache.stats.maxBytes);
		const oversized = createInspectionCache({ maxBytes: 1 });
		const report = await inspectInWorker(bytes(), { entryURL, cache: oversized });
		expect(report.cache).toMatchObject({ status: 'miss', stored: false, reason: 'report-exceeds-cache-maxBytes' });
		expect(oversized.stats.entries).toBe(0);
		expect(Object.isFrozen(cache.stats)).toBe(true);
		cache.clear();
		expect(cache.stats.entries).toBe(0);
	});

	it('expires entries deterministically and prevents in-flight writes after clear', async () => {
		const clock = vi.spyOn(performance, 'now').mockReturnValue(100);
		try {
			const cache = createInspectionCache({ ttlMs: 10 }), identity = { key: 'deterministic-clock-test' };
			storeInspection(cache, identity, { evidence: ['original'] }, 0);
			lookupInspection(cache, identity).report.evidence.push('caller mutation');
			expect(lookupInspection(cache, identity).report.evidence).toEqual(['original']);
			clock.mockReturnValue(111);
			expect(cache.stats).toMatchObject({ entries: 0, evictions: 1 });
		} finally { clock.mockRestore(); }
		const cache = createInspectionCache();
		const result = await inspectInWorker(bytes(), { entryURL, cache, onProgress: () => cache.clear() });
		expect(result.cache).toMatchObject({ stored: false, reason: 'cache-cleared-during-inspection' });
		expect(cache.stats.entries).toBe(0);
	});

	it('rejects stale/cancelled hits and never caches aborted work or unsupported option identities', async () => {
		const cache = createInspectionCache(), input = bytes();
		await inspectInWorker(input, { entryURL, cache });
		await expect(inspectInWorker(input, { entryURL, cache, onProgress: () => { new Uint8Array(input)[0] = 9; } }))
			.rejects.toMatchObject({ code: 'QUALITY_WORKER_STALE_INPUT' });
		const controller = new AbortController();
		await expect(inspectInWorker(bytes(), { entryURL, cache, signal: controller.signal, onProgress: () => controller.abort() }))
			.rejects.toMatchObject({ name: 'AbortError' });
		const empty = createInspectionCache(), otherController = new AbortController();
		await expect(inspectInWorker(bytes(), { entryURL, cache: empty, signal: otherController.signal, onProgress: () => otherController.abort() }))
			.rejects.toMatchObject({ name: 'AbortError' });
		expect(empty.stats.entries).toBe(0);
		await expect(inspectInWorker(bytes(), { entryURL, cache, unsupported: new Set([1]) })).rejects.toThrow(/finite JSON/);
		await expect(inspectInWorker(bytes(), { entryURL, cache: {} })).rejects.toThrow(/createInspectionCache/);
		await expect(repairInWorker(damaged(), requests, { entryURL, cache })).rejects.toThrow(/cannot be used/);
	});
});

describe('reviewed serialized plans in disposable workers', () => {
	it('creates serializable review evidence and resumes/applies exactly that plan', async () => {
		const input = damaged(), before = input.slice(0), progress = [];
		const review = await planInWorker(input, requests, { entryURL, projectRevision: 'revision-4' });
		expect(review).toMatchObject({ kind: 'repair-review', entryURL, plan: { projectRevision: 'revision-4' } });
		expect(review.planFingerprint).toMatch(/^[a-f0-9]{64}$/);
		const saved = JSON.parse(JSON.stringify(review));
		const result = await applyPlanInWorker(input, saved, {
			entryURL, projectRevision: 'revision-4', onProgress: (event) => progress.push(event),
		});
		expect(result.state).toBe('verified');
		expect(result.review).toMatchObject({ operation: 'resume-and-apply', planFingerprint: review.planFingerprint, inputFingerprint: review.inputFingerprint });
		expect(progress.some((event) => event.stage === 'resume-reviewed-plan')).toBe(true);
		expect(progress.filter((event) => event.origin === 'core' && event.status === 'started').map((event) => event.stage))
			.toEqual(['inspection', 'planning', 'application', 'verification']);
		expect(input).toEqual(before);
	});

	it('supports existing core plans only with their persisted review digest', async () => {
		const input = damaged(), plan = await FontFlux.planRepairs(input, requests);
		await expect(applyPlanInWorker(input, plan, { entryURL })).rejects.toThrow(/persisted reviewedPlanFingerprint/);
		const digest = await fingerprintRepairPlan(plan);
		expect(await fingerprintRepairPlan(JSON.parse(JSON.stringify(plan)))).toBe(digest);
		expect((await applyPlanInWorker(input, plan, { entryURL, reviewedPlanFingerprint: digest })).state).toBe('verified');
		await expect(fingerprintRepairPlan(plan, { maxPlanBytes: 1 })).rejects.toThrow(/maxPlanBytes/);
	});

	it('rejects source, decisions, entry, context and envelope changes without candidates', async () => {
		const input = damaged(), review = await planInWorker(input, requests, { entryURL, projectRevision: 'r1' });
		const modified = structuredClone(review); modified.plan.steps[0].description = 'Not the reviewed text';
		await expect(applyPlanInWorker(input, modified, { entryURL })).rejects.toMatchObject({ code: 'QUALITY_WORKER_STALE_PLAN' });
		const changedInput = input.slice(0); new Uint8Array(changedInput)[30] ^= 1;
		await expect(applyPlanInWorker(changedInput, review, { entryURL })).rejects.toMatchObject({ code: 'QUALITY_WORKER_STALE_PLAN' });
		await expect(applyPlanInWorker(input, review, { entryURL: `${entryURL}#changed` })).rejects.toMatchObject({ code: 'QUALITY_WORKER_STALE_PLAN' });
		await expect(applyPlanInWorker(input, review, { entryURL, projectRevision: 'r2' })).rejects.toThrow(/stale|changed/);
		await expect(applyPlanInWorker(input, review, { entryURL, format: 'woff' })).rejects.toThrow(/preserve|stale|changed/);
		await expect(applyPlanInWorker(input, review, { entryURL, requests })).rejects.toThrow(/never replacement requests/);
		const forgedEnvelope = { ...review, inputFingerprint: '0'.repeat(64) };
		await expect(applyPlanInWorker(input, forgedEnvelope, { entryURL })).rejects.toMatchObject({ code: 'QUALITY_WORKER_STALE_PLAN' });
	});

	it('rejects changed plan contents or envelope references during actual application', async () => {
		for (const replace of [false, true]) {
			const input = damaged(), review = await planInWorker(input, requests, { entryURL });
			await expect(applyPlanInWorker(input, review, { entryURL, onProgress: (event) => {
				if (event.origin === 'core' && event.stage === 'application' && event.status === 'started') {
					if (replace) review.plan = structuredClone(review.plan);
					else review.plan.steps[0].title = 'Mutated after review';
				}
			} })).rejects.toMatchObject({ code: 'QUALITY_WORKER_STALE_PLAN' });
		}
	});

	for (const phase of ['inspection', 'planning', 'application', 'verification'])
		it(`forwards and cancels the real core ${phase} phase`, async () => {
			const input = damaged(), controller = new AbortController(), before = input.slice(0), observed = [];
			await expect(repairInWorker(input, requests, { entryURL, signal: controller.signal, onProgress: (event) => {
				if (event.origin === 'core' && event.status === 'started') {
					observed.push(event.stage);
					if (event.stage === phase) controller.abort();
				}
			} })).rejects.toMatchObject({ name: 'AbortError' });
			expect(observed).toContain(phase);
			expect(input).toEqual(before);
		});
});
