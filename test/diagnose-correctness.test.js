import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeCOLR } from '../src/sfnt/table_COLR.js';
import { _internal, diagnoseFont } from '../src/validate/diagnoseFont.js';
import { wrapWOFF1 } from '../src/woff/woff1.js';
import { initBrotli } from '../src/woff/woff2.js';

async function sample(name = 'oblegg.ttf') {
	const bytes = await readFile(resolve(import.meta.dirname, 'sample fonts', name));
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function directory(buffer, offset = 0) {
	const view = new DataView(buffer);
	return Array.from({ length: view.getUint16(offset + 4) }, (_, index) => {
		const record = offset + 12 + index * 16;
		return {
			tag: String.fromCharCode(...new Uint8Array(buffer, record, 4)),
			record,
			offset: view.getUint32(record + 8),
			length: view.getUint32(record + 12),
		};
	});
}

// Original collection fixture construction: two directories share the source's
// tables, with every table BEFORE both face headers. Offsets are file-relative.
function sharedCollection(source, version = 0x00010000) {
	const sourceEntries = directory(source);
	const prefix = version === 0x00020000 ? 32 : 20;
	const directorySize = 12 + sourceEntries.length * 16;
	const first = prefix + Math.ceil(source.byteLength / 4) * 4;
	const offsets = [first, first + directorySize];
	const buffer = new ArrayBuffer(offsets[1] + directorySize);
	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);
	view.setUint32(0, 0x74746366);
	view.setUint32(4, version);
	view.setUint32(8, 2);
	bytes.set(new Uint8Array(source), prefix);
	for (const [faceIndex, offset] of offsets.entries()) {
		view.setUint32(12 + faceIndex * 4, offset);
		bytes.set(new Uint8Array(source, 0, directorySize), offset);
		for (const entry of sourceEntries) {
			view.setUint32(offset + entry.record + 8, prefix + entry.offset);
		}
	}
	return { buffer, offsets };
}

function codes(report) {
	return report.issues.map((issue) => issue.code);
}

function singleTableFont(tag, data) {
	const buffer = new ArrayBuffer(28 + data.byteLength);
	const view = new DataView(buffer);
	view.setUint32(0, 0x00010000);
	view.setUint16(4, 1);
	view.setUint16(6, 16);
	new Uint8Array(buffer, 12, 4).set(new TextEncoder().encode(tag));
	view.setUint32(20, 28);
	view.setUint32(24, data.byteLength);
	new Uint8Array(buffer, 28).set(new Uint8Array(data));
	return buffer;
}

