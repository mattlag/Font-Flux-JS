import { StructureLimitError } from '../structure_limits.js';
import { addIssue, advancedContext } from './advanced-common.js';
import { validateCff2PrivateDictionary } from './advanced-cff-private.js';
import { validateAdvancedBitmap } from './advanced-bitmap.js';
import { validateAdvancedColor } from './advanced-color.js';
import { validateAdvancedGdef, validateAdvancedLayout } from './advanced-layout.js';
import { validateAdvancedTrueType, validateCffStructures } from './advanced-programs.js';
import { validateAdvancedSpecialist } from './advanced-specialist.js';
import { validateAdvancedVariation } from './advanced-variation.js';
import { runDiagnosticCheck, skipDiagnosticCheck } from './coverage.js';

const VERSIONS = {
	GSUB: [[1, 0], [1, 1]], GPOS: [[1, 0], [1, 1]],
	GDEF: [[1, 0], [1, 2], [1, 3]],
	gvar: [[1, 0]], cvar: [[1, 0]], HVAR: [[1, 0]], VVAR: [[1, 0]], MVAR: [[1, 0]],
	MATH: [0x10000], BASE: [[1, 0], [1, 1]], JSTF: [[1, 0]], MERG: [0],
	COLR: [0, 1], CPAL: [0, 1], 'SVG ': [0], sbix: [1],
	CBLC: [[3, 0]], EBLC: [[2, 0]], bloc: [[2, 0]], EBSC: [0x20000],
};

