import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAst } from 'vite';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const BASELINE_COMMIT = 'f2646a5b05c48d948b654ab27533c3c067d2e909';
const BASELINE_DIGEST = '3a55198a8631b3b83d450902be50f29f51747dc55ae1198e6256ceb1b1eba456';
const CATALOG_PATH = 'src/validate/check-catalog.js';
const DOC_PATH = 'docs/check-inventory.md';
const BASELINE_FILES = [
	'src/validate/diagnoseFont.js',
	'src/validate/validateJSON.js',
	'src/font_flux.js',
];
const OT = 'https://learn.microsoft.com/en-us/typography/opentype/spec/';
const CONTAINERS = ['sfnt', 'woff1', 'woff2', 'collection'];
const LEGACY_REASONS = {};
const REPAIR_FILES = ['quality', 'metadata-repairs', 'repair-containers', 'repair-extensions']
	.map((name) => `src/validate/${name}.js`);
const WORKER_ERRORS = new Set([
	'QUALITY_WORKER_DEADLINE', 'QUALITY_WORKER_STALE_INPUT', 'QUALITY_WORKER_STALE_PLAN',
	'QUALITY_WORKER_STALE_PROJECT', 'QUALITY_WORKER_STALE_SOURCE',
]);
const sorted = (values) => [...new Set(values)].sort();
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const property = (node, name) =>
	node?.properties?.find((p) => (p.key?.name ?? p.key?.value) === name)?.value;
const functionTypes = new Set([
	'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression',
	'ClassMethod', 'ObjectMethod',
]);

