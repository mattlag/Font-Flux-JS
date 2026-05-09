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
		expect(report.issues.some((i) => i.code === 'FORMAT_COLLECTION')).toBe(
			true,
		);
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
		expect(report2.warnings.some((w) => w.code === 'NO_FAMILY_NAME')).toBe(
			false,
		);
		expect(report2.warnings.some((w) => w.code === 'NO_STYLE_NAME')).toBe(
			false,
		);

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
		expect(report.errors.some((e) => e.code === 'HEAD_BBOX_INVERTED')).toBe(
			true,
		);
	});

	it('flags inverted bbox (yMin > yMax) as HEAD_BBOX_INVERTED', async () => {
		const buffer = cloneBuffer(await loadSample('oblegg.ttf'));
		const head = findTableEntry(buffer, 'head');
		// yMin at offset 38, yMax at offset 42
		const view = new DataView(buffer);
		view.setInt16(head.offset + 38, 500);
		view.setInt16(head.offset + 42, -500);
		const report = diagnoseFont(buffer);
		expect(report.errors.some((e) => e.code === 'HEAD_BBOX_INVERTED')).toBe(
			true,
		);
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
		expect(
			report.errors.some((e) => e.code === 'POST_VERSION_UNSUPPORTED'),
		).toBe(true);
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
		expect(report.errors.some((e) => e.code === 'TTC_TOO_MANY_FONTS')).toBe(
			true,
		);
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
		expect(
			report.errors.some((e) => e.code === 'CMAP_GLYPH_OUT_OF_RANGE'),
		).toBe(true);
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
					groups: [
						{ startCharCode: 0x100, endCharCode: 0x80, startGlyphID: 1 },
					],
				},
			],
		};
		diagInternal.validateCmapDeep(cmap, { numGlyphs: 1000 }, issues);
		expect(
			issues.some((i) => i.code === 'CMAP_FORMAT12_END_BEFORE_START'),
		).toBe(true);
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
					groups: [
						{ startCharCode: 0x20, endCharCode: 0x40, startGlyphID: 90 },
					],
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
		expect(issues.some((i) => i.code === 'OS2_TYPO_LINEGAP_NEGATIVE')).toBe(
			true,
		);
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
		expect(
			issues.some((i) => i.code === 'HEAD_MACSTYLE_RESERVED_BITS_SET'),
		).toBe(true);
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
		expect(
			report.errors.some((e) => e.code === 'TABLE_LENGTH_EXCEEDS_1GB'),
		).toBe(true);
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
		expect(report.errors.some((e) => e.code === 'TABLES_OVERLAPPING')).toBe(
			true,
		);
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
		const entries = [
			{ tag: 'name', offset: 12, length: rawNameBuf.byteLength },
		];
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
		expect(issues.some((i) => i.code === 'NAME_RECORD_OUT_OF_BOUNDS')).toBe(
			true,
		);
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
