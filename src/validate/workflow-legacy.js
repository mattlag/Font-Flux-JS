import { decodeDICT } from '../otf/cff_common.js';
import { parseCFF } from '../otf/table_CFF.js';
import { _internal as diagnostics } from './diagnoseFont.js';
import { runDiagnosticCheck, trackDiagnosticIssues } from './coverage.js';
import { resolveProfile } from './profiles.js';
import { buildReport } from './validateJSON.js';
import { finish, issue, positiveLimit, snapshotBytes, workBudget, workflowReport } from './workflow-common.js';

function requireBytes(bytes, offset, length, label) {
	if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset > bytes.length - length)
		throw new Error(`${label} is truncated or outside original input.`);
}

function cffIndex(bytes, offset, budget) {
	requireBytes(bytes, offset, 2, 'CFF INDEX count');
	const count = bytes[offset] * 256 + bytes[offset + 1];
	if (!count) return { items: [], end: offset + 2 };
	const size = bytes[offset + 2];
	if (!(size >= 1 && size <= 4)) throw new Error('CFF INDEX offSize must be 1..4.');
	const start = offset + 3, data = start + (count + 1) * size;
	requireBytes(bytes, start, (count + 1) * size, 'CFF INDEX offsets');
	const offsets = [];
	for (let i = 0; i <= count; i++) {
		budget.tick();
		let value = 0;
		for (let j = 0; j < size; j++) value = value * 256 + bytes[start + i * size + j];
		if (!value || (!i && value !== 1) || (i && value < offsets[i - 1])) throw new Error('CFF INDEX offsets are invalid or decreasing.');
		offsets.push(value);
	}
	requireBytes(bytes, data, offsets[count] - 1, 'CFF INDEX data');
	return { items: offsets.slice(0, -1).map((value, i) => bytes.subarray(data + value - 1, data + offsets[i + 1] - 1)), end: data + offsets[count] - 1 };
}

function cffDict(bytes, budget) {
	for (let offset = 0; offset < bytes.length;) {
		budget.tick();
		const op = bytes[offset++];
		const extra = op === 28 ? 2 : op === 29 ? 4 : op === 12 || (op >= 247 && op <= 254) ? 1 : 0;
		requireBytes(bytes, offset, extra, 'CFF DICT operand');
		offset += extra;
		if (op === 30) {
			let end = false;
			while (offset < bytes.length && !end) {
				budget.tick();
				const value = bytes[offset++];
				if ((value >> 4) === 13 || (value & 15) === 13) throw new Error('CFF DICT real uses reserved nibble.');
				end = (value >> 4) === 15 || (value & 15) === 15;
			}
			if (!end) throw new Error('CFF DICT real is unterminated.');
		}
		if (op === 255) throw new Error('CFF DICT contains reserved number encoding.');
	}
	return new Map(decodeDICT(bytes).map((entry) => [entry.operator, entry.operands]));
}