function sourceTree(file, text) {
	const ast = parseAst(text);
	const parents = new Map();
	const nodes = [];
	const lineStarts = [0];
	for (let index = 0; index < text.length; index++)
		if (text[index] === '\n') lineStarts.push(index + 1);
	function lineAt(offset) {
		let low = 0, high = lineStarts.length;
		while (low + 1 < high) {
			const middle = (low + high) >>> 1;
			if (lineStarts[middle] <= offset) low = middle;
			else high = middle;
		}
		return low + 1;
	}
	function walk(node, parent) {
		if (!node?.type) return;
		// Normalize the few ESTree node spellings used by the finite evaluator.
		// Vite exposes UTF-16 offsets; derive exact lines without regex ID scans.
		if (node.type === 'Literal') {
			if (typeof node.value === 'string') node.type = 'StringLiteral';
			else if (typeof node.value === 'number') node.type = 'NumericLiteral';
			else if (typeof node.value === 'boolean') node.type = 'BooleanLiteral';
		}
		node.loc = { start: { line: lineAt(node.start) } };
		parents.set(node, parent);
		nodes.push(node);
		for (const [key, value] of Object.entries(node)) {
			if (['loc', 'extra', 'comments', 'tokens'].includes(key)) continue;
			if (Array.isArray(value)) value.forEach((child) => walk(child, node));
			else if (value?.type) walk(value, node);
		}
	}
	walk(ast);
	const ancestors = (node) => {
		const result = [];
		for (let current = parents.get(node); current; current = parents.get(current))
			result.push(current);
		return result;
	};
	const functionName = (node) =>
		node.id?.name ?? node.key?.name ?? parents.get(node)?.id?.name ?? parents.get(node)?.key?.name;
	const enclosingFunctions = (node) => ancestors(node).filter((n) => functionTypes.has(n.type));
	const scopeOf = (node) => ancestors(node).find((n) =>
		['BlockStatement', 'Program', ...functionTypes].includes(n.type));
	const evidence = (node) => ({
		file, line: node.loc.start.line,
		symbol: functionName(enclosingFunctions(node).at(-1) ?? {}) ?? '<module>',
	});
	const isReportProjection = (node) => {
		const code = property(node, 'code');
		if (code?.type !== 'MemberExpression' || code.object.type !== 'Identifier' ||
			(code.property.name ?? code.property.value) !== 'code') return false;
		const callback = enclosingFunctions(node)[0];
		const call = parents.get(callback);
		if (callback?.params[0]?.name !== code.object.name ||
			call?.type !== 'CallExpression' || call.callee.type !== 'MemberExpression' ||
			call.callee.property.name !== 'map') return false;
		let collection = call.callee.object;
		while (collection.type === 'CallExpression' &&
			collection.callee.type === 'MemberExpression' &&
			collection.callee.property.name === 'filter') collection = collection.callee.object;
		return collection.type === 'MemberExpression' &&
			['issues', 'errors', 'warnings', 'infos'].includes(collection.property.name);
	};
	const isOperationalProjection = (node) => {
		const code = property(node, 'code'), parent = parents.get(node), envelope = parents.get(parent);
		return file === 'src/validate/workflow-worker-runtime.js' &&
			code?.type === 'MemberExpression' && code.object.name === 'error' && code.property.name === 'code' &&
			property(node, 'name') && property(node, 'message') &&
			(parent?.key?.name ?? parent?.key?.value) === 'error' &&
			property(envelope, 'type')?.value === 'error' &&
			functionName(enclosingFunctions(node).at(-1) ?? {}) === 'handleQualityWorkerMessage';
	};

	// Resolve only finite source-derived values. Unknown expressions are errors,
	// not wildcard identifiers or guessed expansions.
	function values(node, seen = new Set(), proofs = [], bindings = new Map()) {
		if (!node || seen.has(node)) throw new Error('unbounded or cyclic expression');
		const next = new Set(seen).add(node);
		const recurse = (child) => values(child, next, proofs, bindings);
		if (['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].includes(node.type))
			return [node.value];
		if (node.type === 'ArrayExpression') return node.elements.flatMap(recurse);
		if (node.type === 'ConditionalExpression') {
			const test = node.test;
			if (test.type === 'BinaryExpression' && test.operator === '===' &&
				test.left.type === 'Identifier' && bindings.has(test.left.name) &&
				['StringLiteral', 'NumericLiteral', 'BooleanLiteral'].includes(test.right.type))
				return recurse(bindings.get(test.left.name) === test.right.value ? node.consequent : node.alternate);
			return sorted([...recurse(node.consequent), ...recurse(node.alternate)]);
		}
		if (node.type === 'TemplateLiteral') {
			let result = [node.quasis[0].value.cooked];
			node.expressions.forEach((expression, index) => {
				result = result.flatMap((prefix) => recurse(expression).map((value) =>
					prefix + value + node.quasis[index + 1].value.cooked));
			});
			return result;
		}
		if (node.type === 'BinaryExpression' && node.operator === '+')
			return recurse(node.left).flatMap((a) => recurse(node.right).map((b) => a + b));
		if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' &&
			['toUpperCase', 'toLowerCase'].includes(node.callee.property.name) &&
			node.arguments.length === 0)
			return recurse(node.callee.object).map((value) => value[node.callee.property.name]());
		if (node.type === 'Identifier') {
			if (bindings.has(node.name)) return [bindings.get(node.name)];
			for (const ancestor of ancestors(node)) {
				if (ancestor.type === 'ForOfStatement' && ancestor.right.type === 'ArrayExpression') {
					const pattern = ancestor.left.declarations?.[0]?.id;
					const index = pattern?.type === 'ArrayPattern'
						? pattern.elements.findIndex((entry) => entry?.name === node.name) : -1;
					if (index >= 0) {
						proofs.push({ ...evidence(ancestor.right), expression: text.slice(ancestor.right.start, ancestor.right.end) });
						return sorted(ancestor.right.elements.flatMap((entry) => recurse(entry.elements?.[index])));
					}
				}
				if (ancestor.type === 'ForOfStatement' &&
					ancestor.left.declarations?.some((d) => d.id.name === node.name)) {
					proofs.push({ ...evidence(ancestor.right), expression: text.slice(ancestor.right.start, ancestor.right.end) });
					return recurse(ancestor.right);
				}
				if (functionTypes.has(ancestor.type)) {
					const index = ancestor.params.findIndex((p) =>
						(p.type === 'AssignmentPattern' ? p.left : p).name === node.name);
					if (index !== -1) {
						const parent = parents.get(ancestor);
						if (index === 0 && parent?.type === 'CallExpression' &&
							parent.callee.type === 'MemberExpression' && parent.callee.property.name === 'map')
							return recurse(parent.callee.object);
						const name = functionName(ancestor);
						const calls = nodes.filter((n) => n.type === 'CallExpression' && n.callee.name === name);
						if (!name || !calls.length) throw new Error(`no finite callers for ${node.name}`);
						return sorted(calls.flatMap((call) => {
							const argument = call.arguments[index] ?? ancestor.params[index].right;
							proofs.push({ ...evidence(call), expression: text.slice(call.start, call.end) });
							return recurse(argument);
						}));
					}
				}
				const declaration = nodes.find((n) => n.type === 'VariableDeclarator' &&
					n.id.name === node.name && n.init && scopeOf(n) === ancestor);
				if (declaration) return recurse(declaration.init);
			}
		}
		throw new Error(`unsupported ${node.type}: ${text.slice(node.start, node.end)}`);
	}
	return { file, text, nodes, parents, ancestors, enclosingFunctions, functionName, evidence, values,
		isReportProjection, isOperationalProjection };
}

/**
 * Discover actual finding sinks, forwarding helpers, and finite template IDs.
 * The parser is development-only; generated runtime metadata has no imports.
 */
export function extractDiagnosticOrigins(sources) {
	const origins = [];
	const dynamicSites = [];
	const unresolved = [];
	const operationalErrors = [];
	const signatures = new Map([['addIssue', { code: 2, severity: 1 }]]);
	const trees = Object.entries(sources).sort(([a], [b]) => a.localeCompare(b))
		.filter(([file]) => file !== CATALOG_PATH).map(([file, text]) => sourceTree(file, text));
	for (const tree of trees) {
		tree.objects = tree.nodes.filter((n) => n.type === 'ObjectExpression' &&
			property(n, 'code') && (property(n, 'severity') ||
				tree.file.startsWith('src/validate/') || tree.file === 'src/font_flux.js' ||
				(property(n, 'code').type === 'StringLiteral' &&
					/^[A-Z][A-Z0-9_]+$/.test(property(n, 'code').value))) &&
			!tree.isReportProjection(n) && !tree.isOperationalProjection(n));
		tree.calls = tree.nodes.filter((n) => n.type === 'CallExpression' && n.callee.type === 'Identifier');
	}
	const parameterIndex = (fn, node) => node?.type === 'Identifier'
		? fn?.params.findIndex((p) => (p.type === 'AssignmentPattern' ? p.left : p).name === node.name) ?? -1 : -1;
	// Solve helper signatures before collecting call sites, so imported helpers
	// and aliases work regardless of filename order.
	for (let changed = true; changed;) {
		changed = false;
		for (const tree of trees) {
			for (const node of tree.nodes) {
				if (node.type !== 'ImportSpecifier') continue;
				const signature = signatures.get(node.imported.name);
				if (signature && !signatures.has(node.local.name)) {
					signatures.set(node.local.name, signature);
					changed = true;
				}
			}
			for (const node of [...tree.calls, ...tree.objects]) {
				const signature = signatures.get(node.callee?.name);
				if (node.type === 'CallExpression' && !signature) continue;
				const code = signature ? node.arguments[signature.code] : property(node, 'code');
				const severity = signature
					? typeof signature.severity === 'number' ? node.arguments[signature.severity] : undefined
					: property(node, 'severity');
				const fn = tree.enclosingFunctions(node)[0];
				const index = parameterIndex(fn, code);
				const name = fn && tree.functionName(fn);
				if (index < 0 || !name || signatures.has(name)) continue;
				let level = signature && typeof signature.severity === 'string'
					? signature.severity : parameterIndex(fn, severity);
				if (level === -1) level = tree.values(severity)[0];
				const defaultSeverity = typeof level === 'number' && fn.params[level]?.type === 'AssignmentPattern'
					? tree.values(fn.params[level].right) : undefined;
				signatures.set(name, { code: index, severity: level, defaultSeverity });
				changed = true;
			}
		}
	}
	for (const tree of trees) {
		const { file, text } = tree;
		for (const node of tree.nodes) {
			if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' &&
				(node.left.property.name ?? node.left.property.value) === 'code' &&
				node.right.type === 'StringLiteral' && /^[A-Z][A-Z0-9_]+$/.test(node.right.value)) {
				if (file === 'src/validate/workflow-worker.js' && WORKER_ERRORS.has(node.right.value))
					operationalErrors.push({ code: node.right.value, source: tree.evidence(node.right) });
				else unresolved.push(`${file}:${node.loc.start.line}: diagnostic code assignment requires an explicit emission model`);
			}
		}
		for (const node of [...tree.calls, ...tree.objects]) {
			const signature = signatures.get(node.callee?.name);
			if (node.type === 'CallExpression' && !signature) continue;
			const expression = signature ? node.arguments[signature.code] : property(node, 'code');
			const fn = tree.enclosingFunctions(node)[0];
			// A helper's forwarded parameter is inventoried at its callers.
			if (parameterIndex(fn, expression) >= 0 &&
				signatures.has(tree.functionName(fn))) continue;
			const source = tree.evidence(expression);
			const expressionText = text.slice(expression.start, expression.end);
			try {
				const proofs = [];
				const codes = sorted(tree.values(expression, new Set(), proofs));
				const severity = signature
					? typeof signature.severity === 'number'
						? node.arguments[signature.severity] ? tree.values(node.arguments[signature.severity])
							: signature.defaultSeverity ?? tree.values(undefined) : [signature.severity]
					: tree.values(property(node, 'severity'));
				if (!severity.every((s) => ['error', 'warning', 'info'].includes(s)))
					throw new Error(`unrecognized severity: ${severity.join(', ')}`);
				if (!codes.length || codes.some((code) => typeof code !== 'string' || !/^[A-Z][A-Z0-9_]+$/.test(code)))
					throw new Error('diagnostic identifiers must be finite uppercase strings');
				const dynamic = expression.type !== 'StringLiteral';
				const expansionEvidence = [...new Map(proofs.map((p) => [JSON.stringify(p), p])).values()];
				if (dynamic) dynamicSites.push({ source, expression: expressionText, codes, expansionEvidence });
				for (const code of codes) origins.push({
					code, source, severities: sorted(severity),
					...(dynamic ? { expression: expressionText, expansionEvidence } : {}),
				});
			} catch (error) {
				unresolved.push(`${file}:${source.line} ${source.symbol}: ${expressionText}: ${error.message}`);
			}
		}
	}
	if (unresolved.length) throw new Error(`Unresolved diagnostic expressions:\n${unresolved.join('\n')}`);
	origins.sort((a, b) => a.code.localeCompare(b.code) ||
		a.source.file.localeCompare(b.source.file) || a.source.line - b.source.line);
	const operationalForwarding = trees.flatMap((tree) => tree.nodes
		.filter((node) => node.type === 'ObjectExpression' && tree.isOperationalProjection(node)).map(tree.evidence));
	return { origins, dynamicSites, unresolved, operationalErrors, operationalForwarding };
}

