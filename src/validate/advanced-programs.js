import { addIssue, BinaryView } from './advanced-common.js';

export function validateAdvancedTrueType(tables, ctx) {
	function program(bytes, path) {
		const blocks = [];
		let definition = null;
		let definitionDepth = 0;
		for (let i = 0; i < (bytes?.length ?? 0); i++) {
			ctx.limits.consume();
			const op = bytes[i];
			const at = `${path}.${i}`;
			const location = ctx.location(at, { table: path.split('.')[0] });
			let operands = 0;
			if (op >= 0xb0 && op <= 0xb7) operands = op - 0xaf;
			else if (op >= 0xb8 && op <= 0xbf) operands = 2 * (op - 0xb7);
			else if (op === 0x40 || op === 0x41) {
				if (++i >= bytes.length) break; // Legacy decoder reports truncated PUSH.
				operands = bytes[i] * (op === 0x41 ? 2 : 1);
			}
			if (operands) { i += operands; continue; }
			if (op === 0x58) {
				ctx.limits.checkDepth(blocks.length + 1);
				blocks.push(false);
			} else if (op === 0x1b) {
				if (!blocks.length || blocks.at(-1))
					addIssue(ctx.issues, 'error', 'TT_INSTR_ELSE_INVALID',
						'ELSE has no matching IF or repeats an ELSE within the same IF.', location);
				if (blocks.length) blocks[blocks.length - 1] = true;
			} else if (op === 0x59) blocks.pop();
			else if (op === 0x2c || op === 0x89) {
				if (definition !== null)
					addIssue(ctx.issues, 'error', 'TT_INSTR_DEFINITION_SCOPE_INVALID',
						'FDEF/IDEF must not be nested.', location);
				definition = op;
				definitionDepth = blocks.length;
				if (path.startsWith('glyf'))
					addIssue(ctx.issues, 'error', 'TT_INSTR_DEFINITION_LOCATION_INVALID',
						'FDEF/IDEF definitions belong in fpgm or prep, not a glyph program.', location);
			} else if (op === 0x2d) {
				if (definition !== null && blocks.length !== definitionDepth)
					addIssue(ctx.issues, 'error', 'TT_INSTR_DEFINITION_SCOPE_INVALID',
						'An IF block crosses the end of a function/instruction definition.', location);
				definition = null;
			}
		}
	}
	program(tables.fpgm?.instructions, 'fpgm.instructions');
	program(tables.prep?.instructions, 'prep.instructions');
	const glyphs = tables.glyf?.glyphs ?? [];
	const counts = new Map();
	const active = new Set();
	function count(gid, depth) {
		ctx.limits.consume();
		ctx.limits.checkDepth(depth);
		if (counts.has(gid)) return counts.get(gid);
		if (active.has(gid)) return null; // Existing cycle diagnostic owns this finding.
		const glyph = glyphs[gid];
		if (!glyph) return { points: 0, contours: 0, depth: 0 };
		active.add(gid);
		let points = 0, contours = 0, componentDepth = 0;
		const path = `glyf.glyphs.${gid}`;
		if (glyph.type === 'simple') {
			ctx.each(glyph.contours, (contour) => { points += contour.length; contours++; });
		} else {
			ctx.each(glyph.components, (component, index) => {
				const at = `${path}.components.${index}`;
				ctx.glyph(component.glyphIndex, `${at}.glyphIndex`);
				const child = count(component.glyphIndex, depth + 1);
				if (!child) return;
				const flags = component.flags ?? {};
				if (!flags.argsAreXYValues &&
					(component.argument1 >= points || component.argument2 >= child.points))
					addIssue(ctx.issues, 'error', 'GLYF_ATTACHMENT_POINT_INVALID',
						'Point attachment references an unavailable parent or component point.', ctx.location(at, { glyphIndex: gid }));
				if ((flags.scaledComponentOffset && flags.unscaledComponentOffset) ||
					[flags.weHaveAScale, flags.weHaveAnXAndYScale, flags.weHaveATwoByTwo].filter(Boolean).length > 1)
					addIssue(ctx.issues, 'error', 'GLYF_COMPONENT_FLAGS_CONFLICT',
						'Composite transform/offset flags are mutually exclusive.', ctx.location(at, { glyphIndex: gid }));
				points += child.points;
				contours += child.contours;
				componentDepth = Math.max(componentDepth, child.depth + 1);
			});
		}
		if (points > (ctx.limits.maxStructureNodes))
			throw new RangeError('Expanded composite point count exceeds the diagnostic structural work budget.');
		const maxp = tables.maxp;
		for (const [field, actual] of [
			[glyph.type === 'simple' ? 'maxPoints' : 'maxCompositePoints', points],
			[glyph.type === 'simple' ? 'maxContours' : 'maxCompositeContours', contours],
			['maxComponentDepth', componentDepth],
			['maxComponentElements', glyph.components?.length ?? 0],
			['maxSizeOfInstructions', glyph.instructions?.length ?? 0],
		]) {
			if (typeof maxp?.[field] === 'number' && actual > maxp[field])
				addIssue(ctx.issues, 'error', 'GLYF_MAXP_LIMIT_EXCEEDED',
					`${field} (${maxp[field]}) is less than observed structural requirement ${actual}; VM-dependent maxima were not inferred.`,
					ctx.location(`${path}.${field}`, { glyphIndex: gid }));
		}
		active.delete(gid);
		const result = { points, contours, depth: componentDepth };
		counts.set(gid, result);
		return result;
	}
	ctx.each(glyphs, (glyph, gid) => {
		program(glyph?.instructions, `glyf.glyphs.${gid}.instructions`);
		count(gid, 1);
	});
	let lastPpem = -1;
	ctx.each(tables.gasp?.gaspRanges, (range, i) => {
		if (range.rangeMaxPPEM <= lastPpem || (range.rangeGaspBehavior & ~15))
			addIssue(ctx.issues, 'error', 'GASP_RANGE_INVALID',
				'gasp ranges must increase and use only defined behavior flags.', ctx.location(`gasp.gaspRanges.${i}`, { table: 'gasp' }));
		lastPpem = range.rangeMaxPPEM;
	});
}

