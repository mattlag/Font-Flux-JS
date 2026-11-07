import { addIssue, BinaryView } from './advanced-common.js';

export function inspectPng(bytes, metrics, ctx, path) {
	ctx.limits.consume(bytes.length);
	const signature = [137, 80, 78, 71, 13, 10, 26, 10];
	const invalid = (message) => addIssue(ctx.issues, 'error', 'BITMAP_PNG_INVALID', message, ctx.location(path));
	if (bytes.length < 33 || signature.some((byte, i) => bytes[i] !== byte)) {
		invalid('PNG signature or IHDR is missing/truncated; missing pixels require source.'); return;
	}
	const view = new BinaryView(Uint8Array.from(bytes), ctx);
	let offset = 8, sawData = false, sawEnd = false;
	while (offset < bytes.length) {
		const length = view.u32(offset);
		view.range(offset, length + 12);
		const tag = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
		if (offset === 8) {
			if (tag !== 'IHDR' || length !== 13) { invalid('First PNG chunk must be a 13-byte IHDR.'); return; }
			const width = view.u32(offset + 8), height = view.u32(offset + 12);
			const depth = view.u8(offset + 16), color = view.u8(offset + 17);
			const allowed = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
			if (!width || !height || width > 0x7fffffff || height > 0x7fffffff ||
				!allowed[color]?.includes(depth) || view.u8(offset + 18) !== 0 ||
				view.u8(offset + 19) !== 0 || view.u8(offset + 20) > 1)
				invalid('PNG IHDR dimensions, color/depth or compression/filter/interlace fields are invalid.');
			if (metrics && (width !== metrics.width || height !== metrics.height))
				addIssue(ctx.issues, 'error', 'BITMAP_IMAGE_METRICS_MISMATCH',
					'PNG dimensions disagree with bitmap glyph metrics.', ctx.location(path));
		}
		if (tag === 'IDAT') sawData = true;
		if (tag === 'IEND') {
			sawEnd = true;
			if (length !== 0 || offset + 12 !== bytes.length) invalid('IEND must be empty and terminate the PNG payload.');
			break;
		}
		offset += length + 12;
	}
	if (!sawData || !sawEnd) invalid('PNG requires IDAT image data and a final IEND chunk.');
}

function referenceGraph(glyphs, edges, ctx, path) {
	const active = new Set(), done = new Set();
	function visit(gid, depth) {
		ctx.limits.consume();
		ctx.limits.checkDepth(depth);
		if (active.has(gid)) {
			addIssue(ctx.issues, 'error', 'BITMAP_REFERENCE_CYCLE',
				'Bitmap duplicate/component references form a cycle.', ctx.location(`${path}.${gid}`));
			return;
		}
		if (done.has(gid)) return;
		active.add(gid);
		ctx.each(edges.get(gid), (target) => {
			if (!glyphs.has(target))
				addIssue(ctx.issues, 'error', 'BITMAP_GLYPH_REFERENCE_INVALID',
					`Bitmap target ${target} does not exist in this strike.`, ctx.location(`${path}.${gid}`));
			else visit(target, depth + 1);
		});
		active.delete(gid);
		done.add(gid);
	}
	for (const gid of glyphs.keys()) visit(gid, 1);
}

