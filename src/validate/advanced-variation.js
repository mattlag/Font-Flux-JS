import { addIssue, BinaryView, variationReference } from './advanced-common.js';

export function validateAdvancedStore(store, ctx, path = 'itemVariationStore') {
	if (!store) return;
	if (store.format !== 1) { ctx.unsupported(path, `Variation store format ${store.format} is not implemented.`); return; }
	const axes = ctx.tables.fvar?.axes?.length;
	const list = store.variationRegionList;
	if (!list) return;
	if (axes !== undefined) ctx.parallel(list.axisCount, axes, `${path}.variationRegionList.axisCount`);
	ctx.each(list.regions, (region, r) => {
		ctx.parallel(region.regionAxes.length, list.axisCount, `${path}.regions.${r}`);
		ctx.each(region.regionAxes, (axis, a) => {
			const { startCoord: start, peakCoord: peak, endCoord: end } = axis;
			if (![start, peak, end].every((v) => Number.isFinite(v) && v >= -1 && v <= 1) ||
				start > peak || peak > end || (start < 0 && end > 0 && peak !== 0))
				addIssue(ctx.issues, 'error', 'VARIATION_REGION_INVALID',
					'Region coordinates must be normalized, ordered and must not cross zero with a nonzero peak.',
					ctx.location(`${path}.regions.${r}.regionAxes.${a}`));
		});
	});
	ctx.each(store.itemVariationData, (data, i) => {
		if (!data) return;
		const at = `${path}.itemVariationData.${i}`;
		if (ctx.table === 'CFF2' && (data.itemCount !== 0 || data.wordDeltaCount !== 0))
			addIssue(ctx.issues, 'error', 'CFF_VARIATION_CONTEXT_INVALID',
				'CFF2 variation stores select regions only; itemCount and wordDeltaCount must be zero.', ctx.location(at));
		ctx.parallel(data.deltaSets?.length, data.itemCount, `${at}.deltaSets`);
		if ((data.wordDeltaCount & 0x7fff) > data.regionIndexes.length)
			addIssue(ctx.issues, 'error', 'VARIATION_WORD_DELTA_COUNT_INVALID',
				'wordDeltaCount exceeds the number of region indices.', ctx.location(at));
		ctx.each(data.regionIndexes, (index, j) => {
			if (index < 0 || index >= list.regions.length)
				addIssue(ctx.issues, 'error', 'VARIATION_REGION_REFERENCE_INVALID',
					'Delta set references a nonexistent variation region.', ctx.location(`${at}.regionIndexes.${j}`));
		});
		ctx.each(data.deltaSets, (row, j) => ctx.parallel(row.length, data.regionIndexes.length, `${at}.deltaSets.${j}`));
	});
}

