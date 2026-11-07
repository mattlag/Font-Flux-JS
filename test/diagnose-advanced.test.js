import { describe, expect, it } from 'vitest';
import { writeCFF } from '../src/otf/table_CFF.js';
import { parseBASE, writeBASE } from '../src/sfnt/table_BASE.js';
import { parseCOLR, writeCOLR } from '../src/sfnt/table_COLR.js';
import { writeCPAL } from '../src/sfnt/table_CPAL.js';
import { writeGPOS } from '../src/sfnt/table_GPOS.js';
import { writeGDEF } from '../src/sfnt/table_GDEF.js';
import { writeGSUB } from '../src/sfnt/table_GSUB.js';
import { parseMATH } from '../src/sfnt/table_MATH.js';
import { writeName } from '../src/sfnt/table_name.js';
import { writeSVG } from '../src/sfnt/table_SVG.js';
import { writeSbix } from '../src/sfnt/table_sbix.js';
import { writeGlyfComputeOffsets } from '../src/ttf/table_glyf.js';
import { advancedContext, outlinePointCount } from '../src/validate/advanced-common.js';
import { inspectPng, validateAdvancedBitmap } from '../src/validate/advanced-bitmap.js';
import { validateAdvancedColor } from '../src/validate/advanced-color.js';
import { runAdvancedDiagnostics } from '../src/validate/advanced-diagnostics.js';
import { validateAdvancedGdef, validateAdvancedLayout } from '../src/validate/advanced-layout.js';
import { executeCffArithmetic, validateAdvancedTrueType, validateCffStructures } from '../src/validate/advanced-programs.js';
import { validateAdvancedSpecialist } from '../src/validate/advanced-specialist.js';
import { validateAdvancedStore, validateAdvancedVariation, validateTupleBytes } from '../src/validate/advanced-variation.js';
import { diagnosticState, trackDiagnosticIssues } from '../src/validate/coverage.js';
import { _internal, diagnoseFont } from '../src/validate/diagnoseFont.js';

const codes = (issues) => issues.map((issue) => issue.code);
const coverage = (...glyphs) => ({ format: 1, glyphs });
const core = () => ({
	maxp: { numGlyphs: 4 },
	fvar: { axes: [{ axisTag: 'wght' }, { axisTag: 'wdth' }] },
	glyf: { glyphs: Array.from({ length: 4 }, () => ({
		type: 'simple', contours: [[{ x: 0, y: 0, onCurve: true }, { x: 10, y: 0, onCurve: true }]], instructions: [],
	})) },
});
function inspect(tag, callback, tables = core(), options) {
	const issues = [];
	trackDiagnosticIssues(issues);
	callback(advancedContext(issues, tag, tables, options));
	return { issues, checks: diagnosticState(issues).checks };
}
function font(tableBytes) {
	const entries = Object.entries(tableBytes).sort(([a], [b]) => a.localeCompare(b));
	let cursor = 12 + entries.length * 16;
	const length = cursor + entries.reduce((sum, [, bytes]) => sum + Math.ceil(bytes.length / 4) * 4, 0);
	const bytes = new Uint8Array(length), view = new DataView(bytes.buffer);
	view.setUint32(0, 0x10000);
	view.setUint16(4, entries.length);
	const selector = Math.floor(Math.log2(entries.length));
	view.setUint16(6, 16 * 2 ** selector); view.setUint16(8, selector); view.setUint16(10, entries.length * 16 - 16 * 2 ** selector);
	entries.forEach(([tag, data], i) => {
		const at = 12 + i * 16;
		bytes.set(new TextEncoder().encode(tag), at);
		view.setUint32(at + 8, cursor); view.setUint32(at + 12, data.length);
		bytes.set(data, cursor);
		let checksum = 0;
		for (let j = 0; j < Math.ceil(data.length / 4) * 4; j += 4) checksum = (checksum + view.getUint32(cursor + j)) >>> 0;
		view.setUint32(at + 4, checksum);
		cursor += Math.ceil(data.length / 4) * 4;
	});
	return bytes.buffer;
}
const maxp = () => [0, 0, 0x50, 0, 0, 4];
function ttBytes(tables = core()) {
	const encoded = writeGlyfComputeOffsets(tables.glyf);
	const head = new Uint8Array(54), h = new DataView(head.buffer);
	h.setUint32(0, 0x10000); h.setUint32(12, 0x5f0f3cf5); h.setUint16(18, 1000);
	const maxp = new Uint8Array(32), m = new DataView(maxp.buffer);
	m.setUint32(0, 0x10000); m.setUint16(4, tables.glyf.glyphs.length); m.setUint16(14, 1);
	const loca = new Uint8Array(encoded.offsets.length * 2), l = new DataView(loca.buffer);
	encoded.offsets.forEach((offset, i) => l.setUint16(i * 2, offset / 2));
	const result = { head, maxp, loca, glyf: encoded.bytes };
	for (const axis of ['h', 'v']) {
		const header = new Uint8Array(36), metrics = new Uint8Array(tables.glyf.glyphs.length * 4);
		new DataView(header.buffer).setUint32(0, 0x10000);
		new DataView(header.buffer).setUint16(34, tables.glyf.glyphs.length);
		for (let i = 0; i < tables.glyf.glyphs.length; i++) new DataView(metrics.buffer).setUint16(i * 4, 100);
		result[`${axis}hea`] = header; result[`${axis}mtx`] = metrics;
	}
	return result;
}

