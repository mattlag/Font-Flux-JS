import { buildFormat12Groups, buildFormat4Data } from '../expand.js';
import { parseCmap, writeCmap } from '../sfnt/table_cmap.js';
import { encodeUtf16BE } from '../sfnt/table_name.js';
import { dataView, equalBytes, metricAdvances, nameLayout } from './repair-data.js';
import { derivedMetricExtrema, readMetrics } from './repair-tt.js';

const integer = (key, label, min = -32768, max = 32767) => ({ key, label, type: 'integer', min, max });
const boolean = (key, label) => ({ key, label, type: 'boolean' });
const authority = { ...boolean('authority', 'I have authority to choose these metadata values'), mustBeTrue: true };
const scalar = integer('codePoint', 'Unicode scalar value (decimal)', 0, 0x10ffff);
const encoding = [integer('platformID', 'Unicode platform (0 or 3)', 0, 3), integer('encodingID', 'Existing encoding ID', 0, 10)];
const nameKey = [integer('nameID', 'Name ID', 0, 65535), integer('languageID', 'Windows language ID', 0, 32767)];
const namingConflicts = ['name.family', 'name.style', 'name.order', 'name.record', 'name.remove-record'];

export const METADATA_REPAIRS = [
	{
		id: 'name.record', title: 'Set an authoritative localized name', affectedTables: ['name'],
		codes: ['QUALITY_NAME_WHITESPACE', 'QUALITY_POSTSCRIPT_NAME_INVALID', 'QUALITY_NAME_ENCODING_INVALID'],
		description: 'Replace or add one Windows Unicode name record in an explicitly chosen language; retain all other encodings and locales.',
		ifApplied: 'The chosen identity or rights text changes. Installation, style grouping or license display can change; no legal permission is inferred.',
		ifUnfixed: 'The existing localized value and its naming or rights issues remain.',
		inputs: [...nameKey, { key: 'value', label: 'Authoritative name or rights text', type: 'string', maxLength: 4096 }, authority],
		conflicts: namingConflicts.filter((id) => id !== 'name.record'), requiresRebuild: true,
	},
	{
		id: 'name.remove-record', title: 'Remove one explicitly chosen name record', risk: 'potentially-lossy', affectedTables: ['name'],
		codes: [], description: 'Remove a single unambiguous platform/encoding/language/name record. This is not a blanket cleanup of legacy names.',
		ifApplied: 'The selected localization or compatibility name is no longer available to applications; every other record and string is retained.',
		ifUnfixed: 'The selected record remains available, including any policy warning it causes.',
		inputs: [...encoding, ...nameKey], conflicts: namingConflicts.filter((id) => id !== 'name.remove-record'), requiresRebuild: true,
	},
	{
		id: 'metadata.style', title: 'Coordinate chosen style-linking metadata', affectedTables: ['OS/2', 'head'],
		codes: [], description: 'Set explicit weight, width, bold, italic and regular choices in OS/2 and matching head style bits.',
		ifApplied: 'Style selection and installation grouping may change. Names, outlines and unrelated flag bits remain unchanged.',
		ifUnfixed: 'Existing style-linking declarations, including disagreements, remain.',
		inputs: [integer('weight', 'Intended weight', 1, 1000), integer('width', 'Intended width class', 1, 9),
			boolean('bold', 'Bold style-linking bit'), boolean('italic', 'Italic style-linking bit'), boolean('regular', 'Regular style-linking bit'), authority],
		conflicts: ['os2.weight', 'os2.width'],
	},
	{
		id: 'metadata.italic', title: 'Set italic angle and caret direction', affectedTables: ['post', 'hhea'],
		codes: [], description: 'Set an authoritative italic angle and caret slope without changing outlines or guessing slant from geometry.',
		ifApplied: 'Caret appearance and italic metadata change. Existing style-linking bits are not silently changed.',
		ifUnfixed: 'Existing angle and caret behavior remain.',
		inputs: [{ key: 'angle', label: 'Italic angle in degrees', type: 'number', min: -90, max: 90 },
			integer('rise', 'Caret slope rise'), integer('run', 'Caret slope run'), authority],
		conflicts: ['post.drop-names'],
	},
	{
		id: 'metadata.fixed-pitch', title: 'Set the fixed-pitch declaration', affectedTables: ['post'],
		codes: [], description: 'Set post.isFixedPitch; claiming fixed pitch additionally requires equal nonzero advances in a static font.',
		ifApplied: 'Applications may change their spacing classification; advance widths and artwork do not change.',
		ifUnfixed: 'The existing spacing classification remains.',
		inputs: [boolean('value', 'Declare fixed pitch'), authority],
		conflicts: ['post.drop-names'],
	},
	{
		id: 'rights.embedding', title: 'Set authorized embedding permissions', affectedTables: ['OS/2'],
		codes: [], description: 'Set explicitly authorized OS/2 embedding flags. FFJS cannot establish ownership or grant a license.',
		ifApplied: 'Applications may permit or restrict embedding differently. Relaxing restrictions requires your explicit authority.',
		ifUnfixed: 'The current embedding restrictions remain in force in consumers that honor them.',
		inputs: [integer('value', 'Authorized fsType bit mask', 0, 65535), authority],
	},
	{
		id: 'metrics.line', title: 'Coordinate explicit line metrics', affectedTables: ['OS/2', 'hhea'],
		codes: [], description: 'Set explicit hhea and OS/2 typographic metrics, Windows clipping extents, and the USE_TYPO_METRICS choice.',
		ifApplied: 'Line height, wrapping and clipping can change. Glyph geometry, UPM and advance widths remain unchanged; this is not rescaling.',
		ifUnfixed: 'Existing line layout and clipping behavior remain; an intentional CJK metric policy is not overridden.',
		inputs: [integer('ascender', 'Chosen ascender'), integer('descender', 'Chosen descender'), integer('lineGap', 'Chosen line gap', 0),
			integer('winAscent', 'Chosen Windows ascent', 0, 65535), integer('winDescent', 'Chosen Windows descent', 0, 65535),
			boolean('useTypoMetrics', 'Use OS/2 typographic metrics'), authority],
		conflicts: ['os2.typo-linegap'],
	},
	{
		id: 'os2.average-width', title: 'Recalculate version-3+ average advance', risk: 'safe', affectedTables: ['OS/2'],
		codes: ['QUALITY_AVERAGE_WIDTH_MISMATCH'],
		description: 'For OS/2 version 3 or later, round the arithmetic mean of all nonzero horizontal advances. Earlier weighted heuristics are not substituted.',
		ifApplied: 'Only xAvgCharWidth and checksums change. Compact trailing metrics are expanded observationally, not padded or rewritten.',
		ifUnfixed: 'Consumers may use an inaccurate average-width estimate.',
		inputs: [], policyVersion: 'OpenType-OS2-v3-nonzero-advances',
		after: ['metrics.advance'],
	},
	{
		id: 'os2.character-range', title: 'Recalculate Unicode character bounds', risk: 'safe', affectedTables: ['OS/2'],
		codes: ['QUALITY_CHARACTER_RANGE_MISMATCH'],
		description: 'Derive first/last character indices from nonzero mappings in supported Unicode format 4/12/13 subtables, saturating supplementary values at 65535.',
		ifApplied: 'Only the two OS/2 character bounds and checksums change; mappings and UVS bytes are unchanged.',
		ifUnfixed: 'Consumers may receive inaccurate character-bound metadata.',
		inputs: [], policyVersion: 'OpenType-OS2-character-indices-v1',
		after: ['cmap.mapping', 'cmap.remove-mapping'],
	},
	{
		id: 'os2.code-pages', title: 'Declare an evidenced code-page policy', affectedTables: ['OS/2'],
		codes: [], description: 'Set caller-selected code-page masks with recorded evidence; this is a policy declaration, not proof of complete language support.',
		ifApplied: 'Legacy consumers may classify coverage differently. No character or artwork is added.',
		ifUnfixed: 'Existing code-page declarations remain, regardless of actual coverage.',
		inputs: [integer('range1', 'Code-page range 1', 0, 0xffffffff), integer('range2', 'Code-page range 2', 0, 0xffffffff),
			{ key: 'evidence', label: 'Authority/repertoire and version supporting this policy', type: 'string', maxLength: 1024 }, authority],
	},
	{
		id: 'cmap.mapping', title: 'Map a character to an existing glyph', affectedTables: ['cmap'],
		codes: [], description: 'Set one mapping in a chosen existing Unicode format 4/12 encoding. Confirm glyph suitability; missing artwork is not invented.',
		ifApplied: 'Text using this character, including space or NBSP, may shape differently. All other encodings and UVS remain byte-preserved.',
		ifUnfixed: 'The selected encoding retains its previous mapping or missing coverage.',
		inputs: [...encoding, scalar, integer('glyphID', 'Authoritative existing glyph ID', 1, 65535), authority],
		conflicts: ['cmap.remove-mapping', 'cmap.order', 'cmap.version'], requiresRebuild: true,
		companions: ['os2.character-range'],
	},
	{
		id: 'cmap.remove-mapping', title: 'Remove an explicitly chosen mapping', risk: 'potentially-lossy', affectedTables: ['cmap'],
		codes: [], description: 'Remove one scalar mapping from one selected Unicode encoding, for example an explicitly chosen control/soft-hyphen policy.',
		ifApplied: 'The selected character is unmapped in this encoding; fallback and shaping may change. Glyphs and all other encodings/UVS remain.',
		ifUnfixed: 'The existing mapping and its compatibility behavior remain.',
		inputs: [...encoding, scalar], conflicts: ['cmap.mapping', 'cmap.order', 'cmap.version'], requiresRebuild: true,
		companions: ['os2.character-range'],
	},
	{
		id: 'metrics.advance', title: 'Set an explicit glyph advance', affectedTables: ['hmtx', 'hhea'],
		codes: [], description: 'Set an existing glyph advance and recalculate horizontal metric extrema. A shared space/NBSP glyph affects both characters.',
		ifApplied: 'Text spacing and reflow can change for every mapping or shaping rule using this glyph. Bearings, outlines and all other advances remain.',
		ifUnfixed: 'The existing spacing remains; unequal whitespace widths may be intentional.',
		inputs: [integer('glyphID', 'Existing glyph ID', 0, 65535), integer('value', 'Chosen advance width', 0, 65535), authority],
		requiresRebuild: true,
		companions: ['os2.average-width'],
		conflicts: ['metrics.line', 'metadata.italic'],
	},
	{
		id: 'post.drop-names', title: 'Use post format 3 without glyph names', risk: 'potentially-lossy', affectedTables: ['post'],
		codes: [], description: 'Replace a supported post 1/2/2.5/3 representation with format 3 while preserving its common header.',
		ifApplied: 'post glyph names are unavailable; naming-dependent workflows may change. Glyph order, mappings and outlines remain.',
		ifUnfixed: 'Existing post names and their representation remain available.',
		inputs: [], requiresRebuild: true,
	},
].map((fix) => ({
	revision: 1, risk: 'assisted', formats: ['sfnt', 'woff', 'woff2', 'collection'], prerequisites:
		'Complete unambiguous parsed dependencies; unchanged unknown tables; explicit signature policy. Unsupported variation or point dependencies block affected operations.',
	invariants: ['All unselected tables and fields remain byte-preserved.', 'Glyph count, order, outlines, instructions and all unselected mappings remain unchanged.'],
	riskReason: fix.risk === 'safe'
		? 'Only a specification-defined value derived from complete static data is changed.'
		: fix.risk === 'potentially-lossy'
			? 'Explicitly selected compatibility or naming information is removed; consent is mandatory.'
			: 'The authoritative value and its application consequences must be chosen by the caller.',
	...fix,
	optional: fix.risk !== 'safe',
}));

