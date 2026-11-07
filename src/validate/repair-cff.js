import { decodeDICT, parseINDEXv1, parseINDEXv2, writeINDEXv1, writeINDEXv2 } from '../otf/cff_common.js';
import { parseCFF } from '../otf/table_CFF.js';
import { parseCFF2 } from '../otf/table_CFF2.js';
import { _internal } from './diagnoseFont.js';
import { integer, maskedEqual, need, same, view } from './repair-tt.js';

function bounded(bytes, start, length) {
	if (!Number.isInteger(start) || !Number.isInteger(length) || start < 0 ||
		length < 0 || start + length > bytes.length)
		throw new Error('Truncated CFF structure; source data is required.');
}

// Bound every operand before using the permissive shared DICT decoder, including
// unterminated BCD reals. Keep operand spans for an in-place offset-only patch.
function dict(bytes, start, length) {
	bounded(bytes, start, length);
	const end = start + length;
	const spans = [];
	let operands = [];
	let pos = start;
	while (pos < end) {
		const begin = pos;
		const byte = bytes[pos++];
		if (byte >= 32 && byte <= 246) {
			operands.push([begin, pos]);
		} else if (byte === 28 || byte === 29 || byte >= 247 && byte <= 254) {
			pos += byte === 28 ? 2 : byte === 29 ? 4 : 1;
			if (pos > end) throw new Error('Truncated CFF DICT operand.');
			operands.push([begin, pos]);
		} else if (byte === 30) {
			let done = false;
			while (pos < end && !done) {
				const value = bytes[pos++];
				if ((value >> 4) === 13 || (value & 15) === 13)
					throw new Error('Reserved CFF BCD nibble.');
				done = (value >> 4) === 15 || (value & 15) === 15;
			}
			if (!done) throw new Error('Unterminated CFF DICT real.');
			operands.push([begin, pos]);
		} else {
			let op = byte;
			if (byte === 12) {
				if (pos >= end) throw new Error('Truncated CFF DICT escape.');
				op = 0xc00 | bytes[pos++];
			} else if (byte > 27) throw new Error('Reserved CFF DICT operand.');
			spans.push({ op, operands });
			operands = [];
		}
		if (operands.length > 513) throw new Error('CFF DICT operand stack exceeds the supported bound.');
	}
	if (operands.length) throw new Error('CFF DICT ends with unused operands.');
	const entries = decodeDICT(bytes, start, end);
	if (entries.some((entry) => entry.operands.some((operand) => !Number.isFinite(operand))))
		throw new Error('Invalid CFF DICT numeric operand.');
	return { entries, spans };
}

function one(entries, operator) {
	const selected = entries.filter((entry) => entry.operator === operator);
	if (selected.length > 1) throw new Error('Ambiguous duplicate CFF DICT operator.');
	return selected[0]?.operands;
}

