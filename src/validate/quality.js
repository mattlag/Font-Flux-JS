import { convertOutlines } from '../convert.js';
import { computeTableChecksum, exportFont, resolveExportSource } from '../export.js';
import { encodeUtf16BE } from '../sfnt/table_name.js';
import { getCheckDescriptor } from './check-catalog.js';
import { diagnosisIncomplete } from './coverage.js';
import { diagnoseFont } from './diagnoseFont.js';
import { addProfileFindings, applyProfileCompatibility, evaluateProfile, resolveProfile } from './profiles.js';
import { ALL_SUPPORTED_TABLES } from './tables.js';
import { nameLayout } from './repair-data.js';
import { canonicalJSON, checkCancellation, orderRepairs, qualityPhase, validateRepairCatalog, validateRepairInputs } from './repair-contract.js';
import { METADATA_REPAIRS, metadataRepairReason, applyMetadataRepair, verifyMetadataRepairs } from './metadata-repairs.js';
import { CONTAINER_REPAIRS, prepareRepairContainer, emitRepairContainer, verifyRepairContainer } from './repair-containers.js';
import { EXTENDED_REPAIRS, extendedRepairReason, applyExtendedRepair, verifyExtendedRepairs,
	extendedTableChanges, extendedSfntVersion } from './repair-extensions.js';
import { inspectLegacy } from './workflow-legacy.js';
import { buildReport, validateJSON, validateSimplifiedJSON } from './validateJSON.js';

const plans = new WeakMap();
const CHECKSUM_CODES = ['BAD_CHECKSUM', 'BAD_CHECKSUM_ADJUSTMENT'];
const COMMON_PREREQUISITES =
	'An unambiguous SFNT face and a complete head table, with a preserving adapter for wrapped or collection inputs. ' +
	'Existing signatures require explicitly authorized removal. Original input is never overwritten.';
const BASE_REPAIRS = [
	{
		id: 'sfnt.checksums',
		title: 'Recalculate checksums',
		risk: 'safe',
		codes: CHECKSUM_CODES,
		description:
			'Recalculate table checksums and the standalone font checksum adjustment.',
		ifApplied:
			'Only directory checksum fields and head.checksumAdjustment change.',
		ifUnfixed: 'Integrity checks may fail in font consumers.',
		inputs: [],
	},
	{
		id: 'sfnt.search-fields',
		title: 'Correct directory search fields',
		risk: 'safe',
		codes: ['BAD_SEARCH_RANGE', 'BAD_ENTRY_SELECTOR', 'BAD_RANGE_SHIFT'],
		description:
			'Derive searchRange, entrySelector, and rangeShift from numTables.',
		ifApplied:
			'Directory search fields and companion checksums change; table payloads stay intact.',
		ifUnfixed: 'Consumers may reject or misread the directory.',
		inputs: [],
	},
	{
		id: 'sfnt.directory-order',
		title: 'Sort table directory records',
		risk: 'safe',
		codes: ['DIRECTORY_NOT_SORTED'],
		description:
			'Sort directory records by tag without moving their table data.',
		ifApplied:
			'Record order and companion checksums change; table offsets and payloads stay intact.',
		ifUnfixed: 'Consumers requiring sorted records may reject the font.',
		inputs: [],
	},
	{
		id: 'sfnt.alignment',
		title: 'Align table payloads',
		risk: 'safe',
		codes: ['TABLE_MISALIGNED'],
		description:
			'Rebuild table placement on four-byte boundaries while retaining every table payload.',
		ifApplied:
			'Offsets, directory fields, and checksums change. Unknown dependencies or nonzero unreferenced data block this operation.',
		ifUnfixed: 'Consumers may reject misaligned table storage.',
		inputs: [],
	},
	{
		id: 'name.order',
		title: 'Sort name records without re-encoding strings',
		risk: 'safe',
		codes: ['NAME_RECORDS_NOT_SORTED'],
		description:
			'Sort complete name records by their platform, encoding, language, and name IDs.',
		ifApplied:
			'Only record order and companion checksums change. String bytes and their record associations stay intact.',
		ifUnfixed:
			'Consumers requiring sorted naming records may reject or misread the table.',
		inputs: [],
	},
	{
		id: 'cmap.order',
		title: 'Sort cmap encoding records',
		risk: 'safe',
		codes: ['CMAP_SUBTABLES_NOT_SORTED'],
		description:
			'Sort uniquely identified platform/encoding records without changing subtable bytes or offsets.',
		ifApplied:
			'Only encoding-record order and companion checksums change. Ambiguous duplicate encodings are blocked.',
		ifUnfixed:
			'Consumers may select mappings inconsistently or reject the encoding-record order.',
		inputs: [],
	},
	{
		id: 'head.magic',
		title: 'Restore the head magic constant',
		risk: 'safe',
		codes: ['BAD_MAGIC_NUMBER'],
		description: 'Set the normative head.magicNumber constant to 0x5F0F3CF5.',
		ifApplied:
			'The constant and companion checksums change; outlines and metrics do not.',
		ifUnfixed: 'Consumers may reject the head table.',
		inputs: [],
	},
	{
		id: 'head.glyph-data-format',
		title: 'Correct the glyph data format constant',
		risk: 'assisted',
		codes: ['HEAD_GLYPH_DATA_FORMAT_INVALID'],
		description:
			'Declare the existing supported glyph representation as glyphDataFormat zero.',
		ifApplied:
			'The declaration changes, not the glyph data. Confirm the font uses the supported representation.',
		ifUnfixed:
			'The unsupported declaration can cause rejection; recover source if its meaning is unknown.',
		inputs: [
			{
				key: 'value',
				label: 'Confirmed glyph data format (0)',
				type: 'integer',
				min: 0,
				max: 0,
			},
		],
	},
	{
		id: 'cmap.version',
		title: 'Correct the cmap version declaration',
		risk: 'assisted',
		codes: ['CMAP_VERSION_INVALID'],
		description:
			'Declare an otherwise readable cmap structure as the supported version zero.',
		ifApplied:
			'The version declaration changes; every mapping byte is retained.',
		ifUnfixed:
			'The unsupported version can cause rejection; unknown structures require source recovery.',
		inputs: [
			{
				key: 'value',
				label: 'Confirmed cmap version (0)',
				type: 'integer',
				min: 0,
				max: 0,
			},
		],
	},
	{
		id: 'name.family',
		title: 'Supply a missing family name',
		risk: 'assisted',
		codes: ['NO_FAMILY_NAME'],
		description:
			'Append a Windows Unicode family-name record in the explicitly chosen language.',
		ifApplied:
			'Font identity may change. Existing localized name bytes are retained; related naming policy is not inferred.',
		ifUnfixed:
			'Applications may be unable to identify or group the font correctly.',
		inputs: [
			{
				key: 'value',
				label: 'Intended family name',
				type: 'string',
				maxLength: 255,
			},
			{
				key: 'languageID',
				label: 'Windows language ID (for example 1033 for en-US)',
				type: 'integer',
				min: 0,
				max: 32767,
			},
		],
	},
	{
		id: 'name.style',
		title: 'Supply a missing style name',
		risk: 'assisted',
		codes: ['NO_STYLE_NAME'],
		description:
			'Append a Windows Unicode style-name record in the explicitly chosen language.',
		ifApplied:
			'Style identification may change. No style is guessed, and existing localized name bytes are retained.',
		ifUnfixed: 'Applications may group or select the style incorrectly.',
		inputs: [
			{
				key: 'value',
				label: 'Intended style name',
				type: 'string',
				maxLength: 255,
			},
			{
				key: 'languageID',
				label: 'Windows language ID (for example 1033 for en-US)',
				type: 'integer',
				min: 0,
				max: 32767,
			},
		],
	},
	{
		id: 'os2.weight',
		title: 'Choose the intended weight class',
		risk: 'assisted',
		codes: ['OS2_WEIGHT_CLAMPED'],
		description:
			'Replace an out-of-range weight class with the user-supplied value, without clamping or guessing.',
		ifApplied:
			'Application weight classification may change. Other style fields and variation axes are not changed.',
		ifUnfixed: 'Applications may reject or inconsistently classify the weight.',
		inputs: [
			{
				key: 'value',
				label: 'Intended weight class',
				type: 'integer',
				min: 1,
				max: 1000,
			},
		],
	},
	{
		id: 'os2.width',
		title: 'Choose the intended width class',
		risk: 'assisted',
		codes: ['OS2_WIDTH_CLAMPED'],
		description:
			'Replace an out-of-range width class with the user-supplied value.',
		ifApplied:
			'Application width classification may change. Glyph advances and outlines do not.',
		ifUnfixed: 'Applications may reject or inconsistently classify the width.',
		inputs: [
			{
				key: 'value',
				label: 'Intended width class',
				type: 'integer',
				min: 1,
				max: 9,
			},
		],
	},
	{
		id: 'os2.typo-linegap',
		title: 'Choose a typographic line gap',
		risk: 'assisted',
		codes: ['OS2_TYPO_LINEGAP_NEGATIVE'],
		description:
			'Replace the negative OS/2 typographic line gap with an explicitly chosen value.',
		ifApplied:
			'Line spacing and text layout may change. hhea metrics remain unchanged.',
		ifUnfixed: 'Negative line gaps can produce inconsistent line layout.',
		inputs: [
			{
				key: 'value',
				label: 'Intended typographic line gap',
				type: 'integer',
				min: 0,
				max: 32767,
			},
		],
	},
	{
		id: 'dsig.remove',
		title: 'Remove the digital signature',
		risk: 'potentially-lossy',
		codes: [],
		description:
			'Remove DSIG so an edited output does not retain an invalid signature. This is not re-signing.',
		ifApplied:
			'The output loses its signature and authentication evidence. External re-signing is a separate operation.',
		ifUnfixed:
			'Retain the signed original; other repairs remain blocked to avoid invalidating its signature.',
		inputs: [],
	},
].map((fix) => ({
	...fix,
	revision: 1,
	formats: ['sfnt', 'woff', 'woff2', 'collection'],
	prerequisites: COMMON_PREREQUISITES,
	riskReason: fix.risk === 'safe'
		? 'Only established structural fields change under the stated preservation prerequisites.'
		: fix.risk === 'assisted'
			? 'An authoritative value is required; font identity or consumer behavior can change.'
			: 'Authentication evidence is removed and cannot be restored without external re-signing.',
	invariants: ['All unselected table payloads remain byte-preserved.', 'Glyph order, outlines, instructions and all unselected names/mappings are unchanged.'],
}));
const CATALOG = [...BASE_REPAIRS, ...METADATA_REPAIRS, ...CONTAINER_REPAIRS,
	...EXTENDED_REPAIRS.map((fix) => ({ ...fix, formats: ['sfnt', 'woff', 'woff2', 'collection'] }))];
