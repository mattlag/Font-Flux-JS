import { parseHmtx } from '../sfnt/table_hmtx.js';
import { parseMaxp } from '../sfnt/table_maxp.js';
import { parseVmtx } from '../sfnt/table_vmtx.js';
import { parseGlyf, writeGlyfComputeOffsets } from '../ttf/table_glyf.js';
import { parseLoca } from '../ttf/table_loca.js';
import { dataView as view } from './repair-data.js';

export { view };

export function need(payloads, tag, length = 0) {
	const bytes = payloads.get(tag);
	if (!(bytes instanceof Uint8Array) || bytes.length < length)
		throw new Error(`Missing or truncated ${tag}; authoritative source data is required.`);
	return bytes;
}

export function integer(value, min, max, label) {
	if (!Number.isInteger(value) || value < min || value > max)
		throw new Error(`${label} must be an integer in [${min}, ${max}].`);
	return value;
}

export function same(a, b) {
	return a?.length === b?.length && a.every((value, i) => value === b[i]);
}

export function semanticEqual(a, b) {
	if (a === b) return true;
	if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const keys = Object.keys(a);
	return keys.length === Object.keys(b).length &&
		keys.every((key) => Object.hasOwn(b, key) && semanticEqual(a[key], b[key]));
}

export function maskedEqual(a, b, ranges = []) {
	return a?.length === b?.length && a.every((value, i) =>
		ranges.some(([start, end]) => i >= start && i < end) || value === b[i]);
}

const VARIABLE = ['fvar', 'gvar', 'cvar', 'avar', 'HVAR', 'VVAR', 'MVAR', 'VARC', 'CFF2'];
// Only tables with no glyph-point, device-metric, or byte-offset dependencies.
const EDIT_SAFE = new Set([
	'head', 'maxp', 'loca', 'glyf', 'hhea', 'hmtx', 'vhea', 'vmtx', 'OS/2',
	'name', 'cmap', 'post', 'gasp', 'fpgm', 'prep', 'cvt ', 'DSIG',
	'GSUB', 'kern', 'COLR', 'CPAL', 'SVG ', 'meta', 'STAT',
]);

export function staticOnly(payloads) {
	const tag = VARIABLE.find((tag) => payloads.has(tag));
	if (tag) throw new Error(`Unsupported variable geometry dependency ${tag}; source-aware variation repair is required.`);
}

function editGuard(payloads, topology) {
	staticOnly(payloads);
	for (const tag of payloads.keys()) {
		if (!EDIT_SAFE.has(tag) && !(topology === false &&
			['GDEF', 'GPOS', 'BASE', 'JSTF', 'MATH'].includes(tag)))
			throw new Error(`Unsupported point-index, device-metric or opaque dependency ${tag}.`);
	}
}

function limits(options) {
	return {
		points: integer(options.maxRepairPoints ?? 1000000, 1, 10000000, 'maxRepairPoints'),
		depth: integer(options.maxRepairDepth ?? 64, 1, 64, 'maxRepairDepth'),
	};
}

function glyphLayout(bytes, start, end) {
	if (start === end) return null;
	const v = view(bytes);
	const requireBytes = (position, count) => {
		if (position + count > end) throw new Error('Truncated glyph structure.');
	};
	requireBytes(start, 10);
	const count = v.getInt16(start);
	let pos = start + 10;
	const componentFlags = [];
	let instructionOffset;
	let firstFlag;
	if (count >= 0) {
		requireBytes(pos, count * 2 + 2);
		const points = count ? v.getUint16(pos + count * 2 - 2) + 1 : 0;
		pos += count * 2;
		instructionOffset = pos;
		pos += 2 + v.getUint16(pos);
		requireBytes(pos, 0);
		firstFlag = points ? pos : undefined;
		let total = 0;
		let coordinates = 0;
		while (total < points) {
			requireBytes(pos, 1);
			const flag = bytes[pos++];
			if (flag & 0x80) throw new Error('Unsupported reserved simple glyph flags.');
			let run = 1;
			if (flag & 8) {
				requireBytes(pos, 1);
				run += bytes[pos++];
			}
			total += run;
			if (total > points) throw new Error('Glyph flag repeat exceeds point count.');
			coordinates += run * ((flag & 2 ? 1 : flag & 16 ? 0 : 2) +
				(flag & 4 ? 1 : flag & 32 ? 0 : 2));
		}
		requireBytes(pos, coordinates);
		pos += coordinates;
	} else {
		if (count !== -1) throw new Error('Unsupported composite contour count.');
		let flag;
		let hasInstructions = false;
		do {
			requireBytes(pos, 4);
			flag = v.getUint16(pos);
			if (flag & ~0x1fef) throw new Error('Unsupported reserved composite flags.');
			if ([8, 64, 128].filter((bit) => flag & bit).length > 1 ||
				(flag & 0x1800) === 0x1800)
				throw new Error('Contradictory composite transforms or offsets.');
			componentFlags.push(pos);
			hasInstructions ||= Boolean(flag & 256);
			pos += 4 + (flag & 1 ? 4 : 2) + (flag & 8 ? 2 : flag & 64 ? 4 : flag & 128 ? 8 : 0);
			requireBytes(pos, 0);
		} while (flag & 32);
		if (hasInstructions) {
			requireBytes(pos, 2);
			instructionOffset = pos;
			pos += 2 + v.getUint16(pos);
			requireBytes(pos, 0);
		}
	}
	return { start, end, instructionOffset, firstFlag, componentFlags, contentEnd: pos };
}