function nestedOutlines() {
	const tables = core();
	const component = (glyphIndex) => ({ glyphIndex, argument1: 0, argument2: 0, flags: { argsAreXYValues: true } });
	tables.glyf.glyphs[2] = { type: 'composite', instructions: [], components: [component(0), component(1)] };
	tables.glyf.glyphs[3] = { type: 'composite', instructions: [], components: [
		{ ...component(2), flags: { argsAreXYValues: true, weHaveAScale: true }, transform: { scale: 0.5 } },
		{ glyphIndex: 0, argument1: 3, argument2: 1, flags: {} },
	] };
	return tables;
}
function layout(subtable, type = 5) {
	return {
		majorVersion: 1, minorVersion: 0,
		scriptList: { scriptRecords: [{ scriptTag: 'latn', script: {
			defaultLangSys: { lookupOrderOffset: 0, requiredFeatureIndex: 0xffff, featureIndices: [0] }, langSysRecords: [],
		} }] },
		featureList: { featureRecords: [{ featureTag: 'test', feature: { lookupListIndices: [0] } }] },
		lookupList: { lookups: [{ lookupType: type, lookupFlag: 0xff00, subtables: [subtable] }] },
	};
}
function store() {
	return {
		format: 1,
		variationRegionList: { axisCount: 2, regions: [{ regionAxes: [
			{ startCoord: 0.25, peakCoord: 0.5, endCoord: 0.75 },
			{ startCoord: -0.75, peakCoord: -0.5, endCoord: -0.25 },
		] }] },
		itemVariationData: [{ itemCount: 6, wordDeltaCount: 0, regionIndexes: [0], deltaSets: Array.from({ length: 6 }, () => [1]) }],
	};
}
function png(width = 1, height = 1) {
	const bytes = new Uint8Array(58), view = new DataView(bytes.buffer);
	bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
	view.setUint32(8, 13); bytes.set(new TextEncoder().encode('IHDR'), 12);
	view.setUint32(16, width); view.setUint32(20, height); bytes[24] = 8; bytes[25] = 6;
	view.setUint32(33, 1); bytes.set(new TextEncoder().encode('IDAT'), 37);
	bytes.set(new TextEncoder().encode('IEND'), 50);
	return bytes;
}
function mathBytes() {
	const bytes = new Uint8Array(274), v = new DataView(bytes.buffer);
	v.setUint32(0, 0x10000); v.setUint16(4, 10); v.setUint16(6, 224); v.setUint16(8, 232);
	v.setUint16(234, 12); v.setUint16(238, 1); v.setUint16(242, 18);
	v.setUint16(244, 1); v.setUint16(246, 1); v.setUint16(248, 1);
	v.setUint16(250, 8); v.setUint16(252, 1); v.setUint16(254, 1); v.setUint16(256, 100);
	v.setUint16(262, 1); v.setUint16(264, 1); v.setUint16(266, 5); v.setUint16(268, 5); v.setUint16(270, 50);
	return bytes;
}