describe('diagnostic collection addressing and face scope', () => {
	it.each([
		['oblegg.ttf', 0x00010000],
		['oblegg.otf', 0x00020000],
	])('reads all %s faces with shared file-relative tables', async (name, version) => {
		const { buffer } = sharedCollection(await sample(name), version);
		const original = buffer.slice(0);
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(true);
		expect(report.faces.map((face) => face.faceIndex)).toEqual([0, 1]);
		for (const face of report.faces) {
			expect(face.valid).toBe(true);
			expect(codes(face)).toContain('TABLE_PARSED');
			expect(codes(face)).not.toContain('BAD_CHECKSUM');
			expect(codes(face)).not.toContain('BAD_CHECKSUM_ADJUSTMENT');
			expect(face.issues.every((issue) => issue.faceIndex === face.faceIndex)).toBe(true);
		}
		expect(report.issues.filter((issue) => issue.faceIndex === undefined)
			.map((issue) => issue.code)).toEqual(['FORMAT_COLLECTION', 'COLLECTION_INFO']);
		expect(report.summary.issueCount).toBe(report.faces.reduce(
			(total, face) => total + face.summary.issueCount, 2,
		));
		expect(new Uint8Array(buffer)).toEqual(new Uint8Array(original));
	});

	it('diagnoses only the selected zero-based face, without hiding container errors', async () => {
		const { buffer, offsets } = sharedCollection(await sample());
		new DataView(buffer).setUint32(offsets[0], 0xdeadbeef);
		const all = diagnoseFont(buffer);
		expect(all.faces[0].valid).toBe(false);
		expect(all.faces[1].valid).toBe(true);
		const selected = diagnoseFont(buffer, { faceIndex: 1 });
		expect(selected.valid).toBe(true);
		expect(selected.faces.map((face) => face.faceIndex)).toEqual([1]);
		expect(selected.issues.filter((issue) => issue.faceIndex !== undefined)
			.every((issue) => issue.faceIndex === 1)).toBe(true);
		new DataView(buffer).setUint32(4, 0x00010001);
		expect(codes(diagnoseFont(buffer, { faceIndex: 1 }))).toContain('TTC_VERSION_INVALID');
	});

	it.each([0, 12, 0xfffffff0])('retains the independent face when another offset is %i', async (offset) => {
		const { buffer } = sharedCollection(await sample());
		new DataView(buffer).setUint32(12, offset);
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(codes(report.faces[0])).toContain('TTC_FACE_OFFSET_INVALID');
		expect(report.faces[1].valid).toBe(true);
		expect(report.faces[1].faceIndex).toBe(1);
	});

	it('retains later faces when an earlier directory is truncated', async () => {
		const { buffer, offsets } = sharedCollection(await sample());
		new DataView(buffer).setUint16(offsets[0] + 4, 4096);
		const report = diagnoseFont(buffer);
		expect(codes(report.faces[0])).toContain('DIRECTORY_TRUNCATED');
		expect(report.faces[1].valid).toBe(true);
	});

	it('reports a truncated collection offset array without reading nonexistent entries', () => {
		const buffer = new ArrayBuffer(16);
		const view = new DataView(buffer);
		view.setUint32(0, 0x74746366);
		view.setUint32(4, 0x00010000);
		view.setUint32(8, 2);
		view.setUint32(12, 40);
		const report = diagnoseFont(buffer);
		expect(codes(report)).toContain('TTC_OFFSETS_TRUNCATED');
		expect(codes(report.faces[0])).toContain('TTC_FACE_OFFSET_INVALID');
		expect(codes(report.faces[1])).toContain('TTC_FACE_OFFSET_UNREADABLE');
		expect(report.faces[1].errors[0].faceIndex).toBe(1);
	});

	it('reports an impossible offset array even when the face budget is exceeded', () => {
		const buffer = new ArrayBuffer(12);
		const view = new DataView(buffer);
		view.setUint32(0, 0x74746366);
		view.setUint32(4, 0x00010000);
		view.setUint32(8, 0xffffffff);
		const report = diagnoseFont(buffer);
		expect(codes(report)).toContain('TTC_OFFSETS_TRUNCATED');
		expect(codes(report)).toContain('DIAGNOSTIC_LIMIT_EXCEEDED');
		expect(report.faces).toEqual([]);
	});

	it('reports a missing version-2 DSIG header', () => {
		const buffer = new ArrayBuffer(16);
		const view = new DataView(buffer);
		view.setUint32(0, 0x74746366);
		view.setUint32(4, 0x00020000);
		view.setUint32(8, 1);
		const report = diagnoseFont(buffer);
		expect(codes(report)).toContain('COLLECTION_HEADER_UNREADABLE');
	});

	it('uses file-relative bounds, not face-relative table extents', async () => {
		const { buffer, offsets } = sharedCollection(await sample());
		const entry = directory(buffer, offsets[0]).find((entry) => entry.tag === 'head');
		new DataView(buffer).setUint32(entry.record + 8, buffer.byteLength - 1);
		const report = diagnoseFont(buffer);
		expect(codes(report.faces[0])).toContain('TABLE_OUT_OF_BOUNDS');
		expect(report.faces[1].valid).toBe(true);
	});

	it('returns face zero for standalone fonts and empty faces for unusable input', async () => {
		const buffer = await sample();
		expect(diagnoseFont(buffer).faces[0].faceIndex).toBe(0);
		expect(diagnoseFont(buffer, { faceIndex: 0 }).valid).toBe(true);
		expect(codes(diagnoseFont(buffer, { faceIndex: 1 }))).toContain('FACE_INDEX_OUT_OF_RANGE');
		expect(diagnoseFont(new ArrayBuffer(4)).faces).toEqual([]);
	});

	it('rejects a selected face outside a collection', async () => {
		const { buffer } = sharedCollection(await sample());
		const report = diagnoseFont(buffer, { faceIndex: 2 });
		expect(codes(report)).toContain('FACE_INDEX_OUT_OF_RANGE');
		expect(report.faces).toEqual([]);
	});
});