export function readTT(payloads, options = {}) {
	const head = need(payloads, 'head', 54);
	const maxpVersion = view(need(payloads, 'maxp', 6)).getUint32(0);
	if (maxpVersion === 0x5000)
		throw new Error('TrueType maxp 0.5 cannot be promoted without authoritative VM-dependent maxima; source data is required.');
	if (maxpVersion !== 0x10000)
		throw new Error('Unknown maxp version; future or opaque layouts must not be downgraded.');
	const maxp = parseMaxp(need(payloads, 'maxp', 32));
	if (maxp.version !== 0x10000 || !maxp.numGlyphs)
		throw new Error('A complete TrueType maxp version 1 with nonzero glyph count is required.');
	if (payloads.has('CFF ') || payloads.has('CFF2'))
		throw new Error('Mixed outline representations are unsupported.');
	const format = view(head).getInt16(50);
	if (format !== 0 && format !== 1) throw new Error('Unsupported loca format; offsets cannot be guessed.');
	const loca = need(payloads, 'loca', (maxp.numGlyphs + 1) * (format ? 4 : 2));
	const offsets = parseLoca(loca, { head: { indexToLocFormat: format }, maxp }).offsets;
	const bytes = need(payloads, 'glyf');
	const { points, depth } = limits(options);
	const glyphs = parseGlyf(bytes, { loca: { offsets }, maxp }, { maxPoints: points }).glyphs;
	const layouts = glyphs.map((_, i) => glyphLayout(bytes, offsets[i], offsets[i + 1]));
	const measured = new Map();
	const active = new Set();
	let spent = 0;
	function resolve(index, level = 0) {
		if (level > depth || active.has(index)) throw new Error('Cyclic or excessive composite nesting.');
		if (measured.has(index)) {
			const result = measured.get(index);
			if (level + result.depth > depth) throw new Error('Excessive composite nesting.');
			return result;
		}
		if (index < 0 || index >= glyphs.length) throw new Error('Missing component glyph.');
		active.add(index);
		const glyph = glyphs[index];
		let contours = glyph?.contours ?? [];
		let nesting = 0;
		if (glyph?.type === 'composite') {
			contours = [];
			const parentPoints = [];
			for (const component of glyph.components) {
				const child = resolve(component.glyphIndex, level + 1);
				nesting = Math.max(nesting, child.depth + 1);
				const transform = component.transform ?? {};
				const a = transform.scale ?? transform.xScale ?? 1;
				const b = transform.scale01 ?? 0;
				const c = transform.scale10 ?? 0;
				const d = transform.scale ?? transform.yScale ?? 1;
				const flags = component.flags;
				let dx = 0;
				let dy = 0;
				if (flags.argsAreXYValues) {
					dx = component.argument1;
					dy = component.argument2;
					if (flags.scaledComponentOffset) [dx, dy] = [a * dx + c * dy, b * dx + d * dy];
					else if (!flags.unscaledComponentOffset && (dx || dy) &&
						(a !== 1 || b !== 0 || c !== 0 || d !== 1))
						throw new Error('Ambiguous transformed component offset; platform intent is required.');
					if (flags.roundXYToGrid) {
						dx = Math.round(dx);
						dy = Math.round(dy);
					}
				} else {
					const parent = parentPoints[component.argument1];
					const point = child.contours.flat()[component.argument2];
					if (!parent || !point) throw new Error('Invalid composite point attachment.');
					dx = parent.x - a * point.x - c * point.y;
					dy = parent.y - b * point.x - d * point.y;
				}
				for (const contour of child.contours) {
					spent += contour.length;
					if (spent > points) throw new Error('Expanded geometry exceeds maxRepairPoints.');
					const transformed = contour.map((point) => ({
						x: a * point.x + c * point.y + dx,
						y: b * point.x + d * point.y + dy,
						onCurve: point.onCurve,
					}));
					contours.push(transformed);
					for (const point of transformed) parentPoints.push(point);
				}
			}
		}
		let pointCount = 0;
		const bounds = [Infinity, Infinity, -Infinity, -Infinity];
		for (const contour of contours) {
			pointCount += contour.length;
			for (const { x, y } of contour) {
				if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Nonfinite glyph geometry.');
				bounds[0] = Math.min(bounds[0], x);
				bounds[1] = Math.min(bounds[1], y);
				bounds[2] = Math.max(bounds[2], x);
				bounds[3] = Math.max(bounds[3], y);
			}
		}
		if (!pointCount) bounds.fill(0);
		else {
			bounds[0] = Math.floor(bounds[0]);
			bounds[1] = Math.floor(bounds[1]);
			bounds[2] = Math.ceil(bounds[2]);
			bounds[3] = Math.ceil(bounds[3]);
		}
		for (const value of bounds) integer(value, -32768, 32767, 'Glyph bounds');
		integer(pointCount, 0, 65535, 'Expanded glyph point count');
		integer(contours.length, 0, 65535, 'Expanded contour count');
		const result = { contours, points: pointCount, bounds, depth: nesting };
		active.delete(index);
		measured.set(index, result);
		return result;
	}
	const geometry = glyphs.map((_, index) => resolve(index));
	return { glyphs, geometry, offsets, layouts, format, maxp };
}

