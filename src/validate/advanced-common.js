import { StructureLimitError, StructureLimits } from '../structure_limits.js';
import { diagnosticIssue, skipDiagnosticCheck } from './coverage.js';

export function addIssue(issues, severity, code, message, location) {
	diagnosticIssue(issues, severity, code, message, location);
}

export function advancedContext(issues, table, tables, options = {}) {
	const limits = new StructureLimits(options);
	const location = (path, extra = {}) => ({ table, path, ...extra });
	return {
		issues, table, tables, limits, location,
		each(values, callback) {
			limits.consume(values?.length ?? 0);
			(values ?? []).forEach(callback);
		},
		unsupported(path, reason) {
			skipDiagnosticCheck(issues, `binary.advanced.${table}.${path}`,
				'unsupported', 'unsupported-semantics', reason, location(path));
		},
		blocked(path, reason) {
			skipDiagnosticCheck(issues, `binary.advanced.${table}.${path}`,
				'blocked', 'outline-unavailable', reason, location(path));
		},
		glyph(gid, path) {
			const count = tables.maxp?.numGlyphs;
			if (count === undefined) return;
			if (!Number.isInteger(gid) || gid < 0 || gid >= count)
				addIssue(issues, 'error', 'ADVANCED_GLYPH_REFERENCE_INVALID',
					`Glyph ${gid} is outside maxp.numGlyphs (${count}); the intended target requires source.`,
					location(path, { glyphIndex: gid }));
		},
		parallel(actual, expected, path) {
			if (actual !== expected)
				addIssue(issues, 'error', 'ADVANCED_PARALLEL_ARRAY_MISMATCH',
					`Array length ${actual} does not match ${expected}; paired records must not be independently reordered.`,
					location(path));
		},
	};
}

// A component appends its stored contour points, regardless of transform or
// point-attachment mode. Counting this DAG requires no decomposition or VM.
export function outlinePointCount(gid, ctx, path) {
	const glyphs = ctx.tables.glyf?.glyphs;
	if (!glyphs) {
		if (ctx.tables['CFF '] || ctx.tables.CFF2)
			ctx.unsupported(path, 'Contour point numbering for CFF/CFF2 outlines is not implemented; no point indices are inferred.');
		else ctx.blocked(path, 'Contour point indices require a parsed glyf outline.');
		return null;
	}
	ctx.outlinePointCounts ??= new Map();
	const active = new Set();
	const visit = (index, depth) => {
		ctx.limits.consume();
		ctx.limits.checkDepth(depth);
		if (!Number.isInteger(index) || index < 0 || index >= glyphs.length) {
			addIssue(ctx.issues, 'error', 'ADVANCED_GLYPH_REFERENCE_INVALID',
				`Glyph ${index} does not select a parsed outline.`, ctx.location(path, { glyphIndex: index }));
			return null;
		}
		if (active.has(index)) {
			addIssue(ctx.issues, 'error', 'ADVANCED_STRUCTURE_CYCLE',
				'Composite outline point numbering is undefined because its component graph contains a cycle.',
				ctx.location(path, { glyphIndex: index }));
			return null;
		}
		const cached = ctx.outlinePointCounts.get(index);
		if (cached) {
			ctx.limits.checkDepth(depth + cached.height - 1);
			return cached;
		}
		const glyph = glyphs[index];
		let count = 0, height = 1, complete = true;
		active.add(index);
		if (glyph?.type === 'simple') {
			ctx.each(glyph.contours, (contour) => { count += contour.length; });
		} else if (glyph?.type === 'composite') {
			ctx.each(glyph.components, (component) => {
				const child = visit(component.glyphIndex, depth + 1);
				if (!child) { complete = false; return; }
				count += child.count;
				height = Math.max(height, child.height + 1);
				if (!Number.isSafeInteger(count))
					throw new StructureLimitError('Expanded composite point count exceeds exact integer accounting.');
			});
		} else if (glyph && glyph.type !== 'empty') {
			ctx.blocked(path, `Outline kind ${glyph.type} has no supported contour point numbering.`);
			complete = false;
		}
		active.delete(index);
		if (!complete) return null;
		const result = { count, height };
		ctx.outlinePointCounts.set(index, result);
		return result;
	};
	return visit(gid, 1)?.count ?? null;
}

export function walkObjects(root, ctx, callback, path = '') {
	const active = new Set();
	const seen = new Set();
	function visit(value, at, depth) {
		if (!value || typeof value !== 'object') return;
		ctx.limits.consume();
		ctx.limits.checkDepth(depth);
		if (active.has(value)) {
			addIssue(ctx.issues, 'error', 'ADVANCED_STRUCTURE_CYCLE',
				'An active structural reference forms a cycle.', ctx.location(at));
			return;
		}
		if (seen.has(value)) return;
		active.add(value);
		callback(value, at);
		for (const key of Object.keys(value)) {
			ctx.limits.consume();
			if (key === '_raw' || key === 'data' || key === 'imageData') continue;
			visit(value[key], at ? `${at}.${key}` : key, depth + 1);
		}
		active.delete(value);
		seen.add(value);
	}
	visit(root, path, 1);
}

