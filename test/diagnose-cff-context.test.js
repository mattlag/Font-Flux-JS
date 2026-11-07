import { describe, expect, it } from 'vitest';
import { importFont } from '../src/import.js';
import { CFF2_PRIVATE_DICT_OPS, dictEntriesToObject, getCFFGlyphContext } from '../src/otf/cff_common.js';
import { interpretCharString } from '../src/otf/charstring_interpreter.js';
import { parseCFF, writeCFF } from '../src/otf/table_CFF.js';
import { parseCFF2, writeCFF2 } from '../src/otf/table_CFF2.js';
import { _internal, diagnoseFont } from '../src/validate/diagnoseFont.js';

const n = (value) => {
	if (value >= -107 && value <= 107) return [value + 139];
	return [28, (value >> 8) & 255, value & 255];
};
const call = (index = -107, op = 10) => [...n(index), op];

function cff1(charStrings = [[14]], localSubrs = []) {
	return {
		names: ['DiagnosticContext'],
		globalSubrs: [],
		fonts: [{ topDict: {}, charStrings, localSubrs }],
	};
}

function cff2(charStrings = [[]], localSubrs = []) {
	return {
		globalSubrs: [],
		charStrings,
		fontDicts: [{ privateDict: {}, localSubrs }],
	};
}

// Original programs: the two FDs deliberately need different stack arguments
// and have different subroutine counts. A shared global subr calls the local
// subr named by its caller, exercising context across both kinds of call.
function multiFD(isCff2) {
	const finish = isCff2 ? [] : [14];
	const ret = isCff2 ? [] : [11];
	const charStrings = [
		[...n(5), ...n(0), ...n(-107), ...call(-107, 29), ...finish],
		[
			...n(0), ...n(0), 21, ...n(30), ...n(0),
			...n(-106), ...call(-107, 29), ...finish,
		],
	];
	const dictionaries = [
		{
			privateDict: isCff2 ? {} : { nominalWidthX: 100, defaultWidthX: 400 },
			localSubrs: [[21, ...n(10), 6, ...ret]],
		},
		{
			privateDict: isCff2 ? {} : { nominalWidthX: 200, defaultWidthX: 600 },
			localSubrs: [[0], [5, ...ret]],
		},
	];
	if (isCff2) {
		return { ...cff2(), charStrings, fontDicts: dictionaries, fdSelect: [0, 1], globalSubrs: [[10, ...ret]] };
	}
	const table = cff1(charStrings);
	Object.assign(table.fonts[0], {
		isCIDFont: true,
		topDict: { ROS: [0, 1, 0] },
		charset: [1],
		fdArray: dictionaries,
		fdSelect: [0, 1],
		// A top-level local subr must NOT override the selected FD's subrs.
		localSubrs: [[0]],
	});
	table.globalSubrs = [[10, ...ret]];
	return table;
}

function inspect(table, isCff2 = false, options) {
	const issues = [];
	_internal.validateCffCharStrings(table, isCff2 ? 'CFF2' : 'CFF', issues, isCff2, options);
	return issues;
}

const codes = (issues) => issues.map((issue) => issue.code);

function freeze(value) {
	if (value && typeof value === 'object') {
		Object.values(value).forEach(freeze);
		Object.freeze(value);
	}
	return value;
}

function sfnt(data, isCff2) {
	const buffer = new ArrayBuffer(28 + Math.ceil(data.length / 4) * 4);
	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);
	view.setUint32(0, 0x4f54544f);
	view.setUint16(4, 1);
	view.setUint16(6, 16);
	bytes.set(new TextEncoder().encode(isCff2 ? 'CFF2' : 'CFF '), 12);
	view.setUint32(20, 28);
	view.setUint32(24, data.length);
	bytes.set(data, 28);
	let checksum = 0;
	for (let i = 28; i < bytes.length; i += 4) checksum = (checksum + view.getUint32(i)) >>> 0;
	view.setUint32(16, checksum);
	return buffer;
}

function binary(table, isCff2) {
	return sfnt((isCff2 ? writeCFF2 : writeCFF)(table), isCff2);
}