function validateCffStorage(bytes, budget, options) {
	requireBytes(bytes, 0, 4, 'CFF header');
	if (bytes[2] < 4 || bytes[3] < 1 || bytes[3] > 4) throw new Error('Invalid CFF header size/offSize.');
	requireBytes(bytes, 0, bytes[2], 'CFF header');
	const name = cffIndex(bytes, bytes[2], budget), top = cffIndex(bytes, name.end, budget);
	const strings = cffIndex(bytes, top.end, budget);
	cffIndex(bytes, strings.end, budget);
	if (!top.items.length || top.items.length !== name.items.length) throw new Error('CFF Name and Top DICT counts must match and be nonzero.');
	if (top.items.length > positiveLimit(options, 'maxFaces', 64)) throw new Error('CFF font set exceeds maxFaces.');
	const privateDict = (record) => {
		const info = record.get(18);
		if (!info) return;
		if (info.length !== 2) throw new Error('CFF Private requires size and offset.');
		const [length, offset] = info;
		requireBytes(bytes, offset, length, 'CFF Private DICT');
		const dictionary = cffDict(bytes.subarray(offset, offset + length), budget);
		const subrs = dictionary.get(19);
		if (subrs) cffIndex(bytes, offset + subrs[0], budget);
	};
	for (const raw of top.items) {
		const dictionary = cffDict(raw, budget), csOffset = dictionary.get(17)?.[0];
		if (csOffset === undefined) throw new Error('CFF Top DICT lacks CharStrings.');
		const charStrings = cffIndex(bytes, csOffset, budget), count = charStrings.items.length;
		if (!count) throw new Error('CFF font lacks .notdef and glyph programs.');
		if (count > positiveLimit(options, 'maxGlyphs', 65535)) throw new Error('CFF glyph count exceeds maxGlyphs.');
		privateDict(dictionary);
		const charset = dictionary.get(15)?.[0] ?? 0;
		if (charset > 2) {
			requireBytes(bytes, charset, 1, 'CFF charset');
			const format = bytes[charset];
			if (format === 0) requireBytes(bytes, charset + 1, (count - 1) * 2, 'CFF charset SIDs');
			else if (format === 1 || format === 2) {
				let cursor = charset + 1, total = 1;
				while (total < count) {
					budget.tick();
					const size = format === 1 ? 3 : 4;
					requireBytes(bytes, cursor, size, 'CFF charset range');
					total += 1 + (format === 1 ? bytes[cursor + 2] : bytes[cursor + 2] * 256 + bytes[cursor + 3]);
					cursor += size;
				}
				if (total !== count) throw new Error('CFF charset range exceeds glyph count.');
			} else throw new Error('Unsupported CFF charset format.');
		} else if (charset < 0) throw new Error('Invalid CFF charset offset.');
		const encoding = dictionary.get(16)?.[0] ?? 0;
		if (encoding > 1) {
			requireBytes(bytes, encoding, 2, 'CFF encoding');
			const format = bytes[encoding] & 127, count = bytes[encoding + 1];
			if (format > 1) throw new Error('Unsupported CFF encoding format.');
			let end = encoding + 2 + count * (format === 0 ? 1 : 2);
			requireBytes(bytes, encoding + 2, end - encoding - 2, 'CFF encoding entries');
			if (bytes[encoding] & 128) {
				requireBytes(bytes, end, 1, 'CFF encoding supplements');
				const count = bytes[end++];
				requireBytes(bytes, end, count * 3, 'CFF encoding supplements');
			}
		} else if (encoding < 0) throw new Error('Invalid CFF encoding offset.');
		const fdArray = dictionary.get(0x0c24)?.[0], fdSelect = dictionary.get(0x0c25)?.[0];
		let fdCount = 0;
		if (fdArray !== undefined) {
			const index = cffIndex(bytes, fdArray, budget);
			fdCount = index.items.length;
			for (const fd of index.items) privateDict(cffDict(fd, budget));
		}
		if (fdSelect !== undefined) {
			requireBytes(bytes, fdSelect, 1, 'CFF FDSelect');
			const format = bytes[fdSelect];
			if (format === 0) requireBytes(bytes, fdSelect + 1, count, 'CFF FDSelect glyphs');
			else if (format === 3) {
				requireBytes(bytes, fdSelect + 1, 2, 'CFF FDSelect ranges');
				const ranges = bytes[fdSelect + 1] * 256 + bytes[fdSelect + 2];
				requireBytes(bytes, fdSelect + 3, ranges * 3 + 2, 'CFF FDSelect ranges/sentinel');
			} else throw new Error('Unsupported CFF1 FDSelect format.');
			if (!fdCount) throw new Error('CFF FDSelect has no Font DICTs.');
		}
	}
}

function decrypt(bytes, seed, skip) {
	if (skip < 0) return bytes.slice();
	if (bytes.length < skip) throw new Error('Type 1 encrypted record is shorter than lenIV.');
	const decoded = new Uint8Array(bytes.length - skip);
	let state = seed;
	for (let i = 0; i < bytes.length; i++) {
		const value = bytes[i] ^ (state >>> 8);
		if (i >= skip) decoded[i - skip] = value;
		state = ((bytes[i] + state) * 52845 + 22719) & 65535;
	}
	return decoded;
}

function concatenate(parts) {
	const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
	let offset = 0;
	for (const part of parts) { bytes.set(part, offset); offset += part.length; }
	return bytes;
}

