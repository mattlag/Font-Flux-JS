import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFont, importFontTables, tableParsers } from '../src/import.js';
import { parseCOLR, writeCOLR } from '../src/sfnt/table_COLR.js';
import { parseGPOS, writeGPOS } from '../src/sfnt/table_GPOS.js';
import { parseGSUB, writeGSUB } from '../src/sfnt/table_GSUB.js';
import { DEFAULT_STRUCTURE_LIMITS } from '../src/structure_limits.js';
import { DataWriter } from '../src/writer.js';

function layout(lookupType, subtables) {
	return {
		majorVersion: 1,
		minorVersion: 0,
		scriptList: { scriptRecords: [] },
		featureList: { featureRecords: [] },
		lookupList: { lookups: [{ lookupType, lookupFlag: 0, subtables }] },
	};
}

function rawLayout(lookupType, subtable, copies = 1) {
	const w = new DataWriter(24 + copies * 2 + subtable.length);
	w.uint16(1);
	w.uint16(0);
	w.uint16(10);
	w.uint16(12);
	w.uint16(14);
	w.uint16(0);
	w.uint16(0);
	w.uint16(1);
	w.uint16(4);
	w.uint16(lookupType);
	w.uint16(0);
	w.uint16(copies);
	for (let i = 0; i < copies; i++) w.uint16(6 + copies * 2);
	w.rawBytes(subtable);
	return w.toArray();
}

function extensionChain(extensionType, depth, cycle = false) {
	const w = new DataWriter((depth - 1) * 8 + (cycle ? 8 : 12));
	for (let i = 1; i < depth; i++) {
		w.uint16(1);
		w.uint16(i === depth - 1 && !cycle ? 1 : extensionType);
		w.uint32(8);
	}
	if (cycle) {
		w.uint16(1);
		w.uint16(extensionType);
		w.uint32(0);
	} else {
		w.uint16(1);
		w.uint16(6);
		w.uint16(extensionType === 7 ? 1 : 0);
		w.uint16(1);
		w.uint16(1);
		w.uint16(7);
	}
	return rawLayout(depth === 1 && !cycle ? 1 : extensionType, w.toArray());
}

function color(records, layerPaints = null) {
	return writeCOLR({
		version: 1,
		baseGlyphRecords: [],
		layerRecords: [],
		baseGlyphPaintRecords: records,
		layerPaints,
	});
}

function solid() {
	return { format: 2, paletteIndex: 0, alpha: 1 };
}

function paintChain(depth, leaf = solid()) {
	let paint = leaf;
	for (let i = 1; i < depth; i++) paint = { format: 10, glyphID: 1, paint };
	return paint;
}

function sfnt(tag, bytes) {
	const w = new DataWriter(28 + bytes.length);
	w.uint32(0x00010000);
	w.uint16(1);
	w.uint16(16);
	w.uint16(0);
	w.uint16(0);
	w.tag(tag);
	w.uint32(0);
	w.uint32(28);
	w.uint32(bytes.length);
	w.rawBytes(bytes);
	return Uint8Array.from(w.toArray()).buffer;
}

const layouts = [
	{ tag: 'GSUB', parse: parseGSUB, write: writeGSUB, extension: 7, context: 5 },
	{ tag: 'GPOS', parse: parseGPOS, write: writeGPOS, extension: 9, context: 7 },
];

