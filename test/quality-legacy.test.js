import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { writeCFF } from '../src/otf/table_CFF.js';
import { inspectLegacy, recoverLegacy } from '../src/validate/workflow-legacy.js';

const encode = (text) => new TextEncoder().encode(text);
function join(...arrays) {
	const bytes = new Uint8Array(arrays.reduce((sum, array) => sum + array.length, 0));
	let offset = 0;
	for (const array of arrays) { bytes.set(array, offset); offset += array.length; }
	return bytes;
}
function encrypt(payload, seed, prefix = 4) {
	const plain = join(new Uint8Array(prefix), payload), bytes = new Uint8Array(plain.length);
	let state = seed;
	for (let i = 0; i < plain.length; i++) {
		const value = plain[i] ^ (state >>> 8);
		bytes[i] = value;
		state = ((value + state) * 52845 + 22719) & 65535;
	}
	return bytes;
}
function type1({ format = 'pfa', programs = { '.notdef': [139, 248, 136, 13, 14] }, subrs = [], declared, lengthExtra = 0, lenIV = 4 } = {}) {
	const header = encode('%!PS-AdobeFont-1.0: Original 1.0\n/FontType 1 def\n/FontName /Original def\ncurrentfile eexec\n');
	const parts = [encode(`/Private 2 dict dup begin /lenIV ${lenIV} def\n`)];
	if (subrs.length) {
		parts.push(encode(`/Subrs ${subrs.length} array\n`));
		for (const [index, program] of subrs.entries()) {
			const bytes = lenIV < 0 ? new Uint8Array(program) : encrypt(new Uint8Array(program), 4330, lenIV);
			parts.push(encode(`dup ${index} ${bytes.length} RD `), bytes, encode(' NP\n'));
		}
	}
	parts.push(encode(`/CharStrings ${declared ?? Object.keys(programs).length} dict dup begin\n`));
	for (const [name, program] of Object.entries(programs)) {
		const bytes = lenIV < 0 ? new Uint8Array(program) : encrypt(new Uint8Array(program), 4330, lenIV);
		parts.push(encode(`/${name} ${bytes.length + lengthExtra} RD `), bytes, encode(' ND\n'));
	}
	parts.push(encode('end end\n'));
	const privateBytes = encrypt(join(...parts), 55665);
	if (format === 'pfa') return join(header, encode(Array.from(privateBytes, (b) => b.toString(16).padStart(2, '0')).join('') + '\ncleartomark\n'));
	const segment = (type, bytes) => {
		const frame = new Uint8Array(6);
		frame[0] = 128; frame[1] = type; new DataView(frame.buffer).setUint32(2, bytes.length, true);
		return join(frame, bytes);
	};
	return join(segment(1, header), segment(2, privateBytes), new Uint8Array([128, 3]));
}
function cffFixture() {
	const bytes = readFileSync(new URL('./sample fonts/oblegg.otf', import.meta.url));
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	for (let i = 0; i < view.getUint16(4); i++) {
		const position = 12 + i * 16;
		if (String.fromCharCode(...bytes.subarray(position, position + 4)) === 'CFF ')
			return bytes.slice(view.getUint32(position + 8), view.getUint32(position + 8) + view.getUint32(position + 12));
	}
	throw new Error('Fixture lacks CFF');
}
const codes = (report) => report.issues.map((entry) => entry.code);