describe('advanced layout graph diagnosis', () => {
	const contextual = () => ({ format: 3, inputCoverages: [coverage(1)], backtrackCoverages: [coverage(0)],
		lookaheadCoverages: [coverage(2)], seqLookupRecords: [{ sequenceIndex: 0, lookupListIndex: 0 }] });
	it('walks an extension into chained context and accepts shared lookup targets and high flags', () => {
		const data = layout({ format: 1, extensionLookupType: 6, subtable: contextual() }, 7);
		const report = diagnoseFont(font({ GSUB: writeGSUB(data), maxp: maxp() }));
		expect(report.issues.filter((issue) => issue.executionId === 'binary.advanced.GSUB')).toEqual([]);
		expect(report.checks.find((check) => check.id === 'binary.advanced.GSUB')).toMatchObject({ outcome: 'passed', coverage: 'partial' });
	});

	describe('owned composite contour-point references', () => {
		const anchor = (anchorPoint = 5) => ({ format: 2, xCoordinate: 0, yCoordinate: 0, anchorPoint });
		const base = (point) => ({ majorVersion: 1, minorVersion: 0, horizAxis: {
			baseTagList: ['romn'], baseScriptList: [{ tag: 'latn', baseValues: {
				defaultBaselineIndex: 0, baseCoords: [{ format: 2, coordinate: 0, referenceGlyph: 3, baseCoordPoint: point }],
			}, langSystems: [] }],
		} });
		it.each([5, 6])('checks GDEF and BASE nested composite boundaries at point %s', (point) => {
			const tables = nestedOutlines();
			const gdef = { majorVersion: 1, minorVersion: 0,
				attachList: { coverage: coverage(3), attachPoints: [[point]] },
				ligCaretList: { coverage: coverage(3), ligGlyphs: [[{ format: 2, caretValuePointIndex: point }]] } };
			const bytes = font({ ...ttBytes(tables), GDEF: writeGDEF(gdef), BASE: writeBASE(base(point)) });
			const report = diagnoseFont(bytes);
			expect(report.issues.filter((issue) => issue.code === 'GDEF_POINT_REFERENCE_INVALID')).toHaveLength(point === 5 ? 0 : 2);
			expect(codes(report.issues).includes('BASE_POINT_REFERENCE_INVALID')).toBe(point === 6);
			expect(report.checks.filter((check) => check.reasonCode === 'outline-unavailable')).toEqual([]);
		});
		it.each([3, 4, 5, 6])('checks glyph ownership in GPOS lookup type %s', (type) => {
			const shared = anchor();
			const st = type === 3 ? { format: 1, coverage: coverage(0, 3),
				entryExitRecords: [{ entryAnchor: shared }, { exitAnchor: shared }] } :
				type === 4 ? { format: 1, markClassCount: 1, markCoverage: coverage(0), baseCoverage: coverage(3),
					markArray: [{ markClass: 0, markAnchor: shared }], baseArray: [[shared]] } :
					type === 5 ? { format: 1, markClassCount: 1, markCoverage: coverage(0), ligatureCoverage: coverage(3),
						markArray: [{ markClass: 0, markAnchor: shared }], ligatureArray: [[[shared], [shared]]] } :
						{ format: 1, markClassCount: 1, mark1Coverage: coverage(0), mark2Coverage: coverage(3),
							mark1Array: [{ markClass: 0, markAnchor: shared }], mark2Array: [[shared]] };
			const result = inspect('GPOS', (ctx) => validateAdvancedLayout(layout(st, type), ctx), nestedOutlines());
			expect(result.issues).toHaveLength(1);
			expect(result.issues[0]).toMatchObject({ code: 'GPOS_ANCHOR_POINT_INVALID', location: { glyphIndex: 0 } });
			expect(result.checks).toEqual([]);
			const report = diagnoseFont(font({ ...ttBytes(nestedOutlines()), GPOS: writeGPOS(layout(st, type)) }));
			expect(report.issues.filter((issue) => issue.code === 'GPOS_ANCHOR_POINT_INVALID')).toHaveLength(1);
		});
		it('accepts a final valid point, rejects empty/phantom points, and blocks unavailable outlines', () => {
			const tables = nestedOutlines();
			const st = { format: 1, coverage: coverage(3), entryExitRecords: [{ entryAnchor: anchor() }] };
			expect(inspect('GPOS', (ctx) => validateAdvancedLayout(layout(st, 3), ctx), tables).issues).toEqual([]);
			st.entryExitRecords[0].entryAnchor.anchorPoint = 6;
			expect(codes(inspect('GPOS', (ctx) => validateAdvancedLayout(layout(st, 3), ctx), tables).issues)).toContain('GPOS_ANCHOR_POINT_INVALID');
			tables.glyf.glyphs[3] = null;
			st.entryExitRecords[0].entryAnchor.anchorPoint = 0;
			expect(codes(inspect('GPOS', (ctx) => validateAdvancedLayout(layout(st, 3), ctx), tables).issues)).toContain('GPOS_ANCHOR_POINT_INVALID');
			delete tables.glyf;
			const result = inspect('GPOS', (ctx) => validateAdvancedLayout(layout(st, 3), ctx), tables);
			expect(result.issues).toEqual([]);
			expect(result.checks).toContainEqual(expect.objectContaining({ outcome: 'blocked', reasonCode: 'outline-unavailable' }));
			tables.CFF2 = {};
			const cff = inspect('GPOS', (ctx) => validateAdvancedLayout(layout(st, 3), ctx), tables);
			expect(cff.checks).toContainEqual(expect.objectContaining({ outcome: 'unsupported', reasonCode: 'unsupported-semantics' }));
		});
		it('bounds shared DAG depth even after caching, and rejects cycles and missing components', () => {
			const tables = nestedOutlines();
			expect(() => inspect('GDEF', (ctx) => {
				expect(outlinePointCount(2, ctx, 'first')).toBe(4);
				outlinePointCount(3, ctx, 'second');
			}, tables, { maxStructureDepth: 2 })).toThrow(/maxStructureDepth/);
			tables.glyf.glyphs[2].components[0].glyphIndex = 3;
			expect(codes(inspect('GDEF', (ctx) => outlinePointCount(3, ctx, 'cycle'), tables).issues)).toContain('ADVANCED_STRUCTURE_CYCLE');
			tables.glyf.glyphs[2].components[0].glyphIndex = 99;
			expect(codes(inspect('GDEF', (ctx) => outlinePointCount(3, ctx, 'missing'), tables).issues)).toContain('ADVANCED_GLYPH_REFERENCE_INVALID');
			expect(() => inspect('GDEF', (ctx) => outlinePointCount(3, ctx, 'limit'), nestedOutlines(),
				{ maxStructureNodes: 3 })).toThrow(/maxStructureNodes/);
		});
	});

	describe('derived repair diagnosis coverage', () => {
		it('reports passing derived scopes for consistent authoritative values', () => {
			const tables = core();
			for (const glyph of tables.glyf.glyphs) Object.assign(glyph, { xMin: 0, yMin: 0, xMax: 10, yMax: 0 });
			const bytes = ttBytes(tables);
			new DataView(bytes.head.buffer).setInt16(40, 10);
			const m = new DataView(bytes.maxp.buffer); m.setUint16(6, 2); m.setUint16(8, 1);
			for (const axis of ['h', 'v']) {
				const header = new DataView(bytes[`${axis}hea`].buffer);
				header.setUint16(10, 100); header.setInt16(14, axis === 'h' ? 90 : 100);
				header.setInt16(16, axis === 'h' ? 10 : 0);
			}
			const report = diagnoseFont(font(bytes));
			for (const scope of ['tt.bounds', 'tt.maxp-geometry', 'hhea.extrema', 'vhea.extrema'])
				expect(report.checks).toContainEqual(expect.objectContaining({ id: `binary.derived.${scope}`, outcome: 'passed' }));
		});
		it('routes each derived finding into its executed per-face scope without changing input', () => {
			const bytes = font(ttBytes()), copy = bytes.slice(0), report = diagnoseFont(bytes);
			for (const [scope, code] of [
				['tt.bounds', 'TT_DERIVED_BOUNDS_MISMATCH'], ['tt.maxp-geometry', 'TT_DERIVED_MAXP_MISMATCH'],
				['hhea.extrema', 'HHEA_DERIVED_EXTREMA_MISMATCH'], ['vhea.extrema', 'VHEA_DERIVED_EXTREMA_MISMATCH'],
			]) {
				expect(report.issues).toContainEqual(expect.objectContaining({ code, executionId: `binary.derived.${scope}` }));
				expect(report.checks).toContainEqual(expect.objectContaining({ id: `binary.derived.${scope}`, outcome: 'failed', coverage: 'partial' }));
			}
			expect(report.checks).toContainEqual(expect.objectContaining({ id: 'binary.derived.cff.maxp', outcome: 'skipped' }));
			expect(new Uint8Array(bytes)).toEqual(new Uint8Array(copy));
		});
		it('does not turn blocked prerequisites or unsupported geometry into empty passing checks', () => {
			const missing = ttBytes(); delete missing.loca;
			const blocked = diagnoseFont(font(missing));
			expect(blocked.checks.find((check) => check.id === 'binary.derived.tt.bounds').outcome).toBe('blocked');
			const variable = diagnoseFont(font({ ...ttBytes(), gvar: [0] }));
			expect(variable.checks.find((check) => check.id === 'binary.derived.tt.bounds').outcome).toBe('unsupported');
		});
		it('checks CFF counts only when the source programs are supported', () => {
			const cff = (program) => writeCFF({ names: ['Derived'], globalSubrs: [], fonts: [{ topDict: {}, charStrings: [program] }] });
			const good = diagnoseFont(font({ 'CFF ': cff([14]), maxp: maxp() }));
			expect(good.issues).toContainEqual(expect.objectContaining({ code: 'CFF_DERIVED_MAXP_MISMATCH', executionId: 'binary.derived.cff.maxp' }));
			const bad = diagnoseFont(font({ 'CFF ': cff([0]), maxp: maxp() }));
			expect(['blocked', 'unsupported']).toContain(bad.checks.find((check) => check.id === 'binary.derived.cff.maxp').outcome);
		});
		it('blocks every derived scope when a duplicate tag makes the payload map ambiguous', () => {
			const bytes = font({ maxp: maxp(), zzzz: [] });
			new Uint8Array(bytes).set(new TextEncoder().encode('maxp'), 28);
			const report = diagnoseFont(bytes);
			expect(report.checks.filter((check) => check.id.startsWith('binary.derived.') &&
				check.reasonCode === 'payload-map-incomplete')).toHaveLength(5);
		});
		it('keeps derived findings and coverage separate for every collection face', () => {
			const face = new Uint8Array(font(ttBytes())), length = face.length;
			const bytes = new Uint8Array(20 + 2 * length), view = new DataView(bytes.buffer);
			bytes.set(new TextEncoder().encode('ttcf')); view.setUint32(4, 0x10000); view.setUint32(8, 2);
			for (let i = 0; i < 2; i++) {
				const start = 20 + i * length; view.setUint32(12 + i * 4, start); bytes.set(face, start);
				for (let j = 0; j < view.getUint16(start + 4); j++) {
					const at = start + 12 + j * 16 + 8;
					view.setUint32(at, view.getUint32(at) + start);
				}
			}
			const report = diagnoseFont(bytes.buffer);
			expect(report.faces).toHaveLength(2);
			for (const result of report.faces) {
				expect(result.issues).toContainEqual(expect.objectContaining({ code: 'TT_DERIVED_BOUNDS_MISMATCH' }));
				expect(result.checks).toContainEqual(expect.objectContaining({ id: 'binary.derived.tt.bounds', outcome: 'failed' }));
			}
		});
	});
	it('locates nested actions precisely and deterministically without mutating bytes', () => {
		const st = contextual(); st.seqLookupRecords[0] = { sequenceIndex: 1, lookupListIndex: 5 };
		const bytes = font({ GSUB: writeGSUB(layout({ format: 1, extensionLookupType: 6, subtable: st }, 7)), maxp: maxp() });
		const copy = bytes.slice(0), a = diagnoseFont(bytes), b = diagnoseFont(bytes);
		const errors = a.issues.filter((issue) => issue.code === 'LAYOUT_GRAPH_REFERENCE_INVALID');
		expect(errors).toHaveLength(2);
		// The production parser intentionally unwraps one Extension layer.
		expect(errors[0].location.path).toContain('.subtables.0.seqLookupRecords.0.sequenceIndex');
		expect(a.issues.map((issue) => issue.id)).toEqual(b.issues.map((issue) => issue.id));
		expect(new Uint8Array(bytes)).toEqual(new Uint8Array(copy));
	});
	it('checks nested class matrices and parallel output arrays', () => {
		const pair = { format: 2, coverage: coverage(1), class1Count: 1, class2Count: 1,
			classDef1: { format: 1, startGlyphID: 1, classValues: [2] },
			classDef2: { format: 1, startGlyphID: 2, classValues: [0] }, class1Records: [[{}]] };
		const result = inspect('GPOS', (ctx) => validateAdvancedLayout(layout({ format: 1, extensionLookupType: 2, subtable: pair }, 9), ctx));
		expect(codes(result.issues)).toContain('LAYOUT_GRAPH_REFERENCE_INVALID');
		const single = layout({ format: 2, coverage: coverage(1, 2), substituteGlyphIDs: [1] }, 1);
		expect(codes(inspect('GSUB', (ctx) => validateAdvancedLayout(single, ctx)).issues)).toContain('ADVANCED_PARALLEL_ARRAY_MISMATCH');
	});
	it('validates mark classes, glyph targets and Device variation references in parsed GPOS', () => {
		const data = layout({ format: 1, coverage: coverage(1), valueFormat: 0x10,
			valueRecord: { xPlaDevice: { format: 0x8000, deltaSetOuterIndex: 3, deltaSetInnerIndex: 1 } } }, 1);
		const report = diagnoseFont(font({ GPOS: writeGPOS(data), maxp: maxp() }));
		expect(codes(report.issues)).toContain('ADVANCED_VARIATION_REFERENCE_INVALID');
	});
	it('rejects extension object cycles and enforces a finite work budget', () => {
		const sub = { format: 1, extensionLookupType: 7 }; sub.subtable = sub;
		expect(codes(inspect('GSUB', (ctx) => validateAdvancedLayout(layout(sub, 7), ctx)).issues)).toContain('LAYOUT_EXTENSION_CYCLE');
		expect(() => inspect('GSUB', (ctx) => validateAdvancedLayout(layout(contextual(), 6), ctx), core(), { maxStructureNodes: 1 })).toThrow(/maxStructureNodes/);
	});
	it('checks GDEF attachment and caret points against the actual glyph', () => {
		const data = { attachList: { coverage: coverage(1), attachPoints: [[0, 2]] },
			ligCaretList: { coverage: coverage(2), ligGlyphs: [[{ format: 2, caretValuePointIndex: 1 }]] } };
		expect(codes(inspect('GDEF', (ctx) => validateAdvancedGdef(data, ctx)).issues)).toEqual(['GDEF_POINT_REFERENCE_INVALID']);
	});
	it('uses the parser’s retained F2DOT14 integer units for feature conditions', () => {
		const data = layout({ format: 1, coverage: coverage(1), deltaGlyphID: 0 }, 1);
		data.featureVariations = { featureVariationRecords: [{
			conditionSet: { conditions: [{ format: 1, axisIndex: 0, filterRangeMinValue: 8192, filterRangeMaxValue: 16384 }] },
		}] };
		expect(inspect('GSUB', (ctx) => validateAdvancedLayout(data, ctx)).issues).toEqual([]);
		data.featureVariations.featureVariationRecords[0].conditionSet.conditions[0].filterRangeMaxValue++;
		expect(codes(inspect('GSUB', (ctx) => validateAdvancedLayout(data, ctx)).issues)).toEqual(['LAYOUT_VARIATION_CONDITION_INVALID']);
	});
});

