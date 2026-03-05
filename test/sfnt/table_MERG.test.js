/**
 * Tests for MERG table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseMERG, writeMERG } from '../../src/sfnt/table_MERG.js';

describe('MERG table', () => {
	it('should round-trip MERG with version and payload', () => {
		const original = {
			version: 1,
			data: [0xaa, 0xbb, 0xcc, 0xdd],
		};

		const parsed = parseMERG(writeMERG(original));

		expect(parsed.version).toBe(1);
		expect(parsed.data).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);
	});

	it('should parse empty table defensively', () => {
		const parsed = parseMERG([]);
		expect(parsed).toEqual({ version: 0, data: [] });
	});
});
