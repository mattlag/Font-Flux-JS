/**
 * Tests for CBLC table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseCBLC, writeCBLC } from '../../src/sfnt/table_CBLC.js';

describe('CBLC table', () => {
	it('should round-trip synthetic CBLC with one size record', () => {
		const original = {
			majorVersion: 2,
			minorVersion: 0,
			sizes: [
				{
					indexSubTableArrayOffset: 100,
					indexTablesSize: 40,
					numberOfIndexSubTables: 1,
					colorRef: 0,
					hori: { ascender: 1, descender: -1, widthMax: 8 },
					vert: { ascender: 2, descender: -2, widthMax: 9 },
					startGlyphIndex: 3,
					endGlyphIndex: 9,
					ppemX: 12,
					ppemY: 14,
					bitDepth: 8,
					flags: 1,
				},
			],
			data: [0xaa, 0xbb, 0xcc],
		};

		const parsed = parseCBLC(writeCBLC(original));
		expect(parsed.majorVersion).toBe(2);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.sizes.length).toBe(1);
		expect(parsed.sizes[0].startGlyphIndex).toBe(3);
		expect(parsed.sizes[0].endGlyphIndex).toBe(9);
		expect(parsed.data).toEqual([0xaa, 0xbb, 0xcc]);
	});
});
