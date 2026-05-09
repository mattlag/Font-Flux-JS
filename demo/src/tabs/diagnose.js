/**
 * Diagnose tab — runs binary-level diagnostics on the original font file
 * and lists every issue with severity, explanation, and (where possible)
 * a "Fix it" action that mutates the in-memory font data.
 */
import { diagnoseFont } from 'font-flux-js';

// =========================================================================
//  Issue metadata: recommendation text + optional fix factory
// =========================================================================

/**
 * Per-code recommendation + optional auto-fix.  The `fix` function receives
 * `(fontData)` and should mutate it in place, returning a short string that
 * describes what was changed.
 */
const ISSUE_META = {
	// ── Errors ──────────────────────────────────────────────────────────
	NOT_ARRAYBUFFER: {
		rec: 'The input was not a binary buffer. Reload the file from disk.',
	},
	TOO_SHORT: {
		rec: 'The file is truncated \u2014 it does not even contain a complete header. Re-download or recover the file from a backup.',
	},
	BAD_SF_VERSION: {
		rec: 'The SFNT signature is unrecognized. The file may not be a real font, or only the first bytes are corrupted.',
	},
	NO_TABLES: {
		rec: 'The file header claims zero tables \u2014 there is nothing to work with. The file is severely damaged.',
	},
	DIRECTORY_TRUNCATED: {
		rec: 'The file is too short for the declared number of tables. It was likely truncated during download or transfer.',
	},
	HEADER_UNREADABLE: {
		rec: 'Could not read the SFNT header at all. The file may not be a font.',
	},
	DIRECTORY_ENTRY_UNREADABLE: {
		rec: 'A table directory entry is corrupted. The file is partially unreadable.',
	},
	BAD_TABLE_TAG: {
		rec: 'A table tag contains non-ASCII bytes — the directory may be corrupted.',
	},
	DUPLICATE_TABLE: {
		rec: 'Two tables share the same tag. This is invalid per the OpenType spec.',
	},
	TABLE_OUT_OF_BOUNDS: {
		rec: 'A table\u2019s declared offset+length extends past the end of the file. The file is truncated.',
	},
	MISSING_REQUIRED_TABLE: {
		rec: 'This font is missing a table that the OpenType spec requires every font to have. Most renderers will reject the file.',
	},
	NO_OUTLINES: {
		rec: 'No glyph outline data (glyf+loca or CFF/CFF2) was found. The font cannot render any glyphs.',
	},
	TABLE_PARSE_FAILED: {
		rec: 'A table\u2019s binary data could not be parsed \u2014 its internal structure is corrupted.',
	},
	BAD_MAGIC_NUMBER: {
		rec: 'The head table\u2019s magic number is wrong (expected 0x5F0F3CF5). This usually means the head table is corrupted.',
	},
	BAD_UNITS_PER_EM: {
		rec: 'unitsPerEm must be between 16 and 16384. An out-of-range value will cause renderers to reject the font.',
	},
	LOCA_BEYOND_GLYF: {
		rec: 'The loca table points past the end of the glyf table — some glyphs may be unreadable.',
	},
	GVAR_WITHOUT_FVAR: {
		rec: 'gvar (glyph variation data) is present but fvar (axis definitions) is missing. The variation data is useless.',
	},
	WOFF1_UNWRAP_FAILED: {
		rec: 'WOFF1 decompression failed. The compressed data may be corrupt — try the original uncompressed font.',
	},
	WOFF2_UNWRAP_FAILED: {
		rec: 'WOFF2 Brotli decompression failed. The compressed data may be corrupt — try the original uncompressed font.',
	},
	EMPTY_COLLECTION: {
		rec: 'The TTC/OTC collection header says it contains zero fonts.',
	},
	COLLECTION_HEADER_UNREADABLE: {
		rec: 'The TTC/OTC collection header is corrupted.',
	},
	NO_READABLE_ENTRIES: {
		rec: 'No table directory entries could be read at all. The file is severely damaged.',
	},

	// ── Warnings ────────────────────────────────────────────────────────
	BAD_CHECKSUM: {
		rec: 'Table checksums are used by OS font validators. Zeroed or mismatched checksums will cause Windows to reject the font. Re-exporting with Font Flux will recompute correct checksums.',
		fix(fontData) {
			// Re-export will automatically compute correct checksums.
			// We mark dirty so the user knows to export.
			fontData._dirty = true;
			return 'Font marked for re-export — checksums will be recomputed on export.';
		},
	},
	EXCESSIVE_TABLES: {
		rec: 'This font has an unusually large number of tables. It may be a specially crafted file.',
	},
	EMPTY_TABLE: {
		rec: 'A zero-length table is unusual and likely indicates a placeholder that was never populated.',
	},
	TABLE_MISALIGNED: {
		rec: 'Tables should start on 4-byte boundaries for optimal performance. Re-exporting will fix the alignment.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — table alignment will be corrected on export.';
		},
	},
	MIXED_OUTLINES: {
		rec: 'Having both TrueType and CFF outlines is unusual. Most tools will only use one.',
	},
	BAD_SEARCH_RANGE: {
		rec: "The header's searchRange field is incorrect. Re-exporting will fix it.",
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — header fields will be recomputed on export.';
		},
	},
	BAD_ENTRY_SELECTOR: {
		rec: "The header's entrySelector field is incorrect. Re-exporting will fix it.",
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — header fields will be recomputed on export.';
		},
	},
	BAD_RANGE_SHIFT: {
		rec: "The header's rangeShift field is incorrect. Re-exporting will fix it.",
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — header fields will be recomputed on export.';
		},
	},
	HMTX_GLYPH_MISMATCH: {
		rec: 'The number of horizontal metrics does not match maxp.numGlyphs. Some glyphs may have missing or incorrect widths.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — hmtx will be rebuilt from glyph advance widths on export.';
		},
	},
	HHEA_HMTX_MISMATCH: {
		rec: 'hhea.numberOfHMetrics disagrees with the actual hmtx entries. Re-exporting will reconcile them.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Font marked for re-export — hhea/hmtx will be reconciled on export.';
		},
	},
	VHEA_VMTX_MISMATCH: {
		rec: 'The vertical metrics header disagrees with the actual vmtx entries.',
	},
	CFF_GLYPH_MISMATCH: {
		rec: 'CFF charString count disagrees with maxp.numGlyphs.',
	},
	NO_FAMILY_NAME: {
		rec: 'The name table has no family name (nameID 1). Windows and macOS require this to install the font.',
		fix(fontData) {
			if (fontData.font) {
				const fallback =
					fontData.font.fullName ||
					fontData.font.postScriptName ||
					fontData._fileName?.replace(/\.[^.]+$/, '') ||
					'Untitled';
				fontData.font.familyName = fallback;
				fontData._dirty = true;
				return `Set familyName to "${fallback}".`;
			}
			return null;
		},
	},
	NO_STYLE_NAME: {
		rec: 'The name table has no style name (nameID 2). Defaulting to "Regular".',
		fix(fontData) {
			if (fontData.font) {
				fontData.font.styleName = fontData.font.styleName || 'Regular';
				fontData._dirty = true;
				return 'Set styleName to "Regular".';
			}
			return null;
		},
	},

	// ── Info ─────────────────────────────────────────────────────────────
	FORMAT_WOFF1: {
		rec: 'File is WOFF1-wrapped — this is normal for web fonts.',
	},
	FORMAT_WOFF2: {
		rec: 'File is WOFF2-wrapped — this is normal for web fonts.',
	},
	FORMAT_COLLECTION: { rec: 'File is a TTC/OTC font collection.' },
	WOFF1_UNWRAPPED: { rec: 'WOFF1 outer wrapper decompressed successfully.' },
	WOFF2_UNWRAPPED: { rec: 'WOFF2 Brotli wrapper decompressed successfully.' },
	SF_VERSION: { rec: 'The SFNT version signature is recognized.' },
	TABLE_PARSED: { rec: 'Table parsed without error.' },
	UNKNOWN_TABLE: {
		rec: 'This table tag is not in the OpenType standard, but it will be preserved as raw bytes.',
	},
	COLLECTION_INFO: { rec: 'Collection metadata read successfully.' },

	// ── Tier 3-7: deep structural validation (added v2.4.x) ─────────────
	// Most of these mirror Firefox/OTS validator checks. Recommendations are
	// concise; the raw issue message includes specific table/glyph offsets.

	// Directory & file integrity
	DIRECTORY_NOT_SORTED: {
		rec: 'Per OpenType spec, the table directory must be sorted alphabetically by tag. Re-export to fix.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Marked for re-export — directory will be sorted on export.';
		},
	},
	TABLES_OVERLAPPING: {
		rec: 'Two table byte ranges overlap in the file. The font is structurally corrupt.',
	},
	FILE_EXCEEDS_1GB: {
		rec: 'File size exceeds 1 GB — implementations may refuse to load it.',
	},
	TABLE_LENGTH_EXCEEDS_1GB: {
		rec: 'A single table is larger than 1 GB — implementations may refuse to load it.',
	},

	// head
	HEAD_MAJOR_VERSION_UNSUPPORTED: { rec: 'head.majorVersion must be 1.' },
	HEAD_BBOX_INVERTED: {
		rec: 'head.xMin/xMax or yMin/yMax are inverted. Re-export rebuilds head.bbox from glyphs.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Marked for re-export — head bbox will be recomputed.';
		},
	},
	HEAD_INDEX_TO_LOC_FORMAT_INVALID: {
		rec: 'head.indexToLocFormat must be 0 or 1.',
	},
	HEAD_GLYPH_DATA_FORMAT_INVALID: { rec: 'head.glyphDataFormat must be 0.' },
	HEAD_MACSTYLE_RESERVED_BITS_SET: {
		rec: 'head.macStyle has bits set above bit 6 — reserved bits should be 0.',
	},

	// hhea
	HHEA_MAJOR_VERSION_UNSUPPORTED: { rec: 'hhea.majorVersion must be 1.' },

	// maxp
	MAXP_VERSION_INVALID: {
		rec: 'maxp.version must be 0x00005000 (CFF) or 0x00010000 (TrueType).',
	},
	MAXP_NUMGLYPHS_ZERO: { rec: 'maxp.numGlyphs is 0 — the font has no glyphs.' },
	MAXP_VERSION_MISMATCH_FOR_OUTLINE: {
		rec: 'maxp version does not match the outline format (CFF→0.5, TrueType→1.0).',
	},

	// post
	POST_VERSION_UNSUPPORTED: {
		rec: 'post.version must be 1.0, 2.0, 2.5, 3.0, or 4.0.',
	},
	POST_NUMGLYPHS_MISMATCH: {
		rec: 'post.numberOfGlyphs disagrees with maxp.numGlyphs.',
	},

	// OS/2
	OS2_VERSION_INVALID: { rec: 'OS/2 version must be 0–5.' },
	OS2_WEIGHT_CLAMPED: { rec: 'OS/2.usWeightClass should be in [1, 1000].' },
	OS2_WIDTH_CLAMPED: { rec: 'OS/2.usWidthClass should be in [1, 9].' },
	OS2_FSTYPE_RESERVED_BITS_SET: { rec: 'OS/2.fsType has reserved bits set.' },
	OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH: {
		rec: 'OS/2.fsSelection italic/bold bits disagree with head.macStyle.',
	},
	OS2_FIRST_LAST_CHAR_INVERTED: {
		rec: 'OS/2.usFirstCharIndex > usLastCharIndex.',
	},
	OS2_NEGATIVE_SIZE: { rec: 'An OS/2 size metric is negative.' },
	OS2_TYPO_LINEGAP_NEGATIVE: { rec: 'OS/2.sTypoLineGap should be ≥ 0.' },
	OS2_X_HEIGHT_NEGATIVE: { rec: 'OS/2.sxHeight should be ≥ 0.' },
	OS2_CAP_HEIGHT_NEGATIVE: { rec: 'OS/2.sCapHeight should be ≥ 0.' },
	OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE: {
		rec: 'OS/2 usLowerOpticalPointSize / usUpperOpticalPointSize must be in [0, 0xFFFE].',
	},

	// name
	NAME_FORMAT_INVALID: { rec: 'name.format must be 0 or 1.' },
	NAME_RECORD_OUT_OF_BOUNDS: {
		rec: 'A name record offset+length extends past the string storage.',
	},
	NAME_STRING_OFFSET_INVALID: { rec: 'A name record stringOffset is invalid.' },
	NAME_STRING_TOO_LONG: {
		rec: 'A name string exceeds the 32 KB sanity limit.',
	},
	NAME_LANG_TAG_TOO_LONG: {
		rec: 'A name format-1 langTag exceeds the 16-byte limit.',
	},
	NAME_RECORDS_NOT_SORTED: {
		rec: 'name records must be sorted by (platformID, encodingID, languageID, nameID).',
	},
	NAME_POSTSCRIPT_NAME_INVALID_CHARS: {
		rec: 'PostScript name (nameID 6) contains characters outside the legal ASCII set.',
	},

	// cmap
	CMAP_VERSION_INVALID: { rec: 'cmap.version must be 0.' },
	CMAP_NO_SUBTABLES: { rec: 'cmap declares zero subtables.' },
	CMAP_SUBTABLES_NOT_SORTED: {
		rec: 'cmap encoding records must be sorted by (platformID, encodingID, language).',
	},
	CMAP_NO_SUPPORTED_SUBTABLE: {
		rec: 'cmap has no Unicode (Microsoft 3,1 or 3,10) subtable. Most renderers will reject this.',
	},
	CMAP_GLYPH_OUT_OF_RANGE: {
		rec: 'A cmap subtable maps a codepoint to a glyph ID ≥ numGlyphs.',
	},
	CMAP_LANGUAGE_NONZERO_FOR_WINDOWS: {
		rec: 'A Microsoft platform cmap subtable has a non-zero language field — must be 0.',
	},
	CMAP_FORMAT4_SEGCOUNT_INVALID: {
		rec: 'cmap format 4 segCountX2 is invalid (must be even and > 0).',
	},
	CMAP_FORMAT4_RANGES_OUT_OF_ORDER: {
		rec: 'cmap format 4 endCode array must be strictly ascending.',
	},
	CMAP_FORMAT4_INVALID_TERMINATOR: {
		rec: 'cmap format 4 final segment must terminate with endCode = 0xFFFF.',
	},
	CMAP_FORMAT12_GROUPS_NOT_SORTED: {
		rec: 'cmap format 12/13 groups must be sorted by startCharCode.',
	},
	CMAP_FORMAT12_GROUPS_OUT_OF_ORDER: {
		rec: 'cmap format 12/13 groups are not ordered correctly.',
	},
	CMAP_FORMAT12_GROUPS_OVERLAP: {
		rec: 'cmap format 12/13 groups overlap — character ranges must be disjoint.',
	},
	CMAP_FORMAT12_END_BEFORE_START: {
		rec: 'cmap format 12/13 group has endCharCode < startCharCode.',
	},
	CMAP_FORMAT14_VS_OUT_OF_RANGE: {
		rec: 'cmap format 14 variation selector is not in any defined VS range (Mongolian FVS, FE00–FE0F, E0100–E01EF).',
	},
	CMAP_FORMAT14_VS_OUT_OF_ORDER: {
		rec: 'cmap format 14 variation selectors must be strictly ascending.',
	},

	// CFF / CFF2 charstrings
	CFF_EMPTY_CHARSTRING: {
		rec: 'A CFF glyph charstring is empty — must contain at least an endchar operator.',
	},
	CFF_CHARSTRING_NO_ENDCHAR: {
		rec: 'A CFF glyph charstring does not terminate with endchar (0x0E) or return (0x0B).',
	},
	CFF_INVALID_OPERATOR: {
		rec: 'A CFF/CFF2 charstring uses an unrecognised Type 2 operator.',
	},
	CFF_INVALID_NUMBER: {
		rec: 'A CFF/CFF2 charstring contains a malformed numeric operand.',
	},
	CFF_TRUNCATED_OPERAND: {
		rec: 'A CFF/CFF2 charstring is truncated mid-operand.',
	},
	CFF_TRUNCATED_OPERATOR: {
		rec: 'A CFF/CFF2 charstring ends mid-operator (escape with no follow-up, or hintmask with insufficient mask bytes).',
	},
	CFF_STACK_UNDERFLOW: {
		rec: 'A CFF/CFF2 operator was issued with insufficient operands on the stack.',
	},
	CFF_STACK_OVERFLOW: {
		rec: 'A CFF/CFF2 charstring exceeded the Type 2 operand stack limit (48 for CFF1, 513 for CFF2).',
	},
	CFF_SUBR_INDEX_OUT_OF_RANGE: {
		rec: 'A CFF/CFF2 callsubr/callgsubr referenced a subroutine index outside the subroutine INDEX.',
	},
	CFF_SUBR_DEPTH_EXCEEDED: {
		rec: 'A CFF/CFF2 charstring exceeded the Type 2 subroutine recursion limit (10).',
	},
	POST_VERSION_INVALID_FOR_CFF: {
		rec: 'CFF-flavored fonts MUST use post version 3.0. Re-export will set this.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Marked for re-export — post will be set to version 3.0.';
		},
	},

	// glyf
	GLYF_COMPOSITE_CYCLE: {
		rec: 'A glyf composite chain forms a cycle (a composite directly or indirectly references itself).',
	},
	GLYF_COMPOSITE_DEPTH_EXCEEDED: {
		rec: 'A glyf composite chain nests deeper than the spec maximum of 16 levels.',
	},
	GLYF_COMPOSITE_GLYPH_OUT_OF_RANGE: {
		rec: 'A glyf composite component references a glyph ID ≥ numGlyphs.',
	},
	GLYF_BBOX_INVERTED: {
		rec: 'A glyf glyph has xMin > xMax or yMin > yMax. Re-export rebuilds bounding boxes.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Marked for re-export — glyph bboxes will be recomputed.';
		},
	},
	GLYF_BBOX_OUTSIDE_HEAD: {
		rec: 'A glyf glyph bounding box extends outside head.bbox. Re-export reconciles them.',
		fix(fontData) {
			fontData._dirty = true;
			return 'Marked for re-export — head.bbox will be recomputed.';
		},
	},
	GLYF_NUM_CONTOURS_INVALID: {
		rec: 'A glyf glyph has numberOfContours < -1 (only ≥ −1 is valid; −1 indicates a composite).',
	},

	// TrueType instructions
	TT_INSTR_TRUNCATED_PUSH: {
		rec: 'A TrueType PUSHB/PUSHW/NPUSH operand list runs past the end of the instruction stream.',
	},
	TT_INSTR_UNBALANCED_IF: {
		rec: 'A TrueType IF block was never closed by an EIF.',
	},
	TT_INSTR_UNBALANCED_EIF: {
		rec: 'A TrueType EIF appears with no matching IF.',
	},
	TT_INSTR_NESTED_FDEF: {
		rec: 'A TrueType FDEF (function definition) is nested inside another FDEF — not allowed.',
	},
	TT_INSTR_STRAY_ENDF: { rec: 'A TrueType ENDF appears outside any FDEF.' },
	TT_INSTR_UNCLOSED_FDEF: {
		rec: 'A TrueType FDEF was never closed by ENDF before end of stream.',
	},

	// fvar / variable fonts
	FVAR_AXIS_DUPLICATE_TAG: { rec: 'fvar has two axes with the same axisTag.' },
	FVAR_AXIS_RANGE_INVALID: {
		rec: 'fvar axis must satisfy minValue ≤ defaultValue ≤ maxValue.',
	},
	FVAR_AXIS_FLAGS_RESERVED: { rec: 'fvar axis flags has reserved bits set.' },
	FVAR_AXIS_NAMEID_RESERVED: {
		rec: 'fvar axis nameID is in the reserved range (0–255 except 256+).',
	},
	FVAR_AXIS_NAMEID_MISSING: {
		rec: 'fvar axis nameID does not exist in the name table.',
	},
	FVAR_INSTANCE_OUT_OF_RANGE: {
		rec: 'fvar instance coordinate is outside the axis min/max range.',
	},
	FVAR_INSTANCE_FLAGS_RESERVED: {
		rec: 'fvar instance flags has reserved bits set.',
	},
	FVAR_INSTANCE_NAMEID_MISSING: {
		rec: 'fvar instance subfamilyNameID does not exist in the name table.',
	},

	// STAT
	STAT_VERSION_INVALID: { rec: 'STAT.version must be 1.0, 1.1, or 1.2.' },
	STAT_DESIGN_AXIS_SIZE_INVALID: { rec: 'STAT.designAxisSize must be 8.' },
	STAT_AXIS_DUPLICATE_TAG: {
		rec: 'STAT has two design axes with the same axisTag.',
	},
	STAT_AXIS_VALUE_AXIS_INDEX_OUT_OF_RANGE: {
		rec: 'A STAT axis value record references an axis index outside the design axis array.',
	},
	STAT_AXIS_VALUE_RANGE_INVALID: {
		rec: 'A STAT axis value record has rangeMinValue > rangeMaxValue.',
	},
	STAT_MISSING_FVAR_AXIS: {
		rec: 'STAT declares an axis tag that is not present in fvar.',
	},

	// avar
	AVAR_SEGMENT_COUNT_MISMATCH: {
		rec: 'avar.axisSegmentMaps.length does not match fvar.axisCount.',
	},
	AVAR_COORD_OUT_OF_RANGE: {
		rec: 'avar segment coordinate must be in [-1.0, 1.0].',
	},
	AVAR_FROM_COORD_NOT_INCREASING: {
		rec: 'avar fromCoordinate values must be strictly increasing.',
	},
	AVAR_MISSING_REQUIRED_ENDPOINTS: {
		rec: 'avar segment map must include the required endpoints (-1, 0, 1).',
	},

	// MVAR / HVAR / VVAR / IVS
	MVAR_VALUE_RECORD_SIZE_INVALID: { rec: 'MVAR.valueRecordSize must be 8.' },
	MVAR_DELTA_SET_OUTER_OUT_OF_RANGE: {
		rec: 'MVAR value record references a delta-set outerIndex outside the ItemVariationStore.',
	},
	MVAR_DELTA_SET_INNER_OUT_OF_RANGE: {
		rec: 'MVAR value record references a delta-set innerIndex outside the ItemVariationStore.',
	},
	IVS_AXIS_COUNT_MISMATCH: {
		rec: 'ItemVariationStore region axisCount does not match fvar.axisCount.',
	},
	IVS_REGION_COORD_OUT_OF_RANGE: {
		rec: 'ItemVariationStore region coordinate is outside [-1.0, 1.0].',
	},
	IVS_REGION_PEAK_OUT_OF_ORDER: {
		rec: 'ItemVariationStore region requires startCoord ≤ peakCoord ≤ endCoord.',
	},
	IVS_REGION_INDEX_OUT_OF_RANGE: {
		rec: 'A delta set references a regionIndex outside the variation region list.',
	},

	// GDEF / Coverage / ClassDef
	GDEF_VERSION_INVALID: { rec: 'GDEF version must be 1.0, 1.2, or 1.3.' },
	COVERAGE_FORMAT_INVALID: { rec: 'Coverage table format must be 1 or 2.' },
	COVERAGE_GLYPH_OUT_OF_RANGE: { rec: 'A coverage glyph ID is ≥ numGlyphs.' },
	COVERAGE_GLYPHS_NOT_SORTED: {
		rec: 'Coverage format 1 glyph array must be strictly ascending.',
	},
	COVERAGE_RANGE_INVALID: { rec: 'Coverage format 2 range has start > end.' },
	COVERAGE_RANGES_NOT_SORTED: {
		rec: 'Coverage format 2 ranges must be sorted and non-overlapping.',
	},
	CLASSDEF_FORMAT_INVALID: { rec: 'ClassDef table format must be 1 or 2.' },
	CLASSDEF_GLYPH_OUT_OF_RANGE: { rec: 'A ClassDef glyph ID is ≥ numGlyphs.' },
	CLASSDEF_CLASS_OUT_OF_RANGE: {
		rec: 'A ClassDef class value exceeds the allowed maximum for this table.',
	},
	CLASSDEF_RANGE_INVALID: { rec: 'ClassDef format 2 range has start > end.' },
	CLASSDEF_RANGES_NOT_SORTED: {
		rec: 'ClassDef format 2 ranges must be sorted and non-overlapping.',
	},

	// GSUB / GPOS / Layout
	GSUB_SUBSTITUTE_GLYPH_OUT_OF_RANGE: {
		rec: 'A GSUB type 1 substitute glyph ID is ≥ numGlyphs.',
	},
	GSUB_LIGATURE_GLYPH_OUT_OF_RANGE: {
		rec: 'A GSUB type 4 ligature glyph ID is ≥ numGlyphs.',
	},
	GSUB_LIGATURE_COMPONENT_OUT_OF_RANGE: {
		rec: 'A GSUB type 4 ligature component glyph ID is ≥ numGlyphs.',
	},
	LAYOUT_LOOKUP_FLAG_INVALID: {
		rec: 'A GSUB/GPOS lookup has bits set above 0xFF in lookupFlag.',
	},
	LAYOUT_LOOKUP_FLAG_RESERVED: {
		rec: 'A GSUB/GPOS lookup uses reserved lookupFlag bits.',
	},

	// MATH
	MATH_VERSION_INVALID: { rec: 'MATH table version must be 0x00010000.' },

	// TTC
	TTC_VERSION_INVALID: { rec: 'TTC version must be 1.0 or 2.0.' },
	TTC_TOO_MANY_FONTS: {
		rec: 'TTC declares more than the 65535 font sanity limit.',
	},

	// WOFF1 / WOFF2
	WOFF1_FILE_SIZE_MISMATCH: {
		rec: 'WOFF1 header.length does not match the actual file length.',
	},
	WOFF1_SFNT_SIZE_MISMATCH: {
		rec: 'WOFF1 totalSfntSize does not match the decompressed size.',
	},
	WOFF1_RESERVED_FIELD_NONZERO: {
		rec: 'WOFF1 reserved header field must be 0.',
	},
	WOFF1_METADATA_BLOCK_INVALID: {
		rec: 'WOFF1 metadata block offset/length is invalid.',
	},
	WOFF1_PRIVATE_BLOCK_INVALID: {
		rec: 'WOFF1 private block offset/length is invalid.',
	},
	WOFF1_TRAILING_JUNK: {
		rec: 'WOFF1 file has trailing bytes past the declared length.',
	},
	WOFF2_FILE_SIZE_MISMATCH: {
		rec: 'WOFF2 header.length does not match the actual file length.',
	},
	WOFF2_DECOMPRESSED_SIZE_INVALID: {
		rec: 'WOFF2 totalSfntSize is unreasonable.',
	},
	WOFF2_RESERVED_FIELD_NONZERO: {
		rec: 'WOFF2 reserved header field must be 0.',
	},
};

