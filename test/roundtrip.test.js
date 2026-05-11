/**
 * Targeted round-trip tests for shapes that the broad sweep does not cover.
 *
 * The exhaustive structural-equality sweep across every sample font lives in
 * `roundtrip-all-samples-double.test.js`. This file keeps only the extra
 * assertions that go beyond `thirdImport === secondImport`:
 *
 *   - TTC collection shape (`collection.tag`, `fonts[]`, GPOS features).
 *   - Apple bitmap tables (bloc/bdat) parse to structured data, not `_raw`.
 *
 * Per-format SFNT (OTF, TTF) stability is verified by the all-samples test.
 * The NotoSerifCJK OTC remains intentionally untested here — it is excluded
 * from the all-samples sweep via SKIP_FONTS (25 MB, ~65K glyphs × 5 fonts
 * exceeds Vitest's default heap budget).
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../src/export.js';
import { importFont } from '../src/import.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

describe('TTC collection shape', () => {
	it('should import cambria-test.ttc as a multi-face collection', async () => {
		const filePath = resolve(SAMPLES_DIR, 'cambria-test.ttc');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);

		expect(firstImport.collection.tag).toBe('ttcf');
		expect(Array.isArray(firstImport.fonts)).toBe(true);
		expect(firstImport.fonts.length).toBeGreaterThan(1);
	});

	it('should preserve GPOS features across a TTC round-trip (cambria)', async () => {
		const filePath = resolve(SAMPLES_DIR, 'cambria-test.ttc');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);
		const exported = exportFont(firstImport);
		const secondImport = importFont(exported);

		expect(secondImport.collection.tag).toBe('ttcf');
		expect(secondImport.fonts.length).toBe(firstImport.fonts.length);
		expect(
			secondImport.fonts.every((font) => font.features && font.features.GPOS),
		).toBe(true);
	}, 60000);
});

describe('Apple bitmap tables (bloc/bdat)', () => {
	it('should parse cour-test.ttf bloc/bdat as structured data, not raw bytes', async () => {
		const filePath = resolve(SAMPLES_DIR, 'cour-test.ttf');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);

		expect(firstImport.tables.bloc).toBeDefined();
		expect(firstImport.tables.bloc._raw).toBeUndefined();
		expect(firstImport.tables.bdat).toBeDefined();
		expect(firstImport.tables.bdat._raw).toBeUndefined();
	});
});
