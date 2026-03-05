/**
 * Tests for VORG table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseVORG, writeVORG } from '../../src/otf/table_VORG.js';

describe('VORG table', () => {
	it('should round-trip a synthetic VORG table', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			defaultVertOriginY: 880,
			vertOriginYMetrics: [
				{ glyphIndex: 1, vertOriginY: 900 },
				{ glyphIndex: 7, vertOriginY: 870 },
			],
		};

		const parsed = parseVORG(writeVORG(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.defaultVertOriginY).toBe(880);
		expect(parsed.numVertOriginYMetrics).toBe(2);
		expect(parsed.vertOriginYMetrics).toEqual([
			{ glyphIndex: 1, vertOriginY: 900 },
			{ glyphIndex: 7, vertOriginY: 870 },
		]);
	});

	it('should respect explicit numVertOriginYMetrics', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			defaultVertOriginY: 700,
			numVertOriginYMetrics: 1,
			vertOriginYMetrics: [
				{ glyphIndex: 4, vertOriginY: 710 },
				{ glyphIndex: 9, vertOriginY: 690 },
			],
		};

		const parsed = parseVORG(writeVORG(original));
		expect(parsed.numVertOriginYMetrics).toBe(1);
		expect(parsed.vertOriginYMetrics).toEqual([
			{ glyphIndex: 4, vertOriginY: 710 },
		]);
	});
});
