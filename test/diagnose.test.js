/**
 * diagnoseFont tests.
 *
 * Tests the binary font diagnostic feature that catches and reports problems
 * in corrupted or malformed font files, rather than just throwing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { diagnoseFont } from '../src/validate/diagnoseFont.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

// ============================================================================
//  Helper: load sample font
// ============================================================================

async function loadSample(name) {
	const buf = await readFile(resolve(SAMPLES_DIR, name));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

// ============================================================================
//  Valid fonts — should report no errors
// ============================================================================

describe('diagnoseFont — valid fonts', () => {
	it('should report a valid TTF font as valid', async () => {
		const buffer = await loadSample('oblegg.ttf');
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(true);
		expect(report.summary.errorCount).toBe(0);
	});

	it('should report a valid OTF font as valid', async () => {
		const buffer = await loadSample('oblegg.otf');
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(true);
		expect(report.summary.errorCount).toBe(0);
	});

	it('should report a valid WOFF font as valid', async () => {
		const buffer = await loadSample('oblegg.woff');
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(true);
		expect(report.summary.errorCount).toBe(0);
		expect(report.issues.some((i) => i.code === 'FORMAT_WOFF1')).toBe(true);
	});

	it('should report a valid TTC collection', async () => {
		const buffer = await loadSample('cambria-test.ttc');
		const report = diagnoseFont(buffer);
		expect(report.issues.some((i) => i.code === 'FORMAT_COLLECTION')).toBe(true);
	});
});

// ============================================================================
//  Static method on FontFlux
// ============================================================================

describe('FontFlux.diagnose()', () => {
	it('should be accessible as a static method', async () => {
		const buffer = await loadSample('oblegg.ttf');
		const report = FontFlux.diagnose(buffer);
		expect(report.valid).toBe(true);
		expect(report.summary).toBeDefined();
	});
});

// ============================================================================
//  Corrupted / malformed inputs
// ============================================================================

describe('diagnoseFont — corrupted inputs', () => {
	it('should report non-ArrayBuffer input', () => {
		const report = diagnoseFont('not a buffer');
		expect(report.valid).toBe(false);
		expect(report.errors[0].code).toBe('NOT_ARRAYBUFFER');
	});

	it('should report a file too short for a font header', () => {
		const buffer = new ArrayBuffer(8);
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors[0].code).toBe('TOO_SHORT');
	});

	it('should report an unrecognized signature', () => {
		const buffer = new ArrayBuffer(64);
		const view = new DataView(buffer);
		view.setUint32(0, 0xdeadbeef); // garbage signature
		view.setUint16(4, 2); // numTables
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'BAD_SF_VERSION')).toBe(true);
	});

	it('should report a truncated table directory', () => {
		const buffer = new ArrayBuffer(16); // header fits, but no room for directory
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000); // TrueType
		view.setUint16(4, 10); // numTables = 10 → needs 12 + 160 bytes
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'DIRECTORY_TRUNCATED')).toBe(
			true,
		);
	});

	it('should report numTables = 0', () => {
		const buffer = new ArrayBuffer(12);
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000);
		view.setUint16(4, 0); // numTables = 0
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'NO_TABLES')).toBe(true);
	});

	it('should report tables extending beyond file bounds', async () => {
		// Create a minimal font with 1 table entry pointing beyond the file
		const buffer = new ArrayBuffer(28); // 12-byte header + 16-byte record
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000); // TrueType
		view.setUint16(4, 1); // numTables = 1
		view.setUint16(6, 16); // searchRange
		view.setUint16(8, 0); // entrySelector
		view.setUint16(10, 0); // rangeShift

		// Table record: head table at offset 100, length 100
		const enc = new TextEncoder();
		const tag = enc.encode('head');
		new Uint8Array(buffer, 12, 4).set(tag);
		view.setUint32(16, 0); // checksum
		view.setUint32(20, 100); // offset — beyond file
		view.setUint32(24, 100); // length

		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'TABLE_OUT_OF_BOUNDS')).toBe(
			true,
		);
	});

	it('should report missing required tables', async () => {
		// Minimal valid font structure but with an unknown table tag
		const tableData = new Uint8Array(32); // 32 bytes of dummy table data
		const bufSize = 12 + 16 + tableData.length; // header + 1 record + data
		const buffer = new ArrayBuffer(bufSize);
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000);
		view.setUint16(4, 1);
		view.setUint16(6, 16);
		view.setUint16(8, 0);
		view.setUint16(10, 0);

		// Table record: unknown table 'XXXX'
		const tag = new TextEncoder().encode('XXXX');
		new Uint8Array(buffer, 12, 4).set(tag);
		view.setUint32(16, 0); // checksum
		view.setUint32(20, 28); // offset = right after directory
		view.setUint32(24, tableData.length);

		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'MISSING_REQUIRED_TABLE')).toBe(
			true,
		);
		expect(report.errors.some((e) => e.code === 'NO_OUTLINES')).toBe(true);
	});

	it('should catch per-table parse failures', async () => {
		// Create a font with a head table containing garbage data
		const garbageTable = new Uint8Array(54); // head is 54 bytes but all zeroes = invalid magic
		const bufSize = 12 + 16 + 56; // header + 1 record + padded table
		const buffer = new ArrayBuffer(bufSize);
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000);
		view.setUint16(4, 1);
		view.setUint16(6, 16);
		view.setUint16(8, 0);
		view.setUint16(10, 0);

		const tag = new TextEncoder().encode('head');
		new Uint8Array(buffer, 12, 4).set(tag);
		view.setUint32(16, 0);
		view.setUint32(20, 28);
		view.setUint32(24, 54);
		new Uint8Array(buffer, 28, 54).set(garbageTable);

		const report = diagnoseFont(buffer);
		// head should parse (all zeroes is technically parseable) but magic number should fail
		expect(report.errors.some((e) => e.code === 'BAD_MAGIC_NUMBER')).toBe(true);
	});
});

// ============================================================================
//  Report format consistency
// ============================================================================

describe('diagnoseFont — report format', () => {
	it('should have the same shape as validateJSON reports', async () => {
		const buffer = await loadSample('oblegg.ttf');
		const report = diagnoseFont(buffer);

		expect(report).toHaveProperty('valid');
		expect(report).toHaveProperty('errors');
		expect(report).toHaveProperty('warnings');
		expect(report).toHaveProperty('infos');
		expect(report).toHaveProperty('issues');
		expect(report).toHaveProperty('summary');
		expect(report.summary).toHaveProperty('errorCount');
		expect(report.summary).toHaveProperty('warningCount');
		expect(report.summary).toHaveProperty('infoCount');
		expect(report.summary).toHaveProperty('issueCount');

		expect(Array.isArray(report.errors)).toBe(true);
		expect(Array.isArray(report.warnings)).toBe(true);
		expect(Array.isArray(report.infos)).toBe(true);
		expect(Array.isArray(report.issues)).toBe(true);
	});

	it('issues should have severity, code, and message fields', async () => {
		const buffer = await loadSample('oblegg.otf');
		const report = diagnoseFont(buffer);

		for (const issue of report.issues) {
			expect(issue).toHaveProperty('severity');
			expect(issue).toHaveProperty('code');
			expect(issue).toHaveProperty('message');
			expect(['error', 'warning', 'info']).toContain(issue.severity);
		}
	});
});

// ============================================================================
//  Standalone export
// ============================================================================

describe('diagnoseFont — standalone export', () => {
	it('should be importable from the main entry point', async () => {
		const { diagnoseFont: df } = await import('../src/main.js');
		expect(typeof df).toBe('function');
	});
});

// ============================================================================
//  Round-trip fix: invalid-example.otf
// ============================================================================

describe('diagnoseFont — round-trip fix for invalid-example.otf', () => {
	it('should detect problems in the original file', async () => {
		const buffer = await loadSample('invalid-example.otf');
		const report = diagnoseFont(buffer);

		// Original has zeroed checksums
		expect(report.summary.warningCount).toBeGreaterThan(0);
		expect(report.warnings.some((w) => w.code === 'BAD_CHECKSUM')).toBe(true);
	});

	it('should produce a clean font after import → fix → export → re-diagnose', async () => {
		const buffer = await loadSample('invalid-example.otf');

		// Step 1: Open in FontFlux (import + simplify)
		const font = FontFlux.open(buffer);

		// Step 2: Apply the same fixes the demo "Fix All" would apply
		//   - Set missing family name
		if (!font.info.familyName || font.info.familyName === 'Untitled') {
			font.info.familyName = 'FixedFont';
		}
		//   - Set missing style name
		if (!font.info.styleName || font.info.styleName === 'Regular') {
			font.info.styleName = 'Regular';
		}
		// The rest (checksums, header fields, hmtx/hhea) should be fixed by export

		// Step 3: Export
		const exported = font.export();

		// Step 4: Re-diagnose the exported binary
		const report2 = diagnoseFont(exported);

		// Checksums should now be valid (no BAD_CHECKSUM warnings)
		const checksumWarnings = report2.warnings.filter(
			(w) => w.code === 'BAD_CHECKSUM',
		);
		expect(checksumWarnings).toEqual([]);

		// hmtx/hhea should be consistent
		expect(report2.warnings.some((w) => w.code === 'HMTX_GLYPH_MISMATCH')).toBe(
			false,
		);
		expect(report2.warnings.some((w) => w.code === 'HHEA_HMTX_MISMATCH')).toBe(
			false,
		);

		// Name table should have family and style names
		expect(report2.warnings.some((w) => w.code === 'NO_FAMILY_NAME')).toBe(false);
		expect(report2.warnings.some((w) => w.code === 'NO_STYLE_NAME')).toBe(false);

		// Header fields should be correct
		expect(report2.warnings.some((w) => w.code === 'BAD_SEARCH_RANGE')).toBe(
			false,
		);
		expect(report2.warnings.some((w) => w.code === 'BAD_ENTRY_SELECTOR')).toBe(
			false,
		);
		expect(report2.warnings.some((w) => w.code === 'BAD_RANGE_SHIFT')).toBe(
			false,
		);

		// Overall: should have no errors
		expect(report2.summary.errorCount).toBe(0);
	});
});

// ============================================================================
//  Tier 1 — Firefox/OTS parity: head/maxp/post/hhea/OS-2/TTC version checks
// ============================================================================

/**
 * Locate a table entry by tag in a raw SFNT buffer.
 * Returns { offset, length } or null.
 */
function findTableEntry(buffer, tag) {
	const view = new DataView(buffer);
	const numTables = view.getUint16(4);
	const tagBytes = new TextEncoder().encode(tag);
	for (let i = 0; i < numTables; i++) {
		const recOff = 12 + i * 16;
		let match = true;
		for (let j = 0; j < 4; j++) {
			if (view.getUint8(recOff + j) !== tagBytes[j]) {
				match = false;
				break;
			}
		}
		if (match) {
			return {
				offset: view.getUint32(recOff + 8),
				length: view.getUint32(recOff + 12),
			};
		}
	}
	return null;
}