describe('diagnostic checksums are observational', () => {
	it('accepts original standalone checksums', async () => {
		const report = diagnoseFont(await sample());
		expect(codes(report)).not.toContain('BAD_CHECKSUM');
		expect(codes(report)).not.toContain('BAD_CHECKSUM_ADJUSTMENT');
	});

	it('detects an adjustment-only corruption without falsely blaming the head table checksum', async () => {
		const buffer = await sample();
		const head = directory(buffer).find((entry) => entry.tag === 'head');
		const view = new DataView(buffer);
		view.setUint32(head.offset + 8, view.getUint32(head.offset + 8) ^ 1);
		const original = buffer.slice(0);
		const report = diagnoseFont(buffer);
		expect(codes(report)).toContain('BAD_CHECKSUM_ADJUSTMENT');
		expect(codes(report)).not.toContain('BAD_CHECKSUM');
		expect(report.warnings.find((issue) => issue.code === 'BAD_CHECKSUM_ADJUSTMENT')
			.faceIndex).toBe(0);
		expect(new Uint8Array(buffer)).toEqual(new Uint8Array(original));
	});

	it('checks head data and its directory checksum with the adjustment zeroed', async () => {
		const buffer = await sample();
		const head = directory(buffer).find((entry) => entry.tag === 'head');
		new Uint8Array(buffer)[head.offset + 7] ^= 1;
		const report = diagnoseFont(buffer);
		expect(report.warnings.some((issue) =>
			issue.code === 'BAD_CHECKSUM' && issue.message.includes("'head'"))).toBe(true);
	});

	it('checks a bad head directory checksum independently of the whole-font sum', async () => {
		const buffer = await sample();
		const head = directory(buffer).find((entry) => entry.tag === 'head');
		const view = new DataView(buffer);
		view.setUint32(head.record + 4, (view.getUint32(head.record + 4) + 1) >>> 0);
		view.setUint32(head.offset + 8, (view.getUint32(head.offset + 8) - 1) >>> 0);
		const report = diagnoseFont(buffer);
		expect(codes(report)).toContain('BAD_CHECKSUM');
		expect(codes(report)).not.toContain('BAD_CHECKSUM_ADJUSTMENT');
	});

	it('does not impose a standalone whole-font sum on TTC or reconstructed WOFF', async () => {
		const source = await sample();
		const { buffer } = sharedCollection(source);
		const head = directory(buffer, new DataView(buffer).getUint32(12))
			.find((entry) => entry.tag === 'head');
		new DataView(buffer).setUint32(head.offset + 8, 0x12345678);
		expect(codes(diagnoseFont(buffer))).not.toContain('BAD_CHECKSUM_ADJUSTMENT');
		expect(codes(diagnoseFont(buffer))).not.toContain('BAD_CHECKSUM');
		expect(codes(diagnoseFont(wrapWOFF1(source)))).not.toContain('BAD_CHECKSUM_ADJUSTMENT');
	});
});

