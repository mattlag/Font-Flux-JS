/**
 * Font Flux JS : Outline Conversion
 *
 * Converts a font's glyph outlines between the two SFNT outline technologies:
 *
 *   - TrueType (`glyf`/`loca`)  — quadratic B-splines, sfntVersion 0x00010000 (.ttf)
 *   - PostScript/CFF (`CFF `)   — cubic Béziers,        sfntVersion 'OTTO'     (.otf)
 *
 * Both formats share the same SFNT container; the only true binary differences
 * are the 4-byte sfntVersion in the file header and which glyph-outline tables
 * are present. This module rewrites the simplified glyph contours, swaps the
 * outline tables, and updates the header so the rest of the export pipeline
 * emits a correct file for the requested technology.
 *
 * Scope: static fonts only. Variable fonts (fvar / gvar / CFF2) and font
 * collections are rejected — converting interpolated outlines is out of scope.
 */

import { decomposeGlyph } from './glyph.js';
import { compileCharString } from './otf/charstring_compiler.js';
import { cubicToQuadratics } from './svg_path.js';

/** sfntVersion for TrueType-outline fonts (.ttf). */
const SFNT_VERSION_TTF = 0x00010000;
/** sfntVersion for CFF-outline fonts (.otf) — ASCII 'OTTO'. */
const SFNT_VERSION_OTF = 0x4f54544f;

/** Tables that only belong in a CFF-outline font; dropped when going to glyf. */
const CFF_ONLY_TABLES = ['CFF ', 'CFF2', 'VORG'];
/** Tables that only belong in a TrueType-outline font; dropped when going to CFF. */
const TTF_ONLY_TABLES = [
	'glyf',
	'loca',
	'cvt ',
	'fpgm',
	'prep',
	'gasp',
	'hdmx',
	'LTSH',
	'VDMX',
	'gvar',
	'cvar',
];

/**
 * Convert a font's outlines to the requested technology.
 *
 * Returns a NEW font-data object (the input is never mutated). When the font
 * already uses the requested outline technology the original object is
 * returned unchanged.
 *
 * @param {object} fontData - Simplified font data ({ font, glyphs, ... }).
 * @param {'truetype'|'cff'} target - Desired outline technology.
 * @returns {object} Font data with converted outlines, ready for exportFont.
 */
export function convertOutlines(fontData, target) {
	if (!fontData || typeof fontData !== 'object') {
		throw new TypeError('convertOutlines expects a font data object');
	}
	if (target !== 'truetype' && target !== 'cff') {
		throw new Error(
			`convertOutlines: target must be 'truetype' or 'cff', got '${target}'`,
		);
	}

	if (fontData.collection && Array.isArray(fontData.fonts)) {
		throw new Error(
			'Outline conversion is not supported for font collections.',
		);
	}

	const current = detectOutline(fontData);
	if (current === target) return fontData; // already in the requested format

	if (!Array.isArray(fontData.glyphs)) {
		throw new Error(
			'Outline conversion requires simplified glyph data ({ font, glyphs }).',
		);
	}

	const tables = fontData.tables || {};
	if (fontData.axes?.length || tables.fvar || tables.gvar || tables.CFF2) {
		throw new Error(
			'Outline conversion is not supported for variable fonts (fvar/gvar/CFF2).',
		);
	}

	return target === 'truetype'
		? cffToTrueType(fontData)
		: trueTypeToCFF(fontData);
}

/**
 * Detect the current outline technology of a font.
 * @param {object} fontData
 * @returns {'cff'|'truetype'}
 */
function detectOutline(fontData) {
	const tables = fontData.tables || {};
	if (tables['CFF '] || tables.CFF2) return 'cff';
	if (tables.glyf) return 'truetype';
	// Hand-authored fonts with no raw tables: infer from glyph data.
	const glyphs = fontData.glyphs || [];
	if (glyphs.some((g) => g.charString)) return 'cff';
	return 'truetype';
}

// ===========================================================================
//  CFF (cubic) → TrueType (quadratic)
// ===========================================================================

/**
 * @param {object} fontData
 * @returns {object}
 */