export function extractRepairLinks(sources) {
	const repairs = [];
	for (const file of REPAIR_FILES) {
		if (!sources[file]) throw new Error(`Missing repair registry source: ${file}`);
		const tree = sourceTree(file, sources[file]);
		for (const node of tree.nodes) {
			if (node.type !== 'ObjectExpression' || !property(node, 'id') ||
				!property(node, 'description') || !property(node, 'ifApplied')) continue;
			let bindings = [new Map()];
			for (const fn of tree.enclosingFunctions(node).reverse()) {
				const call = tree.parents.get(fn);
				if (call?.type !== 'CallExpression' || call.callee.type !== 'MemberExpression' ||
					call.callee.property.name !== 'map') continue;
				if (fn.params[0]?.type === 'Identifier') {
					bindings = bindings.flatMap((bound) => tree.values(call.callee.object, new Set(), [], bound)
						.map((value) => new Map([...bound, [fn.params[0].name, value]])));
				} else if (fn.params[0]?.type === 'ArrayPattern' && call.callee.object.type === 'ArrayExpression') {
					bindings = bindings.flatMap((bound) => call.callee.object.elements.map((tuple) => {
						if (tuple?.type !== 'ArrayExpression') throw new Error(`Nonliteral registry tuple in ${file}`);
						const result = new Map(bound);
						fn.params[0].elements.forEach((parameter, index) => {
							if (parameter?.type !== 'Identifier') throw new Error(`Unsupported registry binding in ${file}`);
							const values = tree.values(tuple.elements[index], new Set(), [], bound);
							if (values.length !== 1) throw new Error(`Ambiguous registry tuple in ${file}`);
							result.set(parameter.name, values[0]);
						});
						return result;
					}));
				} else throw new Error(`Unsupported registry iteration in ${file}`);
			}
			for (const bound of bindings) {
				const ids = tree.values(property(node, 'id'), new Set(), [], bound);
				if (ids.length !== 1) throw new Error(`Ambiguous repair ID in ${file}`);
				repairs.push({
					id: ids[0],
					codes: property(node, 'codes') ? sorted(tree.values(property(node, 'codes'), new Set(), [], bound)) : [],
				});
			}
		}
	}
	if (!repairs.length) throw new Error('No repair catalogue found');
	if (new Set(repairs.map((r) => r.id)).size !== repairs.length)
		throw new Error('Duplicate repair IDs');
	return repairs.sort((a, b) => a.id.localeCompare(b.id));
}

const BINARY_SCOPES = {
	phaseSignature: ['container', []],
	phaseHeader: ['sfnt-directory', []],
	phaseDirectory: ['sfnt-directory', ['*']],
	phaseRequiredTables: ['table-presence', ['*']],
	phaseChecksums: ['checksums', ['*', 'head']],
	phaseParseTables: ['table-parsing', ['*']],
	validateCmapDeep: ['character-mapping', ['cmap']],
	validateOS2Sanitization: ['metrics-and-style', ['OS/2']],
	validateNameDeep: ['naming', ['name']],
	validateWoff1Wrapper: ['container', []],
	validateWoff2Wrapper: ['container', []],
	validateFvarDeep: ['variation-axes', ['fvar']],
	validateLayoutLookups: ['layout-lookups', ['GSUB', 'GPOS']],
	validateLayoutReferences: ['layout-mark-references', ['GSUB', 'GPOS', 'GDEF']],
	validateFvarNamesAndFlags: ['variation-axes', ['fvar']],
	validateSTAT: ['variation-style', ['STAT']],
	validateAvar: ['variation-axis-mapping', ['avar']],
	validateItemVariationStore: ['variation-store', ['HVAR', 'VVAR', 'MVAR', 'GDEF']],
	validateMVAR: ['variation-metrics', ['MVAR']],
	validateGDEFTable: ['layout-definition', ['GDEF']],
	validateCoverage: ['layout-coverage', ['GDEF', 'GSUB', 'GPOS']],
	validateClassDef: ['layout-classes', ['GDEF', 'GSUB', 'GPOS']],
	validateLayoutSubtables: ['layout-substitution', ['GSUB', 'maxp']],
	validateMATH: ['math-version', ['MATH']],
	resolveDiagnosticCffContext: ['cff-context', ['CFF ', 'CFF2']],
	cffBlendRegionCount: ['cff-variation-context', ['CFF2']],
	validateCffCharStrings: ['cff-charstrings', ['CFF ', 'CFF2']],
	validateCharStringBytecode: ['cff-charstrings', ['CFF ', 'CFF2']],
	validateGlyfComposites: ['truetype-composites', ['glyf']],
	validateGlyfHeaders: ['truetype-geometry', ['glyf']],
	validateCmapFormat14: ['variation-selectors', ['cmap']],
	validateCmapFormat12And13: ['character-mapping', ['cmap']],
	validateTrueTypeInstructions: ['truetype-instructions', ['fpgm', 'prep', 'glyf']],
	diagnoseCollection: ['collection', []],
	diagnoseFace: ['diagnostic-execution', []],
	runFaceChecks: ['diagnostic-execution', ['*']],
	diagnoseFont: ['diagnostic-execution', []],
};

const CROSS_SCOPES = {};
function scope(codes, family, tables) {
	for (const code of codes.split(' ')) CROSS_SCOPES[code] = [family, tables];
}
scope('BAD_MAGIC_NUMBER BAD_UNITS_PER_EM HEAD_MAJOR_VERSION_UNSUPPORTED HEAD_BBOX_INVERTED HEAD_INDEX_TO_LOC_FORMAT_INVALID HEAD_GLYPH_DATA_FORMAT_INVALID', 'font-header', ['head']);
scope('MAXP_VERSION_INVALID MAXP_NUMGLYPHS_ZERO', 'glyph-count', ['maxp']);
scope('MAXP_VERSION_MISMATCH_FOR_OUTLINE', 'outline-dependencies', ['maxp', 'glyf', 'loca', 'CFF ', 'CFF2']);
scope('HHEA_MAJOR_VERSION_UNSUPPORTED', 'horizontal-metrics', ['hhea']);
scope('POST_VERSION_UNSUPPORTED', 'postscript-metadata', ['post']);
scope('POST_NUMGLYPHS_MISMATCH', 'glyph-count', ['post', 'maxp']);
scope('OS2_VERSION_INVALID', 'metrics-and-style', ['OS/2']);
scope('HMTX_GLYPH_MISMATCH', 'horizontal-metrics', ['hmtx', 'maxp']);
scope('HHEA_HMTX_MISMATCH', 'horizontal-metrics', ['hhea', 'hmtx']);
scope('LOCA_BEYOND_GLYF', 'truetype-offsets', ['loca', 'glyf']);
scope('CFF_GLYPH_MISMATCH', 'glyph-count', ['CFF ', 'CFF2', 'maxp']);
scope('NO_FAMILY_NAME NO_STYLE_NAME NAME_RECORDS_NOT_SORTED', 'naming', ['name']);
scope('CMAP_SUBTABLES_NOT_SORTED', 'character-mapping', ['cmap']);
scope('POST_VERSION_INVALID_FOR_CFF', 'outline-dependencies', ['post', 'CFF ', 'CFF2']);
scope('VHEA_VMTX_MISMATCH', 'vertical-metrics', ['vhea', 'vmtx']);
for (const tag of ['gvar', 'HVAR', 'VVAR', 'MVAR', 'avar'])
	scope(`${tag.toUpperCase()}_WITHOUT_FVAR`, 'variation-dependencies', [tag, 'fvar']);

