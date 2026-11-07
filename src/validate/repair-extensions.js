import { applyCff, cffPrerequisites, inspectCff, verifyCff } from './repair-cff.js';
import { applyMitigation, mitigationPrerequisites, REMOVABLE_TABLES, verifyMitigations } from './repair-mitigations.js';
import { applyTT, inspectTT, readTT, verifyTT } from './repair-tt.js';
import { applyVariable, variablePrerequisites, verifyVariable } from './repair-variable.js';

const indexInput = (key, label) => ({ key, label, type: 'integer', min: 0, max: 65535 });
const nameInput = { key: 'nameID', label: 'Authoritative existing name ID', type: 'integer', min: 2, max: 32767 };
const glyphInput = indexInput('glyphIndex', 'Glyph index (existing glyph order)');
const prerequisite = 'Complete, bounded authoritative table structures. No guessed geometry, missing metrics, or recovered variation deltas. Parent SFNT/signature guards and explicit lossy consent still apply.';
const unchanged = 'Every unrelated byte, glyph ID, mapping, advance, bearing, instruction and variation program is retained unless the selected action explicitly lists that loss.';
const headConflicts = ['head.magic', 'head.glyph-data-format', 'metadata.style'];
const hheaConflicts = ['metadata.italic', 'metrics.line', 'metrics.advance'];
const nameConflicts = ['name.record', 'name.remove-record', 'name.family', 'name.style'];
const ttActions = ['tt.bounds', 'tt.maxp-geometry', 'hhea.extrema', 'vhea.extrema',
	'hmtx.compact', 'vmtx.compact', 'tt.loca-format', 'tt.dehint', 'tt.decompose', 'tt.overlap-flag'];