/** Clone an ArrayBuffer so we can mutate without affecting other tests. */
function cloneBuffer(buffer) {
	const out = new ArrayBuffer(buffer.byteLength);
	new Uint8Array(out).set(new Uint8Array(buffer));
	return out;
}

describe('diagnoseFont — Tier 1 head checks', () => {
	it('flags head.majorVersion ≠ 1 as HEAD_MAJOR_VERSION_UNSUPPORTED', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const head = findTableEntry(buffer, 'head');
		// majorVersion is the first uint16 of the head table
		new DataView(buffer).setUint16(head.offset + 0, 2);
		const report = diagnoseFont(buffer);
		expect(
			report.errors.some((e) => e.code === 'HEAD_MAJOR_VERSION_UNSUPPORTED'),
		).toBe(true);
	});

	it('flags inverted bbox (xMin > xMax) as HEAD_BBOX_INVERTED', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const head = findTableEntry(buffer, 'head');
		// xMin at offset 36, xMax at offset 40
		const view = new DataView(buffer);
		view.setInt16(head.offset + 36, 1000);
		view.setInt16(head.offset + 40, -1000);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'HEAD_BBOX_INVERTED')).toBe(true);
	});

	it('flags inverted bbox (yMin > yMax) as HEAD_BBOX_INVERTED', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const head = findTableEntry(buffer, 'head');
		// yMin at offset 38, yMax at offset 42
		const view = new DataView(buffer);
		view.setInt16(head.offset + 38, 500);
		view.setInt16(head.offset + 42, -500);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'HEAD_BBOX_INVERTED')).toBe(true);
	});

	it('flags invalid indexToLocFormat as HEAD_INDEX_TO_LOC_FORMAT_INVALID', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const head = findTableEntry(buffer, 'head');
		// indexToLocFormat at offset 50
		new DataView(buffer).setInt16(head.offset + 50, 5);
		const report = diagnoseFont(buffer);
		expect(
			report.errors.some((e) => e.code === 'HEAD_INDEX_TO_LOC_FORMAT_INVALID'),
		).toBe(true);
	});

	it('flags non-zero glyphDataFormat as HEAD_GLYPH_DATA_FORMAT_INVALID', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const head = findTableEntry(buffer, 'head');
		// glyphDataFormat at offset 52
		new DataView(buffer).setInt16(head.offset + 52, 1);
		const report = diagnoseFont(buffer);
		expect(
			report.errors.some((e) => e.code === 'HEAD_GLYPH_DATA_FORMAT_INVALID'),
		).toBe(true);
	});
});

describe('diagnoseFont — Tier 1 maxp checks', () => {
	it('flags an unknown maxp version as MAXP_VERSION_INVALID', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const maxp = findTableEntry(buffer, 'maxp');
		// version at offset 0 of maxp
		new DataView(buffer).setUint32(maxp.offset, 0x00020000);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'MAXP_VERSION_INVALID')).toBe(
			true,
		);
	});

	it('flags maxp.numGlyphs = 0 as MAXP_NUMGLYPHS_ZERO', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const maxp = findTableEntry(buffer, 'maxp');
		// numGlyphs at offset 4 of maxp
		new DataView(buffer).setUint16(maxp.offset + 4, 0);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'MAXP_NUMGLYPHS_ZERO')).toBe(
			true,
		);
	});
});

describe('diagnoseFont — Tier 1 hhea / post / OS-2 checks', () => {
	it('flags hhea.majorVersion ≠ 1 as HHEA_MAJOR_VERSION_UNSUPPORTED', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const hhea = findTableEntry(buffer, 'hhea');
		new DataView(buffer).setUint16(hhea.offset + 0, 2);
		const report = diagnoseFont(buffer);
		expect(
			report.errors.some((e) => e.code === 'HHEA_MAJOR_VERSION_UNSUPPORTED'),
		).toBe(true);
	});

	it('flags an unknown post version as POST_VERSION_UNSUPPORTED', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const post = findTableEntry(buffer, 'post');
		// Use 0x00040000 (4.0) — not in the spec list
		new DataView(buffer).setUint32(post.offset, 0x00040000);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'POST_VERSION_UNSUPPORTED')).toBe(
			true,
		);
	});

	it('flags an unknown OS/2 version as OS2_VERSION_INVALID', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const os2 = findTableEntry(buffer, 'OS/2');
		// version at offset 0 of OS/2 (uint16)
		new DataView(buffer).setUint16(os2.offset + 0, 99);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'OS2_VERSION_INVALID')).toBe(
			true,
		);
	});
});

describe('diagnoseFont — Tier 1 TTC checks', () => {
	it('flags an invalid TTC majorVersion as TTC_VERSION_INVALID', async () => {
		const buffer = cloneBuffer(await loadSample('cambria-test.ttc'));
		// majorVersion at offset 4 (after 'ttcf')
		new DataView(buffer).setUint16(4, 7);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'TTC_VERSION_INVALID')).toBe(
			true,
		);
	});

	it('flags an excessive TTC numFonts as TTC_TOO_MANY_FONTS', async () => {
		const buffer = cloneBuffer(await loadSample('cambria-test.ttc'));
		// numFonts at offset 8 (uint32)
		new DataView(buffer).setUint32(8, 0x10001);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'TTC_TOO_MANY_FONTS')).toBe(true);
	});
});

// ============================================================================
//  Tier 2 — Firefox/OTS parity: cmap deep validation
// ============================================================================

import { _internal as diagInternal } from '../src/validate/diagnoseFont.js';

/**
 * Find the offset of a format-4 subtable inside a cmap table in a font buffer.
 * Returns the absolute byte offset of the subtable's first byte (its `format`
 * uint16), or null if no format-4 subtable is present.
 */
function findCmapFormat4Offset(buffer) {
	const cmap = findTableEntry(buffer, 'cmap');
	if (!cmap) return null;
	const view = new DataView(buffer);
	const numTables = view.getUint16(cmap.offset + 2);
	const offsets = new Set();
	for (let i = 0; i < numTables; i++) {
		const recOff = cmap.offset + 4 + i * 8;
		offsets.add(view.getUint32(recOff + 4));
	}
	for (const subOff of offsets) {
		const abs = cmap.offset + subOff;
		const format = view.getUint16(abs);
		if (format === 4) return abs;
	}
	return null;
}

describe('diagnoseFont — Tier 2 cmap header / structural', () => {
	it('flags non-zero cmap.version as CMAP_VERSION_INVALID', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const cmap = findTableEntry(buffer, 'cmap');
		// version at offset 0 of cmap (uint16)
		new DataView(buffer).setUint16(cmap.offset, 1);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'CMAP_VERSION_INVALID')).toBe(
			true,
		);
	});
});

describe('diagnoseFont — Tier 2 cmap format 4', () => {
	it('flags a non-FFFF terminator segment as CMAP_FORMAT4_INVALID_TERMINATOR', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const f4 = findCmapFormat4Offset(buffer);
		expect(f4).not.toBeNull();
		const view = new DataView(buffer);
		// Within format 4: length@2, language@4, segCountX2@6
		const segCount = view.getUint16(f4 + 6) / 2;
		// endCode array starts at offset 14 inside subtable.
		// Mutate the LAST endCode (i.e. the 0xFFFF terminator) to 0x1234.
		view.setUint16(f4 + 14 + (segCount - 1) * 2, 0x1234);
		// Also mutate the LAST startCode so startCode <= endCode still holds.
		// startCode array begins after endCodes + reservedPad.
		const startCodeBase = f4 + 14 + segCount * 2 + 2;
		view.setUint16(startCodeBase + (segCount - 1) * 2, 0x1234);
		const report = diagnoseFont(buffer);
		expect(
			report.errors.some((e) => e.code === 'CMAP_FORMAT4_INVALID_TERMINATOR'),
		).toBe(true);
	});

	it('flags startCode > endCode as CMAP_FORMAT4_RANGES_OUT_OF_ORDER', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const f4 = findCmapFormat4Offset(buffer);
		const view = new DataView(buffer);
		const segCount = view.getUint16(f4 + 6) / 2;
		// First segment (index 0): set startCode > endCode
		const endCode0 = view.getUint16(f4 + 14);
		const startCodeBase = f4 + 14 + segCount * 2 + 2;
		view.setUint16(startCodeBase, endCode0 + 1); // start > end
		const report = diagnoseFont(buffer);
		expect(
			report.errors.some((e) => e.code === 'CMAP_FORMAT4_RANGES_OUT_OF_ORDER'),
		).toBe(true);
	});

	it('flags glyph id >= numGlyphs as CMAP_GLYPH_OUT_OF_RANGE', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const maxp = findTableEntry(buffer, 'maxp');
		// Lower numGlyphs to 1 — every cmap mapping now points "out of range".
		// (We can't lower it to 0 because that triggers MAXP_NUMGLYPHS_ZERO
		// and short-circuits other checks; 1 is enough.)
		new DataView(buffer).setUint16(maxp.offset + 4, 1);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'CMAP_GLYPH_OUT_OF_RANGE')).toBe(
			true,
		);
	});
});

describe('diagnoseFont — Tier 2 cmap format 12 / 13 (synthetic)', () => {
	it('flags endCharCode < startCharCode as CMAP_FORMAT12_END_BEFORE_START', () => {
		const issues = [];
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 3, encodingID: 10, subtableIndex: 0 }],
			subtables: [
				{
					format: 12,
					language: 0,
					groups: [{ startCharCode: 0x100, endCharCode: 0x80, startGlyphID: 1 }],
				},
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 1000 }, issues);
		expect(issues.some((i) => i.code === 'CMAP_FORMAT12_END_BEFORE_START')).toBe(
			true,
		);
	});

	it('flags overlapping groups as CMAP_FORMAT12_GROUPS_OUT_OF_ORDER', () => {
		const issues = [];
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 3, encodingID: 10, subtableIndex: 0 }],
			subtables: [
				{
					format: 12,
					language: 0,
					groups: [
						{ startCharCode: 0x100, endCharCode: 0x200, startGlyphID: 1 },
						{ startCharCode: 0x150, endCharCode: 0x250, startGlyphID: 257 },
					],
				},
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 1000 }, issues);
		expect(
			issues.some((i) => i.code === 'CMAP_FORMAT12_GROUPS_OUT_OF_ORDER'),
		).toBe(true);
	});

	it('flags format-12 group glyph id overflow as CMAP_GLYPH_OUT_OF_RANGE', () => {
		const issues = [];
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 3, encodingID: 10, subtableIndex: 0 }],
			subtables: [
				{
					format: 12,
					language: 0,
					groups: [{ startCharCode: 0x20, endCharCode: 0x40, startGlyphID: 90 }],
				},
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 100 }, issues);
		expect(issues.some((i) => i.code === 'CMAP_GLYPH_OUT_OF_RANGE')).toBe(true);
	});

	it('flags format-13 glyphID overflow as CMAP_GLYPH_OUT_OF_RANGE', () => {
		const issues = [];
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 3, encodingID: 10, subtableIndex: 0 }],
			subtables: [
				{
					format: 13,
					language: 0,
					groups: [{ startCharCode: 0x20, endCharCode: 0x40, glyphID: 999 }],
				},
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 100 }, issues);
		expect(issues.some((i) => i.code === 'CMAP_GLYPH_OUT_OF_RANGE')).toBe(true);
	});
});

