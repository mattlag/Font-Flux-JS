import { describe, expect, it, vi } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { exportFont } from '../src/export.js';
import * as exportPipeline from '../src/export.js';
import { importFontTables } from '../src/import.js';
import { parseName } from '../src/sfnt/table_name.js';
import * as diagnostics from '../src/validate/diagnoseFont.js';

function fontBytes() {
	const font = FontFlux.create({ family: 'Quality test', style: 'Regular' });
	font.addGlyph({
		name: 'A',
		unicode: 65,
		advanceWidth: 500,
		contours: [
			[
				{ x: 0, y: 0, onCurve: true },
				{ x: 100, y: 400, onCurve: true },
				{ x: 200, y: 0, onCurve: true },
			],
		],
	});
	return font.export({ format: 'sfnt' });
}

function entry(buffer, tag) {
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < view.getUint16(4); i++) {
		const record = 12 + i * 16;
		if (String.fromCharCode(...bytes.slice(record, record + 4)) === tag)
			return {
				record,
				offset: view.getUint32(record + 8),
				length: view.getUint32(record + 12),
			};
	}
	throw new Error(`Missing test table ${tag}`);
}

function checksum(buffer) {
	const bytes = new Uint8Array(buffer);
	let sum = 0;
	for (let i = 0; i < bytes.length; i += 4) {
		let word = 0;
		for (let j = 0; j < 4; j++) word = word * 256 + (bytes[i + j] ?? 0);
		sum = (sum + word) >>> 0;
	}
	return sum;
}

