const weightClass = 'Whole-number weight class, 1-1000. Common values: 100 Thin, 200 Extra-light, 300 Light, 400 Regular, 500 Medium, 600 Semi-bold, 700 Bold, 800 Extra-bold, 900 Black. Enter the number, not the name.';
const widthClass = 'Whole-number width class, 1-9: 1 Ultra-condensed, 2 Extra-condensed, 3 Condensed, 4 Semi-condensed, 5 Normal, 6 Semi-expanded, 7 Expanded, 8 Extra-expanded, 9 Ultra-expanded. These are classes, not percentages.';
const languageID = 'Decimal Windows language ID, 0-32767. For example, 1033 means English (United States). Choose the language of the text; this is not a language name or a language-tag index.';
const nameID = 'Decimal name-record ID, not the name text. Common IDs: 1 Family, 2 Subfamily (style), 4 Full name, 6 PostScript name, 16 Typographic family, 17 Typographic subfamily.';
const existingNameID = 'ID of an existing, nonempty name record, 256-32767, not a row number or name text. Create the intended localized name first if it does not exist.';
const postScriptNameID = 'Existing nonempty PostScript name-record ID: 6 or 256-32767. Enter 65535 for no PostScript name. ID 6 is intended for the default instance; a real ID requires an instance layout with a PostScript-name field.';
const glyphIndex = 'Zero-based index in this font\'s existing glyph order, not a Unicode code point or glyph name. 0 is .notdef; 1 is the next glyph. The glyph must exist.';
const mappingInputs = {
	platformID: 'Decimal platform ID of an existing Unicode cmap encoding: 0 (Unicode) or 3 (Windows). Only existing, unambiguous format-4 or format-12 subtables can be edited.',
	encodingID: 'Encoding ID paired with the selected platform. Common pairs: Windows 3/1 for BMP characters and 3/10 for full Unicode; Unicode 0/3 for BMP and 0/4 for full Unicode. Match an existing format-4 or format-12 subtable.',
	codePoint: 'Unicode scalar value in decimal, 0-1114111. Examples: 65 is U+0041 (A); 128512 is U+1F600. Do not enter U+ notation or surrogate values 55296-57343. Values above 65535 require an existing format-12 subtable.',
};

