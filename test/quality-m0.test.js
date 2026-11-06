import { beforeAll, describe, expect, it, vi } from 'vitest';
import { exportFont } from '../src/export.js';
import { FontFlux } from '../src/font_flux.js';
import { importFontTables } from '../src/import.js';
import { _internal } from '../src/validate/diagnoseFont.js';

// Original authored fixtures and explicit big-endian mutations. Assertions on
// raw words/mapping arithmetic are independent of FFJS's diagnostic helpers.
function fixture(format = 'sfnt') {
	const font = FontFlux.create({ family: 'M0 fixture' });
	font.addGlyph({
		name: 'A',
		unicode: 65,
		advanceWidth: 500,
		contours: [
			[
				{ x: 0, y: 0, onCurve: true },
				{ x: 50, y: 100, onCurve: true },
				{ x: 100, y: 0, onCurve: true },
			],
		],
	});
	return font.export({ format });
}

function entry(buffer, tag) {
	const view = new DataView(buffer);
	for (let index = 0; index < view.getUint16(4); index++) {
		const record = 12 + index * 16;
		if (String.fromCharCode(...new Uint8Array(buffer, record, 4)) === tag)
			return {
				record,
				offset: view.getUint32(record + 8),
				length: view.getUint32(record + 12),
			};
	}
	throw new Error(`Missing fixture table ${tag}`);
}

function codes(report) {
	return report.issues.map((issue) => issue.code);
}

function indirectCmap(glyph = 250, delta = -248, rangeOffset = 4) {
	const buffer = new ArrayBuffer(46);
	const view = new DataView(buffer);
	view.setUint16(2, 1);
	view.setUint16(4, 3);
	view.setUint16(6, 1);
	view.setUint32(8, 12);
	for (const [offset, value] of [
		[0, 4],
		[2, 34],
		[6, 4],
		[8, 4],
		[10, 1],
		[14, 65],
		[16, 65535],
		[20, 65],
		[22, 65535],
		[26, 1],
		[28, rangeOffset],
		[32, glyph],
	])
		view.setUint16(12 + offset, value);
	view.setInt16(36, delta);
	const raw = importFontTables(fixture());
	raw.tables.cmap = { _raw: Array.from(new Uint8Array(buffer)) };
	return exportFont(raw);
}

beforeAll(async () => {
	await FontFlux.initWoff2();
});