const byID = new Map(METADATA_REPAIRS.map((fix) => [fix.id, fix]));

export function subtableMappings(subtable, options = {}) {
	const result = new Map();
	let work = 0;
	const add = (code, glyph) => {
		if (++work > (options.maxStructureNodes ?? 1000000)) throw new Error('Mapping work exceeds maxStructureNodes.');
		if (glyph) result.set(code, glyph);
	};
	if (subtable.format === 4) {
		const { segments, glyphIdArray } = subtable;
		segments.forEach((segment, index) => {
			for (let code = segment.startCode; code <= segment.endCode; code++) {
				const arrayIndex = segment.idRangeOffset / 2 - (segments.length - index) + code - segment.startCode;
				if (segment.idRangeOffset && (!Number.isInteger(arrayIndex) || arrayIndex < 0 || arrayIndex >= glyphIdArray.length))
					throw new Error('Invalid format-4 mapping range.');
				const raw = segment.idRangeOffset ? glyphIdArray[arrayIndex] : code;
				add(code, segment.idRangeOffset && raw === 0 ? 0 : (raw + segment.idDelta) & 0xffff);
			}
		});
	} else if (subtable.format === 12 || subtable.format === 13) {
		for (const group of subtable.groups) {
			if (group.endCharCode > 0x10ffff || group.endCharCode < group.startCharCode)
				throw new Error('Invalid Unicode group.');
			for (let code = group.startCharCode; code <= group.endCharCode; code++)
				add(code, subtable.format === 13 ? group.glyphID : group.startGlyphID + code - group.startCharCode);
		}
	} else throw new Error('This operation requires Unicode cmap format 4, 12 or 13.');
	return result;
}

