import {
	addIssue, BinaryView, classValues, coverageGlyphs, deviceReference, outlinePointCount, walkObjects,
} from './advanced-common.js';
import { validateAdvancedStore } from './advanced-variation.js';

export function validateAdvancedGdef(gdef, ctx) {
	validateAdvancedStore(gdef.itemVariationStore, ctx);
	for (const [key, array] of [['attachList', 'attachPoints'], ['ligCaretList', 'ligGlyphs']]) {
		const list = gdef[key];
		if (!list) continue;
		const glyphs = coverageGlyphs(list.coverage, ctx, `${key}.coverage`);
		ctx.parallel(list[array]?.length, glyphs.length, `${key}.${array}`);
		ctx.each(list[array], (records, i) => {
			let previous = -1;
			ctx.each(records, (record, j) => {
				const path = `${key}.${array}.${i}.${j}`;
				const index = array === 'attachPoints' ? record : record.caretValuePointIndex;
				if (index !== undefined) {
					const points = outlinePointCount(glyphs[i], ctx, path);
					if (!Number.isInteger(index) || index < 0 || (points !== null && index >= points) ||
						(array === 'attachPoints' && index <= previous))
						addIssue(ctx.issues, 'error', 'GDEF_POINT_REFERENCE_INVALID',
							'Attachment/caret point index is out of range or attachment indices are not increasing.', ctx.location(path));
					previous = index;
				}
				if (record.device) deviceReference(record.device, gdef.itemVariationStore, ctx, `${path}.device`);
			});
		});
	}
}

