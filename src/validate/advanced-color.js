import { addIssue, BinaryView, variationReference } from './advanced-common.js';
import { validateAdvancedStore } from './advanced-variation.js';

export function validateAdvancedColor(value, raw, ctx) {
	const { table, tables, issues } = ctx;
	const palette = (index, path) => {
		if (index === 0xffff) return;
		if (!tables.CPAL || index >= tables.CPAL.numPaletteEntries || index < 0)
			addIssue(issues, 'error', 'COLOR_PALETTE_REFERENCE_INVALID',
				`Palette entry ${index} is unavailable; original palette/artwork is required.`, ctx.location(path));
	};
	if (table === 'CPAL') {
		if (!value.numPaletteEntries || !value.palettes.length)
			addIssue(issues, 'error', 'CPAL_PALETTE_COUNT_INVALID',
				'CPAL requires at least one palette and one entry per palette.', ctx.location('palettes'));
		ctx.each(value.palettes, (entries, i) => {
			ctx.parallel(entries.length, value.numPaletteEntries, `palettes.${i}`);
			ctx.each(entries, (color, j) => {
				if (['red', 'green', 'blue', 'alpha'].some((key) => !Number.isInteger(color[key]) || color[key] < 0 || color[key] > 255))
					addIssue(issues, 'error', 'CPAL_COLOR_RECORD_INVALID',
						'Palette index selects a missing or invalid BGRA record.', ctx.location(`palettes.${i}.${j}`));
			});
		});
		const names = new Set((tables.name?.names ?? []).map((name) => name.nameID));
		for (const key of ['paletteTypes', 'paletteLabels', 'paletteEntryLabels']) {
			if (!value[key]) continue;
			ctx.parallel(value[key].length, key === 'paletteEntryLabels' ? value.numPaletteEntries : value.palettes.length, key);
			ctx.each(value[key], (entry, i) => {
				if (key === 'paletteTypes' ? (entry & ~3) !== 0 : entry !== 0xffff && !names.has(entry))
					addIssue(issues, 'error', 'CPAL_METADATA_INVALID',
						'Palette metadata uses reserved type flags or a missing name ID.', ctx.location(`${key}.${i}`));
			});
		}
		return;
	}
	if (table === 'SVG ') {
		let previous = -1;
		ctx.each(value.entries, (entry, i) => {
			ctx.glyph(entry.startGlyphID, `entries.${i}.startGlyphID`);
			ctx.glyph(entry.endGlyphID, `entries.${i}.endGlyphID`);
			if (entry.startGlyphID <= previous || entry.startGlyphID > entry.endGlyphID ||
				!value.documents[entry.documentIndex])
				addIssue(issues, 'error', 'SVG_DOCUMENT_RANGE_INVALID',
					'SVG ranges overlap, are reversed/unsorted, or select a missing document.', ctx.location(`entries.${i}`));
			previous = entry.endGlyphID;
		});
		if (raw) {
			const view = new BinaryView(raw, ctx);
			const list = view.u32(2);
			const count = view.u16(list);
			view.range(list + 2, count * 12);
			if (view.u32(6) !== 0)
				addIssue(issues, 'error', 'SVG_RESERVED_FIELD_INVALID', 'SVG reserved header field must be zero.', ctx.location('reserved'));
			for (let i = 0; i < count; i++) {
				const record = list + 2 + i * 12;
				const start = list + view.u32(record + 4), length = view.u32(record + 8);
				if (!length || start < list + 2 + count * 12)
					addIssue(issues, 'error', 'SVG_DOCUMENT_OFFSET_INVALID',
						'SVG document is empty or overlaps the document record array.', ctx.location(`entries.${i}`, { byteOffset: record }));
				view.range(start, length);
			}
		}
		ctx.unsupported('documents', 'SVG XML, gzip payloads, scripts and external resources are not parsed, decompressed, executed or rendered.');
		return;
	}
	const layers = value.layerRecords ?? [];
	let previous = -1;
	ctx.each(value.baseGlyphRecords, (record, i) => {
		ctx.glyph(record.glyphID, `baseGlyphRecords.${i}.glyphID`);
		if (record.glyphID <= previous || !record.numLayers ||
			record.firstLayerIndex + record.numLayers > layers.length)
			addIssue(issues, 'error', 'COLR_LAYER_RANGE_INVALID',
				'Base glyph records must be ordered and select a nonempty in-bounds layer range.', ctx.location(`baseGlyphRecords.${i}`));
		previous = record.glyphID;
	});
	ctx.each(layers, (layer, i) => {
		ctx.glyph(layer.glyphID, `layerRecords.${i}.glyphID`);
		palette(layer.paletteIndex, `layerRecords.${i}.paletteIndex`);
	});
	validateAdvancedStore(value.itemVariationStore, ctx);
	const bases = new Map();
	previous = -1;
	ctx.each(value.baseGlyphPaintRecords, (record, i) => {
		ctx.glyph(record.glyphID, `baseGlyphPaintRecords.${i}.glyphID`);
		if (record.glyphID <= previous)
			addIssue(issues, 'error', 'COLR_BASE_GLYPH_ORDER_INVALID',
				'Base glyph paint records must be strictly increasing.', ctx.location(`baseGlyphPaintRecords.${i}`));
		previous = record.glyphID;
		bases.set(record.glyphID, record.paint);
	});
	const active = new Set(), done = new Map();
	const variable = (base, count, path) => {
		if (base === undefined || base === 0xffffffff) return;
		ctx.limits.consume(count);
		for (let i = 0; i < count; i++) {
			const index = base + i;
			const map = value.varIndexMap;
			const entry = map ? map.entries?.[Math.min(index, map.entries.length - 1)] :
				{ outerIndex: Math.floor(index / 65536), innerIndex: index % 65536 };
			variationReference(value.itemVariationStore, entry?.outerIndex, entry?.innerIndex, ctx, `${path}.${i}`);
		}
	};
	function paint(node, path, depth) {
		ctx.limits.consume();
		ctx.limits.checkDepth(depth);
		if (!node) {
			addIssue(issues, 'error', 'COLR_PAINT_REFERENCE_INVALID', 'Paint references a missing node.', ctx.location(path));
			return 0;
		}
		if (active.has(node)) {
			addIssue(issues, 'error', 'COLR_PAINT_CYCLE', 'Paint graph contains a direct or indirect cycle.', ctx.location(path));
			return 0;
		}
		if (done.has(node)) {
			ctx.limits.checkDepth(depth + done.get(node) - 1);
			return done.get(node);
		}
		let height = 1;
		const child = (value, at) => { height = Math.max(height, 1 + paint(value, at, depth + 1)); };
		active.add(node);
		const format = node.format;
		if (!Number.isInteger(format) || format < 1 || format > 32) {
			ctx.unsupported(path, `COLR paint format ${format} is not implemented.`);
		} else {
			if (node.paletteIndex !== undefined) palette(node.paletteIndex, `${path}.paletteIndex`);
			if (node.alpha !== undefined && (node.alpha < 0 || node.alpha > 1))
				addIssue(issues, 'error', 'COLR_ALPHA_INVALID', 'Paint alpha must be between zero and one.', ctx.location(path));
			if (node.glyphID !== undefined) ctx.glyph(node.glyphID, `${path}.glyphID`);
			const deltaCounts = { 3: 1, 5: 6, 7: 6, 9: 4, 15: 2, 17: 2, 19: 4, 21: 1, 23: 3, 25: 1, 27: 3, 29: 2, 31: 4 };
			variable(node.varIndexBase, deltaCounts[format] ?? 0, `${path}.varIndexBase`);
			variable(node.transform?.varIndexBase, 6, `${path}.transform.varIndexBase`);
			if (node.colorLine) {
				let last = -Infinity;
				if (![0, 1, 2].includes(node.colorLine.extend))
					addIssue(issues, 'error', 'COLR_COLOR_LINE_INVALID', 'Unknown gradient extend mode.', ctx.location(`${path}.colorLine`));
				ctx.each(node.colorLine.colorStops, (stop, i) => {
					const at = `${path}.colorLine.colorStops.${i}`;
					palette(stop.paletteIndex, at);
					if (stop.stopOffset < last || stop.alpha < 0 || stop.alpha > 1)
						addIssue(issues, 'error', 'COLR_COLOR_LINE_INVALID', 'Gradient stops must be ordered with alpha in [0, 1].', ctx.location(at));
					last = stop.stopOffset;
					variable(stop.varIndexBase, 2, `${at}.varIndexBase`);
				});
			}
			if (format === 1) {
				if (node.firstLayerIndex + node.numLayers > (value.layerPaints?.length ?? 0))
					addIssue(issues, 'error', 'COLR_LAYER_RANGE_INVALID', 'PaintColrLayers exceeds LayerList.', ctx.location(path));
				ctx.limits.consume(node.numLayers);
				for (let i = 0; i < node.numLayers; i++)
					child(value.layerPaints?.[node.firstLayerIndex + i], `${path}.layers.${i}`);
			} else if (format === 11) child(bases.get(node.glyphID), `${path}.glyph.${node.glyphID}`);
			else if (format === 32) {
				if (node.compositeMode < 0 || node.compositeMode > 27)
					addIssue(issues, 'error', 'COLR_COMPOSITE_MODE_INVALID', 'Unknown composite mode.', ctx.location(path));
				child(node.sourcePaint, `${path}.sourcePaint`);
				child(node.backdropPaint, `${path}.backdropPaint`);
			} else if (format === 10 || (format >= 12 && format <= 31)) child(node.paint, `${path}.paint`);
		}
		active.delete(node);
		done.set(node, height);
		return height;
	}
	ctx.each(value.baseGlyphPaintRecords, (record, i) => paint(record.paint, `baseGlyphPaintRecords.${i}.paint`, 1));
	ctx.each(value.layerPaints, (node, i) => paint(node, `layerPaints.${i}`, 1));
	previous = -1;
	if (value.clipList && value.clipList.format !== 1)
		ctx.unsupported('clipList', `ClipList format ${value.clipList.format} is unsupported.`);
	ctx.each(value.clipList?.clips, (clip, i) => {
		const box = clip.clipBox;
		if (![1, 2].includes(box.format))
			ctx.unsupported(`clipList.clips.${i}.clipBox`, `ClipBox format ${box.format} is unsupported.`);
		ctx.glyph(clip.startGlyphID, `clipList.clips.${i}.startGlyphID`);
		ctx.glyph(clip.endGlyphID, `clipList.clips.${i}.endGlyphID`);
		if (clip.startGlyphID <= previous || clip.startGlyphID > clip.endGlyphID || box.xMin > box.xMax || box.yMin > box.yMax)
			addIssue(issues, 'error', 'COLR_CLIP_INVALID', 'Clip ranges overlap or clip bounds are reversed.', ctx.location(`clipList.clips.${i}`));
		previous = clip.endGlyphID;
		variable(box.varIndexBase, 4, `clipList.clips.${i}.clipBox.varIndexBase`);
	});
}
