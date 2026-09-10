export function remapLayoutGlyphs(table, tag, indices) {
	const result = structuredClone(table);
	const remap = (glyph) => {
		const mapped = indices.get(glyph);
		if (mapped === undefined)
			throw new Error(`${tag} references removed glyph ${glyph}.`);
		return mapped;
	};
	const unsupported = () => {
		throw new Error(
			`Glyph topology changes require unsupported reference remapping in ${tag}.`,
		);
	};
	if (result._raw || result.featureVariations || result.itemVariationStore)
		unsupported();
	if (tag === 'COLR') {
		if (result.version !== 0) unsupported();
		for (const record of [...result.baseGlyphRecords, ...result.layerRecords])
			record.glyphID = remap(record.glyphID);
		result.baseGlyphRecords.sort((left, right) => left.glyphID - right.glyphID);
		return result;
	}
	const expandRanges = (ranges, project) => {
		let previousEnd = -1;
		let total = 0;
		for (const range of ranges) {
			if (
				!Number.isInteger(range.startGlyphID) ||
				!Number.isInteger(range.endGlyphID) ||
				range.startGlyphID <= previousEnd ||
				range.endGlyphID < range.startGlyphID ||
				range.endGlyphID > 65535
			)
				throw new Error(`${tag} has invalid glyph ranges.`);
			total += range.endGlyphID - range.startGlyphID + 1;
			if (total > 65536)
				throw new Error(`${tag} glyph ranges exceed the glyph limit.`);
			previousEnd = range.endGlyphID;
		}
		return ranges.flatMap((range) =>
			Array.from(
				{ length: range.endGlyphID - range.startGlyphID + 1 },
				(_, offset) => project(range.startGlyphID + offset, range),
			),
		);
	};
	const expandCoverage = (coverage) =>
		coverage.format === 1
			? coverage.glyphs
			: expandRanges(coverage.ranges, (glyph) => glyph);
	const coverage = (node, arrayKey) => {
		const entries = expandCoverage(node.coverage)
			.map((glyph, index) => ({ glyph: remap(glyph), index }))
			.sort((left, right) => left.glyph - right.glyph);
		if (arrayKey)
			node[arrayKey] = entries.map(({ index }) => node[arrayKey][index]);
		node.coverage = { format: 1, glyphs: entries.map(({ glyph }) => glyph) };
	};
	const classDef = (definition) => {
		if (!definition) return definition;
		const pairs =
			definition.format === 1
				? definition.classValues.map((value, index) => [
						definition.startGlyphID + index,
						value,
					])
				: expandRanges(definition.ranges, (glyph, range) => [
						glyph,
						range.class,
					]);
		return {
			format: 2,
			ranges: pairs
				.filter(([glyph, value]) => value && indices.has(glyph))
				.map(([glyph, value]) => ({
					startGlyphID: remap(glyph),
					endGlyphID: remap(glyph),
					class: value,
				}))
				.sort((left, right) => left.startGlyphID - right.startGlyphID),
		};
	};
	if (tag === 'GDEF') {
		for (const key of ['glyphClassDef', 'markAttachClassDef'])
			if (result[key]) result[key] = classDef(result[key]);
		if (result.attachList || result.ligCaretList) unsupported();
		if (result.markGlyphSetsDef)
			result.markGlyphSetsDef.coverages = result.markGlyphSetsDef.coverages.map(
				(item) => {
					const node = { coverage: item };
					coverage(node);
					return node.coverage;
				},
			);
		return result;
	}
	const remapSubtable = (subtable, type) => {
		if (type === (tag === 'GSUB' ? 7 : 9)) {
			if (subtable.extensionLookupType === type) unsupported();
			remapSubtable(subtable.subtable, subtable.extensionLookupType);
			return;
		}
		if (tag === 'GSUB') {
			if (type === 1) {
				if (subtable.format === 1) {
					subtable.substituteGlyphIDs = expandCoverage(subtable.coverage).map(
						(glyph) => (glyph + subtable.deltaGlyphID) & 65535,
					);
					subtable.format = 2;
					delete subtable.deltaGlyphID;
				}
				subtable.substituteGlyphIDs = subtable.substituteGlyphIDs.map(remap);
				coverage(subtable, 'substituteGlyphIDs');
			} else if (type === 2 || type === 3) {
				const key = type === 2 ? 'sequences' : 'alternateSets';
				subtable[key] = subtable[key].map((sequence) => sequence.map(remap));
				coverage(subtable, key);
			} else if (type === 4) {
				for (const set of subtable.ligatureSets)
					for (const ligature of set) {
						ligature.ligatureGlyph = remap(ligature.ligatureGlyph);
						ligature.componentGlyphIDs = ligature.componentGlyphIDs.map(remap);
					}
				coverage(subtable, 'ligatureSets');
			} else unsupported();
		} else if (type === 1) {
			coverage(subtable, subtable.format === 2 ? 'valueRecords' : undefined);
		} else if (type === 2 && subtable.format === 1) {
			for (const pairs of subtable.pairSets) {
				for (const pair of pairs) pair.secondGlyph = remap(pair.secondGlyph);
				pairs.sort((left, right) => left.secondGlyph - right.secondGlyph);
			}
			coverage(subtable, 'pairSets');
		} else if (type === 2 && subtable.format === 2) {
			subtable.classDef1 = classDef(subtable.classDef1);
			subtable.classDef2 = classDef(subtable.classDef2);
			coverage(subtable);
		} else unsupported();
	};
	for (const lookup of result.lookupList.lookups)
		for (const subtable of lookup.subtables)
			remapSubtable(subtable, lookup.lookupType);
	return result;
}