function unicodeBounds(payloads, options) {
	const cmap = parseCmap(payloads.get('cmap')), points = new Set(), seen = new Set();
	for (const record of cmap.encodingRecords) {
		if (!(record.platformID === 0 || (record.platformID === 3 && [1, 10].includes(record.encodingID)))) continue;
		const subtable = cmap.subtables[record.subtableIndex];
		if (subtable.format === 14 || seen.has(record.subtableIndex)) continue;
		seen.add(record.subtableIndex);
		for (const code of subtableMappings(subtable, options).keys()) points.add(code);
	}
	if (!points.size) throw new Error('No complete nonempty supported Unicode repertoire is available.');
	let first = 65535, last = 0;
	for (const code of points) {
		if (code >= 0xd800 && code <= 0xdfff) throw new Error('Unicode mappings contain a surrogate.');
		first = Math.min(first, code);
		last = Math.max(last, Math.min(65535, code));
	}
	return [first, last];
}

function average(payloads) {
	const widths = metricAdvances(payloads).filter((value) => value !== 0);
	const value = widths.length ? Math.round(widths.reduce((sum, width) => sum + width, 0) / widths.length) : 0;
	if (value > 32767) throw new Error('Derived average width exceeds the signed OS/2 representation.');
	return value;
}

export function metadataRepairReason(id, payloads, options = {}) {
	const fix = byID.get(id);
	if (!fix) throw new Error(`Unknown metadata repair: ${id}`);
	try {
		for (const tag of fix.affectedTables)
			if (!payloads.has(tag)) throw new Error(`${tag} is missing; recover source data.`);
		const minimums = { 'OS/2': 78, head: 54, hhea: 36, post: 32, cmap: 4, name: 6 };
		for (const tag of fix.affectedTables)
			if (payloads.get(tag).length < (minimums[tag] ?? 0)) throw new Error(`${tag} is incomplete.`);
		if (id.startsWith('name.')) nameLayout(payloads.get('name'));
		if (['metadata.style', 'metadata.italic', 'metadata.fixed-pitch', 'metrics.line', 'metrics.advance', 'os2.average-width'].includes(id) &&
			['fvar', 'HVAR', 'MVAR', 'gvar', 'CFF2'].some((tag) => payloads.has(tag)))
			throw new Error('Variable metrics/style require a separately verified variation-aware operation.');
		if (['os2.average-width', 'metrics.advance', 'metadata.fixed-pitch'].includes(id)) metricAdvances(payloads);
		if (id === 'os2.average-width') {
			if (dataView(payloads.get('OS/2')).getUint16(0) < 3) throw new Error('OS/2 versions below 3 use a different average-width policy.');
			average(payloads);
		}
		if (id === 'os2.character-range') unicodeBounds(payloads, options);
		if (id === 'os2.code-pages' && (payloads.get('OS/2').length < 86 || dataView(payloads.get('OS/2')).getUint16(0) < 1))
			throw new Error('Code-page fields require OS/2 version 1 or later.');
		if (id === 'metrics.line' && dataView(payloads.get('OS/2')).getUint16(0) < 4)
			throw new Error('USE_TYPO_METRICS requires OS/2 version 4 or later.');
		if (id === 'metrics.advance') derivedMetricExtrema(payloads, false, options);
		if (id === 'post.drop-names' && ![0x10000, 0x20000, 0x25000, 0x30000].includes(dataView(payloads.get('post')).getUint32(0)))
			throw new Error('Unknown future post versions cannot be downgraded.');
		return null;
	} catch (error) {
		return error.message;
	}
}

