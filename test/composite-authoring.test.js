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
import { remapLayoutGlyphs } from '../src/layout_remap.js';
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
	it.each([2, 3])(
		'remaps GSUB sequence arrays for lookup type %s',
		(lookupType) => {
			const key = lookupType === 2 ? 'sequences' : 'alternateSets';
			const source = {
				lookupList: {
					lookups: [
						{
							lookupType,
							subtables: [
								{
									format: 1,
									coverage: { format: 1, glyphs: [1, 2] },
									[key]: [[2, 3], [3]],
								},
							],
						},
					],
				},
			};
			const result = remapLayoutGlyphs(
				source,
				'GSUB',
				new Map([
					[1, 3],
					[2, 1],
					[3, 2],
				]),
			);
			expect(result.lookupList.lookups[0].subtables[0]).toMatchObject({
				coverage: { glyphs: [1, 3] },
				[key]: [[2], [1, 2]],
			});
			expect(source.lookupList.lookups[0].subtables[0][key]).toEqual([
				[2, 3],
				[3],
			]);
		},
	);

	it('remaps ligature glyphs inside extension lookups', () => {
		const source = {
			lookupList: {
				lookups: [
					{
						lookupType: 7,
						subtables: [
							{
								format: 1,
								extensionLookupType: 4,
								subtable: {
									format: 1,
									coverage: { format: 1, glyphs: [1] },
									ligatureSets: [
										[{ ligatureGlyph: 3, componentGlyphIDs: [2] }],
									],
								},
							},
						],
					},
				],
			},
		};
		const result = remapLayoutGlyphs(
			source,
			'GSUB',
			new Map([
				[1, 3],
				[2, 1],
				[3, 2],
			]),
		);
		expect(result.lookupList.lookups[0].subtables[0].subtable).toMatchObject({
			coverage: { glyphs: [3] },
			ligatureSets: [[{ ligatureGlyph: 2, componentGlyphIDs: [1] }]],
		});
	});

	it('remaps class PairPos and mark-set membership without changing class values', () => {
		const indices = new Map([
			[1, 3],
			[2, 1],
			[3, 2],
		]);
		const source = {
			lookupList: {
				lookups: [
					{
						lookupType: 2,
						subtables: [
							{
								format: 2,
								coverage: { format: 1, glyphs: [1, 2] },
								classDef1: { format: 1, startGlyphID: 1, classValues: [1, 2] },
								classDef2: {
									format: 2,
									ranges: [{ startGlyphID: 2, endGlyphID: 3, class: 1 }],
								},
								class1Records: [
									{ class2Records: [{ value1: { xAdvance: -40 } }] },
								],
							},
						],
					},
				],
			},
		};
		const result = remapLayoutGlyphs(source, 'GPOS', indices).lookupList
			.lookups[0].subtables[0];
		expect(result.classDef1.ranges).toEqual([
			{ startGlyphID: 1, endGlyphID: 1, class: 2 },
			{ startGlyphID: 3, endGlyphID: 3, class: 1 },
		]);
		expect(result.class1Records).toEqual(
			source.lookupList.lookups[0].subtables[0].class1Records,
		);
		const gdef = remapLayoutGlyphs(
			{
				markGlyphSetsDef: {
					coverages: [
						{
							format: 2,
							ranges: [
								{ startGlyphID: 1, endGlyphID: 2, startCoverageIndex: 0 },
							],
						},
					],
				},
			},
			'GDEF',
			indices,
		);
		expect(gdef.markGlyphSetsDef.coverages).toEqual([
			{ format: 1, glyphs: [1, 3] },
		]);
	});

	it.each([
		[{ startGlyphID: 0, endGlyphID: 0xffffffff, class: 1 }],
		[{ startGlyphID: 2, endGlyphID: 1, class: 1 }],
		[
			{ startGlyphID: 1, endGlyphID: 2, class: 1 },
			{ startGlyphID: 2, endGlyphID: 3, class: 2 },
		],
	])('rejects invalid class ranges before expansion: %j', (...ranges) => {
		expect(() =>
			remapLayoutGlyphs(
				{ glyphClassDef: { format: 2, ranges } },
				'GDEF',
				new Map(),
			),
		).toThrow(/invalid glyph ranges/);
	});

	it('reorders SinglePos values with coverage and rejects dangling targets', () => {
		const table = {
			lookupList: {
				lookups: [
					{
						lookupType: 1,
						subtables: [
							{
								format: 2,
								coverage: { format: 1, glyphs: [1, 2] },
								valueRecords: [{ xAdvance: 10 }, { xAdvance: 20 }],
							},
						],
					},
				],
			},
		};
		const remapped = remapLayoutGlyphs(
			table,
			'GPOS',
			new Map([
				[1, 2],
				[2, 1],
			]),
		);
		expect(remapped.lookupList.lookups[0].subtables[0].valueRecords).toEqual([
			{ xAdvance: 20 },
			{ xAdvance: 10 },
		]);
		expect(() => remapLayoutGlyphs(table, 'GPOS', new Map([[1, 1]]))).toThrow(
			/references removed glyph/,
		);
		expect(
			table.lookupList.lookups[0].subtables[0].valueRecords[0].xAdvance,
		).toBe(10);
	});
	it.each(['delete', 'reorder'])(
		'remaps simple layout references on glyph %s',
		(operation) => {
			const source = FontFlux.create();
			for (const name of ['unused', 'a', 'b', 'a.alt'])
				source.addGlyph({ name, advanceWidth: 600 });
			source.addKerning({ left: 'a', right: 'b', value: -40 });
			source.addSubstitution({
				type: 'single',
				feature: 'salt',
				substitution: { from: 'a', to: 'a.alt' },
			});
			source.data.features = {
				GDEF: {
					majorVersion: 1,
					minorVersion: 0,
					glyphClassDef: { format: 1, startGlyphID: 3, classValues: [1, 1, 1] },
				},
			};
			const font = FontFlux.open(source.export());
			if (operation === 'delete') font.removeGlyph('unused');
			else [font.glyphs[3], font.glyphs[4]] = [font.glyphs[4], font.glyphs[3]];
			const reopened = FontFlux.open(font.export());
			expect(reopened.getKerning('a', 'b')).toBe(-40);
			expect(reopened.substitutions[0]).toMatchObject({
				from: 'a',
				to: 'a.alt',
			});
			expect(
				reopened.tables.GDEF.glyphClassDef.ranges
					.map((range) => reopened.glyphs[range.startGlyphID].name)
					.sort(),
			).toEqual(['a', 'a.alt', 'b']);
		},
	);
	it('emits translated composite bounds and includes them in head', () => {
		const font = buildFontWithComposite();
		font.getGlyph('aacute').components[0].dx = 1000;
		const reopened = FontFlux.open(font.export());
		const glyph =
			reopened.tables.glyf.glyphs[
				reopened.glyphs.findIndex((entry) => entry.name === 'aacute')
			];
		expect(glyph.xMin).toBe(1100);
		expect(glyph.xMax).toBe(1500);
		expect(reopened.tables.head.xMax).toBe(1500);
	});
	it('rebinds imported numeric components after removing an earlier glyph', () => {
		const font = FontFlux.open(buildFontWithComposite().export());
		const expected = font.getGlyphContours('aacute');
		font.removeGlyph('space');
		const reopened = FontFlux.open(FontFlux.fromJSON(font.toJSON()).export());
		expect(reopened.getGlyphContours('aacute')).toEqual(expected);
	});

	it('rejects glyph-order changes with opaque dependencies', () => {
		const font = FontFlux.open(buildFontWithComposite().export());
		font.tables.TEST = { _raw: [1, 2, 3, 4] };
		font.glyphs.splice(1, 1);
		expect(() => font.export()).toThrow(/TEST.*glyph|glyph.*TEST/i);
	});

	it('computes nested composite maxima and preserves hint resources', () => {
		const font = buildFontWithComposite();
		font.addGlyph({
			name: 'nested',
			advanceWidth: 600,
			components: [{ glyphName: 'aacute' }, { glyphName: 'a' }],
		});
		const reopened = FontFlux.open(font.export());
		expect(reopened.tables.maxp.maxComponentDepth).toBe(2);
		expect(reopened.tables.maxp.maxCompositePoints).toBe(8);
		expect(reopened.tables.maxp.maxCompositeContours).toBe(2);
		reopened.tables.maxp.maxStorage = 32;
		reopened.tables.maxp.maxStackElements = 128;
		expect(FontFlux.open(reopened.export()).tables.maxp).toMatchObject({
			maxStorage: 32,
			maxStackElements: 128,
		});
	});

	it('rejects cyclic and dangling component references', () => {
		const font = buildFontWithComposite();
		font.getGlyph('aacute').components = [{ glyphName: 'aacute' }];
		expect(() => font.export()).toThrow(/cycl/i);
		font.getGlyph('aacute').components = [{ glyphName: 'missing' }];
		expect(() => font.export()).toThrow(/reference|missing/i);
	});

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
		expect(() => font.export({ format: 'ttf' })).toThrow(
			/unknown glyph (name|reference)/i,
		);
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
