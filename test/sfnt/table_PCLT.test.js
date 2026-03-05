/**
 * Tests for PCLT table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parsePCLT, writePCLT } from '../../src/sfnt/table_PCLT.js';

describe('PCLT table', () => {
	it('should round-trip a synthetic PCLT table', () => {
		const original = {
			version: 0x00010000,
			fontNumber: 0x01234567,
			pitch: 500,
			xHeight: 450,
			style: 2,
			typeFamily: 4,
			capHeight: 700,
			symbolSet: 277,
			typeface: 'TESTTYPEFACE',
			characterComplement: 'ABC123',
			fileName: 'TST001',
			strokeWeight: -3,
			widthType: 2,
			serifStyle: 64,
			reserved: 0,
		};

		const parsed = parsePCLT(writePCLT(original));

		expect(parsed.version).toBe(0x00010000);
		expect(parsed.fontNumber).toBe(0x01234567);
		expect(parsed.pitch).toBe(500);
		expect(parsed.typeface).toBe('TESTTYPEFACE');
		expect(parsed.fileName).toBe('TST001');
		expect(parsed.strokeWeight).toBe(-3);
		expect(parsed.widthType).toBe(2);
		expect(parsed.serifStyle).toBe(64);
	});
});