function fontBounds(tt) {
	const bounds = [Infinity, Infinity, -Infinity, -Infinity];
	for (const glyph of tt.geometry) {
		if (!glyph.points) continue;
		bounds[0] = Math.min(bounds[0], glyph.bounds[0]);
		bounds[1] = Math.min(bounds[1], glyph.bounds[1]);
		bounds[2] = Math.max(bounds[2], glyph.bounds[2]);
		bounds[3] = Math.max(bounds[3], glyph.bounds[3]);
	}
	return bounds[0] === Infinity ? [0, 0, 0, 0] : bounds;
}

function updateBounds(payloads, tt) {
	setFields(payloads, 'head', fontBounds(tt).map((value, i) => [36 + i * 2, value]));
	const fields = [];
	tt.layouts.forEach((layout, i) => {
		if (layout) tt.geometry[i].bounds.forEach((value, n) => fields.push([layout.start + 2 + n * 2, value]));
	});
	setFields(payloads, 'glyf', fields);
}

function geometricMaxp(tt) {
	const fields = new Map([[6, 0], [8, 0], [10, 0], [12, 0], [26, 0], [28, 0], [30, 0]]);
	tt.glyphs.forEach((glyph, index) => {
		if (!glyph) return;
		const g = tt.geometry[index];
		const composite = glyph.type === 'composite';
		for (const [offset, value] of [
			[composite ? 10 : 6, g.points], [composite ? 12 : 8, g.contours.length],
			[26, glyph.instructions.length], [28, glyph.components?.length ?? 0], [30, g.depth],
		]) fields.set(offset, Math.max(fields.get(offset), value));
	});
	for (const value of fields.values()) integer(value, 0, 65535, 'Geometric maxp field');
	return fields;
}