/** Bounded, read-only semantic checks over parsed structures and original spans. */
export function runAdvancedDiagnostics(tables, entries, sfnt, issues, options = {}) {
	const byTag = new Map(entries.map((entry) => [entry.tag, entry]));
	const rawTable = (tag) => {
		const entry = byTag.get(tag);
		if (!entry || entry.offset < 0 || entry.length < 0 ||
			entry.offset > sfnt.byteLength - entry.length) return null;
		return new Uint8Array(sfnt, entry.offset, entry.length);
	};
	const check = (tag, callback, partial, dependencies = ['maxp']) => {
		const id = `binary.advanced.${tag}`;
		if (!byTag.has(tag)) {
			skipDiagnosticCheck(issues, id, 'skipped', 'not-applicable', 'Optional table is absent.', { table: tag });
			return;
		}
		const value = tables[tag], raw = rawTable(tag);
		if (!value || !raw) {
			skipDiagnosticCheck(issues, id, 'blocked', 'table-not-parsed',
				'An in-bounds parsed table is required.', { table: tag });
			return;
		}
		const versions = VERSIONS[tag];
		if (versions && !versions.some((version) => Array.isArray(version)
			? value.majorVersion === version[0] && value.minorVersion === version[1]
			: value.version === version)) {
			skipDiagnosticCheck(issues, id, 'unsupported', 'unsupported-version',
				`Table version ${value.version ?? `${value.majorVersion}.${value.minorVersion}`} is not implemented.`,
				{ table: tag, path: 'version' });
			return;
		}
		const missing = dependencies.filter((dependency) => !tables[dependency]);
		runDiagnosticCheck(issues, id, () => {
			const ctx = advancedContext(issues, tag, tables, options);
			try { callback(value, raw, ctx); }
			catch (error) {
				if (error instanceof StructureLimitError)
					addIssue(issues, 'error', 'DIAGNOSTIC_LIMIT_EXCEEDED', error.message, { table: tag });
				else if (error instanceof RangeError)
					addIssue(issues, 'error', 'ADVANCED_STRUCTURE_INVALID',
						error.message, { table: tag, path: 'binaryStructure' });
				else {
					addIssue(issues, 'error', 'DIAGNOSTIC_CHECK_FAILED',
						`Advanced table checks interrupted: ${error.message}`, { table: tag });
				}
			}
		}, { location: { table: tag }, partial: missing.length
			? `${partial ?? ''} Missing parsed prerequisites: ${missing.join(', ')}.` : partial });
	};
	for (const tag of ['GSUB', 'GPOS'])
		check(tag, (value, raw, ctx) => validateAdvancedLayout(value, ctx, raw),
			'Recursive graph references and array relationships; contextual lookups are not executed or shaped.');
	check('GDEF', (value, raw, ctx) => validateAdvancedGdef(value, ctx),
		'Coverage, simple/composite contour-point indices and variation references; no hinted point positioning.');
	for (const tag of ['gvar', 'cvar', 'HVAR', 'VVAR', 'MVAR'])
		check(tag, validateAdvancedVariation,
			'Tuple, region and cross-reference invariants; no variation interpolation or exhaustive geometry sampling.',
			tag === 'cvar' ? ['fvar', 'cvt '] : ['fvar', 'maxp']);
	for (const tag of ['CFF ', 'CFF2'])
		check(tag, (value, raw, ctx) => {
			validateCffStructures(raw, value, ctx);
			validateAdvancedVariation(value, raw, ctx);
			if (tag === 'CFF2') {
				const used = new Set();
				ctx.each(value.charStrings, (_, gid) => {
					const fd = value.fdSelect == null
						? (value.fontDicts.length === 1 ? 0 : undefined) : value.fdSelect[gid];
					if (Number.isInteger(fd)) used.add(fd);
				});
				ctx.each(value.fontDicts, (dictionary, fd) => {
					if (used.has(fd)) return;
					runDiagnosticCheck(issues, `binary.CFF2.private-dict.${fd}`, () =>
						validateCff2PrivateDictionary(dictionary, value.variationStore, ctx, `fontDicts.${fd}.privateDict`),
					{ location: { table: tag, path: `fontDicts.${fd}.privateDict` },
						partial: 'Unreferenced Private DICT operand/context structure only; local subroutines are not executed.' });
				});
			}
		}, 'INDEX spans, DICT encoding and references; CFF2 private operand programs are checked in per-FD bytecode context scopes. No hint interpolation or rasterization.');
	for (const tag of ['COLR', 'CPAL', 'SVG '])
		check(tag, validateAdvancedColor, tag === 'CPAL' ? undefined :
			'Graph/document references and color fields are checked; artwork, variation rendering and SVG payloads are not rendered.');
	for (const tag of ['CBLC', 'EBLC', 'bloc', 'sbix', 'EBSC'])
		check(tag, (value, raw, ctx) => validateAdvancedBitmap(value, raw, ctx, rawTable),
			'Strike/image boundaries and supported headers only; PNG CRCs, decompression and pixels are not verified.');
	for (const tag of ['CBDT', 'EBDT', 'bdat']) {
		if (!byTag.has(tag)) continue;
		const location = tag === 'CBDT' ? 'CBLC' : tag === 'EBDT' ? 'EBLC' : 'bloc';
		runDiagnosticCheck(issues, `binary.advanced.${tag}`, () => {
			if (!tables[location])
				addIssue(issues, 'error', 'BITMAP_LOCATION_TABLE_MISSING',
					`${tag} requires ${location} to interpret image records.`, { table: tag });
		}, { location: { table: tag }, partial: `Image-record checks are owned by binary.advanced.${location}; pixels are not decoded.` });
	}
	for (const tag of ['MATH', 'BASE', 'JSTF', 'MERG'])
		check(tag, validateAdvancedSpecialist,
			'Versioned structure and reference checks only; mathematical/baseline/justification/merge behavior is not executed.');
	if (['glyf', 'fpgm', 'prep', 'gasp'].some((tag) => tables[tag])) {
		runDiagnosticCheck(issues, 'binary.advanced.truetype', () => {
			const ctx = advancedContext(issues, 'glyf', tables, options);
			try { validateAdvancedTrueType(tables, ctx); }
			catch (error) {
				addIssue(issues, 'error', 'DIAGNOSTIC_LIMIT_EXCEEDED', error.message, { table: 'glyf' });
			}
		}, { partial: 'Static control-flow, point references and observed maxima only; no TrueType VM, dynamic stack, function/jump target or rasterization verification.' });
	}
}
