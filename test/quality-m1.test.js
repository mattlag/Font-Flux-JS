import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { exportFont } from '../src/export.js';
import { importFontTables } from '../src/import.js';
import { parseCmap } from '../src/sfnt/table_cmap.js';
import { unwrapWOFF1, wrapWOFF1 } from '../src/woff/woff1.js';
import { unwrapWOFF2, wrapWOFF2 } from '../src/woff/woff2.js';
import { orderRepairs, validateRepairCatalog } from '../src/validate/repair-contract.js';
import { nameLayout } from '../src/validate/repair-data.js';
import { subtableMappings } from '../src/validate/metadata-repairs.js';
import * as exporter from '../src/export.js';
import * as diagnostics from '../src/validate/diagnoseFont.js';
import * as metadataRepairs from '../src/validate/metadata-repairs.js';
import * as extendedRepairs from '../src/validate/repair-extensions.js';
import * as containers from '../src/validate/repair-containers.js';

function fixture() {
	const font = FontFlux.create({ family: 'M1 original', style: 'Regular' });
	font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 500, contours: [[
		{ x: 0, y: 0, onCurve: true }, { x: 100, y: 400, onCurve: true }, { x: 200, y: 0, onCurve: true },
	]] });
	return font.export({ format: 'sfnt' });
}

function entry(buffer, tag, base = 0) {
	const view = new DataView(buffer);
	for (let i = 0; i < view.getUint16(base + 4); i++) {
		const record = base + 12 + i * 16;
		if (String.fromCharCode(...new Uint8Array(buffer, record, 4)) === tag)
			return { record, offset: view.getUint32(record + 8), length: view.getUint32(record + 12) };
	}
	throw new Error(`Missing fixture table ${tag}`);
}

function table(buffer, tag) {
	const item = entry(buffer, tag);
	return new Uint8Array(buffer, item.offset, item.length);
}

async function repair(buffer, requests, options) {
	const original = buffer.slice(0);
	const plan = await FontFlux.planRepairs(buffer, requests, options);
	const result = await FontFlux.applyRepairs(buffer, plan);
	expect(result.verification.failures).toEqual([]);
	expect(result.state).toBe('verified');
	expect(buffer).toEqual(original);
	return result;
}

beforeAll(() => FontFlux.initWoff2());