function variationStore() {
	return {
		format: 1,
		variationRegionList: {
			axisCount: 1,
			regions: [
				{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }] },
				{ regionAxes: [{ startCoord: -1, peakCoord: -1, endCoord: 0 }] },
			],
		},
		itemVariationData: [
			{ itemCount: 0, wordDeltaCount: 0, regionIndexes: [0], deltaSets: [] },
			{ itemCount: 0, wordDeltaCount: 0, regionIndexes: [0, 1], deltaSets: [] },
		],
	};
}

describe.each([false, true])('CFF context (CFF2=%s)', (isCff2) => {
	const make = isCff2 ? cff2 : cff1;
	const finish = isCff2 ? [] : [14];
	const ret = isCff2 ? [] : [11];
	const font = (table) => isCff2 ? table : table.fonts[0];
	const fds = (table) => isCff2 ? table.fontDicts : table.fonts[0].fdArray;

	it('selects per-glyph local subrs even inside global calls, without mutations', () => {
		const table = multiFD(isCff2);
		const bytes = binary(table, isCff2);
		const before = bytes.slice(0);
		const snapshot = structuredClone(table);
		freeze(table);
		expect(inspect(table, isCff2)).toEqual([]);
		expect(table).toEqual(snapshot);
		const report = diagnoseFont(bytes);
		expect(report.issues.filter((issue) => issue.code.startsWith('CFF_'))).toEqual([]);
		expect(report.issues.some((issue) => issue.code === 'TABLE_PARSE_FAILED')).toBe(false);
		expect(new Uint8Array(bytes)).toEqual(new Uint8Array(before));
	});

	it('finds corruption in the selected nonzero FD rather than silently using FD 0', () => {
		const table = multiFD(isCff2);
		fds(table)[1].localSubrs[1] = [0];
		const findings = inspect(table, isCff2);
		expect(codes(findings)).toEqual(['CFF_INVALID_OPERATOR']);
		expect(findings[0].message).toContain('glyph 1');
		expect(codes(diagnoseFont(binary(table, isCff2)).issues)).toContain('CFF_INVALID_OPERATOR');
	});

	it('does not execute unused FDs or unused local subrs', () => {
		const table = multiFD(isCff2);
		fds(table).push({ localSubrs: [[0]], privateDict: { vsindex: 99 } });
		expect(inspect(table, isCff2)).toEqual([]);
	});

	it.each([-1, 2, 0.5, undefined])('rejects invalid FD reference %s without a fallback', (fd) => {
		const table = multiFD(isCff2);
		font(table).fdSelect[1] = fd;
		expect(codes(inspect(freeze(table), isCff2))).toEqual(['CFF_FD_INDEX_OUT_OF_RANGE']);
	});

	it('rejects a missing mapping or dictionary array', () => {
		const table = multiFD(isCff2);
		delete font(table).fdSelect;
		expect(codes(inspect(table, isCff2))).toEqual(['CFF_FDSELECT_MISSING']);
		delete font(table)[isCff2 ? 'fontDicts' : 'fdArray'];
		expect(codes(inspect(table, isCff2))).toEqual(['CFF_FDARRAY_MISSING']);
	});

	it('reports a wrong FD reference in encoded input, without changing bytes', () => {
		const table = multiFD(isCff2);
		font(table).fdSelect[1] = 7;
		const bytes = binary(table, isCff2);
		const before = bytes.slice(0);
		expect(codes(diagnoseFont(bytes).issues)).toContain('CFF_FD_INDEX_OUT_OF_RANGE');
		expect(new Uint8Array(bytes)).toEqual(new Uint8Array(before));
	});

	it('computes the local subroutine bias from the selected FD count', () => {
		const table = multiFD(isCff2);
		const subrs = Array.from({ length: 1240 }, () => [0]);
		subrs[0] = [5, ...ret];
		fds(table)[1].localSubrs = subrs;
		font(table).charStrings[1] = [
			...n(0), ...n(0), 21, ...n(30), ...n(0), ...call(-1131), ...finish,
		];
		expect(inspect(table, isCff2)).toEqual([]);
	});

	it('bounds recursion and keeps a separate operation budget per glyph', () => {
		const recursive = make([[...call(), ...finish]], [[...call(), ...ret]]);
		expect(codes(inspect(recursive, isCff2))).toEqual(['CFF_SUBR_DEPTH_EXCEEDED']);
		const finite = make([
			[...call(), ...call(), ...finish],
			[0],
		], [[...ret]]);
		expect(codes(inspect(finite, isCff2, { maxCharStringOperations: 3 }))).toEqual([
			'CFF_OPERATION_LIMIT_EXCEEDED', 'CFF_INVALID_OPERATOR',
		]);
	});

	it('bounds the operand stack before scanning all remaining bytes', () => {
		const limit = isCff2 ? 513 : 48;
		const table = make([[...Array(limit + 1).fill(139), 0]]);
		expect(codes(inspect(table, isCff2))).toEqual(['CFF_STACK_OVERFLOW']);
	});

	it('rejects fractional and unavailable subroutine indices without throwing', () => {
		const fractional = make([[255, 255, 149, 128, 0, 10, ...finish]], [[...ret]]);
		expect(codes(inspect(fractional, isCff2))).toEqual(['CFF_SUBR_INDEX_OUT_OF_RANGE']);
		expect(codes(inspect(make([[...call(), ...finish]]), isCff2))).toEqual([
			'CFF_SUBR_INDEX_OUT_OF_RANGE',
		]);
	});

	it('propagates failure out of a subroutine without spurious missing terminators', () => {
		const table = make([[...call(), 0]], [[12]]);
		expect(codes(inspect(table, isCff2))).toEqual(['CFF_TRUNCATED_OPERATOR']);
	});

	it('reports malformed INDEX bounds via the existing parser', () => {
		const bytes = (isCff2 ? writeCFF2 : writeCFF)(multiFD(isCff2));
		// Both encodings put the first INDEX directly after their header/DICT.
		const offset = isCff2 ? bytes[2] + ((bytes[3] << 8) | bytes[4]) : bytes[2];
		const countBytes = isCff2 ? 4 : 2;
		for (let i = 0; i < countBytes; i++) bytes[offset + i] = 255;
		const report = diagnoseFont(sfnt(bytes, isCff2));
		expect(report.errors.some((issue) =>
			issue.code === 'TABLE_PARSE_FAILED' && issue.message.includes('INDEX'))).toBe(true);
	});
});

