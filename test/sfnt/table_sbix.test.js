/**
 * Tests for sbix table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseSbix, writeSbix } from '../../src/sfnt/table_sbix.js';

describe('sbix table', () => {
	it('should round-trip synthetic sbix with two strikes', () => {
		const original = {
			version: 1,
			flags: 1,
			strikes: [
				{ _raw: [0x00, 0x0c, 0x00, 0x48, 0xaa, 0xbb] },
				{ _raw: [0x00, 0x10, 0x00, 0x48, 0xcc] },
			],
		};
		const parsed = parseSbix(writeSbix(original));
		expect(parsed.version).toBe(1);
		expect(parsed.flags).toBe(1);
		expect(parsed.strikes.length).toBe(2);
		expect(parsed.strikes[0]._raw).toEqual([0x00, 0x0c, 0x00, 0x48, 0xaa, 0xbb]);
		expect(parsed.strikes[1]._raw).toEqual([0x00, 0x10, 0x00, 0x48, 0xcc]);
	});
});