describe('diagnoseFont — Tier 2 cmap format 14 (synthetic)', () => {
	it('flags an invalid VS code point as CMAP_FORMAT14_VS_OUT_OF_RANGE', () => {
		const issues = [];
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 0, encodingID: 5, subtableIndex: 0 }],
			subtables: [
				{
					format: 14,
					varSelectorRecords: [
						{ varSelector: 0x1234, defaultUVS: null, nonDefaultUVS: null },
					],
				},
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 100 }, issues);
		expect(issues.some((i) => i.code === 'CMAP_FORMAT14_VS_OUT_OF_RANGE')).toBe(
			true,
		);
	});

	it('flags out-of-order VS records as CMAP_FORMAT14_VS_OUT_OF_ORDER', () => {
		const issues = [];
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 0, encodingID: 5, subtableIndex: 0 }],
			subtables: [
				{
					format: 14,
					varSelectorRecords: [
						{ varSelector: 0xfe05, defaultUVS: null, nonDefaultUVS: null },
						{ varSelector: 0xfe00, defaultUVS: null, nonDefaultUVS: null },
					],
				},
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 100 }, issues);
		expect(issues.some((i) => i.code === 'CMAP_FORMAT14_VS_OUT_OF_ORDER')).toBe(
			true,
		);
	});

	it('flags format-14 nonDefaultUVS glyph id overflow as CMAP_GLYPH_OUT_OF_RANGE', () => {
		const issues = [];
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 0, encodingID: 5, subtableIndex: 0 }],
			subtables: [
				{
					format: 14,
					varSelectorRecords: [
						{
							varSelector: 0xfe00,
							defaultUVS: null,
							nonDefaultUVS: [{ unicodeValue: 0x4e00, glyphID: 999 }],
						},
					],
				},
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 100 }, issues);
		expect(issues.some((i) => i.code === 'CMAP_GLYPH_OUT_OF_RANGE')).toBe(true);
	});
});

describe('diagnoseFont — Tier 2 cmap top-level structural (synthetic)', () => {
	it('flags an empty encodingRecords as CMAP_NO_SUBTABLES', () => {
		const issues = [];
		diagInternal.validateCmapDeep(
			{ version: 0, encodingRecords: [], subtables: [] },
			{ numGlyphs: 100 },
			issues,
		);
		expect(issues.some((i) => i.code === 'CMAP_NO_SUBTABLES')).toBe(true);
	});

	it('flags missing well-known Unicode subtable as CMAP_NO_SUPPORTED_SUBTABLE', () => {
		const issues = [];
		// Only a format-0 subtable on Macintosh — not a recognized Unicode entry.
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 1, encodingID: 0, subtableIndex: 0 }],
			subtables: [
				{ format: 0, language: 0, glyphIdArray: new Array(256).fill(0) },
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 100 }, issues);
		expect(issues.some((i) => i.code === 'CMAP_NO_SUPPORTED_SUBTABLE')).toBe(
			true,
		);
	});

	it('flags non-zero language on a Windows subtable as CMAP_LANGUAGE_NONZERO_FOR_WINDOWS', () => {
		const issues = [];
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 3, encodingID: 1, subtableIndex: 0 }],
			subtables: [
				{
					format: 4,
					language: 9, // non-zero on a Windows subtable
					segments: [
						{ startCode: 0x20, endCode: 0x20, idDelta: 0, idRangeOffset: 0 },
						{
							startCode: 0xffff,
							endCode: 0xffff,
							idDelta: 1,
							idRangeOffset: 0,
						},
					],
					glyphIdArray: [],
				},
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 100 }, issues);
		expect(
			issues.some((i) => i.code === 'CMAP_LANGUAGE_NONZERO_FOR_WINDOWS'),
		).toBe(true);
	});
});

// ============================================================================
//  Tier 3: OS/2 sanitization (Firefox/OTS parity)
// ============================================================================

describe('diagnoseFont — OS/2 sanitization (Tier 3)', () => {
	function baseOS2() {
		// Plausible v4 OS/2 values that should produce zero warnings.
		return {
			version: 4,
			usWeightClass: 400,
			usWidthClass: 5,
			fsType: 0,
			ySubscriptXSize: 100,
			ySubscriptYSize: 100,
			ySuperscriptXSize: 100,
			ySuperscriptYSize: 100,
			yStrikeoutSize: 50,
			fsSelection: 0x40, // regular
			usFirstCharIndex: 0x20,
			usLastCharIndex: 0xfffd,
			sTypoLineGap: 0,
			sxHeight: 500,
			sCapHeight: 700,
		};
	}

	function baseHead() {
		return { macStyle: 0 };
	}

	it('reports clean baseline (no Tier 3 warnings)', () => {
		const issues = [];
		diagInternal.validateOS2Sanitization(baseOS2(), baseHead(), issues);
		expect(issues).toHaveLength(0);
	});

	it('flags usWeightClass out of range', () => {
		const os2 = { ...baseOS2(), usWeightClass: 1500 };
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(issues.some((i) => i.code === 'OS2_WEIGHT_CLAMPED')).toBe(true);
	});

	it('flags usWidthClass out of range', () => {
		const os2 = { ...baseOS2(), usWidthClass: 0 };
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(issues.some((i) => i.code === 'OS2_WIDTH_CLAMPED')).toBe(true);
	});

	it('flags fsType reserved bits', () => {
		const os2 = { ...baseOS2(), fsType: 0x8000 };
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(issues.some((i) => i.code === 'OS2_FSTYPE_RESERVED_BITS_SET')).toBe(
			true,
		);
	});

	it('accepts all valid fsType bits', () => {
		const os2 = { ...baseOS2(), fsType: 0x030f };
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(issues.some((i) => i.code === 'OS2_FSTYPE_RESERVED_BITS_SET')).toBe(
			false,
		);
	});

	it('flags negative subscript/superscript/strikeout sizes', () => {
		const os2 = { ...baseOS2(), ySubscriptXSize: -10 };
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(issues.some((i) => i.code === 'OS2_NEGATIVE_SIZE')).toBe(true);
	});

	it('flags inverted first/last char index', () => {
		const os2 = {
			...baseOS2(),
			usFirstCharIndex: 0x100,
			usLastCharIndex: 0x20,
		};
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(issues.some((i) => i.code === 'OS2_FIRST_LAST_CHAR_INVERTED')).toBe(
			true,
		);
	});

	it('flags negative sTypoLineGap', () => {
		const os2 = { ...baseOS2(), sTypoLineGap: -50 };
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(issues.some((i) => i.code === 'OS2_TYPO_LINEGAP_NEGATIVE')).toBe(true);
	});

	it('flags negative sxHeight', () => {
		const os2 = { ...baseOS2(), sxHeight: -1 };
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(issues.some((i) => i.code === 'OS2_X_HEIGHT_NEGATIVE')).toBe(true);
	});

	it('flags negative sCapHeight', () => {
		const os2 = { ...baseOS2(), sCapHeight: -1 };
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(issues.some((i) => i.code === 'OS2_CAP_HEIGHT_NEGATIVE')).toBe(true);
	});

	it('flags optical point size out of range (lower too big)', () => {
		const os2 = {
			...baseOS2(),
			version: 5,
			usLowerOpticalPointSize: 0xffff,
			usUpperOpticalPointSize: 100,
		};
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(
			issues.some((i) => i.code === 'OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE'),
		).toBe(true);
	});

	it('flags optical point size out of range (upper too small)', () => {
		const os2 = {
			...baseOS2(),
			version: 5,
			usLowerOpticalPointSize: 50,
			usUpperOpticalPointSize: 1,
		};
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, baseHead(), issues);
		expect(
			issues.some((i) => i.code === 'OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE'),
		).toBe(true);
	});

	it('flags fsSelection vs head.macStyle italic mismatch', () => {
		const os2 = { ...baseOS2(), fsSelection: 0x01 }; // italic
		const head = { macStyle: 0 }; // not italic
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, head, issues);
		expect(
			issues.some((i) => i.code === 'OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH'),
		).toBe(true);
	});

	it('flags fsSelection vs head.macStyle bold mismatch', () => {
		const os2 = { ...baseOS2(), fsSelection: 0x20 }; // bold
		const head = { macStyle: 0 }; // not bold
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, head, issues);
		expect(
			issues.some((i) => i.code === 'OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH'),
		).toBe(true);
	});

	it('accepts matched bold+italic fsSelection and macStyle', () => {
		const os2 = { ...baseOS2(), fsSelection: 0x21 }; // italic + bold
		const head = { macStyle: 0x03 }; // bold + italic
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, head, issues);
		expect(
			issues.some((i) => i.code === 'OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH'),
		).toBe(false);
	});

	it('flags head.macStyle reserved bits', () => {
		const os2 = baseOS2();
		const head = { macStyle: 0x0100 };
		const issues = [];
		diagInternal.validateOS2Sanitization(os2, head, issues);
		expect(issues.some((i) => i.code === 'HEAD_MACSTYLE_RESERVED_BITS_SET')).toBe(
			true,
		);
	});
});

// ============================================================================
//  Tier 4: directory robustness (Firefox/OTS parity)
// ============================================================================