describe('layout structure limits', () => {
	for (const { tag, parse, write, extension, context } of layouts) {
		it(`${tag} accepts the depth boundary and rejects deeper extensions`, () => {
			const bytes = extensionChain(extension, 4);
			expect(parse(bytes, { maxStructureDepth: 4 })).toEqual(parse(bytes));
			expect(() => parse(bytes, { maxStructureDepth: 3 })).toThrow(
				'maxStructureDepth',
			);
			expect(() => parse(extensionChain(extension, 65))).toThrow(
				'maxStructureDepth',
			);
		});

		it(`${tag} detects extension cycles before exhausting the JS stack`, () => {
			for (const depth of [1, 4]) {
				const bytes = Object.freeze(extensionChain(extension, depth, true));
				expect(() => parse(bytes)).toThrow(/cycle/i);
			}
		});

		it(`${tag} counts array entries and subtable visits at the node boundary`, () => {
			const bytes = extensionChain(extension, 1);
			expect(parse(bytes, { maxStructureNodes: 7 })).toEqual(parse(bytes));
			expect(() => parse(bytes, { maxStructureNodes: 6 })).toThrow(
				'maxStructureNodes',
			);
		});

		it(`${tag} permits shared subtable offsets but charges repeated work`, () => {
			const subtable = extensionChain(extension, 1).slice(26);
			const bytes = rawLayout(1, subtable, 3);
			const result = parse(bytes, { maxStructureNodes: 15 });
			expect(result.lookupList.lookups[0].subtables).toHaveLength(3);
			expect(result.lookupList.lookups[0].subtables[0]).toEqual(
				result.lookupList.lookups[0].subtables[2],
			);
			expect(() => parse(bytes, { maxStructureNodes: 14 })).toThrow(
				'maxStructureNodes',
			);
		});

		it(`${tag} bounds contextual rule/coverage expansion`, () => {
			const rule = {
				glyphCount: 3,
				inputSequence: [2, 3],
				seqLookupRecords: [{ sequenceIndex: 0, lookupListIndex: 0 }],
			};
			const coverage = { format: 1, glyphs: [1] };
			const cases = [
				{ format: 1, coverage, seqRuleSets: [Array(12).fill(rule)] },
				{
					format: 2,
					coverage,
					classDef: { format: 1, startGlyphID: 1, classValues: [0] },
					classSeqRuleSets: [Array(12).fill(rule)],
				},
				{
					format: 3,
					coverages: Array(12).fill(coverage),
					seqLookupRecords: rule.seqLookupRecords,
				},
			];
			for (const subtable of cases) {
				const bytes = Object.freeze(write(layout(context, [subtable])));
				expect(parse(bytes, { maxStructureNodes: 200 })).toEqual(parse(bytes));
				expect(() => parse(bytes, { maxStructureNodes: 20 })).toThrow(
					'maxStructureNodes',
				);
			}
		});

		it(`${tag} bounds chained contextual arrays`, () => {
			const coverage = { format: 1, glyphs: [1, 2, 3] };
			const classDef = { format: 1, startGlyphID: 1, classValues: [0] };
			const rule = {
				backtrackSequence: [1, 2],
				inputGlyphCount: 2,
				inputSequence: [3],
				lookaheadSequence: [4, 5],
				seqLookupRecords: [{ sequenceIndex: 0, lookupListIndex: 0 }],
			};
			const cases = [
				{ format: 1, coverage, chainedSeqRuleSets: [Array(12).fill(rule)] },
				{
					format: 2,
					coverage,
					backtrackClassDef: classDef,
					inputClassDef: classDef,
					lookaheadClassDef: classDef,
					chainedClassSeqRuleSets: [Array(12).fill(rule)],
				},
				{
					format: 3,
					backtrackCoverages: Array(6).fill(coverage),
					inputCoverages: Array(6).fill(coverage),
					lookaheadCoverages: Array(6).fill(coverage),
					seqLookupRecords: rule.seqLookupRecords,
				},
			];
			for (const subtable of cases) {
				const bytes = write(layout(context + 1, [subtable]));
				expect(parse(bytes, { maxStructureNodes: 200 })).toEqual(parse(bytes));
				expect(() => parse(bytes, { maxStructureNodes: 30 })).toThrow(
					'maxStructureNodes',
				);
			}
		});
	}

	it('bounds zero-width GPOS class-pair matrices before allocating rows', () => {
		const w = new DataWriter(16);
		w.uint16(2);
		w.uint16(0);
		w.uint16(0);
		w.uint16(0);
		w.uint16(0);
		w.uint16(0);
		w.uint16(65535);
		w.uint16(65535);
		expect(() => parseGPOS(rawLayout(2, w.toArray()))).toThrow(
			'maxStructureNodes',
		);
	});

	it('does not swallow GPOS Device limits while trying compatibility offsets', () => {
		const bytes = writeGPOS(layout(1, [{
			format: 1,
			coverage: { format: 1, glyphs: [1] },
			valueFormat: 0x10,
			valueRecord: {
				xPlaDevice: { startSize: 1, endSize: 2, deltaFormat: 1, deltaValues: [0, 0] },
			},
		}]));
		expect(() => parseGPOS(bytes)).not.toThrow();
		expect(() => parseGPOS(bytes, { maxStructureNodes: 6 })).toThrow(
			'maxStructureNodes',
		);
	});
});

