import { describe, expect, it } from 'vitest';
import * as hb from 'harfbuzzjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildFormat4Data } from '../src/expand.js';
import { exportFont } from '../src/export.js';
import { FontFlux } from '../src/font_flux.js';
import { parseAvar } from '../src/sfnt/table_avar.js';
import { parseHVAR } from '../src/sfnt/table_HVAR.js';
import { writeBASE } from '../src/sfnt/table_BASE.js';
import { writeCPAL } from '../src/sfnt/table_CPAL.js';
import { writeGPOS } from '../src/sfnt/table_GPOS.js';
import { writeGSUB } from '../src/sfnt/table_GSUB.js';
import { writeSVG } from '../src/sfnt/table_SVG.js';
import { writeSbix } from '../src/sfnt/table_sbix.js';
import { writeINDEXv1 } from '../src/otf/cff_common.js';
import { writeCFF } from '../src/otf/table_CFF.js';
import { writeCFF2 } from '../src/otf/table_CFF2.js';
import { writeFvar } from '../src/sfnt/table_fvar.js';
import { writeCmap } from '../src/sfnt/table_cmap.js';
import { writeCOLR } from '../src/sfnt/table_COLR.js';
import { writeMaxp } from '../src/sfnt/table_maxp.js';
import { writeName } from '../src/sfnt/table_name.js';
import { writeSTAT } from '../src/sfnt/table_STAT.js';
import { writeGlyfComputeOffsets } from '../src/ttf/table_glyf.js';
import {
	applyExtendedRepair, EXTENDED_REPAIRS, extendedRepairReason, extendedSfntVersion, extendedTableChanges,
	inspectDerivedRepairCoverage, inspectDerivedRepairs, verifyExtendedRepairs,
} from '../src/validate/repair-extensions.js';
import { readCff } from '../src/validate/repair-cff.js';
import { readMetrics, readTT, view } from '../src/validate/repair-tt.js';
import { readFvar } from '../src/validate/repair-variable.js';

const clone = (tables) => new Map([...tables].map(([tag, bytes]) => [tag, bytes.slice()]));
const snapshot = (tables) => [...tables].map(([tag, bytes]) => [tag, Array.from(bytes)]);
const step = (id, values = {}) => ({ id, values });
const bounds = { xMin: -9, yMin: -9, xMax: -9, yMax: -9 };
function simple(instructions = [0xb0, 7]) {
	return { type: 'simple', ...bounds, instructions, overlapSimple: false, contours: [[
		{ x: 10, y: 20, onCurve: true }, { x: 110, y: 20, onCurve: false },
		{ x: 110, y: 120, onCurve: true },
	]] };
}
function component(glyphIndex, x, y, transform) {
	return { glyphIndex, argument1: x, argument2: y,
		flags: { argsAreWords: true, argsAreXYValues: true, unscaledComponentOffset: true,
			...(transform ? ('scale' in transform ? { weHaveAScale: true } :
				'scale01' in transform ? { weHaveATwoByTwo: true } : { weHaveAnXAndYScale: true }) : {}),
		},
		...(transform ? { transform } : {}),
	};
}
function ttFixture({ format = 0, hinted = true, glyphs } = {}) {
	const instructions = hinted ? [0xb0, 7] : [];
	glyphs ??= [
		simple(instructions), null,
		{ type: 'composite', ...bounds, instructions,
			components: [component(0, 20, 40, { scale: 1.5 })] },
		{ type: 'composite', ...bounds, instructions, components: [
			component(2, -10, -20),
			{ glyphIndex: 0, argument1: 1, argument2: 0, flags: { argsAreWords: true } },
		] },
		{ type: 'simple', ...bounds, contours: [], instructions, overlapSimple: false },
	];
	const encoded = writeGlyfComputeOffsets({ glyphs });
	const head = new Uint8Array(54);
	const h = view(head);
	h.setUint32(0, 0x10000);
	h.setUint32(12, 0x5f0f3cf5);
	h.setUint16(18, 1000);
	h.setInt16(50, format);
	const loca = new Uint8Array(encoded.offsets.length * (format ? 4 : 2));
	encoded.offsets.forEach((value, i) => {
		if (format) view(loca).setUint32(i * 4, value);
		else view(loca).setUint16(i * 2, value / 2);
	});
	const maxp = Uint8Array.from(writeMaxp({
		version: 0x10000, numGlyphs: glyphs.length,
		maxPoints: 99, maxContours: 99, maxCompositePoints: 99, maxCompositeContours: 99,
		maxZones: 2, maxTwilightPoints: 13, maxStorage: 17, maxFunctionDefs: 19,
		maxInstructionDefs: 23, maxStackElements: 29, maxSizeOfInstructions: 99,
		maxComponentElements: 99, maxComponentDepth: 99,
	}));
	const result = new Map([['head', head], ['maxp', maxp], ['glyf', Uint8Array.from(encoded.bytes)], ['loca', loca]]);
	for (const axis of ['h', 'v']) {
		const header = new Uint8Array(36);
		view(header).setUint32(0, 0x10000);
		const count = Math.min(2, glyphs.length);
		view(header).setUint16(34, count);
		const metrics = new Uint8Array(glyphs.length * 2 + count * 2);
		let pos = 0;
		for (let i = 0; i < glyphs.length; i++) {
			if (i < count) {
				view(metrics).setUint16(pos, (axis === 'h' ? 100 : 200) + i * (axis === 'h' ? 400 : 700));
				pos += 2;
			}
			view(metrics).setInt16(pos, (i + 1) * (axis === 'h' ? 10 : 5));
			pos += 2;
		}
		result.set(`${axis}hea`, header);
		result.set(`${axis}mtx`, metrics);
	}
	if (hinted) {
		result.set('fpgm', Uint8Array.of(0xb0, 7));
		result.set('prep', Uint8Array.of(0xb0, 8));
		result.set('cvt ', Uint8Array.of(0, 9));
	}
	return result;
}

function repair(before, steps, options) {
	const after = clone(before);
	for (const selected of steps) applyExtendedRepair(selected, after, options);
	const verification = verifyExtendedRepairs(before, after, steps, options);
	expect(verification.failures, JSON.stringify(verification.failures)).toEqual([]);
	return after;
}

function fontBytes(payloads) {
	return exportFont({
		header: { sfVersion: payloads.has('glyf') ? 0x10000 : 0x4f54544f },
		tables: Object.fromEntries([...payloads].map(([tag, data]) => [tag, { _raw: Array.from(data) }])),
	}, { format: 'sfnt' });
}

function fontPayloads(buffer) {
	const bytes = new Uint8Array(buffer), v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), result = new Map();
	for (let i = 0; i < v.getUint16(4); i++) {
		const at = 12 + i * 16, start = v.getUint32(at + 8);
		result.set(String.fromCharCode(...bytes.slice(at, at + 4)), bytes.slice(start, start + v.getUint32(at + 12)));
	}
	return result;
}

function shapePayloads(payloads, text, variations = []) {
	const bytes = fontBytes(payloads);
	const font = new hb.Font(new hb.Face(new hb.Blob(new Uint8Array(bytes))));
	font.setVariations(variations.map(([tag, value]) => new hb.Variation(tag, value)));
	const buffer = new hb.Buffer();
	buffer.addText(text);
	buffer.guessSegmentProperties();
	hb.shape(font, buffer);
	return { glyphs: buffer.getGlyphInfos(), positions: buffer.getGlyphPositions(),
		paths: buffer.getGlyphInfos().map((glyph) => font.glyphToPath(glyph.codepoint)) };
}

