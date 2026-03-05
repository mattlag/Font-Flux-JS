/**
 * Tests for CBDT table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseCBDT, writeCBDT } from '../../src/sfnt/table_CBDT.js';

describe('CBDT table', () => {
	it('should round-trip synthetic CBDT', () => {
		const original = {
			version: 0x00030000,
			data: [1, 2, 3, 4, 5],
		};
		const parsed = parseCBDT(writeCBDT(original));
		expect(parsed.version).toBe(0x00030000);
		expect(parsed.data).toEqual([1, 2, 3, 4, 5]);
	});
});
