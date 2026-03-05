/**
 * Tests for EBSC table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseEBSC, writeEBSC } from '../../src/sfnt/table_EBSC.js';

describe('EBSC table', () => {
	it('should round-trip synthetic EBSC', () => {
		const original = {
			version: 0x00020000,
			scales: [
				{
					hori: { ascender: 10, descender: -2, widthMax: 8 },
					vert: { ascender: 9, descender: -3, widthMax: 7 },
					substitutePpemX: 12,
					substitutePpemY: 13,
					originalPpemX: 16,
					originalPpemY: 17,
				},
			],
		};
		const parsed = parseEBSC(writeEBSC(original));
		expect(parsed.version).toBe(0x00020000);
		expect(parsed.scales.length).toBe(1);
		expect(parsed.scales[0].substitutePpemX).toBe(12);
		expect(parsed.scales[0].originalPpemY).toBe(17);
	});
});