export function validateAdvancedLayout(layout, ctx, raw) {
	const { issues, table } = ctx;
	const lookups = layout.lookupList?.lookups ?? [];
	if (raw) {
		const view = new BinaryView(raw, ctx), list = view.u16(8);
		const count = list ? view.u16(list) : 0;
		for (let i = 0; i < count; i++) {
			const lookup = view.offset(list, 2 + i * 2, true);
			const type = view.u16(lookup), extension = table === 'GSUB' ? 7 : 9;
			if (type !== extension) continue;
			const subCount = view.u16(lookup + 4);
			let expected;
			for (let j = 0; j < subCount; j++) {
				const sub = view.offset(lookup, 6 + j * 2, true);
				const target = view.u16(sub + 2), relative = view.u32(sub + 4);
				if (target === extension || target < 1 || target > (table === 'GSUB' ? 8 : 9) ||
					(expected !== undefined && target !== expected) || relative < 8)
					addIssue(issues, 'error', 'LAYOUT_EXTENSION_TYPE_INVALID',
						'Extension targets must be consistent non-extension types, with a forward subtable offset.',
						ctx.location(`lookupList.lookups.${i}.extensions.${j}`, { byteOffset: sub }));
				view.range(sub + relative, 2);
				expected = target;
			}
		}
	}
	const features = layout.featureList?.featureRecords ?? [];
	const glyphArrays = new Set(['substituteGlyphIDs', 'componentGlyphIDs']);
	const coverageCache = new WeakMap();
	const coverage = (value, path) => {
		if (!value) return [];
		if (!coverageCache.has(value)) coverageCache.set(value, coverageGlyphs(value, ctx, path));
		return coverageCache.get(value);
	};
	const reference = (index, length, path, kind) => {
		if (!Number.isInteger(index) || index < 0 || index >= length)
			addIssue(issues, 'error', 'LAYOUT_GRAPH_REFERENCE_INVALID',
				`${kind} index ${index} is outside ${length} records; intended target requires source.`,
				ctx.location(path));
	};
	const feature = (value, path) => ctx.each(value?.lookupListIndices,
		(index, i) => reference(index, lookups.length, `${path}.lookupListIndices.${i}`, 'Lookup'));
	ctx.each(features, (record, i) => feature(record.feature, `featureList.featureRecords.${i}.feature`));
	const language = (value, path) => {
		if (!value) return;
		if (value.lookupOrderOffset !== 0)
			addIssue(issues, 'error', 'LAYOUT_LANGSYS_RESERVED',
				'LangSys lookupOrderOffset must be zero.', ctx.location(path));
		if (value.requiredFeatureIndex !== 0xffff)
			reference(value.requiredFeatureIndex, features.length, `${path}.requiredFeatureIndex`, 'Feature');
		ctx.each(value.featureIndices, (index, i) =>
			reference(index, features.length, `${path}.featureIndices.${i}`, 'Feature'));
	};
	ctx.each(layout.scriptList?.scriptRecords, (record, i) => {
		const path = `scriptList.scriptRecords.${i}.script`;
		language(record.script.defaultLangSys, `${path}.defaultLangSys`);
		ctx.each(record.script.langSysRecords, (lang, j) =>
			language(lang.langSys, `${path}.langSysRecords.${j}.langSys`));
	});

	walkObjects(layout, ctx, (value, path) => {
		if (Array.isArray(value)) return;
		for (const [key, child] of Object.entries(value)) {
			if (/coverage$/i.test(key) && child) coverage(child, `${path}.${key}`);
			if (/coverages$/i.test(key)) ctx.each(child, (cov, i) => coverage(cov, `${path}.${key}.${i}`));
			if (/classDef\d*$/.test(key) && child) classValues(child, ctx, `${path}.${key}`);
			if (/Device$/.test(key)) deviceReference(child, ctx.tables.GDEF?.itemVariationStore, ctx, `${path}.${key}`);
			if (glyphArrays.has(key)) ctx.each(child, (gid, i) => ctx.glyph(gid, `${path}.${key}.${i}`));
		}
		if (value.secondGlyph !== undefined) ctx.glyph(value.secondGlyph, `${path}.secondGlyph`);
		if (value.ligatureGlyph !== undefined) ctx.glyph(value.ligatureGlyph, `${path}.ligatureGlyph`);
		if (value.xCoordinate !== undefined && value.yCoordinate !== undefined && ![1, 2, 3].includes(value.format))
			ctx.unsupported(path, `Anchor format ${value.format} is unsupported.`);
		if (value._raw === true) ctx.unsupported(path, 'Opaque layout structure has no semantic interpretation.');
	});

	const anchor = (value, gid, path) => {
		if (!value || value.format !== 2) return;
		const count = outlinePointCount(gid, ctx, `${path}.anchorPoint`);
		if (!Number.isInteger(value.anchorPoint) || value.anchorPoint < 0 ||
			(count !== null && value.anchorPoint >= count))
			addIssue(issues, 'error', 'GPOS_ANCHOR_POINT_INVALID',
				`Anchor point ${value.anchorPoint} is outside glyph ${gid}'s stored contour points (${count ?? 'unavailable'}).`,
				ctx.location(`${path}.anchorPoint`, { glyphIndex: gid }));
	};

	function subtable(st, type, path, depth, active) {
		if (!st) return;
		ctx.limits.consume();
		ctx.limits.checkDepth(depth);
		if (active.has(st)) {
			addIssue(issues, 'error', 'LAYOUT_EXTENSION_CYCLE', 'Extension subtables form a cycle.', ctx.location(path));
			return;
		}
		active.add(st);
		const extensionType = table === 'GSUB' ? 7 : 9;
		if (type === extensionType) {
			if (st.extensionLookupType === extensionType)
				addIssue(issues, 'error', 'LAYOUT_EXTENSION_TYPE_INVALID',
					'An extension lookup must not target another extension lookup.', ctx.location(path));
			subtable(st.subtable, st.extensionLookupType, `${path}.subtable`, depth + 1, active);
			active.delete(st);
			return;
		}
		const cov = coverage(st.coverage, `${path}.coverage`);
		const paired = table === 'GSUB'
			? ['substituteGlyphIDs', 'sequences', 'alternateSets', 'ligatureSets', 'seqRuleSets', 'chainedSeqRuleSets']
			: ['valueRecords', 'pairSets', 'entryExitRecords', 'seqRuleSets', 'chainedSeqRuleSets'];
		for (const key of paired)
			if (st[key]) ctx.parallel(st[key].length, cov.length, `${path}.${key}`);
		if (table === 'GSUB') {
			if (type === 1 && st.format === 1)
				ctx.each(cov, (gid, i) => ctx.glyph((gid + st.deltaGlyphID) & 0xffff, `${path}.deltaGlyphID.${i}`));
			for (const key of ['sequences', 'alternateSets'])
				ctx.each(st[key], (set, i) => ctx.each(set, (gid, j) => ctx.glyph(gid, `${path}.${key}.${i}.${j}`)));
		}
		if (table === 'GPOS' && type === 2 && st.format === 2) {
			ctx.parallel(st.class1Records?.length, st.class1Count, `${path}.class1Records`);
			ctx.each(st.class1Records, (row, i) => ctx.parallel(row.length, st.class2Count, `${path}.class1Records.${i}`));
			for (const [key, count] of [['classDef1', st.class1Count], ['classDef2', st.class2Count]]) {
				for (const cls of classValues(st[key], ctx, `${path}.${key}`))
					reference(cls, count, `${path}.${key}`, 'Positioning class');
			}
		}
		if (table === 'GPOS' && type === 3) {
			ctx.each(st.entryExitRecords, (record, i) => {
				anchor(record.entryAnchor, cov[i], `${path}.entryExitRecords.${i}.entryAnchor`);
				anchor(record.exitAnchor, cov[i], `${path}.entryExitRecords.${i}.exitAnchor`);
			});
		}
		for (const [covKey, arrayKey] of [
			['markCoverage', 'markArray'], ['baseCoverage', 'baseArray'],
			['ligatureCoverage', 'ligatureArray'], ['mark1Coverage', 'mark1Array'],
			['mark2Coverage', 'mark2Array'],
		]) {
			if (!st[covKey]) continue;
			const gids = coverage(st[covKey], `${path}.${covKey}`);
			ctx.parallel(st[arrayKey]?.length, gids.length, `${path}.${arrayKey}`);
			ctx.each(st[arrayKey], (entry, i) => {
				if (entry?.markClass !== undefined) {
					reference(entry.markClass, st.markClassCount, `${path}.${arrayKey}.${i}.markClass`, 'Mark class');
					anchor(entry.markAnchor, gids[i], `${path}.${arrayKey}.${i}.markAnchor`);
				} else if (arrayKey === 'ligatureArray') {
					ctx.each(entry, (row, j) => {
						ctx.parallel(row.length, st.markClassCount, `${path}.${arrayKey}.${i}.${j}`);
						ctx.each(row, (value, k) => anchor(value, gids[i], `${path}.${arrayKey}.${i}.${j}.${k}`));
					});
				} else {
					ctx.parallel(entry?.length, st.markClassCount, `${path}.${arrayKey}.${i}`);
					ctx.each(entry, (value, j) => anchor(value, gids[i], `${path}.${arrayKey}.${i}.${j}`));
				}
			});
		}
		const contextual = table === 'GSUB' ? type === 5 || type === 6 : type === 7 || type === 8;
		if (contextual) {
			const chained = table === 'GSUB' ? type === 6 : type === 8;
			const actions = (rule, length, at) => {
				if (length < 1)
					addIssue(issues, 'error', 'LAYOUT_CONTEXT_EMPTY',
						'Context input sequence must contain at least one glyph.', ctx.location(at));
				ctx.each(rule.seqLookupRecords, (action, i) => {
					reference(action.sequenceIndex, length, `${at}.seqLookupRecords.${i}.sequenceIndex`, 'Input sequence');
					reference(action.lookupListIndex, lookups.length, `${at}.seqLookupRecords.${i}.lookupListIndex`, 'Lookup');
				});
			};
			if (st.format === 3) actions(st, (st.inputCoverages ?? st.coverages ?? []).length, path);
			else {
				const key = st.format === 1
					? (chained ? 'chainedSeqRuleSets' : 'seqRuleSets')
					: (chained ? 'chainedClassSeqRuleSets' : 'classSeqRuleSets');
				const sets = st[key] ?? [];
				if (st.format === 2) {
					for (const cls of classValues(st.inputClassDef ?? st.classDef, ctx, `${path}.inputClassDef`))
						reference(cls, sets.length, `${path}.${key}`, 'Input class rule set');
				}
				ctx.each(sets, (set, i) => ctx.each(set, (rule, j) => {
					const at = `${path}.${key}.${i}.${j}`;
					const length = rule.inputGlyphCount ?? rule.glyphCount;
					ctx.parallel(rule.inputSequence?.length, length - 1, `${at}.inputSequence`);
					actions(rule, length, at);
					for (const seq of ['inputSequence', 'backtrackSequence', 'lookaheadSequence']) {
						ctx.each(rule[seq], (value, k) => {
							if (st.format === 1) ctx.glyph(value, `${at}.${seq}.${k}`);
						});
					}
				}));
			}
		}
		active.delete(st);
	}
	ctx.each(lookups, (lookup, li) => {
		ctx.each(lookup.subtables, (st, si) => subtable(st, lookup.lookupType,
			`lookupList.lookups.${li}.subtables.${si}`, 1, new Set()));
	});
	ctx.each(layout.featureVariations?.featureVariationRecords, (record, i) => {
		const path = `featureVariations.featureVariationRecords.${i}`;
		ctx.each(record.conditionSet?.conditions, (condition, j) => {
			const at = `${path}.conditionSet.conditions.${j}`;
			if (condition.format !== 1) { ctx.unsupported(at, 'Only condition format 1 is interpreted.'); return; }
			reference(condition.axisIndex, ctx.tables.fvar?.axes?.length ?? 0, at, 'Variation axis');
			// The layout codec intentionally retains F2DOT14 integer units.
			if (condition.filterRangeMinValue < -16384 || condition.filterRangeMaxValue > 16384 ||
				condition.filterRangeMinValue > condition.filterRangeMaxValue)
				addIssue(issues, 'error', 'LAYOUT_VARIATION_CONDITION_INVALID',
					'Feature condition range must be ordered within [-1, 1].', ctx.location(at));
		});
		ctx.each(record.featureTableSubstitution?.substitutions, (sub, j) => {
			reference(sub.featureIndex, features.length, `${path}.substitutions.${j}`, 'Feature');
			feature(sub.feature, `${path}.substitutions.${j}.feature`);
		});
	});
}