export function validateAdvancedVariation(value, raw, ctx) {
	const { table, tables } = ctx;
	const axes = tables.fvar?.axes?.length ?? 0;
	if (value.itemVariationStore) validateAdvancedStore(value.itemVariationStore, ctx);
	if (value.variationStore) validateAdvancedStore(value.variationStore, ctx, 'variationStore');
	for (const key of ['advanceWidthMapping', 'lsbMapping', 'rsbMapping',
		'advanceHeightMapping', 'tsbMapping', 'bsbMapping', 'vOrgMapping', 'varIndexMap']) {
		const map = value[key];
		if (!map) continue;
		if (![0, 1].includes(map.format)) { ctx.unsupported(key, `Index map format ${map.format} is unsupported.`); continue; }
		ctx.parallel(map.mapCount, map.entries?.length, key);
		if ((map.entryFormat & 0xc0) || ((map.entryFormat & 15) + 1 > (((map.entryFormat >> 4) & 3) + 1) * 8))
			addIssue(ctx.issues, 'error', 'VARIATION_MAP_ENCODING_INVALID',
				'DeltaSetIndexMap entryFormat has reserved bits or insufficient entry width.', ctx.location(key));
		ctx.each(map.entries, (entry, i) =>
			variationReference(value.itemVariationStore, entry.outerIndex, entry.innerIndex, ctx, `${key}.entries.${i}`));
	}
	if ((table === 'HVAR' && !value.advanceWidthMapping) ||
		(table === 'VVAR' && !value.advanceHeightMapping)) {
		const count = tables.maxp?.numGlyphs;
		if (count > 0) variationReference(value.itemVariationStore, 0, count - 1, ctx, 'implicitAdvanceMapping');
	}
	if (table !== 'gvar' && table !== 'cvar') return;
	const pointCounts = [];
	if (table === 'gvar') {
		ctx.parallel(value.axisCount, axes, 'axisCount');
		if (tables.maxp) ctx.parallel(value.glyphVariationData.length, tables.maxp.numGlyphs, 'glyphVariationData');
		ctx.each(value.sharedTuples, (tuple, i) => checkTuple(tuple, `sharedTuples.${i}`));
		ctx.each(value.glyphVariationData, (tuples, gid) => {
			const glyph = tables.glyf?.glyphs?.[gid];
			let points = 4;
			if (glyph?.type === 'composite') points += glyph.components.length;
			else ctx.each(glyph?.contours, (contour) => { points += contour.length; });
			pointCounts.push(points);
			ctx.each(tuples, (tuple, i) => checkVariation(tuple, points, `glyphVariationData.${gid}.${i}`));
		});
	} else ctx.each(value.tupleVariations, (tuple, i) =>
		checkVariation(tuple, tables['cvt ']?.values?.length ?? 0, `tupleVariations.${i}`));

	function checkTuple(tuple, path) {
		ctx.parallel(tuple?.length, axes, path);
		ctx.each(tuple, (v, i) => {
			if (!Number.isFinite(v) || v < -1 || v > 1)
				addIssue(ctx.issues, 'error', 'VARIATION_TUPLE_COORDINATE_INVALID',
					'Tuple coordinates must lie within [-1, 1].', ctx.location(`${path}.${i}`));
		});
	}
	function checkVariation(tuple, points, path) {
		checkTuple(tuple.peakTuple, `${path}.peakTuple`);
		if (tuple.intermediateStartTuple || tuple.intermediateEndTuple) {
			checkTuple(tuple.intermediateStartTuple, `${path}.intermediateStartTuple`);
			checkTuple(tuple.intermediateEndTuple, `${path}.intermediateEndTuple`);
			ctx.each(tuple.peakTuple, (peak, i) => {
				if (!(tuple.intermediateStartTuple?.[i] <= peak && peak <= tuple.intermediateEndTuple?.[i]))
					addIssue(ctx.issues, 'error', 'VARIATION_TUPLE_REGION_INVALID',
						'Intermediate tuple bounds must enclose the peak on every axis.', ctx.location(`${path}.${i}`));
			});
		}
		let previous = -1;
		ctx.each(tuple.pointIndices, (point, i) => {
			if (!Number.isInteger(point) || point <= previous || point >= points)
				addIssue(ctx.issues, 'error', 'VARIATION_POINT_REFERENCE_INVALID',
					`Point/CVT index ${point} is not increasing or is outside ${points} available entries.`,
					ctx.location(`${path}.pointIndices.${i}`));
			previous = point;
		});
		const count = tuple.pointIndices?.length ?? points;
		for (const key of table === 'gvar' ? ['xDeltas', 'yDeltas'] : ['deltas'])
			ctx.parallel(tuple[key]?.length, count, `${path}.${key}`);
	}
	if (raw && table === 'gvar') {
		const view = new BinaryView(raw, ctx);
		const count = view.u16(12);
		const long = view.u16(14) & 1;
		const data = view.u32(16);
		const sharedCount = view.u16(6);
		if (sharedCount) view.range(view.u32(8), sharedCount * value.axisCount * 2);
		let previous = 0;
		let valid = true;
		for (let i = 0; i <= count; i++) {
			const offset = long ? view.u32(20 + i * 4) : view.u16(20 + i * 2) * 2;
			if (offset < previous || data + offset > raw.length) {
				valid = false;
				addIssue(ctx.issues, 'error', 'GVAR_DATA_OFFSETS_INVALID',
					'Glyph variation offsets must be monotonic and inside gvar.', ctx.location(`glyphVariationDataOffsets.${i}`));
			}
			if (valid && i > 0 && offset > previous)
				validateTupleBytes(raw.subarray(data + previous, data + offset), axes,
					pointCounts[i - 1] ?? 4, sharedCount, false, ctx, `glyphVariationData.${i - 1}`);
			previous = offset;
		}
	} else if (raw) validateTupleBytes(raw, axes, ctx.tables['cvt ']?.values?.length ?? 0, 0, true, ctx, 'tupleVariations');
}