describe('diagnoseFont — Tier 4 directory robustness', () => {
	it('flags FILE_EXCEEDS_1GB on > 1 GiB inputs', () => {
		// We don't allocate an actual 1 GiB buffer — we lie about byteLength.
		// phaseSignature will then emit NOT_ARRAYBUFFER, which is fine; we
		// only need to verify FILE_EXCEEDS_1GB is also in the report.
		const fakeBuffer = { byteLength: 1024 * 1024 * 1024 + 1 };
		const report = diagnoseFont(fakeBuffer);
		expect(report.errors.some((e) => e.code === 'FILE_EXCEEDS_1GB')).toBe(true);
	});

	it('flags TABLE_LENGTH_EXCEEDS_1GB when a directory entry length > 1 GiB', async () => {
		const original = await loadSample('oblegg.ttf');
		const buffer = cloneBuffer(original);
		const view = new DataView(buffer);
		// First table directory entry length is at offset 12 + 12 = 24.
		view.setUint32(24, 1024 * 1024 * 1024 + 1);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'TABLE_LENGTH_EXCEEDS_1GB')).toBe(
			true,
		);
	});

	it('flags TABLES_OVERLAPPING when two tables share bytes', async () => {
		const original = await loadSample('oblegg.ttf');
		const buffer = cloneBuffer(original);
		const view = new DataView(buffer);
		const numTables = view.getUint16(4);

		// Read all entries, sort by offset, then shift the second entry's
		// offset backward by 16 bytes so it overlaps the first.
		const entries = [];
		for (let i = 0; i < numTables; i++) {
			const recOff = 12 + i * 16;
			entries.push({
				index: i,
				recOff,
				offset: view.getUint32(recOff + 8),
				length: view.getUint32(recOff + 12),
			});
		}
		entries.sort((a, b) => a.offset - b.offset);
		const target = entries[1];
		const newOffset = entries[0].offset + entries[0].length - 16;
		view.setUint32(target.recOff + 8, newOffset);

		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'TABLES_OVERLAPPING')).toBe(true);
	});

	it('flags MAXP_VERSION_MISMATCH_FOR_OUTLINE when TTF font has maxp v0.5', async () => {
		const original = await loadSample('oblegg.ttf');
		const buffer = cloneBuffer(original);
		const maxp = findTableEntry(buffer, 'maxp');
		const view = new DataView(buffer);
		// maxp.version is the first 4 bytes of the maxp table.
		view.setUint32(maxp.offset, 0x00005000); // 0.5
		const report = diagnoseFont(buffer);
		expect(
			report.errors.some((e) => e.code === 'MAXP_VERSION_MISMATCH_FOR_OUTLINE'),
		).toBe(true);
	});
});

// ============================================================================
//  Tier 5: name table deep validation (Firefox/OTS parity)
// ============================================================================

describe('diagnoseFont — Tier 5 name deep validation', () => {
	// Build a minimal raw `name` table buffer with header + records + storage.
	// records: array of { platformID, encodingID, languageID, nameID, str }
	function buildNameTable(format, records, langTags = []) {
		const enc = (s) => {
			const out = new Uint8Array(s.length * 2);
			for (let i = 0; i < s.length; i++) {
				const c = s.charCodeAt(i);
				out[2 * i] = (c >> 8) & 0xff;
				out[2 * i + 1] = c & 0xff;
			}
			return out;
		};
		const recordBytes = records.map((r) => enc(r.str));
		const langTagBytes = langTags.map((t) => enc(t));
		const headerSize = 6;
		const recordSize = 12 * records.length;
		const langHeaderSize = format === 1 ? 2 + 4 * langTags.length : 0;
		const storageOffset = headerSize + recordSize + langHeaderSize;
		const storageSize =
			recordBytes.reduce((s, b) => s + b.length, 0) +
			langTagBytes.reduce((s, b) => s + b.length, 0);
		const total = storageOffset + storageSize;
		const buf = new ArrayBuffer(total);
		const view = new DataView(buf);
		view.setUint16(0, format);
		view.setUint16(2, records.length);
		view.setUint16(4, storageOffset);

		let strOff = 0;
		for (let i = 0; i < records.length; i++) {
			const r = records[i];
			const o = headerSize + i * 12;
			view.setUint16(o, r.platformID);
			view.setUint16(o + 2, r.encodingID);
			view.setUint16(o + 4, r.languageID);
			view.setUint16(o + 6, r.nameID);
			view.setUint16(o + 8, recordBytes[i].length);
			view.setUint16(o + 10, strOff);
			new Uint8Array(buf, storageOffset + strOff, recordBytes[i].length).set(
				recordBytes[i],
			);
			strOff += recordBytes[i].length;
		}

		if (format === 1) {
			const langOff = headerSize + recordSize;
			view.setUint16(langOff, langTags.length);
			for (let i = 0; i < langTags.length; i++) {
				const o = langOff + 2 + i * 4;
				view.setUint16(o, langTagBytes[i].length);
				view.setUint16(o + 2, strOff);
				new Uint8Array(buf, storageOffset + strOff, langTagBytes[i].length).set(
					langTagBytes[i],
				);
				strOff += langTagBytes[i].length;
			}
		}

		return buf;
	}

	function makeEntries(rawNameBuf) {
		// Wrap the raw name table in a fake SFNT so validateNameDeep can
		// resolve `entries` against `sfnt`.  Simplest: prepend a 12-byte
		// header padding; entry.offset = 12, entry.length = rawNameBuf.byteLength.
		const sfnt = new ArrayBuffer(12 + rawNameBuf.byteLength);
		new Uint8Array(sfnt, 12).set(new Uint8Array(rawNameBuf));
		const entries = [{ tag: 'name', offset: 12, length: rawNameBuf.byteLength }];
		return { sfnt, entries };
	}

	it('flags NAME_FORMAT_INVALID for format > 1', () => {
		const issues = [];
		const name = { version: 2, names: [] };
		diagInternal.validateNameDeep(name, [], new ArrayBuffer(0), issues);
		expect(issues.some((i) => i.code === 'NAME_FORMAT_INVALID')).toBe(true);
	});

	it('accepts format 0 and 1', () => {
		for (const fmt of [0, 1]) {
			const issues = [];
			const name = { version: fmt, names: [] };
			diagInternal.validateNameDeep(name, [], new ArrayBuffer(0), issues);
			expect(issues.some((i) => i.code === 'NAME_FORMAT_INVALID')).toBe(false);
		}
	});

	it('flags NAME_STRING_OFFSET_INVALID when stringOffset is < records end', () => {
		const raw = buildNameTable(0, [
			{ platformID: 3, encodingID: 1, languageID: 0x409, nameID: 1, str: 'A' },
		]);
		// Corrupt: set stringOffset to 4 (inside header).
		new DataView(raw).setUint16(4, 4);
		const { sfnt, entries } = makeEntries(raw);
		const issues = [];
		diagInternal.validateNameDeep(
			{ version: 0, names: [] },
			entries,
			sfnt,
			issues,
		);
		expect(issues.some((i) => i.code === 'NAME_STRING_OFFSET_INVALID')).toBe(
			true,
		);
	});

	it('flags NAME_RECORD_OUT_OF_BOUNDS when a record string overruns the table', () => {
		const raw = buildNameTable(0, [
			{ platformID: 3, encodingID: 1, languageID: 0x409, nameID: 1, str: 'AB' },
		]);
		// Header is at offset 0 of `raw`.  First record is at byte 6.
		// Set its length to 9999 (way past the table end).
		new DataView(raw).setUint16(6 + 8, 9999);
		const { sfnt, entries } = makeEntries(raw);
		const issues = [];
		diagInternal.validateNameDeep(
			{ version: 0, names: [] },
			entries,
			sfnt,
			issues,
		);
		expect(issues.some((i) => i.code === 'NAME_RECORD_OUT_OF_BOUNDS')).toBe(true);
	});

	it('flags NAME_LANG_TAG_TOO_LONG when a tag exceeds 200 bytes', () => {
		const longTag = 'x'.repeat(120); // 120 chars × 2 bytes UTF-16BE = 240 bytes
		const issues = [];
		const name = {
			version: 1,
			names: [],
			langTagRecords: [{ tag: longTag }],
		};
		diagInternal.validateNameDeep(name, [], new ArrayBuffer(0), issues);
		expect(issues.some((i) => i.code === 'NAME_LANG_TAG_TOO_LONG')).toBe(true);
	});

	it('accepts language-tag at the 200-byte limit', () => {
		const okTag = 'x'.repeat(100); // 100 × 2 = 200 bytes
		const issues = [];
		const name = {
			version: 1,
			names: [],
			langTagRecords: [{ tag: okTag }],
		};
		diagInternal.validateNameDeep(name, [], new ArrayBuffer(0), issues);
		expect(issues.some((i) => i.code === 'NAME_LANG_TAG_TOO_LONG')).toBe(false);
	});

	it('flags NAME_POSTSCRIPT_NAME_INVALID_CHARS for forbidden chars', () => {
		const issues = [];
		const name = {
			version: 0,
			names: [
				{
					platformID: 3,
					encodingID: 1,
					languageID: 0x409,
					nameID: 6,
					value: 'My Bad/PS Name',
				},
			],
		};
		diagInternal.validateNameDeep(name, [], new ArrayBuffer(0), issues);
		expect(
			issues.some((i) => i.code === 'NAME_POSTSCRIPT_NAME_INVALID_CHARS'),
		).toBe(true);
	});

	it('accepts a clean PostScript name', () => {
		const issues = [];
		const name = {
			version: 0,
			names: [
				{
					platformID: 3,
					encodingID: 1,
					languageID: 0x409,
					nameID: 6,
					value: 'MyFont-Regular',
				},
			],
		};
		diagInternal.validateNameDeep(name, [], new ArrayBuffer(0), issues);
		expect(
			issues.some((i) => i.code === 'NAME_POSTSCRIPT_NAME_INVALID_CHARS'),
		).toBe(false);
	});
});

// ============================================================================
//  Tier 6: WOFF wrapper integrity
// ============================================================================