const inputHelp = {
	'head.glyph-data-format': {
		value: 'Enter 0. OpenType defines no other glyph data format value; this changes the declaration, not the glyph outlines.',
	},
	'cmap.version': {
		value: 'Enter 0, the defined cmap table version. This is not a subtable format such as 4 or 12.',
	},
	'name.family': {
		value: 'Family name as text, for example Example Sans. Use the intended family identity, not a filename.',
		languageID,
	},
	'name.style': {
		value: 'Style/subfamily name as text, for example Regular, Bold, Italic, or Bold Italic. Choose the actual style; this does not change glyph shapes.',
		languageID,
	},
	'os2.weight': { value: weightClass },
	'os2.width': { value: widthClass },
	'os2.typo-linegap': {
		value: 'Additional line spacing in whole font units, 0-32767, not pixels or points. 0 means no extra gap beyond the ascender and descender.',
	},
	'name.record': {
		nameID,
		languageID,
		value: 'Text for the chosen name ID, up to 4096 characters. For example, name ID 1 could be Example Sans. Identity names must not start or end with whitespace. ID 6 requires 1-63 ASCII characters without spaces or [](){}<>/% delimiters.',
	},
	'name.remove-record': {
		platformID: 'Platform ID of the exact existing record: 0 (Unicode) or 3 (Windows). This operation does not support Macintosh platform 1.',
		encodingID: 'Decimal encoding ID from the selected existing name record. For example, Windows platform 3 commonly uses encoding 1 (Unicode BMP). The platform, encoding, language and name IDs together must identify one record.',
		nameID,
		languageID: 'Decimal language ID of the exact existing record, 0-32767. Windows example: 1033 for English (United States); Unicode records commonly use 0. Use the record\'s value, not a language-tag index.',
	},
	'metadata.style': {
		weight: weightClass,
		width: widthClass,
		bold: 'Yes sets the bold style-linking bit; No clears it. Choose how this face should be grouped with its regular/bold companions. This does not alter outlines.',
		italic: 'Yes sets the italic style-linking bit; No clears it. This is a style declaration, not an instruction to slant the outlines.',
		regular: 'Yes declares the regular face and requires both Bold and Italic to be No. Choose No for a bold or italic face.',
	},
	'metadata.italic': {
		angle: 'Angle in degrees, -90 to 90. 0 is upright; right-leaning italic text normally uses a negative angle, for example -12. This changes metadata, not outlines.',
		rise: 'Vertical part of the text-caret slope, as a signed whole-number ratio with Run. An upright caret uses Rise 1 and Run 0. Rise and Run cannot both be zero.',
		run: 'Horizontal part of the text-caret slope, as a signed whole-number ratio with Rise. Upright: 0 with Rise 1. A right-leaning caret can use a positive Run; choose a ratio matching the intended slope.',
	},
	'metadata.fixed-pitch': {
		value: 'Yes declares monospaced text; No declares proportional text. Yes is accepted only when the existing nonzero advance widths are equal. No glyph widths are changed.',
	},
	'rights.embedding': {
		value: 'Decimal fsType bit mask. Base values: 0 Installable, 2 Restricted, 4 Preview/print, 8 Editable; do not combine base permissions. Add 256 for No subsetting or 512 for Bitmap-only embedding if required. Reserved bits must be zero. Changing this value does not grant legal rights.',
	},
	'metrics.line': {
		ascender: 'Signed whole font units above the baseline, normally positive (for example 800 in a 1000-unit design). Used for hhea and OS/2 typographic ascenders, not as a pixel size.',
		descender: 'Signed whole font units below the baseline, normally negative (for example -200 in a 1000-unit design). Used for hhea and OS/2 typographic descenders.',
		lineGap: 'Extra line spacing in nonnegative whole font units. 0 adds no extra gap; choose a value for the font\'s intended line height.',
		winAscent: 'Nonnegative Windows clipping extent above the baseline, in whole font units, 0-65535. Include the intended highest marks to avoid clipping.',
		winDescent: 'Nonnegative Windows clipping extent below the baseline, in whole font units, 0-65535. Unlike the typographic Descender, enter a positive magnitude (for example 200, not -200).',
		useTypoMetrics: 'Yes asks supporting applications to use the OS/2 typographic metrics for default line spacing. No clears that preference. Applications may interpret these metrics differently.',
	},
	'os2.code-pages': {
		range1: 'Unsigned 32-bit mask in decimal, 0-4294967295, not a code-page number. In range 1, bit 0 (value 1) declares Windows 1252 Latin 1. Sum only the bit values justified by the repertoire policy.',
		range2: 'Unsigned 32-bit mask in decimal, 0-4294967295, for code-page bits 32-63. 0 declares none in this range. Use the OS/2 specification for the bit positions; do not enter a code-page number.',
		evidence: 'Describe the source/repertoire and version supporting these declarations, for example a reviewed character-set policy and its revision. This is supporting evidence, not a generic permission confirmation.',
	},
	'cmap.mapping': {
		...mappingInputs,
		glyphID: `${glyphIndex} Choose a nonzero glyph (1 or higher) suitable for the character.`,
	},
	'cmap.remove-mapping': mappingInputs,
	'metrics.advance': {
		glyphID: glyphIndex,
		value: 'Horizontal advance width in whole font units, 0-65535, not pixels. This is the distance to the next glyph origin, not the outline bounding-box width. 0 means no advance.',
	},
	'tt.loca-format': {
		format: 'short uses compact 16-bit entries storing half-offsets and requires even offsets no larger than 131070 bytes. long uses 32-bit byte offsets. Choose an encoding that can represent the existing glyph locations.',
	},
	'cff.empty-glyph': {
		glyphIndex,
		confirmedEmpty: 'Choose Yes only if the original source confirms this zero-byte CFF1 glyph was intentionally empty. No does not authorize the repair. This is not permission to discard a truncated, nonempty outline.',
	},
	'tt.decompose': {
		glyphIndex: `${glyphIndex} Select a composite glyph; simple glyphs are not decomposition targets.`,
	},
	'tt.overlap-flag': {
		glyphIndex,
		overlap: 'Yes sets the overlap flag; No clears it. Choose based on whether this glyph has overlapping contours/components. This does not detect, merge, or remove overlaps.',
	},
	'fvar.axis-name': {
		axisIndex: 'Zero-based index in the existing fvar axis array: 0 is the first axis, 1 the second. Enter an index, not an axis tag such as wght.',
		nameID: existingNameID,
	},
	'fvar.instance-name': {
		instanceIndex: 'Zero-based index in the existing fvar named-instance array: 0 is the first instance. Enter an index, not its name or weight.',
		field: 'subfamily changes the instance\'s display-style name reference. postscript changes its PostScript-name reference and requires that field to exist in the current instance layout.',
		nameID: 'For subfamily: existing nonempty name ID 2, 17, or 256-32767; 2 and 17 are intended for the default instance. For postscript: existing ID 6 or 256-32767, or 65535 for no name. ID 6 is intended for the default instance. Enter a name-record ID, not text.',
	},
	'stat.axis-name': {
		axisIndex: 'Zero-based index in the existing STAT design-axis array: 0 is the first axis. This may differ from the fvar axis order.',
		nameID: existingNameID,
	},
	'stat.value-name': {
		valueIndex: 'Zero-based index in the existing STAT axis-value array: 0 is its first record. This is a record index, not an axis coordinate or weight class.',
		nameID: existingNameID,
	},
	'stat.fallback-name': {
		nameID: 'Existing nonempty name ID, 2-32767, for the style label used when all axis values are elided. Common choices are the regular subfamily name at ID 2 or an appropriate font-specific name.',
	},
	'fvar.default-style': {
		axis: 'wght copies the existing default weight to the OS/2 weight class. wdth converts an exact standard default width percentage (for example 100) to its width class (5). No nearest-class guess is made.',
	},
	'fvar.add-instance': {
		nameID: existingNameID,
		coordinates: 'Comma-separated decimal coordinates, one per existing fvar axis in its current order. For axes wght, wdth, an example is 400, 100. Use the axes\' own units and ranges; each value must be exactly representable in 16.16 fixed point (multiples of 1/65536). Existing coordinate tuples cannot be duplicated.',
		postScriptNameID,
	},
	'fvar.standard-instance': {
		nameID: existingNameID,
		weight: 'Choose a standard wght coordinate: 100 Thin, 200 Extra-light, 300 Light, 400 Regular, 500 Medium, 600 Semi-bold, 700 Bold, 800 Extra-bold, 900 Black. It must fit the existing axis range. Other axes retain their current defaults.',
		postScriptNameID,
	},
	'tables.remove-optional': {
		tag: 'Select the exact table to remove. Examples: kern holds legacy kerning; gasp holds grid-fitting/smoothing settings; SVG, COLR and CPAL support color artwork. Review the consequences; dependencies may prevent removal.',
	},
	'tt.remove-last-glyph': {
		glyphIndex: 'Zero-based index of the final glyph only (glyph count minus 1). It must be isolated and unreferenced. Glyph 0 (.notdef) cannot be removed; other glyphs are not renumbered.',
	},
	'outlines.to-cff': {
		tolerance: 'Maximum Euclidean geometric deviation in font units, from 0 to 1; for example 0.5 permits at most half a font unit. This is not a percentage or pixel distance. Smaller bounds are stricter and may reject conversion.',
		allowOutlineLoss: 'Yes explicitly authorizes outline/program representation loss for this conversion; No prevents it. Review the red warning before applying. This is not the generic authority-to-edit assumption.',
		postScriptName: '1-63 printable ASCII characters with no spaces or [](){}<>/% delimiters, for example ExampleSans-Regular. Must match every existing PostScript name record (name ID 6); repair conflicting names separately first.',
	},
};

