/**
 * Composite / glyf authoring robustness tests.
 *
 * Regression coverage for hand-authored TrueType fonts that mix outline
 * formats and build composite ("compound") glyphs:
 *
 *   1. A glyph supplied in command-format (cubic M/L/C) contours must not flip
 *      the whole font to CFF or corrupt composite linking.
 *   2. A degenerate leading `M0,0` subpath must be dropped, not emitted as an
 *      empty contour that corrupts the build.
 *   3. Composite components may reference their base glyph by `glyphName`, and
 *      may use the documented high-level `dx`/`dy`/`scale` authoring shape.
 */

import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { normalizeComponent } from '../src/glyph.js';
import { svgPathToContours } from '../src/svg_path.js';

/** Build a small TrueType font with a base glyph and a composite that uses it. */
function buildFontWithComposite({ notdefContours } = {}) {
	const font = FontFlux.create({ family: 'Composite Test' });

	// Optionally overwrite .notdef with command-format (cubic) contours.
	// Routed through createGlyph so a charString is compiled — exactly the
	// trigger that used to flip the whole font to CFF and drop composites.
	if (notdefContours) {
		font.addGlyph({
			name: '.notdef',
			advanceWidth: 500,
			contours: notdefContours,
		});
	}

	// Base glyph "a" — a simple square via SVG path (TrueType points).
	font.addGlyph({
		name: 'a',
		unicode: 0x61,
		advanceWidth: 600,
		path: 'M100 0 L100 500 L500 500 L500 0 Z',
		format: 'truetype',
	});

	// Composite "aacute" that references "a" by name with an offset.
	font.addGlyph({
		name: 'aacute',
		unicode: 0xe1,
		advanceWidth: 600,
		components: [{ glyphName: 'a', dx: 0, dy: 0 }],
	});

	return font;
}

describe('command-format contours + composites (Finding #1)', () => {
	const cubicNotdef = [
		[
			{ type: 'M', x: 50, y: 0 },
			{ type: 'L', x: 50, y: 700 },
			{ type: 'L', x: 450, y: 700 },
			{ type: 'C', x1: 450, y1: 350, x2: 450, y2: 0, x: 250, y: 0 },
		],
	];

	it('does not drop composites when .notdef uses command-format contours', () => {
		const font = buildFontWithComposite({ notdefContours: cubicNotdef });
		// Sanity: the cubic .notdef compiled a charString — the exact trigger
		// that used to flip the whole font to CFF.
		expect(font.getGlyph('.notdef').charString).toBeDefined();

		const buffer = font.export({ format: 'ttf' });

		const reopened = FontFlux.open(buffer);
		// The font must export as TrueType (glyf), not CFF.
		expect(reopened.glyphs.some((g) => g.charString)).toBe(false);

		const composite = reopened.getGlyph('aacute');
		expect(composite).toBeDefined();
		expect(composite.components?.length).toBeGreaterThan(0);

		// The composite must decompose to real geometry (the base square),
		// i.e. it does not reopen empty.
		const contours = reopened.getGlyphContours('aacute');
		expect(contours.length).toBeGreaterThan(0);
		expect(contours[0].length).toBeGreaterThan(0);
	});

	it('normalises command-format contours on a simple glyph to TT points', () => {
		const font = buildFontWithComposite({ notdefContours: cubicNotdef });
		const buffer = font.export({ format: 'ttf' });
		const reopened = FontFlux.open(buffer);

		const notdef = reopened.getGlyph('.notdef');
		expect(notdef.components).toBeUndefined();
		expect(notdef.contours?.length).toBeGreaterThan(0);
		// Re-parsed TrueType points carry on/off-curve flags, not `type`.
		const firstPoint = notdef.contours[0][0];
		expect(firstPoint).toHaveProperty('onCurve');
		expect(firstPoint.type).toBeUndefined();
	});

	it('still exports as CFF when no TrueType signals are present', () => {
		const font = FontFlux.create({ family: 'Pure CFF' });
		font.addGlyph({
			name: 'a',
			unicode: 0x61,
			advanceWidth: 600,
			path: 'M100 0 L100 500 L500 500 L500 0 Z',
			format: 'cff',
		});
		const buffer = font.export({ format: 'otf' });
		const reopened = FontFlux.open(buffer);
		expect(reopened.glyphs.some((g) => g.charString)).toBe(true);
	});
});