export function readCff(payloads, options = {}, emptyGlyph) {
	if (payloads.has('glyf') || payloads.has('CFF ') && payloads.has('CFF2'))
		throw new Error('Mixed outline representations are unsupported.');
	const isCff2 = payloads.has('CFF2');
	const tag = isCff2 ? 'CFF2' : 'CFF ';
	const bytes = need(payloads, tag, isCff2 ? 5 : 4);
	const v = view(bytes);
	if (bytes[0] !== (isCff2 ? 2 : 1) || bytes[1] !== 0 ||
		bytes[2] < (isCff2 ? 5 : 4) || !isCff2 && (bytes[3] < 1 || bytes[3] > 4))
		throw new Error('Unsupported CFF header.');
	const maxObjects = integer(options.maxRepairCffObjects ?? 100000, 1, 1000000, 'maxRepairCffObjects');
	let objects = 0;
	function index(start) {
		const countSize = isCff2 ? 4 : 2;
		bounded(bytes, start, countSize);
		const count = isCff2 ? v.getUint32(start) : v.getUint16(start);
		objects += count;
		if (objects > maxObjects) throw new Error('CFF INDEX objects exceed the supported work limit.');
		if (!count) return { items: [], totalBytes: countSize, starts: [] };
		bounded(bytes, start + countSize, 1);
		const offSize = bytes[start + countSize];
		if (offSize < 1 || offSize > 4) throw new Error('Invalid CFF INDEX offSize.');
		bounded(bytes, start + countSize + 1, (count + 1) * offSize);
		const offsets = [];
		let pos = start + countSize + 1;
		for (let i = 0; i <= count; i++) {
			let offset = 0;
			for (let j = 0; j < offSize; j++) offset = offset * 256 + bytes[pos++];
			if (i === 0 && offset !== 1 || i && offset < offsets.at(-1))
				throw new Error('Invalid CFF INDEX offsets; object boundaries cannot be reconstructed.');
			offsets.push(offset);
		}
		bounded(bytes, pos, offsets.at(-1) - 1);
		const parsed = (isCff2 ? parseINDEXv2 : parseINDEXv1)(bytes, start);
		return { ...parsed, starts: offsets.slice(0, -1).map((offset) => pos + offset - 1) };
	}
	let top;
	if (isCff2) {
		const length = v.getUint16(3);
		top = dict(bytes, bytes[2], length);
		index(bytes[2] + length);
	} else {
		let pos = bytes[2];
		const names = index(pos);
		if (names.items.length !== 1) throw new Error('Only standalone single-font CFF is supported.');
		pos += names.totalBytes;
		const topIndex = index(pos);
		if (topIndex.items.length !== 1) throw new Error('CFF Top DICT count is ambiguous.');
		top = dict(bytes, topIndex.starts[0], topIndex.items[0].length);
		pos += topIndex.totalBytes;
		pos += index(pos).totalBytes;
		index(pos);
	}
	const offset = one(top.entries, 17);
	if (offset?.length !== 1 || !Number.isInteger(offset[0]))
		throw new Error('A unique authoritative CharStrings INDEX offset is required.');
	const charstrings = index(offset[0]);
	if (!charstrings.items.length || charstrings.items.length > 65535)
		throw new Error('CFF glyph count cannot be represented in SFNT maxp.');
	if (!isCff2) {
		const charset = one(top.entries, 15) ?? [0];
		if (charset.length !== 1 || !Number.isInteger(charset[0]) || charset[0] < 0)
			throw new Error('Invalid CFF charset reference.');
		if (charset[0] > 2) {
			let pos = charset[0];
			bounded(bytes, pos, 1);
			const format = bytes[pos++];
			if (format > 2) throw new Error('Unsupported CFF charset format.');
			let remaining = charstrings.items.length - 1;
			while (remaining > 0) {
				bounded(bytes, pos, format === 0 ? 2 : format === 1 ? 3 : 4);
				const first = v.getUint16(pos);
				const count = format === 0 ? 1 : (format === 1 ? bytes[pos + 2] : v.getUint16(pos + 2)) + 1;
				if (count > remaining || first + count - 1 > 65535)
					throw new Error('CFF charset range exceeds its glyph/SID count.');
				remaining -= count;
				pos += format === 0 ? 2 : format === 1 ? 3 : 4;
			}
		}
		const encoding = one(top.entries, 16) ?? [0];
		if (encoding.length !== 1 || !Number.isInteger(encoding[0]) || encoding[0] < 0)
			throw new Error('Invalid CFF Encoding reference.');
		if (encoding[0] > 1) {
			let pos = encoding[0];
			bounded(bytes, pos, 2);
			const format = bytes[pos] & 127, supplements = bytes[pos] & 128, count = bytes[pos + 1];
			pos += 2;
			if (format > 1) throw new Error('Unsupported CFF Encoding format.');
			bounded(bytes, pos, count * (format ? 2 : 1));
			if (format === 1)
				for (let i = 0; i < count; i++)
					if (bytes[pos + i * 2] + bytes[pos + i * 2 + 1] > 255)
						throw new Error('CFF Encoding range exceeds byte codes.');
			pos += count * (format ? 2 : 1);
			if (supplements) {
				bounded(bytes, pos, 1);
				bounded(bytes, pos + 1, bytes[pos] * 3);
			}
		}
	}
	function privateDict(entries) {
		const info = one(entries, 18);
		if (!info) return;
		if (info.length !== 2) throw new Error('Invalid CFF Private DICT reference.');
		const parsed = dict(bytes, info[1], info[0]);
		const local = one(parsed.entries, 19);
		if (local) {
			if (local.length !== 1) throw new Error('Invalid CFF local subroutine reference.');
			index(info[1] + local[0]);
		}
	}
	privateDict(top.entries);
	const fdArray = one(top.entries, 0xc24);
	if (fdArray) {
		if (fdArray.length !== 1) throw new Error('Invalid CFF FDArray reference.');
		const dictionaries = index(fdArray[0]);
		for (let i = 0; i < dictionaries.items.length; i++) {
			const fd = dict(bytes, dictionaries.starts[i], dictionaries.items[i].length);
			privateDict(fd.entries);
		}
	}
	const parsed = isCff2 ? parseCFF2(bytes) : parseCFF(bytes);
	const programs = isCff2 ? parsed.charStrings : parsed.fonts[0].charStrings;
	if (programs.length !== charstrings.items.length) throw new Error('CFF glyph count is inconsistent.');
	if (emptyGlyph !== undefined) {
		if (isCff2) throw new Error('CFF2 empty programs are valid and must not receive CFF1 endchar.');
		integer(emptyGlyph, 0, programs.length - 1, 'glyphIndex');
		if (programs[emptyGlyph].length) throw new Error('A nonempty or truncated program must never be replaced with an empty glyph; source recovery is required.');
		programs[emptyGlyph] = [14];
	}
	const issues = [];
	const operationBudget = integer(options.maxCharStringOperations ?? 1000000, 1, 10000000, 'maxCharStringOperations');
	_internal.validateCffCharStrings(parsed, tag, issues, isCff2, {
		maxCharStringOperations: Math.max(1, Math.floor(operationBudget / programs.length)),
	});
	if (issues.length) throw new Error(`CFF program/context is not completely supported: ${issues[0].code}. Source-aware repair is required.`);
	const span = top.spans.find((entry) => entry.op === 17);
	const operand = span.operands[0];
	return { tag, bytes, parsed, programs, isCff2, operand, indexOffset: offset[0], indexLength: charstrings.totalBytes };
}