const RAW_ONLY = new Set([
	'INPUT_INVALID', 'FONTDATA_INVALID', 'COLLECTION_META_INVALID',
	'COLLECTION_FONTS_INVALID', 'COLLECTION_NUMFONTS_CORRECTED',
	'HEADER_PROMOTED', 'HEADER_SYNTHESIZED', 'HEADER_NUMTABLES_INVALID',
	'HEADER_NUMTABLES_CORRECTED', 'TABLES_MISSING', 'TABLES_EMPTY',
	'REQUIRED_TABLE_MISSING', 'RECOMMENDED_TABLE_MISSING', 'OUTLINE_MISSING',
	'TRUETYPE_OUTLINE_INCOMPLETE',
]);
const VALIDATION_SCOPES = {
	validateSimplifiedJSON: ['authoring-data', []],
	validateHeader: ['resolved-header', []],
	validateTableRawBytes: ['raw-table-bytes', ['*']],
	validateTables: ['resolved-tables', ['*']],
	validateTableDependencies: ['resolved-dependencies', ['hmtx', 'hhea', 'maxp', 'glyf', 'loca', 'head', 'vmtx', 'vhea', 'gvar', 'cvar', 'fvar']],
	validateOutlineAndRequiredTables: ['resolved-outline-dependencies', ['*']],
	validateSingleFont: ['resolved-shape', []],
	validateCollection: ['raw-collection-shape', []],
	validateJSON: ['resolved-shape', []],
};
const EMISSION_TABLES = {
	CMAP_GLYPH_OUT_OF_RANGE: ['cmap', 'maxp'],
	OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH: ['OS/2', 'head'],
	HEAD_MACSTYLE_RESERVED_BITS_SET: ['head'],
	FVAR_AXIS_NAMEID_MISSING: ['fvar', 'name'],
	FVAR_INSTANCE_NAMEID_MISSING: ['fvar', 'name'],
	STAT_MISSING_FVAR_AXIS: ['STAT', 'fvar'],
	AVAR_SEGMENT_COUNT_MISMATCH: ['avar', 'fvar'],
	IVS_AXIS_COUNT_MISMATCH: ['HVAR', 'VVAR', 'MVAR', 'GDEF', 'fvar'],
	COVERAGE_GLYPH_OUT_OF_RANGE: ['GDEF', 'GSUB', 'GPOS', 'maxp'],
	CLASSDEF_GLYPH_OUT_OF_RANGE: ['GDEF', 'GSUB', 'GPOS', 'maxp'],
	GLYF_COMPOSITE_GLYPH_OUT_OF_RANGE: ['glyf', 'maxp'],
	GLYF_BBOX_OUTSIDE_HEAD: ['glyf', 'head'],
	GSUB_LOOKUP_TYPE_INVALID: ['GSUB'],
	GPOS_LOOKUP_TYPE_INVALID: ['GPOS'],
	CFF_CHARSTRING_NO_ENDCHAR: ['CFF '],
	CFF_RETURN_OUTSIDE_SUBR: ['CFF '],
	CFF_SUBR_NO_RETURN: ['CFF '],
	CFF_VARIATION_CONTEXT_MISSING: ['CFF2'],
	CFF_VARIATION_CONTEXT_INVALID: ['CFF2'],
	CFF_VSINDEX_OUT_OF_RANGE: ['CFF2'],
	CFF_VSINDEX_ORDER_INVALID: ['CFF2'],
	CFF_BLEND_INVALID_COUNT: ['CFF2'],
	CLASSDEF_CLASS_OUT_OF_RANGE: ['GDEF'],
	CMAP_FORMAT4_LENGTH_INVALID: ['cmap'],
};
const PROFILE_SCOPES = {
	PROFILE_REQUIRED_TABLE_MISSING: {
		family: 'profile-required-tables', tables: ['OS/2'],
		checkId: 'profile.structural.required-tables',
		profiles: ['structural@1', 'interoperability@1', 'publishing@1'],
		references: [`${OT}otff#font-tables`, `${OT}os2`, 'docs/font-quality.md'],
		noFixReason: 'Missing OS/2 design and metric data must come from an authoritative source; no registered repair synthesizes this table.',
	},
	PROFILE_WINDOWS_NAMES_MISSING: {
		family: 'profile-windows-names', tables: ['name'],
		checkId: 'profile.interoperability.windows-names',
		profiles: ['interoperability@1', 'publishing@1'],
		references: [`${OT}name`, 'docs/font-quality.md'],
		noFixReason: 'No repair is registered for this Windows-platform policy; adding or replacing localized family/style records needs an explicit naming decision.',
	},
	PROFILE_FAMILY_NAME_MISMATCH: {
		family: 'profile-family-expectation', tables: ['name'],
		checkId: 'profile.publishing.family-name',
		profiles: ['publishing@1'],
		references: [`${OT}name`, 'docs/font-quality.md', 'src/validate/profiles.js'],
		noFixReason: 'The caller-declared family expectation may itself be wrong; no binary repair is authorized by a policy mismatch.',
	},
	PROFILE_FILENAME_MISMATCH: {
		family: 'profile-filename-expectation', tables: [],
		checkId: 'profile.publishing.filename',
		profiles: ['publishing@1'],
		references: ['docs/font-quality.md', 'src/validate/profiles.js'],
		noFixReason: 'Filename policy concerns the external file, not font bytes; rename that file or correct the supplied expectation.',
	},
};
const NO_FIX = {
	container: 'Container bytes, decompression, or declarations require source recovery or a separately implemented wrapper repair.',
	'sfnt-directory': 'Only the explicitly linked directory repairs are implemented; other record or byte-range defects need source recovery.',
	'table-presence': 'Missing or unsupported table semantics cannot be reconstructed by the registered byte-preserving repairs.',
	checksums: 'Checksum repair eligibility is decided by the repair planner, not by an identifier.',
	'table-parsing': 'A failed parser does not identify a safe byte-level correction; recover a readable source first.',
	collection: 'Collection-directory damage is not repaired by selecting a face; guarded face repair retains the original directory and every unselected face.',
	'diagnostic-execution': 'This is an inspection precondition, limit, or execution failure; changing font bytes is not a registered remedy.',
	'cff-context': 'Required CFF execution context is missing or unsupported; recover source data or implement the missing evaluator.',
	'cff-variation-context': 'Reconstructing a CFF2 variation program is outside the registered repair scope.',
	'cff-charstrings': 'No general charstring repair is registered; the source-confirmed empty-program action cannot reconstruct damaged nonempty programs or subroutines.',
	'truetype-composites': 'Component references and recursion require a design decision or source recovery, not an inferred replacement.',
	'truetype-geometry': 'Derived-field repairs require complete geometry; no registered action reconstructs missing contours or ambiguous components for this finding.',
	'truetype-instructions': 'Instruction scanning cannot establish a replacement program. Explicitly lossy dehinting is distinct from repairing its original behavior.',
};
const NO_FIX_CODES = {
	DIAGNOSTIC_LIMIT_EXCEEDED: 'A configured work or memory bound stopped diagnosis. Adjust limits only for trusted input; this does not establish a font-byte repair.',
	INVALID_DIAGNOSTIC_OPTIONS: 'Correct the diagnostic API options; changing font bytes cannot correct invalid arguments.',
	DIAGNOSTIC_CHECK_FAILED: 'A checker failed unexpectedly. Preserve the source and investigate the execution failure before inferring a font correction.',
	FACE_INDEX_OUT_OF_RANGE: 'Select an existing collection face; no registered font-byte repair changes the caller-selected index.',
	CFF_OPERATION_LIMIT_EXCEEDED: 'The bounded charstring walker exhausted its operation budget; no rewrite is authorized by incomplete execution.',
	CFF_CONTEXT_UNSUPPORTED: 'The evaluator does not implement this execution context or operator. Unsupported analysis is not proof of invalid bytecode, and no rewrite is registered.',
	WOFF2_COLLECTION_UNSUPPORTED: 'The decoder does not reconstruct file-relative TTC offsets for WOFF2 collections. Use a supported unwrapped source or extend the decoder; no input defect or repair is inferred.',
	FILE_EXCEEDS_1GB: 'This is a consumer-size constraint, not a byte-local correction; size-reduction or subsetting operations are not registered repairs.',
	CMAP_FORMAT4_RANGE_OFFSET_INVALID: 'No registered repair reconstructs format-4 offsets and glyph arrays; recover authoritative mappings rather than guessing byte addresses.',
	LAYOUT_MARK_FILTER_SET_INVALID: 'No registered repair chooses or reconstructs a GDEF mark filtering set; that selection requires authoritative layout intent.',
	LAYOUT_MARK_ATTACHMENT_CLASS_UNAVAILABLE: 'No registered repair invents missing GDEF mark attachment classes; recover the intended class membership from source.',
};
const TABLE_REFERENCE_NAMES = {
	'OS/2': 'os2', 'CFF ': 'cff', CFF2: 'cff2', 'SVG ': 'svg',
};
function referencesFor(family, tables) {
	const references = tables.filter((tag) => tag !== '*').map((tag) =>
		OT + (TABLE_REFERENCE_NAMES[tag] ?? tag.toLowerCase()));
	if (!references.length || tables.includes('*')) references.push(`${OT}otff`);
	if (family.startsWith('layout-')) references.push(`${OT}chapter2`);
	if (family === 'variation-store') references.push(`${OT}otvarcommonformats#item-variation-store`);
	if (family === 'variation-selectors' || family === 'character-mapping')
		references.push('https://www.unicode.org/Public/17.0.0/ucd/PropList.txt');
	if (family.startsWith('cff-')) {
		if (tables.includes('CFF ')) references.push(
			'https://adobe-type-tools.github.io/font-tech-notes/pdfs/5176.CFF.pdf',
			'https://adobe-type-tools.github.io/font-tech-notes/pdfs/5177.Type2.pdf',
		);
		if (tables.includes('CFF2')) references.push(`${OT}cff2charstr`);
	}
	if (family === 'truetype-instructions') references.push(`${OT}tt_instructions`);
	if (family === 'diagnostic-execution') return ['docs/diagnostics.md'];
	return sorted(references);
}

