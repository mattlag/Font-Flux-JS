/**
 * Tests for VDMX table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseVDMX, writeVDMX } from '../../src/sfnt/table_VDMX.js';

describe('VDMX table', () => {
	it('should round-trip a synthetic VDMX table with shared group', () => {
		const original = {
			version: 0,
			numRecs: 2,
			ratios: [
				{
					bCharSet: 0,
					xRatio: 1,
					yStartRatio: 1,
					yEndRatio: 255,
					groupIndex: 0,
				},
				{
					bCharSet: 1,
					xRatio: 1,
					yStartRatio: 1,
					yEndRatio: 255,
					groupIndex: 0,
				},
			],
			groups: [
				{
					recs: 2,
					startsz: 8,
					endsz: 14,
					entries: [
						{ yPelHeight: 8, yMax: 9, yMin: -2 },
						{ yPelHeight: 14, yMax: 16, yMin: -3 },
					],
				},
			],
		};

		const parsed = parseVDMX(writeVDMX(original));

		expect(parsed.version).toBe(0);
		expect(parsed.numRatios).toBe(2);
		expect(parsed.ratios.length).toBe(2);
		expect(parsed.groups.length).toBe(1);
		expect(parsed.groups[0].recs).toBe(2);
		expect(parsed.groups[0].entries[0]).toEqual({
			yPelHeight: 8,
			yMax: 9,
			yMin: -2,
		});
		expect(parsed.groups[0].entries[1]).toEqual({
			yPelHeight: 14,
			yMax: 16,
			yMin: -3,
		});
		expect(parsed.ratios[0].groupIndex).toBe(0);
		expect(parsed.ratios[1].groupIndex).toBe(0);
	});

	it('should support multiple groups', () => {
		const original = {
			version: 1,
			ratios: [
				{
					bCharSet: 0,
					xRatio: 1,
					yStartRatio: 1,
					yEndRatio: 255,
					groupIndex: 0,
				},
				{
					bCharSet: 0,
					xRatio: 2,
					yStartRatio: 1,
					yEndRatio: 255,
					groupIndex: 1,
				},
			],
			groups: [
				{
					recs: 1,
					startsz: 9,
					endsz: 9,
					entries: [{ yPelHeight: 9, yMax: 11, yMin: -2 }],
				},
				{
					recs: 1,
					startsz: 12,
					endsz: 12,
					entries: [{ yPelHeight: 12, yMax: 14, yMin: -3 }],
				},
			],
		};

		const parsed = parseVDMX(writeVDMX(original));
		expect(parsed.groups.length).toBe(2);
		expect(parsed.ratios[0].groupIndex).toBe(0);
		expect(parsed.ratios[1].groupIndex).toBe(1);
	});
});