function relocation(cff) {
	const [start, end] = cff.operand;
	if (end - start !== 5 || cff.bytes[start] !== 29)
		throw new Error('INDEX relocation currently requires an existing five-byte DICT offset; other encodings need source-aware rebuilding.');
	if (cff.bytes.length > 0x7fffffff) throw new Error('CFF offset would overflow a signed DICT integer.');
}

function cffMaxp(payloads) {
	const bytes = need(payloads, 'maxp', 6);
	const version = view(bytes).getUint32(0);
	if (version !== 0x5000 && version !== 0x10000)
		throw new Error('Unknown maxp version; future or opaque layouts must not be downgraded.');
	if (version === 0x10000) need(payloads, 'maxp', 32);
	return bytes;
}

export function applyCff(step, payloads, options = {}) {
	const empty = step.id === 'cff.empty-glyph';
	if (empty && step.values?.confirmedEmpty !== true)
		throw new Error('Explicit confirmation of source-known empty glyph intent is required.');
	const cff = readCff(payloads, options, empty ? step.values.glyphIndex : undefined);
	if (step.id === 'cff.maxp') {
		const bytes = cffMaxp(payloads).slice();
		view(bytes).setUint32(0, 0x5000);
		view(bytes).setUint16(4, cff.programs.length);
		payloads.set('maxp', bytes);
		return;
	}
	if (step.id !== 'cff.charstrings-index' && !empty) throw new Error(`Unknown CFF repair: ${step.id}`);
	relocation(cff);
	const encoded = (cff.isCff2 ? writeINDEXv2 : writeINDEXv1)(cff.programs.map((program) => Uint8Array.from(program)));
	const bytes = new Uint8Array(cff.bytes.length + encoded.length);
	bytes.set(cff.bytes);
	bytes.set(encoded, cff.bytes.length);
	view(bytes).setInt32(cff.operand[0] + 1, cff.bytes.length);
	payloads.set(cff.tag, bytes);
}