const ADVANCED_SCOPES = {
	'advanced-common': ['advanced-shared-structures', ['*']],
	'advanced-diagnostics': ['diagnostic-execution', ['*']],
	'advanced-layout': ['layout-graph', ['GDEF', 'GSUB', 'GPOS']],
	'advanced-cff-private': ['cff-private-dictionaries', ['CFF2']],
	'advanced-variation': ['variation-structures', ['fvar', 'gvar', 'cvar', 'HVAR', 'VVAR', 'MVAR', 'GDEF', 'BASE', 'COLR', 'CFF2']],
	'advanced-color': ['color-structures', ['COLR', 'CPAL', 'SVG ']],
	'advanced-bitmap': ['bitmap-structures', ['CBLC', 'CBDT', 'EBLC', 'EBDT', 'bloc', 'bdat', 'sbix', 'EBSC']],
};
const DERIVED_SCOPES = {
	QUALITY_NAME_WHITESPACE: ['naming', ['name']],
	QUALITY_POSTSCRIPT_NAME_INVALID: ['naming', ['name']],
	QUALITY_NAME_ENCODING_INVALID: ['naming', ['name']],
	QUALITY_AVERAGE_WIDTH_MISMATCH: ['metrics-and-style', ['OS/2', 'hhea', 'hmtx']],
	QUALITY_CHARACTER_RANGE_MISMATCH: ['character-mapping', ['OS/2', 'cmap']],
	TT_DERIVED_BOUNDS_MISMATCH: ['truetype-geometry', ['glyf', 'loca', 'head']],
	TT_DERIVED_MAXP_MISMATCH: ['truetype-geometry', ['glyf', 'loca', 'maxp']],
	HHEA_DERIVED_EXTREMA_MISMATCH: ['metrics-and-style', ['hhea', 'hmtx', 'glyf']],
	VHEA_DERIVED_EXTREMA_MISMATCH: ['metrics-and-style', ['vhea', 'vmtx', 'glyf']],
	CFF_DERIVED_MAXP_MISMATCH: ['cff-context', ['CFF ', 'CFF2', 'maxp']],
};