describe('M1 acceptance guards', () => {
	it.each(['sfnt', 'woff', 'woff2', 'collection'].flatMap((format) =>
		['metadata-first', 'metadata-last', 'extended', 'serialization', 'checksums', 'container', 'inspection'].map((stage) => [format, stage])))(
		'keeps %s transactions atomic after an injected %s failure', async (format, stage) => {
			const project = FontFlux.open(fixture()), json = project.toJSON();
			const bytes = format === 'collection' ? FontFlux.exportCollection([project, project]) : project.export({ format });
			const options = format === 'collection' ? { faceIndex: 1 } : {};
			const original = new Uint8Array(bytes).slice();
			const plan = await FontFlux.planRepairs(bytes, [
				{ id: 'name.record', inputs: { nameID: 1, languageID: 1033, value: 'Reviewed', authority: true } },
				{ id: 'rights.embedding', inputs: { value: 4, authority: true } },
				{ id: 'hmtx.compact' },
			], options);
			const [module, method] = stage.startsWith('metadata') ? [metadataRepairs, 'applyMetadataRepair'] :
				stage === 'extended' ? [extendedRepairs, 'applyExtendedRepair'] :
				stage === 'serialization' ? [exporter, 'exportFont'] :
				stage === 'checksums' ? [exporter, 'computeTableChecksum'] :
				stage === 'container' ? [containers, 'emitRepairContainer'] : [diagnostics, 'diagnoseFont'];
			const implementation = module[method];
			let calls = 0;
			const spy = vi.spyOn(module, method).mockImplementation((...args) => {
				const result = implementation(...args);
				if (++calls === (stage === 'metadata-last' ? 2 : 1)) throw new Error(`Injected ${stage} failure`);
				return result;
			});
			try { await expect(FontFlux.applyRepairs(bytes, plan)).rejects.toThrow(/Injected/); }
			finally { spy.mockRestore(); }
			expect(new Uint8Array(bytes)).toEqual(original);
			expect(project.toJSON()).toBe(json);
			expect((await FontFlux.applyRepairs(bytes, plan)).state).toBe('verified');
		});

	it.each([
		{ formats: 'sfnt' }, { formats: ['future'] }, { invariants: 'preserve' },
		{ invariants: [''] }, { inputs: [{ key: 'value', label: 'Value', type: 'number', min: 10, max: 1 }] },
		{ inputs: [{ key: 'value', label: 'Value', type: 'string' }] },
		{ companions: 'sfnt.checksums' },
	])('rejects malformed descriptor fields %j', (fields) => {
		expect(() => validateRepairCatalog([{ ...FontFlux.repairCatalog()[0], ...fields }])).toThrow();
	});

	it.each(['inspection', 'planning', 'application', 'verification'])('rejects source edits during %s', async (phase) => {
		const bytes = fixture(), view = new DataView(bytes);
		view.setUint16(6, 0);
		const requests = [{ id: 'sfnt.search-fields' }];
		const controls = { onProgress: (progress) => {
			if (progress.phase === phase) view.setUint16(6, 1);
		} };
		if (phase === 'inspection' || phase === 'planning')
			await expect(FontFlux.planRepairs(bytes, requests, controls)).rejects.toThrow(/stale|changed/);
		else {
			const plan = await FontFlux.planRepairs(bytes, requests);
			await expect(FontFlux.applyRepairs(bytes, plan, controls)).rejects.toThrow(/stale|changed/);
		}
		expect(view.getUint16(6)).toBe(1);
	});

	it.each(['blocked-existing', 'blocked-partial', 'new-blocked', 'missing-existing', 'partial-existing'])(
		'rejects lost candidate check coverage without a new finding: %s', async (failure) => {
		const bytes = fixture(), original = bytes.slice(0);
		const plan = await FontFlux.planRepairs(bytes, [{ id: 'name.record', inputs: {
			nameID: 1, languageID: 1033, value: 'Reviewed', authority: true,
		} }]);
		const diagnose = diagnostics.diagnoseFont;
		const spy = vi.spyOn(diagnostics, 'diagnoseFont').mockImplementationOnce((input, options) => {
			const report = diagnose(input, options);
			const check = report.checks.find((item) => item.coverage ===
				(failure === 'blocked-partial' ? 'partial' : 'complete') && ['passed', 'failed'].includes(item.outcome));
			if (failure === 'missing-existing') report.checks.splice(report.checks.indexOf(check), 1);
			else if (failure === 'new-blocked') report.checks.push({
				...check, id: 'binary.metadata.execution', outcome: 'blocked', coverage: 'not-checked', reasonCode: 'metadata-inspection-failed',
			});
			else Object.assign(check, {
				outcome: failure === 'partial-existing' ? 'passed' : 'blocked',
				coverage: failure === 'partial-existing' ? 'partial' : 'not-checked', reasonCode: 'injected-interruption',
			});
			return report;
		});
		try {
			const result = await FontFlux.applyRepairs(bytes, plan);
			expect(result.state).toBe('failed');
			expect(result.buffer).toBeNull();
			expect(result.verification.failures.join(' ')).toMatch(/check|coverage/i);
			expect(new Uint8Array(bytes)).toEqual(new Uint8Array(original));
		} finally { spy.mockRestore(); }
	});

	it('distinguishes new finding locations rather than comparing only counts and messages', async () => {
		const bytes = fixture();
		new DataView(bytes).setUint16(6, 0);
		const diagnose = diagnostics.diagnoseFont;
		let languageID = 1033;
		const spy = vi.spyOn(diagnostics, 'diagnoseFont').mockImplementation((input, options) => {
			const report = diagnose(input, options);
			report.issues.push({ severity: 'warning', code: 'M1_LOCATION_WARNING',
				message: 'Identical text at a different location.', location: { table: 'name', languageID } });
			return report;
		});
		try {
			const plan = await FontFlux.planRepairs(bytes, [{ id: 'sfnt.search-fields' }]);
			languageID = 1041;
			const result = await FontFlux.applyRepairs(bytes, plan);
			expect(result.state).toBe('failed');
			expect(result.buffer).toBeNull();
			expect(result.verification.failures.join(' ')).toMatch(/New unapproved finding/);
		} finally { spy.mockRestore(); }
	});

	it('rejects an exporter that changes an unrelated mapping', async () => {
		const bytes = fixture(), original = bytes.slice(0);
		const plan = await FontFlux.planRepairs(bytes, [{ id: 'name.record', inputs: {
			nameID: 1, languageID: 1033, value: 'Reviewed', authority: true,
		} }]);
		const emit = exporter.exportFont;
		const spy = vi.spyOn(exporter, 'exportFont').mockImplementationOnce((data, options) => {
			const output = emit(data, options), cmap = table(output, 'cmap');
			// The encoding record now points at an unapproved subtable.
			new DataView(cmap.buffer, cmap.byteOffset).setUint32(8, 0);
			return output;
		});
		try {
			const result = await FontFlux.applyRepairs(bytes, plan);
			expect(result.state).toBe('failed');
			expect(result.buffer).toBeNull();
			expect(new Uint8Array(bytes)).toEqual(new Uint8Array(original));
		} finally { spy.mockRestore(); }
	});
});