export function repairInputHelp(id, key) {
	return inputHelp[id]?.[key];
}

const specRoot = 'https://learn.microsoft.com/en-us/typography/opentype/spec/';
const tablePages = new Map([
	'head', 'hhea', 'vhea', 'hmtx', 'vmtx', 'glyf', 'loca', 'maxp', 'name', 'cmap', 'post',
	'fvar', 'STAT', 'CFF ', 'CFF2', 'fpgm', 'prep', 'cvt ', 'gasp', 'kern', 'SVG ', 'COLR',
	'CPAL', 'meta', 'hdmx', 'LTSH', 'VDMX', 'DSIG',
].map((tag) => [tag, tag.trim().toLowerCase()]));
tablePages.set('OS/2', 'os2');
// These catalog URLs currently return 404; do not offer broken documentation links.
const unavailablePages = new Set(['bdat', 'bloc', 'cff2charstr']);

function referenceLabel(url) {
	if (url.startsWith(specRoot)) {
		const page = url.slice(specRoot.length).split('#')[0];
		const tag = [...tablePages].find(([, path]) => path === page)?.[0].trim();
		return `OpenType: ${tag ?? (page === 'otff' ? 'font file structure' : page)}`;
	}
	if (url === 'https://www.w3.org/TR/WOFF/') return 'WOFF specification';
	if (url === 'https://www.w3.org/TR/WOFF2/') return 'WOFF 2 specification';
	if (url.endsWith('/5176.CFF.pdf')) return 'Adobe CFF specification (PDF)';
	if (url.endsWith('/5177.Type2.pdf')) return 'Adobe Type 2 specification (PDF)';
	if (url.startsWith('https://www.unicode.org/')) return 'Unicode character properties';
	return url;
}

export function qualityReferences(catalog, issue, offer) {
	const codes = new Set([issue?.code, ...offer?.codes ?? []].filter(Boolean));
	const urls = new Set([...codes].flatMap((code) => catalog[code]?.references ?? []));
	for (const tag of offer?.affectedTables ?? []) {
		if (tablePages.has(tag)) urls.add(specRoot + tablePages.get(tag));
	}
	if (offer?.id === 'dsig.remove') urls.add(`${specRoot}dsig`);
	if (offer?.id === 'fvar.default-style') urls.add(`${specRoot}fvar`);
	return [...urls].filter((url) => url.startsWith('https://') &&
		!(url.startsWith(specRoot) && unavailablePages.has(url.slice(specRoot.length).split('#')[0])))
		.map((url) => ({ url, label: referenceLabel(url) }));
}