function addCmap(tables, mappings = [[32, 1], [65, 2], [66, 3]]) {
	tables.set('cmap', Uint8Array.from(writeCmap({
		version: 0, encodingRecords: [{ platformID: 3, encodingID: 1, subtableIndex: 0 }],
		subtables: [{ format: 4, language: 0, ...buildFormat4Data(mappings) }],
	})));
	return tables;
}

function addPost3(tables) {
	const bytes = new Uint8Array(32);
	view(bytes).setUint32(0, 0x30000);
	tables.set('post', bytes);
	return tables;
}

function conversionFixture(lineOnly = false) {
	const glyph = simple([]);
	if (lineOnly) glyph.contours[0].forEach((point) => { point.onCurve = true; });
	const tables = addPost3(addCmap(ttFixture({ hinted: false, glyphs: [glyph, structuredClone(glyph)] }), [[65, 1]]));
	view(tables.get('hmtx')).setInt16(6, 10);
	tables.delete('vhea'); tables.delete('vmtx');
	return repair(tables, [step('tt.bounds'), step('tt.maxp-geometry'), step('hhea.extrema')]);
}

function names() {
	return Uint8Array.from(writeName({
		version: 0,
		names: [2, 6, 17, 256, 257, 258, 259].map((nameID) => ({
			platformID: 3, encodingID: 1, languageID: 1033, nameID, value: `Name ${nameID}`,
		})),
	}));
}

function variableFixture() {
	const fvar = Uint8Array.from(writeFvar({
		axes: [
			{ axisTag: 'wght', minValue: 100, defaultValue: 400, maxValue: 900, axisNameID: 256, flags: 1 },
			{ axisTag: 'XTRA', minValue: -1, defaultValue: 0, maxValue: 1, axisNameID: 257 },
		],
		instances: [{ subfamilyNameID: 258, coordinates: [650, 0.5], postScriptNameID: 259 }],
	}));
	const stat = Uint8Array.from(writeSTAT({
		majorVersion: 1, minorVersion: 2, elidedFallbackNameID: 2,
		designAxes: [{ axisTag: 'wght', axisNameID: 256, axisOrdering: 0, _extra: [0xaa, 0xbb] }],
		axisValues: [
			{ format: 1, axisIndex: 0, flags: 2, valueNameID: 258, value: 400 },
			{ format: 2, axisIndex: 0, flags: 0, valueNameID: 258, nominalValue: 500, rangeMinValue: 450, rangeMaxValue: 550 },
			{ format: 3, axisIndex: 0, flags: 0, valueNameID: 258, value: 400, linkedValue: 700 },
			{ format: 4, flags: 0, valueNameID: 258, axisValues: [{ axisIndex: 0, value: 800 }] },
		],
	}));
	return new Map([
		['fvar', Uint8Array.from([...fvar, 0xab, 0xcd])],
		['STAT', Uint8Array.from([...stat, 0x12, 0x34])], ['name', names()],
		['OS/2', new Uint8Array(96)], ['gvar', Uint8Array.of(0x10, 0x20, 0x30)],
		['avar', Uint8Array.of(0x66)], ['MVAR', Uint8Array.of(0x77)],
		['ZZZZ', Uint8Array.of(0x88)],
	]);
}

function cffFixture(programs = [[14], [139, 139, 21, 239, 139, 5, 14]], cff2 = false) {
	const data = cff2 ? writeCFF2({
		charStrings: programs, globalSubrs: [], fontDicts: [{ fontDict: {}, privateDict: {}, localSubrs: [] }],
	}) : writeCFF({
		names: ['RepairTest'], strings: [], globalSubrs: [],
		fonts: [{ topDict: { FontBBox: [0, 0, 100, 100] }, charStrings: programs,
			charset: Array.from({ length: programs.length - 1 }, (_, i) => i + 1),
			encoding: 'Standard', privateDict: { defaultWidthX: 500 }, localSubrs: [] }],
	});
	const maxp = new Uint8Array(32);
	view(maxp).setUint32(0, 0x10000);
	view(maxp).setUint16(4, 17);
	maxp.set([0xaa, 0xbb, 0xcc, 0xdd], 6);
	const result = new Map([[cff2 ? 'CFF2' : 'CFF ', Uint8Array.from([...data, 0xde, 0xad])], ['maxp', maxp]]);
	if (!cff2 && programs.some((program) => !program.length)) {
		const parsed = readCff(result);
		const index = writeINDEXv1(programs.map((program) => Uint8Array.from(program)));
		const bytes = Uint8Array.from([...parsed.bytes, ...index]);
		view(bytes).setInt32(parsed.operand[0] + 1, parsed.bytes.length);
		result.set('CFF ', bytes);
	}
	return result;
}

describe('extended repair registry and transaction contract', () => {
	it('has complete immutable metadata and refuses unknown IDs everywhere', () => {
		expect(new Set(EXTENDED_REPAIRS.map((fix) => fix.id)).size).toBe(EXTENDED_REPAIRS.length);
		for (const fix of EXTENDED_REPAIRS) {
			expect(fix.revision).toBe(1);
			expect(fix.formats).toEqual(['sfnt']);
			expect(fix.prerequisites && fix.riskReason && fix.invariants.length && fix.affectedTables.length).toBeTruthy();
			expect(typeof fix.requiresRebuild).toBe('boolean');
			expect(Object.isFrozen(fix)).toBe(true);
		}
		expect(() => extendedRepairReason('unimplemented', new Map())).toThrow(/Unknown/);
		expect(() => applyExtendedRepair(step('unimplemented'), new Map())).toThrow(/Unknown/);
		expect(() => verifyExtendedRepairs(new Map(), new Map(), [step('unimplemented')])).toThrow(/Unknown/);
	});

	it('application and failed application never mutate original shared buffers', () => {
		const before = ttFixture();
		const original = snapshot(before);
		const candidate = new Map(before);
		applyExtendedRepair(step('tt.bounds'), candidate);
		expect(snapshot(before)).toEqual(original);
		const retained = snapshot(candidate);
		expect(() => applyExtendedRepair(step('tt.loca-format', { format: 'invented' }), candidate)).toThrow();
		expect(snapshot(candidate)).toEqual(retained);
		expect(extendedRepairReason('tt.bounds', before)).toBeNull();
		expect(snapshot(before)).toEqual(original);
	});
});