describe('advanced CFF and TrueType programs', () => {
	it('checks full INDEX spans independently of permissive parser slices', () => {
		const table = { names: ['Original'], fonts: [{ topDict: {}, charset: [1, 2, 3], charStrings: [[14], [14], [14], [14]], localSubrs: [] }], globalSubrs: [] };
		const raw = Uint8Array.from(writeCFF(table));
		expect(inspect('CFF ', (ctx) => validateCffStructures(raw, table, ctx)).issues).toEqual([]);
		const corrupt = raw.slice(); corrupt[7] = 0;
		expect(() => inspect('CFF ', (ctx) => validateCffStructures(corrupt, table, ctx))).toThrow(/INDEX/);
	});
	it('checks FDSelect range sentinels independently of the codec that discards them', () => {
		const raw = new Uint8Array(88);
		raw.set([1, 0, 4, 4, 0, 1, 1, 1, 2, 65]);
		const dict = [28, 0, 50, 17, 28, 0, 70, 12, 36, 28, 0, 80, 12, 37];
		raw.set([0, 1, 1, 1, dict.length + 1, ...dict], 10);
		raw.set([0, 4, 1, 1, 2, 3, 4, 5, 14, 14, 14, 14], 50);
		raw.set([0, 1, 1, 1, 1], 70);
		raw.set([3, 0, 1, 0, 0, 0, 0, 4], 80);
		expect(inspect('CFF ', (ctx) => validateCffStructures(raw, {}, ctx)).issues).toEqual([]);
		raw[87] = 5;
		expect(() => inspect('CFF ', (ctx) => validateCffStructures(raw, {}, ctx))).toThrow(/FDSelect ranges/);
		const report = diagnoseFont(font({ 'CFF ': raw }));
		expect(report.checks.find((check) => check.id === 'binary.preflight.CFF .storage').outcome).toBe('blocked');
	});
	it.each([
		[10, [-100, -7], [-107]], [11, [7, 3], [4]], [24, [3, 4], [12]],
		[12, [12, 3], [4]], [26, [9], [3]], [27, [9], [9, 9]],
		[29, [10, 20, 0], [10, 20, 20]], [30, [1, 2, 3, 3, 1], [3, 1, 2]],
		[22, [10, 20, 1, 2], [10]],
	])('evaluates deterministic CFF operator %s', (op, stack, expected) => {
		const ctx = { stack: [...stack] }, errors = [];
		expect(executeCffArithmetic(op, ctx, (...args) => errors.push(args), 'test')).toBe(true);
		expect(ctx.stack).toEqual(expected); expect(errors).toEqual([]);
	});
	it('bounds transient storage and reports random execution as unknown', () => {
		const ctx = { stack: [8, 31] }, errors = [];
		executeCffArithmetic(20, ctx, (...args) => errors.push(args), 'test');
		ctx.stack.push(31); executeCffArithmetic(21, ctx, (...args) => errors.push(args), 'test');
		expect(ctx.stack).toEqual([8]);
		ctx.stack.push(32); expect(executeCffArithmetic(21, ctx, (...args) => errors.push(args), 'test')).toBe(false);
		expect(errors[0][0]).toBe('CFF_ARITHMETIC_OPERAND_INVALID');
		expect(executeCffArithmetic(23, ctx, () => {}, 'test')).toBeNull();
	});
	it('rejects malformed drawing cardinality, but accepts valid rcurveline', () => {
		const test = (program) => {
			const issues = [];
			_internal.validateCffCharStrings({ fonts: [{ charStrings: [program] }] }, 'CFF', issues);
			return codes(issues);
		};
		expect(test([139, 5, 14])).toContain('CFF_INVALID_OPERAND_COUNT');
		expect(test([...new Array(8).fill(139), 24, 14])).toEqual([]);
	});
	it('allows IDEF in prep and conditional function definitions; skips pushed control bytes', () => {
		const tables = core();
		tables.prep = { instructions: [0xb0, 0x91, 0x89, 0xb0, 0x1b, 0x2d] };
		tables.fpgm = { instructions: [0xb0, 1, 0x58, 0xb0, 1, 0x2c, 0x2d, 0x59] };
		expect(inspect('glyf', (ctx) => validateAdvancedTrueType(tables, ctx), tables).issues).toEqual([]);
		const raw = font({ prep: tables.prep.instructions });
		expect(codes(diagnoseFont(raw).issues)).not.toContain('TT_INSTR_STRAY_ENDF');
	});
	it('finds duplicate ELSE and definitions crossing control flow', () => {
		const tables = core();
		tables.prep = { instructions: [0x58, 0x1b, 0x1b, 0x59, 0x2c, 0x58, 0x2d] };
		expect(codes(inspect('glyf', (ctx) => validateAdvancedTrueType(tables, ctx), tables).issues))
			.toEqual(['TT_INSTR_ELSE_INVALID', 'TT_INSTR_DEFINITION_SCOPE_INVALID']);
	});
	it('checks point attachment order, conflicting transform flags and maxp', () => {
		const tables = core(); tables.maxp.maxCompositePoints = 1;
		tables.glyf.glyphs[3] = { type: 'composite', components: [
			{ glyphIndex: 1, argument1: 0, argument2: 2, flags: { scaledComponentOffset: true, unscaledComponentOffset: true } },
		] };
		const result = inspect('glyf', (ctx) => validateAdvancedTrueType(tables, ctx), tables);
		expect(codes(result.issues)).toEqual(['GLYF_ATTACHMENT_POINT_INVALID', 'GLYF_COMPONENT_FLAGS_CONFLICT', 'GLYF_MAXP_LIMIT_EXCEEDED']);
	});
});