// =========================================================================
//  Severity display
// =========================================================================

const SEVERITY_ICON = { error: '❌', warning: '⚠️', info: 'ℹ️' };
const SEVERITY_LABEL = { error: 'Error', warning: 'Warning', info: 'Info' };
const SEVERITY_CLASS = {
	error: 'dx-error',
	warning: 'dx-warning',
	info: 'dx-info',
};

// =========================================================================
//  Render
// =========================================================================

export const diagnoseTab = {
	id: 'diagnose',
	label: 'Diagnose',
	render,
};

function render(container, fontData, appContext) {
	const wrap = document.createElement('div');
	wrap.className = 'diagnose-page';

	const buffer = fontData._originalBuffer;
	if (!buffer) {
		wrap.innerHTML =
			'<p class="dx-empty">No original binary buffer available for diagnosis.</p>';
		container.appendChild(wrap);
		return;
	}

	const report = diagnoseFont(buffer);

	// ── Parse-error banner ──────────────────────────────────────────────
	// When the font failed to fully import, the loader stashes the thrown
	// error on `_loadError`.  Surface it prominently above the diagnostic
	// report — it explains *why* we're stuck on this tab.
	if (fontData._loadError) {
		const errBanner = document.createElement('div');
		errBanner.className = 'dx-parse-error';
		const msg = fontData._loadError.message || String(fontData._loadError);
		errBanner.innerHTML = `
			<div class="dx-parse-error-title">🚫 This font could not be loaded</div>
			<div class="dx-parse-error-msg"><code></code></div>
			<div class="dx-parse-error-hint">The diagnostic report below should explain what's wrong.</div>
		`;
		errBanner.querySelector('code').textContent = msg;
		wrap.appendChild(errBanner);
	}

	// ── Summary banner ──────────────────────────────────────────────────
	const banner = document.createElement('div');
	banner.className = report.valid
		? 'dx-banner dx-banner-ok'
		: 'dx-banner dx-banner-bad';

	const icon = report.valid ? '✅' : '🚫';
	const summaryParts = [];
	if (report.summary.errorCount)
		summaryParts.push(
			`${report.summary.errorCount} error${report.summary.errorCount !== 1 ? 's' : ''}`,
		);
	if (report.summary.warningCount)
		summaryParts.push(
			`${report.summary.warningCount} warning${report.summary.warningCount !== 1 ? 's' : ''}`,
		);
	if (report.summary.infoCount)
		summaryParts.push(
			`${report.summary.infoCount} info note${report.summary.infoCount !== 1 ? 's' : ''}`,
		);

	banner.innerHTML = `
		<span class="dx-banner-icon">${icon}</span>
		<span class="dx-banner-text">
			<strong>${report.valid ? 'No blocking errors detected' : 'Problems found'}</strong>
			<span class="dx-banner-counts">${summaryParts.join(', ')}</span>
		</span>
	`;

	// "Fix All" button if there's anything fixable
	const fixableIssues = report.issues.filter(
		(i) => i.severity !== 'info' && ISSUE_META[i.code]?.fix,
	);
	if (fixableIssues.length > 0) {
		const fixAllBtn = document.createElement('button');
		fixAllBtn.className = 'dx-fix-all-btn';
		fixAllBtn.textContent = `Fix All (${fixableIssues.length})`;
		fixAllBtn.addEventListener('click', () => {
			// Apply each fix and update its card's UI in place
			for (const btn of wrap.querySelectorAll('.dx-fix-btn')) {
				if (!btn.disabled) btn.click();
			}
			fixAllBtn.disabled = true;
			fixAllBtn.textContent = '✓ All fixed';
		});
		banner.appendChild(fixAllBtn);
	}

	wrap.appendChild(banner);

	// ── Issue list ──────────────────────────────────────────────────────
	// Group: errors first, then warnings, then info

	const groups = [
		{ severity: 'error', items: report.errors },
		{ severity: 'warning', items: report.warnings },
		{ severity: 'info', items: report.infos },
	];

	for (const group of groups) {
		if (group.items.length === 0) continue;

		const section = document.createElement('div');
		section.className = 'dx-section';

		const heading = document.createElement('h3');
		heading.className = `dx-section-heading ${SEVERITY_CLASS[group.severity]}`;
		heading.textContent = `${SEVERITY_ICON[group.severity]} ${SEVERITY_LABEL[group.severity]}s (${group.items.length})`;
		section.appendChild(heading);

		// Collapse infos by default
		let listContainer = section;
		if (group.severity === 'info') {
			const details = document.createElement('details');
			const summary = document.createElement('summary');
			summary.textContent = `${group.items.length} informational note${group.items.length !== 1 ? 's' : ''}`;
			summary.className = 'dx-info-summary';
			details.appendChild(summary);
			section.appendChild(details);
			listContainer = details;
		}

		for (const issue of group.items) {
			listContainer.appendChild(renderIssueCard(issue, fontData, appContext));
		}

		wrap.appendChild(section);
	}

	container.appendChild(wrap);
}