describe('honest original-format legacy inspection', () => {
	it('inspects real standalone CFF INDEXes and original glyph programs without synthetic metrics', () => {
		const bytes = cffFixture(), original = bytes.slice(), report = inspectLegacy(bytes);
		expect(report.format).toBe('cff');
		expect(report.diagnostics.valid).toBe(true);
		expect(report.original).toMatchObject({ synthesizedTables: false, mutated: false, fontCount: 1 });
		expect(report.glyphs.length).toBeGreaterThan(1);
		expect(report.capabilities).toMatchObject({ repairOriginalFormat: false, exportOriginalFormat: true });
		expect(bytes).toEqual(original);
	});

	it('does not turn truncated CFF into success-shaped empty glyphs', () => {
		const bytes = cffFixture();
		for (const length of [1, 4, 8, 24, bytes.length - 100]) {
			const report = inspectLegacy(bytes.subarray(0, length));
			expect(report.diagnostics.valid).toBe(false);
			expect(codes(report)).toContain('LEGACY_STRUCTURE_INVALID');
		}
		const invalid = bytes.slice(); invalid[3] = 0;
		expect(codes(inspectLegacy(invalid))).toContain('LEGACY_STRUCTURE_INVALID');
	});

	it('reports standalone CFF2 and AFM as unsupported context rather than invalid SFNT', () => {
		const cff2 = inspectLegacy(new Uint8Array([2, 0, 5, 0, 0]));
		expect(codes(cff2)).toContain('LEGACY_CFF_VERSION_UNSUPPORTED');
		expect(cff2.diagnostics.valid).toBeNull();
		const afm = inspectLegacy(encode('StartFontMetrics 4.1\nEndFontMetrics'));
		expect(afm.format).toBe('afm');
		expect(afm.capabilities.inspect).toBe('unsupported');
		expect(afm.glyphs).toEqual([]);
	});

	it('preserves CFF glyph/font locations and reports execution budgets without declaring invalidity', () => {
		const input = writeCFF({ names: ['Evidence'], globalSubrs: [], fonts: [{ topDict: {}, charStrings: [[28]], localSubrs: [] }] });
		const report = inspectLegacy(new Uint8Array(input));
		const failure = report.issues.find((entry) => entry.code === 'CFF_INVALID_NUMBER');
		expect(failure).toMatchObject({ source: 'original-bytes', location: { table: 'CFF ', fontIndex: 0, glyphIndex: 0 } });
		expect(report.checks[0].id).toBe('binary.CFF');
		const exhausted = inspectLegacy(type1(), { maxCharStringOperations: 1 });
		expect(exhausted.diagnostics.valid).toBeNull();
	});

	for (const format of ['pfa', 'pfb']) {
		it(`checks ${format} original framing/decryption/widths and does not invent SFNT metadata`, () => {
			const input = type1({ format }), original = input.slice(), report = inspectLegacy(input);
			expect(report.diagnostics.valid).toBe(true);
			expect(report.glyphs).toEqual([expect.objectContaining({ glyphName: '.notdef', width: 500, ended: true })]);
			expect(report.original.synthesizedTables).toBe(false);
			expect(report.capabilities.exportOriginalFormat).toBe(false);
			expect(input).toEqual(original);
		});
	}

	it('supports explicit unencrypted charstrings and reports missing widths/artwork', () => {
		expect(inspectLegacy(type1({ lenIV: -1 })).diagnostics.valid).toBe(true);
		const missingWidth = inspectLegacy(type1({ programs: { '.notdef': [14] } }));
		expect(codes(missingWidth)).toContain('LEGACY_TYPE1_WIDTH_MISSING');
		expect(missingWidth.glyphs[0].width).toBeNull();
		expect(codes(inspectLegacy(type1({ programs: { A: [139, 248, 136, 13, 14] } })))).toContain('LEGACY_TYPE1_NOTDEF_MISSING');
	});

	it('reports malformed hex, framing, counts, numeric truncation and record extents', () => {
		const badHex = join(type1().subarray(0, 110), encode('not-hex'));
		expect(codes(inspectLegacy(badHex))).toContain('LEGACY_STRUCTURE_INVALID');
		const pfb = type1({ format: 'pfb' });
		expect(codes(inspectLegacy(pfb.subarray(0, -1)))).toContain('LEGACY_STRUCTURE_INVALID');
		expect(codes(inspectLegacy(type1({ declared: 2 })))).toContain('LEGACY_STRUCTURE_INVALID');
		expect(codes(inspectLegacy(type1({ lengthExtra: 1000 })))).toContain('LEGACY_STRUCTURE_INVALID');
		expect(codes(inspectLegacy(type1({ programs: { '.notdef': [255, 0] } })))).toContain('LEGACY_TYPE1_PROGRAM_INVALID');
		expect(codes(inspectLegacy(type1({ programs: { '.notdef': [139, 248, 136, 13] } })))).toContain('LEGACY_TYPE1_NO_ENDCHAR');
	});

	it('reports unsupported operators without pretending composite/flex recovery ran', () => {
		const report = inspectLegacy(type1({ programs: { '.notdef': [139, 248, 136, 13, 12, 6] } }));
		expect(codes(report)).toContain('LEGACY_TYPE1_OPERATOR_UNSUPPORTED');
		expect(report.glyphs[0].unsupportedOperators).toEqual(['12 6']);
		expect(report.complete).toBe(false);
		expect(report.repairs).toEqual([]);
	});

	it('executes supported subroutines, rejects cycles/missing targets, and records width provenance', () => {
		const programs = { '.notdef': [139, 248, 136, 13, 139, 10, 14] };
		const valid = inspectLegacy(type1({ programs, subrs: [[139, 139, 21, 11]] }));
		expect(valid.diagnostics.valid).toBe(true);
		expect(valid.glyphs[0]).toMatchObject({ width: 500, widthY: 0, widthSource: 'hsbw' });
		expect(codes(inspectLegacy(type1({ programs, subrs: [[139, 10, 11]] })))).toContain('LEGACY_TYPE1_PROGRAM_INVALID');
		expect(codes(inspectLegacy(type1({ programs })))).toContain('LEGACY_TYPE1_PROGRAM_INVALID');
		const vector = inspectLegacy(type1({ programs: { '.notdef': [139, 139, 248, 136, 140, 12, 7, 14] } }));
		expect(vector.glyphs[0]).toMatchObject({ width: 500, widthY: 1, widthSource: 'sbw' });
	});

	it('enforces input, glyph and execution budgets', () => {
		expect(() => inspectLegacy(type1(), { maxInputBytes: 1 })).toThrow(/maxInputBytes/);
		expect(codes(inspectLegacy(cffFixture(), { maxGlyphs: 1 }))).toContain('LEGACY_RESOURCE_LIMIT');
		expect(codes(inspectLegacy(type1(), { maxCharStringOperations: 1 }))).toContain('LEGACY_RESOURCE_LIMIT');
		expect(codes(inspectLegacy(cffFixture(), { maxWork: 1 }))).toContain('LEGACY_RESOURCE_LIMIT');
	});

	it('reinspects explicit modern replacement bytes as recovery, never Type 1 repair', () => {
		const input = type1(), replacement = FontFlux.create({ family: 'Recovered separately' }).export({ format: 'sfnt' });
		const before = replacement.slice(0);
		expect(() => recoverLegacy(input, replacement, {}, FontFlux)).toThrow(/authorizeReplacement/);
		const report = recoverLegacy(input, replacement, { authorizeReplacement: true }, FontFlux);
		expect(report).toMatchObject({ operation: 'source-replacement', state: 'inspected', equivalent: null, preservedOriginal: true });
		expect(report.replacement.format).toBe('sfnt');
		expect(report.buffer).toEqual(before);
		expect(report.buffer).not.toBe(replacement);
		const invalid = new Uint8Array([0, 1, 2]);
		expect(recoverLegacy(input, invalid, { authorizeReplacement: true }, FontFlux)).toMatchObject({ state: 'failed', buffer: null });
	});

	it('uses shared original-byte findings while leaving SFNT profile requirements unsupported', () => {
		for (const profile of ['structural', 'interoperability', 'publishing']) {
			const report = inspectLegacy(type1(), { profile, context: { expectedFamilyName: 'Not an SFNT requirement' } });
			expect(report.diagnostics.valid).toBe(true);
			expect(report.profileReport).toMatchObject({ id: profile, valid: null, passed: false, complete: false });
			expect(report.profileReport.checks[0]).toMatchObject({ outcome: 'unsupported', coverage: 'not-checked' });
			expect(report.diagnostics.errors).toEqual([]);
			expect(report.diagnostics.faces).toEqual([]);
		}
		const report = inspectLegacy(type1({ programs: { '.notdef': [14] } }));
		const finding = report.issues.find((item) => item.code === 'LEGACY_TYPE1_WIDTH_MISSING');
		expect(finding).toMatchObject({
			id: expect.any(String), checkId: expect.any(String), executionId: 'workflow.legacy',
			source: 'original-bytes', location: { glyphName: '.notdef' }, outcome: 'failed',
		});
		expect(finding.glyphName).toBe('.notdef');
		expect(report.diagnostics.summary.errorCount).toBeGreaterThan(0);
		expect(inspectLegacy(new Uint8Array([2, 0, 5, 0, 0])).diagnostics.valid).toBeNull();
		expect(() => inspectLegacy(type1(), { profile: 'unregistered' })).toThrow(/Unknown quality profile/);
	});
});
