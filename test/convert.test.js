/**
 * Outline-conversion tests (src/convert.js).
 *
 * Verifies that exporting with format 'ttf' / 'otf' rewrites the glyph
 * outlines between TrueType (glyf, quadratic) and PostScript (CFF, cubic),
 * switching the sfntVersion and swapping the outline tables, while keeping
 * the font structurally valid and visually close to the original.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convertOutlines } from '../src/convert.js';
import { exportFont } from '../src/export.js';
import { FontFlux } from '../src/font_flux.js';
import { importFont } from '../src/import.js';
import { diagnoseFont } from '../src/validate/diagnoseFont.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');
const SFNT_TTF = 0x00010000;
const SFNT_OTTO = 0x4f54544f;

async function loadBuffer(name) {
	return (await readFile(resolve(SAMPLES_DIR, name))).buffer;
}

/** Bounding box over every numeric coordinate (handles both contour formats). */
function contoursBBox(contours) {
	let xMin = Infinity;
	let yMin = Infinity;
	let xMax = -Infinity;
	let yMax = -Infinity;
	let has = false;
	for (const contour of contours || []) {
		for (const pt of contour) {
			const coords = [
				[pt.x, pt.y],
				[pt.x1, pt.y1],
				[pt.x2, pt.y2],
			];
			for (const [x, y] of coords) {
				if (typeof x === 'number' && typeof y === 'number') {
					has = true;
					if (x < xMin) xMin = x;
					if (y < yMin) yMin = y;
					if (x > xMax) xMax = x;
					if (y > yMax) yMax = y;
				}
			}
		}
	}
	return has ? { xMin, yMin, xMax, yMax } : null;
}

/** Find the first glyph (by name) that has non-empty contours. */
function firstDrawnGlyph(simplified) {
	return simplified.glyphs.find(
		(g) => Array.isArray(g.contours) && g.contours.length > 0,
	);
}

describe('convertOutlines — CFF (OTF) → TrueType (TTF)', () => {
	it('produces a glyf-based, glyf-versioned, valid font', async () => {
		const buffer = await loadBuffer('oblegg.otf');
		const original = importFont(buffer);

		// Precondition: static CFF source.
		expect(original.tables['CFF ']).toBeDefined();
		expect(original.axes?.length ?? 0).toBe(0);
		expect(original._header.sfVersion).toBe(SFNT_OTTO);

		const out = exportFont(original, { format: 'ttf' });
		const report = diagnoseFont(out);
		expect(report.summary.errorCount).toBe(0);
		expect(report.valid).toBe(true);

		const reimported = importFont(out);
		expect(reimported._header.sfVersion).toBe(SFNT_TTF);
		expect(reimported.tables.glyf).toBeDefined();
		expect(reimported.tables['CFF ']).toBeUndefined();
		expect(reimported.tables.CFF2).toBeUndefined();
		expect(reimported.glyphs.length).toBe(original.glyphs.length);
	});

	it('keeps glyph shapes within tolerance', async () => {
		const buffer = await loadBuffer('oblegg.otf');
		const original = importFont(buffer);
		const out = exportFont(original, { format: 'ttf' });
		const reimported = importFont(out);

		const srcGlyph = firstDrawnGlyph(original);
		const dstGlyph = reimported.glyphs.find((g) => g.name === srcGlyph.name);
		const a = contoursBBox(srcGlyph.contours);
		const b = contoursBBox(dstGlyph.contours);

		const upm = original.font.unitsPerEm || 1000;
		const tol = Math.max(8, upm * 0.05);
		expect(Math.abs(a.xMin - b.xMin)).toBeLessThanOrEqual(tol);
		expect(Math.abs(a.yMin - b.yMin)).toBeLessThanOrEqual(tol);
		expect(Math.abs(a.xMax - b.xMax)).toBeLessThanOrEqual(tol);
		expect(Math.abs(a.yMax - b.yMax)).toBeLessThanOrEqual(tol);

		// Converted TrueType points must carry the onCurve flag.
		expect(typeof dstGlyph.contours[0][0].onCurve).toBe('boolean');
		expect(dstGlyph.contours[0][0].type).toBeUndefined();
	});

	it('sets hmtx lsb to glyf xMin so glyphs do not shift/overlap', async () => {
		// oblegg is an oblique CFF face whose hmtx lsb values are 0 even though
		// many glyph outlines overhang to the left (negative xMin). CFF ignores
		// that mismatch, but TrueType rasterizers shift the outline by
		// (lsb − xMin), pushing such glyphs past their advance and overlapping
		// the next glyph (e.g. "u" overlapping "j" in "jump"). After conversion
		// every glyph's lsb must equal its outline xMin.
		const buffer = await loadBuffer('oblegg.otf');
		const original = importFont(buffer);
		const out = exportFont(original, { format: 'ttf' });
		const reimported = importFont(out);

		// Sanity: the source really does have the lsb≠xMin mismatch we fix.
		const srcJ = original.glyphs.find((g) => g.name === 'j');
		const srcBox = contoursBBox(srcJ.contours);
		expect(srcBox.xMin).toBeLessThan(0);
		expect(srcJ.leftSideBearing).not.toBe(Math.round(srcBox.xMin));

		for (const g of reimported.glyphs) {
			const box = contoursBBox(g.contours);
			if (!box) continue; // contour-less glyphs (space) — lsb is 0
			expect(g.leftSideBearing).toBe(box.xMin);
		}
	});
});