describe('advanced variations', () => {
	it('checks interior multi-axis regions without claiming interpolation samples', () => {
		expect(inspect('HVAR', (ctx) => validateAdvancedStore(store(), ctx)).issues).toEqual([]);
		const bad = store(); bad.variationRegionList.regions[0].regionAxes[0].startCoord = -0.5;
		expect(codes(inspect('HVAR', (ctx) => validateAdvancedStore(bad, ctx)).issues)).toEqual(['VARIATION_REGION_INVALID']);
	});
	it('checks region indices, word counts and delta row cardinality', () => {
		const data = store(); Object.assign(data.itemVariationData[0], { wordDeltaCount: 2, regionIndexes: [1], deltaSets: [[1, 2]] });
		const result = inspect('HVAR', (ctx) => validateAdvancedStore(data, ctx));
		expect(codes(result.issues)).toEqual(['ADVANCED_PARALLEL_ARRAY_MISMATCH', 'VARIATION_WORD_DELTA_COUNT_INVALID',
			'VARIATION_REGION_REFERENCE_INVALID', 'ADVANCED_PARALLEL_ARRAY_MISMATCH']);
	});
	it('requires CFF2 variation stores to select regions without embedded deltas', () => {
		const data = store();
		expect(codes(inspect('CFF2', (ctx) => validateAdvancedStore(data, ctx)).issues)).toEqual(['CFF_VARIATION_CONTEXT_INVALID']);
		Object.assign(data.itemVariationData[0], { itemCount: 0, deltaSets: [] });
		expect(inspect('CFF2', (ctx) => validateAdvancedStore(data, ctx)).issues).toEqual([]);
	});
	it('checks explicit and implicit metric delta references', () => {
		const value = { itemVariationStore: store(), advanceWidthMapping: {
			format: 0, entryFormat: 0, mapCount: 1, entries: [{ outerIndex: 1, innerIndex: 0 }],
		} };
		expect(codes(inspect('HVAR', (ctx) => validateAdvancedVariation(value, null, ctx)).issues)).toContain('ADVANCED_VARIATION_REFERENCE_INVALID');
		delete value.advanceWidthMapping;
		expect(inspect('HVAR', (ctx) => validateAdvancedVariation(value, null, ctx)).issues).toEqual([]);
		value.itemVariationStore.itemVariationData[0] = null;
		expect(inspect('HVAR', (ctx) => validateAdvancedVariation(value, null, ctx)).issues).toEqual([]);
	});
	it('checks gvar component/phantom point references and normalized tuple bounds', () => {
		const tuple = { peakTuple: [0.5, -0.5], pointIndices: [0, 5], xDeltas: [0, 1], yDeltas: [0, 1] };
		const value = { axisCount: 2, sharedTuples: [], glyphVariationData: [[tuple], [], [], []] };
		expect(inspect('gvar', (ctx) => validateAdvancedVariation(value, null, ctx)).issues).toEqual([]);
		tuple.pointIndices = [5, 6]; tuple.peakTuple[0] = 1.5;
		const result = inspect('gvar', (ctx) => validateAdvancedVariation(value, null, ctx));
		expect(codes(result.issues)).toEqual(['VARIATION_TUPLE_COORDINATE_INVALID', 'VARIATION_POINT_REFERENCE_INVALID']);
	});
	it('checks cvar CVT cardinality and opaque map versions explicitly', () => {
		const tables = core(); tables['cvt '] = { values: [0, 1] };
		const value = { tupleVariations: [{ peakTuple: [0, 1], pointIndices: null, deltas: [2] }] };
		expect(codes(inspect('cvar', (ctx) => validateAdvancedVariation(value, null, ctx), tables).issues)).toContain('ADVANCED_PARALLEL_ARRAY_MISMATCH');
		const report = inspect('HVAR', (ctx) => validateAdvancedVariation({ advanceWidthMapping: { format: 9 } }, null, ctx));
		expect(report.checks[0].outcome).toBe('unsupported');
	});
	it('checks packed tuple boundaries, shared tuple references and oversized delta runs independently', () => {
		const raw = Uint8Array.from([0, 1, 0, 8, 0, 2, 0, 0, 0x85, 0x85]);
		expect(inspect('gvar', (ctx) => validateTupleBytes(raw, 2, 6, 1, false, ctx, 'tuple')).issues).toEqual([]);
		expect(codes(inspect('gvar', (ctx) => validateTupleBytes(raw, 2, 6, 0, false, ctx, 'tuple')).issues))
			.toEqual(['VARIATION_SHARED_TUPLE_INVALID']);
		raw[8] = 0x86;
		expect(() => inspect('gvar', (ctx) => validateTupleBytes(raw, 2, 6, 1, false, ctx, 'tuple'))).toThrow(/run exceeds/);
		raw[8] = 0x85; raw[5] = 1;
		expect(() => inspect('gvar', (ctx) => validateTupleBytes(raw, 2, 6, 1, false, ctx, 'tuple'))).toThrow(/tuple boundary/);
	});
});