function renderIssueCard(issue, fontData, appContext) {
	const card = document.createElement('div');
	card.className = `dx-card ${SEVERITY_CLASS[issue.severity]}`;

	const meta = ISSUE_META[issue.code];
	const rec = meta?.rec || '';

	// Header row: icon + code + message
	const header = document.createElement('div');
	header.className = 'dx-card-header';
	header.innerHTML = `
		<span class="dx-card-icon">${SEVERITY_ICON[issue.severity]}</span>
		<code class="dx-card-code">${issue.code}</code>
		<span class="dx-card-msg">${escapeHTML(issue.message)}</span>
	`;
	card.appendChild(header);

	// Recommendation
	if (rec) {
		const recEl = document.createElement('div');
		recEl.className = 'dx-card-rec';
		recEl.innerHTML = `<strong>Recommendation:</strong> ${escapeHTML(rec)}`;
		card.appendChild(recEl);
	}

	// Fix button
	if (meta?.fix && issue.severity !== 'info') {
		const fixRow = document.createElement('div');
		fixRow.className = 'dx-card-fix';
		const fixBtn = document.createElement('button');
		fixBtn.className = 'dx-fix-btn';
		fixBtn.textContent = 'Fix it';
		fixBtn.addEventListener('click', () => {
			const result = meta.fix(fontData);
			if (result) {
				fixBtn.disabled = true;
				fixBtn.textContent = '✓ Fixed';
				const msg = document.createElement('span');
				msg.className = 'dx-fix-result';
				msg.textContent = result;
				fixRow.appendChild(msg);
				if (appContext?.markDirty) appContext.markDirty();
			}
		});
		fixRow.appendChild(fixBtn);
		card.appendChild(fixRow);
	}

	return card;
}

function escapeHTML(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