describe('M1 registry and resumable transactions', () => {
	it('exports authored metric headers from the bearings actually emitted and excludes zero advances from the average', () => {
		const font = FontFlux.open(fixture());
		font.addGlyph({ name: 'mark', unicode: 0x301, advanceWidth: 0 });
		const bytes = font.export(), view = new DataView(bytes);
		const hhea = entry(bytes, 'hhea').offset, os2 = entry(bytes, 'OS/2').offset;
		expect(view.getInt16(hhea + 14)).toBe(100);
		expect(view.getInt16(hhea + 16)).toBe(400);
		expect(view.getInt16(os2 + 2)).toBe(417);
		expect(FontFlux.inspect(bytes).diagnostics.issues.map((issue) => issue.code))
			.not.toContain('HHEA_DERIVED_EXTREMA_MISMATCH');
		expect(FontFlux.inspect(bytes).diagnostics.issues.map((issue) => issue.code))
			.not.toContain('QUALITY_AVERAGE_WIDTH_MISMATCH');
	});

	it('routes invalid UTF-16 metadata as a located finding rather than a silent missing check', () => {
		const bytes = fixture(), name = entry(bytes, 'name'), payload = table(bytes, 'name');
		const layout = nameLayout(payload), record = layout.records.find((item) => item.key[0] === 3);
		const stringOffset = new DataView(bytes).getUint16(name.offset + record.offset + 10);
		new DataView(bytes).setUint16(name.offset + layout.storage + stringOffset, 0xd800);
		const report = FontFlux.inspect(bytes);
		expect(report.diagnostics.issues.find((issue) => issue.code === 'QUALITY_NAME_ENCODING_INVALID'))
			.toMatchObject({ severity: 'error', source: 'original-bytes', location: { table: 'name' } });
		expect(report.checks.some((check) => check.reasonCode === 'unregistered-metadata-finding')).toBe(false);
	});
	it('rejects cyclic and non-JSON persistent plan context before inspection', async () => {
		const cyclic = {}; cyclic.self = cyclic;
		for (const context of [cyclic, { value: new Date() }, { value: NaN }])
			await expect(FontFlux.planRepairs(fixture(), [{ id: 'sfnt.checksums' }], { context }))
				.rejects.toThrow(/cyclic|plain objects|finite JSON/);
	});
	it('rejects incomplete metadata, unknown references, cycles and conflicts', () => {
		const descriptor = FontFlux.repairCatalog()[0];
		expect(() => validateRepairCatalog([{ ...descriptor, riskReason: '' }])).toThrow(/riskReason/);
		expect(() => validateRepairCatalog([{ ...descriptor, companions: ['missing'] }])).toThrow(/unknown/);
		expect(() => orderRepairs([{ id: 'a', after: ['b'] }, { id: 'b', after: ['a'] }])).toThrow(/Cyclic/);
		expect(() => orderRepairs([{ id: 'a', conflicts: ['b'] }, { id: 'b' }])).toThrow(/Conflicting/);
	});

	describe('public advanced quality and worker workflows', () => {
		it('verifies exact optional-table removal and explicitly emits OTTO for guarded outline conversion', async () => {
			const authored = FontFlux.open(fixture());
			authored.glyphs[0].leftSideBearing = 50;
			const raw = importFontTables(authored.export());
			raw.tables.gasp = { version: 1, gaspRanges: [{ rangeMaxPPEM: 65535, rangeGaspBehavior: 2 }] };
			const source = exportFont(raw);
			const removed = await repair(source, [{
				id: 'tables.remove-optional', inputs: { tag: 'gasp' }, consent: true,
			}]);
			expect(() => entry(removed.buffer, 'gasp')).toThrow(/Missing/);
			expect(table(removed.buffer, 'glyf')).toEqual(table(source, 'glyf'));
			const unnamed = await repair(removed.buffer, [{ id: 'post.drop-names', consent: true }]);
			const name = importFontTables(unnamed.buffer).tables.name.names.find((record) => record.nameID === 6).value;
			const converted = await repair(unnamed.buffer, [{
				id: 'outlines.to-cff', consent: true,
				inputs: { tolerance: 1, allowOutlineLoss: true, postScriptName: name },
			}]);
			expect(new DataView(converted.buffer).getUint32(0)).toBe(0x4f54544f);
			expect(() => entry(converted.buffer, 'glyf')).toThrow(/Missing/);
			expect(table(converted.buffer, 'CFF ').byteLength).toBeGreaterThan(0);
			expect(table(converted.buffer, 'hmtx')).toEqual(table(unnamed.buffer, 'hmtx'));
		});

		it('repairs a CFF maxp count from complete programs through the public verifier', async () => {
			const bytes = FontFlux.open(fixture()).export({ format: 'otf' });
			const originalPrograms = table(bytes, 'CFF ').slice();
			new DataView(bytes).setUint16(entry(bytes, 'maxp').offset + 4, 2);
			const result = await repair(bytes, [{ id: 'cff.maxp' }]);
			expect(new DataView(result.buffer).getUint16(entry(result.buffer, 'maxp').offset + 4)).toBe(3);
			expect(table(result.buffer, 'CFF ')).toEqual(originalPrograms);
		});

		it('appends an opt-in standard instance without overwriting an existing custom instance', async () => {
			const font = FontFlux.open(fixture());
			font.addAxis({ tag: 'wght', min: 100, default: 400, max: 900 });
			font.addInstance({ name: 'Heavy', coordinates: { wght: 800 } });
			const bytes = font.export(), raw = importFontTables(bytes);
			const nameID = raw.tables.name.names.find((record) => record.value === 'Heavy').nameID;
			const result = await repair(bytes, [{
				id: 'fvar.standard-instance', inputs: { nameID, weight: '900', postScriptNameID: 65535 },
			}]);
			const before = FontFlux.open(bytes).instances, after = FontFlux.open(result.buffer).instances;
			expect(after.slice(0, before.length)).toEqual(before);
			expect(after.at(-1).coordinates.wght).toBe(900);
			expect(table(result.buffer, 'glyf')).toEqual(table(bytes, 'glyf'));
		});

		it('exposes immutable inspection reuse and ignores untrusted entry/factory options', async () => {
			const bytes = fixture(), original = bytes.slice(0);
			const cache = FontFlux.createInspectionCache({ maxEntries: 1 });
			const first = await FontFlux.inspectAsync(bytes, {
				cache, entryURL: 'file:///untrusted.mjs',
				browserWorkerFactory: () => { throw new Error('Untrusted factory must not run'); },
			});
			first.limitations.push('Caller mutation');
			const second = await FontFlux.inspectAsync(bytes, { cache });
			expect(second.cache.status).toBe('hit');
			expect(second.cache.workerStarted).toBe(false);
			expect(second.limitations).not.toContain('Caller mutation');
			expect(bytes).toEqual(original);
			expect(cache.stats.hits).toBe(1);
			cache.clear();
			expect(cache.stats.entries).toBe(0);
		});

		it('reviews, persists, resumes and verifies exactly the public worker plan', async () => {
			const bytes = fixture();
			new DataView(bytes).setUint16(6, 0);
			const phases = [];
			const review = await FontFlux.planRepairsAsync(bytes, [{ id: 'sfnt.search-fields' }], {
				projectRevision: 7, onProgress: (progress) => phases.push(progress.phase),
			});
			expect(phases).toContain('planning');
			expect(review.planFingerprint).toBe(await FontFlux.fingerprintRepairPlan(review.plan));
			const saved = JSON.parse(JSON.stringify(review));
			const result = await FontFlux.applyRepairsAsync(bytes, saved, { projectRevision: 7 });
			expect(result.state).toBe('verified');
			expect(result.plan).toEqual(review.plan);
			saved.plan.steps[0].description = 'Unreviewed change';
			await expect(FontFlux.applyRepairsAsync(bytes, saved)).rejects.toThrow(/fingerprint|changed|stale/i);
			await expect(FontFlux.applyRepairsAsync(bytes, review, { projectRevision: 8 })).rejects.toThrow(/stale/i);
		});

		it('keeps declared original evidence distinct from a detached project and terminates cancellation', async () => {
			const bytes = fixture(), damaged = bytes.slice(0);
			new DataView(damaged).setUint32(entry(damaged, 'head').offset + 12, 0);
			const originalDamage = new Uint8Array(damaged).slice();
			const font = new FontFlux(FontFlux.open(bytes).data);
			const result = await font.preflightAsync({ format: 'sfnt', originalSource: { bytes: damaged } });
			expect(result.state).toBe('verified');
			expect(result.stages.map((stage) => stage.id)).toEqual(['original', 'project', 'resolved', 'output']);
			expect(result.stages[0].report.diagnostics.errors.map((issue) => issue.code)).toContain('BAD_MAGIC_NUMBER');
			expect(result.output.diagnostics.errors).toEqual([]);
			const controller = new AbortController();
			await expect(font.preflightAsync({ signal: controller.signal, onProgress: (progress) => {
				if (progress.phase === 'loading') controller.abort();
			} })).rejects.toMatchObject({ name: 'AbortError' });
			expect(new Uint8Array(damaged)).toEqual(originalDamage);
			expect(new DataView(bytes).getUint32(entry(bytes, 'head').offset + 12)).toBe(0x5f0f3cf5);
		});

		it('exposes contextual family, repertoire, source and legacy workflows without inferring authority', () => {
			const bytes = fixture(), font = FontFlux.open(bytes);
			expect(FontFlux.inspectFamily([{ id: 'regular', input: font }], {
				family: { id: 'declared', profile: 'author-v1', expectedMembers: ['regular', 'bold'] },
			}).issues.some((issue) => issue.code === 'FAMILY_MEMBER_MISSING')).toBe(true);
			expect(FontFlux.inspectExpectations(font, {
				repertoires: [{ id: 'author', version: '1', codePoints: [65, 66] }],
			}).issues.some((issue) => issue.code === 'EXPECTATION_REPERTOIRE_MISSING')).toBe(true);
			expect(FontFlux.inspectSourceQuality([{ id: 'master', input: font }]).complete).toBe(false);
			const afm = new TextEncoder().encode('StartFontMetrics 4.1\nEndFontMetrics');
			const legacy = FontFlux.inspect(afm);
			expect(legacy.legacyFormat).toBe('afm');
			expect(legacy.profileReport.valid).toBeNull();
			expect(legacy.diagnostics).toBeNull();
			expect(FontFlux.recoverLegacy(afm, bytes, { authorizeReplacement: true })).toMatchObject({
				state: 'inspected', preservedOriginal: true, equivalent: null,
			});
		});
	});

	it('produces equivalent plans independent of selection order and safely resumes serialized review', async () => {
		const bytes = fixture(), view = new DataView(bytes);
		view.setUint16(6, 0);
		view.setUint32(entry(bytes, 'head').offset + 12, 0);
		const requests = [{ id: 'sfnt.search-fields' }, { id: 'head.magic' }];
		const a = await FontFlux.planRepairs(bytes, requests, { projectRevision: 'revision-4' });
		const b = await FontFlux.planRepairs(bytes, requests.toReversed(), { projectRevision: 'revision-4' });
		expect(a).toEqual(b);
		expect(a.steps.at(-1).id).toBe('sfnt.checksums');
		const serialized = JSON.parse(JSON.stringify(a));
		await expect(FontFlux.applyRepairs(bytes, serialized)).rejects.toThrow(/deserialized/);
		const resumed = await FontFlux.resumeRepairPlan(bytes, serialized);
		expect((await FontFlux.applyRepairs(bytes, resumed)).state).toBe('verified');
		await expect(FontFlux.resumeRepairPlan(bytes, serialized, { projectRevision: 'revision-5' })).rejects.toThrow(/stale/);
		await expect(FontFlux.applyRepairs(bytes, a, { format: 'woff' })).rejects.toThrow(/stale/);
		serialized.steps[0].description = 'Changed approval';
		await expect(FontFlux.resumeRepairPlan(bytes, serialized)).rejects.toThrow(/changed/);
	});

	it('cancels before inspection, during planning, application and verification without returning bytes', async () => {
		const bytes = fixture();
		new DataView(bytes).setUint16(6, 0);
		const original = bytes.slice(0), requests = [{ id: 'sfnt.search-fields' }];
		for (const phase of ['inspection', 'planning']) {
			const controller = new AbortController();
			await expect(FontFlux.planRepairs(bytes, requests, { signal: controller.signal, onProgress: (progress) => {
				if (progress.phase === phase) controller.abort();
			} })).rejects.toMatchObject({ name: 'AbortError' });
		}
		const plan = await FontFlux.planRepairs(bytes, requests);
		for (const phase of ['application', 'verification']) {
			const controller = new AbortController();
			await expect(FontFlux.applyRepairs(bytes, plan, { signal: controller.signal, onProgress: (progress) => {
				if (progress.phase === phase) controller.abort();
			} })).rejects.toMatchObject({ name: 'AbortError' });
		}
		expect(bytes).toEqual(original);
	});

	it('rejects ambiguous duplicate cmap encodings during planning rather than application', async () => {
		const bytes = fixture(), cmap = entry(bytes, 'cmap'), view = new DataView(bytes);
		view.setUint32(cmap.offset + 12, view.getUint32(cmap.offset + 4));
		const offer = FontFlux.inspect(bytes).repairs.find((fix) => fix.id === 'cmap.order');
		if (offer) expect(offer.availability).toBe('blocked');
		await expect(FontFlux.planRepairs(bytes, [{ id: 'cmap.order' }])).rejects.toThrow(/ambiguous|Duplicate|applicable|Inspection/);
	});
});