function fieldChanges(step, payloads, options) {
	const v = step.values, os2 = () => dataView(payloads.get('OS/2'));
	switch (step.id) {
		case 'metadata.style':
			if (v.regular && (v.bold || v.italic)) throw new Error('Regular cannot also select bold or italic.');
			return [['OS/2', 4, 'Uint16', v.weight], ['OS/2', 6, 'Uint16', v.width],
				['OS/2', 62, 'Uint16', (os2().getUint16(62) & ~0x61) | (v.italic ? 1 : 0) | (v.bold ? 32 : 0) | (v.regular ? 64 : 0), 0x61],
				['head', 44, 'Uint16', (dataView(payloads.get('head')).getUint16(44) & ~3) | (v.bold ? 1 : 0) | (v.italic ? 2 : 0), 3]];
		case 'metadata.italic':
			if (!v.rise && !v.run) throw new Error('A caret slope cannot have both rise and run zero.');
			return [['post', 4, 'Int32', Math.round(v.angle * 65536)], ['hhea', 18, 'Int16', v.rise], ['hhea', 20, 'Int16', v.run]];
		case 'metadata.fixed-pitch':
			if (v.value && new Set(metricAdvances(payloads).filter(Boolean)).size > 1)
				throw new Error('Unequal nonzero advances do not establish fixed pitch.');
			return [['post', 12, 'Uint32', v.value ? 1 : 0]];
		case 'rights.embedding':
			if ((v.value & ~0x30e) || [2, 4, 8].filter((bit) => v.value & bit).length > 1)
				throw new Error('Embedding flags include reserved or mutually exclusive permission bits.');
			return [['OS/2', 8, 'Uint16', v.value]];
		case 'metrics.line':
			return [['hhea', 4, 'Int16', v.ascender], ['hhea', 6, 'Int16', v.descender], ['hhea', 8, 'Int16', v.lineGap],
				['OS/2', 68, 'Int16', v.ascender], ['OS/2', 70, 'Int16', v.descender], ['OS/2', 72, 'Int16', v.lineGap],
				['OS/2', 74, 'Uint16', v.winAscent], ['OS/2', 76, 'Uint16', v.winDescent],
				['OS/2', 62, 'Uint16', (os2().getUint16(62) & ~0x80) | (v.useTypoMetrics ? 0x80 : 0), 0x80]];
		case 'os2.average-width': return [['OS/2', 2, 'Int16', average(payloads)]];
		case 'os2.character-range': {
			const [first, last] = unicodeBounds(payloads, options);
			return [['OS/2', 64, 'Uint16', first], ['OS/2', 66, 'Uint16', last]];
		}
		case 'os2.code-pages': return [['OS/2', 78, 'Uint32', v.range1], ['OS/2', 82, 'Uint32', v.range2]];
		default: return [];
	}
}