export function readMetrics(payloads, vertical = false) {
	const tag = vertical ? 'vmtx' : 'hmtx';
	const headerTag = vertical ? 'vhea' : 'hhea';
	const count = view(need(payloads, 'maxp', 6)).getUint16(4);
	const header = need(payloads, headerTag, 36);
	const headerVersion = view(header).getUint32(0);
	if (headerVersion !== 0x10000 && !(vertical && headerVersion === 0x11000))
		throw new Error(`Unsupported ${headerTag} version.`);
	const longCount = view(header).getUint16(34);
	if (!longCount || longCount > count) throw new Error(`${tag} count is not authoritative; missing records cannot be guessed.`);
	const bytes = need(payloads, tag, count * 2 + longCount * 2);
	const parsed = vertical ? parseVmtx(bytes, {
		maxp: { numGlyphs: count }, vhea: { numOfLongVerMetrics: longCount },
	}) : parseHmtx(bytes, {
		maxp: { numGlyphs: count }, hhea: { numberOfHMetrics: longCount },
	});
	const full = vertical ? parsed.vMetrics : parsed.hMetrics;
	const trailing = vertical ? parsed.topSideBearings : parsed.leftSideBearings;
	const records = full.map((metric) => [
		vertical ? metric.advanceHeight : metric.advanceWidth,
		vertical ? metric.topSideBearing : metric.lsb,
	]);
	for (const bearing of trailing) records.push([records[records.length - 1][0], bearing]);
	return { tag, headerTag, records, longCount, length: count * 2 + longCount * 2 };
}

function extrema(tt, metrics, vertical) {
	let advance = 0;
	let minBearing = Infinity;
	let minOther = Infinity;
	let maxExtent = -Infinity;
	metrics.records.forEach(([width, bearing], i) => {
		advance = Math.max(advance, width);
		const glyph = tt.geometry[i];
		if (!glyph.points) return;
		const size = vertical ? glyph.bounds[3] - glyph.bounds[1] : glyph.bounds[2] - glyph.bounds[0];
		minBearing = Math.min(minBearing, bearing);
		minOther = Math.min(minOther, width - bearing - size);
		maxExtent = Math.max(maxExtent, bearing + size);
	});
	const result = [advance, minBearing, minOther, maxExtent].map((n) => Number.isFinite(n) ? n : 0);
	result.slice(1).forEach((value) => integer(value, -32768, 32767, 'Metric extrema'));
	return result;
}

export function derivedMetricExtrema(payloads, vertical = false, options = {}) {
	staticOnly(payloads);
	return extrema(readTT(payloads, options), readMetrics(payloads, vertical), vertical);
}

function setFields(payloads, tag, fields) {
	const bytes = need(payloads, tag).slice();
	const v = view(bytes);
	for (const [offset, value] of fields) v.setUint16(offset, value);
	payloads.set(tag, bytes);
}

function compactCount(records) {
	let count = records.length;
	while (count > 1 && records[count - 1][0] === records[count - 2][0]) count--;
	return count;
}

function writeOffsets(payloads, offsets, format) {
	const bytes = new Uint8Array(offsets.length * (format ? 4 : 2));
	const v = view(bytes);
	offsets.forEach((offset, index) => {
		integer(offset, 0, format ? 0xffffffff : 131070, 'loca offset');
		if (!format && offset % 2) throw new Error('Short loca requires even glyph offsets.');
		if (format) v.setUint32(index * 4, offset);
		else v.setUint16(index * 2, offset / 2);
	});
	payloads.set('loca', bytes);
	setFields(payloads, 'head', [[50, format]]);
}

function rebuildGlyphs(payloads, tt, parts) {
	const original = need(payloads, 'glyf');
	if (tt.offsets[0] !== 0 || tt.offsets.at(-1) !== original.length ||
		need(payloads, 'loca').length !== tt.offsets.length * (tt.format ? 4 : 2))
		throw new Error('Unreferenced glyf/loca bytes block relocation.');
	const offsets = [0];
	let length = 0;
	for (const part of parts) {
		length += part.length + part.length % 2;
		if (length > 0xffffffff) throw new Error('glyf offsets exceed uint32.');
		offsets.push(length);
	}
	const output = new Uint8Array(length);
	parts.forEach((part, i) => output.set(part, offsets[i]));
	payloads.set('glyf', output);
	writeOffsets(payloads, offsets, tt.format || length > 131070 ? 1 : 0);
}

function dehintPart(raw, layout) {
	if (!layout) return raw.slice();
	const offset = layout.instructionOffset;
	const bytes = raw.slice();
	const v = view(bytes);
	for (const absolute of layout.componentFlags) {
		const relative = absolute - layout.start;
		v.setUint16(relative, v.getUint16(relative) & ~256);
	}
	if (offset === undefined) return bytes;
	const pos = offset - layout.start;
	const length = v.getUint16(pos);
	// Simple glyphs retain the mandatory instructionLength; composites do not.
	const removeStart = layout.componentFlags.length ? pos : pos + 2;
	const removeEnd = pos + 2 + length;
	const result = new Uint8Array(bytes.length - (removeEnd - removeStart));
	result.set(bytes.subarray(0, removeStart));
	result.set(bytes.subarray(removeEnd), removeStart);
	if (!layout.componentFlags.length) view(result).setUint16(pos, 0);
	return result;
}