function classify(origin) {
	const { code, source } = origin;
	let pipeline, definition, reachability, formats;
	let policy;
	const module = source.file.replace(/^src\/validate\//, '').replace(/\.js$/, '');
	if (source.file === 'src/validate/diagnoseFont.js') {
		pipeline = 'binary';
		definition = source.symbol === 'phaseCrossTableChecks' ? CROSS_SCOPES[code] : BINARY_SCOPES[source.symbol];
		reachability = 'public-binary-diagnosis; format, table, parser and resource gates may skip execution';
		formats = CONTAINERS;
		if (source.symbol === 'validateWoff1Wrapper' || ['FORMAT_WOFF1', 'WOFF1_UNWRAPPED', 'WOFF1_UNWRAP_FAILED'].includes(code))
			formats = ['woff1'];
		if (source.symbol === 'validateWoff2Wrapper' || ['FORMAT_WOFF2', 'WOFF2_UNWRAPPED', 'WOFF2_UNWRAP_FAILED', 'WOFF2_COLLECTION_UNSUPPORTED'].includes(code))
			formats = ['woff2'];
		if (source.symbol === 'diagnoseCollection' || ['FORMAT_COLLECTION', 'COLLECTION_INFO'].includes(code))
			formats = ['collection'];
		if (code === 'BAD_CHECKSUM_ADJUSTMENT') formats = ['sfnt', 'woff1', 'woff2'];
	} else if (source.file === 'src/validate/validateJSON.js') {
		pipeline = source.symbol === 'validateSimplifiedJSON' ? 'editable' : 'resolved';
		definition = VALIDATION_SCOPES[source.symbol];
		formats = pipeline === 'editable' ? ['simplified-json'] : ['raw-table-json'];
		reachability = pipeline === 'editable'
			? 'public-simplified-validation; FontFlux.validate before detached export resolution'
			: RAW_ONLY.has(code)
				? 'internal-raw-validator-only; normal public validation constructs a single complete raw candidate before this validator'
				: 'public-detached-resolved-validation after simplified validation and resolution; also internal raw-table validator';
		if (source.symbol === 'validateCollection') formats = ['raw-collection-json'];
	} else if (source.file === 'src/font_flux.js' && source.symbol === 'validate') {
		pipeline = 'public-validation';
		definition = ['export-resolution', []];
		formats = ['simplified-json'];
		reachability = 'public-validation-wrapper; detached clone or export resolution threw';
	} else if (source.file === 'src/validate/profiles.js') {
		pipeline = 'profile';
		policy = PROFILE_SCOPES[code];
		definition = policy && [policy.family, policy.tables];
		formats = code === 'PROFILE_FILENAME_MISMATCH' ? ['profile-context'] : CONTAINERS;
		reachability = `public-quality-profile (${policy?.profiles.join(', ')}); requires its declared face metadata or caller context`;
	} else if (ADVANCED_SCOPES[module] || ['advanced-programs', 'advanced-specialist'].includes(module)) {
		pipeline = 'binary';
		formats = CONTAINERS;
		definition = ADVANCED_SCOPES[module];
		if (module === 'advanced-programs') definition = source.symbol === 'validateAdvancedTrueType'
			? ['truetype-instructions-and-geometry', ['glyf', 'loca', 'maxp', 'fpgm', 'prep', 'gasp']]
			: ['cff-programs-and-storage', ['CFF ', 'CFF2']];
		if (module === 'advanced-specialist') {
			const table = code.split('_')[0];
			if (['MATH', 'BASE', 'JSTF', 'MERG'].includes(table)) definition = ['specialist-structures', [table]];
		}
		reachability = 'public-binary-diagnosis; bounded original-byte/table checks with per-face execution coverage; not shaping, VM or rasterizer certification';
	} else if (['metadata-repairs', 'repair-tt', 'repair-cff'].includes(module)) {
		pipeline = 'binary'; formats = CONTAINERS; definition = DERIVED_SCOPES[code];
		reachability = 'public-binary-diagnosis; original table payloads, complete derivation prerequisites and explicit per-face blocked/unsupported coverage';
	} else if (module === 'quality-workflows') {
		pipeline = 'profile';
		formats = ['declared-context', 'simplified-json', ...CONTAINERS];
		definition = source.symbol === 'inspectFamily' ? ['family-policy', []]
			: source.symbol === 'inspectExpectations' ? ['repertoire-and-glyph-policy', []] : undefined;
		reachability = 'explicit public contextual workflow; caller-declared membership, repertoire or behavior policy, never inferred family completeness';
	} else if (module === 'workflow-source') {
		pipeline = 'editable'; formats = ['source-projects', 'simplified-json'];
		definition = ['source-outline-evidence', []];
		reachability = 'public source-quality workflow; supplied control geometry/masters and declared samples only, no implicit source recovery';
	} else if (module === 'workflow-legacy' && source.symbol === 'inspectLegacy') {
		pipeline = 'binary'; formats = ['cff', 'cff2', 'pfa', 'pfb', 'afm'];
		definition = ['legacy-original-structures', []];
		reachability = 'public legacy inspection and FontFlux.inspect routing; original evidence only, unsupported execution and source replacement explicitly distinguished';
	}
	if (!definition) throw new Error(`Review family/table/reachability metadata for ${source.file}:${source.symbol}:${code}`);
	const [family, defaultTables] = definition;
	const tables = EMISSION_TABLES[code] ?? defaultTables;
	const references = policy ? [...policy.references] : referencesFor(family, tables);
	if (formats.includes('woff1')) {
		if (family === 'container') references.push('https://www.w3.org/TR/WOFF/');
	}
	if (formats.includes('woff2')) {
		if (family === 'container') references.push('https://www.w3.org/TR/WOFF2/');
	}
	if (pipeline === 'editable' || pipeline === 'resolved')
		references.push('font-flux.schema.json', 'docs/validation.md');
	if (pipeline === 'profile') references.push('docs/font-quality.md');
	if (pipeline === 'public-validation') references.push('docs/validation.md', 'src/export.js');
	if (module.startsWith('advanced-')) references.push('docs/advanced-diagnostics.md');
	if (module.startsWith('workflow-') || module === 'quality-workflows') references.push('docs/quality-workflows.md');
	if (['metadata-repairs', 'repair-tt', 'repair-cff'].includes(module)) references.push('docs/font-quality.md', 'docs/repair-extensions.md');
	if (NO_FIX_CODES[code]) references.push('docs/diagnostics.md');
	if (code === 'CMAP_FORMAT4_RANGE_OFFSET_INVALID')
		references.push(`${OT}cmap#format-4-segment-mapping-to-delta-values`);
	if (source.symbol === 'validateLayoutReferences')
		references.push(`${OT}chapter2#lookup-table`);
	const prefix = pipeline === 'binary' ? 'binary' : pipeline === 'profile' ? 'profile' : 'validation';
	return {
		checkId: policy?.checkId ?? `${prefix}.${source.symbol}`, pipeline, family,
		...(tables.length === 1 && tables[0] !== '*' ? { table: tables[0] } : {}),
		tables, formats: [...formats],
		kind: origin.severities.every((severity) => severity === 'info') ? 'information' : 'finding',
		publicReachability: reachability, source,
		references: sorted(references), severities: origin.severities,
		...(policy ? { profiles: policy.profiles } : {}),
		...(origin.expression ? { expression: origin.expression, expansionEvidence: origin.expansionEvidence } : {}),
	};
}

export function buildInventory(sources, baseline, repairSources = sources) {
	const extraction = extractDiagnosticOrigins(sources);
	const repairs = extractRepairLinks(repairSources);
	const baselineIDs = sorted(baseline.origins.map((o) => o.code));
	const currentIDs = sorted(extraction.origins.map((o) => o.code));
	const catalog = {};
	for (const id of sorted([...baselineIDs, ...currentIDs])) {
		const current = extraction.origins.filter((o) => o.code === id);
		const retired = current.length === 0;
		if (retired && !LEGACY_REASONS[id])
			throw new Error(`Baseline identifier ${id} was removed; add an explicit LEGACY_REASONS entry`);
		const rawOrigins = retired ? baseline.origins.filter((o) => o.code === id) : current;
		const origins = rawOrigins.map(classify);
		const repairIds = repairs.filter((repair) => repair.codes.includes(id)).map((repair) => repair.id);
		const first = origins[0];
		const kind = origins.every((o) => o.kind === 'information') ? 'information' : 'finding';
		catalog[id] = {
			id, ...first, kind,
			pipelines: sorted(origins.map((o) => o.pipeline)),
			checkIds: sorted(origins.map((o) => o.checkId)),
			formats: sorted(origins.flatMap((o) => o.formats)),
			tables: sorted(origins.flatMap((o) => o.tables)),
			references: sorted(origins.flatMap((o) => o.references)),
			repairIds,
			...(!repairIds.length ? {
				noFixReason: retired ? LEGACY_REASONS[id] : kind === 'information'
					? 'Informational observation or detached normalization notice, not a registered repair operation.'
					: PROFILE_SCOPES[id]?.noFixReason
						? PROFILE_SCOPES[id].noFixReason
					: NO_FIX_CODES[id]
						? NO_FIX_CODES[id]
					: first.pipeline !== 'binary'
						? 'No registered binary repair for this identifier; correct the authoring data or satisfy the explicit validation/profile requirement.'
						: NO_FIX[first.family] ??
							`No registered repair for ${id}; correcting ${first.family} data requires a separately specified operation with complete dependency and intent checks.`,
			} : {}),
			status: retired ? 'legacy' : 'active',
			baseline: baselineIDs.includes(id),
			...(retired ? { retirementReason: LEGACY_REASONS[id], sourceRevision: BASELINE_COMMIT } : {}),
			origins,
		};
	}
	for (const repair of repairs)
		for (const code of repair.codes)
			if (!catalog[code]) throw new Error(`Repair ${repair.id} refers to an uninventoried code: ${code}`);
	return {
		catalog, baseline, repairs, dynamicSites: extraction.dynamicSites, operationalErrors: extraction.operationalErrors,
		summary: {
			baselineIdentifiers: baselineIDs.length,
			activeIdentifiers: currentIDs.length,
			legacyIdentifiers: baselineIDs.filter((id) => !currentIDs.includes(id)).length,
			informationIdentifiers: Object.values(catalog).filter((d) => d.status === 'active' && d.kind === 'information').length,
			findingIdentifiers: Object.values(catalog).filter((d) => d.status === 'active' && d.kind === 'finding').length,
			registeredRepairs: repairs.length,
			identifiersWithRepairLinks: Object.values(catalog).filter((d) => d.repairIds.length).length,
			dynamicEmissionSites: extraction.dynamicSites.length,
			unresolvedDynamicExpressions: 0,
		},
	};
}

function walkSources(directory) {
	return readdirSync(directory, { withFileTypes: true })
		.flatMap((entry) => entry.isDirectory() ? walkSources(join(directory, entry.name))
			: entry.name.endsWith('.js') ? [join(directory, entry.name)] : []);
}

export function readSources(root = ROOT) {
	return Object.fromEntries(walkSources(join(root, 'src')).map((file) => [
		relative(root, file).replaceAll('\\', '/'), readFileSync(file, 'utf8'),
	]).filter(([file]) => file !== CATALOG_PATH));
}

export function baselineFromGit(root = ROOT) {
	const sources = Object.fromEntries(BASELINE_FILES.map((file) => [
		file, execFileSync('git', ['show', `${BASELINE_COMMIT}:${file}`], {
			cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
		}),
	]));
	const { origins, dynamicSites, unresolved } = extractDiagnosticOrigins(sources);
	return { commit: BASELINE_COMMIT, origins, dynamicSites, unresolved };
}

export function readBaseline(root = ROOT) {
	const path = join(root, CATALOG_PATH);
	let baseline;
	if (existsSync(path)) {
		const text = readFileSync(path, 'utf8');
		const tree = sourceTree(CATALOG_PATH, text);
		const node = tree.nodes.find((n) => n.type === 'VariableDeclarator' && n.id.name === 'CHECK_INVENTORY_BASELINE');
		if (!node) throw new Error('Missing immutable baseline snapshot in check-catalog.js');
		baseline = JSON.parse(text.slice(node.init.start, node.init.end));
	} else baseline = baselineFromGit(root);
	if (baseline.commit !== BASELINE_COMMIT ||
		sorted(baseline.origins.map((o) => o.code)).length !== 228 ||
		(BASELINE_DIGEST && digest(baseline) !== BASELINE_DIGEST))
		throw new Error('Pinned baseline snapshot has changed; verify against the original Git revision');
	return baseline;
}

const json = (value) => JSON.stringify(value, null, '\t');
export function renderCatalog(inventory) {
	return `// biome-ignore-all lint/suspicious/noTemplateCurlyInString: AST evidence intentionally preserves source templates.
// Generated by scripts/generate-check-inventory.mjs; do not edit by hand.
// Identifier inventory, NOT executed coverage, independent check counts, or repair eligibility.
// Browser-safe static metadata: no parser, filesystem, or quality.js dependency.

export const CHECK_INVENTORY_BASELINE = ${json(inventory.baseline)};

export const CHECK_INVENTORY_SUMMARY = ${json(inventory.summary)};

export const CHECK_CATALOG = ${json(inventory.catalog)};

export function getCheckDescriptor(code) {
\treturn Object.hasOwn(CHECK_CATALOG, code) ? CHECK_CATALOG[code] : undefined;
}
`;
}

function sourceLink(source, revision) {
	const path = revision
		? `https://github.com/mattlag/Font-Flux-JS/blob/${revision}/${source.file}`
		: `https://github.com/mattlag/Font-Flux-JS/blob/main/${source.file}`;
	return `[${source.symbol}:${source.line}](${path}#L${source.line})`;
}

export function renderDocs(inventory) {
	const { summary, catalog } = inventory;
	const rows = Object.values(catalog).map((d) => {
		const sources = [...new Map(d.origins.map((o) =>
			[`${o.source.file}:${o.source.line}`, o.source])).values()];
		return `| \`${d.id}\` | ${d.status}${d.baseline ? ' · baseline' : ''} | ${d.kind} | ${d.pipelines.join(', ')} | ${d.family} | ${d.tables.join(', ') || '—'} | ${sources.map((s) => sourceLink(s, d.sourceRevision)).join('<br>')} | ${d.repairIds.map((id) => `\`${id}\``).join(', ') || 'No registered fix¹'} |`;
	});
	const dynamicRows = inventory.dynamicSites.map((site) =>
		`| ${sourceLink(site.source)} | \`${site.expression}\` | ${site.codes.map((code) => `\`${code}\``).join(', ')} | ${site.expansionEvidence.map((proof) => sourceLink(proof)).join(', ')} |`);
	return `# Diagnostic and validation identifier inventory