function selectedName(layout, step) {
	const v = step.values;
	const key = [step.id === 'name.record' ? 3 : v.platformID, step.id === 'name.record' ? 1 : v.encodingID, v.languageID, v.nameID];
	const matches = layout.records.filter((record) => record.key.every((value, i) => value === key[i]));
	if (matches.length > 1) throw new Error('Conflicting duplicate names require an authoritative source choice.');
	if (step.id === 'name.remove-record' && !matches.length) throw new Error('The selected name record does not exist.');
	return { key, record: matches[0] };
}

function editName(bytes, step) {
	const layout = nameLayout(bytes), { key, record } = selectedName(layout, step);
	const removing = step.id === 'name.remove-record';
	if (!removing && step.values.nameID === 6 && !/^[!-~]{1,63}$/.test(step.values.value.replace(/[[\](){}<>/%]/g, ' ')))
		throw new Error('PostScript names must contain 1-63 permitted ASCII characters without whitespace or delimiters.');
	if (!removing && [1, 2, 4, 6, 16, 17].includes(step.values.nameID) && step.values.value.trim() !== step.values.value)
		throw new Error('Identity names must not start or end with whitespace.');
	const encoded = removing ? new Uint8Array() : Uint8Array.from(encodeUtf16BE(step.values.value));
	if (record && !removing && equalBytes(Uint8Array.from(record.bytes), encoded)) return bytes;
	const delta = removing ? -12 : record ? 0 : 12;
	if (layout.count + delta / 12 > 65535 || bytes.length + delta + encoded.length > 65535)
		throw new Error('The name edit exceeds 16-bit storage limits.');
	const records = layout.records.filter((item) => item !== record).map((item) => ({ key: item.key, raw: bytes.slice(item.offset, item.offset + 12) }));
	if (!removing) {
		const raw = new Uint8Array(12), view = dataView(raw);
		key.forEach((value, index) => view.setUint16(index * 2, value));
		view.setUint16(8, encoded.length);
		view.setUint16(10, bytes.length - layout.storage);
		records.push({ key, raw });
	}
	records.sort((a, b) => {
		for (let i = 0; i < 4; i++) if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i];
		return 0;
	});
	const result = new Uint8Array(bytes.length + delta + encoded.length);
	result.set(bytes.subarray(0, 6));
	dataView(result).setUint16(2, records.length);
	dataView(result).setUint16(4, layout.storage + delta);
	records.forEach((item, index) => result.set(item.raw, 6 + index * 12));
	result.set(bytes.subarray(6 + layout.count * 12), 6 + records.length * 12);
	result.set(encoded, bytes.length + delta);
	return result;
}