const metadataIDs = new Set(METADATA_REPAIRS.map((fix) => fix.id));
const extendedIDs = new Set(EXTENDED_REPAIRS.map((fix) => fix.id));
validateRepairCatalog(CATALOG);

function freeze(value) {
	if (value && typeof value === 'object') {
		for (const child of Object.values(value)) freeze(child);
		Object.freeze(value);
	}
	return value;
}
freeze(CATALOG);

export function repairCatalog() {
	return CATALOG;
}

function inputBytes(input, options = {}) {
	const limit = options.maxInputBytes ?? 256 * 1024 * 1024;
	if (!Number.isSafeInteger(limit) || limit < 1)
		throw new RangeError('maxInputBytes must be a positive safe integer.');
	if (!(input instanceof ArrayBuffer) && !(input instanceof Uint8Array))
		throw new TypeError(
			'Font quality inspection expects an ArrayBuffer or Uint8Array.',
		);
	if (input.byteLength > limit)
		throw new RangeError('Font input exceeds maxInputBytes.');
	return input instanceof ArrayBuffer ? new Uint8Array(input) : input;
}

function formatOf(bytes) {
	if (bytes.length >= 4) {
		const signature = new DataView(
			bytes.buffer,
			bytes.byteOffset,
			bytes.byteLength,
		).getUint32(0);
		if ([0x00010000, 0x4f54544f, 0x74727565].includes(signature)) return 'sfnt';
		if (signature === 0x74746366) return 'collection';
		if (signature === 0x774f4646) return 'woff';
		if (signature === 0x774f4632) return 'woff2';
		if (
			(bytes[0] === 1 || bytes[0] === 2) &&
			bytes[1] === 0 &&
			bytes[2] >= 4 &&
			(bytes[0] === 2 || (bytes[3] >= 1 && bytes[3] <= 4))
		)
			return 'cff';
	}
	if (
		(bytes[0] === 0x25 && bytes[1] === 0x21) ||
		(bytes[0] === 0x80 && [1, 2].includes(bytes[1]))
	)
		return 'type1';
	return 'unknown';
}