describe('M1 localized metadata and explicit policies', () => {
	it('adds a missing locale while preserving conflicting legacy values and rejects duplicate authority', async () => {
		const raw = importFontTables(fixture());
		raw.tables.name.names.push({ platformID: 1, encodingID: 0, languageID: 0, nameID: 1, value: 'Legacy Family' });
		const bytes = exportFont(raw), before = nameLayout(table(bytes, 'name'));
		const result = await repair(bytes, [{ id: 'name.record', inputs: {
			nameID: 1, languageID: 1041, value: 'Chosen Japanese Family', authority: true,
		} }]);
		const after = nameLayout(table(result.buffer, 'name'));
		expect(after.records.filter((record) => record.key.join(',') !== '3,1,1041,1')
			.map(({ key, bytes }) => ({ key, bytes }))).toEqual(before.records.map(({ key, bytes }) => ({ key, bytes })));
		raw.tables.name.names.push({ ...raw.tables.name.names.find((record) => record.platformID === 3 && record.nameID === 1), value: 'Conflicting Family' });
		const ambiguous = exportFont(raw);
		await expect(FontFlux.planRepairs(ambiguous, [{ id: 'name.record', inputs: {
			nameID: 1, languageID: 1033, value: 'Chosen', authority: true,
		} }])).rejects.toThrow(/ambiguous|duplicate/i);
		await expect(FontFlux.planRepairs(bytes, [{ id: 'name.record', inputs: {
			nameID: 1, languageID: 1033, value: 'Trailing space ', authority: true,
		} }])).rejects.toThrow(/whitespace/);
		await expect(FontFlux.planRepairs(bytes, [{ id: 'rights.embedding', inputs: { value: 0x8000, authority: true } }]))
			.rejects.toThrow(/reserved/);
	});

	it('refuses static style and metric policies for variable fonts without changing their source', () => {
		const font = FontFlux.open(fixture());
		font.addAxis({ tag: 'wght', min: 100, default: 400, max: 900 });
		const bytes = font.export(), original = new Uint8Array(bytes).slice();
		const report = FontFlux.inspect(bytes);
		for (const id of ['metadata.style', 'metadata.italic', 'metadata.fixed-pitch', 'metrics.line', 'metrics.advance'])
			expect(report.repairs.find((fix) => fix.id === id)).toMatchObject({ availability: 'blocked', reason: expect.stringMatching(/Variable/) });
		expect(new Uint8Array(bytes)).toEqual(original);
	});

	it.each([0, 200])('retains explicit CJK line-gap policy %i without changing advances or artwork', async (lineGap) => {
		const font = FontFlux.open(fixture());
		font.addGlyph({ name: 'ideograph', unicode: 0x4e00, advanceWidth: 1000 });
		const bytes = font.export();
		const result = await repair(bytes, [{ id: 'metrics.line', inputs: {
			ascender: 1000, descender: -200, lineGap, winAscent: 1100, winDescent: 300, useTypoMetrics: true, authority: true,
		} }]);
		const view = new DataView(result.buffer);
		expect(view.getInt16(entry(result.buffer, 'hhea').offset + 8)).toBe(lineGap);
		expect(view.getInt16(entry(result.buffer, 'OS/2').offset + 72)).toBe(lineGap);
		for (const tag of ['hmtx', 'glyf', 'cmap']) expect(table(result.buffer, tag)).toEqual(table(bytes, tag));
	});

	it('preserves format-14 and legacy cmap payloads through sorting and a selected supplementary mapping edit', async () => {
		const raw = importFontTables(fixture()), cmap = raw.tables.cmap;
		const append = (platformID, encodingID, subtable) => {
			cmap.encodingRecords.push({ platformID, encodingID, subtableIndex: cmap.subtables.length });
			cmap.subtables.push(subtable);
		};
		append(0, 5, { format: 14, varSelectorRecords: [{ varSelector: 0xfe0f,
			defaultUVS: [{ startUnicodeValue: 32, additionalCount: 0 }], nonDefaultUVS: [{ unicodeValue: 65, glyphID: 2 }],
		}] });
		append(1, 0, { format: 0, language: 0, glyphIdArray: Array.from({ length: 256 }, (_, code) => code === 65 ? 2 : 0) });
		append(3, 10, { format: 12, language: 0, groups: [{ startCharCode: 0x10000, endCharCode: 0x10000, startGlyphID: 2 }] });
		const bytes = exportFont(raw);
		const cmapBytes = table(bytes, 'cmap'), first = cmapBytes.slice(4, 12);
		cmapBytes.copyWithin(4, 12, 20); cmapBytes.set(first, 12);
		const sorted = await repair(bytes, [{ id: 'cmap.order' }]);
		const before = parseCmap(table(sorted.buffer, 'cmap'));
		const result = await repair(sorted.buffer, [{ id: 'cmap.mapping', inputs: {
			platformID: 3, encodingID: 10, codePoint: 0x1d400, glyphID: 2, authority: true,
		} }]);
		const after = parseCmap(table(result.buffer, 'cmap'));
		for (const record of before.encodingRecords) {
			if (record.platformID === 3 && record.encodingID === 10) continue;
			const match = after.encodingRecords.find((item) => item.platformID === record.platformID && item.encodingID === record.encodingID);
			expect(after.subtables[match.subtableIndex]).toEqual(before.subtables[record.subtableIndex]);
		}
		expect(new DataView(result.buffer).getUint16(entry(result.buffer, 'OS/2').offset + 66)).toBe(65535);
		expect(table(result.buffer, 'glyf')).toEqual(table(bytes, 'glyf'));
	});

	it('derives character bounds from Windows mappings rather than divergent Unicode-platform mappings', async () => {
		const raw = importFontTables(fixture()), cmap = raw.tables.cmap;
		const platformZero = cmap.encodingRecords.find((record) => record.platformID === 0);
		platformZero.subtableIndex = cmap.subtables.length;
		cmap.subtables.push({ format: 12, language: 0, groups: [
			{ startCharCode: 0x0905, endCharCode: 0x0905, startGlyphID: 2 },
		] });
		const bytes = exportFont(raw), offset = entry(bytes, 'OS/2').offset;
		new DataView(bytes).setUint16(offset + 64, 0);
		new DataView(bytes).setUint16(offset + 66, 0);
		const result = await repair(bytes, [{ id: 'os2.character-range' }]);
		const view = new DataView(result.buffer), resultOffset = entry(result.buffer, 'OS/2').offset;
		expect([view.getUint16(resultOffset + 64), view.getUint16(resultOffset + 66)]).toEqual([32, 65]);
		expect(table(result.buffer, 'cmap')).toEqual(table(bytes, 'cmap'));
	});

	it('includes Windows symbol mappings in character bounds but not in Unicode range declarations', async () => {
		const raw = importFontTables(fixture());
		raw.tables.cmap.encodingRecords.find((record) => record.platformID === 3).encodingID = 0;
		const bytes = exportFont(raw), offset = entry(bytes, 'OS/2').offset;
		new DataView(bytes).setUint16(offset + 66, 0);
		const result = await repair(bytes, [{ id: 'os2.character-range' }]);
		expect(new DataView(result.buffer).getUint16(entry(result.buffer, 'OS/2').offset + 66)).toBe(65);
		await expect(FontFlux.planRepairs(bytes, [{ id: 'os2.unicode-ranges', inputs: { authority: true } }]))
			.rejects.toThrow(/Windows cmap/);
	});

	it('replaces one locale without changing other encoded records or glyph data; repeated values are a no-op', async () => {
		const bytes = fixture(), before = nameLayout(table(bytes, 'name'));
		const request = { id: 'name.record', inputs: { nameID: 1, languageID: 1033, value: 'Chosen family', authority: true } };
		const result = await repair(bytes, [request]);
		const after = nameLayout(table(result.buffer, 'name'));
		const unselected = (records) => records.filter((record) => record.key.join(',') !== '3,1,1033,1').map(({ key, bytes }) => ({ key, bytes }));
		expect(unselected(after.records)).toEqual(unselected(before.records));
		expect(table(result.buffer, 'glyf')).toEqual(table(bytes, 'glyf'));
		const selected = after.records.find((record) => record.key.join(',') === '3,1,1033,1');
		expect(new TextDecoder('utf-16be').decode(Uint8Array.from(selected.bytes))).toBe('Chosen family');
		const again = await repair(result.buffer, [request]);
		expect(again.changed).toBe(false);
		expect(again.buffer).toEqual(result.buffer);
	});

	it('validates PostScript naming, explicit rights authority, loss consent and reserved embedding bits', async () => {
		const bytes = fixture();
		await expect(FontFlux.planRepairs(bytes, [{ id: 'name.record', inputs: {
			nameID: 6, languageID: 1033, value: 'Bad / Name', authority: true,
		} }])).rejects.toThrow(/PostScript/);
		await expect(FontFlux.planRepairs(bytes, [{ id: 'rights.embedding', inputs: { value: 0, authority: false } }])).rejects.toThrow(/confirmation/);
		await expect(FontFlux.planRepairs(bytes, [{ id: 'rights.embedding', inputs: { value: 6, authority: true } }])).rejects.toThrow(/exclusive/);
		await expect(FontFlux.planRepairs(bytes, [{ id: 'name.remove-record', inputs: {
			platformID: 3, encodingID: 1, languageID: 1033, nameID: 1,
		} }])).rejects.toThrow(/consent/);
		const result = await repair(bytes, [{ id: 'rights.embedding', inputs: { value: 0x104, authority: true } }]);
		expect(new DataView(result.buffer).getUint16(entry(result.buffer, 'OS/2').offset + 8)).toBe(0x104);
		expect(table(result.buffer, 'name')).toEqual(table(bytes, 'name'));
	});

	it('combines style and line choices without clobbering independently selected flag bits', async () => {
		const bytes = fixture();
		const result = await repair(bytes, [
			{ id: 'metadata.style', inputs: { weight: 700, width: 5, bold: true, italic: false, regular: false, authority: true } },
			{ id: 'metrics.line', inputs: { ascender: 900, descender: -200, lineGap: 0, winAscent: 1000, winDescent: 300, useTypoMetrics: false, authority: true } },
		]);
		const view = new DataView(result.buffer), os2 = entry(result.buffer, 'OS/2').offset;
		expect(view.getUint16(os2 + 62) & 0xe1).toBe(0x20);
		expect(view.getInt16(os2 + 68)).toBe(900);
		expect(table(result.buffer, 'hmtx')).toEqual(table(bytes, 'hmtx'));
	});

	it('keeps declined policies observational and rejects incompatible authoritative choices', async () => {
		const bytes = fixture();
		new DataView(bytes).setUint16(entry(bytes, 'OS/2').offset + 4, 1001);
		const original = bytes.slice(0);
		await FontFlux.planRepairs(bytes, [{ id: 'os2.weight', inputs: { value: 600 } }]);
		expect(bytes).toEqual(original);
		expect(FontFlux.inspect(bytes).diagnostics.issues.some((issue) => issue.code === 'OS2_WEIGHT_CLAMPED')).toBe(true);
		await expect(FontFlux.planRepairs(bytes, [
			{ id: 'os2.weight', inputs: { value: 600 } },
			{ id: 'metadata.style', inputs: { weight: 700, width: 5, bold: true, italic: false, regular: false, authority: true } },
		])).rejects.toThrow(/Conflicting/);
	});

	it('edits NBSP only in the chosen encoding while retaining all unrelated cmap bytes and glyphs', async () => {
		const bytes = fixture(), beforeBytes = table(bytes, 'cmap').slice();
		const before = parseCmap(beforeBytes), other = before.encodingRecords.find((record) => record.platformID === 0);
		const result = await repair(bytes, [{ id: 'cmap.mapping', inputs: {
			platformID: 3, encodingID: 1, codePoint: 160, glyphID: 1, authority: true,
		} }]);
		const after = parseCmap(table(result.buffer, 'cmap'));
		const chosen = after.encodingRecords.find((record) => record.platformID === 3 && record.encodingID === 1);
		expect(subtableMappings(after.subtables[chosen.subtableIndex]).get(160)).toBe(1);
		const retained = after.encodingRecords.find((record) => record.platformID === other.platformID && record.encodingID === other.encodingID);
		expect(after.subtables[retained.subtableIndex]).toEqual(before.subtables[other.subtableIndex]);
		expect(table(result.buffer, 'glyf')).toEqual(table(bytes, 'glyf'));
		await expect(FontFlux.planRepairs(bytes, [{ id: 'cmap.mapping', inputs: {
			platformID: 3, encodingID: 1, codePoint: 0xd800, glyphID: 1, authority: true,
		} }])).rejects.toThrow(/scalar/);
	});

	it('rolls back serialization failures without changing input', async () => {
		const bytes = fixture(), original = bytes.slice(0);
		const plan = await FontFlux.planRepairs(bytes, [{ id: 'name.record', inputs: {
			nameID: 1, languageID: 1033, value: 'Chosen', authority: true,
		} }]);
		const mock = vi.spyOn(exporter, 'exportFont').mockImplementation(() => { throw new Error('injected serializer failure'); });
		try { await expect(FontFlux.applyRepairs(bytes, plan)).rejects.toThrow(/injected/); }
		finally { mock.mockRestore(); }
		expect(bytes).toEqual(original);
	});

	it('coordinates an explicit shared whitespace advance with exact extrema and average metadata', async () => {
		const bytes = fixture();
		const result = await repair(bytes, [{ id: 'metrics.advance', inputs: { glyphID: 1, value: 321, authority: true } }]);
		const font = FontFlux.open(result.buffer);
		expect(font.data.glyphs[1].advanceWidth).toBe(321);
		expect(font.data.glyphs[2].advanceWidth).toBe(FontFlux.open(bytes).data.glyphs[2].advanceWidth);
		expect(table(result.buffer, 'glyf')).toEqual(table(bytes, 'glyf'));
		expect(table(result.buffer, 'cmap')).toEqual(table(bytes, 'cmap'));
		expect(result.changes.some((change) => change.id === 'os2.average-width')).toBe(true);
	});

	it('routes derived geometry through the same source-bound public registry', async () => {
		const bytes = fixture(), view = new DataView(bytes), head = entry(bytes, 'head');
		view.setInt16(head.offset + 36, -7);
		const offer = FontFlux.inspect(bytes).repairs.find((fix) => fix.id === 'tt.bounds');
		expect(offer?.availability).toBe('available');
		const result = await repair(bytes, [{ id: 'tt.bounds' }]);
		expect(new DataView(result.buffer).getInt16(entry(result.buffer, 'head').offset + 36)).toBe(0);
		expect(table(result.buffer, 'hmtx')).toEqual(table(bytes, 'hmtx'));
	});
});