describe('M0 versioned profiles and coverage', () => {
	it('provides deterministic located findings and real check outcomes without certifying completeness', () => {
		const buffer = fixture();
		new DataView(buffer).setUint16(6, 0);
		const before = buffer.slice(0);
		const a = FontFlux.inspect(buffer);
		expect(JSON.stringify(a)).toBe(JSON.stringify(FontFlux.inspect(buffer)));
		expect(a.schemaVersion).toBe(1);
		expect(a.complete).toBe(false);
		expect(a.diagnostics.valid).toBe(true);
		const issue = a.diagnostics.issues.find(
			(item) => item.code === 'BAD_SEARCH_RANGE',
		);
		expect(issue).toMatchObject({
			outcome: 'failed',
			source: 'original-bytes',
			location: { byteOffset: 0, faceIndex: 0 },
		});
		expect(issue.id).toBeTruthy();
		expect(issue.checkId).not.toBe('binary.unclassified');
		expect(
			a.checks.find((check) => check.id === issue.executionId).findingIds,
		).toContain(issue.id);
		expect(buffer).toEqual(before);
	});

	it('does not present unrun phases or unknown table semantics as passed', () => {
		const short = FontFlux.diagnose(new ArrayBuffer(12), { maxInputBytes: 11 });
		expect(short.complete).toBe(false);
		expect(short.checks).toContainEqual(
			expect.objectContaining({
				id: 'binary.faces',
				outcome: 'blocked',
				coverage: 'not-checked',
			}),
		);
		const raw = importFontTables(fixture());
		raw.tables.ZZZZ = { _raw: [1, 2, 3, 4, 5] };
		const buffer = exportFont(raw);
		const report = FontFlux.inspect(buffer);
		expect(report.checks).toContainEqual(
			expect.objectContaining({
				id: 'binary.parse.ZZZZ',
				outcome: 'unsupported',
				reasonCode: 'parser-unavailable',
			}),
		);
		expect(
			Array.from(new Uint8Array(buffer, entry(buffer, 'ZZZZ').offset, 5)),
		).toEqual([1, 2, 3, 4, 5]);
	});

	it('keeps wrapper checks on original bytes and SFNT checks on reconstructed bytes', () => {
		const report = FontFlux.inspect(fixture('woff'));
		expect(
			report.checks.find((check) => check.id === 'binary.woff1-wrapper').source,
		).toBe('original-bytes');
		expect(
			report.checks.find((check) => check.id === 'binary.header').source,
		).toBe('decoded-sfnt');
		expect(
			report.checks.find((check) => check.id === 'binary.sfnt-adjustment'),
		).toMatchObject({
			outcome: 'skipped',
			reasonCode: 'not-applicable',
		});
	});

	it('keeps publishing opt-in and blocks absent external context rather than passing it', () => {
		const buffer = fixture();
		const original = buffer.slice(0);
		expect(
			FontFlux.qualityProfiles().map((profile) => [
				profile.id,
				profile.version,
			]),
		).toEqual([
			['structural', 1],
			['interoperability', 1],
			['publishing', 1],
		]);
		const structural = FontFlux.inspect(buffer);
		expect(structural.diagnostics.valid).toBe(true);
		expect(
			structural.checks.some((check) =>
				check.id.startsWith('profile.publishing'),
			),
		).toBe(false);
		const publishing = FontFlux.inspect(buffer, { profile: 'publishing' });
		expect(publishing.profileReport.complete).toBe(false);
		expect(publishing.profileReport.passed).toBe(false);
		expect(
			publishing.profileReport.checks
				.filter((check) => check.outcome === 'blocked')
				.map((check) => check.reasonCode),
		).toEqual(['missing-family-context', 'missing-filename-context']);
		expect(publishing.repairs).toEqual(structural.repairs);
		expect(buffer).toEqual(original);
	});

	it('reports filename/family policy provenance, consequences, and explicit expectations', () => {
		const options = {
			profile: 'publishing',
			context: {
				fileName: 'M0.ttf',
				expectedFileName: 'M0.ttf',
				expectedFamilyName: 'M0 fixture',
			},
		};
		expect(FontFlux.inspect(fixture(), options).profileReport.passed).toBe(
			true,
		);
		const report = FontFlux.inspect(fixture(), {
			...options,
			context: {
				...options.context,
				expectedFileName: 'Other.ttf',
				expectedFamilyName: 'Other',
			},
		});
		expect(codes(report.profileReport)).toEqual([
			'PROFILE_FAMILY_NAME_MISMATCH',
			'PROFILE_FILENAME_MISMATCH',
		]);
		for (const issue of report.profileReport.issues) {
			expect(issue.source).toBe('profile-context');
			expect(issue.provenance).toBeTruthy();
			expect(issue.rationale).toBeTruthy();
			expect(issue.consequence).toBeTruthy();
		}
		expect(() => FontFlux.inspect(fixture(), { profileVersion: 2 })).toThrow(
			/version/,
		);
		expect(() =>
			FontFlux.inspect(fixture(), { context: { fileName: '' } }),
		).toThrow(/nonempty/);
	});

	it('distinguishes OpenType OS/2 requirements from legacy Apple true-flavor and low-level compatibility', () => {
		const raw = importFontTables(fixture());
		delete raw.tables['OS/2'];
		const buffer = exportFont(raw);
		expect(FontFlux.diagnose(buffer).valid).toBe(true);
		expect(codes(FontFlux.inspect(buffer).diagnostics)).toContain(
			'PROFILE_REQUIRED_TABLE_MISSING',
		);
		new DataView(buffer).setUint32(0, 0x74727565);
		expect(codes(FontFlux.inspect(buffer).diagnostics)).not.toContain(
			'PROFILE_REQUIRED_TABLE_MISSING',
		);
	});

	it('keeps Windows naming recommendations out of the default profile', () => {
		const raw = importFontTables(fixture());
		raw.tables.name.names = raw.tables.name.names.filter(
			(name) => name.platformID === 3,
		);
		for (const name of raw.tables.name.names) {
			name.platformID = 0;
			name.encodingID = 4;
			name.languageID = 0;
		}
		const bytes = exportFont(raw);
		expect(codes(FontFlux.inspect(bytes).diagnostics)).not.toContain(
			'PROFILE_WINDOWS_NAMES_MISSING',
		);
		const report = FontFlux.inspect(bytes, { profile: 'interoperability' });
		expect(report.diagnostics.valid).toBe(true);
		expect(codes(report.profileReport)).toContain(
			'PROFILE_WINDOWS_NAMES_MISSING',
		);
	});
});