describe('degenerate subpaths (Finding #2)', () => {
	it('drops a lone leading M0,0 instead of emitting an empty contour', () => {
		const contours = svgPathToContours(
			'M0,0M100,100L300,100L300,300Z',
			'truetype',
		);
		expect(contours.length).toBe(1);
		expect(contours[0].length).toBeGreaterThan(1);
	});

	it('drops trailing move-only subpaths', () => {
		const contours = svgPathToContours('M10,10L90,10L90,90Z M200,200', 'cff');
		expect(contours.length).toBe(1);
	});

	it('does not corrupt composite linking when a base glyph path has M0,0', () => {
		const font = FontFlux.create({ family: 'M0 Test' });
		font.addGlyph({
			name: 'a',
			unicode: 0x61,
			advanceWidth: 600,
			path: 'M0,0M100,0L100,500L500,500L500,0Z',
			format: 'truetype',
		});
		font.addGlyph({
			name: 'aacute',
			unicode: 0xe1,
			advanceWidth: 600,
			components: [{ glyphName: 'a', dx: 0, dy: 100 }],
		});
		const buffer = font.export({ format: 'ttf' });
		const reopened = FontFlux.open(buffer);
		expect(reopened.getGlyphContours('aacute').length).toBeGreaterThan(0);
	});
});

describe('composite component references (Finding #3)', () => {
	it('resolves a component by glyphName at export time', () => {
		const font = buildFontWithComposite();
		const buffer = font.export({ format: 'ttf' });
		const reopened = FontFlux.open(buffer);
		const contours = reopened.getGlyphContours('aacute');
		expect(contours.length).toBeGreaterThan(0);
	});

	it('throws a clear error for an unknown glyphName', () => {
		const font = FontFlux.create({ family: 'Bad Ref' });
		font.addGlyph({
			name: 'broken',
			unicode: 0x62,
			advanceWidth: 600,
			components: [{ glyphName: 'doesNotExist', dx: 0, dy: 0 }],
		});
		expect(() => font.export({ format: 'ttf' })).toThrow(/unknown glyph name/i);
	});

	it('normalizeComponent translates high-level dx/dy to XY arguments', () => {
		const nameToIndex = new Map([['a', 2]]);
		const out = normalizeComponent(
			{ glyphName: 'a', dx: 30, dy: -40 },
			nameToIndex,
		);
		expect(out.glyphIndex).toBe(2);
		expect(out.argument1).toBe(30);
		expect(out.argument2).toBe(-40);
		expect(out.flags.argsAreXYValues).toBe(true);
	});

	it('normalizeComponent translates scale and scaleXY to writer transforms', () => {
		expect(
			normalizeComponent({ glyphIndex: 1, dx: 0, dy: 0, scale: 0.5 }).transform,
		).toEqual({
			scale: 0.5,
		});
		expect(
			normalizeComponent({
				glyphIndex: 1,
				dx: 0,
				dy: 0,
				scaleXY: { x: 0.5, y: 2 },
			}).transform,
		).toEqual({ xScale: 0.5, yScale: 2 });
	});

	it('normalizeComponent translates a 2x2 matrix to writer transform', () => {
		const out = normalizeComponent({
			glyphIndex: 1,
			dx: 0,
			dy: 0,
			transform: { xx: 1, xy: 0.2, yx: -0.2, yy: 1 },
		});
		expect(out.transform).toEqual({
			xScale: 1,
			scale01: 0.2,
			scale10: -0.2,
			yScale: 1,
		});
	});

	it('preserves a low-level (imported) component shape unchanged', () => {
		const comp = {
			glyphIndex: 3,
			flags: { argsAreXYValues: true },
			argument1: 10,
			argument2: 20,
		};
		const out = normalizeComponent(comp, new Map());
		expect(out.glyphIndex).toBe(3);
		expect(out.argument1).toBe(10);
		expect(out.argument2).toBe(20);
	});
});