describe('diagnoseFont — Tier 6 WOFF wrapper integrity', () => {
	it('clean WOFF1 sample produces no Tier 6 errors', async () => {
		const buf = await loadSample('oblegg.woff');
		const issues = [];
		diagInternal.validateWoff1Wrapper(buf, issues);
		expect(issues).toEqual([]);
	});

	it('flags WOFF1_FILE_SIZE_MISMATCH when header.length is wrong', async () => {
		const buf = await loadSample('oblegg.woff');
		const clone = buf.slice(0);
		new DataView(clone).setUint32(8, 999999);
		const issues = [];
		diagInternal.validateWoff1Wrapper(clone, issues);
		expect(issues.some((i) => i.code === 'WOFF1_FILE_SIZE_MISMATCH')).toBe(true);
	});

	it('flags WOFF1_RESERVED_FIELD_NONZERO', async () => {
		const buf = await loadSample('oblegg.woff');
		const clone = buf.slice(0);
		new DataView(clone).setUint16(14, 0x1234);
		const issues = [];
		diagInternal.validateWoff1Wrapper(clone, issues);
		expect(issues.some((i) => i.code === 'WOFF1_RESERVED_FIELD_NONZERO')).toBe(
			true,
		);
	});

	it('flags WOFF1_SFNT_SIZE_MISMATCH', async () => {
		const buf = await loadSample('oblegg.woff');
		const clone = buf.slice(0);
		// Bump totalSfntSize by 1000 so it no longer matches the directory.
		const view = new DataView(clone);
		view.setUint32(16, view.getUint32(16) + 1000);
		const issues = [];
		diagInternal.validateWoff1Wrapper(clone, issues);
		expect(issues.some((i) => i.code === 'WOFF1_SFNT_SIZE_MISMATCH')).toBe(true);
	});

	it('flags WOFF1_METADATA_BLOCK_INVALID for inconsistent offset/length', async () => {
		const buf = await loadSample('oblegg.woff');
		const clone = buf.slice(0);
		// Set metaOffset non-zero but leave metaLength = 0.
		new DataView(clone).setUint32(24, 100);
		new DataView(clone).setUint32(28, 0);
		const issues = [];
		diagInternal.validateWoff1Wrapper(clone, issues);
		expect(issues.some((i) => i.code === 'WOFF1_METADATA_BLOCK_INVALID')).toBe(
			true,
		);
	});

	it('flags WOFF1_METADATA_BLOCK_INVALID for out-of-bounds block', async () => {
		const buf = await loadSample('oblegg.woff');
		const clone = buf.slice(0);
		new DataView(clone).setUint32(24, buf.byteLength - 5);
		new DataView(clone).setUint32(28, 999999);
		const issues = [];
		diagInternal.validateWoff1Wrapper(clone, issues);
		expect(issues.some((i) => i.code === 'WOFF1_METADATA_BLOCK_INVALID')).toBe(
			true,
		);
	});

	it('flags WOFF1_PRIVATE_BLOCK_INVALID for inconsistent offset/length', async () => {
		const buf = await loadSample('oblegg.woff');
		const clone = buf.slice(0);
		new DataView(clone).setUint32(36, 100);
		new DataView(clone).setUint32(40, 0);
		const issues = [];
		diagInternal.validateWoff1Wrapper(clone, issues);
		expect(issues.some((i) => i.code === 'WOFF1_PRIVATE_BLOCK_INVALID')).toBe(
			true,
		);
	});

	it('flags WOFF1_TRAILING_JUNK when extra bytes follow the last block', async () => {
		const buf = await loadSample('oblegg.woff');
		// Append 100 bytes of junk and bump header.length to match so the
		// FILE_SIZE_MISMATCH check passes.
		const padded = new ArrayBuffer(buf.byteLength + 100);
		new Uint8Array(padded).set(new Uint8Array(buf));
		new DataView(padded).setUint32(8, padded.byteLength);
		const issues = [];
		diagInternal.validateWoff1Wrapper(padded, issues);
		expect(issues.some((i) => i.code === 'WOFF1_TRAILING_JUNK')).toBe(true);
	});

	it('clean WOFF2 sample passes wrapper integrity', async () => {
		const buf = await loadSample('oblegg.woff2');
		const issues = [];
		diagInternal.validateWoff2Wrapper(buf, issues);
		expect(issues).toEqual([]);
	});

	it('flags WOFF2_FILE_SIZE_MISMATCH', async () => {
		const buf = await loadSample('oblegg.woff2');
		const clone = buf.slice(0);
		new DataView(clone).setUint32(8, 1);
		const issues = [];
		diagInternal.validateWoff2Wrapper(clone, issues);
		expect(issues.some((i) => i.code === 'WOFF2_FILE_SIZE_MISMATCH')).toBe(true);
	});

	it('flags WOFF2_RESERVED_FIELD_NONZERO', async () => {
		const buf = await loadSample('oblegg.woff2');
		const clone = buf.slice(0);
		new DataView(clone).setUint16(14, 0xbeef);
		const issues = [];
		diagInternal.validateWoff2Wrapper(clone, issues);
		expect(issues.some((i) => i.code === 'WOFF2_RESERVED_FIELD_NONZERO')).toBe(
			true,
		);
	});

	it('flags WOFF2_DECOMPRESSED_SIZE_INVALID for tiny totalSfntSize', async () => {
		const buf = await loadSample('oblegg.woff2');
		const clone = buf.slice(0);
		new DataView(clone).setUint32(16, 5);
		const issues = [];
		diagInternal.validateWoff2Wrapper(clone, issues);
		expect(issues.some((i) => i.code === 'WOFF2_DECOMPRESSED_SIZE_INVALID')).toBe(
			true,
		);
	});
});

// ============================================================================
//  Tier 7: deep table validation (fvar / GSUB / GPOS)
// ============================================================================

describe('diagnoseFont — Tier 7 fvar deep validation', () => {
	it('flags FVAR_AXIS_RANGE_INVALID when default outside [min,max]', () => {
		const issues = [];
		diagInternal.validateFvarDeep(
			{
				axes: [{ axisTag: 'wght', minValue: 100, defaultValue: 50, maxValue: 900 }],
				instances: [],
			},
			issues,
		);
		expect(issues.some((i) => i.code === 'FVAR_AXIS_RANGE_INVALID')).toBe(true);
	});

	it('flags FVAR_AXIS_DUPLICATE_TAG', () => {
		const issues = [];
		diagInternal.validateFvarDeep(
			{
				axes: [
					{ axisTag: 'wght', minValue: 100, defaultValue: 400, maxValue: 900 },
					{ axisTag: 'wght', minValue: 0, defaultValue: 0, maxValue: 1 },
				],
				instances: [],
			},
			issues,
		);
		expect(issues.some((i) => i.code === 'FVAR_AXIS_DUPLICATE_TAG')).toBe(true);
	});

	it('flags FVAR_INSTANCE_OUT_OF_RANGE', () => {
		const issues = [];
		diagInternal.validateFvarDeep(
			{
				axes: [
					{ axisTag: 'wght', minValue: 100, defaultValue: 400, maxValue: 900 },
				],
				instances: [{ coordinates: [9999] }],
			},
			issues,
		);
		expect(issues.some((i) => i.code === 'FVAR_INSTANCE_OUT_OF_RANGE')).toBe(
			true,
		);
	});

	it('accepts a clean fvar', () => {
		const issues = [];
		diagInternal.validateFvarDeep(
			{
				axes: [
					{ axisTag: 'wght', minValue: 100, defaultValue: 400, maxValue: 900 },
					{ axisTag: 'wdth', minValue: 50, defaultValue: 100, maxValue: 200 },
				],
				instances: [{ coordinates: [400, 100] }, { coordinates: [700, 100] }],
			},
			issues,
		);
		expect(issues).toEqual([]);
	});
});

describe('diagnoseFont — Tier 7 layout lookup validation', () => {
	it('flags GSUB_LOOKUP_TYPE_INVALID for type 0 or > 8', () => {
		const issues = [];
		diagInternal.validateLayoutLookups(
			{ lookupList: { lookups: [{ lookupType: 99, lookupFlag: 0 }] } },
			'GSUB',
			issues,
		);
		expect(issues.some((i) => i.code === 'GSUB_LOOKUP_TYPE_INVALID')).toBe(true);
	});

	it('flags GPOS_LOOKUP_TYPE_INVALID for type > 9', () => {
		const issues = [];
		diagInternal.validateLayoutLookups(
			{ lookupList: { lookups: [{ lookupType: 12, lookupFlag: 0 }] } },
			'GPOS',
			issues,
		);
		expect(issues.some((i) => i.code === 'GPOS_LOOKUP_TYPE_INVALID')).toBe(true);
	});

	it('flags LAYOUT_LOOKUP_FLAG_RESERVED for reserved bits', () => {
		const issues = [];
		diagInternal.validateLayoutLookups(
			// 0x0040 is in the reserved mask 0x00E0.
			{ lookupList: { lookups: [{ lookupType: 1, lookupFlag: 0x0040 }] } },
			'GSUB',
			issues,
		);
		expect(issues.some((i) => i.code === 'LAYOUT_LOOKUP_FLAG_RESERVED')).toBe(
			true,
		);
	});

	it('flags LAYOUT_LOOKUP_FLAG_INVALID for bits above 0x00FF', () => {
		const issues = [];
		diagInternal.validateLayoutLookups(
			{ lookupList: { lookups: [{ lookupType: 1, lookupFlag: 0x0100 }] } },
			'GPOS',
			issues,
		);
		expect(issues.some((i) => i.code === 'LAYOUT_LOOKUP_FLAG_INVALID')).toBe(
			true,
		);
	});

	it('accepts valid lookups (GSUB type 1..8, GPOS type 1..9)', () => {
		for (const type of [1, 2, 3, 4, 5, 6, 7, 8]) {
			const issues = [];
			diagInternal.validateLayoutLookups(
				{ lookupList: { lookups: [{ lookupType: type, lookupFlag: 0x0001 }] } },
				'GSUB',
				issues,
			);
			expect(issues).toEqual([]);
		}
		for (const type of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
			const issues = [];
			diagInternal.validateLayoutLookups(
				{ lookupList: { lookups: [{ lookupType: type, lookupFlag: 0x0008 }] } },
				'GPOS',
				issues,
			);
			expect(issues).toEqual([]);
		}
	});
});

describe('diagnoseFont — Tier 7 variation table cross-checks', () => {
	it('flags HVAR_WITHOUT_FVAR when HVAR exists but fvar does not', async () => {
		// Rename oblegg.ttf's gasp entry (or any non-required table) to HVAR
		// so the cross-table check fires.
		const buf = await loadSample('oblegg.ttf');
		const clone = buf.slice(0);
		const view = new DataView(clone);
		const numTables = view.getUint16(4);
		let renamed = false;
		for (let i = 0; i < numTables; i++) {
			const off = 12 + i * 16;
			const tag = String.fromCharCode(
				view.getUint8(off),
				view.getUint8(off + 1),
				view.getUint8(off + 2),
				view.getUint8(off + 3),
			);
			if (tag === 'gasp' || tag === 'DSIG' || tag === 'meta') {
				view.setUint8(off, 0x48); // H
				view.setUint8(off + 1, 0x56); // V
				view.setUint8(off + 2, 0x41); // A
				view.setUint8(off + 3, 0x52); // R
				renamed = true;
				break;
			}
		}
		expect(renamed).toBe(true);
		const report = diagnoseFont(clone);
		expect(report.errors.some((e) => e.code === 'HVAR_WITHOUT_FVAR')).toBe(true);
	});
});

// ============================================================================
//  Tier 7 EXTENDED — fvar names/flags, STAT, avar, IVS/HVAR/VVAR/MVAR,
//  GDEF, GSUB/GPOS subtable structure, MATH
// ============================================================================