describe('M1 container-preserving repair', () => {
	it.each(['woff', 'woff2'])('patches %s reserved/length fields without re-encoding a byte', async (format) => {
		const bytes = (format === 'woff' ? wrapWOFF1 : wrapWOFF2)(fixture(), new TextEncoder().encode('<metadata/>'), Uint8Array.from([1, 2, 3]));
		const view = new DataView(bytes);
		view.setUint16(14, 7); view.setUint32(8, bytes.byteLength - 1);
		const original = new Uint8Array(bytes.slice(0));
		const result = await repair(bytes, [{ id: 'container.reserved' }, { id: 'container.length' }]);
		expect(result.after.format).toBe(format);
		const output = new Uint8Array(result.buffer);
		original.fill(0, 8, 12); output.fill(0, 8, 12);
		original.fill(0, 14, 16); output.fill(0, 14, 16);
		expect(output).toEqual(original);
	});

	it.each(['woff', 'woff2'])('preserves %s metadata, private payload and version during a table repair', async (format) => {
		const raw = fixture();
		new DataView(raw).setUint32(entry(raw, 'head').offset + 12, 0);
		const wrap = format === 'woff' ? wrapWOFF1 : wrapWOFF2;
		const unwrap = format === 'woff' ? unwrapWOFF1 : unwrapWOFF2;
		const metadata = new TextEncoder().encode('<metadata version="1.0"/>'), privateData = Uint8Array.from([3, 5, 7]);
		const bytes = wrap(raw, metadata, privateData);
		new DataView(bytes).setUint32(format === 'woff' ? 20 : 24, 0x00030004);
		const result = await repair(bytes, [{ id: 'head.magic' }]);
		const after = unwrap(result.buffer);
		expect(after.metadata).toEqual(metadata);
		expect(after.privateData).toEqual(privateData);
		expect(table(after.sfnt, 'glyf')).toEqual(table(raw, 'glyf'));
		expect(result.changes.some((change) => change.id === 'container.preservation')).toBe(true);
	});

	it('uses copy-on-write for a selected collection face and retains every other source byte', async () => {
		const raw = importFontTables(fixture());
		const bytes = exportFont({ collection: { tag: 'ttcf', majorVersion: 1 }, fonts: [raw, structuredClone(raw)] });
		const view = new DataView(bytes), face = view.getUint32(12);
		view.setUint32(entry(bytes, 'head', face).offset + 12, 0);
		await expect(FontFlux.planRepairs(bytes, [{ id: 'head.magic' }])).rejects.toThrow(/faceIndex/);
		const result = await repair(bytes, [{ id: 'head.magic' }], { faceIndex: 0 });
		expect(result.buffer.byteLength).toBeGreaterThan(bytes.byteLength);
		const prefix = new Uint8Array(result.buffer.slice(0, bytes.byteLength)), original = new Uint8Array(bytes.slice(0));
		prefix.fill(0, 12, 16); original.fill(0, 12, 16);
		expect(prefix).toEqual(original);
		expect(new DataView(result.buffer).getUint32(16)).toBe(view.getUint32(16));
	});
});