export function validateAdvancedBitmap(value, raw, ctx, rawTable) {
	if (ctx.table === 'sbix') {
		const view = new BinaryView(raw, ctx);
		const count = ctx.tables.maxp?.numGlyphs;
		ctx.each(value.strikes, (strike, i) => {
			const at = `strikes.${i}`;
			const start = view.u32(8 + i * 4), end = i + 1 < value.strikes.length ? view.u32(12 + i * 4) : raw.length;
			if (start < 8 + value.strikes.length * 4 || end <= start) throw new RangeError('sbix strike overlaps headers or has reversed bounds.');
			view.range(start, end - start);
			const glyphCount = count ?? strike.glyphs.length;
			const headerEnd = 4 + (glyphCount + 1) * 4;
			let previous = headerEnd;
			for (let g = 0; g <= glyphCount; g++) {
				const offset = view.u32(start + 4 + g * 4);
				if (offset < previous || start + offset > end)
					addIssue(ctx.issues, 'error', 'BITMAP_DATA_OFFSETS_INVALID',
						'sbix glyph offsets overlap the strike header, decrease or exceed the strike.', ctx.location(`${at}.glyphOffsets.${g}`));
				previous = offset;
			}
			const glyphs = new Map(), edges = new Map();
			ctx.each(strike.glyphs, (glyph, gid) => {
				if (!glyph) return;
				glyphs.set(gid, glyph);
				const path = `${at}.glyphs.${gid}`;
				if (glyph.graphicType === 'dupe') {
					if (glyph.imageData.length !== 2)
						addIssue(ctx.issues, 'error', 'BITMAP_DUPLICATE_INVALID',
							'sbix dupe requires exactly a uint16 glyph ID.', ctx.location(path));
					else edges.set(gid, [(glyph.imageData[0] << 8) | glyph.imageData[1]]);
				} else if (glyph.graphicType === 'png ') inspectPng(glyph.imageData, null, ctx, path);
				else ctx.unsupported(path, `Image codec ${glyph.graphicType} is preserved, not decoded.`);
			});
			referenceGraph(glyphs, edges, ctx, `${at}.glyphs`);
		});
		return;
	}
	if (ctx.table === 'EBSC') {
		const location = ctx.tables.EBLC ?? ctx.tables.bloc;
		ctx.each(value.scales, (scale, i) => {
			// The codec's originalPpem fields occupy the normative substitute
			// positions at bytes 26 and 27; use the raw positions to avoid aliases.
			const view = new BinaryView(raw, ctx);
			const x = view.u8(8 + i * 28 + 26), y = view.u8(8 + i * 28 + 27);
			if (!location?.sizes?.some((strike) => strike.ppemX === x && strike.ppemY === y))
				addIssue(ctx.issues, 'error', 'BITMAP_SCALE_REFERENCE_INVALID',
					'EBSC substitute ppem does not identify a bitmap strike.', ctx.location(`scales.${i}`));
		});
		return;
	}
	const dataTag = ctx.table === 'CBLC' ? 'CBDT' : ctx.table === 'bloc' ? 'bdat' : 'EBDT';
	const bytes = rawTable(dataTag);
	if (!bytes) {
		addIssue(ctx.issues, 'error', 'BITMAP_DATA_TABLE_MISSING',
			`${ctx.table} requires ${dataTag}; pixel data cannot be reconstructed.`, ctx.location('sizes'));
		return;
	}
	const dataView = new BinaryView(bytes, ctx);
	ctx.each(value.sizes, (strike, i) => {
		const at = `sizes.${i}`;
		ctx.glyph(strike.startGlyphIndex, `${at}.startGlyphIndex`);
		ctx.glyph(strike.endGlyphIndex, `${at}.endGlyphIndex`);
		if (!strike.ppemX || !strike.ppemY || strike.startGlyphIndex > strike.endGlyphIndex ||
			![1, 2, 4, 8, 32].includes(strike.bitDepth))
			addIssue(ctx.issues, 'error', 'BITMAP_STRIKE_INVALID',
				'Bitmap strike ppem, glyph range or bit depth is invalid.', ctx.location(at));
		const glyphs = new Map(), edges = new Map();
		let previous = -1;
		ctx.each(strike.indexSubTables, (sub, j) => {
			const path = `${at}.indexSubTables.${j}`;
			if (sub.firstGlyphIndex <= previous || sub.firstGlyphIndex > sub.lastGlyphIndex ||
				sub.firstGlyphIndex < strike.startGlyphIndex || sub.lastGlyphIndex > strike.endGlyphIndex)
				addIssue(ctx.issues, 'error', 'BITMAP_SUBTABLE_RANGE_INVALID',
					'Index subtables overlap or lie outside their strike glyph range.', ctx.location(path));
			previous = sub.lastGlyphIndex;
			const records = [];
			if ([1, 3].includes(sub.indexFormat)) {
				ctx.parallel(sub.sbitOffsets.length, sub.lastGlyphIndex - sub.firstGlyphIndex + 2, `${path}.sbitOffsets`);
				ctx.each(sub.sbitOffsets.slice(0, -1), (offset, g) =>
					records.push([sub.firstGlyphIndex + g, offset, sub.sbitOffsets[g + 1]]));
			} else if (sub.indexFormat === 2 || sub.indexFormat === 5) {
				const count = sub.indexFormat === 2 ? sub.lastGlyphIndex - sub.firstGlyphIndex + 1 : sub.glyphIdArray.length;
				ctx.limits.consume(count);
				for (let g = 0; g < count; g++) records.push([
					sub.indexFormat === 2 ? sub.firstGlyphIndex + g : sub.glyphIdArray[g], g * sub.imageSize, (g + 1) * sub.imageSize,
				]);
			} else if (sub.indexFormat === 4) {
				ctx.each(sub.glyphArray.slice(0, -1), (entry, g) =>
					records.push([entry.glyphID, entry.sbitOffset, sub.glyphArray[g + 1].sbitOffset]));
			} else { ctx.unsupported(path, `Bitmap index format ${sub.indexFormat} is unsupported.`); return; }
			let lastGid = -1;
			ctx.each(records, ([gid, begin, end], g) => {
				const record = `${path}.glyphs.${g}`;
				if (gid <= lastGid || gid < sub.firstGlyphIndex || gid > sub.lastGlyphIndex)
					addIssue(ctx.issues, 'error', 'BITMAP_GLYPH_REFERENCE_INVALID', 'Sparse bitmap glyph IDs are not increasing or in range.', ctx.location(record));
				lastGid = gid;
				const start = sub.imageDataOffset + begin, length = end - begin;
				if (end < begin || start < 4 || start + length > bytes.length) {
					addIssue(ctx.issues, 'error', 'BITMAP_DATA_OFFSETS_INVALID',
						'Bitmap record has reversed or out-of-bounds data offsets.', ctx.location(record));
					return;
				}
				if (!length) return;
				glyphs.set(gid, true);
				const format = sub.imageFormat;
				const metricsSize = [1, 2, 8, 17].includes(format) ? 5 : [6, 7, 9, 18].includes(format) ? 8 : 0;
				if (length < metricsSize) throw new RangeError('Bitmap record metrics are truncated.');
				const metrics = metricsSize ? { height: dataView.u8(start), width: dataView.u8(start + 1) } : sub.bigMetrics;
				if ([17, 18, 19].includes(format)) {
					if (length < metricsSize + 4) throw new RangeError('Bitmap PNG length is truncated.');
					const imageLength = dataView.u32(start + metricsSize);
					if (imageLength !== length - metricsSize - 4)
						addIssue(ctx.issues, 'error', 'BITMAP_IMAGE_LENGTH_INVALID',
							'PNG byte length disagrees with the enclosing bitmap record.', ctx.location(record));
					const available = Math.min(imageLength, length - metricsSize - 4);
					inspectPng(bytes.subarray(start + metricsSize + 4, start + metricsSize + 4 + available), metrics, ctx, record);
				} else if ([1, 2, 5, 6, 7].includes(format) && metrics) {
					const expected = [1, 6].includes(format) ? Math.ceil(metrics.width * strike.bitDepth / 8) * metrics.height :
						Math.ceil(metrics.width * metrics.height * strike.bitDepth / 8);
					if (length - metricsSize !== expected)
						addIssue(ctx.issues, 'error', 'BITMAP_IMAGE_LENGTH_INVALID',
							'Packed bitmap byte length disagrees with width, height and bit depth.', ctx.location(record));
				} else if (format === 8 || format === 9) {
					const countAt = start + metricsSize + (format === 8 ? 1 : 0);
					if (countAt + 2 > start + length) throw new RangeError('Bitmap component count is truncated.');
					const count = dataView.u16(countAt);
					if (countAt + 2 + count * 4 > start + length) throw new RangeError('Bitmap component records are truncated.');
					const targets = [];
					for (let k = 0; k < count; k++) targets.push(dataView.u16(countAt + 2 + k * 4));
					edges.set(gid, targets);
				} else ctx.unsupported(record, `Bitmap image format ${format} has no implemented payload check.`);
			});
		});
		referenceGraph(glyphs, edges, ctx, at);
	});
}