function selectedMapping(bytes, values, options) {
	if (!(values.platformID === 0 || (values.platformID === 3 && [1, 10].includes(values.encodingID))) ||
		(values.codePoint >= 0xd800 && values.codePoint <= 0xdfff))
		throw new Error('Choose a Unicode encoding and a Unicode scalar, not a surrogate.');
	const cmap = parseCmap(bytes);
	const matches = cmap.encodingRecords.map((record, index) => ({ record, index }))
		.filter(({ record }) => record.platformID === values.platformID && record.encodingID === values.encodingID);
	if (matches.length !== 1) throw new Error('The selected Unicode encoding must exist and be unambiguous.');
	const { record, index } = matches[0], subtable = cmap.subtables[record.subtableIndex];
	if (![4, 12].includes(subtable.format)) throw new Error('Mapping edits support format 4 and 12; other representations remain unchanged.');
	if (subtable.format === 4 && values.codePoint > 65535) throw new Error('A supplementary mapping requires an existing format-12 encoding.');
	return { subtable, index, mappings: subtableMappings(subtable, options) };
}

export function applyMetadataRepair(step, payloads, options = {}) {
	const reason = metadataRepairReason(step.id, payloads, options);
	if (reason) throw new Error(reason);
	if (step.id === 'name.record' || step.id === 'name.remove-record')
		payloads.set('name', editName(payloads.get('name'), step));
	else if (step.id === 'cmap.mapping' || step.id === 'cmap.remove-mapping') {
		const bytes = payloads.get('cmap'), { subtable, index, mappings } = selectedMapping(bytes, step.values, options);
		if (step.id === 'cmap.mapping') {
			if (step.values.glyphID >= dataView(payloads.get('maxp')).getUint16(4)) throw new Error('The chosen glyph does not exist.');
			if (mappings.get(step.values.codePoint) === step.values.glyphID) return;
			mappings.set(step.values.codePoint, step.values.glyphID);
		} else {
			if (!mappings.delete(step.values.codePoint)) throw new Error('The selected mapping does not exist.');
		}
		const entries = [...mappings].sort((a, b) => a[0] - b[0]);
		const replacement = subtable.format === 4
			? { format: 4, language: subtable.language, ...buildFormat4Data(entries) }
			: { format: 12, language: subtable.language, groups: buildFormat12Groups(entries) };
		const encoded = writeCmap({ version: 0, encodingRecords: [{ platformID: 0, encodingID: 0, subtableIndex: 0 }], subtables: [replacement] }).slice(12);
		if (bytes.length + encoded.length > (options.maxTableBytes ?? 256 * 1024 * 1024)) throw new Error('The mapping edit exceeds maxTableBytes.');
		const result = new Uint8Array(bytes.length + encoded.length);
		result.set(bytes);
		result.set(encoded, bytes.length);
		dataView(result).setUint32(4 + index * 8 + 4, bytes.length);
		payloads.set('cmap', result);
	} else if (step.id === 'post.drop-names') {
		const result = payloads.get('post').slice(0, 32);
		dataView(result).setUint32(0, 0x30000);
		payloads.set('post', result);
	} else if (step.id === 'metrics.advance') {
		const metrics = readMetrics(payloads);
		if (step.values.glyphID >= metrics.records.length) throw new Error('The selected glyph does not exist.');
		metrics.records[step.values.glyphID][0] = step.values.value;
		if (payloads.has('post') && dataView(payloads.get('post')).getUint32(12) &&
			new Set(metrics.records.map(([advance]) => advance).filter(Boolean)).size > 1)
			throw new Error('The advance would contradict the fixed-pitch declaration; choose that policy separately first.');
		const original = payloads.get('hmtx'), suffix = original.subarray(metrics.length);
		const result = new Uint8Array(metrics.records.length * 4 + suffix.length), view = dataView(result);
		metrics.records.forEach(([advance, bearing], i) => { view.setUint16(i * 4, advance); view.setInt16(i * 4 + 2, bearing); });
		result.set(suffix, metrics.records.length * 4);
		payloads.set('hmtx', result);
		dataView(payloads.get('hhea')).setUint16(34, metrics.records.length);
		const extrema = derivedMetricExtrema(payloads, false, options), header = dataView(payloads.get('hhea'));
		header.setUint16(10, extrema[0]);
		extrema.slice(1).forEach((value, i) => header.setInt16(12 + i * 2, value));
	} else {
		for (const [tag, offset, kind, value] of fieldChanges(step, payloads, options))
			dataView(payloads.get(tag))[`set${kind}`](offset, value);
	}
}