// Evaluate only deterministic CFF1 arithmetic. Random and obsolete dotsection
// remain explicit unknowns; no coordinate or random seed is invented.
export function executeCffArithmetic(op, ctx, report, label) {
	const stack = ctx.stack;
	const need = (n) => {
		if (stack.length >= n) return true;
		report('CFF_STACK_UNDERFLOW', 'error', `${label}: escaped operator ${op} needs ${n} operands.`);
		return false;
	};
	const invalid = (message) => {
		report('CFF_ARITHMETIC_OPERAND_INVALID', 'error', `${label}: ${message}`);
		return false;
	};
	if ([3, 4, 10, 11, 12, 15, 24].includes(op)) {
		if (!need(2)) return false;
		const b = stack.pop(), a = stack.pop();
		if (op === 12 && b === 0) return invalid('division by zero.');
		const result = op === 3 ? +(!!a && !!b) : op === 4 ? +(!!a || !!b) :
			op === 10 ? a + b : op === 11 ? a - b : op === 12 ? a / b : op === 15 ? +(a === b) : a * b;
		if (!Number.isFinite(result)) return invalid('arithmetic result is not finite.');
		stack.push(result);
	} else if ([5, 9, 14, 26, 27, 18].includes(op)) {
		if (!need(1)) return false;
		const value = stack.pop();
		if (op === 26 && value < 0) return invalid('sqrt requires a nonnegative operand.');
		if (op === 27) stack.push(value, value);
		else if (op !== 18) stack.push(op === 5 ? +!value : op === 9 ? Math.abs(value) : op === 14 ? -value : Math.sqrt(value));
	} else if (op === 28) {
		if (!need(2)) return false;
		const b = stack.pop(), a = stack.pop(); stack.push(b, a);
	} else if (op === 29) {
		if (!need(2)) return false;
		const index = stack.pop();
		if (!Number.isInteger(index)) return invalid('index requires an integer.');
		stack.push(stack[Math.max(0, stack.length - 1 - Math.max(0, index))]);
	} else if (op === 30) {
		if (!need(2)) return false;
		const shift = stack.pop(), count = stack.pop();
		if (!Number.isInteger(count) || count < 0 || count > stack.length || !Number.isInteger(shift))
			return invalid('roll operands do not select a valid stack span.');
		if (count) {
			const rotation = ((shift % count) + count) % count;
			const values = stack.splice(stack.length - count);
			stack.push(...values.slice(count - rotation), ...values.slice(0, count - rotation));
		}
	} else if (op === 22) {
		if (!need(4)) return false;
		const v2 = stack.pop(), v1 = stack.pop(), s2 = stack.pop(), s1 = stack.pop();
		stack.push(v1 <= v2 ? s1 : s2);
	} else if (op === 20 || op === 21) {
		if (!need(op === 20 ? 2 : 1)) return false;
		const index = stack.pop();
		if (!Number.isInteger(index) || index < 0 || index >= 32) return invalid('transient array index must be in [0, 31].');
		ctx.transient ??= new Array(32);
		if (op === 20) ctx.transient[index] = stack.pop();
		else if (ctx.transient[index] === undefined) {
			report('CFF_CONTEXT_UNSUPPORTED', 'warning', `${label}: transient array entry ${index} was not initialized by this glyph.`);
			return false;
		} else stack.push(ctx.transient[index]);
	} else return null;
	if (stack.length > 48) {
		ctx.aborted = true;
		ctx.maxStackSeen = stack.length;
		return false;
	}
	return true;
}