describe('diagnoseFont — Tier 7 fvar names + flags', () => {
	it('flags FVAR_AXIS_FLAGS_RESERVED', () => {
		const issues = [];
		diagInternal.validateFvarNamesAndFlags(
			{
				axes: [
					{
						axisTag: 'wght',
						minValue: 100,
						defaultValue: 400,
						maxValue: 900,
						axisNameID: 256,
						flags: 0x0002,
					},
				],
				instances: [],
			},
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'FVAR_AXIS_FLAGS_RESERVED')).toBe(true);
	});

	it('flags FVAR_AXIS_NAMEID_RESERVED for IDs < 256', () => {
		const issues = [];
		diagInternal.validateFvarNamesAndFlags(
			{
				axes: [
					{
						axisTag: 'wght',
						minValue: 100,
						defaultValue: 400,
						maxValue: 900,
						axisNameID: 100,
						flags: 0,
					},
				],
				instances: [],
			},
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'FVAR_AXIS_NAMEID_RESERVED')).toBe(true);
	});

	it('flags FVAR_AXIS_NAMEID_MISSING when name table lacks the ID', () => {
		const issues = [];
		diagInternal.validateFvarNamesAndFlags(
			{
				axes: [
					{
						axisTag: 'wght',
						minValue: 100,
						defaultValue: 400,
						maxValue: 900,
						axisNameID: 999,
						flags: 0,
					},
				],
				instances: [],
			},
			{ names: [{ nameID: 256 }] },
			issues,
		);
		expect(issues.some((i) => i.code === 'FVAR_AXIS_NAMEID_MISSING')).toBe(true);
	});

	it('flags FVAR_INSTANCE_FLAGS_RESERVED', () => {
		const issues = [];
		diagInternal.validateFvarNamesAndFlags(
			{
				axes: [],
				instances: [{ subfamilyNameID: 256, flags: 0x0010, coordinates: [] }],
			},
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'FVAR_INSTANCE_FLAGS_RESERVED')).toBe(
			true,
		);
	});
});

describe('diagnoseFont — Tier 7 STAT validation', () => {
	it('flags STAT_VERSION_INVALID', () => {
		const issues = [];
		diagInternal.validateSTAT(
			{ majorVersion: 2, designAxisSize: 8, designAxes: [], axisValues: [] },
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'STAT_VERSION_INVALID')).toBe(true);
	});

	it('flags STAT_DESIGN_AXIS_SIZE_INVALID when < 8', () => {
		const issues = [];
		diagInternal.validateSTAT(
			{ majorVersion: 1, designAxisSize: 4, designAxes: [], axisValues: [] },
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'STAT_DESIGN_AXIS_SIZE_INVALID')).toBe(
			true,
		);
	});

	it('flags STAT_AXIS_VALUE_AXIS_INDEX_OUT_OF_RANGE', () => {
		const issues = [];
		diagInternal.validateSTAT(
			{
				majorVersion: 1,
				designAxisSize: 8,
				designAxes: [{ axisTag: 'wght' }],
				axisValues: [
					{ format: 1, axisIndex: 5, flags: 0, valueNameID: 256, value: 400 },
				],
			},
			null,
			issues,
		);
		expect(
			issues.some((i) => i.code === 'STAT_AXIS_VALUE_AXIS_INDEX_OUT_OF_RANGE'),
		).toBe(true);
	});

	it('flags STAT_AXIS_VALUE_RANGE_INVALID for format 2 with nominal outside [min,max]', () => {
		const issues = [];
		diagInternal.validateSTAT(
			{
				majorVersion: 1,
				designAxisSize: 8,
				designAxes: [{ axisTag: 'wght' }],
				axisValues: [
					{
						format: 2,
						axisIndex: 0,
						flags: 0,
						valueNameID: 256,
						nominalValue: 1000,
						rangeMinValue: 100,
						rangeMaxValue: 900,
					},
				],
			},
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'STAT_AXIS_VALUE_RANGE_INVALID')).toBe(
			true,
		);
	});

	it('flags STAT_MISSING_FVAR_AXIS', () => {
		const issues = [];
		diagInternal.validateSTAT(
			{
				majorVersion: 1,
				designAxisSize: 8,
				designAxes: [{ axisTag: 'wght' }],
				axisValues: [],
			},
			{ axes: [{ axisTag: 'wght' }, { axisTag: 'ital' }] },
			issues,
		);
		expect(issues.some((i) => i.code === 'STAT_MISSING_FVAR_AXIS')).toBe(true);
	});
});

describe('diagnoseFont — Tier 7 avar validation', () => {
	it('flags AVAR_SEGMENT_COUNT_MISMATCH', () => {
		const issues = [];
		diagInternal.validateAvar(
			{ segmentMaps: [{ axisValueMaps: [] }] },
			{ axes: [{ axisTag: 'wght' }, { axisTag: 'ital' }] },
			issues,
		);
		expect(issues.some((i) => i.code === 'AVAR_SEGMENT_COUNT_MISMATCH')).toBe(
			true,
		);
	});

	it('flags AVAR_COORD_OUT_OF_RANGE', () => {
		const issues = [];
		diagInternal.validateAvar(
			{
				segmentMaps: [
					{
						axisValueMaps: [
							{ fromCoordinate: -1, toCoordinate: -1 },
							{ fromCoordinate: 0, toCoordinate: 0 },
							{ fromCoordinate: 1.5, toCoordinate: 1 },
						],
					},
				],
			},
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'AVAR_COORD_OUT_OF_RANGE')).toBe(true);
	});

	it('flags AVAR_FROM_COORD_NOT_INCREASING', () => {
		const issues = [];
		diagInternal.validateAvar(
			{
				segmentMaps: [
					{
						axisValueMaps: [
							{ fromCoordinate: -1, toCoordinate: -1 },
							{ fromCoordinate: 0.5, toCoordinate: 0.5 },
							{ fromCoordinate: 0.2, toCoordinate: 0.2 },
							{ fromCoordinate: 1, toCoordinate: 1 },
						],
					},
				],
			},
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'AVAR_FROM_COORD_NOT_INCREASING')).toBe(
			true,
		);
	});

	it('flags AVAR_MISSING_REQUIRED_ENDPOINTS', () => {
		const issues = [];
		diagInternal.validateAvar(
			{
				segmentMaps: [
					{
						axisValueMaps: [
							{ fromCoordinate: -0.5, toCoordinate: -0.5 },
							{ fromCoordinate: 0, toCoordinate: 0 },
							{ fromCoordinate: 0.5, toCoordinate: 0.5 },
						],
					},
				],
			},
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'AVAR_MISSING_REQUIRED_ENDPOINTS')).toBe(
			true,
		);
	});

	it('passes a clean avar segment map', () => {
		const issues = [];
		diagInternal.validateAvar(
			{
				segmentMaps: [
					{
						axisValueMaps: [
							{ fromCoordinate: -1, toCoordinate: -1 },
							{ fromCoordinate: 0, toCoordinate: 0 },
							{ fromCoordinate: 1, toCoordinate: 1 },
						],
					},
				],
			},
			{ axes: [{ axisTag: 'wght' }] },
			issues,
		);
		expect(issues).toEqual([]);
	});
});

describe('diagnoseFont — Tier 7 ItemVariationStore validation', () => {
	it('flags IVS_AXIS_COUNT_MISMATCH', () => {
		const issues = [];
		diagInternal.validateItemVariationStore(
			{
				variationRegionList: { axisCount: 2, regions: [] },
				itemVariationData: [],
			},
			3,
			'HVAR',
			issues,
		);
		expect(issues.some((i) => i.code === 'IVS_AXIS_COUNT_MISMATCH')).toBe(true);
	});

	it('flags IVS_REGION_COORD_OUT_OF_RANGE', () => {
		const issues = [];
		diagInternal.validateItemVariationStore(
			{
				variationRegionList: {
					axisCount: 1,
					regions: [{ regionAxes: [{ startCoord: -2, peakCoord: 0, endCoord: 1 }] }],
				},
				itemVariationData: [],
			},
			1,
			'HVAR',
			issues,
		);
		expect(issues.some((i) => i.code === 'IVS_REGION_COORD_OUT_OF_RANGE')).toBe(
			true,
		);
	});

	it('flags IVS_REGION_PEAK_OUT_OF_ORDER', () => {
		const issues = [];
		diagInternal.validateItemVariationStore(
			{
				variationRegionList: {
					axisCount: 1,
					regions: [
						{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 0.5 }] },
					],
				},
				itemVariationData: [],
			},
			1,
			'HVAR',
			issues,
		);
		expect(issues.some((i) => i.code === 'IVS_REGION_PEAK_OUT_OF_ORDER')).toBe(
			true,
		);
	});

	it('flags IVS_REGION_INDEX_OUT_OF_RANGE', () => {
		const issues = [];
		diagInternal.validateItemVariationStore(
			{
				variationRegionList: {
					axisCount: 1,
					regions: [{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }] }],
				},
				itemVariationData: [{ itemCount: 1, regionIndexes: [5], deltaSets: [[0]] }],
			},
			1,
			'HVAR',
			issues,
		);
		expect(issues.some((i) => i.code === 'IVS_REGION_INDEX_OUT_OF_RANGE')).toBe(
			true,
		);
	});
});

describe('diagnoseFont — Tier 7 MVAR validation', () => {
	it('flags MVAR_VALUE_RECORD_SIZE_INVALID', () => {
		const issues = [];
		diagInternal.validateMVAR(
			{ valueRecordSize: 4, valueRecords: [] },
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'MVAR_VALUE_RECORD_SIZE_INVALID')).toBe(
			true,
		);
	});

	it('flags MVAR_DELTA_SET_OUTER_OUT_OF_RANGE', () => {
		const issues = [];
		diagInternal.validateMVAR(
			{
				valueRecordSize: 8,
				valueRecords: [
					{ valueTag: 'xhgt', deltaSetOuterIndex: 5, deltaSetInnerIndex: 0 },
				],
				itemVariationStore: {
					variationRegionList: { axisCount: 1, regions: [] },
					itemVariationData: [],
				},
			},
			null,
			issues,
		);
		expect(
			issues.some((i) => i.code === 'MVAR_DELTA_SET_OUTER_OUT_OF_RANGE'),
		).toBe(true);
	});

	it('flags MVAR_DELTA_SET_INNER_OUT_OF_RANGE', () => {
		const issues = [];
		diagInternal.validateMVAR(
			{
				valueRecordSize: 8,
				valueRecords: [
					{ valueTag: 'xhgt', deltaSetOuterIndex: 0, deltaSetInnerIndex: 99 },
				],
				itemVariationStore: {
					variationRegionList: { axisCount: 1, regions: [] },
					itemVariationData: [{ itemCount: 3, regionIndexes: [], deltaSets: [] }],
				},
			},
			null,
			issues,
		);
		expect(
			issues.some((i) => i.code === 'MVAR_DELTA_SET_INNER_OUT_OF_RANGE'),
		).toBe(true);
	});
});