describe('CFF1 execution context and termination', () => {
	it('agrees with imported multi-FD contours and with independently known path coordinates', () => {
		const table = multiFD(false);
		table.fonts[0].charStrings[0].unshift(...n(7));
		table.fonts[0].charStrings[1].unshift(...n(9));
		const parsed = parseCFF(writeCFF(table));
		const imported = importFont(new Uint8Array(writeCFF(table)).buffer);
		const expected = [
			[{ type: 'M', x: 5, y: 0 }, { type: 'L', x: 15, y: 0 }],
			[{ type: 'M', x: 0, y: 0 }, { type: 'L', x: 30, y: 0 }],
		];
		for (let gid = 0; gid < 2; gid++) {
			const context = getCFFGlyphContext(parsed, gid);
			const interpreted = interpretCharString(
				parsed.fonts[0].charStrings[gid], context.globalSubrs, context.localSubrs,
			);
			expect(interpreted.contours).toEqual([expected[gid]]);
			expect(imported.glyphs[gid].contours).toEqual([expected[gid]]);
		}
		expect(imported.glyphs.map((glyph) => glyph.advanceWidth)).toEqual([107, 209]);
		expect(inspect(parsed)).toEqual([]);
	});

	it('keeps contexts separate for multiple CFF fonts', () => {
		const table = cff1([[...call(), 14]], [[11]]);
		table.fonts.push({ charStrings: [[...call(), 14]], localSubrs: [[0]] });
		expect(codes(inspect(table))).toEqual(['CFF_INVALID_OPERATOR']);
	});

	it('accepts endchar inside a subroutine and stops all callers', () => {
		const table = cff1([[...call(), 0]], [[14, 0]]);
		expect(inspect(table)).toEqual([]);
		expect(diagnoseFont(binary(table, false)).issues.filter((issue) =>
			issue.code.startsWith('CFF_'))).toEqual([]);
	});

	it('does not mistake an operand byte for a terminator', () => {
		const table = cff1([[28, 0, 14]]);
		expect(codes(inspect(table))).toEqual(['CFF_CHARSTRING_NO_ENDCHAR']);
		expect(codes(diagnoseFont(binary(table, false)).issues)).toContain('CFF_CHARSTRING_NO_ENDCHAR');
	});

	it('rejects a top-level return, missing subroutine return, and empty CFF1 glyph', () => {
		expect(codes(inspect(cff1([[11]])))).toEqual(['CFF_RETURN_OUTSIDE_SUBR']);
		expect(codes(inspect(cff1([[...call(), 14]], [[]])))).toEqual(['CFF_SUBR_NO_RETURN']);
		expect(codes(inspect(cff1([[]])))).toEqual(['CFF_EMPTY_CHARSTRING']);
	});

	it('allows width/stem state to cross calls and skips exactly the hint mask bytes', () => {
		const table = cff1([
			[...n(20), ...n(0), ...n(10), ...call(), 19, 0x80, ...n(0), ...n(0), 21, 14],
		], [[1, 11]]);
		expect(inspect(table)).toEqual([]);
		table.fonts[0].charStrings[0] = [
			...n(20), ...n(0), ...n(10), ...call(), 19,
		];
		expect(codes(inspect(table))).toEqual(['CFF_TRUNCATED_OPERATOR']);
	});

	it('evaluates deterministic arithmetic when resolving a subroutine index', () => {
		const table = cff1([[...n(-100), ...n(-7), 12, 10, 10, 14]], [[11]]);
		const issues = inspect(freeze(table));
		expect(codes(issues)).toEqual([]);
	});
});