function directory(bytes, options = {}) {
	if (formatOf(bytes) !== 'sfnt')
		return { reason: 'Repair currently supports standalone SFNT only.' };
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (bytes.length < 12) return { reason: 'The SFNT header is incomplete.' };
	const count = view.getUint16(4);
	if (
		!count ||
		count > (options.maxTables ?? 4096) ||
		12 + count * 16 > bytes.length
	)
		return {
			reason:
				'The table directory is empty, truncated, or exceeds the table limit.',
		};
	const entries = [];
	const tags = new Set();
	for (let i = 0; i < count; i++) {
		const record = 12 + i * 16;
		const tag = String.fromCharCode(...bytes.subarray(record, record + 4));
		const offset = view.getUint32(record + 8);
		const length = view.getUint32(record + 12);
		if (
			!/^[\x20-\x7e]{4}$/.test(tag) ||
			tags.has(tag) ||
			offset < 12 + count * 16 ||
			offset + length > bytes.length ||
			length > (options.maxTableBytes ?? 256 * 1024 * 1024)
		)
			return {
				reason:
					'Repair requires unique tags and complete, unambiguous table extents outside the directory.',
			};
		tags.add(tag);
		entries.push({ tag, offset, length, record });
	}
	const sorted = entries
		.filter((entry) => entry.length)
		.sort((a, b) => a.offset - b.offset);
	for (let i = 1; i < sorted.length; i++)
		if (sorted[i].offset < sorted[i - 1].offset + sorted[i - 1].length)
			return {
				reason:
					'Overlapping table contents require source recovery, not an automatic rewrite.',
			};
	const head = entries.find((entry) => entry.tag === 'head');
	if (!head || head.length < 54 || view.getUint32(head.offset) !== 0x00010000)
		return {
			reason:
				'A complete supported version-1 head table is required for verified repair.',
		};
	return { entries, reason: null };
}

function tableBytes(bytes, entry) {
	return bytes.subarray(entry.offset, entry.offset + entry.length);
}

function requiresRebuild(id) {
	return CATALOG.find((fix) => fix.id === id)?.requiresRebuild || [
		'name.family',
		'name.style',
		'dsig.remove',
		'sfnt.alignment',
	].includes(id);
}

function nonzeroGaps(bytes, entries) {
	let end = 12 + entries.length * 16;
	for (const entry of [...entries].sort((a, b) => a.offset - b.offset)) {
		if (bytes.subarray(end, entry.offset).some((byte) => byte !== 0))
			return true;
		end = Math.max(end, entry.offset + entry.length);
	}
	return bytes.subarray(end).some((byte) => byte !== 0);
}

function cmapRecords(bytes) {
	if (bytes.length < 4) throw new Error('The cmap header is incomplete.');
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const count = view.getUint16(2);
	if (!count || 4 + count * 8 > bytes.length)
		throw new Error('The cmap encoding records are incomplete.');
	const records = [];
	const keys = new Set();
	for (let i = 0; i < count; i++) {
		const offset = 4 + i * 8;
		const key = view.getUint32(offset);
		const target = view.getUint32(offset + 4);
		if (keys.has(key) || target < 4 + count * 8 || target + 2 > bytes.length)
			throw new Error(
				'Duplicate encodings or invalid cmap offsets require an authoritative source choice.',
			);
		keys.add(key);
		records.push({ key, offset });
	}
	return records;
}

function offerReason(fix, bytes, layout, diagnostics, options = {}) {
	if (layout.reason) return layout.reason;
	if (diagnosisIncomplete(diagnostics))
		return 'Inspection was blocked by a limit, failed check, or unreadable table. Resolve that problem before verifying repairs.';
	const entries = layout.entries;
	const table = (tag) => entries.find((entry) => entry.tag === tag);
	if (fix.id !== 'dsig.remove' && table('DSIG'))
		return 'Select explicit DSIG removal with consent before changing this signed font.';
	if (
		requiresRebuild(fix.id) &&
		entries.some((entry) => !ALL_SUPPORTED_TABLES.has(entry.tag))
	)
		return 'Relocating unrecognized tables may invalidate opaque dependencies; this rewrite is blocked.';
	if (
		requiresRebuild(fix.id) &&
		nonzeroGaps(bytes, layout.originalEntries ?? entries)
	)
		return 'Nonzero bytes outside known table extents cannot be silently discarded during a rebuild.';
	const required = fix.id.startsWith('name.')
		? ['name', 6]
		: fix.id.startsWith('os2.')
			? ['OS/2', fix.id === 'os2.typo-linegap' ? 74 : 10]
			: fix.id.startsWith('cmap.')
				? ['cmap', 4]
				: null;
	if (
		required &&
		(!table(required[0]) || table(required[0]).length < required[1])
	)
		return `The ${required[0]} table is missing or incomplete; recover authoritative source data.`;
	if (fix.id.startsWith('name.')) {
		try {
			const name = nameLayout(tableBytes(bytes, table('name')));
			if (
				fix.id !== 'name.order' &&
				(table('name').length > 65523 || name.count === 65535)
			)
				return 'The name table exceeds the supported append limits.';
		} catch (error) {
			return `Name repair blocked: ${error.message}`;
		}
	}
	if (fix.id === 'cmap.order') {
		try {
			cmapRecords(tableBytes(bytes, table('cmap')));
		} catch (error) {
			return `Cmap ordering repair blocked: ${error.message}`;
		}
	}
	if (
		fix.id === 'cmap.version' &&
		diagnostics.issues.some(
			(issue) =>
				issue.code === 'TABLE_PARSE_FAILED' ||
				(issue.code.startsWith('CMAP_') &&
					issue.code !== 'CMAP_VERSION_INVALID'),
		)
	)
		return 'Other cmap or parsing failures must be resolved before declaring the existing cmap structure supported.';
	if (metadataIDs.has(fix.id)) return metadataRepairReason(fix.id, payloadMap(bytes, layout), options);
	if (extendedIDs.has(fix.id)) return extendedRepairReason(fix.id, payloadMap(bytes, layout), options);
	return null;
}

function payloadMap(bytes, layout) {
	return new Map(layout.entries.map((entry) => [entry.tag, tableBytes(bytes, entry).slice()]));
}

function repairSource(bytes, format, options) {
	try {
		const source = prepareRepairContainer(bytes, format, options);
		const layout = directory(source.sfnt, options);
		if (!layout.reason && source.rewrite &&
			layout.entries.some((entry) => !ALL_SUPPORTED_TABLES.has(entry.tag)))
			layout.reason = 'Rewrapping or moving an opaque table is not an approved preservation operation.';
		return { ...source, layout };
	} catch (error) {
		return { format, sfnt: bytes, layout: { reason: error.message } };
	}
}

