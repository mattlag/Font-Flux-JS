// biome-ignore-all lint/suspicious/noTemplateCurlyInString: AST fixtures intentionally contain source templates.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAst } from 'vite';
import { describe, expect, it } from 'vitest';
import {
	BASELINE_COMMIT,
	ROOT,
	baselineFromGit,
	buildInventory,
	extractDiagnosticOrigins,
	extractRepairLinks,
	generate,
	readBaseline,
	readSources,
	renderCatalog,
	renderDocs,
} from '../scripts/generate-check-inventory.mjs';
import {
	CHECK_CATALOG,
	CHECK_INVENTORY_BASELINE,
	CHECK_INVENTORY_SUMMARY,
	getCheckDescriptor,
} from '../src/validate/check-catalog.js';
import { repairCatalog } from '../src/validate/quality.js';

const sources = readSources();
const baseline = readBaseline();
const repairText = sources;
const inventory = buildInventory(sources, baseline, repairText);
const identifiers = (origins) => [...new Set(origins.map((o) => o.code))].sort();
const sourceFile = 'src/validate/diagnoseFont.js';

describe('durable diagnostic identifier inventory', () => {
	it('accounts for every current static and finite dynamic emission, not just literal grep matches', () => {
		const extracted = extractDiagnosticOrigins(sources);
		expect(extracted.unresolved).toEqual([]);
		expect(identifiers(extracted.origins)).toEqual(
			Object.values(CHECK_CATALOG).filter((d) => d.status === 'active').map((d) => d.id).sort(),
		);
		for (const emission of extracted.origins) {
			const descriptor = getCheckDescriptor(emission.code);
			expect(descriptor.origins).toContainEqual(expect.objectContaining({
				source: emission.source,
				severities: emission.severities,
			}));
			expect(descriptor.kind).toBe(
				descriptor.origins.every((origin) => origin.kind === 'information') ? 'information' : 'finding',
			);
		}
	});

	it('retains the independently pinned 228-identifier baseline and exact historical evidence', () => {
		expect(baseline.commit).toBe(BASELINE_COMMIT);
		expect(identifiers(baseline.origins)).toHaveLength(228);
		expect(identifiers(baseline.origins.filter((origin) =>
			origin.source.file === 'src/validate/diagnoseFont.js'))).toHaveLength(175);
		expect(identifiers(baseline.origins.filter((origin) =>
			origin.source.file === 'src/validate/validateJSON.js'))).toHaveLength(52);
		expect(identifiers(baseline.origins.filter((origin) =>
			origin.source.file === 'src/font_flux.js'))).toEqual(['EXPORT_RESOLUTION_FAILED']);
		expect(CHECK_INVENTORY_BASELINE).toEqual(baseline);
		for (const id of identifiers(baseline.origins)) {
			expect(getCheckDescriptor(id)?.baseline).toBe(true);
			expect(['active', 'legacy']).toContain(getCheckDescriptor(id).status);
			if (getCheckDescriptor(id).status === 'legacy') {
				expect(getCheckDescriptor(id).retirementReason).toBeTruthy();
				expect(getCheckDescriptor(id).sourceRevision).toBe(BASELINE_COMMIT);
			}
		}
		// Shallow/source archives use the digest-checked static snapshot instead.
		const git = spawnSync('git', ['cat-file', '-e', `${BASELINE_COMMIT}^{commit}`], { cwd: ROOT });
		if (git.status === 0) expect(baselineFromGit()).toEqual(baseline);
	});

	it('refuses to silently erase a baseline code', () => {
		const changed = { ...sources };
		changed[sourceFile] = changed[sourceFile].replaceAll("'BAD_MAGIC_NUMBER'", "'REPLACED_MAGIC_NUMBER'");
		expect(() => buildInventory(changed, baseline, repairText))
			.toThrow(/Baseline identifier BAD_MAGIC_NUMBER was removed/);
	});

	it('links only actual repair registrations, with explicit reasons for everything else', () => {
		const actualRepairs = repairCatalog();
		const extractedRepairs = extractRepairLinks(repairText);
		expect(extractedRepairs.map((repair) => repair.id)).toEqual(actualRepairs.map((repair) => repair.id).sort());
		for (const descriptor of Object.values(CHECK_CATALOG)) {
			const expected = actualRepairs.filter((repair) => repair.codes.includes(descriptor.id)).map((repair) => repair.id).sort();
			expect(descriptor.repairIds).toEqual(expected);
			if (!expected.length) expect(descriptor.noFixReason?.length).toBeGreaterThan(30);
		}
		expect(extractDiagnosticOrigins(sources).operationalErrors.map((entry) => entry.code).sort()).toEqual([
			'QUALITY_WORKER_DEADLINE', 'QUALITY_WORKER_STALE_INPUT', 'QUALITY_WORKER_STALE_PLAN',
			'QUALITY_WORKER_STALE_PROJECT', 'QUALITY_WORKER_STALE_SOURCE',
		]);
		expect(extractDiagnosticOrigins(sources).operationalForwarding).toEqual([
			expect.objectContaining({ file: 'src/validate/workflow-worker-runtime.js', symbol: 'handleQualityWorkerMessage' }),
		]);
		expect(getCheckDescriptor('BAD_CHECKSUM').repairIds).toEqual(['sfnt.checksums']);
		expect(getCheckDescriptor('HEAD_GLYPH_DATA_FORMAT_INVALID').repairIds).toEqual(['head.glyph-data-format']);
		expect(getCheckDescriptor('TABLE_PARSED').kind).toBe('information');
		expect(getCheckDescriptor('OS2_WEIGHT_CLAMPED')).not.toHaveProperty('safe');
		expect(actualRepairs.find((repair) => repair.id === 'dsig.remove').codes).toEqual([]);
	});

	it('distinguishes public routes from internal raw-shape validation and preserves multiple origins', () => {
		expect(getCheckDescriptor('BAD_CHECKSUM').pipeline).toBe('binary');
		expect(getCheckDescriptor('GLYPH_INVALID').pipeline).toBe('editable');
		expect(getCheckDescriptor('TABLE_RAW_INVALID_BYTE').publicReachability).toContain('public-detached-resolved-validation');
		expect(getCheckDescriptor('HEADER_SYNTHESIZED').publicReachability).toContain('internal-raw-validator-only');
		expect(getCheckDescriptor('COLLECTION_META_INVALID').publicReachability).toContain('internal-raw-validator-only');
		expect(getCheckDescriptor('EXPORT_RESOLUTION_FAILED').pipeline).toBe('public-validation');
		expect(getCheckDescriptor('CMAP_FORMAT14_VS_OUT_OF_RANGE').checkIds).toEqual([
			'binary.validateCmapDeep', 'binary.validateCmapFormat14',
		]);
		expect(getCheckDescriptor('GPOS_LOOKUP_TYPE_INVALID').table).toBe('GPOS');
		expect(getCheckDescriptor('CFF_CHARSTRING_NO_ENDCHAR').tables).toEqual(['CFF ']);
		expect(getCheckDescriptor('CMAP_FORMAT4_RANGE_OFFSET_INVALID').table).toBe('cmap');
		for (const code of ['LAYOUT_MARK_FILTER_SET_INVALID', 'LAYOUT_MARK_ATTACHMENT_CLASS_UNAVAILABLE']) {
			expect(getCheckDescriptor(code).source.symbol).toBe('validateLayoutReferences');
			expect(getCheckDescriptor(code).tables).toEqual(['GDEF', 'GPOS', 'GSUB']);
			expect(getCheckDescriptor(code).references).toContain(
				'https://learn.microsoft.com/en-us/typography/opentype/spec/chapter2#lookup-table',
			);
		}
	});

	it('records exact source lines and specification or contract references for every origin', () => {
		for (const descriptor of Object.values(CHECK_CATALOG)) {
			expect(descriptor.checkId).toMatch(/^(binary|validation|profile)\./);
			expect(descriptor.formats.length).toBeGreaterThan(0);
			expect(descriptor.references.length).toBeGreaterThan(0);
			expect(descriptor.origins.length).toBeGreaterThan(0);
			for (const origin of descriptor.origins) {
				expect(origin.source.line).toBeGreaterThan(0);
				expect(origin.source.symbol).not.toBe('<module>');
				expect(origin.publicReachability).toBeTruthy();
				expect(origin.family).toBeTruthy();
				const text = descriptor.status === 'legacy' ? execFileSync('git', [
					'show', `${BASELINE_COMMIT}:${origin.source.file}`,
				], { cwd: ROOT, encoding: 'utf8' }) : sources[origin.source.file];
				const line = text.split(/\r?\n/)[origin.source.line - 1];
				expect(line).toContain(origin.expression ?? descriptor.id);
				for (const reference of origin.references)
					if (!reference.startsWith('https://')) expect(existsSync(join(ROOT, reference))).toBe(true);
			}
		}
	});

	it('keeps browser runtime metadata independent of Node, the compiler/parser, and quality.js', () => {
		const text = readFileSync(join(ROOT, 'src', 'validate', 'check-catalog.js'), 'utf8');
		const ast = parseAst(text);
		expect(ast.body.some((node) => node.type === 'ImportDeclaration')).toBe(false);
		expect(text).not.toMatch(/\brequire\s*\(|\bimport\s*\(/);
		expect(getCheckDescriptor('DOES_NOT_EXIST')).toBeUndefined();
		expect(getCheckDescriptor('__proto__')).toBeUndefined();
		expect(getCheckDescriptor('constructor')).toBeUndefined();
	});

	it('reproduces both artifacts deterministically and verifies without writing', () => {
		const catalogPath = join(ROOT, 'src', 'validate', 'check-catalog.js');
		const docPath = join(ROOT, 'docs', 'check-inventory.md');
		const before = [readFileSync(catalogPath, 'utf8'), readFileSync(docPath, 'utf8')];
		expect(renderCatalog(inventory)).toBe(before[0]);
		expect(renderDocs(inventory)).toBe(before[1]);
		expect(renderCatalog(buildInventory(sources, baseline, repairText))).toBe(before[0]);
		expect(generate({ check: true }).summary).toEqual(CHECK_INVENTORY_SUMMARY);
		const result = spawnSync(process.execPath, ['scripts/generate-check-inventory.mjs', '--check'], {
			cwd: ROOT, encoding: 'utf8',
		});
		expect(result.stderr).toBe('');
		expect(result.status).toBe(0);
		expect([readFileSync(catalogPath, 'utf8'), readFileSync(docPath, 'utf8')]).toEqual(before);
		const invalid = spawnSync(process.execPath, ['scripts/generate-check-inventory.mjs', '--unknown'], {
			cwd: ROOT, encoding: 'utf8',
		});
		expect(invalid.status).toBe(1);
	});

	it('keeps durable backlog/provenance/specification links and never labels counts as coverage', () => {
		const docs = renderDocs(inventory);
		expect(docs).toContain('Identifier counts are not independent check counts');
		expect(docs).toContain('https://github.com/mattlag/Font-Flux-JS/blob/main/FONT-QUALITY-BACKLOG.md#upstream-capability-to-work-mapping');
		expect(readFileSync(join(ROOT, 'FONT-QUALITY-BACKLOG.md'), 'utf8')).toContain('## Upstream capability-to-work mapping');
		expect(docs).toContain('6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25');
		expect(docs).toContain('1ff10daa33d4e40af00a76cda7fa804af4200b30');
		expect(docs).toContain('https://www.w3.org/TR/WOFF2/');
		expect(docs).not.toContain('session-state');
		expect(CHECK_INVENTORY_SUMMARY).not.toHaveProperty('coverage');
		expect(CHECK_INVENTORY_SUMMARY).not.toHaveProperty('passedChecks');
		const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
		expect(manifest.devDependencies.vite).toBeTruthy();
		expect(docs).toContain('exported by the declared development dependency `vite`');
		expect(readFileSync(join(ROOT, 'scripts', 'generate-check-inventory.mjs'), 'utf8'))
			.not.toContain('@babel/parser');
	});
});

describe('AST extraction regression guards', () => {
	it('expands templates from real caller arguments and loop domains, including changed domains', () => {
		const result = extractDiagnosticOrigins({
			[sourceFile]: `
function validateLayoutLookups(tableName, issues) {
	addIssue(issues, 'error', \`\${tableName}_LOOKUP_TYPE_INVALID\`, 'message');
}
function phaseCrossTableChecks(issues) {
	validateLayoutLookups('GSUB', issues);
	validateLayoutLookups('GPOS', issues);
	validateLayoutLookups('FUTURE', issues);
	for (const dep of ['HVAR', 'avar', 'NEW'])
		addIssue(issues, 'error', \`\${dep.toUpperCase()}_WITHOUT_FVAR\`, 'message');
}`,
		});
		expect(identifiers(result.origins)).toEqual([
			'AVAR_WITHOUT_FVAR', 'FUTURE_LOOKUP_TYPE_INVALID', 'GPOS_LOOKUP_TYPE_INVALID',
			'GSUB_LOOKUP_TYPE_INVALID', 'HVAR_WITHOUT_FVAR', 'NEW_WITHOUT_FVAR',
		]);
		expect(result.dynamicSites).toHaveLength(2);
		expect(result.dynamicSites.every((site) => site.expansionEvidence.length > 0)).toBe(true);
	});

	it('discovers new literal helper emissions and ignores comments and unrelated uppercase strings', () => {
		const result = extractDiagnosticOrigins({
			[sourceFile]: `
function phaseHeader(issues) {
	const error = (code, message) => addIssue(issues, 'error', code, message);
	const ignored = 'NOT_A_DIAGNOSTIC';
	// addIssue(issues, 'error', 'COMMENT_ONLY', '');
	error('NEW_HELPER_FINDING', 'message');
	function nested() { addIssue(issues, 'info', 'NESTED_INFORMATION', 'message'); }
	nested();
}`,
		});
		expect(identifiers(result.origins)).toEqual(['NESTED_INFORMATION', 'NEW_HELPER_FINDING']);
		expect(result.origins.every((origin) => origin.source.symbol === 'phaseHeader')).toBe(true);
	});

	it('discovers profile object/helper findings and the public wrapper', () => {
		const result = extractDiagnosticOrigins({
			'src/validate/profiles.js': `
function evaluateProfile(issues) {
	const finding = (code) => ({ severity: 'warning', code, message: 'policy' });
	issues.push(finding('PROFILE_NEW_POLICY'));
	issues.push({severity: 'error', code: 'PROFILE_OBJECT_POLICY', message: 'policy'});
}`,
			'src/font_flux.js': `
class FontFlux {
	validate() { return {severity: 'error', code: 'EXPORT_RESOLUTION_FAILED', message: 'failure'}; }
}`,
		});
		expect(identifiers(result.origins)).toEqual([
			'EXPORT_RESOLUTION_FAILED', 'PROFILE_NEW_POLICY', 'PROFILE_OBJECT_POLICY',
		]);
	});

	it('follows imported helper aliases even when the caller sorts before the helper source', () => {
		const result = extractDiagnosticOrigins({
			'src/a-caller.js': `
import { emitDiagnostic as emit } from './z-helper.js';
function phaseHeader(issues) { emit(issues, 'warning', 'IMPORTED_HELPER_FINDING'); }
`,
			'src/z-helper.js': `
export function emitDiagnostic(issues, severity, code) { issues.push({severity, code}); }
`,
		});
		expect(identifiers(result.origins)).toEqual(['IMPORTED_HELPER_FINDING']);
		expect(result.origins[0].source.file).toBe('src/a-caller.js');
	});

	it('fails closed for unresolved dynamic identifiers instead of inventing wildcard codes', () => {
		expect(() => extractDiagnosticOrigins({
			[sourceFile]: "function phaseHeader(input, issues) { addIssue(issues, 'error', `${input.code}_INVALID`, 'message'); }",
		})).toThrow(/Unresolved diagnostic expressions/);
	});

	it('does not silently ignore new code-bearing object or assignment emission forms', () => {
		expect(() => extractDiagnosticOrigins({
			[sourceFile]: "function phaseHeader(issue) { return {...issue, code: 'SPREAD_FINDING'}; }",
		})).toThrow(/Unresolved diagnostic expressions/);
		expect(() => extractDiagnosticOrigins({
			[sourceFile]: "function phaseHeader(issue) { issue.code = 'ASSIGNED_FINDING'; }",
		})).toThrow(/explicit emission model/);
	});

	it('does not count projections of existing report findings as new diagnostic emissions', () => {
		const result = extractDiagnosticOrigins({
			'src/validate/quality.js': `
function normalizationEvidence(report) {
	return report.issues.filter((issue) => issue.severity !== 'info').map((issue) =>
		({kind: 'existing-finding', code: issue.code}));
}
`,
		});
		expect(result.origins).toEqual([]);
	});

	it('keeps shared identifiers in every pipeline, not just the first occurrence', () => {
		const changed = {
			...sources,
			'src/validate/validateJSON.js': sources['src/validate/validateJSON.js'].replace(
				'export function validateSimplifiedJSON(data) {',
				"export function validateSimplifiedJSON(data) { addIssue([], 'warning', 'BAD_CHECKSUM', 'fixture');",
			),
		};
		const shared = buildInventory(changed, baseline, repairText).catalog.BAD_CHECKSUM;
		expect(shared.pipelines).toEqual(['binary', 'editable']);
		expect(shared.origins.map((origin) => origin.pipeline)).toContain('editable');
	});
});