describe('derived TrueType geometry and metrics', () => {
	it.each([0, 1])('repairs transformed/point-attached/empty bounds with loca format %i', (format) => {
		const before = ttFixture({ format });
		const after = repair(before, [step('tt.bounds'), step('tt.maxp-geometry'), step('hhea.extrema'), step('vhea.extrema')]);
		const tt = readTT(after);
		expect(tt.geometry.map((glyph) => glyph.bounds)).toEqual([
			[10, 20, 110, 120], [0, 0, 0, 0], [35, 70, 185, 220],
			[25, 50, 275, 200], [0, 0, 0, 0],
		]);
		expect(tt.glyphs[4]).toMatchObject({ xMin: 0, yMin: 0, xMax: 0, yMax: 0 });
		expect([36, 38, 40, 42].map((offset) => view(after.get('head')).getInt16(offset))).toEqual([10, 20, 275, 220]);
		expect([6, 8, 10, 12, 26, 28, 30].map((offset) => view(after.get('maxp')).getUint16(offset))).toEqual([3, 1, 6, 2, 2, 2, 2]);
		expect(after.get('maxp').slice(14, 26)).toEqual(before.get('maxp').slice(14, 26));
		expect([10, 12, 14, 16].map((offset, i) => i ? view(after.get('hhea')).getInt16(offset) : view(after.get('hhea')).getUint16(offset))).toEqual([500, 10, -10, 290]);
		expect(after.get('hmtx')).toEqual(before.get('hmtx'));
		expect(after.get('vmtx')).toEqual(before.get('vmtx'));
		expect(after.get('loca')).toEqual(before.get('loca'));
		expect(tt.glyphs[2].instructions).toEqual([0xb0, 7]);
		expect(inspectDerivedRepairs(after)).toEqual([]);
	});

	it('reports derived inconsistencies without claiming unavailable variable bounds', () => {
		const tables = ttFixture();
		expect(inspectDerivedRepairs(tables).map((issue) => issue.code)).toEqual(expect.arrayContaining([
			'TT_DERIVED_BOUNDS_MISMATCH', 'TT_DERIVED_MAXP_MISMATCH',
			'HHEA_DERIVED_EXTREMA_MISMATCH', 'VHEA_DERIVED_EXTREMA_MISMATCH',
		]));
		tables.set('gvar', Uint8Array.of(0));
		expect(extendedRepairReason('tt.bounds', tables)).toMatch(/variable/);
		expect(inspectDerivedRepairs(tables).map((issue) => issue.code)).toEqual(['TT_DERIVED_MAXP_MISMATCH']);
		expect(inspectDerivedRepairCoverage(tables).find((scope) => scope.id === 'tt.bounds'))
			.toMatchObject({ outcome: 'unsupported', reason: expect.stringMatching(/variable/) });
		expect(inspectDerivedRepairCoverage(tables).find((scope) => scope.id === 'tt.maxp-geometry'))
			.toMatchObject({ outcome: 'checked' });
		tables.delete('maxp');
		expect(inspectDerivedRepairCoverage(tables).find((scope) => scope.id === 'tt.maxp-geometry'))
			.toMatchObject({ outcome: 'blocked', reason: expect.stringMatching(/truncated|maxp/) });
		expect(inspectDerivedRepairCoverage(new Map()).every((scope) => scope.outcome === 'skipped')).toBe(true);
	});

	it('conservatively encloses fractional transformed control points', () => {
		const glyphs = [simple([]), { type: 'composite', ...bounds, instructions: [],
			components: [component(0, 0, 0, { scale: 0.33331298828125 })] }];
		const after = repair(ttFixture({ glyphs, hinted: false }), [step('tt.bounds')]);
		expect(readTT(after).geometry[1].bounds).toEqual([3, 6, 37, 40]);
	});

	it('handles zero-byte empty component children without inventing contours', () => {
		const glyphs = [null, { type: 'composite', ...bounds, instructions: [], components: [component(0, 100, 200)] }];
		const after = repair(ttFixture({ glyphs, hinted: false }), [step('tt.bounds'), step('tt.maxp-geometry')]);
		expect(readTT(after).geometry[1].bounds).toEqual([0, 0, 0, 0]);
	});

	it('rejects cycles, missing components, ambiguous transform offsets, and overflow atomically', () => {
		for (const selected of [
			component(1, 0, 0), component(25, 0, 0),
			{ ...component(0, 2, 3, { scale: 1.5 }), flags: { argsAreWords: true, argsAreXYValues: true, weHaveAScale: true } },
			component(0, 32767, 32767),
		]) {
			const tables = ttFixture({ glyphs: [simple([]), { type: 'composite', ...bounds, instructions: [], components: [selected] }], hinted: false });
			const original = snapshot(tables);
			expect(extendedRepairReason('tt.bounds', tables)).not.toBeNull();
			expect(() => applyExtendedRepair(step('tt.bounds'), tables)).toThrow();
			expect(snapshot(tables)).toEqual(original);
		}
	});

	it('enforces bounded expansion and exact representable extrema', () => {
		const tables = ttFixture();
		expect(extendedRepairReason('tt.bounds', tables, { maxRepairPoints: 3 })).toMatch(/maxRepairPoints/);
		view(tables.get('hmtx')).setInt16(2, 32767);
		expect(extendedRepairReason('hhea.extrema', tables)).toMatch(/Metric extrema/);
		tables.set('hmtx', tables.get('hmtx').slice(0, 2));
		expect(extendedRepairReason('hhea.extrema', tables)).toMatch(/truncated/);
	});

	it('never guesses missing VM maxima or downgrades a future TrueType maxp version', () => {
		for (const version of [0x5000, 0x20000]) {
			const tables = ttFixture();
			view(tables.get('maxp')).setUint32(0, version);
			const original = snapshot(tables);
			expect(extendedRepairReason('tt.maxp-geometry', tables)).toMatch(/authoritative VM|Unknown maxp/);
			expect(() => applyExtendedRepair(step('tt.maxp-geometry'), tables)).toThrow();
			expect(snapshot(tables)).toEqual(original);
		}
	});

	it.each(['h', 'v'])('compacts %s metrics without changing any record or opaque suffix', (axis) => {
		const tables = ttFixture();
		const header = tables.get(`${axis}hea`);
		view(header).setUint16(34, 5);
		const raw = new Uint8Array(23);
		for (let i = 0; i < 5; i++) {
			view(raw).setUint16(i * 4, i ? 500 : 100);
			view(raw).setInt16(i * 4 + 2, i - 10);
		}
		raw.set([0xaa, 0xbb, 0xcc], 20);
		tables.set(`${axis}mtx`, raw);
		const after = repair(tables, [step(`${axis}mtx.compact`)]);
		expect(view(after.get(`${axis}hea`)).getUint16(34)).toBe(2);
		expect(after.get(`${axis}mtx`).slice(-3)).toEqual(Uint8Array.of(0xaa, 0xbb, 0xcc));
		expect(readMetrics(after, axis === 'v').records).toEqual(readMetrics(tables, axis === 'v').records);
	});

	it('converts both loca representations while preserving offsets and rejects odd short offsets', () => {
		const original = ttFixture();
		const long = repair(original, [step('tt.loca-format', { format: 'long' })]);
		const short = repair(long, [step('tt.loca-format', { format: 'short' })]);
		expect(short.get('loca')).toEqual(original.get('loca'));
		expect(short.get('glyf')).toEqual(original.get('glyf'));
		const odd = ttFixture({ format: 1 });
		const bytes = odd.get('glyf');
		const shifted = new Uint8Array(bytes.length + 1);
		shifted.set(bytes, 1);
		odd.set('glyf', shifted);
		const offsets = view(odd.get('loca'));
		for (let i = 0; i < 6; i++) offsets.setUint32(i * 4, offsets.getUint32(i * 4) + 1);
		expect(extendedRepairReason('tt.loca-format', odd, { values: { format: 'short' } })).toMatch(/even/);
	});

	it('independent verification rejects bounds, geometry, instructions, metrics and maxp tampering', () => {
		const original = ttFixture();
		const steps = [step('tt.bounds'), step('tt.maxp-geometry'), step('hhea.extrema')];
		const after = repair(original, steps);
		for (const [tag, offset] of [['glyf', 2], ['glyf', 14], ['maxp', 14], ['hhea', 4]]) {
			const corrupt = clone(after);
			corrupt.get(tag)[offset] ^= 1;
			expect(verifyExtendedRepairs(original, corrupt, steps).failures.length).toBeGreaterThan(0);
		}
		view(after.get('head')).setUint32(8, 0x12345678);
		expect(verifyExtendedRepairs(original, after, steps).failures).toEqual([]);
		after.get('head')[12] ^= 1;
		expect(verifyExtendedRepairs(original, after, steps).failures.length).toBeGreaterThan(0);
	});
});