export function inspectFont(input, options = {}) {
	const profile = resolveProfile(options);
	const bytes = inputBytes(input, options);
	const format = formatOf(bytes);
	const unsupported = format === 'cff' || format === 'type1';
	if (unsupported || (format === 'unknown' &&
		new TextDecoder().decode(bytes.subarray(0, 16)).startsWith('StartFontMetrics'))) {
		const legacy = inspectLegacy(bytes, options);
		return {
			...legacy, scope: 'binary', format, legacyFormat: legacy.format,
			diagnostics: legacy.diagnostics.valid === null ? null : legacy.diagnostics,
		};
	}
	const binary = unsupported
		? null
		: applyProfileCompatibility(diagnoseFont(bytes.slice().buffer, options), profile);
	const profileReport = evaluateProfile(binary, options);
	const diagnostics = addProfileFindings(binary, profileReport);
	const source = repairSource(bytes, format, options), layout = source.layout;
	const codes = new Set(diagnostics?.issues.map((issue) => issue.code));
	const repairs = CATALOG.filter(
		(fix) =>
			fix.codes.some((code) => codes.has(code)) ||
			fix.optional ||
			(fix.id === 'dsig.remove' &&
				layout.entries?.some((entry) => entry.tag === 'DSIG')),
	).map((fix) => {
		const supported = fix.formats.includes(format) || (metadataIDs.has(fix.id) && ['woff', 'woff2', 'collection'].includes(format));
		const reason = supported ? offerReason(fix, source.sfnt, layout, diagnostics, options) : `This operation is not supported in ${format}.`;
		return {
			...fix,
			availability: reason
				? supported
					? 'blocked'
					: 'unsupported'
				: fix.inputs.length
					? 'needs-input'
					: 'available',
			reason:
				reason ||
				(fix.risk === 'potentially-lossy'
					? 'Explicit consent is required.'
					: ''),
		};
	});
	return {
		schemaVersion: 1,
		scope: 'binary',
		profile: profile.id,
		profileVersion: profile.version,
		profileReport,
		complete: false,
		format,
		diagnostics,
		repairs,
		checks: diagnostics?.checks ?? profileReport.checks,
		coverage: [
			{
				domain: 'binary-structure',
				status: unsupported ? 'unsupported' : 'partial',
				reason: unsupported
					? 'Original standalone CFF/Type 1 diagnosis is not implemented.'
					: 'Existing binary structural diagnostics ran; not every table or program is certified.',
			},
			{
				domain: 'repair',
				status: layout.reason ? 'blocked' : 'partial',
				reason:
					layout.reason ||
					'Only the listed, applicable registered repairs are supported.',
			},
			{
				domain: 'shaping-and-rendering',
				status: 'unsupported',
				reason:
					'No independent shaping, rasterizer, or exhaustive variation evaluation ran.',
			},
		],
		limitations: [
			'Passing these checks does not certify every font behavior or consumer.',
			'Unknown table payloads may be retained without semantic validation.',
			'Container repair preserves its format and auxiliary data; collection repair requires an explicit face and preserves every other original byte.',
			'Unknown dependencies, unsupported legacy repair, and collection-level signatures remain explicit blockers.',
		],
	};
}

async function fingerprint(bytes) {
	let subtle = globalThis.crypto?.subtle;
	if (!subtle && typeof process !== 'undefined' && process.versions?.node)
		subtle = (await import('node:crypto')).webcrypto.subtle;
	if (!subtle)
		throw new Error(
			'Font repair requires Web Crypto (a secure browser context or a supported Node runtime).',
		);
	const hash = await subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(hash), (byte) =>
		byte.toString(16).padStart(2, '0'),
	).join('');
}

export async function planRepairs(input, requests, options = {}) {
	const controls = { signal: options.signal, onProgress: options.onProgress };
	checkCancellation(controls.signal);
	const { signal: _signal, onProgress: _onProgress, ...persistentOptions } = options;
	canonicalJSON(persistentOptions);
	options = structuredClone(persistentOptions);
	if (options.projectRevision !== undefined &&
		!(typeof options.projectRevision === 'string' || (Number.isSafeInteger(options.projectRevision) && options.projectRevision >= 0)))
		throw new TypeError('projectRevision must be a string or nonnegative safe integer.');
	requests = structuredClone(requests);
	const bytes = inputBytes(input, options).slice();
	await qualityPhase(controls, 'inspection');
	const report = inspectFont(bytes, options);
	if (options.format !== undefined && options.format !== report.format)
		throw new Error('Repairs preserve the input format; use separate conversion preflight for a different target.');
	if (!Array.isArray(requests) || !requests.length)
		throw new Error('Select at least one applicable repair.');
	requests.sort((a, b) => String(a?.id).localeCompare(String(b?.id), 'en'));
	const selected = new Set();
	for (const request of requests) {
		if (!request || typeof request.id !== 'string' || selected.has(request.id))
			throw new Error('Repair requests must have unique registered IDs.');
		selected.add(request.id);
	}
	const signatureRemoval = requests.some(
		(request) => request.id === 'dsig.remove' && request.consent === true,
	);
	const source = repairSource(bytes, report.format, options), layout = source.layout;
	const wrapperOnly = requests.every((request) => request.id.startsWith('container.'));
	const effectiveLayout = signatureRemoval && layout.entries
		? { ...layout, originalEntries: layout.entries, entries: layout.entries.filter((entry) => entry.tag !== 'DSIG') }
		: layout;
	const steps = requests.map((request) => {
		const offer = report.repairs.find((fix) => fix.id === request.id);
		if (!offer)
			throw new Error(`Repair ${request.id} is not applicable to this input.`);
		const reason = offerReason(
			offer,
			source.sfnt,
			effectiveLayout,
			report.diagnostics,
			options,
		);
		if (reason) throw new Error(`${offer.title}: ${reason}`);
		if (offer.risk === 'potentially-lossy' && request.consent !== true)
			throw new Error(`${offer.title} requires explicit consent.`);
		const values = structuredClone(request.inputs ?? {});
		validateRepairInputs(offer, values);
		if (metadataIDs.has(offer.id)) applyMetadataRepair({ id: offer.id, values }, payloadMap(source.sfnt, effectiveLayout), options);
		if (extendedIDs.has(offer.id)) applyExtendedRepair({ id: offer.id, values }, payloadMap(source.sfnt, effectiveLayout), options);
		return {
			...offer,
			availability: 'available',
			reason: '',
			implicit: false,
			values,
		};
	});
	for (let index = 0; index < steps.length; index++) {
		const step = steps[index];
		for (const id of step.companions ?? [])
			if (!selected.has(id)) {
				const companion = CATALOG.find((fix) => fix.id === id);
				if (companion.risk !== 'safe' || companion.inputs.length)
					throw new Error(`Companion ${id} requires a separate explicit decision.`);
				const reason = offerReason(companion, source.sfnt, effectiveLayout, report.diagnostics, options);
				if (reason) throw new Error(`Companion ${id}: ${reason}`);
				steps.push({ ...companion, availability: 'available', reason: '', implicit: true, values: {} });
				selected.add(id);
			}
	}
	if (!wrapperOnly && !selected.has('sfnt.checksums'))
		steps.push({
			...CATALOG[0],
			availability: 'available',
			reason: '',
			implicit: true,
			values: {},
		});
	const checksum = steps.find((step) => step.id === 'sfnt.checksums');
	if (checksum) checksum.after = steps.filter((step) => step !== checksum).map((step) => step.id);
	await qualityPhase(controls, 'planning');
	const plan = freeze({
		schemaVersion: 1,
		inputFingerprint: await fingerprint(bytes),
		profile: report.profile,
		profileVersion: report.profileVersion,
		format: report.format,
		faceIndex: options.faceIndex ?? null,
		projectRevision: options.projectRevision ?? null,
		registryRevision: 2,
		requests,
		options,
		effects: source.rewrite && !wrapperOnly
			? [report.format === 'collection'
				? 'Copy-on-write face append: original shared payloads and unselected faces stay byte-identical; the collection grows.'
				: 'Re-encode the original wrapper; preserve decompressed table payloads, metadata, private data and version fields. Compression and storage offsets may change.']
			: [],
		steps: orderRepairs(steps),
	});
	plans.set(plan, {
		bytes,
		options: structuredClone(options),
		report: freeze(report), source, wrapperOnly,
	});
	checkCancellation(controls.signal);
	assertCurrentInput(input, bytes, options);
	return plan;
}