<!-- Generated by scripts/generate-check-inventory.mjs. -->

This is the durable [FQ-001 capability/provenance ledger](https://github.com/mattlag/Font-Flux-JS/blob/main/FONT-QUALITY-BACKLOG.md#fq-001---establish-the-capability-and-provenance-ledger).
The machine-readable authority is [check-catalog.js](https://github.com/mattlag/Font-Flux-JS/blob/main/src/validate/check-catalog.js):
\`CHECK_CATALOG\`, \`getCheckDescriptor(code)\`, \`CHECK_INVENTORY_BASELINE\`, and \`CHECK_INVENTORY_SUMMARY\`.
It is original FFJS metadata generated from original FFJS implementation sites.
No upstream checker/fixer implementation is copied, translated, or required at runtime.

## What these numbers mean

- **${summary.activeIdentifiers} active identifiers:** ${summary.findingIdentifiers} finding identifiers and ${summary.informationIdentifiers} informational identifiers.
- **${summary.baselineIdentifiers} baseline identifiers** at [\`${BASELINE_COMMIT.slice(0, 7)}\`](https://github.com/mattlag/Font-Flux-JS/tree/${BASELINE_COMMIT}); ${summary.legacyIdentifiers} explicitly retired identifiers.
- **${summary.registeredRepairs} registered repair operations**, linked to ${summary.identifiersWithRepairLinks} identifiers; operations with no trigger code (such as explicit signature removal) remain in the repair catalogue.
- **${summary.dynamicEmissionSites} finite dynamic emission sites**, **${summary.unresolvedDynamicExpressions} unresolved dynamic identifier expressions**.

**Identifier counts are not independent check counts, execution coverage, pass rates, coverage percentages, or repair availability.**
One routine emits several codes; a code can have several origins, severities, and pipelines.
Information notices such as format detection and detached header normalization are not checks or repair promises.
An active source site can still be gated, skipped, blocked, or unreachable for a particular input.
Use the per-run report for execution outcomes. Successful parsing is not semantic certification.

## Reachability, scope, and evidence

Every descriptor includes concrete source file/line/top-level function evidence, all emission origins,
pipeline(s), stable function-level check IDs, family, tables, formats, references, status, and repair IDs
or an explicit \`noFixReason\`. The top-level singular fields describe the first origin;
\`origins\`, \`checkIds\`, and \`pipelines\` are authoritative when an identifier is shared.
Current line links target the working source's main-branch path and may move; baseline evidence is pinned
to the historical commit and retained in the static baseline snapshot. Regenerate after source movement.
Local paths in machine-readable references are relative to the repository root.

- **binary:** public binary diagnosis; SFNT faces can also arrive through WOFF1/WOFF2 or a collection.
  Container labels are accepted input routes, not a promise of complete table execution or WOFF2 collection support.
  Table names list the structures inspected or cross-referenced, not complete coverage of those tables.
  \`*\` means the table directory/registered parser/raw-table path can consider any tag.
- **editable:** the simplified authoring validator called first by \`FontFlux.validate()\`.
- **resolved:** the internal raw-table validator. Public validation reaches it only after successful
  simplified validation and detached export resolution. \`internal-raw-validator-only\` marks raw-shape,
  raw-collection, missing core/outline, and header-synthesis/count codes normally excluded by that construction.
  Other resolved findings can inspect preserved tables or original header fields.
  The internal module validator can mutate its input; public validation does not mutate live authoring data.
- **public-validation:** the public wrapper's clone/resolution failure, not binary inspection.
- **profile:** explicitly selected versioned quality policy; policy findings are not automatically structural defects.

The source locations are emission evidence, not proof that each branch has been exercised.
The inventory does not interpret exception strings from parser internals as diagnostic identifiers:
those failures surface through their actual report code, for example \`TABLE_PARSE_FAILED\`.

¹ “No registered fix” is not a safety judgment. Read the descriptor's explicit reason.
Linked repairs are extracted from the actual [quality.js catalogue](https://github.com/mattlag/Font-Flux-JS/blob/main/src/validate/quality.js);
availability, risk, prerequisites, user intent/consent, and output verification belong to the planner.
Registered repairs support guarded SFNT, WOFF1/WOFF2 and explicitly selected collection faces.
Availability is per action and input: signatures, opaque dependencies, incomplete structures and unknown context can block an offer.
Legacy source replacement is not an in-place repair. Optional policy/loss actions without finding codes remain listed in the public repair registry, not falsely attached to unrelated findings.

### Operational worker errors (not font findings)

These errors reject the asynchronous operation and never certify or commit a candidate:

${inventory.operationalErrors.map((entry) => `- \`${entry.code}\` — \`${entry.source.file}:${entry.source.line}\``).join('\n')}