describe('COLR structure limits', () => {
	it('accepts paint depth at the boundary and rejects deeper trees', () => {
		const bytes = color([{ glyphID: 1, paint: paintChain(4) }]);
		expect(parseCOLR(bytes, { maxStructureDepth: 4 })).toEqual(parseCOLR(bytes));
		expect(() => parseCOLR(bytes, { maxStructureDepth: 3 })).toThrow(
			'maxStructureDepth',
		);
		expect(() => parseCOLR(color([{ glyphID: 1, paint: paintChain(65) }]))).toThrow(
			'maxStructureDepth',
		);
	});

	it('detects an offset cycle and preserves the source on failure', () => {
		const bytes = color([{ glyphID: 1, paint: paintChain(2) }]);
		const view = new DataView(Uint8Array.from(bytes).buffer);
		const listOffset = view.getUint32(14);
		const rootOffset = listOffset + view.getUint32(listOffset + 6);
		bytes.fill(0, rootOffset + 1, rootOffset + 4);
		const original = [...bytes];
		Object.freeze(bytes);
		expect(() => parseCOLR(bytes)).toThrow(/cycle/i);
		expect(bytes).toEqual(original);
	});

	it('detects cycles through layer and glyph references', () => {
		const layer = { format: 1, firstLayerIndex: 0, numLayers: 1 };
		expect(() =>
			parseCOLR(color([{ glyphID: 1, paint: layer }], [layer])),
		).toThrow(/cycle/i);
		expect(() =>
			parseCOLR(
				color([
					{ glyphID: 1, paint: { format: 11, glyphID: 2 } },
					{ glyphID: 2, paint: { format: 11, glyphID: 1 } },
				]),
			),
		).toThrow(/cycle/i);
	});

	it('preserves shared paint identity without treating DAG edges as cycles', () => {
		const child = solid();
		const bytes = color([
			{
				glyphID: 1,
				paint: { format: 32, compositeMode: 3, sourcePaint: child, backdropPaint: child },
			},
			{ glyphID: 2, paint: child },
		]);
		const result = parseCOLR(bytes, { maxStructureDepth: 2 });
		const [first, second] = result.baseGlyphPaintRecords;
		expect(first.paint.sourcePaint).toBe(first.paint.backdropPaint);
		expect(first.paint.sourcePaint).toBe(second.paint);
	});

	it('checks cached subtree heights along longer paths', () => {
		const child = paintChain(3);
		const bytes = color([
			{ glyphID: 1, paint: child },
			{ glyphID: 2, paint: paintChain(3, child) },
		]);
		expect(parseCOLR(bytes, { maxStructureDepth: 5 })).toEqual(parseCOLR(bytes));
		expect(() => parseCOLR(bytes, { maxStructureDepth: 4 })).toThrow(
			'maxStructureDepth',
		);
	});

	it('bounds depth across non-recursive glyph references', () => {
		const bytes = color([
			{ glyphID: 1, paint: { format: 11, glyphID: 2 } },
			{ glyphID: 2, paint: { format: 11, glyphID: 3 } },
			{ glyphID: 3, paint: solid() },
		]);
		expect(() => parseCOLR(bytes, { maxStructureDepth: 2 })).toThrow(
			'maxStructureDepth',
		);
		expect(() => parseCOLR(bytes, { maxStructureDepth: 3 })).not.toThrow();
	});

	it('bounds node work including repeated roots and cached visits', () => {
		const child = solid();
		const bytes = color([
			{ glyphID: 1, paint: child },
			{ glyphID: 2, paint: child },
		]);
		expect(() => parseCOLR(bytes, { maxStructureNodes: 6 })).not.toThrow();
		expect(() => parseCOLR(bytes, { maxStructureNodes: 5 })).toThrow(
			'maxStructureNodes',
		);
	});

	it('rejects hostile 32-bit record counts before trying to read records', () => {
		const bytes = color([]);
		bytes.fill(255, 34, 38);
		expect(() => parseCOLR(bytes)).toThrow('maxStructureNodes');
	});

	it('bounds v0 records independently of the v1 paint graph', () => {
		const bytes = writeCOLR({
			version: 0,
			baseGlyphRecords: [{ glyphID: 1, firstLayerIndex: 0, numLayers: 1 }],
			layerRecords: [{ glyphID: 1, paletteIndex: 0 }],
		});
		expect(parseCOLR(bytes, { maxStructureNodes: 2 })).toEqual(parseCOLR(bytes));
		expect(() => parseCOLR(bytes, { maxStructureNodes: 1 })).toThrow(
			'maxStructureNodes',
		);
	});
});

