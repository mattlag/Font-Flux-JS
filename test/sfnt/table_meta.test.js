/**
 * Tests for meta table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseMeta, writeMeta } from '../../src/sfnt/table_meta.js';

describe('meta table', () => {
	it('should round-trip meta with multiple data maps', () => {
		const original = {
			version: 1,
			flags: 0,
			reserved: 0,
			dataMaps: [
				{ tag: 'dlng', data: [0x65, 0x6e] },
				{ tag: 'slng', data: [0x66, 0x72, 0x2d, 0x43, 0x41] },
			],
		};

		const parsed = parseMeta(writeMeta(original));

		expect(parsed.version).toBe(1);
		expect(parsed.flags).toBe(0);
		expect(parsed.dataMaps.length).toBe(2);
		expect(parsed.dataMaps[0].tag).toBe('dlng');
		expect(parsed.dataMaps[0].data).toEqual([0x65, 0x6e]);
		expect(parsed.dataMaps[1].tag).toBe('slng');
		expect(parsed.dataMaps[1].data).toEqual([0x66, 0x72, 0x2d, 0x43, 0x41]);
	});

	it('should handle empty data maps', () => {
		const original = {
			version: 1,
			flags: 0,
			reserved: 0,
			dataMaps: [],
		};

		const parsed = parseMeta(writeMeta(original));
		expect(parsed.dataMaps).toEqual([]);
	});
});
