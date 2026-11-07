import { exportFont } from '../export.js';
import { unwrapWOFF1, wrapWOFF1 } from '../woff/woff1.js';
import { unwrapWOFF2, wrapWOFF2 } from '../woff/woff2.js';
import { dataView, equalBytes } from './repair-data.js';

export const CONTAINER_REPAIRS = [
	{
		id: 'container.length', title: 'Correct the declared wrapper length',
		codes: ['WOFF1_FILE_SIZE_MISMATCH', 'WOFF2_FILE_SIZE_MISMATCH'],
		description: 'Set the WOFF file-length field to the complete, validated original byte length.',
		ifApplied: 'Only the four-byte wrapper length changes; compressed tables, metadata and private bytes are retained exactly.',
		ifUnfixed: 'Consumers may reject the mismatched wrapper length.',
	},
	{
		id: 'container.reserved', title: 'Clear the reserved wrapper field',
		codes: ['WOFF1_RESERVED_FIELD_NONZERO', 'WOFF2_RESERVED_FIELD_NONZERO'],
		description: 'Set the normative WOFF reserved field to zero without rewriting the compressed data.',
		ifApplied: 'Only the two reserved bytes change; all other wrapper bytes remain unchanged.',
		ifUnfixed: 'Consumers may reject a nonzero reserved field.',
	},
	{
		id: 'container.sfnt-size', title: 'Correct the WOFF1 decoded-size declaration',
		codes: ['WOFF1_SFNT_SIZE_MISMATCH'],
		description: 'Set totalSfntSize from successfully decompressed, complete WOFF1 table data and SFNT alignment.',
		ifApplied: 'Only the decoded-size declaration changes; compressed table and auxiliary bytes are unchanged.',
		ifUnfixed: 'Consumers may reject the inconsistent decoded-size declaration.',
		formats: ['woff'],
	},
].map((fix) => ({
	revision: 1, risk: 'safe', inputs: [], formats: ['woff', 'woff2'],
	prerequisites: 'A complete unambiguous supported WOFF wrapper; decoding must finish within limits. Signature and auxiliary-data preservation must be established.',
	riskReason: 'Only a fixed or fully derived header field is changed in place.',
	invariants: ['All bytes outside the selected wrapper fields remain identical.'],
	...fix,
}));

function collectionFace(bytes, options) {
	const view = dataView(bytes);
	if (bytes.length < 12 || ![0x10000, 0x20000].includes(view.getUint32(4)))
		throw new Error('Unsupported or truncated collection header.');
	const count = view.getUint32(8), index = options.faceIndex;
	const end = 12 + count * 4 + (view.getUint32(4) === 0x20000 ? 12 : 0);
	if (!count || count > (options.maxFonts ?? 256) || end > bytes.length)
		throw new Error('Incomplete collection face directory or font limit exceeded.');
	if (!Number.isInteger(index) || index < 0 || index >= count)
		throw new Error('Choose an explicit valid faceIndex before repairing a collection.');
	if (view.getUint32(4) === 0x20000 &&
		[0, 4, 8].some((offset) => view.getUint32(12 + count * 4 + offset)))
		throw new Error('A collection-level signature requires external re-signing or an independently authorized removal workflow.');
	const offset = view.getUint32(12 + index * 4);
	if (offset < end || offset + 12 > bytes.length) throw new Error('The selected face header is incomplete.');
	const tableCount = view.getUint16(offset + 4), directoryEnd = offset + 12 + tableCount * 16;
	if (!tableCount || tableCount > (options.maxTables ?? 4096) || directoryEnd > bytes.length)
		throw new Error('The selected face directory is incomplete or exceeds maxTables.');
	const tables = {}, order = [], extents = [];
	let outputLength = 12 + tableCount * 16;
	for (let i = 0; i < tableCount; i++) {
		const record = offset + 12 + i * 16;
		const tag = String.fromCharCode(...bytes.subarray(record, record + 4));
		const start = view.getUint32(record + 8), length = view.getUint32(record + 12);
		if (!/^[\x20-\x7e]{4}$/.test(tag) || Object.hasOwn(tables, tag) || start < end || start + length > bytes.length ||
			(start < directoryEnd && start + length > offset) || length > (options.maxTableBytes ?? 256 * 1024 * 1024))
			throw new Error('Ambiguous or incomplete collection table contents require source recovery.');
		outputLength += (length + 3) & ~3;
		if (outputLength > (options.maxUncompressedBytes ?? 256 * 1024 * 1024))
			throw new Error('Selected face exceeds maxUncompressedBytes.');
		tables[tag] = { _raw: bytes.slice(start, start + length) };
		order.push(tag);
		if (length) extents.push({ start, end: start + length });
	}
	extents.sort((a, b) => a.start - b.start);
	if (extents.some((item, index) => index && item.start < extents[index - 1].end))
		throw new Error('Overlapping selected-face tables require source recovery.');
	const sfnt = new Uint8Array(exportFont({ header: { sfVersion: view.getUint32(offset) }, tables }, { format: 'sfnt' }));
	const records = new Map();
	for (let i = 0; i < tableCount; i++) {
		const record = sfnt.slice(12 + i * 16, 28 + i * 16);
		records.set(String.fromCharCode(...record.subarray(0, 4)), record);
	}
	order.forEach((tag, index) => sfnt.set(records.get(tag), 12 + index * 16));
	sfnt.set(bytes.subarray(offset + 6, offset + 12), 6);
	return { sfnt, faceIndex: index };
}