export const EXTENDED_REPAIRS = [
	{
		id: 'tt.bounds', title: 'Recalculate static TrueType control-point bounds', risk: 'safe',
		codes: ['TT_DERIVED_BOUNDS_MISMATCH'], affectedTables: ['glyf', 'head'], conflicts: headConflicts,
		after: ['tt.decompose', 'tt.dehint'],
		description: 'Set per-glyph and font bounds from complete recursively transformed control points; empty glyphs do not enlarge font bounds.',
		ifApplied: 'Only stored bounds change. These are control-point hulls, not tight curve extrema or all-instance variation bounds.',
		riskReason: 'Static complete geometry determines the fields; variation and ambiguous transforms are blocked.',
	},
	{
		id: 'tt.maxp-geometry', title: 'Recalculate geometric maxp fields', risk: 'safe',
		codes: ['TT_DERIVED_MAXP_MISMATCH'], affectedTables: ['maxp'],
		after: ['tt.decompose', 'tt.dehint'],
		description: 'Recalculate point/contour/component counts, component depth and maximum glyph instruction byte length.',
		ifApplied: 'VM-dependent maxZones, twilight, storage, functions, instruction definitions and stack maxima remain untouched.',
		riskReason: 'Only representation-derived maxima change; TrueType VM execution is not inferred.',
	},
	...['h', 'v'].map((axis) => ({
		id: `${axis}hea.extrema`, title: `Recalculate ${axis === 'h' ? 'horizontal' : 'vertical'} metric extrema`,
		risk: 'safe', codes: [axis === 'h' ? 'HHEA_DERIVED_EXTREMA_MISMATCH' : 'VHEA_DERIVED_EXTREMA_MISMATCH'],
		affectedTables: [`${axis}hea`],
		conflicts: axis === 'h' ? hheaConflicts : [], after: ['tt.decompose'],
		description: 'Derive advance maximum and bearing/extent extrema from complete stored metrics and static glyph geometry, including compact trailing metrics.',
		ifApplied: 'Only four extrema fields change; intended advances and bearings remain exact.',
		riskReason: 'Missing metrics and unrepresentable or variable geometry are blocked rather than padded or clamped.',
	})),
	...['h', 'v'].map((axis) => ({
		id: `${axis}mtx.compact`, title: `Compact ${axis === 'h' ? 'horizontal' : 'vertical'} trailing metrics`,
		risk: 'safe', optional: true, requiresRebuild: true, affectedTables: [`${axis}mtx`, `${axis}hea`],
		conflicts: axis === 'h' ? hheaConflicts : [],
		description: 'Encode repeated trailing advances using the normative compact representation and coordinate the long-metric count.',
		ifApplied: 'Glyph-indexed advances/bearings and opaque suffix bytes remain exact; missing metrics cannot be recovered.',
		riskReason: 'The existing valid count establishes every authoritative metric; no count is inferred from ambiguous byte length.',
	})),
	{
		id: 'tt.loca-format', title: 'Choose a coordinated loca representation', risk: 'assisted',
		optional: true, requiresRebuild: true, affectedTables: ['loca', 'head'],
		conflicts: headConflicts, after: ['tt.dehint', 'tt.decompose'],
		inputs: [{ key: 'format', label: 'loca representation', type: 'enum', values: ['short', 'long'] }],
		description: 'Re-encode valid original glyph offsets and change head.indexToLocFormat together.',
		ifApplied: 'Glyph bytes and every glyph extent remain unchanged. Odd or overflowing short offsets are refused.',
		riskReason: 'Representation is explicit; damaged offsets and opaque loca suffixes cannot be reconstructed.',
	},
	{
		id: 'cff.maxp', title: 'Coordinate CFF glyph count and maxp version', risk: 'safe',
		codes: ['CFF_DERIVED_MAXP_MISMATCH', 'MAXP_VERSION_MISMATCH_FOR_OUTLINE'],
		affectedTables: ['maxp'],
		after: ['cff.empty-glyph'],
		description: 'Use a complete supported CFF1/CFF2 CharStrings INDEX for maxp.numGlyphs and the CFF maxp version.',
		ifApplied: 'Only the first six maxp bytes change. Every CFF program, FD assignment, subroutine and opaque byte is retained.',
		riskReason: 'Corrupted or unsupported programs, uncertain INDEX boundaries, unknown maxp versions and incomplete version-1 records block this action.',
	},
	{
		id: 'cff.charstrings-index', title: 'Re-encode a complete CFF CharStrings INDEX', risk: 'safe',
		optional: true, requiresRebuild: true, affectedTables: ['CFF ', 'CFF2'],
		after: ['cff.empty-glyph'],
		description: 'Append a canonical INDEX with identical complete programs and redirect its existing fixed-width Top DICT offset.',
		ifApplied: 'File size increases. Original bytes, including the old INDEX, stay intact except the selected offset operand. This cannot recover corrupt offsets.',
		riskReason: 'No existing program/dictionary is relocated or recompiled; unsupported offset encodings are blocked.',
	},
	{
		id: 'cff.empty-glyph', title: 'Terminate a source-confirmed empty CFF1 glyph', risk: 'assisted',
		optional: true, requiresRebuild: true, affectedTables: ['CFF '],
		inputs: [glyphInput, { key: 'confirmedEmpty', label: 'Source confirms this zero-byte program is intentionally empty', type: 'boolean' }],
		description: 'Replace only a zero-byte CFF1 CharString with endchar after explicit source-intent confirmation; all other programs must validate.',
		ifApplied: 'The empty glyph uses its existing Private DICT default width. No SFNT advance changes, and no truncated nonempty program is discarded.',
		riskReason: 'Empty-glyph intent cannot be inferred. CFF2 empty programs are valid and categorically excluded.',
	},
	{
		id: 'tt.dehint', title: 'Explicitly remove TrueType hint programs', risk: 'potentially-lossy',
		optional: true, requiresRebuild: true, affectedTables: ['glyf', 'loca', 'head', 'maxp', 'fpgm', 'prep', 'cvt '],
		conflicts: headConflicts,
		description: 'Remove glyph instructions and fpgm/prep/cvt while retaining encoded contours, components and existing rasterizer gasp policy.',
		ifApplied: 'Small-size rasterization may change. Instruction maxima and loca are coordinated; VM maxima are conservatively retained, not guessed.',
		riskReason: 'Hinting behavior is intentionally lost. Variable, device-metric and opaque dependencies are refused.',
	},
	{
		id: 'tt.decompose', title: 'Explicitly decompose one static composite glyph', risk: 'potentially-lossy',
		optional: true, requiresRebuild: true, affectedTables: ['glyf', 'loca', 'head', 'maxp', 'hhea', 'vhea'],
		conflicts: [...headConflicts, ...hheaConflicts], after: ['tt.dehint'],
		inputs: [glyphInput],
		description: 'Flatten complete nested/transformed and point-attached components into simple contours in an already dehinted font.',
		ifApplied: 'Point order within flattened contours is retained; fractional points round to integer font units. Component structure is lost and overlap is marked, not unioned. Dependent bounds, geometric maxima and existing metric extrema are coordinated.',
		riskReason: 'Topology, rounding, rasterization and file size may change. USE_MY_METRICS, variation, hints and point-index/opaque dependencies are blocked.',
	},
	{
		id: 'tt.overlap-flag', title: 'Choose one glyph overlap flag', risk: 'potentially-lossy',
		optional: true, affectedTables: ['glyf'],
		after: ['tt.dehint', 'tt.decompose'],
		inputs: [glyphInput, { key: 'overlap', label: 'Authoritative overlap flag', type: 'boolean' }],
		description: 'Set or clear only the first simple-point/composite-component overlap flag.',
		ifApplied: 'Rasterizer interpretation may change; geometry is not altered and contour union is not performed.',
		riskReason: 'Overlap intent is supplied explicitly, never inferred from a flag or treated as geometry repair.',
	},
	{
		id: 'fvar.axis-name', title: 'Choose an existing variable axis name', risk: 'assisted',
		codes: ['FVAR_AXIS_NAMEID_RESERVED', 'FVAR_AXIS_NAMEID_MISSING'], optional: true,
		affectedTables: ['fvar'], inputs: [indexInput('axisIndex', 'Axis index in the existing order'), nameInput],
		conflicts: nameConflicts,
		description: 'Change one fvar axisNameID reference to authoritative existing localized names.',
		ifApplied: 'Axis tags, order, ranges, defaults, flags, instances and deltas remain byte-identical.',
		riskReason: 'A display-name reference is not an axis tag rename or topology change.',
	},
	{
		id: 'fvar.instance-name', title: 'Choose an existing instance name reference', risk: 'assisted',
		codes: ['FVAR_INSTANCE_NAMEID_MISSING'], optional: true, affectedTables: ['fvar'],
		conflicts: nameConflicts,
		inputs: [indexInput('instanceIndex', 'Existing instance index'),
			{ key: 'field', label: 'Instance name field', type: 'enum', values: ['subfamily', 'postscript'] },
			{ ...nameInput, max: 65535 }],
		description: 'Change a selected subfamily or existing PostScript name field without overwriting custom instance coordinates.',
		ifApplied: 'Only the selected two-byte reference changes. PostScript sentinel 65535 explicitly means no name.',
		riskReason: 'Installation/display naming can change; geometry, instance coordinates and variation programs do not.',
	},
	...[
		['axis', 'axisIndex', 'Axis index'], ['value', 'valueIndex', 'Axis value index'],
	].map(([kind, key, label]) => ({
		id: `stat.${kind}-name`, title: `Choose an existing STAT ${kind} name`, risk: 'assisted',
		optional: true, affectedTables: ['STAT'], inputs: [indexInput(key, label), nameInput],
		conflicts: nameConflicts,
		description: `Change one supported STAT ${kind} name reference using authoritative existing localized names.`,
		ifApplied: 'Only that reference changes; axis order, ranges, values, flags and opaque extension bytes stay intact.',
		riskReason: 'Supported versions/formats are structurally checked; unknown and aliased structures are blocked.',
	})),
	{
		id: 'stat.fallback-name', title: 'Choose an existing STAT fallback name', risk: 'assisted',
		optional: true, affectedTables: ['STAT'], inputs: [nameInput],
		conflicts: nameConflicts,
		description: 'Change the existing STAT 1.1/1.2 elidedFallbackNameID.',
		ifApplied: 'Only the fallback name reference changes; no STAT 1.0 upgrade or fabricated axis value is performed.',
		riskReason: 'Fallback display naming is an explicit author decision.',
	},
	{
		id: 'fvar.default-style', title: 'Make an existing axis default authoritative for OS/2 style', risk: 'assisted',
		optional: true, affectedTables: ['OS/2'],
		conflicts: ['metadata.style', 'rights.embedding', 'metrics.line', 'os2.average-width',
			'os2.character-range', 'os2.code-pages', 'os2.weight', 'os2.width', 'os2.typo-linegap'],
		inputs: [{ key: 'axis', label: 'Authoritative default axis', type: 'enum', values: ['wght', 'wdth'] }],
		description: 'Use the existing default wght coordinate or exact standard wdth percentage for the matching OS/2 class.',
		ifApplied: 'Only the matching OS/2 class changes; axis defaults, STAT, names and deltas are not modified.',
		riskReason: 'This is selected class consistency, not full style linking. Contradictory ranges and inexact width classes are blocked.',
	},
	{
		id: 'fvar.add-instance', title: 'Append one explicit named instance', risk: 'assisted',
		optional: true, requiresRebuild: true, affectedTables: ['fvar'],
		conflicts: nameConflicts,
		inputs: [nameInput,
			{ key: 'coordinates', label: 'Exact decimal coordinates in existing axis order, comma separated', type: 'string', maxLength: 8192 },
			{ key: 'postScriptNameID', label: 'Existing PostScript name ID or 65535 for no name', type: 'integer', min: 6, max: 65535 }],
		description: 'Append an explicitly specified standard or custom instance; never infer or overwrite existing custom instances.',
		ifApplied: 'Existing instances, axis order, all deltas and opaque suffix bytes are retained. Coordinates must be exactly 16.16-representable and in range.',
		riskReason: 'Named-instance metadata is added without evaluating interpolation or statically instancing the font.',
	},
	{
		id: 'fvar.standard-instance', title: 'Opt into one standard weight instance', risk: 'assisted',
		optional: true, requiresRebuild: true, affectedTables: ['fvar'],
		conflicts: [...nameConflicts, 'fvar.add-instance'],
		inputs: [nameInput,
			{ key: 'weight', label: 'Standard wght coordinate; other axes use their existing defaults', type: 'enum',
				values: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
			{ key: 'postScriptNameID', label: 'Existing PostScript name ID or 65535 for no name', type: 'integer', min: 6, max: 65535 }],
		description: 'Append one explicitly selected standard weight instance using existing defaults for all other axes and authoritative existing names.',
		ifApplied: 'Every existing custom instance and variation delta remains intact. Duplicate coordinate tuples are refused, never overwritten or reported as a successful addition.',
		riskReason: 'The opt-in policy only adds metadata; unsupported axes/ranges and missing names are blocked.',
	},
	{
		id: 'tables.remove-optional', title: 'Explicitly remove one optional table', risk: 'potentially-lossy',
		optional: true, requiresRebuild: true, affectedTables: REMOVABLE_TABLES,
		inputs: [{ key: 'tag', label: 'Exactly one table to remove', type: 'enum', values: REMOVABLE_TABLES }],
		description: 'Remove exactly the chosen optional color, kerning, rasterizer/device-policy or metadata table. No other optional table is implicitly purged.',
		ifApplied: 'The selected table feature is lost. Palette removal is blocked while COLR/SVG may reference it; color removal requires supported fallback outlines.',
		riskReason: 'Rendering, kerning, device behavior or metadata can be lost. Unknown/variable dependencies block removal.',
	},
	{
		id: 'tt.remove-last-glyph', title: 'Remove one provably isolated final TrueType glyph', risk: 'potentially-lossy',
		optional: true, requiresRebuild: true,
		affectedTables: ['glyf', 'loca', 'maxp', 'head', 'hhea', 'hmtx', 'vhea', 'vmtx', 'OS/2'],
		conflicts: [...ttActions, ...headConflicts, ...hheaConflicts, 'post.drop-names', 'cmap.mapping', 'cmap.remove-mapping',
			'rights.embedding', 'os2.average-width', 'os2.character-range', 'os2.code-pages', 'os2.weight', 'os2.width', 'os2.typo-linegap'],
		inputs: [glyphInput],
		description: 'Remove only the final non-.notdef glyph after complete supported cmap, composite and COLR-v0 reference proof; all retained glyph IDs remain unchanged.',
		ifApplied: 'Only the chosen glyph and its metric records disappear. Font bounds, geometric maxima, metric counts/extrema and OS/2 v3+ average advance are coordinated; retained glyph bytes/positions and metrics remain intact.',
		riskReason: 'A glyph is intentionally lost. Hinting, names, unsupported layout/UVS, variation and opaque reference dependencies require separate source-aware work.',
	},
	{
		id: 'outlines.to-cff', title: 'Convert guarded static TrueType outlines to CFF', risk: 'potentially-lossy',
		optional: true, requiresRebuild: true, affectedTables: ['glyf', 'loca', 'maxp', 'head', 'CFF '],
		conflicts: [...ttActions, ...headConflicts, 'tt.remove-last-glyph', 'tables.remove-optional', 'cff.maxp',
			'cff.charstrings-index', 'cff.empty-glyph', 'post.drop-names', 'metrics.advance'],
		inputs: [
			{ key: 'tolerance', label: 'Maximum Euclidean geometric deviation in font units (0–1)', type: 'number', min: 0, max: 1 },
			{ key: 'allowOutlineLoss', label: 'Authorize outline/program representation loss', type: 'boolean', mustBeTrue: true },
			{ key: 'postScriptName', label: 'Authoritative PostScript font name', type: 'string', maxLength: 63 }],
		description: 'Reuse the existing converter only for complete static dehinted simple contours with explicit endpoints, compatible bearings, post format 3, and fully supported dependencies.',
		ifApplied: 'glyf/loca become CFF, maxp becomes the six-byte CFF encoding, and head.indexToLocFormat becomes zero. Glyph IDs, advances/bearings and common post metadata stay unchanged; the parent must emit OTTO SFNT flavor. No other table is rebuilt or purged.',
		riskReason: 'Rasterization and outline representation change. An independent Bézier control-point bound verifies the chosen tolerance; unsupported closure, composite, vertical or opaque dependencies are refused.',
	},
].map((fix) => ({
	revision: 1, formats: ['sfnt'], prerequisites: prerequisite, invariants: [unchanged],
	codes: [], inputs: [], requiresRebuild: false,
	ifUnfixed: 'Retain the original; unsupported or missing authoritative data requires source-aware editing.',
	...fix,
}));

function freeze(value) {
	if (value && typeof value === 'object') {
		for (const child of Object.values(value)) freeze(child);
		Object.freeze(value);
	}
	return value;
}
freeze(EXTENDED_REPAIRS);
const catalog = new Map(EXTENDED_REPAIRS.map((fix) => [fix.id, fix]));

function descriptor(id) {
	const fix = catalog.get(id);
	if (!fix) throw new Error(`Unknown extended repair ID: ${id}`);
	return fix;
}

function family(id) {
	if (['tables.remove-optional', 'tt.remove-last-glyph', 'outlines.to-cff'].includes(id)) return 'mitigation';
	if (id.startsWith('cff.')) return 'cff';
	if (id.startsWith('fvar.') || id.startsWith('stat.')) return 'variable';
	return 'tt';
}

function execute(step, payloads, options) {
	const type = family(step.id);
	if (type === 'cff') applyCff(step, payloads, options);
	else if (type === 'variable') applyVariable(step, payloads);
	else if (type === 'mitigation') applyMitigation(step, payloads, options);
	else applyTT(step, payloads, options);
}

export function extendedRepairReason(id, payloads, options = {}) {
	const fix = descriptor(id);
	try {
		if (options.values !== undefined || !fix.inputs.length) {
			// All writes replace buffers; this probe never mutates caller-owned bytes.
			execute({ id, values: options.values ?? {} }, new Map(payloads), options);
		} else if (family(id) === 'variable') variablePrerequisites(id, payloads);
		else if (family(id) === 'cff') cffPrerequisites(id, payloads, options);
		else if (family(id) === 'mitigation') mitigationPrerequisites(id, payloads, options);
		else {
			const tt = readTT(payloads, options);
			const values = id === 'tt.loca-format' ? { format: tt.format ? 'long' : 'short' } :
				{ glyphIndex: tt.glyphs.findIndex((glyph) => id === 'tt.decompose' ?
					glyph?.type === 'composite' : glyph?.type === 'composite' || glyph?.contours.some((c) => c.length)),
				overlap: true };
			execute({ id, values }, new Map(payloads), options);
		}
		return null;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
}

export function applyExtendedRepair(step, payloads, options = {}) {
	descriptor(step?.id);
	// Commit only after every parse, range/dependency check and allocation succeeds.
	const detached = new Map(payloads);
	execute(step, detached, options);
	payloads.clear();
	for (const [tag, bytes] of detached) payloads.set(tag, bytes);
}

export function extendedTableChanges(steps, beforePayloads) {
	const removed = new Set(), added = new Set();
	for (const step of steps) {
		descriptor(step?.id);
		if (step.id === 'tt.dehint')
			for (const tag of ['fpgm', 'prep', 'cvt ']) if (beforePayloads.has(tag)) removed.add(tag);
		if (step.id === 'tables.remove-optional') {
			if (!REMOVABLE_TABLES.includes(step.values?.tag)) throw new Error('Unknown optional table selection.');
			if (beforePayloads.has(step.values.tag)) removed.add(step.values.tag);
		}
		if (step.id === 'outlines.to-cff') {
			for (const tag of ['glyf', 'loca']) if (beforePayloads.has(tag)) removed.add(tag);
			if (!beforePayloads.has('CFF ')) added.add('CFF ');
		}
	}
	return { removed: [...removed], added: [...added] };
}

export function extendedSfntVersion(steps) {
	for (const step of steps) descriptor(step?.id);
	return steps.some((step) => step.id === 'outlines.to-cff') ? 0x4f54544f : null;
}

export function inspectDerivedRepairs(payloads, options = {}) {
	return [...inspectTT(payloads, options), ...inspectCff(payloads, options)];
}

export function inspectDerivedRepairCoverage(payloads, options = {}) {
	const scopes = ['tt.bounds', 'tt.maxp-geometry', 'hhea.extrema', 'vhea.extrema', 'cff.maxp'];
	return scopes.map((id) => {
		const present = id === 'cff.maxp' ?
			payloads.has('CFF ') || payloads.has('CFF2') : payloads.has('glyf');
		if (!present) return { id, outcome: 'skipped', reason: 'The applicable outline representation is absent.' };
		const reason = extendedRepairReason(id, payloads, options);
		if (reason) return { id,
			outcome: /unsupported|unknown|variable|future|ambiguous|source-aware|limit|exceed/i.test(reason) ? 'unsupported' : 'blocked',
			reason };
		return { id, outcome: 'checked', reason: 'Complete bounded authoritative prerequisites were checked; see derived findings for consistency results.' };
	});
}

export function verifyExtendedRepairs(beforePayloads, afterPayloads, steps, options = {}) {
	for (const step of steps) descriptor(step?.id);
	if (new Set(steps.map((step) => step.id)).size !== steps.length)
		throw new Error('Extended repair IDs must be unique within a transaction.');
	const failures = [];
	const handled = new Set();
	for (const [type, verifier] of [['tt', verifyTT], ['cff', verifyCff], ['variable', verifyVariable], ['mitigation', verifyMitigations]]) {
		const selected = steps.filter((step) => family(step.id) === type);
		if (!selected.length) continue;
		try {
			const result = verifier(beforePayloads, afterPayloads, selected, options);
			failures.push(...result.failures);
			for (const tag of result.handledTags) handled.add(tag);
		} catch (error) {
			failures.push(`Extended ${type} verification failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	return { failures, handledTags: [...handled] };
}