function cffToTrueType(fontData) {
	const newGlyphs = fontData.glyphs.map((glyph) => {
		const out = { ...glyph };
		// CFF carries cubic contours + raw charstrings; both must go.
		delete out.charString;
		delete out.charStringDisassembly;
		delete out.components; // CFF has no composites

		if (isCubicContours(glyph.contours)) {
			out.contours = glyph.contours.map(cubicContourToPoints);
		} else if (Array.isArray(glyph.contours)) {
			out.contours = glyph.contours; // already point format (unexpected, keep)
		} else {
			out.contours = [];
		}

		// TrueType requires the hmtx left side bearing to equal the glyph's
		// xMin. CFF rasterizers position glyphs by their absolute outline
		// coordinates and ignore any lsb/xMin mismatch, so OTF hmtx lsb values
		// frequently disagree with the real outline xMin (common in oblique /
		// italic faces where strokes overhang to the left). TrueType
		// rasterizers, however, shift the outline by (lsb − xMin), which would
		// push such glyphs out of their advance and overlap their neighbours.
		// Recompute lsb from the converted outline so lsb === xMin and the
		// glyph keeps the same visual position relative to the pen.
		out.leftSideBearing = pointsXMin(out.contours);
		return out;
	});

	return cloneWith(fontData, {
		glyphs: newGlyphs,
		tables: stripTables(fontData.tables, CFF_ONLY_TABLES),
		_header: updatedHeader(fontData._header, SFNT_VERSION_TTF),
	});
}

/**
 * Convert one cubic contour (M/L/C/Q commands) to TrueType points
 * ({ x, y, onCurve }), approximating cubics with quadratics.
 * @param {Array<object>} contour
 * @returns {Array<{x:number,y:number,onCurve:boolean}>}
 */
function cubicContourToPoints(contour) {
	if (!Array.isArray(contour) || contour.length === 0) return [];
	const points = [];
	let curX = 0;
	let curY = 0;

	for (const cmd of contour) {
		switch (cmd.type) {
			case 'M':
			case 'L':
				points.push({ x: r(cmd.x), y: r(cmd.y), onCurve: true });
				curX = cmd.x;
				curY = cmd.y;
				break;
			case 'Q':
				points.push({ x: r(cmd.x1), y: r(cmd.y1), onCurve: false });
				points.push({ x: r(cmd.x), y: r(cmd.y), onCurve: true });
				curX = cmd.x;
				curY = cmd.y;
				break;
			case 'C': {
				const quads = cubicToQuadratics(
					curX,
					curY,
					cmd.x1,
					cmd.y1,
					cmd.x2,
					cmd.y2,
					cmd.x,
					cmd.y,
				);
				for (const q of quads) {
					points.push({ x: r(q.cx), y: r(q.cy), onCurve: false });
					points.push({ x: r(q.x), y: r(q.y), onCurve: true });
				}
				curX = cmd.x;
				curY = cmd.y;
				break;
			}
		}
	}
	return points;
}

// ===========================================================================
//  TrueType (quadratic) → CFF (cubic)
// ===========================================================================

/**
 * @param {object} fontData
 * @returns {object}
 */
function trueTypeToCFF(fontData) {
	const glyphs = fontData.glyphs;
	const newGlyphs = glyphs.map((glyph) => {
		const out = { ...glyph };
		delete out.instructions; // TrueType hint bytecode is meaningless in CFF
		delete out.components; // composites are flattened into contours below

		// decomposeGlyph returns flattened point contours for simple AND
		// composite glyphs, so it handles both cases uniformly.
		const pointContours = decomposeGlyph(glyphs, glyph);
		const cubic = pointContours
			.map(pointsContourToCubic)
			.filter((c) => c.length > 0);

		out.contours = cubic;
		const width = Number.isFinite(glyph.advanceWidth)
			? glyph.advanceWidth
			: undefined;
		out.charString = compileCharString(cubic, width);
		return out;
	});

	return cloneWith(fontData, {
		glyphs: newGlyphs,
		tables: stripTables(fontData.tables, TTF_ONLY_TABLES),
		_header: updatedHeader(fontData._header, SFNT_VERSION_OTF),
		// Clear decomposed TrueType-hinting fields so they are not re-emitted.
		cvt: undefined,
		fpgm: undefined,
		prep: undefined,
		gasp: undefined,
	});
}

/**
 * Convert one TrueType point contour ({ x, y, onCurve }) to cubic commands
 * (M/L/C). Quadratic segments are promoted to cubics exactly (degree
 * elevation); implied on-curve midpoints between consecutive off-curve points
 * are reconstructed.
 * @param {Array<{x:number,y:number,onCurve:boolean}>} points
 * @returns {Array<object>} Cubic contour commands
 */