export function verifyMetadataRepairs(before, after, steps, options = {}, approvedFields = []) {
	const selected = steps.filter((step) => byID.has(step.id)), failures = [], handled = new Set();
	const maskedBefore = new Map(), maskedAfter = new Map();
	for (const step of selected) {
		if (step.id.startsWith('name.')) {
			const original = before.get('name'), output = after.get('name'), a = nameLayout(original), b = nameLayout(output);
			const { record, key } = selectedName(a, step);
			const expected = a.records.filter((item) => item !== record).map((item) => JSON.stringify([item.key, item.bytes]));
			if (step.id === 'name.record') expected.push(JSON.stringify([key, encodeUtf16BE(step.values.value)]));
			if (JSON.stringify(expected.sort()) !== JSON.stringify(b.records.map((item) => JSON.stringify([item.key, item.bytes])).sort()) ||
				a.version !== b.version || JSON.stringify(a.languages) !== JSON.stringify(b.languages) ||
				!equalBytes(original.subarray(6 + a.count * 12), output.subarray(6 + b.count * 12, 6 + b.count * 12 + original.length - 6 - a.count * 12)))
				failures.push('Unapproved localized name, language tag, or retained string changes.');
			handled.add('name');
		} else if (step.id.startsWith('cmap.')) {
			const original = before.get('cmap'), output = after.get('cmap');
			const a = selectedMapping(original, step.values, options), b = selectedMapping(output, step.values, options);
			const expected = new Map(a.mappings);
			if (step.id === 'cmap.mapping') expected.set(step.values.codePoint, step.values.glyphID);
			else expected.delete(step.values.codePoint);
			const originalPrefix = original.slice(), newPrefix = output.slice(0, original.length);
			originalPrefix.fill(0, 8 + a.index * 8, 12 + a.index * 8);
			newPrefix.fill(0, 8 + a.index * 8, 12 + a.index * 8);
			if (!equalBytes(originalPrefix, newPrefix) || expected.size !== b.mappings.size ||
				[...expected].some(([code, glyph]) => b.mappings.get(code) !== glyph))
				failures.push('Unapproved cmap mapping, UVS or unrelated encoding changes.');
			handled.add('cmap');
		} else if (step.id === 'post.drop-names') {
			if (after.get('post').length !== 32 || dataView(after.get('post')).getUint32(0) !== 0x30000 ||
				!equalBytes(before.get('post').subarray(4, 32), after.get('post').subarray(4)))
				failures.push('post format-3 header preservation failed.');
			handled.add('post');
		} else if (step.id === 'metrics.advance') {
			const a = readMetrics(before), b = readMetrics(after);
			if (a.records.length !== b.records.length || a.records.some(([advance, bearing], i) =>
				b.records[i][0] !== (i === step.values.glyphID ? step.values.value : advance) || b.records[i][1] !== bearing) ||
				!equalBytes(before.get('hmtx').subarray(a.length), after.get('hmtx').subarray(b.length)))
				failures.push('Unapproved glyph advance, bearing, or retained metric-suffix changes.');
			const expected = derivedMetricExtrema(after, false, options), header = dataView(after.get('hhea'));
			if (header.getUint16(10) !== expected[0] || expected.slice(1).some((value, i) => header.getInt16(12 + i * 2) !== value))
				failures.push('Horizontal extrema do not match the authorized advances and preserved geometry.');
			const oldHeader = before.get('hhea').slice(), newHeader = after.get('hhea').slice();
			for (const bytes of [oldHeader, newHeader]) { bytes.fill(0, 10, 18); bytes.fill(0, 34, 36); }
			if (!equalBytes(oldHeader, newHeader)) failures.push('Unapproved horizontal header changes.');
			handled.add('hmtx'); handled.add('hhea');
		} else {
			const basis = new Map(before);
			if (step.id === 'os2.character-range' && selected.some((item) => item.id.startsWith('cmap.')))
				basis.set('cmap', after.get('cmap'));
			if (step.id === 'os2.average-width' && selected.some((item) => item.id === 'metrics.advance')) {
				basis.set('hmtx', after.get('hmtx'));
				basis.set('hhea', after.get('hhea'));
			}
			for (const [tag, offset, kind, value, mask] of fieldChanges(step, basis, options)) {
				const actual = dataView(after.get(tag))[`get${kind}`](offset);
				if (mask === undefined ? actual !== value : (actual & mask) !== (value & mask))
					failures.push(`The selected ${tag} field at ${offset} was not applied.`);
				if (!maskedBefore.has(tag)) { maskedBefore.set(tag, before.get(tag).slice()); maskedAfter.set(tag, after.get(tag).slice()); }
				const length = kind.endsWith('32') ? 4 : 2;
				for (const data of [maskedBefore.get(tag), maskedAfter.get(tag)]) {
					if (mask === undefined) data.fill(0, offset, offset + length);
					else { const view = dataView(data); view.setUint16(offset, view.getUint16(offset) & ~mask); }
				}
				handled.add(tag);
			}
		}
	}
	for (const [tag, original] of maskedBefore) {
		const output = maskedAfter.get(tag);
		for (const [fieldTag, offset, length] of approvedFields)
			if (fieldTag === tag) { original.fill(0, offset, offset + length); output.fill(0, offset, offset + length); }
		if (tag === 'head') { original.fill(0, 8, 12); output.fill(0, 8, 12); }
		if (!equalBytes(original, output)) failures.push(`Unapproved metadata changes in ${tag}.`);
	}
	return { failures, handledTags: [...handled] };
}