describe('quality inspection and repair contracts', () => {
	it('keeps audit edits separate from plans and supports native Node Web Crypto', async () => {
		const buffer = fontBytes();
		new DataView(buffer).setUint16(6, 0);
		vi.stubGlobal('crypto', undefined);
		try {
			const plan = await FontFlux.planRepairs(buffer, [{ id: 'sfnt.search-fields' }]);
			const first = await FontFlux.applyRepairs(buffer, plan);
			expect(first.state).toBe('verified');
			first.before.diagnostics.issues.length = 0;
			const repeated = await FontFlux.applyRepairs(buffer, plan);
			expect(repeated.state).toBe('verified');
			expect(repeated.before.diagnostics.issues.length).toBeGreaterThan(0);
			expect(repeated.buffer).toEqual(first.buffer);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('exposes immutable descriptions and explicit decisions/consequences', () => {
		for (const descriptor of FontFlux.repairCatalog()) {
			expect(descriptor.description).toBeTruthy();
			expect(descriptor.ifApplied).toBeTruthy();
			expect(descriptor.ifUnfixed).toBeTruthy();
			expect(descriptor.prerequisites).toBeTruthy();
			expect(Object.isFrozen(descriptor)).toBe(true);
		}
		expect(() =>
			FontFlux.inspect(fontBytes(), { profile: 'googlefonts' }),
		).toThrow(/Unknown quality profile/);
		expect(() => FontFlux.inspect(fontBytes(), { maxInputBytes: 1 })).toThrow(
			/maxInputBytes/,
		);
		expect(() => FontFlux.inspect('bad')).toThrow(/ArrayBuffer/);
	});

	it('inspects typed-array views observationally and discloses partial coverage', () => {
		const buffer = fontBytes();
		const padded = new Uint8Array(buffer.byteLength + 10);
		padded.set(new Uint8Array(buffer), 5);
		const report = FontFlux.inspect(padded.subarray(5, padded.length - 5));
		expect(report.format).toBe('sfnt');
		expect(report.diagnostics.valid).toBe(true);
		expect(
			report.coverage.some(
				(item) =>
					item.domain === 'shaping-and-rendering' &&
					item.status === 'unsupported',
			),
		).toBe(true);
		expect(padded.slice(5, -5)).toEqual(new Uint8Array(buffer));
	});

	it('recalculates standalone checksums and preserves every other byte', async () => {
		const buffer = fontBytes();
		const head = entry(buffer, 'head');
		new DataView(buffer).setUint32(head.offset + 8, 0);
		const original = buffer.slice(0);
		const inspection = FontFlux.inspect(buffer);
		expect(inspection.repairs.some((fix) => fix.id === 'sfnt.checksums')).toBe(
			true,
		);
		const plan = await FontFlux.planRepairs(buffer, [{ id: 'sfnt.checksums' }]);
		expect(plan.inputFingerprint).toMatch(/^[a-f0-9]{64}$/);
		const result = await FontFlux.applyRepairs(buffer, plan);
		expect(result.verification.failures).toEqual([]);
		expect(result.state).toBe('verified');
		expect(checksum(result.buffer)).toBe(0xb1b0afba);
		const a = new Uint8Array(original.slice(0)),
			b = new Uint8Array(result.buffer.slice(0));
		a.fill(0, head.offset + 8, head.offset + 12);
		b.fill(0, head.offset + 8, head.offset + 12);
		expect(b).toEqual(a);
		expect(buffer).toEqual(original);
		expect(
			FontFlux.inspect(result.buffer).repairs.some(
				(fix) => fix.id === 'sfnt.checksums',
			),
		).toBe(false);
	});

	it('combines header/order repairs with a disclosed checksum companion', async () => {
		const buffer = fontBytes();
		const view = new DataView(buffer),
			bytes = new Uint8Array(buffer);
		view.setUint16(6, 0);
		const first = bytes.slice(12, 28),
			second = bytes.slice(28, 44);
		bytes.set(second, 12);
		bytes.set(first, 28);
		const original = buffer.slice(0);
		const plan = await FontFlux.planRepairs(buffer, [
			{ id: 'sfnt.search-fields' },
			{ id: 'sfnt.directory-order' },
		]);
		expect(plan.steps.at(-1)).toMatchObject({
			id: 'sfnt.checksums',
			implicit: true,
		});
		const result = await FontFlux.applyRepairs(buffer, plan);
		expect(result.verification.failures).toEqual([]);
		expect(result.after.diagnostics.valid).toBe(true);
		expect(checksum(result.buffer)).toBe(0xb1b0afba);
		expect(buffer).toEqual(original);
	});

	it('sorts name and cmap records without changing strings or mappings', async () => {
		const buffer = fontBytes(),
			bytes = new Uint8Array(buffer);
		const name = entry(buffer, 'name'),
			cmap = entry(buffer, 'cmap');
		const swap = (offset, size) => {
			const first = bytes.slice(offset, offset + size);
			bytes.copyWithin(offset, offset + size, offset + size * 2);
			bytes.set(first, offset + size);
		};
		swap(name.offset + 6, 12);
		swap(cmap.offset + 4, 8);
		const originalNames = parseName(
			bytes.subarray(name.offset, name.offset + name.length),
		);
		const original = buffer.slice(0);
		const plan = await FontFlux.planRepairs(buffer, [
			{ id: 'name.order' },
			{ id: 'cmap.order' },
		]);
		const result = await FontFlux.applyRepairs(buffer, plan);
		expect(result.verification.failures).toEqual([]);
		expect(
			parseName(new Uint8Array(result.buffer, name.offset, name.length)).names,
		).toEqual(expect.arrayContaining(originalNames.names));
		const mappings = (bytes) =>
			FontFlux.open(bytes).glyphs.map((glyph) => ({
				unicode: glyph.unicode,
				unicodes: glyph.unicodes,
			}));
		expect(mappings(result.buffer)).toEqual(mappings(buffer));
		expect(buffer).toEqual(original);
	});

	it('rebuilds misaligned extents and rejects dropping nonzero unreferenced data', async () => {
		const source = fontBytes();
		const offset = entry(source, 'head').offset;
		const shifted = new Uint8Array(source.byteLength + 1);
		shifted.set(new Uint8Array(source, 0, offset));
		shifted.set(new Uint8Array(source, offset), offset + 1);
		const view = new DataView(shifted.buffer);
		for (let i = 0; i < view.getUint16(4); i++) {
			const record = 12 + i * 16;
			if (view.getUint32(record + 8) >= offset)
				view.setUint32(record + 8, view.getUint32(record + 8) + 1);
		}
		const original = shifted.slice();
		const plan = await FontFlux.planRepairs(shifted, [
			{ id: 'sfnt.alignment' },
		]);
		const result = await FontFlux.applyRepairs(shifted, plan);
		expect(result.verification.failures).toEqual([]);
		expect(
			result.after.diagnostics.issues.some(
				(issue) => issue.code === 'TABLE_MISALIGNED',
			),
		).toBe(false);
		expect(shifted).toEqual(original);
		shifted[offset] = 123;
		expect(
			FontFlux.inspect(shifted).repairs.find(
				(fix) => fix.id === 'sfnt.alignment',
			).reason,
		).toMatch(/Nonzero bytes/);
	});

	it('rejects stale, forged, duplicate, unavailable, and empty plans', async () => {
		const buffer = fontBytes();
		new DataView(buffer).setUint16(6, 0);
		const plan = await FontFlux.planRepairs(buffer, [
			{ id: 'sfnt.search-fields' },
		]);
		expect(Object.isFrozen(plan.steps[0])).toBe(true);
		await expect(
			FontFlux.applyRepairs(buffer, JSON.parse(JSON.stringify(plan))),
		).rejects.toThrow(/forged/);
		new DataView(buffer).setUint16(6, 16);
		await expect(FontFlux.applyRepairs(buffer, plan)).rejects.toThrow(/stale/);
		await expect(FontFlux.planRepairs(buffer, [])).rejects.toThrow(
			/Select at least/,
		);
		await expect(
			FontFlux.planRepairs(buffer, [{ id: 'unknown' }]),
		).rejects.toThrow(/not applicable/);
		await expect(
			FontFlux.planRepairs(buffer, [
				{ id: 'sfnt.checksums' },
				{ id: 'sfnt.checksums' },
			]),
		).rejects.toThrow(/unique/);
	});

	it.each([
		'new-warning',
		'target-remains',
	])('rejects %s during post-write verification', async (failure) => {
		const buffer = fontBytes();
		new DataView(buffer).setUint16(6, 0);
		const original = buffer.slice(0);
		const plan = await FontFlux.planRepairs(buffer, [
			{ id: 'sfnt.search-fields' },
		]);
		const diagnose = diagnostics.diagnoseFont;
		const spy = vi
			.spyOn(diagnostics, 'diagnoseFont')
			.mockImplementationOnce((bytes, options) => {
				const report = diagnose(bytes, options);
				const issue = {
					severity: 'warning',
					code:
						failure === 'target-remains'
							? 'BAD_SEARCH_RANGE'
							: 'NEW_TEST_WARNING',
					message: 'Injected post-write check failure.',
				};
				report.issues.push(issue);
				report.warnings.push(issue);
				report.summary.warningCount++;
				report.summary.issueCount++;
				return report;
			});
		try {
			const result = await FontFlux.applyRepairs(buffer, plan);
			expect(result.state).toBe('failed');
			expect(result.buffer).toBeNull();
			expect(result.verification.failures.length).toBeGreaterThan(0);
			expect(buffer).toEqual(original);
		} finally {
			spy.mockRestore();
		}
	});

	it('preserves opaque payloads for in-place repairs and blocks ambiguous extents', async () => {
		const raw = importFontTables(fontBytes());
		raw.tables.TEST = { _raw: [1, 2, 3, 4, 5] };
		const buffer = exportFont(raw);
		new DataView(buffer).setUint16(6, 0);
		const plan = await FontFlux.planRepairs(buffer, [
			{ id: 'sfnt.search-fields' },
		]);
		const result = await FontFlux.applyRepairs(buffer, plan);
		const originalEntry = entry(buffer, 'TEST'),
			newEntry = entry(result.buffer, 'TEST');
		expect(newEntry.offset).toBe(originalEntry.offset);
		expect(
			new Uint8Array(result.buffer, newEntry.offset, newEntry.length),
		).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
		const record = entry(buffer, 'TEST').record;
		new DataView(buffer).setUint32(record + 8, 0);
		expect(
			FontFlux.inspect(buffer).repairs.every(
				(fix) => fix.availability === 'blocked',
			),
		).toBe(true);
	});

	it('requires values for assisted OS/2 corrections instead of clamping', async () => {
		const buffer = fontBytes(),
			os2 = entry(buffer, 'OS/2');
		new DataView(buffer).setUint16(os2.offset + 4, 1001);
		const original = buffer.slice(0);
		expect(
			FontFlux.inspect(buffer).repairs.find((fix) => fix.id === 'os2.weight'),
		).toMatchObject({ risk: 'assisted', availability: 'needs-input' });
		await expect(
			FontFlux.planRepairs(buffer, [{ id: 'os2.weight' }]),
		).rejects.toThrow(/integer/);
		await expect(
			FontFlux.planRepairs(buffer, [
				{ id: 'os2.weight', inputs: { value: 1001 } },
			]),
		).rejects.toThrow(/integer/);
		const plan = await FontFlux.planRepairs(buffer, [
			{ id: 'os2.weight', inputs: { value: 400 } },
		]);
		const result = await FontFlux.applyRepairs(buffer, plan);
		expect(result.verification.failures).toEqual([]);
		expect(new DataView(result.buffer).getUint16(os2.offset + 4)).toBe(400);
		expect(buffer).toEqual(original);
	});

	it('blocks repair when diagnostic work did not complete', async () => {
		const buffer = fontBytes();
		new DataView(buffer).setUint16(6, 0);
		const report = FontFlux.inspect(buffer, { maxGlyphs: 1 });
		expect(report.diagnostics.valid).toBe(false);
		expect(report.repairs.every((fix) => fix.availability === 'blocked')).toBe(
			true,
		);
		await expect(
			FontFlux.planRepairs(buffer, [{ id: 'sfnt.search-fields' }], {
				maxGlyphs: 1,
			}),
		).rejects.toThrow(/blocked|limit|not applicable/i);
	});

	it('rejects invalid assisted decisions without changing source', async () => {
		const raw = importFontTables(fontBytes());
		raw.tables.name.names = raw.tables.name.names.filter(
			(name) => name.nameID !== 1,
		);
		const buffer = exportFont(raw),
			original = buffer.slice(0);
		for (const value of ['', 'bad\u0000name', '\ud800', 'a'.repeat(256)]) {
			await expect(
				FontFlux.planRepairs(buffer, [
					{ id: 'name.family', inputs: { value, languageID: 1033 } },
				]),
			).rejects.toThrow(/well-formed text/);
		}
		expect(buffer).toEqual(original);
	});

	it('adds missing names while retaining all existing names and language tags', async () => {
		const raw = importFontTables(fontBytes());
		raw.tables.name.version = 1;
		raw.tables.name.langTagRecords = [{ tag: 'ja-JP' }];
		raw.tables.name.names = raw.tables.name.names.filter(
			(name) => name.nameID !== 1,
		);
		raw.tables.name.names.push({
			platformID: 0,
			encodingID: 4,
			languageID: 0x8000,
			nameID: 256,
			value: 'Localized test',
		});
		const buffer = exportFont(raw),
			original = buffer.slice(0);
		await expect(
			FontFlux.planRepairs(buffer, [
				{ id: 'name.family', inputs: { value: 'New family' } },
			]),
		).rejects.toThrow(/language ID/);
		const plan = await FontFlux.planRepairs(buffer, [
			{ id: 'name.family', inputs: { value: 'New family', languageID: 1033 } },
		]);
		const result = await FontFlux.applyRepairs(buffer, plan);
		expect(result.verification.failures).toEqual([]);
		const name = entry(result.buffer, 'name');
		const parsed = parseName(
			new Uint8Array(result.buffer, name.offset, name.length),
		);
		expect(parsed.names).toContainEqual({
			platformID: 3,
			encodingID: 1,
			languageID: 1033,
			nameID: 1,
			value: 'New family',
		});
		expect(parsed.langTagRecords).toEqual([{ tag: 'ja-JP' }]);
		expect(buffer).toEqual(original);
	});

	it('requires signature consent and preserves signed originals', async () => {
		const raw = importFontTables(fontBytes());
		raw.tables.DSIG = { _raw: [0, 0, 0, 1, 0, 0, 0, 0] };
		const buffer = exportFont(raw);
		new DataView(buffer).setUint16(6, 0);
		const original = buffer.slice(0);
		expect(
			FontFlux.inspect(buffer).repairs.find(
				(fix) => fix.id === 'sfnt.search-fields',
			).availability,
		).toBe('blocked');
		await expect(
			FontFlux.planRepairs(buffer, [{ id: 'dsig.remove' }]),
		).rejects.toThrow(/consent/);
		const plan = await FontFlux.planRepairs(buffer, [
			{ id: 'dsig.remove', consent: true },
			{ id: 'sfnt.search-fields' },
		]);
		const result = await FontFlux.applyRepairs(buffer, plan);
		expect(result.verification.failures).toEqual([]);
		expect(() => entry(result.buffer, 'DSIG')).toThrow(/Missing/);
		expect(buffer).toEqual(original);
	});

	it('reports wrappers and legacy coverage without advertising a fake repair', () => {
		const font = FontFlux.open(fontBytes());
		const woff = font.export({ format: 'woff' });
		expect(FontFlux.inspect(woff).format).toBe('woff');
		const legacy = FontFlux.inspect(new TextEncoder().encode('%!PS-AdobeFont'));
		expect(legacy.format).toBe('type1');
		expect(legacy.diagnostics.errors.map((issue) => issue.code)).toContain('LEGACY_STRUCTURE_INVALID');
		expect(legacy.diagnostics.errors.some((issue) => issue.code === 'REQUIRED_TABLE_MISSING')).toBe(false);
		expect(legacy.profileReport.complete).toBe(false);
		expect(legacy.repairs).toEqual([]);
	});
});

describe('actual-output project preflight', () => {
	it('preserves editable finding scope when detached export resolution fails', () => {
		const font = FontFlux.open(fontBytes());
		font.data.glyphs[2].name = font.data.glyphs[1].name;
		const spy = vi.spyOn(exportPipeline, 'resolveExportSource').mockImplementationOnce(() => {
			throw new Error('Injected resolution failure.');
		});
		try {
			const report = font.validate();
			expect(report.warnings.length).toBeGreaterThan(0);
			expect(report.warnings.every((issue) => issue.source === 'editable-project')).toBe(true);
			expect(report.errors.find((issue) => issue.code === 'EXPORT_RESOLUTION_FAILED').source).toBe('resolved-candidate');
			expect(report.checks.map((check) => check.id)).toEqual([
				'validation.editable-project', 'validation.resolved-candidate',
			]);
		} finally {
			spy.mockRestore();
		}
	});

	it('does not verify output when an implemented check stopped with only a warning', async () => {
		const actualDiagnose = diagnostics.diagnoseFont;
		const spy = vi.spyOn(diagnostics, 'diagnoseFont').mockImplementationOnce((buffer, options) => {
			const report = actualDiagnose(buffer, options);
			const issue = { severity: 'warning', code: 'CFF_CONTEXT_UNSUPPORTED',
				message: 'Injected incomplete execution context.' };
			return { ...report, issues: [...report.issues, issue],
				warnings: [...report.warnings, issue] };
		});
		try {
			const result = await FontFlux.create({ family: 'Incomplete output' }).preflight();
			expect(result.state).toBe('unsupported');
			expect(result.buffer).toBeNull();
			expect(result.output.diagnostics.valid).toBe(true);
			expect(result.error).toMatch(/could not finish/);
		} finally {
			spy.mockRestore();
		}
	});

	it('checks authored projects without mutation and returns exact diagnosed bytes', async () => {
		const font = FontFlux.create({ family: 'Authored' });
		const before = structuredClone(font.data);
		const result = await font.preflight({ format: 'sfnt' });
		expect(result.error).toBeNull();
		expect(result.state).toBe('verified');
		expect(FontFlux.diagnose(result.buffer).valid).toBe(true);
		expect(font.data).toEqual(before);
	});

	it('does not equate public validation with a valid emitted font', async () => {
		const font = FontFlux.open(fontBytes());
		font.data.tables.head.glyphDataFormat = 1;
		expect(font.validate().valid).toBe(true);
		const result = await font.preflight({ format: 'sfnt' });
		expect(result.state).toBe('failed');
		expect(result.buffer).toBeNull();
		expect(
			result.output.diagnostics.issues.some(
				(issue) => issue.code === 'HEAD_GLYPH_DATA_FORMAT_INVALID',
			),
		).toBe(true);
	});

	it('does not silently invalidate signatures or claim standalone CFF diagnosis', async () => {
		const font = FontFlux.open(fontBytes());
		font.data.tables.DSIG = { _raw: [0, 0, 0, 1, 0, 0, 0, 0] };
		expect((await font.preflight()).error).toMatch(/DSIG/);
		const sample = FontFlux.create({ family: 'Standalone test' }).export({
			format: 'otf',
		});
		const cff = await FontFlux.open(sample).preflight({ format: 'cff' });
		expect(cff.state).toBe('unsupported');
		expect(cff.buffer).toBeNull();
	});

	it('recognizes existing AAT codecs when validating imported projects', () => {
		const font = FontFlux.open(fontBytes());
		font.data.tables.ltag = { version: 1, flags: 0, tagRange: [] };
		expect(
			font
				.validate()
				.errors.some(
					(issue) =>
						issue.code === 'TABLE_WRITER_UNSUPPORTED' &&
						issue.message.includes('ltag'),
				),
		).toBe(false);
	});
});