describe('metadata binary hook', () => {
	it('emits metadata findings through per-face coverage and retains blocked derived prerequisites', () => {
		const bytes = writeName({ version: 0, names: [
			{ platformID: 3, encodingID: 1, languageID: 0x409, nameID: 6, value: ' Bad Name ' },
		] });
		const report = diagnoseFont(font({ name: bytes }));
		const issue = report.issues.find((item) => item.code === 'QUALITY_POSTSCRIPT_NAME_INVALID');
		expect(issue).toMatchObject({ executionId: 'binary.metadata', source: 'original-bytes',
			location: { table: 'name', nameID: 6 } });
		expect(report.checks.find((check) => check.id === 'binary.metadata')).toMatchObject({ outcome: 'failed', coverage: 'partial' });
		expect(report.checks.find((check) => check.id === 'binary.metadata.os2.average-width').outcome).toBe('blocked');
	});
	it('does not advertise a metadata pass for unreadable dependencies', () => {
		const report = diagnoseFont(font({ name: [0, 0, 0] }));
		expect(report.checks.find((check) => check.id === 'binary.metadata.prerequisites')).toMatchObject({
			outcome: 'blocked', reasonCode: 'table-not-parsed',
		});
		expect(report.checks.find((check) => check.id === 'binary.metadata').coverage).toBe('partial');
	});
});