describe('CFF2 execution and variation context', () => {
	it('accepts implicit glyph/subroutine termination and empty programs', () => {
		expect(inspect(cff2([[], [...call(), ...n(0), ...n(0), 21]], [[]]), true)).toEqual([]);
	});

	describe('CFF2 ordered Private DICT programs', () => {
		const entry = (operator, ...operands) => ({ operator, operands });
		const dictionary = (entries, localSubrs = []) => ({
			privateDictEntries: entries, privateDict: dictEntriesToObject(entries, CFF2_PRIVATE_DICT_OPS), localSubrs,
		});
		const make = (entries, program = []) => ({
			...cff2([program]), variationStore: variationStore(), fontDicts: [dictionary(entries)],
		});
		it('preserves prefixes, repeated blends and higher-order blends, then inspects glyph bytecode', () => {
			const entries = [
				entry(23, 0, 10, 2, 1), entry(23, 3, 1), entry(23, 20, 4, 1), entry(6, 30),
			];
			const table = make(entries);
			expect(inspect(freeze(table), true)).toEqual([]);
			const parsed = parseCFF2(writeCFF2(table));
			expect(inspect(parsed, true)).toEqual([]);
			parsed.charStrings[0] = [0];
			expect(codes(inspect(parsed, true))).toEqual(['CFF_INVALID_OPERATOR']);
			const report = diagnoseFont(sfnt(writeCFF2(table), true));
			expect(report.checks).toContainEqual(expect.objectContaining({ id: 'binary.CFF2.private-dict.0', outcome: 'passed' }));
			expect(report.issues.filter((issue) => issue.code.startsWith('CFF_'))).toEqual([]);
		});
		it('selects per-FD blend regions/local subrs and allows a glyph to override inherited vsindex', () => {
			const table = { ...cff2(), variationStore: variationStore(), fdSelect: [0, 1],
				fontDicts: [
					dictionary([entry(22, 0), entry(23, 10, 2, 1), entry(10)], [[16, 21]]),
					dictionary([entry(22, 1), entry(23, 10, 2, 3, 1), entry(11)], [[16, 21]]),
				],
				charStrings: [
					[...n(0), ...n(10), ...n(2), ...n(1), ...call()],
					[...n(0), ...n(10), ...n(2), ...n(3), ...n(1), ...call()],
				],
			};
			expect(inspect(table, true)).toEqual([]);
			expect(inspect(parseCFF2(writeCFF2(table)), true)).toEqual([]);
			table.charStrings[1] = [...n(0), 15, ...n(0), ...n(10), ...n(2), ...n(1), ...call()];
			expect(inspect(table, true)).toEqual([]);
		});
		it.each([
			[[entry(23, 10, 2, 0)], 'CFF_BLEND_INVALID_COUNT'],
			[[entry(23, 10, 2, -1)], 'CFF_BLEND_INVALID_COUNT'],
			[[entry(23, 10, 2, 0.5)], 'CFF_BLEND_INVALID_COUNT'],
			[[entry(23, 10, 2, 2)], 'CFF_STACK_UNDERFLOW'],
			[[entry(22, 2)], 'CFF_VSINDEX_OUT_OF_RANGE'],
			[[entry(23, 10, 2, 1), entry(22)], 'CFF_INVALID_OPERAND_COUNT'],
			[[entry(23, 10, 2, 1), entry(0x0c09)], 'CFF_PRIVATE_DICT_BLEND_FORBIDDEN'],
			[[entry(23, 10, 2, 1), entry(19)], 'CFF_PRIVATE_DICT_BLEND_FORBIDDEN'],
			[[entry(23, 10, 2, 1), entry(6)], 'CFF_INVALID_OPERAND_COUNT'],
			[[entry(23, 10, 2, 1)], 'CFF_PRIVATE_DICT_TRAILING_VALUES'],
			[[entry(10, Number.NaN)], 'CFF_INVALID_NUMBER'],
		])('rejects invalid private operand program %j with %s', (entries, code) => {
			expect(codes(inspect(make(entries), true))).toEqual([code]);
		});
		it('checks missing/invalid region context and permits zero-region blends', () => {
			const table = make([entry(23, 10, 2, 1), entry(10)]);
			table.variationStore.itemVariationData[0].regionIndexes = [2];
			expect(codes(inspect(table, true))).toEqual(['CFF_VARIATION_CONTEXT_INVALID']);
			delete table.variationStore;
			expect(codes(inspect(table, true))).toEqual(['CFF_VARIATION_CONTEXT_MISSING']);
			table.variationStore = variationStore();
			table.variationStore.itemVariationData[0].regionIndexes = [];
			table.fontDicts = [dictionary([entry(23, 10, 1), entry(10)])];
			expect(inspect(table, true)).toEqual([]);
		});
		it('enforces the 513-element stack boundary including retained blend results', () => {
			const operands = Array(512).fill(1);
			const table = make([entry(23, ...operands, 1), entry(10)]);
			table.variationStore.variationRegionList.regions = Array.from({ length: 511 }, () => ({
				regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }],
			}));
			table.variationStore.itemVariationData[0].regionIndexes = Array.from({ length: 511 }, (_, i) => i);
			expect(inspect(table, true)).toEqual([]);
			table.fontDicts[0].privateDictEntries[0].operands.push(1);
			expect(codes(inspect(table, true))).toEqual(['CFF_STACK_OVERFLOW']);
			const carried = make([entry(23, 0, 10, 2, 1), entry(23, ...operands)]);
			expect(codes(inspect(carried, true))).toEqual(['CFF_STACK_OVERFLOW']);
		});
		it('caches selected FD programs, remains bounded and does not invent an unordered blend program', () => {
			const table = make([entry(23, 10, 2, 1), entry(10)]);
			table.charStrings = Array.from({ length: 100 }, () => []);
			expect(inspect(table, true, { maxStructureNodes: 10 })).toEqual([]);
			expect(codes(inspect(table, true, { maxStructureNodes: 3 }))).toEqual(['DIAGNOSTIC_LIMIT_EXCEEDED']);
			delete table.fontDicts[0].privateDictEntries;
			expect(codes(inspect(table, true))).toEqual(['CFF_CONTEXT_UNSUPPORTED']);
		});
		it('scopes unknown ignored operators without abandoning supported glyph checks', () => {
			const table = make([entry(24, 1)], [0]);
			const report = diagnoseFont(sfnt(writeCFF2(table), true));
			expect(codes(report.issues)).toContain('CFF_INVALID_OPERATOR');
			expect(report.checks).toContainEqual(expect.objectContaining({ outcome: 'unsupported', reasonCode: 'unsupported-semantics' }));
		});
		it('checks unreferenced private structures in binary diagnosis without executing their subroutines', () => {
			const table = make([]);
			table.fdSelect = [0];
			table.fontDicts.push(dictionary([entry(23, 10, 2, 1)], [[0]]));
			expect(inspect(table, true)).toEqual([]);
			const report = diagnoseFont(sfnt(writeCFF2(table), true));
			expect(codes(report.issues)).toContain('CFF_PRIVATE_DICT_TRAILING_VALUES');
			expect(codes(report.issues)).not.toContain('CFF_INVALID_OPERATOR');
			expect(report.checks).toContainEqual(expect.objectContaining({ id: 'binary.CFF2.private-dict.1', outcome: 'failed' }));
		});
	});

	it.each([
		{ bytes: [11] }, { bytes: [14] }, { bytes: [12, 10] }, { bytes: [12, 23] },
	])('rejects removed CFF1 operator $bytes', ({ bytes }) => {
		expect(codes(inspect(cff2([bytes]), true))).toEqual(['CFF_INVALID_OPERATOR']);
		expect(codes(inspect(cff2([[...call()]], [bytes]), true))).toEqual(['CFF_INVALID_OPERATOR']);
	});

	it('does not accept a CFF1 width before moveto or stems', () => {
		for (const program of [
			[...n(20), ...n(0), ...n(0), 21],
			[...n(20), ...n(0), ...n(10), 1],
		]) {
			expect(codes(inspect(cff2([program]), true))).toEqual(['CFF_INVALID_OPERAND_COUNT']);
		}
	});

	it('allows omitted FDSelect only for a single CFF2 dictionary', () => {
		expect(inspect(cff2(), true)).toEqual([]);
		const table = multiFD(false);
		table.fonts[0].fdArray.length = 1;
		table.fonts[0].charStrings.length = 1;
		delete table.fonts[0].fdSelect;
		expect(codes(inspect(table))).toEqual(['CFF_FDSELECT_MISSING']);
	});

	it('inherits vsindex from the selected Private DICT, including within a global subroutine', () => {
		const table = cff2([
			[...n(0), ...n(10), ...n(2), ...n(1), ...call(-107, 29), 21],
			[...n(0), ...n(20), ...n(2), ...n(3), ...n(1), ...call(-107, 29), 21],
		]);
		table.fontDicts = [
			{ privateDict: { vsindex: 0 }, localSubrs: [] },
			{ privateDict: { vsindex: 1 }, localSubrs: [] },
		];
		table.fdSelect = [0, 1];
		table.globalSubrs = [[16]];
		table.variationStore = variationStore();
		expect(inspect(freeze(table), true)).toEqual([]);
		const parsed = parseCFF2(writeCFF2(table));
		expect(inspect(freeze(parsed), true)).toEqual([]);
		expect(diagnoseFont(binary(table, true)).issues.filter((issue) =>
			issue.code.startsWith('CFF_'))).toEqual([]);
	});

	it('lets charstring vsindex override the Private DICT and preserves operands below blend', () => {
		const table = cff2([[
			...n(0), 15,
			...n(0), ...n(20), ...n(2), ...n(1), 16, 21,
		]]);
		table.fontDicts[0].privateDict.vsindex = 1;
		table.variationStore = variationStore();
		expect(inspect(freeze(table), true)).toEqual([]);
	});

	it('supports repeated blends while retaining previously blended prefix operands', () => {
		const table = cff2([[
			...n(10), ...n(2), ...n(1), 16,
			...n(20), ...n(3), ...n(1), 16, 21,
		]]);
		table.variationStore = variationStore();
		expect(inspect(table, true)).toEqual([]);
	});

	it('supports a zero-region blend and flex operands without interpolation', () => {
		const table = cff2([[
			...n(0), ...n(0), 21,
			...Array(7).fill(139), ...n(7), 16, 12, 34,
		]]);
		table.variationStore = variationStore();
		table.variationStore.itemVariationData[0].regionIndexes = [];
		expect(inspect(table, true)).toEqual([]);
	});

	it('rejects missing stores, bad vsindices, missing subtables and bad region references', () => {
		const table = cff2([[...n(0), 15]]);
		expect(codes(inspect(table, true))).toEqual(['CFF_VARIATION_CONTEXT_MISSING']);
		table.variationStore = variationStore();
		table.charStrings = [[...n(2), 15]];
		expect(codes(inspect(table, true))).toEqual(['CFF_VSINDEX_OUT_OF_RANGE']);
		table.charStrings = [[...n(0), 15]];
		table.variationStore.itemVariationData[0] = null;
		expect(codes(inspect(table, true))).toEqual(['CFF_VARIATION_CONTEXT_INVALID']);
		table.variationStore = variationStore();
		table.variationStore.itemVariationData[0].regionIndexes = [2];
		expect(codes(inspect(table, true))).toEqual(['CFF_VARIATION_CONTEXT_INVALID']);
	});

	it.each([0, -1])('rejects blend count %s', (count) => {
		const table = cff2([[...n(count), 16]]);
		table.variationStore = variationStore();
		expect(codes(inspect(table, true))).toEqual(['CFF_BLEND_INVALID_COUNT']);
	});

	it('checks blend underflow using the actual selected region count', () => {
		const table = cff2([[...n(10), ...n(2), ...n(1), 16]]);
		table.fontDicts[0].privateDict.vsindex = 1;
		table.variationStore = variationStore();
		expect(codes(inspect(table, true))).toEqual(['CFF_STACK_UNDERFLOW']);
	});

	it.each([
		{ program: [...n(0), 15, ...n(1), 15] },
		{ program: [...n(10), ...n(2), ...n(1), 16, 22, ...n(0), 15] },
	])('rejects repeated or late vsindex across calls ($program)', ({ program }) => {
		const table = cff2([[...call()]], [program]);
		table.variationStore = variationStore();
		expect(codes(inspect(table, true))).toEqual(['CFF_VSINDEX_ORDER_INVALID']);
	});

	it('shares vsindex/blend ordering state with callers but resets it for the next glyph', () => {
		const table = cff2([
			[...n(0), 15, ...call()],
			[...n(0), 15],
		], [[...n(1), 15]]);
		table.variationStore = variationStore();
		expect(codes(inspect(table, true))).toEqual(['CFF_VSINDEX_ORDER_INVALID']);
		table.charStrings[0] = [...call(), ...n(0), 15];
		table.fontDicts[0].localSubrs[0] = [...n(10), ...n(2), ...n(1), 16, 22];
		expect(codes(inspect(table, true))).toEqual(['CFF_VSINDEX_ORDER_INVALID']);
		table.charStrings[0] = [...n(0), 15];
		expect(inspect(table, true)).toEqual([]);
	});

	it('does not use a blended design coordinate as a concrete subroutine index', () => {
		const table = cff2([[...n(-107), ...n(1), ...n(1), 16, 10]], [[]]);
		table.variationStore = variationStore();
		expect(codes(inspect(table, true))).toEqual(['CFF_CONTEXT_UNSUPPORTED']);
	});

	it('requires the variation store for an ordered Private DICT blend program', () => {
		const table = cff2();
		table.fontDicts[0].privateDictEntries = [{ operator: 23, operands: [10, 2, 1] }];
		expect(codes(inspect(freeze(table), true))).toEqual(['CFF_VARIATION_CONTEXT_MISSING']);
	});
});
