/**
 * Tests for EBLC table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseEBLC, writeEBLC } from '../../src/sfnt/table_EBLC.js';

describe('EBLC table', () => {
	it('should round-trip synthetic EBLC', () => {
		const original = {
			majorVersion: 2,
			minorVersion: 0,
			sizes: [
				{
					indexSubTableArrayOffset: 10,
					indexTablesSize: 20,
					numberOfIndexSubTables: 1,
					colorRef: 0,
					hori: {},
					vert: {},
					startGlyphIndex: 0,
					endGlyphIndex: 1,
					ppemX: 12,
					ppemY: 12,
					bitDepth: 1,
					flags: 0,
				},
			],
			data: [0xff],
		};
		const parsed = parseEBLC(writeEBLC(original));
		expect(parsed.majorVersion).toBe(2);
		expect(parsed.sizes.length).toBe(1);
		expect(parsed.data).toEqual([0xff]);
	});
});