describe('diagnoseFont — Tier 7 GDEF + Coverage + ClassDef', () => {
	it('flags COVERAGE_FORMAT_INVALID', () => {
		const issues = [];
		diagInternal.validateCoverage({ format: 7 }, 100, 'test', issues);
		expect(issues.some((i) => i.code === 'COVERAGE_FORMAT_INVALID')).toBe(true);
	});

	it('flags COVERAGE_GLYPH_OUT_OF_RANGE in format 1', () => {
		const issues = [];
		diagInternal.validateCoverage(
			{ format: 1, glyphs: [10, 999] },
			100,
			'test',
			issues,
		);
		expect(issues.some((i) => i.code === 'COVERAGE_GLYPH_OUT_OF_RANGE')).toBe(
			true,
		);
	});

	it('flags COVERAGE_GLYPHS_NOT_SORTED', () => {
		const issues = [];
		diagInternal.validateCoverage(
			{ format: 1, glyphs: [10, 5, 20] },
			100,
			'test',
			issues,
		);
		expect(issues.some((i) => i.code === 'COVERAGE_GLYPHS_NOT_SORTED')).toBe(
			true,
		);
	});

	it('flags COVERAGE_RANGES_NOT_SORTED in format 2', () => {
		const issues = [];
		diagInternal.validateCoverage(
			{
				format: 2,
				ranges: [
					{ startGlyphID: 0, endGlyphID: 5 },
					{ startGlyphID: 3, endGlyphID: 8 },
				],
			},
			100,
			'test',
			issues,
		);
		expect(issues.some((i) => i.code === 'COVERAGE_RANGES_NOT_SORTED')).toBe(
			true,
		);
	});

	it('flags CLASSDEF_FORMAT_INVALID', () => {
		const issues = [];
		diagInternal.validateClassDef({ format: 99 }, 100, 'test', issues);
		expect(issues.some((i) => i.code === 'CLASSDEF_FORMAT_INVALID')).toBe(true);
	});

	it('flags CLASSDEF_CLASS_OUT_OF_RANGE for GDEF.glyphClassDef (max 4)', () => {
		const issues = [];
		diagInternal.validateClassDef(
			{ format: 1, startGlyphID: 0, classValues: [1, 2, 7] },
			100,
			'GDEF.glyphClassDef',
			issues,
			{ maxClass: 4 },
		);
		expect(issues.some((i) => i.code === 'CLASSDEF_CLASS_OUT_OF_RANGE')).toBe(
			true,
		);
	});

	it('flags GDEF_VERSION_INVALID', () => {
		const issues = [];
		diagInternal.validateGDEFTable({ majorVersion: 2 }, 100, null, issues);
		expect(issues.some((i) => i.code === 'GDEF_VERSION_INVALID')).toBe(true);
	});
});

describe('diagnoseFont — Tier 7 GSUB/GPOS subtable structure', () => {
	it('flags GSUB_SUBSTITUTE_GLYPH_OUT_OF_RANGE', () => {
		const issues = [];
		diagInternal.validateLayoutSubtables(
			{
				lookupList: {
					lookups: [
						{
							lookupType: 1,
							lookupFlag: 0,
							subtables: [
								{
									coverage: { format: 1, glyphs: [10] },
									substituteGlyphIDs: [9999],
								},
							],
						},
					],
				},
			},
			'GSUB',
			100,
			issues,
		);
		expect(
			issues.some((i) => i.code === 'GSUB_SUBSTITUTE_GLYPH_OUT_OF_RANGE'),
		).toBe(true);
	});

	it('flags GSUB_LIGATURE_GLYPH_OUT_OF_RANGE', () => {
		const issues = [];
		diagInternal.validateLayoutSubtables(
			{
				lookupList: {
					lookups: [
						{
							lookupType: 4,
							lookupFlag: 0,
							subtables: [
								{
									coverage: { format: 1, glyphs: [10] },
									ligatureSets: [
										[
											{
												ligatureGlyph: 9999,
												componentCount: 2,
												componentGlyphIDs: [11],
											},
										],
									],
								},
							],
						},
					],
				},
			},
			'GSUB',
			100,
			issues,
		);
		expect(
			issues.some((i) => i.code === 'GSUB_LIGATURE_GLYPH_OUT_OF_RANGE'),
		).toBe(true);
	});

	it('flags COVERAGE_GLYPH_OUT_OF_RANGE on GPOS subtable coverage', () => {
		const issues = [];
		diagInternal.validateLayoutSubtables(
			{
				lookupList: {
					lookups: [
						{
							lookupType: 1,
							lookupFlag: 0,
							subtables: [{ coverage: { format: 1, glyphs: [200] } }],
						},
					],
				},
			},
			'GPOS',
			100,
			issues,
		);
		expect(issues.some((i) => i.code === 'COVERAGE_GLYPH_OUT_OF_RANGE')).toBe(
			true,
		);
	});
});

describe('diagnoseFont — Tier 7 MATH validation', () => {
	it('flags MATH_VERSION_INVALID', () => {
		const issues = [];
		diagInternal.validateMATH({ version: 0x00020000 }, issues);
		expect(issues.some((i) => i.code === 'MATH_VERSION_INVALID')).toBe(true);
	});

	it('passes when version is 0x00010000', () => {
		const issues = [];
		diagInternal.validateMATH({ version: 0x00010000 }, issues);
		expect(issues).toEqual([]);
	});
});

// ============================================================================
//  Tier 7 second-pass: CFF / CFF2 charstring opcode validation
// ============================================================================

describe('Tier 7 CFF charstring opcode validation', () => {
	function makeCff(
		charStringsBytes,
		{ localSubrs = [], globalSubrs = [] } = {},
	) {
		return {
			fonts: [{ charStrings: charStringsBytes, localSubrs }],
			globalSubrs,
		};
	}
	function makeCff2(
		charStringsBytes,
		{ localSubrs = [], globalSubrs = [] } = {},
	) {
		return {
			charStrings: charStringsBytes,
			fontDicts: [{ localSubrs }],
			globalSubrs,
		};
	}

	it('flags CFF_INVALID_OPERATOR for unknown one-byte op (CFF1)', () => {
		// 139 (push 0), 0x10 (op 16 = unused in CFF1), 14 (endchar)
		const issues = [];
		diagInternal.validateCffCharStrings(
			makeCff([[139, 16, 14]]),
			'CFF',
			issues,
			false,
		);
		expect(issues.some((i) => i.code === 'CFF_INVALID_OPERATOR')).toBe(true);
	});

	it('does NOT flag op 16 (blend) in CFF2', () => {
		// push 1 (operand for blend) then op 16 (blend), then push & op 5 (rlineto)
		const issues = [];
		diagInternal.validateCffCharStrings(
			makeCff2([[140, 16, 139, 139, 5]]),
			'CFF2',
			issues,
			true,
		);
		expect(issues.filter((i) => i.code === 'CFF_INVALID_OPERATOR')).toEqual([]);
	});

	it('flags endchar (14) as invalid in CFF2', () => {
		const issues = [];
		diagInternal.validateCffCharStrings(makeCff2([[14]]), 'CFF2', issues, true);
		expect(issues.some((i) => i.code === 'CFF_INVALID_OPERATOR')).toBe(true);
	});

	it('flags CFF_STACK_UNDERFLOW for callsubr with empty stack', () => {
		const issues = [];
		// 10 = callsubr (needs 1 operand)
		diagInternal.validateCffCharStrings(
			makeCff([[10, 14]]),
			'CFF',
			issues,
			false,
		);
		expect(issues.some((i) => i.code === 'CFF_STACK_UNDERFLOW')).toBe(true);
	});

	it('flags CFF_SUBR_INDEX_OUT_OF_RANGE', () => {
		const issues = [];
		// push 100, callsubr — but localSubrs is empty → biased index 207 out of range.
		diagInternal.validateCffCharStrings(
			makeCff([[139 + 100, 10, 14]]),
			'CFF',
			issues,
			false,
		);
		expect(issues.some((i) => i.code === 'CFF_SUBR_INDEX_OUT_OF_RANGE')).toBe(
			true,
		);
	});

	it('flags CFF_INVALID_OPERATOR for unknown two-byte op', () => {
		// 12 99 — 99 is not a defined two-byte op
		const issues = [];
		diagInternal.validateCffCharStrings(
			makeCff([[12, 99, 14]]),
			'CFF',
			issues,
			false,
		);
		expect(issues.some((i) => i.code === 'CFF_INVALID_OPERATOR')).toBe(true);
	});

	it('flags CFF_TRUNCATED_OPERATOR for hanging escape byte', () => {
		const issues = [];
		diagInternal.validateCffCharStrings(makeCff([[12]]), 'CFF', issues, false);
		expect(issues.some((i) => i.code === 'CFF_TRUNCATED_OPERATOR')).toBe(true);
	});

	it('flags CFF_STACK_OVERFLOW when stack exceeds 48 (CFF1)', () => {
		// Push 50 numbers then endchar
		const bytes = [];
		for (let i = 0; i < 50; i++) bytes.push(139);
		bytes.push(14);
		const issues = [];
		diagInternal.validateCffCharStrings(makeCff([bytes]), 'CFF', issues, false);
		expect(issues.some((i) => i.code === 'CFF_STACK_OVERFLOW')).toBe(true);
	});

	it('does NOT flag stack of 50 in CFF2 (limit is 513)', () => {
		const bytes = [];
		for (let i = 0; i < 50; i++) bytes.push(139);
		bytes.push(5); // rlineto
		const issues = [];
		diagInternal.validateCffCharStrings(makeCff2([bytes]), 'CFF2', issues, true);
		expect(issues.filter((i) => i.code === 'CFF_STACK_OVERFLOW')).toEqual([]);
	});

	it('passes a clean CFF1 charstring with rmoveto + rlineto + endchar', () => {
		// 139=0, 139=0, 21=rmoveto, 139, 139, 5=rlineto, 14=endchar
		const issues = [];
		diagInternal.validateCffCharStrings(
			makeCff([[139, 139, 21, 139, 139, 5, 14]]),
			'CFF',
			issues,
			false,
		);
		expect(issues).toEqual([]);
	});
});

// ============================================================================
//  Tier 7 second-pass: glyf composites + headers
// ============================================================================

