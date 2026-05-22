/**
 * Regression: CFF charstrings must carry a leading width operand so that
 * renderers which read glyph advances from the CFF (Chrome/Blink for
 * OpenType-CFF) don't fall back to defaultWidthX = 0 and stack every glyph
 * at x = 0. The hmtx table alone is not sufficient.
 *
 * Reproduced from a hand-authored Oblegg-Regular JSON whose synthesized CFF
 * charstrings (compiled from `contours`) lacked the width prefix.
 */
import { describe, expect, it } from 'vitest';
import { exportFont } from '../src/export.js';
import { importFont } from '../src/import.js';
import { interpretCharString } from '../src/otf/charstring_interpreter.js';

function buildHandAuthored() {
	// Minimal 3-glyph font (notdef + space + A) at upm 2048 with explicit
	// advance widths and CFF contours but no preassembled charString bytes.
	return {
		font: {
			familyName: 'WidthTest',
			styleName: 'Regular',
			postScriptName: 'WidthTest-Regular',
			fullName: 'WidthTest Regular',
			unitsPerEm: 2048,
			ascender: 1490,
			descender: -430,
			lineGap: 250,
			weightClass: 400,
			widthClass: 5,
		},
		glyphs: [
			{
				name: '.notdef',
				unicode: null,
				advanceWidth: 500,
				leftSideBearing: 0,
				charString: [],
			},
			{
				name: 'space',
				unicode: 32,
				advanceWidth: 600,
				leftSideBearing: 0,
				charString: [],
			},
			{
				name: 'A',
				unicode: 65,
				advanceWidth: 1221,
				leftSideBearing: 0,
				charString: [],
				contours: [
					[
						{ type: 'M', x: 100, y: 0 },
						{ type: 'L', x: 1100, y: 0 },
						{ type: 'L', x: 600, y: 1400 },
						{ type: 'L', x: 100, y: 0 },
					],
				],
			},
		],
	};
}

function widthsFromExportedCFF(buffer) {
	const ab = buffer instanceof ArrayBuffer ? buffer : buffer.buffer;
	const data = importFont(ab);
	const cff = data.tables['CFF '].fonts[0];
	const defaultW = cff.privateDict?.defaultWidthX ?? 0;
	const nominalW = cff.privateDict?.nominalWidthX ?? 0;
	return cff.charStrings.map((cs) => {
		const r = interpretCharString(
			cs,
			data.tables['CFF '].globalSubrs || [],
			cff.localSubrs || [],
		);
		return r.width == null ? defaultW : r.width + nominalW;
	});
}

describe('CFF charstring width prefix', () => {
	it('synthesized CFF encodes per-glyph advanceWidth as a leading width operand', () => {
		const fontData = buildHandAuthored();
		const exported = exportFont(fontData);
		const widths = widthsFromExportedCFF(exported);
		expect(widths).toEqual([500, 600, 1221]);
	});

	it('hmtx and CFF widths agree after round-trip', () => {
		const fontData = buildHandAuthored();
		const exported = exportFont(fontData);
		const ab = exported instanceof ArrayBuffer ? exported : exported.buffer;
		const data = importFont(ab);
		const cffWidths = widthsFromExportedCFF(exported);
		const hmtxWidths = data.tables.hmtx.hMetrics.map((m) => m.advanceWidth);
		expect(cffWidths).toEqual(hmtxWidths);
	});
});