export async function resumeRepairPlan(input, serialized, options = {}) {
	if (!serialized || serialized.schemaVersion !== 1 || serialized.registryRevision !== 2 ||
		!Array.isArray(serialized.requests) || !serialized.options)
		throw new Error('Unsupported serialized repair plan; inspect and plan again.');
	const fresh = await planRepairs(input, serialized.requests, { ...serialized.options, ...options });
	if (canonicalJSON(fresh) !== canonicalJSON(serialized))
		throw new Error('The saved plan is stale or changed: source, profile, face, target, decisions or registry differ.');
	return fresh;
}

function appendName(bytes, id, values) {
	const layout = nameLayout(bytes);
	const nameID = id === 'name.family' ? 1 : 2;
	const key = [3, 1, values.languageID, nameID];
	if (
		layout.records.some((record) =>
			record.key.every((value, i) => value === key[i]),
		)
	)
		throw new Error(
			'The selected language already has this Windows name record; replacing it requires a different repair.',
		);
	const encoded = new Uint8Array(encodeUtf16BE(values.value));
	if (bytes.length + 12 + encoded.length > 65535)
		throw new Error(
			'Appending this name exceeds the supported 16-bit name storage limit.',
		);
	const result = new Uint8Array(bytes.length + 12 + encoded.length);
	result.set(bytes.subarray(0, 6), 0);
	const view = new DataView(result.buffer);
	view.setUint16(2, layout.count + 1);
	view.setUint16(4, layout.storage + 12);
	const newRecord = new Uint8Array(12),
		recordView = new DataView(newRecord.buffer);
	key.forEach((value, i) => recordView.setUint16(i * 2, value));
	recordView.setUint16(8, encoded.length);
	recordView.setUint16(10, bytes.length - layout.storage);
	const records = layout.records.map((record) => ({
		key: record.key,
		data: bytes.slice(record.offset, record.offset + 12),
	}));
	records.push({ key, data: newRecord });
	records.sort((a, b) => {
		for (let i = 0; i < 4; i++)
			if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i];
		return 0;
	});
	records.forEach((record, i) => result.set(record.data, 6 + i * 12));
	result.set(
		bytes.subarray(6 + layout.count * 12),
		6 + (layout.count + 1) * 12,
	);
	result.set(encoded, bytes.length + 12);
	return result;
}

function updateChecksums(bytes) {
	const { entries, reason } = directory(bytes);
	if (reason) throw new Error(reason);
	const view = new DataView(bytes.buffer);
	const head = entries.find((entry) => entry.tag === 'head');
	view.setUint32(head.offset + 8, 0);
	for (const entry of entries)
		view.setUint32(
			entry.record + 4,
			computeTableChecksum(tableBytes(bytes, entry)),
		);
	view.setUint32(
		head.offset + 8,
		(0xb1b0afba - computeTableChecksum(bytes)) >>> 0,
	);
}

function execute(bytes, steps, options) {
	let candidate = bytes.slice();
	const { entries } = directory(candidate, options);
	const payloads = new Map(
		entries.map((entry) => [entry.tag, tableBytes(candidate, entry).slice()]),
	);
	const ids = new Set(steps.map((step) => step.id));
	const rebuild = steps.some((step) => requiresRebuild(step.id));
	for (const step of steps) {
		if (metadataIDs.has(step.id)) applyMetadataRepair(step, payloads, options);
		if (extendedIDs.has(step.id)) applyExtendedRepair(step, payloads, options);
		if (['name.family', 'name.style'].includes(step.id))
			payloads.set(
				'name',
				appendName(payloads.get('name'), step.id, step.values),
			);
		if (step.id === 'name.order') {
			const name = payloads.get('name'),
				layout = nameLayout(name);
			const records = [...layout.records]
				.sort((a, b) => {
					for (let i = 0; i < 4; i++)
						if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i];
					return 0;
				})
				.map((record) => name.slice(record.offset, record.offset + 12));
			records.forEach((record, i) => name.set(record, 6 + i * 12));
		}
		if (step.id === 'cmap.order') {
			const cmap = payloads.get('cmap');
			const records = cmapRecords(cmap)
				.sort((a, b) => a.key - b.key)
				.map((record) => cmap.slice(record.offset, record.offset + 8));
			records.forEach((record, i) => cmap.set(record, 4 + i * 8));
		}
		if (step.id === 'dsig.remove') payloads.delete('DSIG');
		const field = {
			'head.magic': ['head', 12, 4, 0x5f0f3cf5],
			'head.glyph-data-format': ['head', 52, 2, 0],
			'cmap.version': ['cmap', 0, 2, 0],
			'os2.weight': ['OS/2', 4, 2, step.values.value],
			'os2.width': ['OS/2', 6, 2, step.values.value],
			'os2.typo-linegap': ['OS/2', 72, 2, step.values.value],
		}[step.id];
		if (field) {
			const view = new DataView(payloads.get(field[0]).buffer);
			if (field[2] === 4) view.setUint32(field[1], field[3]);
			else view.setUint16(field[1], field[3]);
		}
	}
	if (rebuild) {
		candidate = new Uint8Array(
			exportFont(
				{
					header: { sfVersion: extendedSfntVersion(steps.filter((step) => extendedIDs.has(step.id))) ??
						new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0) },
					tables: Object.fromEntries(
						[...payloads].map(([tag, data]) => [tag, { _raw: data }]),
					),
				},
				{ format: 'sfnt' },
			),
		);
	} else {
		for (const entry of entries)
			candidate.set(payloads.get(entry.tag), entry.offset);
		const view = new DataView(candidate.buffer);
		if (ids.has('sfnt.search-fields')) {
			const power = Math.floor(Math.log2(entries.length));
			view.setUint16(6, 16 * 2 ** power);
			view.setUint16(8, power);
			view.setUint16(10, entries.length * 16 - 16 * 2 ** power);
		}
		if (ids.has('sfnt.directory-order')) {
			const records = [...entries]
				.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0))
				.map((entry) => candidate.slice(entry.record, entry.record + 16));
			records.forEach((record, i) => candidate.set(record, 12 + i * 16));
		}
	}
	updateChecksums(candidate);
	return candidate;
}

