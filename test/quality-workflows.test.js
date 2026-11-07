import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { exportFont } from '../src/export.js';
import { getCheckDescriptor } from '../src/validate/check-catalog.js';
import { inspectExpectations, inspectFamily, inspectSourceQuality, repairFamily } from '../src/validate/quality-workflows.js';

const family = { id: 'authored-set', profile: 'caller-policy-v1', expectedMembers: ['regular', 'bold'] };
const triangle = (scale = 1) => [
	{ x: 0, y: 0, onCurve: true }, { x: 100 * scale, y: 0, onCurve: true }, { x: 0, y: 100 * scale, onCurve: true },
];
function project(style = 'Regular') {
	const font = FontFlux.create({ family: 'Declared family', style });
	font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 500, contours: [triangle()] });
	font.info.postScriptName = `Declared-${style}`;
	font.info.version = 'Version 1.0';
	font.info.license = 'Caller-authored license';
	return font.data;
}
const codes = (report) => report.issues.map((entry) => entry.code);

describe('explicit family QA and atomic transactions', () => {
	it('requires family context and never infers a collection family', () => {
		expect(() => inspectFamily([{ id: 'regular', input: project() }])).toThrow(/family.id/);
		expect(() => inspectFamily([{ id: 'regular', input: { collection: true, fonts: [project()] } }], { family })).toThrow(/collection face/);
		expect(() => inspectFamily([{ id: 'x', input: project() }, { id: 'x', input: project() }], { family })).toThrow(/unique/);
	});

	it('compares valid declared members without inventing required styles', () => {
		const regular = project(), bold = project('Bold');
		const before = structuredClone([regular, bold]);
		const report = inspectFamily([{ id: 'regular', input: regular }, { id: 'bold', input: bold }], { family });
		expect(report.issues).toEqual([]);
		expect(report.members).toHaveLength(2);
		expect([regular, bold]).toEqual(before);
		expect(codes(inspectFamily([{ id: 'regular', input: regular }], { family }))).toContain('FAMILY_MEMBER_MISSING');
		expect(codes(inspectFamily([{ id: 'regular', input: regular }], { family: { id: 'one', profile: 'custom' } }))).toContain('FAMILY_COMPLETENESS_UNKNOWN');
	});

	it('inspects only explicitly selected faces of a mixed collection', () => {
		const collection = FontFlux.exportCollection([
			FontFlux.create({ family: 'First family', style: 'Regular' }),
			FontFlux.create({ family: 'Different family', style: 'Bold' }),
		]);
		expect(() => inspectFamily([{ id: 'regular', input: collection }], { family })).toThrow(/collection face/);
		const report = inspectFamily([
			{ id: 'regular', input: collection, faceIndex: 0 }, { id: 'bold', input: collection, faceIndex: 1 },
		], { family });
		expect(report.members.map((member) => member.faceIndex)).toEqual([0, 1]);
		expect(codes(report)).toContain('FAMILY_METADATA_DIFFERENCE');
	});

	it('locates duplicate identity/style, linking flags and explicit intent mismatches', () => {
		const regular = project(), duplicate = project();
		duplicate.font.fsSelection = 32;
		duplicate.font.macStyle = 0;
		const report = inspectFamily([{ id: 'regular', input: regular }, { id: 'bold', input: duplicate }], {
			family: { ...family, policy: { members: { bold: { styleName: 'Bold', weightClass: 700 } } } },
		});
		expect(codes(report)).toEqual(expect.arrayContaining(['FAMILY_DUPLICATE_IDENTITY', 'FAMILY_DUPLICATE_STYLE', 'FAMILY_STYLE_LINK_FLAGS', 'FAMILY_EXPECTATION_MISMATCH']));
		expect(report.issues.find((entry) => entry.code === 'FAMILY_DUPLICATE_IDENTITY').evidence.affectedMembers).toEqual(['regular', 'bold']);
		expect(report.issues.find((entry) => entry.code === 'FAMILY_STYLE_LINK_FLAGS')).toMatchObject({ inputIndex: 1, memberId: 'bold' });
	});

	it('treats intentional names/metrics as information, not authorization or errors', () => {
		const regular = project(), bold = project('Bold');
		bold.font.familyName = 'Intended separate label';
		bold.font.ascender = 900;
		const report = inspectFamily([{ id: 'regular', input: regular }, { id: 'bold', input: bold }], {
			family: { ...family, policy: { allowDifferences: ['familyName', 'verticalMetrics'] } },
		});
		expect(report.issues.every((entry) => entry.severity === 'info')).toBe(true);
		expect(codes(report)).toContain('FAMILY_METRIC_DIFFERENCE');
	});

	it('normalizes em metrics and permits static/variable default styles', () => {
		const regular = project(), variable = project();
		variable.font.postScriptName = 'Declared-Variable';
		variable.font.unitsPerEm = 2000;
		variable.font.ascender *= 2; variable.font.descender *= 2;
		variable.axes = [{ tag: 'wght', min: 100, default: 400, max: 900 }];
		variable.instances = [{ name: 'Regular', coordinates: { wght: 400 } }];
		const report = inspectFamily([{ id: 'regular', input: regular }, { id: 'bold', input: variable }], { family });
		expect(report.issues).toEqual([]);
		variable.instances[0].coordinates.wght = 901;
		expect(codes(inspectFamily([{ id: 'regular', input: regular }, { id: 'bold', input: variable }], { family }))).toContain('FAMILY_INSTANCE_COORDINATE');
	});

	it('reports axis conventions and missing coordinates across variable members', () => {
		const a = project(), b = project('Bold');
		a.axes = [{ tag: 'wght', min: 100, default: 400, max: 900 }];
		b.axes = [{ tag: 'wght', min: 100, default: 500, max: 1000 }];
		b.instances = [{ name: 'Incomplete', coordinates: { wdth: 100 } }];
		const report = inspectFamily([{ id: 'regular', input: a }, { id: 'bold', input: b }], { family });
		expect(codes(report)).toEqual(expect.arrayContaining(['FAMILY_AXIS_CONVENTION_DIFFERENCE', 'FAMILY_INSTANCE_COORDINATE_MISSING', 'FAMILY_INSTANCE_COORDINATE']));
		expect(() => inspectFamily([{ id: 'regular', input: a }, { id: 'bold', input: b }], { family, maxMembers: 1 })).toThrow(/maxMembers/);
	});

	it('uses core planning and verification for an atomic successful batch', async () => {
		const a = exportFont(project(), { format: 'sfnt' });
		const b = exportFont(project('Bold'), { format: 'sfnt' });
		new DataView(a).setUint16(6, 0); new DataView(b).setUint16(6, 0);
		const before = [a.slice(0), b.slice(0)];
		const result = await repairFamily([{ id: 'regular', input: a }, { id: 'bold', input: b }], {
			regular: [{ id: 'sfnt.search-fields' }], bold: [{ id: 'sfnt.search-fields' }],
		}, { family }, FontFlux);
		expect(result.state).toBe('verified');
		expect(result.candidates).toHaveLength(2);
		expect(result.committed).toBe(false);
		expect([a, b]).toEqual(before);
	});

	it('returns no candidate after a late verification failure, cancellation or bad request', async () => {
		const a = new Uint8Array([1, 2, 3]), b = new Uint8Array([4, 5, 6]), before = a.slice();
		let applied = 0;
		const adapter = {
			planRepairs: async () => ({}),
			applyRepairs: async (bytes) => {
				new Uint8Array(bytes)[0] = 9;
				return ++applied === 1 ? { state: 'verified', buffer: bytes } : { state: 'failed' };
			},
		};
		const inputs = [{ id: 'regular', input: a }, { id: 'bold', input: b }];
		const result = await repairFamily(inputs, {}, { family }, adapter);
		expect(result).toMatchObject({ state: 'failed', candidates: [], committed: false });
		expect(a).toEqual(before);
		const controller = new AbortController(); controller.abort();
		expect(await repairFamily(inputs, {}, { family, signal: controller.signal }, adapter)).toMatchObject({ state: 'cancelled', candidates: [] });
		await expect(repairFamily(inputs, { unknown: [] }, { family }, adapter)).rejects.toThrow(/unknown member/);
	});

	it.each(['inspection', 'planning', 'application', 'verification'])('cancels the whole family during the second member %s phase', async (phase) => {
		const inputs = ['regular', 'bold'].map((id) => {
			const input = exportFont(project(id), { format: 'sfnt' });
			new DataView(input).setUint16(6, 0);
			return { id, input };
		});
		const originals = inputs.map(({ input }) => input.slice(0)), controller = new AbortController(), progress = [];
		const result = await FontFlux.repairFamily(inputs, Object.fromEntries(inputs.map(({ id }) =>
			[id, [{ id: 'sfnt.search-fields' }]])), {
			family, signal: controller.signal, onProgress(event) {
				progress.push(event);
				if (event.memberId === 'bold' && event.phase === phase) controller.abort();
			},
		});
		expect(progress).toContainEqual({ memberId: 'bold', phase });
		expect(result).toMatchObject({ state: 'cancelled', candidates: [], committed: false });
		expect(inputs.map(({ input }) => input)).toEqual(originals);
	});

	it('discards all results if a caller mutates a source while planning runs', async () => {
		const source = new Uint8Array([1, 2, 3]);
		const adapter = {
			planRepairs: async () => { source[0] = 4; return {}; },
			applyRepairs: async (bytes) => ({ state: 'verified', buffer: bytes }),
		};
		const result = await repairFamily([{ id: 'regular', input: source }], { regular: [{}] }, { family }, adapter);
		expect(result).toMatchObject({ state: 'failed', candidates: [] });
		expect(result.failures[0].message).toContain('source changed');
		await expect(repairFamily([{ id: 'regular', input: source }], {}, { family, maxTotalInputBytes: 2 }, adapter)).rejects.toThrow(/maxTotalInputBytes/);
	});
});