function selectedGlyph(tt, values) {
	return integer(values.glyphIndex, 0, tt.glyphs.length - 1, 'glyphIndex');
}

function decomposed(tt, index) {
	const glyph = tt.glyphs[index];
	if (glyph?.type !== 'composite') throw new Error('Select a nonempty composite glyph.');
	const visited = new Set();
	function inspect(id) {
		if (visited.has(id)) return;
		visited.add(id);
		for (const component of tt.glyphs[id]?.components ?? []) {
			if (component.flags.useMyMetrics) throw new Error('USE_MY_METRICS requires source-aware phantom-point reconciliation.');
			inspect(component.glyphIndex);
		}
	}
	inspect(index);
	const contours = tt.geometry[index].contours.map((contour) =>
		contour.map((point) => ({ ...point, x: Math.round(point.x), y: Math.round(point.y) })));
	integer(contours.length, 0, 32767, 'Simple contour count');
	let previous = { x: 0, y: 0 };
	for (const contour of contours) for (const point of contour) {
		integer(point.x - previous.x, -32768, 32767, 'Encoded X delta');
		integer(point.y - previous.y, -32768, 32767, 'Encoded Y delta');
		previous = point;
	}
	const points = contours.flat();
	const box = points.length ? [
		Math.min(...points.map((p) => p.x)), Math.min(...points.map((p) => p.y)),
		Math.max(...points.map((p) => p.x)), Math.max(...points.map((p) => p.y)),
	] : [0, 0, 0, 0];
	return { type: 'simple', contours, instructions: [], overlapSimple: true,
		xMin: box[0], yMin: box[1], xMax: box[2], yMax: box[3] };
}