describe('M0 exact binary and mapping acceptance fixtures', () => {
	it('accepts compact metrics without confusing trailing bearings with full metrics', () => {
		const raw = importFontTables(fixture());
		raw.tables.hhea.numberOfHMetrics = 1;
		raw.tables.hmtx = {
			hMetrics: [{ advanceWidth: 500, lsb: 0 }],
			leftSideBearings: [10, 20],
		};
		const bytes = exportFont(raw);
		const metric = entry(bytes, 'hmtx');
		expect(metric.length).toBe(8);
		expect(
			Array.from({ length: 4 }, (_, i) =>
				new DataView(bytes).getUint16(metric.offset + i * 2),
			),
		).toEqual([500, 0, 10, 20]);
		expect(codes(FontFlux.diagnose(bytes))).not.toContain('HHEA_HMTX_MISMATCH');
		expect(codes(FontFlux.diagnose(bytes))).not.toContain(
			'HMTX_GLYPH_MISMATCH',
		);
	});

	it('checks indirect format-4 mappings after delta, including unmapped zero and invalid array offsets', () => {
		expect((250 - 248) & 65535).toBe(2);
		expect(codes(FontFlux.diagnose(indirectCmap()))).not.toContain(
			'CMAP_GLYPH_OUT_OF_RANGE',
		);
		expect(codes(FontFlux.diagnose(indirectCmap(0, 100)))).not.toContain(
			'CMAP_GLYPH_OUT_OF_RANGE',
		);
		expect(codes(FontFlux.diagnose(indirectCmap(1, 3)))).toContain(
			'CMAP_GLYPH_OUT_OF_RANGE',
		);
		expect(codes(FontFlux.diagnose(indirectCmap(1, 0, 3)))).toContain(
			'CMAP_FORMAT4_RANGE_OFFSET_INVALID',
		);
		expect(codes(FontFlux.diagnose(indirectCmap(1, 0, 100)))).toContain(
			'CMAP_FORMAT4_RANGE_OFFSET_INVALID',
		);
	});

	it('accepts compact vertical metrics with the actual parsed vMetrics field', () => {
		const raw = importFontTables(fixture());
		const header = new ArrayBuffer(36);
		const view = new DataView(header);
		view.setUint16(0, 1);
		view.setUint16(10, 1000);
		view.setUint16(34, 1);
		raw.tables.vhea = { _raw: Array.from(new Uint8Array(header)) };
		raw.tables.vmtx = {
			vMetrics: [{ advanceHeight: 1000, topSideBearing: 0 }],
			topSideBearings: [10, 20],
		};
		const bytes = exportFont(raw);
		expect(entry(bytes, 'vmtx').length).toBe(8);
		expect(codes(FontFlux.diagnose(bytes))).not.toContain('VHEA_VMTX_MISMATCH');
	});

	it.each([
		[0xd7ff, true],
		[0xd800, false],
		[0xdfff, false],
		[0xe000, true],
		[0x10000, true],
		[0x10ffff, true],
		[0x110000, false],
	])('checks supplementary Unicode scalar boundary %i', (value, valid) => {
		const issues = [];
		_internal.validateCmapDeep(
			{
				version: 0,
				encodingRecords: [{ platformID: 0, encodingID: 4, subtableIndex: 0 }],
				subtables: [
					{
						format: 12,
						language: 0,
						groups: [
							{ startCharCode: value, endCharCode: value, startGlyphID: 1 },
						],
					},
				],
			},
			{ numGlyphs: 3 },
			issues,
		);
		expect(codes({ issues })).not.toContain('CMAP_NO_SUPPORTED_SUBTABLE');
		expect(codes({ issues }).includes('CMAP_UNICODE_SCALAR_INVALID')).toBe(
			!valid,
		);
	});

	it('checks original binary UVS scalar, ordering, conflict, and glyph-ID boundaries', () => {
		const raw = importFontTables(fixture());
		const index = raw.tables.cmap.subtables.length;
		const record = {
			varSelector: 0x180f,
			defaultUVS: [{ startUnicodeValue: 65, additionalCount: 0 }],
			nonDefaultUVS: [{ unicodeValue: 0x10000, glyphID: 2 }],
		};
		raw.tables.cmap.encodingRecords.push({
			platformID: 0,
			encodingID: 5,
			subtableIndex: index,
		});
		raw.tables.cmap.encodingRecords.sort(
			(a, b) => a.platformID - b.platformID || a.encodingID - b.encodingID,
		);
		raw.tables.cmap.subtables.push({
			format: 14,
			varSelectorRecords: [record],
		});
		expect(FontFlux.diagnose(exportFont(raw)).valid).toBe(true);
		record.nonDefaultUVS[0].unicodeValue = 65;
		expect(codes(FontFlux.diagnose(exportFont(raw)))).toContain(
			'CMAP_FORMAT14_UVS_CONFLICT',
		);
		record.nonDefaultUVS[0].unicodeValue = 0xd800;
		record.nonDefaultUVS[0].glyphID = 3;
		expect(codes(FontFlux.diagnose(exportFont(raw)))).toContain(
			'CMAP_UNICODE_SCALAR_INVALID',
		);
		expect(codes(FontFlux.diagnose(exportFont(raw)))).toContain(
			'CMAP_GLYPH_OUT_OF_RANGE',
		);
		record.defaultUVS.push({ startUnicodeValue: 65, additionalCount: 1 });
		expect(codes(FontFlux.diagnose(exportFont(raw)))).toContain(
			'CMAP_FORMAT14_UVS_ORDER_INVALID',
		);
	});

	it('detects the maximum glyph in the interior of a wrapped direct delta range', () => {
		const issues = [];
		const cmap = {
			version: 0,
			encodingRecords: [{ platformID: 3, encodingID: 1, subtableIndex: 0 }],
			subtables: [
				{
					format: 4,
					language: 0,
					segments: [
						{ startCode: 0, endCode: 3, idDelta: -2, idRangeOffset: 0 },
						{ startCode: 65535, endCode: 65535, idDelta: 1, idRangeOffset: 0 },
					],
					glyphIdArray: [],
				},
			],
		};
		expect([0, 1, 2, 3].map((cp) => (cp - 2) & 65535)).toContain(65535);
		_internal.validateCmapDeep(cmap, { numGlyphs: 65535 }, issues);
		expect(codes({ issues })).toContain('CMAP_GLYPH_OUT_OF_RANGE');
	});

	it('discloses the semantic coverage gap for valid legacy cmap subtables', () => {
		const raw = importFontTables(fixture());
		const index = raw.tables.cmap.subtables.length;
		raw.tables.cmap.subtables.push({
			format: 0,
			language: 0,
			glyphIdArray: Array(256).fill(0),
		});
		raw.tables.cmap.encodingRecords.unshift({
			platformID: 1,
			encodingID: 0,
			subtableIndex: index,
		});
		const report = FontFlux.inspect(exportFont(raw));
		expect(codes(report.diagnostics)).not.toContain(
			'CMAP_NO_SUPPORTED_SUBTABLE',
		);
		expect(
			report.checks.some(
				(check) =>
					check.id.startsWith('binary.cmap-format.') &&
					check.outcome === 'unsupported',
			),
		).toBe(true);
	});

	it('distinguishes legal flags from invalid GDEF references and ignored attachment selectors', () => {
		const layout = {
			lookupList: {
				lookups: [{ lookupType: 1, lookupFlag: 0x110, markFilteringSet: 0 }],
			},
		};
		const gdef = {
			markGlyphSetsDef: { coverages: [{ format: 1, glyphs: [1] }] },
		};
		let issues = [];
		_internal.validateLayoutLookups(layout, 'GSUB', issues);
		_internal.validateLayoutReferences(layout, gdef, 'GSUB', issues);
		expect(issues).toEqual([]);
		layout.lookupList.lookups[0].markFilteringSet = 1;
		_internal.validateLayoutReferences(layout, gdef, 'GSUB', issues);
		expect(codes({ issues })).toEqual(['LAYOUT_MARK_FILTER_SET_INVALID']);
		issues = [];
		layout.lookupList.lookups[0].lookupFlag = 0x100;
		_internal.validateLayoutReferences(layout, {}, 'GSUB', issues);
		expect(codes({ issues })).toEqual([
			'LAYOUT_MARK_ATTACHMENT_CLASS_UNAVAILABLE',
		]);
		issues = [];
		layout.lookupList.lookups[0].lookupFlag = 0x108;
		_internal.validateLayoutReferences(layout, {}, 'GSUB', issues);
		expect(issues).toEqual([]);
	});

	it('detects tables overlapping the directory itself', () => {
		const bytes = fixture();
		new DataView(bytes).setUint32(entry(bytes, 'head').record + 8, 12);
		const issue = FontFlux.diagnose(bytes).errors.find(
			(item) => item.code === 'TABLE_OVERLAPS_DIRECTORY',
		);
		expect(issue.location).toMatchObject({
			table: 'head',
			byteOffset: 12,
			faceIndex: 0,
		});
	});

	it.each([
		'woff',
		'woff2',
	])('retains original %s wrapper errors independently of reconstruction', (format) => {
		const bytes = fixture(format);
		const prefix = format === 'woff' ? 'WOFF1' : 'WOFF2';
		const metadata = format === 'woff' ? 24 : 28;
		const privateOffset = format === 'woff' ? 36 : 40;
		const view = new DataView(bytes);
		view.setUint16(14, 1);
		view.setUint32(metadata, bytes.byteLength + 4);
		view.setUint32(metadata + 4, 4);
		view.setUint32(metadata + 8, 4);
		view.setUint32(privateOffset, bytes.byteLength + 8);
		view.setUint32(privateOffset + 4, 4);
		const original = bytes.slice(0);
		const report = FontFlux.diagnose(bytes);
		expect(codes(report)).toContain(`${prefix}_RESERVED_FIELD_NONZERO`);
		expect(codes(report)).toContain(`${prefix}_METADATA_BLOCK_INVALID`);
		expect(codes(report)).toContain(`${prefix}_PRIVATE_BLOCK_INVALID`);
		expect(codes(report)).toContain(`${prefix}_UNWRAP_FAILED`);
		expect(report.complete).toBe(false);
		expect(bytes).toEqual(original);
	});

	it('bounds shared composite DAGs linearly and honors exact work/depth boundaries', () => {
		const glyf = {
			glyphs: [{ components: [{ glyphIndex: 1 }, { glyphIndex: 2 }] }, {}, {}],
		};
		for (const [options, limited] of [
			[{ maxStructureNodes: 5, maxStructureDepth: 2 }, false],
			[{ maxStructureNodes: 4, maxStructureDepth: 2 }, true],
			[{ maxStructureNodes: 5, maxStructureDepth: 1 }, true],
		]) {
			const issues = [];
			_internal.validateGlyfComposites(glyf, 3, issues, options);
			expect(codes({ issues }).includes('DIAGNOSTIC_LIMIT_EXCEEDED')).toBe(
				limited,
			);
		}
		const shared = {
			glyphs: Array.from({ length: 17 }, (_, i) =>
				i === 16
					? {}
					: {
							components: [{ glyphIndex: i + 1 }, { glyphIndex: i + 1 }],
						},
			),
		};
		const issues = [];
		_internal.validateGlyfComposites(shared, 17, issues, {
			maxStructureNodes: 49,
			maxStructureDepth: 17,
		});
		expect(issues).toEqual([]);
	});
});

