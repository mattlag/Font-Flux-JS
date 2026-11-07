import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { preflightInWorker } from '../src/validate/workflow-worker.js';

const entryURL = new URL('../src/font_flux.js', import.meta.url).href;
const instrumentedEntry = new URL('./fixtures/quality-worker-entry.js', import.meta.url).href;
function font() {
	const instance = FontFlux.create({ family: 'Worker preflight' });
	instance.addGlyph({ name: 'A', unicode: 65, advanceWidth: 500, contours: [[
		{ x: 0, y: 0, onCurve: true }, { x: 200, y: 500, onCurve: true }, { x: 400, y: 0, onCurve: true },
	]] });
	return instance;
}

describe('detached responsive project preflight', () => {
	it('preflights authored data in a worker without pretending original provenance exists', async () => {
		const project = font().data, before = structuredClone(project), phases = [];
		const report = await preflightInWorker(project, { entryURL, format: 'sfnt', onProgress: (event) => phases.push(event.stage) });
		expect(report.state).toBe('verified');
		expect(report.stages[0]).toMatchObject({ id: 'original', status: 'skipped', reasonCode: 'no-original-bytes' });
		expect(report.worker).toMatchObject({ operation: 'preflight', originalInputFingerprint: null, projectFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) });
		expect(phases).toContain('preflight');
		expect(project).toEqual(before);
	});

	it('retains independently inspected original bytes while exporting the edited project', async () => {
		const source = font().export({ format: 'sfnt' });
		new DataView(source).setUint16(6, 0);
		const project = FontFlux.open(source).data;
		project.font.familyName = 'Edited, not original';
		project.glyphs[2].advanceWidth = 750;
		const originalSource = { bytes: new Uint8Array(source), options: {} };
		const beforeProject = structuredClone(project), beforeBytes = source.slice(0);
		const report = await preflightInWorker(project, { entryURL, originalSource, format: 'sfnt' });
		expect(report.state).toBe('verified');
		expect(report.stages[0]).toMatchObject({ id: 'original', reasonCode: 'retained-original' });
		expect(report.stages[0].report.diagnostics.issues.some((issue) => issue.code === 'BAD_SEARCH_RANGE')).toBe(true);
		const output = FontFlux.open(report.buffer);
		expect(output.info.familyName).toBe('Edited, not original');
		expect(output.glyphs[2].advanceWidth).toBe(750);
		expect(report.worker.originalInputFingerprint).toMatch(/^[a-f0-9]{64}$/);
		expect(project).toEqual(beforeProject);
		expect(source).toEqual(beforeBytes);
	});

	it('supports explicit collection provenance and BigInt/raw-view project fields', async () => {
		const bytes = FontFlux.exportCollection([font(), font()]);
		const project = FontFlux.open(bytes, { faceIndex: 1 }).data;
		expect(typeof project.tables.head.created).toBe('bigint');
		const report = await preflightInWorker(project, { entryURL, format: 'sfnt', originalSource: { bytes: new Uint8Array(bytes), options: { faceIndex: 1 } } });
		expect(report.state).toBe('verified');
		expect(report.stages[0].report.diagnostics.faces.map((face) => face.faceIndex)).toEqual([1]);
	});

	it('inspects a damaged declared baseline without trying to import it as the editable project', async () => {
		const damaged = new Uint8Array([0, 1, 0, 0]), project = font().data;
		const report = await preflightInWorker(project, { entryURL, format: 'sfnt', originalSource: { bytes: damaged, options: {} } });
		expect(report.state).toBe('verified');
		expect(report.stages[0].report.diagnostics.valid).toBe(false);
		expect(report.stages[0].report.diagnostics.errors.length).toBeGreaterThan(0);
		expect(report.worker.originalSourceProvenance).toBe('supplied-baseline-not-authenticated');
		expect(FontFlux.open(report.buffer).info.familyName).toBe('Worker preflight');
	});

	it('discards mutated project, original-byte and original-option results', async () => {
		for (const target of ['project', 'bytes', 'options']) {
			const bytes = font().export({ format: 'sfnt' }), project = FontFlux.open(bytes).data;
			const originalSource = { bytes: new Uint8Array(bytes), options: {} };
			await expect(preflightInWorker(project, { entryURL, originalSource, format: 'sfnt', onProgress: (event) => {
				if (event.stage === 'preflight' && event.status === 'started') {
					if (target === 'project') project.glyphs[2].advanceWidth++;
					else if (target === 'bytes') originalSource.bytes[0] ^= 1;
					else originalSource.options.faceIndex = 0;
				}
			} })).rejects.toMatchObject({ code: target === 'project' ? 'QUALITY_WORKER_STALE_PROJECT' : 'QUALITY_WORKER_STALE_SOURCE' });
		}
	});

	it('terminates deterministic in-phase preflight work and keeps all caller data', async () => {
		const project = font().data, original = structuredClone(project), coordination = new SharedArrayBuffer(8);
		const state = new Int32Array(coordination), controller = new AbortController();
		const work = preflightInWorker(project, {
			entryURL: instrumentedEntry, signal: controller.signal, holdPhase: 'preflight', coordination, maxDurationMs: 10000,
		});
		const assertion = expect(work).rejects.toMatchObject({ name: 'AbortError' });
		await Atomics.waitAsync(state, 0, 0, 9000).value;
		expect(Atomics.load(state, 0)).toBe(1);
		controller.abort();
		await assertion;
		expect(project).toEqual(original);
	});

	it('bounds project snapshots and rejects unsupported snapshot inputs without fallback', async () => {
		await expect(preflightInWorker(font().data, { entryURL, maxProjectBytes: 1 })).rejects.toThrow(/maxProjectBytes/);
		await expect(preflightInWorker({}, { entryURL })).rejects.toThrow(/simplified project data/);
		const project = font().data; project.extra = project;
		await expect(preflightInWorker(project, { entryURL })).rejects.toThrow(/cyclic/);
		const shared = font().data; shared.extra = new Uint8Array(new SharedArrayBuffer(1));
		await expect(preflightInWorker(shared, { entryURL })).rejects.toThrow(/SharedArrayBuffer/);
	});
});