export function inspectMetadata(payloads, options = {}) {
	const issues = [];
	const name = payloads.get('name');
	if (name) {
		for (const record of nameLayout(name).records) {
			if (!(record.key[0] === 0 || (record.key[0] === 3 && [0, 1, 10].includes(record.key[1])))) continue;
			const location = { table: 'name', platformID: record.key[0], encodingID: record.key[1], languageID: record.key[2], nameID: record.key[3] };
			let text;
			try {
				text = new TextDecoder('utf-16be', { fatal: true }).decode(Uint8Array.from(record.bytes));
			} catch (error) {
				if (!(error instanceof TypeError)) throw error;
				issues.push({ severity: 'error', code: 'QUALITY_NAME_ENCODING_INVALID', message: 'A Unicode name is not well-formed UTF-16BE; choose an authoritative replacement for this record.', location });
				continue;
			}
			if ([1, 2, 4, 6, 16, 17].includes(record.key[3]) && (text.trim() !== text || /[\r\n]/.test(text)))
				issues.push({ severity: 'warning', code: 'QUALITY_NAME_WHITESPACE', message: 'An identity name has leading/trailing whitespace or line breaks; choose its authoritative localized replacement.', location });
			if (record.key[3] === 6 && (!/^[!-~]{1,63}$/.test(text) || /[[\](){}<>/%]/.test(text)))
				issues.push({ severity: 'warning', code: 'QUALITY_POSTSCRIPT_NAME_INVALID', message: 'A PostScript name violates the 63-character ASCII/name-delimiter restrictions.', location });
		}
	}
	if (!metadataRepairReason('os2.average-width', payloads, options) &&
		dataView(payloads.get('OS/2')).getInt16(2) !== average(payloads))
		issues.push({ severity: 'warning', code: 'QUALITY_AVERAGE_WIDTH_MISMATCH', message: 'OS/2 xAvgCharWidth differs from the version-3+ nonzero-advance average.', location: { table: 'OS/2' } });
	if (!metadataRepairReason('os2.character-range', payloads, options)) {
		const expected = unicodeBounds(payloads, options), os2 = dataView(payloads.get('OS/2'));
		if (os2.getUint16(64) !== expected[0] || os2.getUint16(66) !== expected[1])
			issues.push({ severity: 'warning', code: 'QUALITY_CHARACTER_RANGE_MISMATCH', message: 'OS/2 first/last character indices differ from the supported Unicode repertoire.', location: { table: 'OS/2' } });
	}
	return issues;
}