describe('advanced color and image representations', () => {
	it('parses variable COLR stores and checks valid shared paints', () => {
		const solid = { format: 3, paletteIndex: 0xffff, alpha: 1, varIndexBase: 0 };
		const data = { version: 1, baseGlyphRecords: [], layerRecords: [],
			baseGlyphPaintRecords: [{ glyphID: 1, paint: { format: 32, compositeMode: 3, sourcePaint: solid, backdropPaint: solid } }],
			itemVariationStore: store() };
		const parsed = parseCOLR(writeCOLR(data));
		expect(parsed.itemVariationStore.itemVariationData[0].itemCount).toBe(6);
		expect(inspect('COLR', (ctx) => validateAdvancedColor(parsed, null, ctx)).issues).toEqual([]);
	});
	it('finds indirect paint cycles and missing palette/glyph targets', () => {
		const data = { baseGlyphRecords: [], layerRecords: [{ glyphID: 8, paletteIndex: 0 }],
			baseGlyphPaintRecords: [{ glyphID: 1, paint: { format: 11, glyphID: 1 } }] };
		const result = inspect('COLR', (ctx) => validateAdvancedColor(data, null, ctx));
		expect(codes(result.issues)).toEqual(['ADVANCED_GLYPH_REFERENCE_INVALID', 'COLOR_PALETTE_REFERENCE_INVALID', 'COLR_PAINT_CYCLE']);
	});
	it('reports unknown paint formats and enforces depth', () => {
		const data = { baseGlyphPaintRecords: [{ glyphID: 1, paint: { format: 99 } }] };
		expect(inspect('COLR', (ctx) => validateAdvancedColor(data, null, ctx)).checks[0].outcome).toBe('unsupported');
		data.baseGlyphPaintRecords[0].paint = { format: 10, glyphID: 1, paint: { format: 2, paletteIndex: 0xffff, alpha: 1 } };
		expect(() => inspect('COLR', (ctx) => validateAdvancedColor(data, null, ctx), core(), { maxStructureDepth: 1 })).toThrow(/maxStructureDepth/);
	});
	it('checks CPAL metadata in the actual binary pipeline', () => {
		const bytes = writeCPAL({ version: 1, numPaletteEntries: 1, palettes: [[{ red: 0, green: 0, blue: 0, alpha: 255 }]], paletteTypes: [4] });
		expect(codes(diagnoseFont(font({ CPAL: bytes })).issues)).toContain('CPAL_METADATA_INVALID');
	});
	it('checks SVG ranges and source byte spans but never executes XML', () => {
		const svg = { version: 0, documents: [{ compressed: false, text: '<svg><script>throw 1</script></svg>' }],
			entries: [{ startGlyphID: 2, endGlyphID: 1, documentIndex: 0 }] };
		const bytes = Uint8Array.from(writeSVG(svg));
		const report = diagnoseFont(font({ 'SVG ': bytes, maxp: maxp() }));
		expect(codes(report.issues)).toContain('SVG_DOCUMENT_RANGE_INVALID');
		expect(report.checks.some((check) => check.outcome === 'unsupported' && check.id.endsWith('.documents'))).toBe(true);
		new DataView(bytes.buffer).setUint32(20, 0xffffffff);
		expect(codes(diagnoseFont(font({ 'SVG ': bytes, maxp: maxp() })).issues)).toContain('ADVANCED_STRUCTURE_INVALID');
	});
	it('checks PNG structure, dimensions and truncation without inflating pixels', () => {
		expect(inspect('CBDT', (ctx) => inspectPng(png(), { width: 1, height: 1 }, ctx, 'image')).issues).toEqual([]);
		expect(codes(inspect('CBDT', (ctx) => inspectPng(png(), { width: 2, height: 1 }, ctx, 'image')).issues)).toContain('BITMAP_IMAGE_METRICS_MISMATCH');
		expect(codes(inspect('CBDT', (ctx) => inspectPng(png().slice(0, 12), null, ctx, 'image')).issues)).toContain('BITMAP_PNG_INVALID');
		expect(() => inspect('CBDT', (ctx) => inspectPng(png().slice(0, 40), null, ctx, 'image'))).toThrow(/Truncated/);
	});
	it('checks sbix duplicates, cycles and unsupported codecs across mixed strikes', () => {
		const value = { version: 1, flags: 1, strikes: [{ ppem: 16, ppi: 72, glyphs: [
			{ graphicType: 'png ', imageData: [...png()] },
			{ graphicType: 'dupe', imageData: [0, 0] },
			{ graphicType: 'jpg ', imageData: [255, 216] }, null,
		] }] };
		const valid = diagnoseFont(font({ sbix: writeSbix(value), maxp: maxp() }));
		expect(valid.issues.filter((issue) => issue.executionId === 'binary.advanced.sbix')).toEqual([]);
		expect(valid.checks.some((check) => check.outcome === 'unsupported' && check.location.path?.includes('glyphs.2'))).toBe(true);
		value.strikes[0].glyphs[0] = { graphicType: 'dupe', imageData: [0, 1] };
		expect(codes(diagnoseFont(font({ sbix: writeSbix(value), maxp: maxp() })).issues)).toContain('BITMAP_REFERENCE_CYCLE');
	});
	it('checks packed bitmap lengths, sparse glyph ranges and missing data', () => {
		const value = { sizes: [{ ppemX: 16, ppemY: 16, bitDepth: 1, startGlyphIndex: 1, endGlyphIndex: 1,
			indexSubTables: [{ firstGlyphIndex: 1, lastGlyphIndex: 1, indexFormat: 2, imageFormat: 5, imageDataOffset: 4, imageSize: 1,
				bigMetrics: { width: 8, height: 1 } }] }] };
		const bytes = Uint8Array.from([0, 2, 0, 0, 255]);
		expect(inspect('EBLC', (ctx) => validateAdvancedBitmap(value, null, ctx, () => bytes)).issues).toEqual([]);
		value.sizes[0].indexSubTables[0].bigMetrics.width = 9;
		expect(codes(inspect('EBLC', (ctx) => validateAdvancedBitmap(value, null, ctx, () => bytes)).issues)).toContain('BITMAP_IMAGE_LENGTH_INVALID');
		expect(codes(inspect('EBLC', (ctx) => validateAdvancedBitmap(value, null, ctx, () => null)).issues)).toContain('BITMAP_DATA_TABLE_MISSING');
	});
});