export function coverageGlyphs(coverage, ctx, path) {
	const glyphs = [];
	if (!coverage) return glyphs;
	if (coverage.format === 1) {
		ctx.each(coverage.glyphs, (gid) => glyphs.push(gid));
	} else if (coverage.format === 2) {
		ctx.each(coverage.ranges, (range, index) => {
			if (range.startCoverageIndex !== glyphs.length ||
				range.endGlyphID < range.startGlyphID) {
				addIssue(ctx.issues, 'error', 'ADVANCED_COVERAGE_INVALID',
					'Coverage ranges must be increasing and their coverage indices contiguous.',
					ctx.location(`${path}.ranges.${index}`));
			}
			const count = Math.max(0, range.endGlyphID - range.startGlyphID + 1);
			ctx.limits.consume(count);
			for (let gid = range.startGlyphID; gid <= range.endGlyphID; gid++) glyphs.push(gid);
		});
	} else {
		ctx.unsupported(path, `Coverage format ${coverage.format} is not implemented.`);
	}
	let previous = -1;
	ctx.each(glyphs, (gid, index) => {
		ctx.glyph(gid, `${path}.${index}`);
		if (gid <= previous)
			addIssue(ctx.issues, 'error', 'ADVANCED_COVERAGE_INVALID',
				'Coverage glyphs must be strictly increasing.', ctx.location(`${path}.${index}`));
		previous = gid;
	});
	return glyphs;
}

export function classValues(def, ctx, path) {
	const values = new Set([0]);
	if (!def) return values;
	if (def.format === 1) {
		ctx.each(def.classValues, (value, i) => {
			ctx.glyph(def.startGlyphID + i, `${path}.classValues.${i}`);
			values.add(value);
		});
	} else if (def.format === 2) {
		let previous = -1;
		ctx.each(def.ranges, (range, i) => {
			ctx.glyph(range.startGlyphID, `${path}.ranges.${i}.startGlyphID`);
			ctx.glyph(range.endGlyphID, `${path}.ranges.${i}.endGlyphID`);
			if (range.startGlyphID <= previous || range.startGlyphID > range.endGlyphID)
				addIssue(ctx.issues, 'error', 'ADVANCED_CLASS_RANGE_INVALID',
					'Class definition ranges overlap, are reversed or are unsorted.', ctx.location(`${path}.ranges.${i}`));
			previous = range.endGlyphID;
			values.add(range.class);
		});
	} else ctx.unsupported(path, `ClassDef format ${def.format} is not implemented.`);
	return values;
}

export function variationReference(store, outer, inner, ctx, path) {
	if (outer === 0xffff && inner === 0xffff) return;
	const data = store?.itemVariationData?.[outer];
	if (Number.isInteger(outer) && outer >= 0 && outer < (store?.itemVariationData?.length ?? 0) && data === null)
		return; // A NULL ItemVariationData offset explicitly means no variation.
	if (!Number.isInteger(outer) || outer < 0 || !Number.isInteger(inner) || inner < 0 ||
		!data || inner >= data.itemCount)
		addIssue(ctx.issues, 'error', 'ADVANCED_VARIATION_REFERENCE_INVALID',
			`Variation index ${outer}:${inner} does not select an existing delta set; missing deltas require source.`,
			ctx.location(path));
}

export function deviceReference(device, store, ctx, path) {
	if (!device) return;
	if (device.format === 0x8000) {
		variationReference(store, device.deltaSetOuterIndex, device.deltaSetInnerIndex, ctx, path);
	} else if ([1, 2, 3].includes(device.format)) {
		if (device.endSize < device.startSize ||
			device.deltaValues?.length !== device.endSize - device.startSize + 1)
			addIssue(ctx.issues, 'error', 'ADVANCED_DEVICE_INVALID',
				'Device size range and packed delta count disagree.', ctx.location(path));
	} else ctx.unsupported(path, `Device format ${device.format} is not implemented.`);
}

export class BinaryView {
	constructor(bytes, ctx) {
		this.bytes = bytes;
		this.ctx = ctx;
		this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	}
	range(offset, length) {
		this.ctx.limits.consume();
		if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) ||
			offset < 0 || length < 0 || offset > this.bytes.length - length)
			throw new RangeError(`Truncated or out-of-range structure at table byte ${offset}, length ${length}.`);
	}
	u8(offset) { this.range(offset, 1); return this.view.getUint8(offset); }
	u16(offset) { this.range(offset, 2); return this.view.getUint16(offset); }
	i16(offset) { this.range(offset, 2); return this.view.getInt16(offset); }
	u32(offset) { this.range(offset, 4); return this.view.getUint32(offset); }
	offset(base, field, required = false) {
		const relative = this.u16(base + field);
		if (!relative && required) throw new RangeError(`Required offset is NULL at table byte ${base + field}.`);
		if (!relative) return 0;
		this.range(base + relative, 2);
		return base + relative;
	}
}