describe('explicit TrueType mitigations', () => {
	it.each([0, 1])('dehints without contour, component, advance or opaque glyph padding loss (%i)', (format) => {
		const original = ttFixture({ format });
		const after = repair(original, [step('tt.dehint')]);
		const tt = readTT(after);
		expect(tt.glyphs.every((glyph) => !glyph || glyph.instructions.length === 0)).toBe(true);
		for (const tag of ['fpgm', 'prep', 'cvt ']) expect(after.has(tag)).toBe(false);
		expect(after.get('hmtx')).toEqual(original.get('hmtx'));
		expect(tt.geometry).toEqual(readTT(original).geometry);
		expect(after.get('maxp').slice(14, 26)).toEqual(original.get('maxp').slice(14, 26));
		expect(EXTENDED_REPAIRS.find((fix) => fix.id === 'tt.dehint').risk).toBe('potentially-lossy');
	});

	it('refuses variable/opaque/device dependencies and leaves the map untouched', () => {
		for (const tag of ['gvar', 'cvar', 'HVAR', 'LTSH', 'hdmx', 'ZZZZ']) {
			const tables = ttFixture();
			tables.set(tag, Uint8Array.of(1));
			const original = snapshot(tables);
			expect(extendedRepairReason('tt.dehint', tables)).toMatch(/dependency/);
			expect(() => applyExtendedRepair(step('tt.dehint'), tables)).toThrow();
			expect(snapshot(tables)).toEqual(original);
		}
	});

	it('decomposes nested/transformed point attachment only after dehinting', () => {
		const hinted = ttFixture();
		expect(extendedRepairReason('tt.decompose', hinted)).toMatch(/dehinted/);
		const original = repair(hinted, [step('tt.dehint')]);
		const selected = step('tt.decompose', { glyphIndex: 3 });
		const after = repair(original, [selected]);
		expect(readTT(after).glyphs[3].type).toBe('simple');
		expect(readTT(after).glyphs[3].contours).toEqual(readTT(original).geometry[3].contours);
		expect(readTT(after).glyphs[2].components).toEqual(readTT(original).glyphs[2].components);
		expect(after.get('hmtx')).toEqual(original.get('hmtx'));
		const corrupt = clone(after);
		corrupt.get('glyf')[readTT(after).offsets[3] + 14] ^= 1;
		expect(verifyExtendedRepairs(original, corrupt, [selected]).failures.length).toBeGreaterThan(0);
	});

	it('refuses unsupported point-index and USE_MY_METRICS dependencies', () => {
		const tables = ttFixture({ hinted: false });
		tables.set('GPOS', Uint8Array.of(0));
		expect(extendedRepairReason('tt.decompose', tables)).toMatch(/point-index/);
		const glyphs = [simple([]), { type: 'composite', ...bounds, instructions: [], components: [
			{ ...component(0, 0, 0), flags: { ...component(0, 0, 0).flags, useMyMetrics: true } },
		] }];
		expect(extendedRepairReason('tt.decompose', ttFixture({ glyphs, hinted: false }))).toMatch(/USE_MY_METRICS/);
	});

	it.each([0, 2])('changes only the selected glyph overlap flag (%i), not geometry or hints', (glyphIndex) => {
		const tables = ttFixture();
		const selected = step('tt.overlap-flag', { glyphIndex, overlap: true });
		const after = repair(tables, [selected]);
		expect(readTT(after).geometry).toEqual(readTT(tables).geometry);
		expect(readTT(after).glyphs[glyphIndex].instructions).toEqual([0xb0, 7]);
		const reverted = repair(after, [step('tt.overlap-flag', { glyphIndex, overlap: false })]);
		expect(reverted.get('glyf')).toEqual(tables.get('glyf'));
	});

	it('preserves independent HarfBuzz shaping and integer transformed/attached paths after dehint/decomposition', () => {
		const original = repair(ttFixture(), [step('tt.bounds'), step('tt.maxp-geometry'), step('hhea.extrema'), step('vhea.extrema')]);
		original.set('cmap', Uint8Array.from(writeCmap({
			version: 0, encodingRecords: [{ platformID: 3, encodingID: 1, subtableIndex: 0 }],
			subtables: [{ format: 4, language: 0, ...buildFormat4Data([[32, 1], [65, 2], [66, 3]]) }],
		})));
		const after = repair(original, [step('tt.dehint'), step('tt.decompose', { glyphIndex: 3 })]);
		const baseline = shapePayloads(original, 'AB BA');
		expect(baseline.glyphs.map((glyph) => glyph.codepoint)).toEqual([2, 3, 1, 3, 2]);
		expect(shapePayloads(after, 'AB BA')).toEqual(baseline);
	});

	it('preserves nonzero glyph suffix bytes through lossy structural edits', () => {
		const original = ttFixture();
		const tt = readTT(original);
		const raw = original.get('glyf');
		const extra = Uint8Array.from([...raw.subarray(0, tt.offsets[3]), 0xaa, 0xbb, ...raw.subarray(tt.offsets[3])]);
		original.set('glyf', extra);
		const offsets = view(original.get('loca'));
		for (let i = 3; i < tt.offsets.length; i++) offsets.setUint16(i * 2, (tt.offsets[i] + 2) / 2);
		const dehinted = repair(original, [step('tt.dehint')]);
		const after = repair(dehinted, [step('tt.decompose', { glyphIndex: 2 })]);
		const now = readTT(after);
		const suffix = after.get('glyf').subarray(now.layouts[2].contentEnd, now.offsets[3]);
		expect([...suffix]).toEqual(expect.arrayContaining([0xaa, 0xbb]));
	});
});