function sameBytes(a, b) {
	return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

function assertCurrentInput(input, snapshot, options) {
	if (!sameBytes(inputBytes(input, options), snapshot))
		throw new Error('The repair input is stale: the source changed during this operation. Inspect and plan again.');
}

function selectedFields(steps) {
	const fields = [];
	for (const step of steps) {
		const field = {
			'head.magic': ['head', 12, 4, 0x5f0f3cf5],
			'head.glyph-data-format': ['head', 52, 2, 0],
			'cmap.version': ['cmap', 0, 2, 0],
			'os2.weight': ['OS/2', 4, 2, step.values.value],
			'os2.width': ['OS/2', 6, 2, step.values.value],
			'os2.typo-linegap': ['OS/2', 72, 2, step.values.value],
		}[step.id];
		if (field) fields.push(field);
	}
	return fields;
}

function preservationFailures(before, after, steps, options) {
	const left = directory(before, options),
		right = directory(after, options);
	if (left.reason || right.reason) return { failures: [left.reason || right.reason], removedTables: [] };
	const ids = new Set(steps.map((step) => step.id));
	const failures = [];
	const extendedSteps = steps.filter((step) => extendedIDs.has(step.id));
	const expectedVersion = extendedSfntVersion(extendedSteps) ?? new DataView(before.buffer, before.byteOffset).getUint32(0);
	if (new DataView(after.buffer, after.byteOffset).getUint32(0) !== expectedVersion)
		failures.push('The SFNT outline flavor differs from the approved plan.');
	const approvedFields = selectedFields(steps);
	for (const [tag, offset, length, value] of approvedFields) {
		const entry = right.entries.find((item) => item.tag === tag);
		const actual = entry && new DataView(after.buffer, after.byteOffset + entry.offset, entry.length);
		if (!actual || (length === 4 ? actual.getUint32(offset) : actual.getUint16(offset)) !== value)
			failures.push(`The selected ${tag} value at ${offset} was not applied.`);
	}
	const metadata = verifyMetadataRepairs(payloadMap(before, left), payloadMap(after, right), steps, options, approvedFields);
	failures.push(...metadata.failures);
	const extended = verifyExtendedRepairs(payloadMap(before, left), payloadMap(after, right), steps.filter((step) => extendedIDs.has(step.id)), options);
	failures.push(...extended.failures);
	const handled = new Set([...metadata.handledTags, ...extended.handledTags]);
	const tableChanges = extendedTableChanges(extendedSteps, payloadMap(before, left));
	const removals = new Set(tableChanges.removed);
	if (ids.has('dsig.remove')) removals.add('DSIG');
	const expectedTags = left.entries
		.map((entry) => entry.tag)
		.filter((tag) => !removals.has(tag))
		.concat(tableChanges.added)
		.sort();
	if (
		JSON.stringify(expectedTags) !==
		JSON.stringify(right.entries.map((entry) => entry.tag).sort())
	)
		failures.push('The retained table set differs from the approved plan.');
	for (const entry of left.entries) {
		if (handled.has(entry.tag)) continue;
		if (removals.has(entry.tag)) continue;
		const other = right.entries.find((item) => item.tag === entry.tag);
		if (!other) continue;
		const a = tableBytes(before, entry).slice(),
			b = tableBytes(after, other).slice();
		if (
			entry.tag === 'name' &&
			steps.some((step) => step.id.startsWith('name.'))
		) {
			const oldNames = nameLayout(a),
				newNames = nameLayout(b);
			const expected = oldNames.records.map(({ key, bytes }) =>
				JSON.stringify([key, bytes]),
			);
			const additions = steps.filter((step) =>
				['name.family', 'name.style'].includes(step.id),
			);
			for (const step of additions)
				expected.push(
					JSON.stringify([
						[3, 1, step.values.languageID, step.id === 'name.family' ? 1 : 2],
						encodeUtf16BE(step.values.value),
					]),
				);
			const actual = newNames.records.map(({ key, bytes }) =>
				JSON.stringify([key, bytes]),
			);
			const originalTail = a.subarray(6 + oldNames.count * 12);
			const retainedTail = b.subarray(
				6 + newNames.count * 12,
				6 + newNames.count * 12 + originalTail.length,
			);
			if (
				JSON.stringify(expected.sort()) !== JSON.stringify(actual.sort()) ||
				oldNames.version !== newNames.version ||
				JSON.stringify(oldNames.languages) !==
					JSON.stringify(newNames.languages) ||
				newNames.storage !== oldNames.storage + 12 * additions.length ||
				!sameBytes(originalTail, retainedTail)
			)
				failures.push('Unapproved name or language-tag changes.');
			continue;
		}
		if (entry.tag === 'cmap' && ids.has('cmap.order')) {
			const leftRecords = cmapRecords(a),
				rightRecords = cmapRecords(b);
			const records = (data, items) =>
				items
					.map((record) =>
						Array.from(data.subarray(record.offset, record.offset + 8)).join(
							',',
						),
					)
					.sort();
			if (
				JSON.stringify(records(a, leftRecords)) !==
				JSON.stringify(records(b, rightRecords))
			)
				failures.push('Unapproved cmap encoding-record changes.');
			a.fill(0, 4, 4 + leftRecords.length * 8);
			b.fill(0, 4, 4 + rightRecords.length * 8);
		}
		const ranges = entry.tag === 'head' ? [[8, 12]] : [];
		if (entry.tag === 'head' && ids.has('head.magic')) ranges.push([12, 16]);
		if (entry.tag === 'head' && ids.has('head.glyph-data-format'))
			ranges.push([52, 54]);
		if (entry.tag === 'cmap' && ids.has('cmap.version')) ranges.push([0, 2]);
		if (entry.tag === 'OS/2') {
			if (ids.has('os2.weight')) ranges.push([4, 6]);
			if (ids.has('os2.width')) ranges.push([6, 8]);
			if (ids.has('os2.typo-linegap')) ranges.push([72, 74]);
		}
		for (const [start, end] of ranges) {
			a.fill(0, start, end);
			b.fill(0, start, end);
		}
		if (!sameBytes(a, b))
			failures.push(`Unapproved payload changes in ${entry.tag}.`);
	}
	return { failures, removedTables: [...removals] };
}

function semanticLocation(location = {}) {
	const { byteOffset: _byteOffset, offset: _offset, ...identity } = location;
	return identity;
}

function findings(report) {
	const counts = new Map();
	for (const issue of report.diagnostics?.issues ?? []) {
		if (issue.severity === 'info') continue;
		const key = JSON.stringify([
			issue.severity,
			issue.code,
			issue.faceIndex,
			issue.message,
			canonicalJSON(semanticLocation(issue.location)),
		]);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return counts;
}

function lostCheckCoverage(before, after, removedTables) {
	const key = (check) => canonicalJSON([check.id, semanticLocation(check.location)]);
	const checks = new Map((after.checks ?? []).map((check) => [key(check), check]));
	const original = new Map((before.checks ?? []).map((check) => [key(check), check]));
	const failures = (before.checks ?? []).filter((check) =>
		['passed', 'failed'].includes(check.outcome) && check.coverage !== 'not-checked' &&
		!removedTables.includes(check.location?.table)).flatMap((check) => {
		const current = checks.get(key(check));
		if ((current?.coverage === 'complete' && ['passed', 'failed'].includes(current.outcome)) ||
			(current?.outcome === 'skipped' && current.reasonCode === 'not-applicable')) return [];
		if (check.coverage === 'partial' && current?.coverage === 'partial' &&
			['passed', 'failed'].includes(current.outcome)) return [];
		return [`Required check ${check.id} lost its executed coverage after repair.`];
	});
	for (const check of after.checks ?? []) {
		if (!['blocked', 'unsupported', 'skipped'].includes(check.outcome) || check.reasonCode === 'not-applicable') continue;
		const previous = original.get(key(check));
		if (!previous || previous.outcome !== check.outcome || previous.reasonCode !== check.reasonCode)
			failures.push(`New unapproved check coverage: ${check.id} (${check.reasonCode}).`);
	}
	return failures;
}

export async function applyRepairs(input, plan, controls = {}) {
	const state = plans.get(plan);
	if (!state)
		throw new Error(
			'Use an unmodified plan returned by FontFlux.planRepairs; deserialized or forged plans cannot execute.',
		);
	const bytes = inputBytes(input, state.options).slice();
	checkCancellation(controls.signal);
	if (!sameBytes(bytes, state.bytes))
		throw new Error(
			'The repair plan is stale: the input changed. Inspect and plan again.',
		);
	for (const key of ['format', 'faceIndex', 'projectRevision', 'profile', 'profileVersion'])
		if (controls[key] !== undefined && controls[key] !== plan[key])
			throw new Error(`The repair plan is stale: ${key} changed.`);
	await qualityPhase(controls, 'application');
	const sfntCandidate = state.wrapperOnly ? state.source.sfnt : execute(state.source.sfnt, plan.steps, state.options);
	const candidate = emitRepairContainer(bytes, state.source, sfntCandidate, plan.steps, state.options);
	await qualityPhase(controls, 'verification');
	const after = inspectFont(candidate, state.options);
	const emitted = prepareRepairContainer(candidate, plan.format, state.options);
	const preservation = state.wrapperOnly ? { failures: [], removedTables: [] } : preservationFailures(
		state.source.sfnt,
		emitted.sfnt,
		plan.steps,
		state.options,
	);
	const failures = preservation.failures;
	failures.push(...verifyRepairContainer(bytes, candidate, state.source, plan.steps, state.options));
	if (diagnosisIncomplete(after.diagnostics))
		failures.push('Candidate inspection was interrupted or incomplete; selected repair verification cannot pass.');
	failures.push(...lostCheckCoverage(state.report, after, preservation.removedTables));
	const targetCodes = new Set(plan.steps.filter((step) => !step.optional).flatMap((step) => step.codes));
	for (const issue of after.diagnostics?.issues ?? [])
		if (targetCodes.has(issue.code))
			failures.push(`The targeted finding ${issue.code} remains after repair.`);
	const beforeCounts = findings(state.report);
	for (const [key, count] of findings(after))
		if (count > (beforeCounts.get(key) ?? 0))
			failures.push(`New unapproved finding: ${JSON.parse(key)[3]}`);
	if (
		plan.steps.some((step) => step.id === 'dsig.remove') &&
		directory(emitted.sfnt, state.options).entries?.some(
			(entry) => entry.tag === 'DSIG',
		)
	)
		failures.push('The selected digital signature removal did not occur.');
	const passed = failures.length === 0;
	const outputFingerprint = passed ? await fingerprint(candidate) : null;
	checkCancellation(controls.signal);
	assertCurrentInput(input, state.bytes, state.options);
	return {
		state: passed ? 'verified' : 'failed',
		buffer: passed ? candidate.buffer : null,
		changed: passed && !sameBytes(bytes, candidate),
		format: plan.format, faceIndex: plan.faceIndex, profile: plan.profile,
		plan: structuredClone(plan),
		before: structuredClone(state.report),
		after,
		changes: plan.steps
			.map((step) => ({
				id: step.id,
				description: `${step.implicit ? 'Companion operation: ' : ''}${step.description}`,
			}))
			.concat(plan.effects.map((description) => ({ id: 'container.preservation', description })))
			.concat(
				plan.steps.some((step) => requiresRebuild(step.id))
					? [
							{
								id: 'sfnt.rebuild-directory',
								description:
									'Rebuilt table offsets, lengths, alignment, directory order, and search fields; retained payloads were independently compared.',
							},
						]
					: [],
			),
		verification: {
			passed,
			failures,
			evidence: [
				'Actual emitted bytes were diagnosed again; targeted findings must disappear and no new warnings/errors may appear.',
				'All retained table payload bytes were compared, excluding only explicitly approved fields and checksum adjustment.',
				'Name additions preserve the original encoded records and language-tag strings.',
				'This verifies the selected repair, not all rendering or shaping behavior. Existing unrelated findings may remain.',
			],
		},
		inputFingerprint: plan.inputFingerprint,
		outputFingerprint,
	};
}

export function scopedValidation(report, source) {
	const issues = report.issues.map((issue, index) => ({
		...issue, id: `${source}:${issue.code}:${issue.path ?? '$'}:${index}`,
		checkId: getCheckDescriptor(issue.code)?.checkId ?? 'validation.unclassified',
		executionId: `validation.${source}`,
		source, location: { path: issue.path ?? '$' },
		outcome: issue.severity === 'info' ? 'informational' : 'failed',
		message: source === 'resolved-candidate' && issue.severity === 'info'
			? `Detached validation copy only: ${issue.message}` : issue.message,
		evidence: { message: issue.message },
	}));
	return {
		...buildReport(issues), schemaVersion: 1, source,
		checks: [{
			id: `validation.${source}`, revision: 1, source, location: {},
			outcome: issues.some((issue) => issue.severity !== 'info') ? 'failed' : 'passed',
			coverage: 'partial', reasonCode: 'implemented-subset',
			reason: 'Implemented JSON shape/range/table-dependency checks only; emitted bytes are a separate inspection.',
			findingIds: issues.filter((issue) => issue.severity !== 'info').map((issue) => issue.id),
		}],
		complete: false,
	};
}

function normalizationEvidence(original, output) {
	if (!original?.diagnostics || !output?.diagnostics) return [];
	const identity = (issue) => JSON.stringify([issue.code, issue.location?.table ?? null]);
	const after = new Set(output.diagnostics.issues.filter((issue) =>
		issue.severity !== 'info').map(identity));
	const completed = new Set(output.checks.filter((check) =>
		check.coverage === 'complete').map((check) => check.id));
	return original.diagnostics.issues.filter((issue) => issue.severity !== 'info' &&
		!after.has(identity(issue)) && completed.has(issue.executionId),
	).map((issue) => ({
		kind: 'finding-not-observed-in-output',
		code: issue.code, originalFindingId: issue.id,
		executionId: issue.executionId,
		description: 'The comparable output check ran and no longer reports this original finding. Import/resolution/serialization or project edits may account for it; no explicit repair was applied by preflight.',
	}));
}

export async function preflightFont(data, options = {}, source = null) {
	resolveProfile(options);
	const effects = [
		'Export may normalize directories, counts, bounds, and other derived data; this is not a semantic-preservation certificate.',
		'Output diagnostics do not execute an independent shaper or rasterizer.',
	];
	if (options.format === 'ttf' || options.format === 'otf')
		effects.push(
			'If outline technology changes, conversion can refit curves or remove technology-specific hints. This is not a lossless-repair guarantee.',
		);
	const result = {
		state: 'failed',
		buffer: null,
		schemaVersion: 1,
		validation: null,
		output: null,
		stages: [
			{ id: 'original', status: 'skipped', reasonCode: 'no-original-bytes',
				reason: 'This authored/restored project has no retained original binary.', report: null },
			{ id: 'project', status: 'blocked', reasonCode: 'not-reached', report: null },
			{ id: 'resolved', status: 'blocked', reasonCode: 'not-reached', report: null },
			{ id: 'output', status: 'blocked', reasonCode: 'not-reached', report: null },
		],
		normalizations: [],
		effects,
		error: null,
	};
	if (source) {
		const original = inspectFont(source.bytes, {
			...source.options, ...options, faceIndex: source.options.faceIndex,
			profile: 'structural', profileVersion: 1, context: undefined,
		});
		result.stages[0] = {
			id: 'original', status: original.diagnostics ? 'checked' : 'unsupported',
			reasonCode: 'retained-original', report: original,
			reason: 'Retained original bytes are inspected independently of the current project.',
		};
	}
	const project = scopedValidation(validateSimplifiedJSON(data), 'editable-project');
	result.validation = project;
	result.stages[1] = {
		id: 'project', status: project.valid ? 'checked' : 'failed',
		reasonCode: 'observational-validation', report: project,
	};
	if (!project.valid)
		return { ...result, error: 'Editable-data validation failed.' };
	if (data.tables?.DSIG)
		return {
			...result,
			error:
				'Export would invalidate an existing DSIG. Explicit signature removal or external re-signing is required.',
		};
	try {
		const candidate = structuredClone(data);
		const format = typeof options.format === 'string' ? options.format.toLowerCase() : options.format;
		const target = format === 'ttf' ? convertOutlines(candidate, 'truetype')
			: format === 'otf' ? convertOutlines(candidate, 'cff') : candidate;
		const resolved = resolveExportSource(target);
		const resolvedReport = scopedValidation(
			validateJSON(structuredClone(resolved)), 'resolved-candidate',
		);
		result.validation = buildReport([...project.issues, ...resolvedReport.issues]);
		result.stages[2] = {
			id: 'resolved', status: resolvedReport.valid ? 'checked' : 'failed',
			reasonCode: 'detached-target-resolution', report: resolvedReport,
			reason: 'Legacy validation normalizations affect a separate validation copy, not the project or emitted bytes.',
		};
		result.normalizations.push(...resolvedReport.infos.map((issue) => ({
			kind: 'validation-copy-only', code: issue.code, path: issue.path,
			description: `Not an applied project/output repair: ${issue.message}`,
		})));
		if (!resolvedReport.valid)
			return { ...result, error: 'Resolved target validation failed.' };
		const buffer = exportFont(candidate, options);
		const output = inspectFont(buffer, { ...options, faceIndex: undefined });
		result.output = output;
		result.stages[3] = {
			id: 'output', status: !output.diagnostics ? 'unsupported'
				: output.diagnostics.valid ? 'checked' : 'failed',
			reasonCode: 'actual-emitted-bytes', report: output,
		};
		result.normalizations.push(...normalizationEvidence(result.stages[0].report, output));
		if (!output.diagnostics)
			return {
				...result,
				state: 'unsupported',
				output,
				error: 'Binary output diagnosis is not implemented for this format.',
			};
		if (!output.diagnostics.valid)
			return {
				...result,
				output,
				error: 'The emitted binary has blocking diagnostic errors.',
			};
		if (diagnosisIncomplete(output.diagnostics))
			return {
				...result, state: 'unsupported',
				error: 'Implemented output checks could not finish; the output cannot be verified.',
			};
		if (!output.profileReport.complete)
			return {
				...result, state: 'unsupported',
				error: 'The selected profile could not complete; supply its missing context or prerequisites.',
			};
		return { ...result, state: 'verified', buffer, output };
	} catch (error) {
		const stage = result.stages.find((item) => item.status === 'blocked');
		if (stage) {
			stage.status = 'failed';
			stage.reasonCode = 'execution-error';
			stage.reason = error.message;
		}
		return { ...result, error: `Export preflight failed: ${error.message}` };
	}
}