describe('Tier 7 glyf composite / header validation', () => {
	it('flags GLYF_COMPOSITE_CYCLE for a self-referencing composite', () => {
		const glyf = {
			glyphs: [
				{ components: [{ glyphIndex: 0 }] }, // glyph 0 references itself
			],
		};
		const issues = [];
		diagInternal.validateGlyfComposites(glyf, 1, issues);
		expect(issues.some((i) => i.code === 'GLYF_COMPOSITE_CYCLE')).toBe(true);
	});

	it('flags GLYF_COMPOSITE_CYCLE for a 2-glyph cycle', () => {
		const glyf = {
			glyphs: [
				{ components: [{ glyphIndex: 1 }] },
				{ components: [{ glyphIndex: 0 }] },
			],
		};
		const issues = [];
		diagInternal.validateGlyfComposites(glyf, 2, issues);
		expect(issues.some((i) => i.code === 'GLYF_COMPOSITE_CYCLE')).toBe(true);
	});

	it('flags GLYF_COMPOSITE_GLYPH_OUT_OF_RANGE', () => {
		const glyf = { glyphs: [{ components: [{ glyphIndex: 99 }] }] };
		const issues = [];
		diagInternal.validateGlyfComposites(glyf, 1, issues);
		expect(
			issues.some((i) => i.code === 'GLYF_COMPOSITE_GLYPH_OUT_OF_RANGE'),
		).toBe(true);
	});

	it('flags GLYF_COMPOSITE_DEPTH_EXCEEDED for deep chains', () => {
		// 20-glyph chain: each composite references the next
		const glyphs = [];
		for (let i = 0; i < 20; i++) {
			glyphs.push({ components: [{ glyphIndex: i + 1 }] });
		}
		glyphs.push({}); // leaf simple glyph
		const issues = [];
		diagInternal.validateGlyfComposites({ glyphs }, glyphs.length, issues);
		expect(issues.some((i) => i.code === 'GLYF_COMPOSITE_DEPTH_EXCEEDED')).toBe(
			true,
		);
	});

	it('passes a clean composite chain', () => {
		const glyf = {
			glyphs: [
				{ components: [{ glyphIndex: 1 }] },
				{}, // simple glyph
			],
		};
		const issues = [];
		diagInternal.validateGlyfComposites(glyf, 2, issues);
		expect(issues).toEqual([]);
	});

	it('flags GLYF_BBOX_INVERTED for xMin > xMax', () => {
		const issues = [];
		diagInternal.validateGlyfHeaders(
			{ glyphs: [{ xMin: 100, xMax: 50, yMin: 0, yMax: 10 }] },
			{ xMin: -100, xMax: 200, yMin: -100, yMax: 200 },
			issues,
		);
		expect(issues.some((i) => i.code === 'GLYF_BBOX_INVERTED')).toBe(true);
	});

	it('flags GLYF_BBOX_OUTSIDE_HEAD when glyph extends past head bbox', () => {
		const issues = [];
		diagInternal.validateGlyfHeaders(
			{ glyphs: [{ xMin: 0, xMax: 999, yMin: 0, yMax: 10 }] },
			{ xMin: 0, xMax: 100, yMin: 0, yMax: 100 },
			issues,
		);
		expect(issues.some((i) => i.code === 'GLYF_BBOX_OUTSIDE_HEAD')).toBe(true);
	});

	it('flags GLYF_NUM_CONTOURS_INVALID for value < -1', () => {
		const issues = [];
		diagInternal.validateGlyfHeaders(
			{ glyphs: [{ numberOfContours: -5 }] },
			null,
			issues,
		);
		expect(issues.some((i) => i.code === 'GLYF_NUM_CONTOURS_INVALID')).toBe(true);
	});
});

// ============================================================================
//  Tier 7 second-pass: cmap format-14 variation selectors
// ============================================================================

describe('Tier 7 cmap format-14 validation', () => {
	it('flags CMAP_FORMAT14_VS_OUT_OF_RANGE', () => {
		const cmap = {
			subTables: [
				{
					format: 14,
					varSelectorRecords: [{ varSelector: 0x1000 }], // not a valid VS
				},
			],
		};
		const issues = [];
		diagInternal.validateCmapFormat14(cmap, issues);
		expect(issues.some((i) => i.code === 'CMAP_FORMAT14_VS_OUT_OF_RANGE')).toBe(
			true,
		);
	});

	it('flags CMAP_FORMAT14_VS_OUT_OF_ORDER', () => {
		const cmap = {
			subTables: [
				{
					format: 14,
					varSelectorRecords: [
						{ varSelector: 0xfe05 },
						{ varSelector: 0xfe00 }, // descending
					],
				},
			],
		};
		const issues = [];
		diagInternal.validateCmapFormat14(cmap, issues);
		expect(issues.some((i) => i.code === 'CMAP_FORMAT14_VS_OUT_OF_ORDER')).toBe(
			true,
		);
	});

	it('passes valid format-14 selectors in FE00–FE0F', () => {
		const cmap = {
			subTables: [
				{
					format: 14,
					varSelectorRecords: [
						{ varSelector: 0xfe00 },
						{ varSelector: 0xfe01 },
						{ varSelector: 0xe0100 },
					],
				},
			],
		};
		const issues = [];
		diagInternal.validateCmapFormat14(cmap, issues);
		expect(issues).toEqual([]);
	});
});

// ============================================================================
//  Tier 7 third-pass: cmap format 12/13 group sort & overlap
// ============================================================================

describe('Tier 7 cmap format 12/13 group validation', () => {
	it('flags CMAP_FORMAT12_END_BEFORE_START', () => {
		const cmap = {
			subTables: [
				{
					format: 12,
					groups: [{ startCharCode: 0x100, endCharCode: 0x50, startGlyphID: 1 }],
				},
			],
		};
		const issues = [];
		diagInternal.validateCmapFormat12And13(cmap, issues);
		expect(issues.some((i) => i.code === 'CMAP_FORMAT12_END_BEFORE_START')).toBe(
			true,
		);
	});

	it('flags CMAP_FORMAT12_GROUPS_NOT_SORTED', () => {
		const cmap = {
			subTables: [
				{
					format: 12,
					groups: [
						{ startCharCode: 0x100, endCharCode: 0x1ff },
						{ startCharCode: 0x50, endCharCode: 0x60 },
					],
				},
			],
		};
		const issues = [];
		diagInternal.validateCmapFormat12And13(cmap, issues);
		expect(issues.some((i) => i.code === 'CMAP_FORMAT12_GROUPS_NOT_SORTED')).toBe(
			true,
		);
	});

	it('flags CMAP_FORMAT12_GROUPS_OVERLAP', () => {
		const cmap = {
			subTables: [
				{
					format: 12,
					groups: [
						{ startCharCode: 0x100, endCharCode: 0x200 },
						{ startCharCode: 0x150, endCharCode: 0x250 },
					],
				},
			],
		};
		const issues = [];
		diagInternal.validateCmapFormat12And13(cmap, issues);
		expect(issues.some((i) => i.code === 'CMAP_FORMAT12_GROUPS_OVERLAP')).toBe(
			true,
		);
	});

	it('passes a clean format 12 subtable', () => {
		const cmap = {
			subTables: [
				{
					format: 12,
					groups: [
						{ startCharCode: 0x100, endCharCode: 0x1ff },
						{ startCharCode: 0x200, endCharCode: 0x2ff },
					],
				},
			],
		};
		const issues = [];
		diagInternal.validateCmapFormat12And13(cmap, issues);
		expect(issues).toEqual([]);
	});
});

// ============================================================================
//  Tier 7 third-pass: TrueType instruction stream safety
// ============================================================================

describe('Tier 7 TrueType instruction validation', () => {
	it('flags TT_INSTR_TRUNCATED_PUSH for PUSHB[0] missing operand', () => {
		// 0xB0 = PUSHB[0] expects 1 operand byte
		const issues = [];
		diagInternal.validateTrueTypeInstructions([0xb0], 'fpgm', issues);
		expect(issues.some((i) => i.code === 'TT_INSTR_TRUNCATED_PUSH')).toBe(true);
	});

	it('flags TT_INSTR_TRUNCATED_PUSH for NPUSHB declaring more than available', () => {
		// 0x40 NPUSHB, count=10, only 2 bytes follow
		const issues = [];
		diagInternal.validateTrueTypeInstructions([0x40, 10, 1, 2], 'fpgm', issues);
		expect(issues.some((i) => i.code === 'TT_INSTR_TRUNCATED_PUSH')).toBe(true);
	});

	it('flags TT_INSTR_TRUNCATED_PUSH for NPUSHW with no count byte', () => {
		const issues = [];
		diagInternal.validateTrueTypeInstructions([0x41], 'prep', issues);
		expect(issues.some((i) => i.code === 'TT_INSTR_TRUNCATED_PUSH')).toBe(true);
	});

	it('flags TT_INSTR_UNBALANCED_IF for IF without EIF', () => {
		// 0xB0 push 1 operand, 0x58 IF with no EIF
		const issues = [];
		diagInternal.validateTrueTypeInstructions([0xb0, 0x01, 0x58], 'fpgm', issues);
		expect(issues.some((i) => i.code === 'TT_INSTR_UNBALANCED_IF')).toBe(true);
	});

	it('flags TT_INSTR_UNBALANCED_EIF for stray EIF', () => {
		const issues = [];
		diagInternal.validateTrueTypeInstructions([0x59], 'prep', issues);
		expect(issues.some((i) => i.code === 'TT_INSTR_UNBALANCED_EIF')).toBe(true);
	});

	it('flags TT_INSTR_NESTED_FDEF', () => {
		// 0x2C FDEF, 0x2C FDEF, 0x2D ENDF
		const issues = [];
		diagInternal.validateTrueTypeInstructions(
			[0x2c, 0x2c, 0x2d, 0x2d],
			'fpgm',
			issues,
		);
		expect(issues.some((i) => i.code === 'TT_INSTR_NESTED_FDEF')).toBe(true);
	});

	it('flags TT_INSTR_STRAY_ENDF', () => {
		const issues = [];
		diagInternal.validateTrueTypeInstructions([0x2d], 'fpgm', issues);
		expect(issues.some((i) => i.code === 'TT_INSTR_STRAY_ENDF')).toBe(true);
	});

	it('flags TT_INSTR_UNCLOSED_FDEF', () => {
		// 0x2C FDEF without matching ENDF
		const issues = [];
		diagInternal.validateTrueTypeInstructions([0x2c, 0xb0, 0x01], 'fpgm', issues);
		expect(issues.some((i) => i.code === 'TT_INSTR_UNCLOSED_FDEF')).toBe(true);
	});

	it('passes balanced IF/EIF + FDEF/ENDF + PUSHs', () => {
		// FDEF, PUSHB[0] 1, IF, PUSHB[0] 2, EIF, ENDF
		const issues = [];
		diagInternal.validateTrueTypeInstructions(
			[0x2c, 0xb0, 0x01, 0x58, 0xb0, 0x02, 0x59, 0x2d],
			'fpgm',
			issues,
		);
		expect(issues).toEqual([]);
	});

	it('handles PUSHW correctly (2 bytes per word)', () => {
		// 0xB8 = PUSHW[0] expects 2 bytes
		const issues = [];
		diagInternal.validateTrueTypeInstructions([0xb8, 0x01], 'fpgm', issues);
		expect(issues.some((i) => i.code === 'TT_INSTR_TRUNCATED_PUSH')).toBe(true);

		const ok = [];
		diagInternal.validateTrueTypeInstructions([0xb8, 0x01, 0x02], 'fpgm', ok);
		expect(ok).toEqual([]);
	});
});