## Reproduce and maintain

\`\`\`sh
node scripts/generate-check-inventory.mjs
node scripts/generate-check-inventory.mjs --check
node scripts/generate-check-inventory.mjs --verify-baseline --check
npx vitest run test/check-inventory.test.js
\`\`\`

The generator recursively parses current \`src/**/*.js\` (excluding its generated catalogue),
discovers diagnostic object sinks and forwarding helpers, resolves finite templates through actual
call arguments and loop domains, and reads actual repair-code registrations. New/unresolved expressions fail closed.
New functions require reviewed family/table/reachability metadata; removed baseline IDs require an explicit retirement reason.
It includes \`src/validate/profiles.js\` whenever present and the public wrapper in \`src/font_flux.js\`.
Output is deterministic; \`--check\` never writes and fails if either output is stale.

The installed TypeScript 7 package exposes version metadata but no JavaScript compiler AST API.
The generator therefore uses **\`parseAst\` exported by the declared development dependency \`vite\`**
(an ESTree AST, not regex ID extraction). It does not import an undeclared/transitive parser package.
The generated browser module imports neither this parser, Node facilities, nor \`quality.js\`.
Normal generation/checking uses the pinned, digest-checked baseline snapshot and works in shallow checkouts.
\`--verify-baseline\` additionally requires the historical Git object and compares independently extracted evidence.
Do not silently edit or reduce the 228-ID snapshot when a source branch is removed.

## Dynamic identifiers

The exact expansions below come from finite AST data flow, not prefix guesses.
Forwarding helper parameters are traced to concrete caller sites rather than counted as identifiers.

| Emission | Expression | Expanded identifiers | Domain/call-site evidence |
| --- | --- | --- | --- |
${dynamicRows.join('\n')}

## Original implementation and upstream provenance

The durable [upstream capability crosswalk](https://github.com/mattlag/Font-Flux-JS/blob/main/FONT-QUALITY-BACKLOG.md#upstream-capability-to-work-mapping)
maps **all 33 reviewed Fontspector binary-fixer hooks**, source-only capabilities, and explicit exclusions to FFJS work items.
This inventory does not equate registrations, provider definitions, executed profile checks, or successful fixes.
Representative pinned comparison sources (requirements/provenance, not implementation dependencies):

- [Fontspector provider registration](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/profile-opentype/src/lib.rs)
- [Fontspector maxp hook](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/profile-opentype/src/checks/opentype/maxp_version.rs)
- [Fontspector trailing-space binary stub](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/profile-universal/src/checks/name/trailing_spaces.rs)
- [fontTools SFNT compilation](https://github.com/fonttools/fonttools/blob/1ff10daa33d4e40af00a76cda7fa804af4200b30/Lib/fontTools/ttLib/sfnt.py)
- [fontTools OS/2 derivation](https://github.com/fonttools/fonttools/blob/1ff10daa33d4e40af00a76cda7fa804af4200b30/Lib/fontTools/ttLib/tables/O_S_2f_2.py)

Normative references are recorded per descriptor: [OpenType SFNT](https://learn.microsoft.com/en-us/typography/opentype/spec/otff),
table-specific OpenType chapters, [layout structures](https://learn.microsoft.com/en-us/typography/opentype/spec/chapter2),
[Type 2 Charstrings](https://adobe-type-tools.github.io/font-tech-notes/pdfs/5177.Type2.pdf),
[WOFF1](https://www.w3.org/TR/WOFF/), [WOFF2](https://www.w3.org/TR/WOFF2/),
[Unicode 17 variation-selector properties](https://www.unicode.org/Public/17.0.0/ucd/PropList.txt),
and the local [FFJS schema](https://github.com/mattlag/Font-Flux-JS/blob/main/font-flux.schema.json).
A reference states the governing format/contract, not that FFJS implements every clause or that historical behavior was correct.
For example, legacy \`OS2_WEIGHT_CLAMPED\`/\`OS2_WIDTH_CLAMPED\` names do not establish that a clamp occurred.

## Complete identifier ledger

${summary.legacyIdentifiers ? 'Retired baseline identifiers are retained below with status **legacy** and a machine-readable retirement reason.' : 'No baseline identifiers are currently removed: all 228 are retained as active source identifiers. Future removals must remain as explicit **legacy** entries.'}

| Identifier | Status | Kind | Pipeline(s) | Family | Tables/context | Emission evidence | Repair IDs |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;
}

export function generate({ root = ROOT, check = false, verifyBaseline = false } = {}) {
	const baseline = readBaseline(root);
	if (verifyBaseline && digest(baselineFromGit(root)) !== digest(baseline))
		throw new Error('Baseline snapshot differs from the pinned Git sources');
	const inventory = buildInventory(readSources(root), baseline);
	for (const [file, expected] of [[CATALOG_PATH, renderCatalog(inventory)], [DOC_PATH, renderDocs(inventory)]]) {
		const path = join(root, file);
		if (check) {
			if (!existsSync(path) || readFileSync(path, 'utf8') !== expected)
				throw new Error(`${file} is stale; run node scripts/generate-check-inventory.mjs`);
		} else writeFileSync(path, expected);
	}
	return inventory;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2);
	if (args.some((arg) => !['--check', '--verify-baseline'].includes(arg))) {
		console.error('Usage: node scripts/generate-check-inventory.mjs [--check] [--verify-baseline]');
		process.exitCode = 1;
	} else {
		try {
			const result = generate({ check: args.includes('--check'), verifyBaseline: args.includes('--verify-baseline') });
			console.log(JSON.stringify(result.summary));
		} catch (error) {
			console.error(error.message);
			process.exitCode = 1;
		}
	}
}