export function validateTupleBytes(raw, axes, points, sharedCount, cvar, ctx, path) {
	const view = new BinaryView(raw, ctx);
	const base = cvar ? 4 : 0;
	const packedCount = view.u16(base), count = packedCount & 0x0fff;
	let header = base + 4;
	const dataOffset = view.u16(base + 2), tuples = [];
	if (packedCount & 0x7000)
		addIssue(ctx.issues, 'error', 'VARIATION_TUPLE_FLAGS_INVALID', 'Tuple variation count contains reserved bits.', ctx.location(path));
	for (let i = 0; i < count; i++) {
		const size = view.u16(header), flags = view.u16(header + 2);
		header += 4;
		if (flags & 0x1000)
			addIssue(ctx.issues, 'error', 'VARIATION_TUPLE_FLAGS_INVALID', 'Tuple index contains a reserved flag.', ctx.location(`${path}.${i}`));
		if (flags & 0x8000) header += axes * 2;
		else if (cvar || (flags & 0x0fff) >= sharedCount)
			addIssue(ctx.issues, 'error', 'VARIATION_SHARED_TUPLE_INVALID',
				'Cvar requires embedded peaks; gvar shared tuple index must exist.', ctx.location(`${path}.${i}`));
		if (flags & 0x4000) header += axes * 4;
		view.range(0, header);
		tuples.push({ size, flags });
	}
	if (!count) return;
	if (dataOffset < header) throw new RangeError('Tuple variation data overlaps its header array.');
	view.range(dataOffset, 0);
	let cursor = dataOffset;
	const take = (size, end) => {
		if (cursor > end - size) throw new RangeError(`Packed variation data crosses its tuple boundary at byte ${cursor}.`);
		const at = cursor; view.range(at, size); cursor += size; return at;
	};
	const pointRun = (end) => {
		const first = view.u8(take(1, end));
		if (!first) return points;
		const count = first & 0x80 ? ((first & 0x7f) << 8) | view.u8(take(1, end)) : first;
		let read = 0;
		while (read < count) {
			const control = view.u8(take(1, end)), run = (control & 0x7f) + 1;
			if (read + run > count) throw new RangeError('Packed point run exceeds its declared point count.');
			take(run * (control & 0x80 ? 2 : 1), end);
			read += run;
		}
		return count;
	};
	const deltaRun = (count, end) => {
		let read = 0;
		while (read < count) {
			const control = view.u8(take(1, end)), run = (control & 0x3f) + 1;
			if (read + run > count) throw new RangeError('Packed delta run exceeds its declared point count.');
			if (!(control & 0x80)) take(run * (control & 0x40 ? 2 : 1), end);
			read += run;
		}
	};
	const sharedPoints = packedCount & 0x8000 ? pointRun(raw.length) : points;
	ctx.each(tuples, (tuple, i) => {
		const end = cursor + tuple.size;
		view.range(cursor, tuple.size);
		const count = tuple.flags & 0x2000 ? pointRun(end) : sharedPoints;
		deltaRun(count, end);
		if (!cvar) deltaRun(count, end);
		if (cursor !== end)
			addIssue(ctx.issues, 'error', 'VARIATION_TUPLE_DATA_SIZE_INVALID',
				'Tuple data size does not match packed points and deltas.', ctx.location(`${path}.${i}`));
		cursor = end;
	});
}