describe('normative lookup and cmap boundaries', () => {
	it.each(['GSUB', 'GPOS'])('accepts a binary %s lookup with mark-attachment-class flags', (tag) => {
		const layout = new ArrayBuffer(24);
		const view = new DataView(layout);
		view.setUint16(0, 1);
		view.setUint16(4, 10);
		view.setUint16(6, 12);
		view.setUint16(8, 14);
		view.setUint16(14, 1);
		view.setUint16(16, 4);
		view.setUint16(18, 1);
		view.setUint16(20, 0xff00);
		const report = diagnoseFont(singleTableFont(tag, layout));
		expect(codes(report)).not.toContain('TABLE_PARSE_FAILED');
		expect(codes(report)).not.toContain('LAYOUT_LOOKUP_FLAG_INVALID');
		expect(codes(report)).not.toContain('LAYOUT_LOOKUP_FLAG_RESERVED');
	});

	it('detects the exact format-4 overlap after parsing original binary segments', () => {
		const cmap = new ArrayBuffer(52);
		const view = new DataView(cmap);
		view.setUint16(2, 1);
		view.setUint16(4, 3);
		view.setUint16(6, 1);
		view.setUint32(8, 12);
		view.setUint16(12, 4);
		view.setUint16(14, 40);
		view.setUint16(18, 6);
		view.setUint16(20, 4);
		view.setUint16(22, 1);
		view.setUint16(24, 2);
		[70, 80, 65535].forEach((value, i) => view.setUint16(26 + i * 2, value));
		[65, 68, 65535].forEach((value, i) => view.setUint16(34 + i * 2, value));
		view.setUint16(44, 1);
		const report = diagnoseFont(singleTableFont('cmap', cmap));
		expect(codes(report)).not.toContain('TABLE_PARSE_FAILED');
		expect(codes(report)).toContain('CMAP_FORMAT4_RANGES_OUT_OF_ORDER');
		view.setUint16(36, 71);
		expect(codes(diagnoseFont(singleTableFont('cmap', cmap))))
			.not.toContain('CMAP_FORMAT4_RANGES_OUT_OF_ORDER');
	});

	it('accepts a binary U+180F variation-selector record, but not U+180E', () => {
		const cmap = new ArrayBuffer(33);
		const view = new DataView(cmap);
		view.setUint16(2, 1);
		view.setUint16(6, 5);
		view.setUint32(8, 12);
		view.setUint16(12, 14);
		view.setUint32(14, 21);
		view.setUint32(18, 1);
		view.setUint16(23, 0x180f);
		const report = diagnoseFont(singleTableFont('cmap', cmap));
		expect(codes(report)).not.toContain('TABLE_PARSE_FAILED');
		expect(codes(report)).not.toContain('CMAP_FORMAT14_VS_OUT_OF_RANGE');
		view.setUint16(23, 0x180e);
		expect(codes(diagnoseFont(singleTableFont('cmap', cmap))))
			.toContain('CMAP_FORMAT14_VS_OUT_OF_RANGE');
	});

	it.each(['GSUB', 'GPOS'])('accepts all %s mark-attachment-class bits and retains reserved warnings', (tag) => {
		for (const lookupFlag of [0x0100, 0x8000, 0xff00, 0xff1f]) {
			const issues = [];
			_internal.validateLayoutLookups({
				lookupList: { lookups: [{ lookupType: 1, lookupFlag }] },
			}, tag, issues);
			expect(issues).toEqual([]);
		}
		const issues = [];
		_internal.validateLayoutLookups({
			lookupList: { lookups: [{ lookupType: 1, lookupFlag: 0xffe0 }] },
		}, tag, issues);
		expect(issues.map((issue) => [issue.code, issue.severity]))
			.toEqual([['LAYOUT_LOOKUP_FLAG_RESERVED', 'warning']]);
	});

	it.each([
		[0x180a, false], [0x180b, true], [0x180d, true],
		[0x180e, false], [0x180f, true], [0x1810, false],
		[0xfdff, false], [0xfe00, true], [0xfe0f, true], [0xfe10, false],
		[0xe00ff, false], [0xe0100, true], [0xe01ef, true], [0xe01f0, false],
	])('uses Unicode 16.0 Variation_Selector boundaries at U+%s', (varSelector, valid) => {
		const cmap = {
			encodingRecords: [{ platformID: 0, encodingID: 5, subtableIndex: 0 }],
			subtables: [{ format: 14, varSelectorRecords: [{ varSelector }] }],
		};
		for (const validate of [
			(cmap, issues) => _internal.validateCmapDeep(cmap, null, issues),
			_internal.validateCmapFormat14,
		]) {
			const issues = [];
			validate(cmap, issues);
			expect(issues.some((issue) => issue.code === 'CMAP_FORMAT14_VS_OUT_OF_RANGE'))
				.toBe(!valid);
		}
	});

	it.each([[68, true], [70, true], [71, false]])(
		'detects increasing-end format-4 overlap with start %i', (startCode, overlapping) => {
			const issues = [];
			_internal.validateCmapDeep({
				encodingRecords: [{ platformID: 3, encodingID: 1, subtableIndex: 0 }],
				subtables: [{
					format: 4,
					segments: [
						{ startCode: 65, endCode: 70, idDelta: 0, idRangeOffset: 0 },
						{ startCode, endCode: 80, idDelta: 0, idRangeOffset: 0 },
						{ startCode: 65535, endCode: 65535, idDelta: 1, idRangeOffset: 0 },
					],
				}],
			}, null, issues);
			expect(issues.some((issue) => issue.code === 'CMAP_FORMAT4_RANGES_OUT_OF_ORDER'))
				.toBe(overlapping);
		},
	);

	it('retains legacy clamp codes without claiming any applied change', () => {
		const os2 = { usWeightClass: 1001, usWidthClass: 10 };
		const original = structuredClone(os2);
		const issues = [];
		_internal.validateOS2Sanitization(os2, null, issues);
		expect(issues.map((issue) => issue.code)).toEqual(['OS2_WEIGHT_CLAMPED', 'OS2_WIDTH_CLAMPED']);
		expect(issues.every((issue) => issue.severity === 'warning' &&
			issue.message.includes('does not clamp or repair'))).toBe(true);
		expect(os2).toEqual(original);
	});
});

