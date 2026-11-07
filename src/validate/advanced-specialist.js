import { StructureReader } from '../structure_limits.js';
import { parseClassDef, parseCoverage, parseDevice } from '../sfnt/opentype_layout_common.js';
import {
	addIssue, BinaryView, classValues, coverageGlyphs, deviceReference, outlinePointCount, walkObjects,
} from './advanced-common.js';
import { validateAdvancedStore } from './advanced-variation.js';

export function validateAdvancedSpecialist(value, raw, ctx) {
	const view = new BinaryView(raw, ctx);
	const reader = new StructureReader(raw, ctx.limits);
	reader.structureLimits = ctx.limits;
	const cov = (offset, path) => offset ? coverageGlyphs(parseCoverage(reader, offset), ctx, path) : [];
	const device = (base, at, path) => {
		const offset = view.offset(base, at - base + 2);
		if (offset) deviceReference(parseDevice(reader, offset), ctx.tables.GDEF?.itemVariationStore, ctx, path);
	};
	if (ctx.table === 'BASE') {
		validateAdvancedStore(value.itemVariationStore, ctx);
		for (const axisKey of ['horizAxis', 'vertAxis']) {
			const axis = value[axisKey];
			if (!axis) continue;
			ctx.each(axis.baseScriptList, (script, i) => {
				const path = `${axisKey}.baseScriptList.${i}`;
				if (script.baseValues) {
					ctx.parallel(script.baseValues.baseCoords.length, axis.baseTagList?.length ?? 0, `${path}.baseValues.baseCoords`);
					if (script.baseValues.defaultBaselineIndex >= script.baseValues.baseCoords.length)
						addIssue(ctx.issues, 'error', 'BASE_DEFAULT_BASELINE_INVALID',
							'Default baseline index does not select a BaseCoord.', ctx.location(`${path}.baseValues`));
				}
			});
		}
		walkObjects(value, ctx, (node, path) => {
			if (node.referenceGlyph !== undefined) {
				ctx.glyph(node.referenceGlyph, `${path}.referenceGlyph`);
				const count = outlinePointCount(node.referenceGlyph, ctx, path);
				if (!Number.isInteger(node.baseCoordPoint) || node.baseCoordPoint < 0 ||
					(count !== null && node.baseCoordPoint >= count))
					addIssue(ctx.issues, 'error', 'BASE_POINT_REFERENCE_INVALID',
						'BaseCoord point is outside the reference glyph.', ctx.location(path));
			}
			if (node.device) deviceReference(node.device, value.itemVariationStore, ctx, `${path}.device`);
			if (node.coordinate !== undefined && ![1, 2, 3].includes(node.format))
				ctx.unsupported(path, `BaseCoord format ${node.format} is unsupported.`);
		});
		for (const field of [4, 6]) {
			const offset = view.u16(field);
			if (offset) view.range(offset, 4);
		}
		return;
	}
	if (ctx.table === 'MERG') {
		const classes = view.u16(2), data = view.u16(4), count = view.u16(6), offsets = view.u16(8);
		view.range(data, classes * classes);
		ctx.limits.consume(classes * classes);
		for (let i = 0; i < classes * classes; i++)
			if (view.u8(data + i) & 0x88)
				addIssue(ctx.issues, 'error', 'MERG_ENTRY_FLAGS_INVALID',
					'Merge entry reserved flags must be zero.', ctx.location(`mergeEntries.${i}`));
		view.range(offsets, count * 2);
		for (let i = 0; i < count; i++) {
			const offset = view.u16(offsets + i * 2);
			classValues(parseClassDef(reader, offset), ctx, `classDefs.${i}`);
		}
		// Classes >= mergeClassCount explicitly mean "never merge"; not errors.
		return;
	}
	if (ctx.table === 'JSTF') {
		const langSys = (base, path) => {
			const count = view.u16(base);
			view.range(base + 2, count * 2);
			for (let i = 0; i < count; i++) {
				const priority = view.offset(base, 2 + i * 2, true);
				view.range(priority, 20);
				for (let field = 0; field < 10; field++) {
					const list = view.offset(priority, field * 2);
					if (!list) continue;
					const entries = view.u16(list);
					view.range(list + 2, entries * 2);
					if (field === 4 || field === 9) {
						for (let j = 0; j < entries; j++) {
							const lookup = view.offset(list, 2 + j * 2, true), type = view.u16(lookup);
							if (type === 7 || type === 8 || type < 1 || type > 9)
								addIssue(ctx.issues, 'error', 'JSTF_MAX_LOOKUP_TYPE_INVALID',
									'JstfMax cannot contain contextual positioning lookups.', ctx.location(`${path}.priorities.${i}.max.${j}`));
							const subCount = view.u16(lookup + 4);
							view.range(lookup + 6, subCount * 2);
							for (let k = 0; k < subCount; k++) view.offset(lookup, 6 + k * 2, true);
						}
						ctx.unsupported(`${path}.priorities.${i}.max.${field}`, 'JstfMax lookup headers/offsets are checked; embedded positioning subtables are not interpreted.');
					} else {
						const tag = [0, 1, 5, 6].includes(field) ? 'GSUB' : 'GPOS';
						const lookups = ctx.tables[tag]?.lookupList?.lookups?.length ?? 0;
						let previous = -1;
						for (let j = 0; j < entries; j++) {
							const index = view.u16(list + 2 + j * 2);
							if (index >= lookups || index <= previous)
								addIssue(ctx.issues, 'error', 'JSTF_LOOKUP_REFERENCE_INVALID',
									`${tag} modification list must contain ordered existing lookup indices.`,
									ctx.location(`${path}.priorities.${i}.modLists.${field}.${j}`));
							previous = index;
						}
					}
				}
			}
		};
		const count = view.u16(4);
		view.range(6, count * 6);
		for (let i = 0; i < count; i++) {
			const base = view.offset(0, 10 + i * 6, true), path = `scripts.${i}`;
			const extenders = view.offset(base, 0), defaultLang = view.offset(base, 2), languages = view.u16(base + 4);
			if (extenders) {
				const length = view.u16(extenders);
				for (let j = 0; j < length; j++) ctx.glyph(view.u16(extenders + 2 + j * 2), `${path}.extenders.${j}`);
			}
			if (defaultLang) langSys(defaultLang, `${path}.defaultLangSys`);
			view.range(base + 6, languages * 6);
			for (let j = 0; j < languages; j++) langSys(view.offset(base, 10 + j * 6, true), `${path}.langSys.${j}`);
		}
		return;
	}
	// MATH 1.0 uses fixed-depth offsets. Every referenced span is checked
	// against the original table rather than trusting opaque parser slices.
	const constants = view.offset(0, 4, true), info = view.offset(0, 6, true), variants = view.offset(0, 8, true);
	view.range(constants, 214);
	for (let i = 0; i < 51; i++) device(constants, constants + 8 + i * 4, `mathConstants.values.${i}`);
	view.range(info, 8);
	for (let kind = 0; kind < 2; kind++) {
		const base = view.offset(info, kind * 2);
		if (!base) continue;
		const count = view.u16(base + 2), coverage = cov(view.offset(base, 0, true), `mathGlyphInfo.${kind}.coverage`);
		ctx.parallel(count, coverage.length, `mathGlyphInfo.${kind}.values`);
		view.range(base + 4, count * 4);
		for (let i = 0; i < count; i++) device(base, base + 4 + i * 4, `mathGlyphInfo.${kind}.values.${i}`);
	}
	cov(view.offset(info, 4), 'mathGlyphInfo.extendedShapes');
	const kernInfo = view.offset(info, 6);
	if (kernInfo) {
		const count = view.u16(kernInfo + 2);
		ctx.parallel(count, cov(view.offset(kernInfo, 0, true), 'mathGlyphInfo.kernCoverage').length, 'mathGlyphInfo.kerns');
		view.range(kernInfo + 4, count * 8);
		for (let i = 0; i < count * 4; i++) {
			const kern = view.offset(kernInfo, 4 + i * 2);
			if (!kern) continue;
			const heights = view.u16(kern);
			view.range(kern + 2, (2 * heights + 1) * 4);
			let previous = -Infinity;
			for (let j = 0; j < heights * 2 + 1; j++) {
				const at = kern + 2 + j * 4;
				if (j < heights) {
					const height = view.i16(at);
					if (height <= previous)
						addIssue(ctx.issues, 'error', 'MATH_KERN_HEIGHTS_INVALID',
							'MathKern correction heights must be strictly increasing.', ctx.location(`mathGlyphInfo.kerns.${i}.${j}`));
					previous = height;
				}
				device(kern, at, `mathGlyphInfo.kerns.${i}.${j}`);
			}
		}
	}
	const vertical = view.u16(variants + 6), horizontal = view.u16(variants + 8);
	ctx.parallel(vertical, cov(view.offset(variants, 2), 'mathVariants.verticalCoverage').length, 'mathVariants.vertical');
	ctx.parallel(horizontal, cov(view.offset(variants, 4), 'mathVariants.horizontalCoverage').length, 'mathVariants.horizontal');
	view.range(variants + 10, (vertical + horizontal) * 2);
	for (let i = 0; i < vertical + horizontal; i++) {
		const construction = view.offset(variants, 10 + i * 2, true), path = `mathVariants.constructions.${i}`;
		const count = view.u16(construction + 2), assembly = view.offset(construction, 0);
		view.range(construction + 4, count * 4);
		let previous = -1;
		for (let j = 0; j < count; j++) {
			ctx.glyph(view.u16(construction + 4 + j * 4), `${path}.variants.${j}.glyph`);
			const advance = view.u16(construction + 6 + j * 4);
			if (advance < previous)
				addIssue(ctx.issues, 'error', 'MATH_VARIANT_ORDER_INVALID', 'Math variants must be ordered by advance.', ctx.location(`${path}.variants.${j}`));
			previous = advance;
		}
		if (!assembly) continue;
		device(assembly, assembly, `${path}.assembly.italicsCorrection`);
		const parts = view.u16(assembly + 4);
		view.range(assembly + 6, parts * 10);
		for (let j = 0; j < parts; j++) {
			const at = assembly + 6 + j * 10;
			ctx.glyph(view.u16(at), `${path}.assembly.parts.${j}.glyph`);
			if (view.u16(at + 2) > view.u16(at + 6) || view.u16(at + 4) > view.u16(at + 6) || (view.u16(at + 8) & ~1))
				addIssue(ctx.issues, 'error', 'MATH_ASSEMBLY_PART_INVALID',
					'Assembly connector length exceeds full advance or partFlags contains reserved bits.', ctx.location(`${path}.assembly.parts.${j}`));
		}
	}
}