function type1Frame(bytes, format) {
	const decoder = new TextDecoder('latin1');
	if (format === 'pfb') {
		const ascii = [], binary = [], segments = [];
		let offset = 0, ended = false;
		while (offset < bytes.length) {
			requireBytes(bytes, offset, 2, 'PFB segment marker');
			if (bytes[offset] !== 128) throw new Error('PFB segment marker is invalid.');
			const type = bytes[offset + 1];
			if (type === 3) { offset += 2; ended = true; break; }
			if (type !== 1 && type !== 2) throw new Error('PFB segment type is invalid.');
			requireBytes(bytes, offset, 6, 'PFB segment header');
			const length = new DataView(bytes.buffer, bytes.byteOffset + offset + 2, 4).getUint32(0, true);
			requireBytes(bytes, offset + 6, length, 'PFB segment data');
			segments.push({ offset, type, length });
			(type === 1 ? ascii : binary).push(bytes.subarray(offset + 6, offset + 6 + length));
			offset += 6 + length;
		}
		if (!ended || offset !== bytes.length) throw new Error('PFB EOF segment is missing or has trailing data.');
		if (!ascii.length || !binary.length) throw new Error('PFB requires ASCII and encrypted binary segments.');
		const header = decoder.decode(concatenate(ascii));
		if (!header.includes('currentfile eexec')) throw new Error('PFB has no eexec marker.');
		return { header, encrypted: concatenate(binary), segments };
	}
	const text = decoder.decode(bytes), match = /currentfile\s+eexec\b/.exec(text);
	if (!match) throw new Error('PFA requires a currentfile eexec marker.');
	const header = text.slice(0, match.index), trailer = text.slice(match.index + match[0].length);
	const end = trailer.indexOf('cleartomark');
	const hex = (end < 0 ? trailer : trailer.slice(0, end)).replace(/\s/g, '');
	if (!/^[\da-fA-F]+$/.test(hex) || hex.length % 2) throw new Error('PFA encrypted data must contain complete hexadecimal byte pairs.');
	const encrypted = new Uint8Array(hex.length / 2);
	for (let i = 0; i < encrypted.length; i++) encrypted[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	return { header, encrypted, segments: [] };
}

function type1Programs(bytes, options, budget) {
	const text = new TextDecoder('latin1').decode(bytes);
	const lenIV = Number(/\/lenIV\s+(-?\d+)/.exec(text)?.[1] ?? 4);
	if (!Number.isInteger(lenIV) || lenIV < -1 || lenIV > 255) throw new Error('Unsupported Type 1 lenIV.');
	const programs = new Map(), subrs = [], regions = [];
	const cs = /\/CharStrings\s+(\d+)\s+dict/.exec(text);
	if (!cs) throw new Error('Type 1 original has no readable CharStrings dictionary.');
	const count = Number(cs[1]);
	if (!count || count > positiveLimit(options, 'maxGlyphs', 65535)) throw new Error('Type 1 glyph count is zero or exceeds maxGlyphs.');
	const sr = /\/Subrs\s+(\d+)\s+array/.exec(text.slice(0, cs.index));
	const scan = (pattern, start, end, add) => {
		pattern.lastIndex = start;
		let match;
		while ((match = pattern.exec(text)) && match.index < end) {
			budget.tick();
			const length = Number(match[2]), offset = pattern.lastIndex;
			requireBytes(bytes, offset, length, 'Type 1 binary CharString/Subr');
			if (offset + length > end) throw new Error('Type 1 binary record crosses its dictionary extent.');
			add(match[1], decrypt(bytes.subarray(offset, offset + length), 4330, lenIV));
			regions.push({ offset, length });
			pattern.lastIndex = offset + length;
		}
	};
	if (sr) {
		const count = Number(sr[1]);
		if (count > 65535) throw new Error('Type 1 subroutine count exceeds 65535.');
		scan(/dup\s+(\d+)\s+(\d+)\s+(?:RD|-\|)\s/g, sr.index + sr[0].length, cs.index, (index, program) => {
			if (+index >= count || subrs[+index]) throw new Error('Type 1 subroutine index is duplicate or out of range.');
			subrs[+index] = program;
		});
	}
	scan(/\/([^\s/]+)\s+(\d+)\s+(?:RD|-\|)\s/g, cs.index + cs[0].length, bytes.length, (name, program) => {
		if (programs.has(name)) throw new Error('Duplicate Type 1 CharString name.');
		programs.set(name, program);
	});
	if (programs.size !== count) throw new Error(`Type 1 declares ${count} glyphs but contains ${programs.size} readable programs.`);
	return { programs, subrs, lenIV, regions };
}

function type1ProgramEvidence(program, subrs, options, budget) {
	const stack = [], unsupported = new Set(), active = new Set();
	const maximum = positiveLimit(options, 'maxCharStringOperations', 1000000);
	let operations = 0, width = null, widthY = null, widthSource = null, ended = false;
	const take = (count) => {
		if (stack.length !== count) throw new Error(`Type 1 operator requires ${count} operands; received ${stack.length}.`);
		return stack.splice(0);
	};
	function run(bytes, depth, isSubr) {
		if (depth > 64 || active.has(bytes)) throw new Error('Type 1 recursive/cyclic subroutine.');
		active.add(bytes);
		for (let offset = 0; offset < bytes.length;) {
			budget.tick();
			if (++operations > maximum) throw new Error('Type 1 program exceeds maxCharStringOperations.');
			const op = bytes[offset++];
			if (op >= 32) {
				let number;
				if (op <= 246) number = op - 139;
				else if (op <= 254) {
					requireBytes(bytes, offset, 1, 'Type 1 encoded number');
					number = op <= 250 ? (op - 247) * 256 + bytes[offset++] + 108 : -(op - 251) * 256 - bytes[offset++] - 108;
				} else {
					requireBytes(bytes, offset, 4, 'Type 1 encoded integer');
					number = new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getInt32(0);
					offset += 4;
				}
				stack.push(number);
				if (stack.length > 24) throw new Error('Type 1 operand stack exceeds 24.');
				continue;
			}
			if (op === 10) {
				const index = stack.pop();
				if (!Number.isInteger(index) || !subrs[index]) throw new Error('Type 1 callsubr target is missing.');
				run(subrs[index], depth + 1, true);
				if (ended || unsupported.size) break;
			} else if (op === 11) {
				if (!isSubr) throw new Error('Type 1 return outside a subroutine.');
				active.delete(bytes);
				return;
			} else if (op === 14) {
				take(0); ended = true; break;
			} else if (op === 13) {
				if (width !== null) throw new Error('Type 1 program declares its width more than once.');
				width = take(2)[1];
				widthY = 0; widthSource = 'hsbw';
			} else if (op === 12) {
				requireBytes(bytes, offset, 1, 'Type 1 escaped operator');
				const escaped = bytes[offset++];
				if (escaped === 7) {
					if (width !== null) throw new Error('Type 1 program declares its width more than once.');
					const operands = take(4);
					width = operands[2]; widthY = operands[3]; widthSource = 'sbw';
				}
				else if (escaped === 12) {
					if (stack.length < 2) throw new Error('Type 1 div lacks operands.');
					const divisor = stack.pop(), dividend = stack.pop();
					if (divisor === 0) throw new Error('Type 1 division by zero.');
					stack.push(dividend / divisor);
				} else if (escaped === 0) take(0);
				else if (escaped === 1 || escaped === 2) take(6);
				else { unsupported.add(`12 ${escaped}`); break; }
			} else if ([1, 3, 5, 21].includes(op)) take(2);
			else if ([4, 6, 7, 22].includes(op)) take(1);
			else if (op === 8) take(6);
			else if (op === 30 || op === 31) take(4);
			else if (op === 9) take(0);
			else { unsupported.add(String(op)); break; }
		}
		active.delete(bytes);
		if (isSubr && !ended && !unsupported.size) throw new Error('Type 1 subroutine lacks return.');
	}
	run(program, 0, false);
	return { width, widthY, widthSource, ended, unsupportedOperators: [...unsupported], operations };
}

/** Original-format evidence only: never diagnose an imported synthetic SFNT. */
export function inspectLegacy(input, options = {}) {
	const bytes = snapshotBytes(input, options), report = workflowReport('legacy'), budget = workBudget(options);
	const profile = resolveProfile(options);
	const prefix = new TextDecoder('latin1').decode(bytes.subarray(0, 32));
	const format = bytes[0] === 128 ? 'pfb' : prefix.startsWith('%!') ? 'pfa'
		: bytes[0] === 1 || bytes[0] === 2 ? 'cff' : prefix.startsWith('StartFontMetrics') ? 'afm' : 'unknown';
	report.format = format;
	report.original = { format, byteLength: bytes.length, synthesizedTables: false, mutated: false };
	report.repairs = [];
	report.glyphs = [];
	const execution = trackDiagnosticIssues(report.issues, 'original-bytes');
	report.checks = execution.checks;
	report.profile = profile.id;
	report.profileVersion = profile.version;
	const profileCheck = {
		id: `profile.${profile.id}.legacy`, revision: profile.version, source: 'profile-context', location: { format },
		outcome: 'unsupported', coverage: 'not-checked', reasonCode: 'legacy-profile-unavailable',
		reason: 'This profile targets SFNT tables and publishing metadata. Original legacy evidence does not establish those requirements; no synthetic tables are required or certified.',
		findingIds: [],
	};
	report.profileReport = { ...buildReport([]), valid: null, id: profile.id, version: profile.version, passed: false, complete: false, checks: [profileCheck] };
	const cff1 = format === 'cff' && bytes[0] === 1 && bytes[1] === 0;
	report.capabilities = {
		import: cff1 || ['pfa', 'pfb'].includes(format),
		inspect: cff1 || ['pfa', 'pfb'].includes(format) ? 'partial' : 'unsupported',
		preserveOriginalBytes: true,
		repairOriginalFormat: false,
		exportOriginalFormat: cff1,
	};
	let parsed = false;
	try {
		if (format === 'cff') {
			requireBytes(bytes, 0, 4, 'CFF header');
			if (bytes[0] !== 1 || bytes[1] !== 0) {
				issue(report, 'LEGACY_CFF_VERSION_UNSUPPORTED', 'Only standalone CFF 1.0 is inspected; CFF2 requires its OpenType context.', {}, 'info');
			} else {
				validateCffStorage(bytes, budget, options);
				const cff = parseCFF(bytes);
				report.original.fontNames = cff.names;
				const glyphCount = cff.fonts.reduce((sum, font) => sum + font.charStrings.length, 0);
				const aggregate = positiveLimit(options, 'maxTotalCharStringOperations', 10000000);
				if (glyphCount > aggregate) throw new Error('CFF glyph execution exceeds maxTotalCharStringOperations.');
				const perGlyph = Math.min(positiveLimit(options, 'maxCharStringOperations', 1000000), Math.floor(aggregate / glyphCount));
				report.original.charStringBudget = { totalOperations: aggregate, perGlyph };
				runDiagnosticCheck(report.issues, 'binary.CFF', () => diagnostics.validateCffCharStrings(
					cff, 'standalone CFF', report.issues, false, { maxCharStringOperations: perGlyph },
				), { location: { table: 'CFF ' }, partial: 'Original charstring validation subset; complete outline/hint execution is not certified.' });
				report.original.fontCount = cff.fonts.length;
				for (const [fontIndex, font] of cff.fonts.entries())
					report.glyphs.push(...font.charStrings.map((program, glyphIndex) => ({ fontIndex, glyphIndex, byteLength: program.length })));
				parsed = true;
			}
			report.coverage.push({ domain: 'cff-original', status: parsed ? 'partial' : 'unsupported', reason: 'Bounded raw INDEX/DICT/extents and original charstring validator; not complete drawing/hint semantics.' });
		} else if (format === 'pfa' || format === 'pfb') {
			const framed = type1Frame(bytes, format), privateBytes = decrypt(framed.encrypted, 55665, 4);
			const { programs, subrs, lenIV } = type1Programs(privateBytes, options, budget);
			report.original.segments = framed.segments;
			report.original.lenIV = lenIV;
			if (!/\/FontType\s+1\b/.test(framed.header))
				issue(report, 'LEGACY_TYPE1_FONT_TYPE_UNCONFIRMED', 'Header does not explicitly declare FontType 1.', {}, 'warning');
			if (!programs.has('.notdef'))
				issue(report, 'LEGACY_TYPE1_NOTDEF_MISSING', 'Original lacks .notdef; inspection does not synthesize it.', {}, 'error');
			for (const [name, program] of programs) {
				try {
					const evidence = type1ProgramEvidence(program, subrs, options, budget);
					report.glyphs.push({ glyphName: name, byteLength: program.length, ...evidence });
					if (evidence.unsupportedOperators.length)
						issue(report, 'LEGACY_TYPE1_OPERATOR_UNSUPPORTED', 'Program needs unsupported PostScript/composite/flex execution; remaining metrics/termination are unverified.',
							{ glyphName: name }, 'info', { operators: evidence.unsupportedOperators });
					else {
						if (!evidence.ended) issue(report, 'LEGACY_TYPE1_NO_ENDCHAR', 'Original glyph program lacks endchar.', { glyphName: name }, 'error');
						if (evidence.width === null) issue(report, 'LEGACY_TYPE1_WIDTH_MISSING', 'No width was executed; inspection will not fill a zero/default width.', { glyphName: name }, 'error');
					}
				} catch (error) {
					if (/maxWork|maxCharStringOperations/.test(error.message)) throw error;
					issue(report, 'LEGACY_TYPE1_PROGRAM_INVALID', error.message, { glyphName: name }, 'error');
				}
			}
			parsed = true;
			report.coverage.push({ domain: 'type1-original', status: 'partial', reason: 'Strict PFA hex/PFB framing, encrypted binary extents/counts, selected stack/width/termination/subroutine execution; no general PostScript interpreter.' });
		} else {
			issue(report, 'LEGACY_FORMAT_UNSUPPORTED', format === 'afm'
				? 'AFM contains metrics, not artwork; supply original PFA/PFB/CFF and explicitly reconcile metrics in source tools.'
				: 'Input is not a recognized standalone CFF, PFA or PFB.', {}, 'info');
		}
	} catch (error) {
		issue(report, /max[A-Z]/.test(error.message) ? 'LEGACY_RESOURCE_LIMIT' : 'LEGACY_STRUCTURE_INVALID', error.message, {},
			/max[A-Z]/.test(error.message) ? 'info' : 'error');
		report.coverage.push({ domain: 'legacy-parse', status: /max[A-Z]/.test(error.message) ? 'limit-exceeded' : 'failed', reason: error.message });
	}
	report.work = budget.used;
	for (const entry of report.issues)
		if (entry.code === 'CFF_OPERATION_LIMIT_EXCEEDED') entry.severity = 'info';
	report.coverage.push({ domain: 'modern-conversion-output', status: 'not-run', reason: 'No synthetic SFNT was inspected as evidence of original-format conformance.' });
	report.coverage.push({ domain: 'profile-expectations', status: 'unsupported', reason: profileCheck.reason });
	report.limitations.push(
		'Type 1 import/conversion is not Type 1 repair or hint-preserving re-export.',
		'Standalone formats lack SFNT vertical/Unicode metadata; no missing metrics, artwork or charstrings are fabricated.',
		'AFM/UFO editing and complete PostScript, flex/seac, rendering and hint semantics require original source tools.',
	);
	finish(report);
	report.checks.push(profileCheck);
	report.diagnostics = {
		...buildReport(report.issues), schemaVersion: 1, source: 'original-bytes',
		valid: report.summary.errors ? false : parsed && !report.issues.some((entry) => ['LEGACY_RESOURCE_LIMIT', 'CFF_OPERATION_LIMIT_EXCEEDED'].includes(entry.code)) ? true : null,
		complete: false, checks: report.checks, faces: [], metadata: { format },
	};
	return report;
}

/** User-supplied replacement is a distinct recovery operation, never a repair. */
export function recoverLegacy(input, replacement, options = {}, core) {
	if (options.authorizeReplacement !== true) throw new TypeError('Source replacement requires authorizeReplacement: true.');
	if (!core?.inspect) throw new TypeError('Recovery requires a core inspect adapter for actual replacement bytes.');
	const original = inspectLegacy(input, options), bytes = snapshotBytes(replacement, options);
	const modern = core.inspect(bytes.buffer, options);
	if (!['sfnt', 'woff', 'woff2'].includes(modern.format) || modern.diagnostics?.valid !== true)
		return { schemaVersion: 1, operation: 'source-replacement', state: 'failed', original, replacement: modern, buffer: null, preservedOriginal: true };
	return {
		schemaVersion: 1, operation: 'source-replacement', state: 'inspected', original, replacement: modern,
		buffer: bytes.buffer, preservedOriginal: true, equivalent: null,
		limitations: ['Replacement is caller-supplied recovery evidence, not proof of artwork, metrics, licensing or hint equivalence.'],
	};
}
