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