describe('versioned optional expectations and potential reachability', () => {
	it('checks only an explicitly versioned repertoire and handles boundary scalars', () => {
		const data = project();
		const report = inspectExpectations(data, { repertoires: [{ id: 'limited', version: '1', codePoints: [65] }] });
		expect(codes(report)).not.toContain('EXPECTATION_REPERTOIRE_MISSING');
		const changed = inspectExpectations(data, { repertoires: [{ id: 'limited', version: '2', codePoints: [65, 0x10ffff] }] });
		expect(changed.issues.find((entry) => entry.code === 'EXPECTATION_REPERTOIRE_MISSING')).toMatchObject({ repertoireVersion: '2', codePoint: 0x10ffff });
		expect(inspectExpectations(data).coverage[0].status).toBe('not-requested');
		expect(() => inspectExpectations(data, { repertoires: [{ id: 'x', codePoints: [] }] })).toThrow(/explicit version/);
		expect(() => inspectExpectations(data, { repertoires: [{ id: 'x', version: '1', codePoints: [0xd800] }] })).toThrow(/scalar/);
	});

	it('distinguishes shaping, component, color and UVS use from cmap membership', () => {
		const data = project();
		data.glyphs.push(
			{ name: 'A.alt', advanceWidth: 500, components: [{ glyphIndex: 4 }] },
			{ name: 'helper', advanceWidth: 0 },
			{ name: 'color-layer', advanceWidth: 500 },
			{ name: 'A.uvs', advanceWidth: 500 },
			{ name: 'unreferenced', advanceWidth: 0 },
		);
		data.substitutions = [{ type: 'single', from: 'A', to: 'A.alt' }];
		data.colorGlyphs = [{ name: 'A.alt', layers: [{ glyph: 'color-layer', paletteIndex: 0 }] }];
		data.tables = { cmap: { subtables: [{ format: 14, varSelectorRecords: [{ varSelector: 0xfe0f, nonDefaultUVS: [{ unicodeValue: 65, glyphID: 6 }] }] }] } };
		const original = structuredClone(data);
		const report = inspectExpectations(data);
		expect(report.glyphs[3]).toMatchObject({ encoded: false, potentiallyReachable: true, reasons: ['shaping'] });
		expect(report.glyphs[4].reasons).toEqual(['component']);
		expect(report.glyphs[5].reasons).toEqual(['color']);
		expect(report.glyphs[6].reasons).toEqual(['uvs']);
		expect(report.glyphs[7].potentiallyReachable).toBe(false);
		expect(data).toEqual(original);
	});

	it('terminates cyclic graphs and reports incomplete/contextual use without deleting glyphs', () => {
		const data = project();
		data.glyphs[2].components = [{ glyphIndex: 2 }];
		data._rawGSUBLookups = [{}];
		data.substitutions = [{ type: 'unknown' }];
		const report = inspectExpectations(data);
		expect(report.glyphs).toHaveLength(3);
		expect(codes(report)).toEqual(expect.arrayContaining(['EXPECTATION_REACHABILITY_INCOMPLETE', 'EXPECTATION_SHAPING_RULE_UNSUPPORTED']));
		expect(() => inspectExpectations(data, { maxWork: 1 })).toThrow(/maxWork/);
		expect(() => inspectExpectations(data, { roots: ['missing'] })).toThrow(/root/);
	});

	it('resolves authored named components and COLRv1 paint references, including cycles', () => {
		const data = project();
		data.glyphs.push({ name: 'component-only', advanceWidth: 0 }, { name: 'paint-only', advanceWidth: 0 });
		data.glyphs[2].components = [{ glyphName: 'component-only' }];
		const paint = { format: 10, glyphID: 'paint-only' }; paint.paint = paint;
		data.colorGlyphs = [{ name: 'A', paint }];
		const report = inspectExpectations(data);
		expect(report.glyphs[3].reasons).toEqual(['component']);
		expect(report.glyphs[4].reasons).toEqual(['color']);
	});

	it('checks explicit combining-mark and whitespace policies without universal width assumptions', () => {
		const data = project();
		data.glyphs.push({ name: 'acutecomb', unicode: 0x301, advanceWidth: 100, contours: [triangle()] });
		const report = inspectExpectations(data, {
			requiredGlyphs: ['dottedcircle'],
			behavior: [{ codePoint: 0x301, advanceWidth: 0 }, { codePoint: 65, empty: true }, { codePoint: 0x200d, advanceWidth: 0 }],
		});
		expect(codes(report)).toEqual(expect.arrayContaining(['EXPECTATION_GLYPH_MISSING', 'EXPECTATION_ADVANCE_WIDTH', 'EXPECTATION_VISIBLE_WHITESPACE', 'EXPECTATION_BEHAVIOR_GLYPH_MISSING']));
		expect(codes(inspectExpectations(data))).not.toContain('EXPECTATION_ADVANCE_WIDTH');
		expect(report.coverage.find((entry) => entry.domain === 'mark-positioning-and-dotted-circle').status).toBe('unsupported');
	});

	it('checks explicit nonempty expectations and discloses unexamined representations', () => {
		const data = project(), behavior = [{ codePoint: 32, empty: false }];
		expect(codes(inspectExpectations(data, { behavior }))).toContain('EXPECTATION_EMPTY_GLYPH');
		expect(codes(inspectExpectations(data, { behavior: [{ codePoint: 65, empty: false }] }))).not.toContain('EXPECTATION_EMPTY_GLYPH');
		data.glyphs[1].charString = [14];
		const unknown = inspectExpectations(data, { behavior });
		expect(codes(unknown)).toContain('EXPECTATION_BEHAVIOR_UNSUPPORTED');
		expect(codes(unknown)).not.toContain('EXPECTATION_EMPTY_GLYPH');
		expect(unknown.issues.find((entry) => entry.code === 'EXPECTATION_BEHAVIOR_UNSUPPORTED').severity).toBe('info');
		delete data.glyphs[1].charString;
		data.tables = { sbix: { strikes: [] } };
		expect(codes(inspectExpectations(data, { behavior }))).toContain('EXPECTATION_BEHAVIOR_UNSUPPORTED');
	});

	it.each(['roots', 'requiredGlyphs', 'behavior'])('accounts for work in repeated %s expectations', (key) => {
		const value = key === 'behavior' ? { codePoint: 65, empty: false } : 'A';
		expect(() => inspectExpectations(project(), { [key]: Array(100).fill(value), maxWork: 50 })).toThrow(/maxWork/);
	});

	it('checks optional versioned naming conventions without rewriting intended names', () => {
		const data = project(); data.glyphs[2].name = 'A with spaces';
		expect(codes(inspectExpectations(data))).not.toContain('EXPECTATION_GLYPH_NAME_POLICY');
		const report = inspectExpectations(data, { glyphNames: { id: 'my-names', version: '1', maxLength: 63, asciiOnly: true } });
		expect(codes(report)).toContain('EXPECTATION_GLYPH_NAME_POLICY');
		expect(data.glyphs[2].name).toBe('A with spaces');
		expect(() => inspectExpectations(data, { glyphNames: { id: 'missing-version' } })).toThrow(/id and version/);
	});
});