export function validateCffStructures(raw, value, ctx) {
	const view = new BinaryView(raw, ctx);
	const cff2 = ctx.table === 'CFF2';
	const major = view.u8(0), headerSize = view.u8(2);
	if (major !== (cff2 ? 2 : 1) || headerSize < (cff2 ? 5 : 4) ||
		(!cff2 && (view.u8(3) < 1 || view.u8(3) > 4)))
		addIssue(ctx.issues, 'error', 'CFF_HEADER_INVALID', 'Invalid CFF version or header size.', ctx.location('header'));
	if (view.u8(1) !== 0) ctx.unsupported('header.minorVersion', 'Only CFF 1.0 and CFF2 2.0 semantics are implemented.');
	const readIndex = (start) => {
		const count = cff2 ? view.u32(start) : view.u16(start);
		const countSize = cff2 ? 4 : 2;
		if (!count) return { end: start + countSize, spans: [] };
		ctx.limits.consume(count);
		const offSize = view.u8(start + countSize);
		if (offSize < 1 || offSize > 4) throw new RangeError('CFF INDEX offSize must be 1..4.');
		const array = start + countSize + 1;
		view.range(array, (count + 1) * offSize);
		const data = array + (count + 1) * offSize;
		const offsets = [];
		for (let i = 0; i <= count; i++) {
			let offset = 0;
			for (let j = 0; j < offSize; j++) offset = offset * 256 + view.u8(array + i * offSize + j);
			if ((i === 0 && offset !== 1) || (i > 0 && offset < offsets[i - 1]))
				throw new RangeError('CFF INDEX offsets must start at 1 and be monotonic.');
			offsets.push(offset);
		}
		view.range(data, offsets[count] - 1);
		return { end: data + offsets[count] - 1, spans: offsets.slice(0, -1).map((off, i) =>
			[data + off - 1, data + offsets[i + 1] - 1]) };
	};
	const index = (start) => {
		try { return readIndex(start); }
		catch (error) {
			if (error instanceof RangeError) throw new RangeError(`CFF INDEX at byte ${start}: ${error.message}`);
			throw error;
		}
	};
	const dictionary = (start, end) => {
		const entries = new Map();
		const operands = [];
		for (let i = start; i < end;) {
			const byte = view.u8(i++);
			if (byte === 28 || byte === 29) {
				const size = byte === 28 ? 2 : 4;
				if (i + size > end) throw new RangeError('Truncated CFF DICT integer.');
				operands.push(size === 2 ? view.i16(i) : view.u32(i) | 0); i += size;
			} else if (byte >= 32 && byte <= 246) operands.push(byte - 139);
			else if (byte >= 247 && byte <= 254) {
				if (i >= end) throw new RangeError('Truncated CFF DICT operand.');
				operands.push(byte <= 250 ? (byte - 247) * 256 + view.u8(i++) + 108 : -(byte - 251) * 256 - view.u8(i++) - 108);
			} else if (byte === 30) {
				let done = false;
				while (i < end && !done) {
					const b = view.u8(i++);
					if ((b >> 4) === 13 || ((b >> 4) !== 15 && (b & 15) === 13))
						throw new RangeError('CFF DICT real number contains a reserved nibble.');
					done = (b & 15) === 15 || (b >> 4) === 15;
				}
				if (!done) throw new RangeError('Unterminated CFF DICT real number.');
				operands.push(NaN); // Real coordinates are not byte offsets.
			} else {
				if (byte === 31 || byte === 255) throw new RangeError('CFF DICT contains a reserved byte.');
				const op = byte === 12 ? 0x0c00 + view.u8(i++) : byte;
				if (i > end) throw new RangeError('Truncated CFF DICT operator.');
				entries.set(op, operands.splice(0));
			}
			if (operands.length > (cff2 ? 513 : 48)) throw new RangeError('CFF DICT operand stack exceeds its structural limit.');
		}
		if (operands.length) throw new RangeError('CFF DICT ends with unused operands.');
		return entries;
	};
	const privateDict = (entry) => {
		if (!entry) return;
		const [size, offset] = entry;
		view.range(offset, size);
		const dict = dictionary(offset, offset + size);
		if (dict.has(19)) index(offset + dict.get(19)[0]);
	};
	let topSpans, stringCount = 0;
	if (cff2) {
		const length = view.u16(3);
		view.range(headerSize, length);
		topSpans = [[headerSize, headerSize + length]];
		index(headerSize + length);
	} else {
		const names = index(headerSize);
		const top = index(names.end);
		const strings = index(top.end);
		stringCount = strings.spans.length;
		index(strings.end);
		ctx.parallel(top.spans.length, names.spans.length, 'topDictIndex');
		topSpans = top.spans;
	}
	ctx.each(topSpans, ([start, end], i) => {
		const dict = dictionary(start, end);
		let glyphCount = 0, fdCount = 0;
		if (dict.has(17)) {
			const strings = index(dict.get(17)[0]);
			glyphCount = strings.spans.length;
			if (ctx.tables.maxp) ctx.parallel(strings.spans.length, ctx.tables.maxp.numGlyphs, `fonts.${i}.charStrings`);
		}
		privateDict(dict.get(18));
		if (dict.has(0x0c24)) {
			const fds = index(dict.get(0x0c24)[0]);
			fdCount = fds.spans.length;
			ctx.each(fds.spans, ([a, b]) => privateDict(dictionary(a, b).get(18)));
		}
		if (dict.has(0x0c25)) {
			const offset = dict.get(0x0c25)[0], format = view.u8(offset);
			if (format === 0) {
				view.range(offset + 1, glyphCount);
				for (let g = 0; g < glyphCount; g++)
					if (view.u8(offset + 1 + g) >= fdCount)
						addIssue(ctx.issues, 'error', 'CFF_FDSELECT_STRUCTURE_INVALID',
							'FDSelect selects a missing font dictionary.', ctx.location(`fonts.${i}.fdSelect.${g}`));
			} else if (format === 3 || (cff2 && format === 4)) {
				const wide = format === 4, countSize = wide ? 4 : 2, stride = wide ? 6 : 3;
				const count = wide ? view.u32(offset + 1) : view.u16(offset + 1);
				ctx.limits.consume(count);
				const ranges = offset + 1 + countSize;
				view.range(ranges, count * stride + countSize);
				let previous = -1;
				for (let r = 0; r <= count; r++) {
					const first = wide ? view.u32(ranges + r * stride) : view.u16(ranges + r * stride);
					if (first <= previous || (r === 0 && first !== 0) || first > glyphCount ||
						(r === count && first !== glyphCount))
						throw new RangeError('CFF FDSelect ranges must begin at zero, increase, and end at numGlyphs.');
					if (r < count) {
						const fd = wide ? view.u16(ranges + r * stride + 4) : view.u8(ranges + r * stride + 2);
						if (fd >= fdCount)
							addIssue(ctx.issues, 'error', 'CFF_FDSELECT_STRUCTURE_INVALID',
								'FDSelect range selects a missing font dictionary.', ctx.location(`fonts.${i}.fdSelect.ranges.${r}`));
					}
					previous = first;
				}
			} else {
				ctx.unsupported(`fonts.${i}.fdSelect`, `FDSelect format ${format} is not valid for this CFF version.`);
				throw new RangeError('Unsupported CFF FDSelect format.');
			}
		}
		if (cff2 && dict.has(24)) {
			const offset = dict.get(24)[0], size = view.u16(offset);
			view.range(offset + 2, size);
		}
		if (!cff2) {
			const charset = dict.get(15)?.[0] ?? 0;
			const sids = new Set([0]);
			if (charset > 2) {
				const format = view.u8(charset);
				if (![0, 1, 2].includes(format)) throw new RangeError('Unsupported CFF charset format.');
				let cursor = charset + 1, covered = 1;
				while (covered < glyphCount) {
					const first = view.u16(cursor); cursor += 2;
					const left = format === 0 ? 0 : format === 1 ? view.u8(cursor++) : view.u16(cursor);
					if (format === 2) cursor += 2;
					if (covered + left + 1 > glyphCount || first + left > 65535)
						throw new RangeError('CFF charset range exceeds its glyph count or SID/CID bounds.');
					ctx.limits.consume(left + 1);
					for (let sid = first; sid <= first + left; sid++) {
						if (!dict.has(0x0c1e) && sid >= 391 + stringCount)
							addIssue(ctx.issues, 'error', 'CFF_CHARSET_REFERENCE_INVALID',
								'Charset SID references a missing custom string.', ctx.location(`fonts.${i}.charset.${covered}`));
						sids.add(sid);
						covered++;
					}
				}
			}
			const encoding = dict.get(16)?.[0] ?? 0;
			if (encoding > 1) {
				const format = view.u8(encoding), codes = new Set(), ranges = view.u8(encoding + 1);
				if ((format & 0x7f) > 1) throw new RangeError('Unsupported CFF encoding format.');
				let cursor = encoding + 2, encoded = 0;
				for (let r = 0; r < ranges; r++) {
					const first = view.u8(cursor++), left = format & 1 ? view.u8(cursor++) : 0;
					ctx.limits.consume(left + 1);
					for (let code = first; code <= first + left; code++) {
						if (code > 255 || codes.has(code))
							addIssue(ctx.issues, 'error', 'CFF_ENCODING_INVALID',
								'CFF encoding codes overlap or exceed 255.', ctx.location(`fonts.${i}.encoding.${r}`));
						codes.add(code); encoded++;
					}
				}
				if (encoded >= glyphCount)
					addIssue(ctx.issues, 'error', 'CFF_ENCODING_INVALID', 'Encoding contains more codes than non-.notdef glyphs.', ctx.location(`fonts.${i}.encoding`));
				if (format & 0x80) {
					const supplements = view.u8(cursor++);
					for (let r = 0; r < supplements; r++) {
						const code = view.u8(cursor++), sid = view.u16(cursor); cursor += 2;
						if (codes.has(code) || (charset > 2 && !sids.has(sid)))
							addIssue(ctx.issues, 'error', 'CFF_ENCODING_INVALID',
								'Encoding supplement duplicates a code or references an absent charset SID.', ctx.location(`fonts.${i}.encoding.supplements.${r}`));
						codes.add(code);
					}
				}
			}
		}
	});
	if (!cff2) ctx.each(value.fonts, (font, i) => {
		if (Array.isArray(font.charset)) {
			ctx.parallel(font.charset.length, Math.max(0, font.charStrings.length - 1), `fonts.${i}.charset`);
			const seen = new Set();
			ctx.each(font.charset, (sid, j) => {
				if (seen.has(sid))
					addIssue(ctx.issues, 'error', 'CFF_CHARSET_DUPLICATE',
						'Charset maps multiple glyphs to the same SID/CID.', ctx.location(`fonts.${i}.charset.${j}`));
				seen.add(sid);
			});
		}
	});
}