function checkWoff1Extents(bytes) {
	const view = dataView(bytes), count = view.getUint16(12), end = 44 + count * 20;
	if (end > bytes.length) throw new Error('The WOFF1 directory is truncated.');
	const ranges = [], tags = new Set();
	for (let i = 0; i < count; i++) {
		const record = 44 + i * 20, tag = view.getUint32(record);
		const start = view.getUint32(record + 4), length = view.getUint32(record + 8);
		if (tags.has(tag) || start < end || start + length > bytes.length)
			throw new Error('Ambiguous WOFF1 records require source recovery.');
		tags.add(tag);
		ranges.push({ start, end: start + length });
	}
	for (const position of [24, 36]) {
		const start = view.getUint32(position), length = view.getUint32(position + 4);
		if (!!start !== !!length || (start && (start < end || start + length > bytes.length)))
			throw new Error('Invalid WOFF1 auxiliary block.');
		if (length) ranges.push({ start, end: start + length });
	}
	ranges.sort((a, b) => a.start - b.start);
	if (ranges.some((range, index) => index && range.start < ranges[index - 1].end))
		throw new Error('Overlapping WOFF1 data cannot be safely repaired.');
	return { ranges, dataStart: end };
}

function checkWoff2Extents(bytes, options) {
	const view = dataView(bytes), count = view.getUint16(12);
	if (!count || count > (options.maxTables ?? 4096)) throw new Error('WOFF2 table count exceeds its supported limit.');
	let position = 48;
	function length() {
		for (let i = 0; i < 5; i++) {
			if (position >= bytes.length) throw new Error('Truncated WOFF2 table directory.');
			if (!(bytes[position++] & 0x80)) return;
		}
		throw new Error('Invalid WOFF2 Base128 length.');
	}
	for (let i = 0; i < count; i++) {
		if (position >= bytes.length) throw new Error('Truncated WOFF2 table directory.');
		const flags = bytes[position++], index = flags & 63, transform = flags >>> 6;
		let glyphTable = index === 10 || index === 11;
		if (index === 63) {
			if (position + 4 > bytes.length) throw new Error('Truncated custom WOFF2 table tag.');
			const tag = String.fromCharCode(...bytes.subarray(position, position + 4));
			glyphTable = tag === 'glyf' || tag === 'loca';
			position += 4;
		}
		length();
		if (glyphTable ? transform === 0 : transform !== 0) length();
	}
	const ranges = [{ start: position, end: position + view.getUint32(20) }];
	for (const offset of [28, 40]) {
		const start = view.getUint32(offset), size = view.getUint32(offset + 4);
		if (!!start !== !!size) throw new Error('Inconsistent WOFF2 auxiliary block.');
		if (size) ranges.push({ start, end: start + size });
	}
	ranges.sort((a, b) => a.start - b.start);
	if (ranges.some((range, i) => range.start < position || range.end > bytes.length ||
		(i && range.start < ranges[i - 1].end))) throw new Error('Ambiguous WOFF2 payload extents.');
	return { ranges, dataStart: position };
}

