/**
 * Tests for the avar (Axis Variations) table parser / writer.
 */

import { describe, expect, it } from 'vitest';
import { parseAvar, writeAvar } from '../../src/sfnt/table_avar.js';

describe('avar table', () => {
	it('should round-trip a synthetic avar table with two segment maps', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			reserved: 0,
			segmentMaps: [
				{
					axisValueMaps: [
						{ fromCoordinate: -1, toCoordinate: -1 },
						{ fromCoordinate: 0, toCoordinate: 0 },
						{ fromCoordinate: 1, toCoordinate: 1 },
					],
				},
				{
					axisValueMaps: [
						{ fromCoordinate: -1, toCoordinate: -1 },
						{ fromCoordinate: 0.5, toCoordinate: 0.625 },
						{ fromCoordinate: 1, toCoordinate: 1 },
					],
				},
			],
		};

		const bytes = writeAvar(original);
		const parsed = parseAvar(bytes);

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.segmentMaps.length).toBe(2);
		expect(parsed.segmentMaps[0].positionMapCount).toBe(3);
		expect(parsed.segmentMaps[1].axisValueMaps[1].fromCoordinate).toBe(0.5);
		expect(parsed.segmentMaps[1].axisValueMaps[1].toCoordinate).toBe(0.625);
	});

	it('should preserve empty segment maps', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			reserved: 0,
			segmentMaps: [{ axisValueMaps: [] }],
		};

		const parsed = parseAvar(writeAvar(original));

		expect(parsed.segmentMaps.length).toBe(1);
		expect(parsed.segmentMaps[0].positionMapCount).toBe(0);
		expect(parsed.segmentMaps[0].axisValueMaps).toEqual([]);
	});
});