export function cffPrerequisites(id, payloads, options = {}) {
	if (id === 'cff.empty-glyph') {
		if (payloads.has('CFF2')) throw new Error('CFF2 empty programs are valid; CFF1 endchar repair is unsupported.');
		// Target-specific program validation is deferred until the required decision.
		need(payloads, 'CFF ', 4);
		return;
	}
	const cff = readCff(payloads, options);
	if (id === 'cff.maxp') cffMaxp(payloads);
	else relocation(cff);
}

export function inspectCff(payloads, options = {}) {
	if (!payloads.has('CFF ') && !payloads.has('CFF2')) return [];
	try {
		const cff = readCff(payloads, options);
		const maxp = view(cffMaxp(payloads));
		if (maxp.getUint32(0) === 0x5000 && maxp.getUint16(4) === cff.programs.length) return [];
		return [{ severity: 'warning', code: 'CFF_DERIVED_MAXP_MISMATCH',
			message: 'maxp version/count disagrees with the complete supported CFF CharStrings INDEX.',
			location: { table: 'maxp' } }];
	} catch { return []; }
}

export function verifyCff(before, after, steps, options = {}) {
	const failures = [];
	const handled = new Set();
	const empties = steps.filter((step) => step.id === 'cff.empty-glyph');
	if (empties.length > 1) throw new Error('Only one known-empty glyph repair per transaction is supported.');
	if (empties.some((step) => step.values?.confirmedEmpty !== true))
		throw new Error('Source-known empty glyph confirmation is missing.');
	const old = readCff(before, options, empties[0]?.values.glyphIndex);
	const now = readCff(after, options);
	if (JSON.stringify(old.parsed) !== JSON.stringify(now.parsed))
		failures.push('CFF geometry programs, widths, dictionaries, FD assignments, or variation data changed.');
	if (steps.some((step) => step.id === 'cff.maxp')) {
		handled.add('maxp');
		cffMaxp(before);
		const maxp = need(after, 'maxp', 6);
		if (view(maxp).getUint32(0) !== 0x5000 || view(maxp).getUint16(4) !== now.programs.length ||
			!maskedEqual(need(before, 'maxp'), maxp, [[0, 6]]))
			failures.push('Incorrect CFF maxp fields or unauthorized trailing maxp changes.');
	}
	const relocations = steps.filter((step) => step.id !== 'cff.maxp');
	if (relocations.length) {
		handled.add(old.tag);
		if (!maskedEqual(old.bytes, now.bytes.subarray(0, old.bytes.length), [[old.operand[0] + 1, old.operand[1]]]))
			failures.push('Original CFF bytes outside the selected DICT offset changed.');
		// Every appended region must be a complete INDEX containing the final programs.
		let position = old.bytes.length;
		for (let i = 0; i < relocations.length; i++) {
			const parsed = (old.isCff2 ? parseINDEXv2 : parseINDEXv1)(now.bytes, position);
			if (parsed.items.length !== old.programs.length ||
				parsed.items.some((program, n) => !same(program, now.programs[n])))
				failures.push('Appended INDEX programs or object boundaries changed.');
			if (i === relocations.length - 1 && now.indexOffset !== position)
				failures.push('CharStrings offset does not address the final INDEX.');
			position += parsed.totalBytes;
		}
		if (position !== now.bytes.length) failures.push('Unexpected appended CFF data.');
	}
	return { failures, handledTags: [...handled] };
}