export function prepareRepairContainer(bytes, format, options = {}) {
	if (format === 'sfnt') return { sfnt: bytes, format, rewrite: false };
	if (format === 'collection') return { ...collectionFace(bytes, options), format, rewrite: true };
	if (format !== 'woff' && format !== 'woff2') throw new Error('This format has no supported binary repair adapter.');
	const minimum = format === 'woff' ? 44 : 48;
	if (bytes.length < minimum) throw new Error('The wrapper header is incomplete.');
	if (dataView(bytes).getUint32(4) === 0x74746366) throw new Error('WOFF collections are not supported by this repair adapter.');
	const extents = format === 'woff' ? checkWoff1Extents(bytes) : checkWoff2Extents(bytes, options);
	const decoded = (format === 'woff' ? unwrapWOFF1 : unwrapWOFF2)(bytes.slice().buffer, options);
	const sfnt = new Uint8Array(decoded.sfnt);
	return { ...decoded, sfnt, format, rewrite: true, ...extents };
}

export function emitRepairContainer(original, source, sfnt, steps, options = {}) {
	if (source.format === 'sfnt') return sfnt;
	if (steps.every((step) => step.id.startsWith('container.'))) {
		const result = original.slice(), view = dataView(result);
		for (const step of steps) {
			if (step.id === 'container.length') view.setUint32(8, result.length);
			else if (step.id === 'container.reserved') view.setUint16(14, 0);
			else if (step.id === 'container.sfnt-size') view.setUint32(16, source.sfnt.length);
			else throw new Error(`Unknown wrapper repair: ${step.id}`);
		}
		return result;
	}
	if (source.format === 'collection') {
		const base = Math.ceil(original.length / 4) * 4;
		if (base + sfnt.length > (options.maxInputBytes ?? 256 * 1024 * 1024))
			throw new Error('Copy-on-write collection repair exceeds maxInputBytes.');
		const face = sfnt.slice(), faceView = dataView(face);
		for (let i = 0; i < faceView.getUint16(4); i++) {
			const record = 12 + i * 16, offset = faceView.getUint32(record + 8);
			if (String.fromCharCode(...face.subarray(record, record + 4)) === 'head') faceView.setUint32(offset + 8, 0);
			faceView.setUint32(record + 8, base + offset);
		}
		const result = new Uint8Array(base + face.length);
		result.set(original);
		result.set(face, base);
		dataView(result).setUint32(12 + source.faceIndex * 4, base);
		return result;
	}
	if (source.ranges) {
		let end = source.dataStart;
		for (const range of source.ranges) {
			if (original.subarray(end, range.start).some(Boolean))
				throw new Error('Nonzero unreferenced wrapper bytes cannot be discarded.');
			end = range.end;
		}
		if (original.subarray(end).some(Boolean)) throw new Error('Nonzero trailing wrapper bytes cannot be discarded.');
	}
	const result = new Uint8Array((source.format === 'woff' ? wrapWOFF1 : wrapWOFF2)(sfnt.buffer, source.metadata, source.privateData));
	const originalView = dataView(original), outputView = dataView(result);
	const versionOffset = source.format === 'woff' ? 20 : 24;
	outputView.setUint32(versionOffset, originalView.getUint32(versionOffset));
	if (result.length > (options.maxInputBytes ?? 256 * 1024 * 1024)) throw new Error('Repaired wrapper exceeds maxInputBytes.');
	return result;
}

export function verifyRepairContainer(original, candidate, source, steps, options = {}) {
	const failures = [];
	if (steps.every((step) => step.id.startsWith('container.'))) {
		const a = original.slice(), b = candidate.slice();
		for (const step of steps) {
			const [start, end] = step.id === 'container.length' ? [8, 12] : step.id === 'container.reserved' ? [14, 16] : [16, 20];
			a.fill(0, start, end); b.fill(0, start, end);
		}
		if (!equalBytes(a, b)) failures.push('Unapproved compressed-wrapper or auxiliary-data changes.');
	} else if (source.format === 'collection') {
		const a = original.slice(), b = candidate.slice(0, original.length);
		const offset = 12 + source.faceIndex * 4;
		a.fill(0, offset, offset + 4); b.fill(0, offset, offset + 4);
		if (!equalBytes(a, b)) failures.push('An unselected collection face or original shared payload changed.');
	} else if (source.format === 'woff' || source.format === 'woff2') {
		const decoded = prepareRepairContainer(candidate, source.format, options);
		for (const key of ['metadata', 'privateData'])
			if (!equalBytes(source[key] ?? new Uint8Array(), decoded[key] ?? new Uint8Array()))
				failures.push(`Wrapper ${key} was not preserved.`);
		const offset = source.format === 'woff' ? 20 : 24;
		if (dataView(original).getUint32(offset) !== dataView(candidate).getUint32(offset))
			failures.push('Wrapper font version metadata changed.');
	}
	return failures;
}