export function applyTT(step, payloads, options = {}) {
	const { id, values = {} } = step;
	if (id.endsWith('.compact')) {
		const metrics = readMetrics(payloads, id.startsWith('v'));
		const count = compactCount(metrics.records);
		const original = need(payloads, metrics.tag);
		const tail = original.subarray(metrics.length);
		const bytes = new Uint8Array(metrics.records.length * 2 + count * 2 + tail.length);
		const v = view(bytes);
		let pos = 0;
		metrics.records.forEach(([advance, bearing], i) => {
			if (i < count) { v.setUint16(pos, advance); pos += 2; }
			v.setInt16(pos, bearing); pos += 2;
		});
		bytes.set(tail, pos);
		payloads.set(metrics.tag, bytes);
		setFields(payloads, metrics.headerTag, [[34, count]]);
		return;
	}
	const tt = readTT(payloads, options);
	if (['tt.bounds', 'hhea.extrema', 'vhea.extrema'].includes(id)) staticOnly(payloads);
	if (id === 'tt.bounds') {
		updateBounds(payloads, tt);
	} else if (id === 'tt.maxp-geometry') {
		// Counts are representation-derived; no TrueType VM maxima are inferred.
		setFields(payloads, 'maxp', geometricMaxp(tt));
	} else if (id.endsWith('.extrema')) {
		const vertical = id === 'vhea.extrema';
		const metrics = readMetrics(payloads, vertical);
		setFields(payloads, metrics.headerTag, extrema(tt, metrics, vertical).map((value, i) => [10 + i * 2, value]));
	} else if (id === 'tt.loca-format') {
		if (!['short', 'long'].includes(values.format)) throw new Error('format must be short or long.');
		if (need(payloads, 'loca').length !== tt.offsets.length * (tt.format ? 4 : 2))
			throw new Error('Opaque trailing loca bytes block format conversion.');
		writeOffsets(payloads, tt.offsets, values.format === 'long' ? 1 : 0);
	} else if (id === 'tt.dehint') {
		editGuard(payloads, false);
		const raw = need(payloads, 'glyf');
		rebuildGlyphs(payloads, tt, tt.glyphs.map((_, i) =>
			dehintPart(raw.subarray(tt.offsets[i], tt.offsets[i + 1]), tt.layouts[i])));
		for (const tag of ['fpgm', 'prep', 'cvt ']) payloads.delete(tag);
		setFields(payloads, 'maxp', [[26, 0]]);
	} else if (id === 'tt.decompose') {
		editGuard(payloads, true);
		if (['fpgm', 'prep', 'cvt '].some((tag) => payloads.has(tag)) ||
			tt.glyphs.some((glyph) => glyph?.instructions.length))
			throw new Error('Decomposition requires an explicitly dehinted candidate first.');
		const index = selectedGlyph(tt, values);
		const glyph = decomposed(tt, index);
		const raw = need(payloads, 'glyf');
		const parts = tt.glyphs.map((_, i) => raw.subarray(tt.offsets[i], tt.offsets[i + 1]));
		const encoded = Uint8Array.from(writeGlyfComputeOffsets({ glyphs: [glyph] }).bytes);
		const contentEnd = glyphLayout(encoded, 0, encoded.length).contentEnd;
		const suffix = raw.subarray(tt.layouts[index].contentEnd, tt.offsets[index + 1]);
		parts[index] = new Uint8Array(contentEnd + suffix.length);
		parts[index].set(encoded.subarray(0, contentEnd));
		parts[index].set(suffix, contentEnd);
		rebuildGlyphs(payloads, tt, parts);
		const after = readTT(payloads, options);
		setFields(payloads, 'maxp', geometricMaxp(after));
		updateBounds(payloads, after);
		for (const vertical of [false, true]) {
			const header = vertical ? 'vhea' : 'hhea';
			const tag = vertical ? 'vmtx' : 'hmtx';
			if (!payloads.has(header) && !payloads.has(tag)) continue;
			const metrics = readMetrics(payloads, vertical);
			setFields(payloads, header, extrema(after, metrics, vertical).map((value, i) => [10 + i * 2, value]));
		}
	} else if (id === 'tt.overlap-flag') {
		staticOnly(payloads);
		const index = selectedGlyph(tt, values);
		if (typeof values.overlap !== 'boolean') throw new Error('overlap must be boolean.');
		const layout = tt.layouts[index];
		if (!layout || (layout.firstFlag === undefined && !layout.componentFlags.length))
			throw new Error('An empty glyph has no overlap flag.');
		const bytes = need(payloads, 'glyf').slice();
		if (layout.componentFlags.length) {
			const offset = layout.componentFlags[0];
			const v = view(bytes);
			v.setUint16(offset, (v.getUint16(offset) & ~1024) | (values.overlap ? 1024 : 0));
		} else bytes[layout.firstFlag] = (bytes[layout.firstFlag] & ~64) | (values.overlap ? 64 : 0);
		payloads.set('glyf', bytes);
	} else throw new Error(`Unknown TrueType repair: ${id}`);
}

export function inspectTT(payloads, options = {}) {
	const issues = [];
	if (!payloads.has('glyf')) return issues;
	let tt;
	try { tt = readTT(payloads, options); } catch { return issues; }
	function mismatch(code, table, message) {
		issues.push({ severity: 'warning', code, message, location: { table } });
	}
	try {
		const maxp = view(need(payloads, 'maxp'));
		if ([...geometricMaxp(tt)].some(([offset, value]) => maxp.getUint16(offset) !== value))
			mismatch('TT_DERIVED_MAXP_MISMATCH', 'maxp', 'Geometric maxp fields disagree with complete glyph data; VM-dependent maxima are not inferred.');
	} catch { /* inspectDerivedRepairCoverage reports blocked/overflow evidence. */ }
	try {
		staticOnly(payloads);
		const head = view(need(payloads, 'head'));
		const glyphBoundsWrong = tt.glyphs.some((glyph, i) => glyph &&
			['xMin', 'yMin', 'xMax', 'yMax'].some((key, j) => glyph[key] !== tt.geometry[i].bounds[j]));
		if (glyphBoundsWrong || fontBounds(tt).some((value, i) => head.getInt16(36 + i * 2) !== value))
			mismatch('TT_DERIVED_BOUNDS_MISMATCH', 'glyf', 'Stored bounds disagree with the static TrueType control-point hull.');
		for (const vertical of [false, true]) {
			try {
				const metrics = readMetrics(payloads, vertical);
				const header = view(need(payloads, metrics.headerTag));
				if (extrema(tt, metrics, vertical).some((value, i) =>
					(i ? header.getInt16(10 + i * 2) : header.getUint16(10)) !== value))
					mismatch(vertical ? 'VHEA_DERIVED_EXTREMA_MISMATCH' : 'HHEA_DERIVED_EXTREMA_MISMATCH',
						metrics.headerTag, 'Metric extrema disagree with complete static geometry and stored advances/bearings.');
			} catch { /* Missing or unsupported metrics are not repairable findings. */ }
		}
	} catch { /* Default-instance bounds are not all-instance bounds. */ }
	return issues;
}