describe('source geometry evidence and explicit master samples', () => {
	it('reports intentional overlap as heuristic information and leaves all geometry intact', () => {
		const data = project(); data.glyphs[2].contours.push(triangle(0.5));
		const before = structuredClone(data);
		const report = inspectSourceQuality([{ id: 'master', input: data, source: { kind: 'authored' } }]);
		expect(report.issues.find((entry) => entry.code === 'OUTLINE_OVERLAP_POSSIBLE')).toMatchObject({ severity: 'info', evidence: { heuristic: true, actualIntersectionComputed: false } });
		expect(report.summary.errors).toBe(0);
		expect(data).toEqual(before);
	});

	describe('shared stable contextual finding contract', () => {
		it('decorates actual findings without inventing conformance passes', () => {
			const data = project();
			const inspect = () => [
				inspectFamily([{ id: 'regular', input: data }], { family }),
				inspectExpectations(data, { requiredGlyphs: ['absent', 'absent'] }),
				inspectSourceQuality([{ id: 'compiled', input: data }]),
			];
			const first = inspect(), second = inspect();
			for (let index = 0; index < first.length; index++) {
				const report = first[index];
				expect(report.complete).toBe(false);
				expect(report.issues.map((finding) => finding.id)).toEqual(second[index].issues.map((finding) => finding.id));
				expect(new Set(report.issues.map((finding) => finding.id)).size).toBe(report.issues.length);
				for (const finding of report.issues) {
					expect(finding.source).toBe('declared-context');
					expect(finding.checkId).toBe(getCheckDescriptor(finding.code)?.checkId ?? `workflow.${report.scope}`);
					expect(finding.executionId).toBeTruthy();
					expect(finding.location).toBeDefined();
					expect(finding.outcome).toBe(finding.severity === 'info' ? 'informational' : 'failed');
					expect(finding.evidence.message).toBe(finding.message);
					expect(report.checks.some((check) => check.findingIds?.includes(finding.id))).toBe(true);
				}
				expect(report.checks.some((check) => check.outcome === 'passed')).toBe(false);
			}
		});
	});

	it('finds degenerate/nonfinite outlines while curved area is explicitly unevaluated', () => {
		const data = project();
		data.glyphs[2].contours = [[{ x: 0, y: 0, onCurve: true }, { x: 0, y: 0, onCurve: true }]];
		data.glyphs.push({ name: 'bad', contours: [[{ x: Infinity, y: 2, onCurve: true }]] });
		data.glyphs.push({ name: 'cubic', contours: [[{ type: 'M', x: 0, y: 0 }, { type: 'C', x1: 0, y1: 100, x2: 100, y2: 100, x: 100, y: 0 }]] });
		const report = inspectSourceQuality([{ id: 'one', input: data }]);
		expect(codes(report)).toEqual(expect.arrayContaining(['OUTLINE_DEGENERATE_CONTOUR', 'OUTLINE_ZERO_LENGTH_SEGMENT', 'OUTLINE_NONFINITE_COORDINATE', 'SOURCE_PROVENANCE_UNAVAILABLE']));
		expect(report.contours.find((entry) => entry.glyphName === 'cubic').winding).toBe('not-evaluated');
	});

	it('compares named topology rather than requiring identical glyph array order', () => {
		const first = project(), second = structuredClone(first);
		second.glyphs.reverse();
		const report = inspectSourceQuality([{ id: 'a', input: first }, { id: 'b', input: second }]);
		expect(codes(report)).not.toContain('SOURCE_MASTER_TOPOLOGY_MISMATCH');
		second.glyphs.find((glyph) => glyph.name === 'A').contours[0].push({ x: 50, y: 50, onCurve: true });
		expect(codes(inspectSourceQuality([{ id: 'a', input: first }, { id: 'b', input: second }]))).toContain('SOURCE_MASTER_TOPOLOGY_MISMATCH');
	});

	it.each([true, false])('distinguishes XY and point attachments with object flags: %s', (objectFlags) => {
		const first = project(), second = structuredClone(first);
		first.glyphs[2].components = [{ glyphIndex: 0, flags: objectFlags ? { argsAreXYValues: true } : 2 }];
		second.glyphs[2].components = [{ glyphIndex: 0, flags: objectFlags ? {} : 0 }];
		const before = structuredClone([first, second]);
		const report = inspectSourceQuality([{ id: 'xy', input: first }, { id: 'points', input: second }]);
		expect(codes(report)).toContain('SOURCE_MASTER_TOPOLOGY_MISMATCH');
		expect([first, second]).toEqual(before);
	});

	it('finds a degenerate interior linear sample without manufacturing a repaired outline', () => {
		const first = project(), second = structuredClone(first);
		for (const point of second.glyphs[2].contours[0]) { point.x *= -1; point.y *= -1; }
		const before = structuredClone([first, second]);
		const report = inspectSourceQuality([{ id: 'a', input: first }, { id: 'b', input: second }], {
			samples: [{ id: 'midpoint', weights: [0.5, 0.5] }],
			engineEvidence: [{ engine: 'caller-test', version: '1', outcome: 'unknown' }],
		});
		expect(report.issues.some((entry) => entry.code === 'OUTLINE_DEGENERATE_CONTOUR' && entry.sampleIndex === 0)).toBe(true);
		expect(report.engineEvidence[0].provenance).toBe('caller-supplied-not-independently-run');
		expect([first, second]).toEqual(before);
	});

	it('reports missing masters/glyphs and refuses unsupported sample assumptions', () => {
		const a = project(), b = structuredClone(a); b.glyphs.pop();
		expect(codes(inspectSourceQuality([{ id: 'a', input: a }, { id: 'b', input: b }]))).toContain('SOURCE_MASTER_GLYPH_MISSING');
		expect(codes(inspectSourceQuality([{ id: 'a', input: a }]))).toContain('SOURCE_MASTERS_UNAVAILABLE');
		expect(() => inspectSourceQuality([{ id: 'a', input: a }], { samples: [{ weights: [2] }] })).toThrow(/summing to one/);
		expect(() => inspectSourceQuality([{ id: 'a', input: a }], { maxWork: 1 })).toThrow(/maxWork/);
		expect(() => inspectSourceQuality([{ id: 'a', input: a }], { tinyArea: -1 })).toThrow(/tinyArea/);
	});
});