describe('narrow CFF structural repair', () => {
	it('uses the complete INDEX count and preserves all programs and unrelated maxp bytes', () => {
		const tables = cffFixture();
		expect(inspectDerivedRepairs(tables).map((issue) => issue.code)).toEqual(['CFF_DERIVED_MAXP_MISMATCH']);
		const after = repair(tables, [step('cff.maxp')]);
		expect(view(after.get('maxp')).getUint32(0)).toBe(0x5000);
		expect(view(after.get('maxp')).getUint16(4)).toBe(2);
		expect(after.get('maxp').slice(6)).toEqual(tables.get('maxp').slice(6));
		expect(after.get('CFF ')).toEqual(tables.get('CFF '));
	});

	it('repairs known CFF maxp 0.5 counts without downgrading unknown versions or incomplete records', () => {
		const known = cffFixture();
		known.set('maxp', known.get('maxp').slice(0, 6));
		view(known.get('maxp')).setUint32(0, 0x5000);
		const after = repair(known, [step('cff.maxp')]);
		expect(after.get('maxp').length).toBe(6);
		expect(view(after.get('maxp')).getUint16(4)).toBe(2);
		for (const version of [0, 0x20000, 0x10000]) {
			const tables = clone(known);
			view(tables.get('maxp')).setUint32(0, version);
			const original = snapshot(tables);
			expect(extendedRepairReason('cff.maxp', tables)).toMatch(/Unknown maxp|truncated/);
			expect(() => applyExtendedRepair(step('cff.maxp'), tables)).toThrow();
			expect(snapshot(tables)).toEqual(original);
		}
	});

	it('refuses corrupted nonempty charstrings and never calls them known-empty', () => {
		for (const program of [[28, 0], [255, 0], [12], [139, 21], [0]]) {
			const tables = cffFixture([[14], program]);
			const original = snapshot(tables);
			expect(extendedRepairReason('cff.maxp', tables)).not.toBeNull();
			expect(() => applyExtendedRepair(step('cff.empty-glyph', { glyphIndex: 1, confirmedEmpty: true }), tables)).toThrow(/nonempty/);
			expect(snapshot(tables)).toEqual(original);
		}
	});

	it('re-encodes INDEX offsets by append/redirect without recompilation or opaque-byte loss', () => {
		const original = cffFixture();
		const after = repair(original, [step('cff.charstrings-index')]);
		const beforeCff = readCff(original);
		const afterCff = readCff(after);
		expect(afterCff.indexOffset).toBe(original.get('CFF ').length);
		expect(afterCff.programs).toEqual(beforeCff.programs);
		expect(after.get('CFF ').slice(original.get('CFF ').length - 2, original.get('CFF ').length)).toEqual(Uint8Array.of(0xde, 0xad));
		const corrupt = clone(after);
		corrupt.get('CFF ')[beforeCff.indexOffset + beforeCff.indexLength - 1] ^= 1;
		expect(verifyExtendedRepairs(original, corrupt, [step('cff.charstrings-index')]).failures.length).toBeGreaterThan(0);
	});

	it('only terminates a source-confirmed zero-byte CFF1 glyph', () => {
		const tables = cffFixture([[14], []]);
		expect(extendedRepairReason('cff.maxp', tables)).toMatch(/EMPTY_CHARSTRING/);
		expect(() => applyExtendedRepair(step('cff.empty-glyph', { glyphIndex: 1, confirmedEmpty: false }), clone(tables))).toThrow(/confirmation/);
		const after = repair(tables, [step('cff.empty-glyph', { glyphIndex: 1, confirmedEmpty: true })]);
		expect(readCff(after).programs).toEqual([[14], [14]]);
		expect(after.get('maxp')).toEqual(tables.get('maxp'));
	});

	it('distinguishes valid CFF2 empty programs and retains font dictionary context', () => {
		const tables = cffFixture([[], []], true);
		expect(extendedRepairReason('cff.empty-glyph', tables)).toMatch(/CFF2/);
		const after = repair(tables, [step('cff.maxp'), step('cff.charstrings-index')]);
		expect(readCff(after).programs).toEqual([[], []]);
		expect(readCff(after).parsed.fontDicts).toEqual(readCff(tables).parsed.fontDicts);
	});

	it('retains CID FD assignments, per-FD subroutines, widths and private dictionaries', () => {
		const cff = writeCFF({
			names: ['CIDRepair'], strings: [], globalSubrs: [],
			fonts: [{
				topDict: { ROS: [0, 0, 0] }, isCIDFont: true, charset: [0, 1],
				encoding: 'Standard', charStrings: [[32, 10, 14], [32, 10, 14]],
				privateDict: {}, localSubrs: [], fdSelect: [0, 1],
				fdArray: [
					{ fontDict: {}, privateDict: { defaultWidthX: 400 }, localSubrs: [[139, 139, 21, 239, 139, 5, 139, 239, 5, 11]] },
					{ fontDict: {}, privateDict: { defaultWidthX: 700 }, localSubrs: [[149, 159, 21, 189, 139, 5, 139, 189, 5, 11]] },
				],
			}],
		});
		const original = cffFixture();
		original.set('CFF ', Uint8Array.from(cff));
		original.set('maxp', Uint8Array.of(0, 0, 0x50, 0, 0, 2));
		addCmap(original, [[65, 0], [66, 1]]);
		const after = repair(original, [step('cff.maxp'), step('cff.charstrings-index')]);
		expect(readCff(after).parsed).toEqual(readCff(original).parsed);
		const beforeShape = shapePayloads(original, 'AB');
		expect(beforeShape.paths.every((path) => path.length > 0), JSON.stringify(beforeShape)).toBe(true);
		expect(beforeShape.paths[0]).not.toEqual(beforeShape.paths[1]);
		expect(shapePayloads(after, 'AB')).toEqual(beforeShape);
		expect(FontFlux.open(Uint8Array.from(cff).buffer).glyphs.map((glyph) => glyph.advanceWidth)).toEqual([400, 700]);
	});

	it('preserves independent CFF2 blend geometry at interior support boundaries', () => {
		const original = cffFixture([[], []], true);
		original.set('CFF2', Uint8Array.from(writeCFF2({
			charStrings: [[], [139, 139, 21, 239, 189, 140, 16, 139, 5, 139, 239, 5]],
			globalSubrs: [], fontDicts: [{ fontDict: {}, privateDict: {}, localSubrs: [] }],
			variationStore: { format: 1, variationRegionList: { axisCount: 1,
				regions: [{ regionAxes: [{ startCoord: 0.25, peakCoord: 0.5, endCoord: 0.75 }] }] },
			itemVariationData: [{ itemCount: 0, wordDeltaCount: 0, regionIndexes: [0], deltaSets: [] }] },
		})));
		original.set('fvar', Uint8Array.from(writeFvar({
			axes: [{ axisTag: 'wght', minValue: 100, defaultValue: 100, maxValue: 900, axisNameID: 256 }], instances: [],
		})));
		original.set('name', names());
		addCmap(original, [[65, 1]]);
		const stable = repair(original, [step('cff.maxp')]);
		const after = repair(stable, [step('cff.charstrings-index')]);
		const samples = [100, 300, 500, 700, 900].map((weight) => [['wght', weight]]);
		const shapes = samples.map((coordinates) => shapePayloads(stable, 'A', coordinates));
		expect(shapes[0].paths[0]).not.toBe('');
		expect(shapes[2].paths).not.toEqual(shapes[0].paths);
		expect(shapes[1].paths).toEqual(shapes[3].paths);
		for (let i = 0; i < samples.length; i++) expect(shapePayloads(after, 'A', samples[i])).toEqual(shapes[i]);
		expect(after.get('fvar')).toEqual(stable.get('fvar'));
	});

	it('bounds malformed INDEX counts and unterminated DICT operands', () => {
		const tables = cffFixture();
		const bytes = tables.get('CFF ');
		bytes[bytes[2]] = 255;
		bytes[bytes[2] + 1] = 255;
		expect(extendedRepairReason('cff.maxp', tables)).not.toBeNull();
		const broken = cffFixture();
		const parsed = readCff(broken);
		broken.get('CFF ')[parsed.operand[0]] = 30;
		expect(extendedRepairReason('cff.maxp', broken)).not.toBeNull();
		const charset = cffFixture();
		const parsedCharset = readCff(charset);
		const offset = parsedCharset.indexOffset + parsedCharset.indexLength;
		const truncated = charset.get('CFF ').slice(0, offset + 3);
		truncated[offset] = 1;
		charset.set('CFF ', truncated);
		expect(extendedRepairReason('cff.maxp', charset)).toMatch(/Truncated CFF/);
	});
});