describe('advanced specialist table versions', () => {
	it('checks MATH variants/assemblies against raw bytes and cross-table glyphs', () => {
		const bytes = mathBytes(), parsed = parseMATH(bytes);
		expect(inspect('MATH', (ctx) => validateAdvancedSpecialist(parsed, bytes, ctx)).issues).toEqual([]);
		const report = diagnoseFont(font({ MATH: bytes, maxp: maxp() }));
		expect(report.issues.filter((issue) => issue.executionId === 'binary.advanced.MATH')).toEqual([]);
		new DataView(bytes.buffer).setUint16(254, 9);
		new DataView(bytes.buffer).setUint16(266, 51);
		const bad = inspect('MATH', (ctx) => validateAdvancedSpecialist(parsed, bytes, ctx));
		expect(codes(bad.issues)).toEqual(['ADVANCED_GLYPH_REFERENCE_INVALID', 'MATH_ASSEMBLY_PART_INVALID']);
	});
	it('does not silently certify opaque truncated MATH subtables', () => {
		const bytes = mathBytes().slice(0, 270);
		expect(codes(diagnoseFont(font({ MATH: bytes, maxp: maxp() })).issues)).toContain('ADVANCED_STRUCTURE_INVALID');
	});
	it('checks BASE default baseline, coordinate point and variation references', () => {
		const base = { majorVersion: 1, minorVersion: 1, horizAxis: { baseTagList: ['romn'], baseScriptList: [{
			tag: 'latn', baseValues: { defaultBaselineIndex: 1, baseCoords: [{ format: 2, coordinate: 0, referenceGlyph: 1, baseCoordPoint: 9 }] },
			langSystems: [],
		}] }, itemVariationStore: store() };
		const raw = Uint8Array.from(writeBASE(base)), parsed = parseBASE(raw);
		expect(codes(inspect('BASE', (ctx) => validateAdvancedSpecialist(parsed, raw, ctx)).issues))
			.toEqual(['BASE_DEFAULT_BASELINE_INVALID', 'BASE_POINT_REFERENCE_INVALID']);
	});
	it('checks JSTF lookup references and accepts a valid priority graph', () => {
		const raw = new Uint8Array(46), v = new DataView(raw.buffer);
		v.setUint16(0, 1); v.setUint16(4, 1); raw.set(new TextEncoder().encode('latn'), 6); v.setUint16(10, 12);
		v.setUint16(14, 6); v.setUint16(18, 1); v.setUint16(20, 4); v.setUint16(22, 20); v.setUint16(42, 1);
		const tables = core(); tables.GSUB = layout({ format: 1, coverage: coverage(1), deltaGlyphID: 0 }, 1);
		expect(inspect('JSTF', (ctx) => validateAdvancedSpecialist({}, raw, ctx), tables).issues).toEqual([]);
		v.setUint16(44, 1);
		expect(codes(inspect('JSTF', (ctx) => validateAdvancedSpecialist({}, raw, ctx), tables).issues)).toEqual(['JSTF_LOOKUP_REFERENCE_INVALID']);
	});
	it('checks MERG reserved flags but preserves its valid unmerged class convention', () => {
		const raw = new Uint8Array(24), v = new DataView(raw.buffer);
		v.setUint16(2, 2); v.setUint16(4, 10); v.setUint16(6, 1); v.setUint16(8, 14); v.setUint16(14, 16);
		v.setUint16(16, 1); v.setUint16(20, 1); v.setUint16(22, 10);
		expect(inspect('MERG', (ctx) => validateAdvancedSpecialist({}, raw, ctx)).issues).toEqual([]);
		raw[10] = 128;
		expect(codes(inspect('MERG', (ctx) => validateAdvancedSpecialist({}, raw, ctx)).issues)).toEqual(['MERG_ENTRY_FLAGS_INVALID']);
	});
	it.each(['MATH', 'BASE', 'JSTF', 'MERG', 'COLR', 'CPAL', 'gvar'])('tracks %s versions separately as unsupported', (tag) => {
		const issues = []; trackDiagnosticIssues(issues);
		runAdvancedDiagnostics({ [tag]: { version: 99, majorVersion: 99, minorVersion: 0 } },
			[{ tag, offset: 0, length: 4 }], new ArrayBuffer(4), issues);
		expect(diagnosticState(issues).checks.find((check) => check.id === `binary.advanced.${tag}`))
			.toMatchObject({ outcome: 'unsupported', reasonCode: 'unsupported-version' });
	});
	it('marks budget exhaustion partial without throwing out other groups', () => {
		const bytes = font({ GSUB: writeGSUB(layout({ format: 2, coverage: coverage(1), substituteGlyphIDs: [1] }, 1)),
			CPAL: writeCPAL({ version: 0, numPaletteEntries: 1, palettes: [[{ red: 0, green: 0, blue: 0, alpha: 255 }]] }) });
		const report = diagnoseFont(bytes, { maxStructureNodes: 1 });
		expect(codes(report.issues)).toContain('DIAGNOSTIC_LIMIT_EXCEEDED');
		expect(report.complete).toBe(false);
		expect(report.checks.some((check) => check.id === 'binary.advanced.CPAL')).toBe(true);
	});
});