describe('structure limit import contract', () => {
	it('exports immutable shared defaults', () => {
		expect(DEFAULT_STRUCTURE_LIMITS).toEqual({
			maxStructureDepth: 64,
			maxStructureNodes: 1000000,
		});
		expect(Object.isFrozen(DEFAULT_STRUCTURE_LIMITS)).toBe(true);
	});

	for (const key of ['maxStructureDepth', 'maxStructureNodes']) {
		it(`validates ${key} as a positive safe integer`, () => {
			const buffer = sfnt('GSUB', extensionChain(7, 1));
			for (const value of [0, -1, 1.5, Infinity, NaN, 2 ** 53, '64', null]) {
				expect(() => importFontTables(buffer, { [key]: value })).toThrow(
					`Invalid import limit: ${key}`,
				);
				expect(() => importFont(buffer, { [key]: value })).toThrow(
					`Invalid import limit: ${key}`,
				);
			}
		});
	}

	it('forwards third registry arguments and import options to each parser', () => {
		for (const { tag, extension } of layouts) {
			const bytes = extensionChain(extension, 3);
			const options = Object.freeze({ maxStructureDepth: 2 });
			expect(() => tableParsers[tag](bytes, {}, options)).toThrow(
				'maxStructureDepth',
			);
			expect(() => importFontTables(sfnt(tag, bytes), options)).toThrow(
				'maxStructureDepth',
			);
		}
		const bytes = color([{ glyphID: 1, paint: paintChain(3) }]);
		expect(() => tableParsers.COLR(bytes, {}, { maxStructureDepth: 2 })).toThrow(
			'maxStructureDepth',
		);
		expect(() =>
			importFontTables(sfnt('COLR', bytes), { maxStructureNodes: 1 }),
		).toThrow('maxStructureNodes');
	});

	it('does not share budgets between tables or calls, including failed parses', () => {
		for (const { tag, parse, extension } of layouts) {
			const bytes = Object.freeze(extensionChain(extension, 1));
			expect(() => parse(bytes, { maxStructureNodes: 6 })).toThrow();
			expect(() => parse(bytes, { maxStructureNodes: 7 })).not.toThrow();
			expect(() => tableParsers[tag](bytes, {}, { maxStructureNodes: 7 })).not.toThrow();
		}
	});

	it('preserves ordinary imports and source bytes', () => {
		const source = readFileSync(resolve('test', 'sample fonts', 'oblegg.ttf'));
		const buffer = source.buffer.slice(
			source.byteOffset,
			source.byteOffset + source.byteLength,
		);
		const before = new Uint8Array(buffer).slice();
		const expected = importFont(buffer);
		expect(importFont(buffer, DEFAULT_STRUCTURE_LIMITS)).toEqual(expected);
		expect(new Uint8Array(buffer)).toEqual(before);
	});
});