describe('M0 original, project, resolved, and actual-output stages', () => {
	it.each([
		'sfnt',
		'woff',
		'otf',
	])('checks the exact ordinary %s export of an unchanged imported project', async (format) => {
		const font = FontFlux.open(fixture());
		const expected = font.export({ format });
		const result = await font.preflight({ format });
		expect(result.state).toBe('verified');
		expect(result.buffer).toEqual(expected);
	});

	it('keeps selected collection source indices separate from standalone output face zero', async () => {
		const collection = FontFlux.exportCollection([
			FontFlux.create({ family: 'First' }),
			FontFlux.create({ family: 'Second' }),
		]);
		const faces = FontFlux.openAll(collection);
		for (let index = 0; index < faces.length; index++) {
			const result = await faces[index].preflight({ format: 'sfnt' });
			expect(result.state).toBe('verified');
			expect(
				result.stages[0].report.diagnostics.faces.map((face) => face.faceIndex),
			).toEqual([index]);
			expect(
				result.output.diagnostics.faces.map((face) => face.faceIndex),
			).toEqual([0]);
		}
	});

	it('retains immutable original corruption and normalization evidence after successful export', async () => {
		const bytes = fixture();
		new DataView(bytes).setUint16(6, 0);
		const font = FontFlux.open(bytes);
		new DataView(bytes).setUint16(6, 999);
		const project = structuredClone(font.data);
		const result = await font.preflight({ format: 'sfnt' });
		expect(result.state).toBe('verified');
		expect(result.stages.map((stage) => stage.id)).toEqual([
			'original',
			'project',
			'resolved',
			'output',
		]);
		expect(
			result.stages[0].report.diagnostics.issues.find(
				(issue) => issue.code === 'BAD_SEARCH_RANGE',
			).message,
		).toContain('0');
		expect(result.normalizations).toContainEqual(
			expect.objectContaining({
				code: 'BAD_SEARCH_RANGE',
				kind: 'finding-not-observed-in-output',
			}),
		);
		expect(font.data).toEqual(project);
		expect(result.output).toBe(result.stages[3].report);
	});

	it('does not invent original bytes for authored or JSON-restored projects', async () => {
		const font = FontFlux.create({ family: 'Authored' });
		for (const candidate of [font, FontFlux.fromJSON(font.toJSON())]) {
			const result = await candidate.preflight();
			expect(result.state).toBe('verified');
			expect(result.stages[0]).toMatchObject({
				status: 'skipped',
				reasonCode: 'no-original-bytes',
				report: null,
			});
		}
	});

	it('retains original nonzero cmap version even if resolution normalizes it', async () => {
		const bytes = fixture();
		new DataView(bytes).setUint16(entry(bytes, 'cmap').offset, 1);
		const font = FontFlux.open(bytes);
		const result = await font.preflight({ format: 'woff' });
		expect(codes(result.stages[0].report.diagnostics)).toContain(
			'CMAP_VERSION_INVALID',
		);
		expect(result.output.format).toBe('woff');
		if (result.state === 'verified') {
			expect(codes(result.output.diagnostics)).not.toContain(
				'CMAP_VERSION_INVALID',
			);
			expect(
				result.normalizations.some(
					(item) => item.code === 'CMAP_VERSION_INVALID',
				),
			).toBe(true);
		} else {
			expect(result.buffer).toBeNull();
			expect(codes(result.output.diagnostics)).toContain(
				'CMAP_VERSION_INVALID',
			);
		}
	});

	it('keeps preflight blocked for invalid projects and missing selected policy context', async () => {
		const font = FontFlux.create({ family: 'Authored' });
		const policy = await font.preflight({ profile: 'publishing' });
		expect(policy.state).toBe('unsupported');
		expect(policy.buffer).toBeNull();
		font.data.font.unitsPerEm = 1;
		const failed = await font.preflight();
		expect(failed.stages[1].status).toBe('failed');
		expect(failed.stages[2].status).toBe('blocked');
		expect(failed.stages[3].status).toBe('blocked');
	});

	it('surfaces an actually uninitialized WOFF2 decoder without a face pass', async () => {
		const bytes = fixture('woff2');
		vi.resetModules();
		const { diagnoseFont } = await import('../src/validate/diagnoseFont.js');
		const report = diagnoseFont(bytes);
		expect(report.valid).toBe(false);
		expect(report.complete).toBe(false);
		expect(report.faces).toEqual([]);
		expect(
			report.errors.find((issue) => issue.code === 'WOFF2_UNWRAP_FAILED')
				.message,
		).toMatch(/init|Brotli/i);
	});
});