export function verifyTT(before, after, steps, options = {}) {
	const ids = new Set(steps.map((step) => step.id));
	const failures = [];
	const handled = new Set();
	const masks = new Map();
	function allow(tag, start, end) {
		handled.add(tag);
		if (!masks.has(tag)) masks.set(tag, []);
		masks.get(tag).push([start, end]);
	}
	function check(ok, text) { if (!ok) failures.push(text); }
	const needsGlyphs = steps.some((step) => !step.id.endsWith('.compact'));
	const old = needsGlyphs ? readTT(before, options) : null;
	const now = needsGlyphs ? readTT(after, options) : null;
	if (old) check(old.glyphs.length === now.glyphs.length, 'Glyph count/order changed.');
	const rebuilt = ids.has('tt.dehint') || ids.has('tt.decompose');
	const decomposedIDs = new Set(steps.filter((step) => step.id === 'tt.decompose').map((step) => step.values.glyphIndex));
	const overlap = new Map(steps.filter((step) => step.id === 'tt.overlap-flag').map((step) => [step.values.glyphIndex, step.values.overlap]));
	const updateGeometry = ids.has('tt.bounds') || ids.has('tt.decompose');
	if (updateGeometry) {
		allow('head', 36, 44);
		const v = view(need(after, 'head'));
		check(fontBounds(now).every((n, i) => n === v.getInt16(36 + i * 2)), 'Incorrect font bounds.');
		now.glyphs.forEach((glyph, i) => {
			if (!glyph) return;
			check(['xMin', 'yMin', 'xMax', 'yMax'].every((key, j) => glyph[key] === now.geometry[i].bounds[j]),
				`Incorrect glyph ${i} bounds.`);
			allow('glyf', now.offsets[i] + 2, now.offsets[i] + 10);
		});
	}
	if (ids.has('tt.maxp-geometry') || ids.has('tt.decompose')) {
		const v = view(need(after, 'maxp'));
		for (const [offset, value] of geometricMaxp(now)) {
			allow('maxp', offset, offset + 2);
			check(v.getUint16(offset) === value, `Incorrect maxp field ${offset}.`);
		}
	}
	if (ids.has('tt.dehint')) {
		allow('maxp', 26, 28);
		check(view(need(after, 'maxp')).getUint16(26) === 0, 'Glyph instruction maximum was not cleared.');
		for (const tag of ['fpgm', 'prep', 'cvt ']) {
			handled.add(tag);
			check(!after.has(tag), `${tag} remains after dehinting.`);
		}
	}
	if (rebuilt || ids.has('tt.loca-format')) {
		handled.add('loca');
		allow('head', 50, 52);
		if (!rebuilt) check(same(old.offsets, now.offsets), 'loca format conversion moved glyphs.');
		const explicit = steps.filter((step) => step.id === 'tt.loca-format').at(-1);
		if (explicit) check(now.format === (explicit.values.format === 'long' ? 1 : 0), 'Wrong requested loca format.');
		check(need(after, 'loca').length === now.offsets.length * (now.format ? 4 : 2), 'Unexpected loca suffix.');
	}
	if (rebuilt) {
		handled.add('glyf');
		check(now.offsets[0] === 0 && now.offsets.at(-1) === need(after, 'glyf').length, 'Unreferenced rebuilt glyph bytes.');
	}
	if (old && (rebuilt || overlap.size)) {
		handled.add('glyf');
		old.glyphs.forEach((glyph, i) => {
			const current = now.glyphs[i];
			if (!glyph || !current) {
				check(glyph === current, `Empty glyph ${i} changed.`);
				return;
			}
			const expected = structuredClone(decomposedIDs.has(i) ? decomposed(old, i) : glyph);
			if (ids.has('tt.dehint')) {
				expected.instructions = [];
				for (const component of expected.components ?? []) delete component.flags.weHaveInstructions;
			}
			if (overlap.has(i)) {
				if (expected.type === 'simple') expected.overlapSimple = overlap.get(i);
				else if (overlap.get(i)) expected.components[0].flags.overlapCompound = true;
				else delete expected.components[0].flags.overlapCompound;
			}
			if (updateGeometry) ['xMin', 'yMin', 'xMax', 'yMax'].forEach((key, j) => { expected[key] = now.geometry[i].bounds[j]; });
			check(semanticEqual(expected, current), `Unauthorized glyph ${i} semantic change.`);
			// For non-decomposed glyphs compare original encoded data, not just parsed points.
			if (!decomposedIDs.has(i)) {
				const oldRaw = need(before, 'glyf').subarray(old.offsets[i], old.offsets[i + 1]);
				const stripped = ids.has('tt.dehint') ? dehintPart(oldRaw, old.layouts[i]) : oldRaw;
				const newRaw = need(after, 'glyf').subarray(now.offsets[i], now.offsets[i + 1]);
				const ranges = updateGeometry ? [[2, 10]] : [];
				if (overlap.has(i)) {
					const layout = now.layouts[i];
					const offset = layout.componentFlags.length ? layout.componentFlags[0] : layout.firstFlag;
					const relative = offset - layout.start;
					const composite = layout.componentFlags.length > 0;
					ranges.push([relative, relative + (composite ? 2 : 1)]);
					const left = composite ? view(stripped).getUint16(relative) : stripped[relative];
					const right = composite ? view(newRaw).getUint16(relative) : newRaw[relative];
					check(((left ^ right) & ~(composite ? 1024 : 64)) === 0, `Glyph ${i} non-overlap flags changed.`);
				}
				check(newRaw.length === stripped.length + (rebuilt ? stripped.length % 2 : 0) &&
					maskedEqual(stripped, newRaw.subarray(0, stripped.length), ranges) &&
					(newRaw.length === stripped.length || newRaw.at(-1) === 0), `Glyph ${i} encoded bytes/padding changed.`);
			} else {
				const oldSuffix = need(before, 'glyf').subarray(old.layouts[i].contentEnd, old.offsets[i + 1]);
				const newSuffix = need(after, 'glyf').subarray(now.layouts[i].contentEnd, now.offsets[i + 1]);
				const padding = (now.layouts[i].contentEnd - now.layouts[i].start + oldSuffix.length) % 2;
				check(newSuffix.length === oldSuffix.length + padding &&
					same(oldSuffix, newSuffix.subarray(0, oldSuffix.length)) &&
					(!padding || newSuffix.at(-1) === 0), `Glyph ${i} opaque suffix changed during decomposition.`);
			}
		});
	}
	for (const vertical of [false, true]) {
		const header = vertical ? 'vhea' : 'hhea';
		const tag = vertical ? 'vmtx' : 'hmtx';
		const updateExtrema = ids.has(`${header}.extrema`) ||
			ids.has('tt.decompose') && (before.has(header) || before.has(tag));
		if (updateExtrema || ids.has(`${tag}.compact`)) {
			const previous = readMetrics(before, vertical);
			const metrics = readMetrics(after, vertical);
			check(JSON.stringify(previous.records) === JSON.stringify(metrics.records), `${tag} advances or bearings changed.`);
			if (updateExtrema) {
				allow(header, 10, 18);
				const v = view(need(after, header));
				check(extrema(now, metrics, vertical).every((n, i) => n === (i ? v.getInt16(10 + i * 2) : v.getUint16(10))), `${header} extrema are incorrect.`);
			}
			if (ids.has(`${tag}.compact`)) {
				handled.add(tag);
				allow(header, 34, 36);
				check(metrics.longCount === compactCount(metrics.records), `${tag} is not canonically compact.`);
				check(same(need(before, tag).subarray(previous.length), need(after, tag).subarray(metrics.length)), `${tag} opaque suffix changed.`);
			}
		}
	}
	for (const [tag, ranges] of masks) {
		if (tag === 'glyf' && (rebuilt || overlap.size)) continue;
		if (tag === 'head') ranges.push([8, 12]);
		check(maskedEqual(before.get(tag), after.get(tag), ranges), `Unauthorized ${tag} byte change.`);
	}
	return { failures, handledTags: [...handled] };
}