describe('assisted variable metadata preservation', () => {
	it('renames references, not axes; preserves custom coordinates, deltas and unknown bytes', () => {
		const original = variableFixture();
		const after = repair(original, [
			step('fvar.axis-name', { axisIndex: 1, nameID: 259 }),
			step('fvar.instance-name', { instanceIndex: 0, field: 'subfamily', nameID: 257 }),
			step('stat.axis-name', { axisIndex: 0, nameID: 259 }),
			step('stat.value-name', { valueIndex: 3, nameID: 257 }),
			step('stat.fallback-name', { nameID: 17 }),
			step('fvar.default-style', { axis: 'wght' }),
		]);
		expect(readFvar(after).parsed.axes.map((axis) => axis.axisTag)).toEqual(['wght', 'XTRA']);
		expect(readFvar(after).parsed.instances[0].coordinates).toEqual([650, 0.5]);
		expect(view(after.get('OS/2')).getUint16(4)).toBe(400);
		for (const tag of ['gvar', 'avar', 'MVAR', 'ZZZZ', 'name']) expect(after.get(tag)).toEqual(original.get(tag));
		expect(after.get('fvar').slice(-2)).toEqual(Uint8Array.of(0xab, 0xcd));
		expect(after.get('STAT').slice(-2)).toEqual(Uint8Array.of(0x12, 0x34));
	});

	it.each([0, 1, 2, 3])('patches supported STAT value name format at record %i without re-encoding', (valueIndex) => {
		repair(variableFixture(), [step('stat.value-name', { valueIndex, nameID: 257 })]);
	});

	it('appends explicit standard/custom coordinates without replacing custom instances', () => {
		const original = variableFixture();
		const selected = step('fvar.add-instance', { nameID: 256, postScriptNameID: 65535, coordinates: '400, 0' });
		const after = repair(original, [selected]);
		expect(readFvar(after).parsed.instances).toEqual([
			{ subfamilyNameID: 258, flags: 0, coordinates: [650, 0.5], postScriptNameID: 259 },
			{ subfamilyNameID: 256, flags: 0, coordinates: [400, 0], postScriptNameID: 65535 },
		]);
		expect(after.get('gvar')).toEqual(original.get('gvar'));
		const corrupt = clone(after);
		corrupt.get('fvar')[readFvar(corrupt).instanceStart + 4] ^= 1;
		expect(verifyExtendedRepairs(original, corrupt, [selected]).failures.length).toBeGreaterThan(0);
	});

	it('opts into a standard weight policy without overwriting custom instances or nonstandard axes', () => {
		const original = variableFixture();
		const selected = step('fvar.standard-instance', { weight: '700', nameID: 256, postScriptNameID: 65535 });
		const after = repair(original, [selected]);
		expect(readFvar(after).parsed.instances[0]).toEqual(readFvar(original).parsed.instances[0]);
		expect(readFvar(after).parsed.instances[1].coordinates).toEqual([700, 0]);
		expect(after.get('gvar')).toEqual(original.get('gvar'));
		expect(() => applyExtendedRepair(selected, clone(after))).toThrow(/already exists/);
		const invalid = clone(original);
		view(invalid.get('fvar')).setInt32(16 + 12, 650 * 65536);
		expect(() => applyExtendedRepair(selected, invalid)).toThrow(/outside/);
	});

	it('refuses missing names, contradictory defaults and unrepresentable or duplicate coordinates', () => {
		const original = variableFixture();
		for (const selected of [
			step('fvar.axis-name', { axisIndex: 0, nameID: 300 }),
			step('fvar.add-instance', { nameID: 256, coordinates: '400,0.1' }),
			step('fvar.add-instance', { nameID: 256, coordinates: '950,0' }),
			step('fvar.add-instance', { nameID: 256, coordinates: '650,0.5' }),
			step('fvar.add-instance', { nameID: 256, coordinates: '400' }),
		]) {
			const tables = clone(original);
			const saved = snapshot(tables);
			expect(() => applyExtendedRepair(selected, tables)).toThrow();
			expect(snapshot(tables)).toEqual(saved);
		}
		view(original.get('fvar')).setInt32(16 + 8, 950 * 65536);
		expect(extendedRepairReason('fvar.axis-name', original)).toMatch(/Contradictory/);
	});

	describe('guarded glyph/table removal and outline conversion', () => {
		it.each([0, 1])('removes only an isolated final glyph without renumbering retained glyphs (%i)', (format) => {
			const original = repair(addPost3(addCmap(ttFixture({ hinted: false, format }))), [step('tt.bounds')]);
			const selected = step('tt.remove-last-glyph', { glyphIndex: 4 });
			const after = repair(original, [selected]);
			expect(readTT(after).glyphs.length).toBe(4);
			expect(readMetrics(after).records).toEqual(readMetrics(original).records.slice(0, -1));
			expect(readMetrics(after, true).records).toEqual(readMetrics(original, true).records.slice(0, -1));
			expect(after.get('cmap')).toEqual(original.get('cmap'));
			expect(shapePayloads(after, 'AB BA')).toEqual(shapePayloads(original, 'AB BA'));
			expect(extendedTableChanges([selected], original)).toEqual({ removed: [], added: [] });
			const corrupt = clone(after);
			corrupt.get('hmtx')[3] ^= 1;
			expect(verifyExtendedRepairs(original, corrupt, [selected]).failures.length).toBeGreaterThan(0);
		});

		it('uses the existing COLR subset guard and blocks cmap, component, layout and opaque references', () => {
			const original = repair(addPost3(addCmap(ttFixture({ hinted: false }))), [step('tt.bounds')]);
			original.set('COLR', Uint8Array.from(writeCOLR({
				version: 0, baseGlyphRecords: [{ glyphID: 2, firstLayerIndex: 0, numLayers: 1 }],
				layerRecords: [{ glyphID: 0, paletteIndex: 0xffff }],
			})));
			repair(original, [step('tt.remove-last-glyph', { glyphIndex: 4 })]);
			const mapped = addCmap(clone(original), [[65, 4]]);
			expect(extendedRepairReason('tt.remove-last-glyph', mapped)).toMatch(/referenced by cmap/);
			const color = clone(original);
			color.set('COLR', Uint8Array.from(writeCOLR({
				version: 0, baseGlyphRecords: [{ glyphID: 2, firstLayerIndex: 0, numLayers: 1 }],
				layerRecords: [{ glyphID: 4, paletteIndex: 0xffff }],
			})));
			expect(extendedRepairReason('tt.remove-last-glyph', color)).toMatch(/references removed glyph/);
			for (const tag of ['GPOS', 'ZZZZ', 'gvar']) {
				const tables = clone(original); tables.set(tag, Uint8Array.of(0));
				expect(extendedRepairReason('tt.remove-last-glyph', tables)).toMatch(/dependency/);
			}
			const referenced = addPost3(addCmap(ttFixture({ hinted: false, glyphs: [
				simple([]), { type: 'composite', ...bounds, instructions: [], components: [component(2, 0, 0)] }, simple([]),
			] }), [[65, 0]]));
			expect(extendedRepairReason('tt.remove-last-glyph', referenced)).toMatch(/retained composite/);
		});

		it('coordinates the version-3+ average advance while removing an isolated nonempty glyph', () => {
			const original = addPost3(addCmap(ttFixture({ hinted: false, glyphs: [simple([]), simple([])] }), [[65, 0]]));
			const os2 = new Uint8Array(96);
			view(os2).setUint16(0, 3);
			view(os2).setInt16(2, 300);
			original.set('OS/2', os2);
			const ready = repair(original, [step('tt.bounds')]);
			const after = repair(ready, [step('tt.remove-last-glyph', { glyphIndex: 1 })]);
			expect(readTT(after).glyphs.length).toBe(1);
			expect(view(after.get('OS/2')).getInt16(2)).toBe(100);
			expect(extendedRepairReason('tt.remove-last-glyph', after)).toMatch(/notdef/);
		});

		it('removes exactly the selected optional table and checks palette/fallback dependencies', () => {
			const original = ttFixture();
			original.set('gasp', Uint8Array.of(0, 1, 0, 0));
			original.set('kern', Uint8Array.of(0, 0, 0, 0));
			const selected = step('tables.remove-optional', { tag: 'gasp' });
			const after = repair(original, [selected]);
			expect(after.has('gasp')).toBe(false);
			expect(after.get('kern')).toEqual(original.get('kern'));
			expect(extendedTableChanges([selected], original)).toEqual({ removed: ['gasp'], added: [] });
			expect(extendedTableChanges([step('tt.dehint')], original)).toEqual({ removed: ['fpgm', 'prep', 'cvt '], added: [] });
			expect(() => extendedTableChanges([step('tables.remove-optional', { tag: 'ZZZZ' })], original)).toThrow();
			const palettes = clone(original);
			palettes.set('COLR', Uint8Array.of(0)); palettes.set('CPAL', Uint8Array.of(0));
			expect(() => applyExtendedRepair(step('tables.remove-optional', { tag: 'CPAL' }), palettes)).toThrow(/COLR or SVG/);
			palettes.set('ZZZZ', Uint8Array.of(1));
			expect(extendedRepairReason('tables.remove-optional', palettes)).toMatch(/opaque/);
		});

		it('reuses guarded TT-to-CFF conversion with an independently checked explicit curve tolerance', () => {
			const original = repair(conversionFixture(), [step('tt.loca-format', { format: 'long' })]);
			const selected = step('outlines.to-cff', { tolerance: 0.5, allowOutlineLoss: true, postScriptName: 'ExplicitConversion' });
			expect(extendedRepairReason('outlines.to-cff', original)).toBeNull();
			const after = repair(original, [selected]);
			expect(after.has('glyf')).toBe(false);
			expect(after.has('loca')).toBe(false);
			expect(after.get('maxp').length).toBe(6);
			expect(view(after.get('head')).getInt16(50)).toBe(0);
			expect(after.get('hmtx')).toEqual(original.get('hmtx'));
			expect(extendedTableChanges([selected], original)).toEqual({ removed: ['glyf', 'loca'], added: ['CFF '] });
			expect(extendedSfntVersion([selected])).toBe(0x4f54544f);
			expect(extendedSfntVersion([step('tt.bounds')])).toBeNull();
			expect(() => extendedSfntVersion([step('unknown')])).toThrow();
			expect(() => applyExtendedRepair({ ...selected, values: { ...selected.values, tolerance: 0 } }, clone(original))).toThrow(/tolerance/);
			const unauthorized = clone(original);
			expect(() => applyExtendedRepair({ ...selected, values: { ...selected.values, allowOutlineLoss: false } }, unauthorized)).toThrow(/authorization/);
			expect(snapshot(unauthorized)).toEqual(snapshot(original));
			const corrupt = clone(after);
			const cff = readCff(corrupt).parsed;
			cff.fonts[0].topDict.ItalicAngle = 30;
			corrupt.set('CFF ', Uint8Array.from(writeCFF(cff)));
			expect(verifyExtendedRepairs(original, corrupt, [selected]).failures.length).toBeGreaterThan(0);
		});

		it('retains independent HarfBuzz paths/positions for exact line conversion', () => {
			const original = conversionFixture(true);
			const after = repair(original, [step('outlines.to-cff', {
				tolerance: 0, allowOutlineLoss: true, postScriptName: 'ExactLines',
			})]);
			expect(shapePayloads(after, 'AAA')).toEqual(shapePayloads(original, 'AAA'));
		});

		it('refuses conversion with unknown, variation, vertical, hinted, bearing or implied-point dependencies', () => {
			for (const tag of ['ZZZZ', 'gvar', 'vhea', 'fpgm']) {
				const original = conversionFixture();
				original.set(tag, Uint8Array.of(1));
				expect(extendedRepairReason('outlines.to-cff', original)).not.toBeNull();
			}
			const mismatch = conversionFixture();
			view(mismatch.get('hmtx')).setInt16(6, 11);
			expect(extendedRepairReason('outlines.to-cff', mismatch)).toMatch(/bearing/);
		});
	});

	it('refuses unsupported/aliased STAT and detects axis reordering in independent verification', () => {
		const tables = variableFixture();
		view(tables.get('STAT')).setUint16(2, 9);
		expect(extendedRepairReason('stat.axis-name', tables)).toMatch(/Unsupported/);
		const original = variableFixture();
		const selected = step('fvar.axis-name', { axisIndex: 0, nameID: 259 });
		const after = repair(original, [selected]);
		after.get('fvar')[16] ^= 1;
		expect(verifyExtendedRepairs(original, after, [selected]).failures.length).toBeGreaterThan(0);
	});

	it('preserves independent variation shaping at selected axis endpoints, default and custom instance', () => {
		const source = new Uint8Array(readFileSync(resolve('test', 'sample fonts', 'RobotoFlex-online-test.ttf')));
		const original = fontPayloads(source);
		const fvar = readFvar(original).parsed;
		const after = repair(original, [step('fvar.axis-name', { axisIndex: 0, nameID: fvar.axes[1].axisNameID })]);
		const samples = ['minValue', 'defaultValue', 'maxValue'].map((field) =>
			fvar.axes.map((axis) => [axis.axisTag, axis[field]]));
		if (fvar.instances.length) samples.push(fvar.axes.map((axis, i) => [axis.axisTag, fvar.instances[0].coordinates[i]]));
		const region = parseHVAR(original.get('HVAR')).itemVariationStore.variationRegionList.regions.find((entry) =>
			entry.regionAxes.some((axis) => [axis.startCoord, axis.peakCoord, axis.endCoord].some((value) => value !== 0 && Math.abs(value) < 1)));
		expect(region).toBeDefined();
		const avar = original.has('avar') ? parseAvar(original.get('avar')).segmentMaps : [];
		for (const field of ['startCoord', 'peakCoord', 'endCoord']) {
			samples.push(fvar.axes.map((axis, i) => {
				let coordinate = region.regionAxes[i][field];
				const points = avar[i]?.axisValueMaps ?? [
					{ fromCoordinate: -1, toCoordinate: -1 }, { fromCoordinate: 0, toCoordinate: 0 }, { fromCoordinate: 1, toCoordinate: 1 },
				];
				const right = points.findIndex((point) => point.toCoordinate >= coordinate);
				if (right === 0) coordinate = points[0].fromCoordinate;
				else {
					expect(right).toBeGreaterThan(0);
					const a = points[right - 1], b = points[right];
					expect(b.toCoordinate).toBeGreaterThan(a.toCoordinate);
					coordinate = a.fromCoordinate + (coordinate - a.toCoordinate) *
						(b.fromCoordinate - a.fromCoordinate) / (b.toCoordinate - a.toCoordinate);
				}
				return [axis.axisTag, axis.defaultValue + coordinate * (coordinate < 0
					? axis.defaultValue - axis.minValue : axis.maxValue - axis.defaultValue)];
			}));
		}
		for (const coordinates of samples)
			expect(shapePayloads(after, 'Hamburgefontsiv 0123', coordinates)).toEqual(shapePayloads(original, 'Hamburgefontsiv 0123', coordinates));
	});

	describe('M3 public repair preservation across advanced representations', () => {
		function fixture() {
			const font = FontFlux.create({ family: 'M3 preservation' });
			for (const [name, unicode, advanceWidth] of [['A', 65, 500], ['B', 66, 600], ['A.alt', undefined, 700]])
				font.addGlyph({ name, unicode, advanceWidth, path: 'M0 0 L100 0 L100 100 Z', format: 'truetype' });
			return fontPayloads(font.export({ format: 'sfnt' }));
		}
		async function verify(payloads) {
			const input = fontBytes(payloads);
			new DataView(input).setUint16(6, 0);
			const original = input.slice(0);
			const plan = await FontFlux.planRepairs(input, [{ id: 'sfnt.search-fields' }]);
			const result = await FontFlux.applyRepairs(input, plan);
			expect(result.state, result.verification.failures.join('\n')).toBe('verified');
			expect(input).toEqual(original);
			const after = fontPayloads(result.buffer);
			for (const [tag, bytes] of payloads)
				if (tag !== 'head') expect(after.get(tag), tag).toEqual(bytes);
			return { after, result };
		}
		it('preserves independently shaped contextual extension substitution and positioning', async () => {
			const payloads = fixture(), coverage = (gid) => ({ format: 1, glyphs: [gid] });
			const layout = (tag, glyph, extension, chained, single, subtable) => ({
				majorVersion: 1, minorVersion: 0,
				scriptList: { scriptRecords: [{ scriptTag: 'DFLT', script: { defaultLangSys: {
					lookupOrderOffset: 0, requiredFeatureIndex: 0xffff, featureIndices: [0],
				}, langSysRecords: [] } }] },
				featureList: { featureRecords: [{ featureTag: tag, feature: { lookupListIndices: [0] } }] },
				lookupList: { lookups: [
					{ lookupType: extension, lookupFlag: 0, subtables: [{ format: 1, extensionLookupType: chained, subtable: {
						format: 3, backtrackCoverages: [coverage(3)], inputCoverages: [coverage(glyph)], lookaheadCoverages: [],
						seqLookupRecords: [{ sequenceIndex: 0, lookupListIndex: 1 }],
					} }] },
					{ lookupType: single, lookupFlag: 0, subtables: [subtable] },
				] },
			});
			payloads.set('GSUB', Uint8Array.from(writeGSUB(layout('calt', 2, 7, 6, 1,
				{ format: 2, coverage: coverage(2), substituteGlyphIDs: [4] }))));
			payloads.set('GPOS', Uint8Array.from(writeGPOS(layout('kern', 4, 9, 8, 1,
				{ format: 1, coverage: coverage(4), valueFormat: 4, valueRecord: { xAdvance: -50 } }))));
			const shaped = shapePayloads(payloads, 'BA');
			expect(shaped.glyphs.map((glyph) => glyph.codepoint)).toEqual([3, 4]);
			expect(shaped.positions.map((position) => position.xAdvance)).toEqual([600, 650]);
			const { after, result } = await verify(payloads);
			expect(shapePayloads(after, 'BA')).toEqual(shaped);
			for (const tag of ['GSUB', 'GPOS'])
				expect(result.after.checks.find((check) => check.id === `binary.advanced.${tag}`)).toMatchObject({ outcome: 'passed', coverage: 'partial' });
		});

		it('retains color, SVG, bitmap metrics/payloads and specialist tables with explicit partial evidence', async () => {
			const payloads = fixture();
			payloads.set('COLR', Uint8Array.from(writeCOLR({ version: 0,
				baseGlyphRecords: [{ glyphID: 2, firstLayerIndex: 0, numLayers: 1 }], layerRecords: [{ glyphID: 3, paletteIndex: 0 }] })));
			payloads.set('CPAL', Uint8Array.from(writeCPAL({ version: 0, numPaletteEntries: 1,
				palettes: [[{ red: 255, green: 0, blue: 0, alpha: 255 }]] })));
			payloads.set('SVG ', Uint8Array.from(writeSVG({ version: 0,
				documents: [{ compressed: false, text: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L10 0L0 10Z"/></svg>' }],
				entries: [{ startGlyphID: 2, endGlyphID: 2, documentIndex: 0 }] })));
			payloads.set('sbix', Uint8Array.from(writeSbix({ version: 1, flags: 1, strikes: [{ ppem: 16, ppi: 72,
				glyphs: [null, null, { originOffsetX: 3, originOffsetY: -2, graphicType: 'jpg ', imageData: [255, 216, 255, 217] }, null, null] }] })));
			const math = new Uint8Array(242), m = view(math);
			m.setUint32(0, 0x10000); m.setUint16(4, 10); m.setUint16(6, 224); m.setUint16(8, 232);
			m.setUint16(10, 80); m.setUint16(12, 60);
			payloads.set('MATH', math);
			payloads.set('BASE', Uint8Array.from(writeBASE({ majorVersion: 1, minorVersion: 0, horizAxis: {
				baseTagList: ['romn'], baseScriptList: [{ tag: 'latn', baseValues: {
					defaultBaselineIndex: 0, baseCoords: [{ format: 1, coordinate: 0 }],
				}, defaultMinMax: null, baseLangSysRecords: [] }],
			} })));
			payloads.set('JSTF', Uint8Array.of(0, 1, 0, 0, 0, 0));
			payloads.set('MERG', new Uint8Array(10));
			const { result } = await verify(payloads);
			for (const tag of ['COLR', 'SVG ', 'sbix', 'MATH', 'BASE', 'JSTF', 'MERG'])
				expect(result.after.checks.find((check) => check.id === `binary.advanced.${tag}`)).toMatchObject({ outcome: 'passed', coverage: 'partial' });
			expect(result.after.checks.some((check) => check.outcome === 'unsupported' && check.id.endsWith('.documents'))).toBe(true);
			expect(result.after.checks.some((check) => check.outcome === 'unsupported' && check.location.path?.includes('glyphs.2'))).toBe(true);
		});
	});
});