describe('convertOutlines — TrueType (TTF) → CFF (OTF)', () => {
	it('produces a CFF-based, OTTO-versioned, valid font', async () => {
		const buffer = await loadBuffer('oblegg.ttf');
		const original = importFont(buffer);

		expect(original.tables.glyf).toBeDefined();
		expect(original.axes?.length ?? 0).toBe(0);
		expect(original._header.sfVersion).toBe(SFNT_TTF);

		const out = exportFont(original, { format: 'otf' });
		const report = diagnoseFont(out);
		expect(report.summary.errorCount).toBe(0);
		expect(report.valid).toBe(true);

		const reimported = importFont(out);
		expect(reimported._header.sfVersion).toBe(SFNT_OTTO);
		expect(reimported.tables['CFF ']).toBeDefined();
		expect(reimported.tables.glyf).toBeUndefined();
		expect(reimported.tables.loca).toBeUndefined();
		expect(reimported.glyphs.length).toBe(original.glyphs.length);
	});

	it('drops TrueType-only hinting tables', async () => {
		const buffer = await loadBuffer('oblegg.ttf');
		const original = importFont(buffer);
		const out = exportFont(original, { format: 'otf' });
		const reimported = importFont(out);

		for (const tag of ['cvt ', 'fpgm', 'prep', 'gasp']) {
			expect(reimported.tables[tag]).toBeUndefined();
		}
	});

	it('keeps glyph shapes within tolerance', async () => {
		const buffer = await loadBuffer('oblegg.ttf');
		const original = importFont(buffer);
		const out = exportFont(original, { format: 'otf' });
		const reimported = importFont(out);

		const srcGlyph = firstDrawnGlyph(original);
		const dstGlyph = reimported.glyphs.find((g) => g.name === srcGlyph.name);
		const a = contoursBBox(srcGlyph.contours);
		const b = contoursBBox(dstGlyph.contours);

		const upm = original.font.unitsPerEm || 1000;
		const tol = Math.max(8, upm * 0.05);
		expect(Math.abs(a.xMin - b.xMin)).toBeLessThanOrEqual(tol);
		expect(Math.abs(a.yMin - b.yMin)).toBeLessThanOrEqual(tol);
		expect(Math.abs(a.xMax - b.xMax)).toBeLessThanOrEqual(tol);
		expect(Math.abs(a.yMax - b.yMax)).toBeLessThanOrEqual(tol);

		// Converted CFF contours must be command objects with a `type`.
		expect(typeof dstGlyph.contours[0][0].type).toBe('string');
	});
});

describe('convertOutlines — semantics', () => {
	it('is a no-op when the font already uses the target technology', async () => {
		const original = importFont(await loadBuffer('oblegg.ttf'));
		expect(convertOutlines(original, 'truetype')).toBe(original);
	});

	it('rejects an unknown target', async () => {
		const original = importFont(await loadBuffer('oblegg.ttf'));
		expect(() => convertOutlines(original, 'bitmap')).toThrow();
	});

	it('exposes a chainable FontFlux.convertOutlines() method', async () => {
		const font = FontFlux.open(await loadBuffer('oblegg.otf'));
		const result = font.convertOutlines('truetype');
		expect(result).toBe(font);
		expect(font.data._header.sfVersion).toBe(SFNT_TTF);
		const out = font.export({ format: 'sfnt' });
		expect(diagnoseFont(out).summary.errorCount).toBe(0);
	});

	it('accepts ttf/otf as export formats', async () => {
		const original = importFont(await loadBuffer('oblegg.ttf'));
		expect(() => exportFont(original, { format: 'ttf' })).not.toThrow();
		expect(() => exportFont(original, { format: 'otf' })).not.toThrow();
		expect(() => exportFont(original, { format: 'bogus' })).toThrow();
	});
});