describe('diagnostic import-compatible limits', () => {
	it.each([
		{ maxInputBytes: 0 }, { maxTableBytes: -1 }, { maxTables: 1.5 },
		{ maxFonts: Infinity }, { maxGlyphs: NaN }, { maxPoints: '2' },
		{ maxCharStringOperations: Number.MAX_SAFE_INTEGER + 1 },
		{ maxStructureDepth: 0 }, { maxStructureDepth: 1.5 },
		{ maxStructureNodes: -1 }, { maxStructureNodes: Number.MAX_SAFE_INTEGER + 1 },
		{ maxUncompressedBytes: 0 }, { faceIndex: -1 }, { faceIndex: 0.5 }, null,
	])('reports invalid options %j without throwing', (options) => {
		const report = diagnoseFont(new ArrayBuffer(12), options);
		expect(codes(report)).toEqual(['INVALID_DIAGNOSTIC_OPTIONS']);
		expect(report.faces).toEqual([]);
	});

	it('honors inclusive input/table/count/glyph boundaries', async () => {
		const buffer = await sample();
		const entries = directory(buffer);
		const tableBytes = entries.reduce((sum, entry) => sum + entry.length, 0);
		const maxp = entries.find((entry) => entry.tag === 'maxp');
		const numGlyphs = new DataView(buffer).getUint16(maxp.offset + 4);
		const limits = {
			maxInputBytes: buffer.byteLength,
			maxTableBytes: tableBytes,
			maxTables: entries.length,
			maxGlyphs: numGlyphs,
		};
		expect(diagnoseFont(buffer, limits).valid).toBe(true);
		for (const key of Object.keys(limits)) {
			const report = diagnoseFont(buffer, { ...limits, [key]: limits[key] - 1 });
			expect(codes(report)).toContain('DIAGNOSTIC_LIMIT_EXCEEDED');
		}
		const limited = diagnoseFont(buffer, { maxTableBytes: 1 });
		expect(codes(limited)).not.toContain('TABLE_PARSED');
		expect(limited.errors.find((issue) => issue.code === 'DIAGNOSTIC_LIMIT_EXCEEDED')
			.faceIndex).toBe(0);
	});

	it('bounds the declared collection face count, including selected-face mode', async () => {
		const { buffer } = sharedCollection(await sample());
		expect(diagnoseFont(buffer, { maxFonts: 2 }).valid).toBe(true);
		for (const faceIndex of [undefined, 1]) {
			const report = diagnoseFont(buffer, { maxFonts: 1, faceIndex });
			expect(codes(report)).toContain('DIAGNOSTIC_LIMIT_EXCEEDED');
			expect(report.faces).toEqual([]);
		}
	});

	it('bounds WOFF tables and decompression before face parsing', async () => {
		const source = await sample();
		const buffer = wrapWOFF1(source);
		const original = buffer.slice(0);
		const limits = {
			maxTables: directory(source).length,
			maxTableBytes: directory(source).reduce((sum, entry) => sum + entry.length, 0),
			maxUncompressedBytes: new DataView(buffer).getUint32(16),
		};
		expect(diagnoseFont(buffer, limits).valid).toBe(true);
		for (const key of ['maxTables', 'maxTableBytes']) {
			const report = diagnoseFont(buffer, { ...limits, [key]: limits[key] - 1 });
			expect(codes(report)).toContain('DIAGNOSTIC_LIMIT_EXCEEDED');
			expect(report.faces).toEqual([]);
		}
		const report = diagnoseFont(buffer, {
			maxUncompressedBytes: limits.maxUncompressedBytes - 1,
		});
		expect(codes(report)).toContain('WOFF1_UNWRAP_FAILED');
		expect(report.faces).toEqual([]);
		expect(new Uint8Array(buffer)).toEqual(new Uint8Array(original));
	});

	it('passes WOFF2 decompression/table limits and preserves the source', async () => {
		await initBrotli();
		const buffer = await sample('oblegg.woff2');
		const original = buffer.slice(0);
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(true);
		expect(report.faces.map((face) => face.faceIndex)).toEqual([0]);
		expect(codes(report)).not.toContain('BAD_CHECKSUM_ADJUSTMENT');
		expect(codes(diagnoseFont(buffer, { maxUncompressedBytes: 64 })))
			.toContain('WOFF2_UNWRAP_FAILED');
		expect(codes(diagnoseFont(buffer, { maxTables: 1 })))
			.toContain('DIAGNOSTIC_LIMIT_EXCEEDED');
		const tableLimited = diagnoseFont(buffer, { maxTableBytes: 1 });
		expect(codes(tableLimited)).toContain('DIAGNOSTIC_LIMIT_EXCEEDED');
		expect(codes(tableLimited)).not.toContain('TABLE_PARSED');
		expect(new Uint8Array(buffer)).toEqual(new Uint8Array(original));
	});

	it('reports WOFF2 collection decoder limitations instead of misdiagnosing reconstructed faces', () => {
		const buffer = new ArrayBuffer(48);
		const view = new DataView(buffer);
		view.setUint32(0, 0x774f4632);
		view.setUint32(4, 0x74746366);
		view.setUint32(8, 48);
		view.setUint32(16, 20);
		const report = diagnoseFont(buffer);
		expect(codes(report)).toContain('WOFF2_COLLECTION_UNSUPPORTED');
		expect(codes(report)).not.toContain('BAD_SF_VERSION');
		expect(report.faces).toEqual([]);
	});

	it('passes maxPoints to the glyf parser', async () => {
		const report = diagnoseFont(await sample(), { maxPoints: 1 });
		expect(report.errors.some((issue) =>
			issue.code === 'TABLE_PARSE_FAILED' && issue.message.includes('maxPoints'))).toBe(true);
	});

	it.each(['maxStructureDepth', 'maxStructureNodes'])(
		'passes %s through to COLR parsing and preserves the source', (limit) => {
			const colr = new Uint8Array(writeCOLR({
				version: 1,
				baseGlyphRecords: [],
				layerRecords: [],
				baseGlyphPaintRecords: [{
					glyphID: 1,
					paint: {
						format: 10,
						glyphID: 1,
						paint: { format: 2, paletteIndex: 0, alpha: 1 },
					},
				}],
				layerPaints: null,
			}));
			const buffer = singleTableFont('COLR', colr.buffer);
			const original = buffer.slice(0);
			expect(codes(diagnoseFont(buffer))).not.toContain('TABLE_PARSE_FAILED');
			const report = diagnoseFont(buffer, { [limit]: 1 });
			expect(report.errors.some((issue) =>
				issue.code === 'TABLE_PARSE_FAILED' && issue.faceIndex === 0 &&
				issue.message.includes(limit))).toBe(true);
			expect(new Uint8Array(buffer)).toEqual(new Uint8Array(original));
		},
	);

	it('bounds CFF diagnostic operations including subroutine calls', () => {
		const cff = {
			fonts: [{
				charStrings: [[32, 10, 14]],
				localSubrs: [[139, 139, 21, 11]],
			}],
		};
		const issues = [];
		_internal.validateCffCharStrings(cff, 'CFF', issues, false, {
			maxCharStringOperations: 3,
		});
		expect(issues.map((issue) => issue.code)).toContain('CFF_OPERATION_LIMIT_EXCEEDED');
		const sufficient = [];
		_internal.validateCffCharStrings(cff, 'CFF', sufficient, false, {
			maxCharStringOperations: 7,
		});
		expect(sufficient).toEqual([]);
	});

	it('threads maxCharStringOperations through binary diagnosis', async () => {
		const report = diagnoseFont(await sample('oblegg.otf'), {
			maxCharStringOperations: 1,
		});
		expect(codes(report)).toContain('CFF_OPERATION_LIMIT_EXCEEDED');
	});
});