function pointsContourToCubic(points) {
	if (!Array.isArray(points) || points.length === 0) return [];
	const len = points.length;

	// Rotate so the contour begins on an on-curve point. If the contour is
	// entirely off-curve (rare), synthesize a starting on-curve midpoint.
	let rotated;
	const startIdx = points.findIndex((p) => p.onCurve);
	if (startIdx === -1) {
		const a = points[len - 1];
		const b = points[0];
		rotated = [
			{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, onCurve: true },
			...points,
		];
	} else {
		rotated = [];
		for (let i = 0; i < len; i++) rotated.push(points[(startIdx + i) % len]);
	}

	// Insert implied on-curve points between consecutive off-curve points
	// (including the wrap-around back to the start).
	const norm = [];
	for (let i = 0; i < rotated.length; i++) {
		const p = rotated[i];
		norm.push(p);
		const next = rotated[(i + 1) % rotated.length];
		if (!p.onCurve && !next.onCurve) {
			norm.push({
				x: (p.x + next.x) / 2,
				y: (p.y + next.y) / 2,
				onCurve: true,
			});
		}
	}

	const start = norm[0];
	const out = [{ type: 'M', x: r(start.x), y: r(start.y) }];
	let curX = start.x;
	let curY = start.y;
	const N = norm.length;

	let i = 1;
	while (i < N) {
		const pt = norm[i];
		if (pt.onCurve) {
			out.push({ type: 'L', x: r(pt.x), y: r(pt.y) });
			curX = pt.x;
			curY = pt.y;
			i++;
		} else {
			// Off-curve control followed by an on-curve endpoint (guaranteed by
			// the midpoint normalisation above; the endpoint may be the start
			// point on the final wrap-around).
			const end = norm[(i + 1) % N];
			out.push(quadToCubic(curX, curY, pt.x, pt.y, end.x, end.y));
			curX = end.x;
			curY = end.y;
			i += 2;
		}
	}
	return out;
}

/**
 * Promote a quadratic Bézier to an exact cubic (degree elevation).
 * @returns {object} A cubic curveTo command.
 */
function quadToCubic(p0x, p0y, cx, cy, p1x, p1y) {
	const c1x = p0x + (2 / 3) * (cx - p0x);
	const c1y = p0y + (2 / 3) * (cy - p0y);
	const c2x = p1x + (2 / 3) * (cx - p1x);
	const c2y = p1y + (2 / 3) * (cy - p1y);
	return {
		type: 'C',
		x1: r(c1x),
		y1: r(c1y),
		x2: r(c2x),
		y2: r(c2y),
		x: r(p1x),
		y: r(p1y),
	};
}

// ===========================================================================
//  HELPERS
// ===========================================================================

/** Round to the integer grid used by font outlines. */
function r(v) {
	return Math.round(v);
}

/**
 * Minimum x across TrueType point contours, used as the glyph's left side
 * bearing (TrueType requires lsb === glyf xMin). Returns 0 for empty outlines,
 * matching the xMin buildGlyfTable assigns to contour-less glyphs.
 * @param {Array<Array<{x:number}>>} contours
 * @returns {number}
 */
function pointsXMin(contours) {
	let min = Infinity;
	for (const contour of contours) {
		for (const p of contour) {
			if (p.x < min) min = p.x;
		}
	}
	return min === Infinity ? 0 : min;
}

/** True when `contours` are CFF-style command objects (have a `type` field). */
function isCubicContours(contours) {
	return (
		Array.isArray(contours) &&
		contours.length > 0 &&
		Array.isArray(contours[0]) &&
		contours[0].length > 0 &&
		typeof contours[0][0]?.type === 'string'
	);
}

/**
 * Return a shallow copy of `tables` omitting the given tags.
 * @param {object|undefined} tables
 * @param {string[]} drop
 * @returns {object}
 */
function stripTables(tables, drop) {
	const out = {};
	if (!tables) return out;
	const dropSet = new Set(drop);
	for (const [tag, data] of Object.entries(tables)) {
		if (!dropSet.has(tag)) out[tag] = data;
	}
	return out;
}

/**
 * Clone the SFNT header with an updated sfntVersion.
 * @param {object|undefined} header
 * @param {number} sfVersion
 * @returns {object}
 */
function updatedHeader(header, sfVersion) {
	return header ? { ...header, sfVersion } : { sfVersion };
}

/**
 * Shallow-merge `overrides` onto `fontData`, deleting any keys whose override
 * value is `undefined` so stale simplified fields do not linger.
 * @param {object} fontData
 * @param {object} overrides
 * @returns {object}
 */
function cloneWith(fontData, overrides) {
	const out = { ...fontData, ...overrides };
	for (const key of Object.keys(overrides)) {
		if (overrides[key] === undefined) delete out[key];
	}
	return out;
}
