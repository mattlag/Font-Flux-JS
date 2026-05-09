# Diagnostics Guide

Use `diagnoseFont(buffer)` to inspect a binary font file (TTF/OTF/WOFF/WOFF2/TTC/OTC) and get a structured report of structural problems, spec violations, and cross-table inconsistencies. Unlike `font.validate()` (which works on the parsed JSON), `diagnoseFont()` reads the raw bytes directly — making it the right tool for analyzing fonts that fail to import or that other tools (browsers, sanitizers) reject.

## API

```js
import { diagnoseFont } from 'font-flux-js';

const report = diagnoseFont(buffer); // ArrayBuffer
if (!report.valid) {
	for (const e of report.errors) {
		console.error(`[${e.code}] ${e.message}`);
	}
}
```

## Report format

```js
{
  valid: false,                     // true iff errors.length === 0
  errors:   [{ severity, code, message }],
  warnings: [{ severity, code, message }],
  infos:    [{ severity, code, message }],
  issues:   [...],                  // all issues, in the order discovered
  summary: { errorCount, warningCount, infoCount, issueCount }
}
```

## Severity levels

| Level       | Meaning                                                              | Effect on `valid` |
| ----------- | -------------------------------------------------------------------- | ----------------- |
| **error**   | Spec violation — font will likely be rejected by browsers/sanitizers | `valid = false`   |
| **warning** | Suspicious but tolerated — may still load                            | no effect         |
| **info**    | Informational — format detection, parse success, etc.                | no effect         |

## Diagnostic phases

`diagnoseFont()` runs the following phases in order. A fatal failure in an earlier phase short-circuits the rest.

1. **Signature** — buffer basics, magic-bytes detection, WOFF unwrapping.
2. **Header** — `sfVersion`, `numTables`, directory hint fields.
3. **Directory** — per-entry tag/offset/length validation, sort order.
4. **Required tables** — core + outline table presence.
5. **Checksums** — per-table OpenType checksum verification.
6. **Parse tables** — runs each table's parser to surface format errors.
7. **Cross-table checks** — consistency between related tables.

## Complete check reference

### Phase 1 — Signature & format

| Code                  | Severity | What it catches                                                  |
| --------------------- | -------- | ---------------------------------------------------------------- |
| `NOT_ARRAYBUFFER`     | error    | Input is not an `ArrayBuffer`                                    |
| `TOO_SHORT`           | error    | File is smaller than the 12-byte font header                     |
| `FORMAT_WOFF1`        | info     | File is WOFF1-wrapped (will be unwrapped before further checks)  |
| `WOFF1_UNWRAPPED`     | info     | WOFF1 successfully unwrapped to SFNT                             |
| `WOFF1_UNWRAP_FAILED` | error    | WOFF1 unwrap threw (corrupted compressed stream, bad header)     |
| `FORMAT_WOFF2`        | info     | File is WOFF2-wrapped                                            |
| `WOFF2_UNWRAPPED`     | info     | WOFF2 successfully unwrapped (requires `await initWoff2()`)      |
| `WOFF2_UNWRAP_FAILED` | error    | WOFF2 unwrap threw (decoder not initialized, corrupted Brotli)   |
| `FORMAT_COLLECTION`   | info     | File is a TTC/OTC collection — diagnosed at the collection level |

### Phase 2 — Header

| Code                 | Severity | What it catches                                                                |
| -------------------- | -------- | ------------------------------------------------------------------------------ |
| `HEADER_UNREADABLE`  | error    | Could not read the 12-byte font header                                         |
| `SF_VERSION`         | info     | Reports the detected outline format (TrueType / OpenType-CFF / Apple TrueType) |
| `BAD_SF_VERSION`     | error    | `sfVersion` is not a recognized magic value (`0x00010000`, `OTTO`, `true`)     |
| `NO_TABLES`          | error    | `numTables` is zero                                                            |
| `EXCESSIVE_TABLES`   | warning  | `numTables` exceeds a sane upper bound (potential corruption)                  |
| `BAD_SEARCH_RANGE`   | warning  | `searchRange` does not match the spec formula `2^floor(log2(numTables)) * 16`  |
| `BAD_ENTRY_SELECTOR` | warning  | `entrySelector` does not match `floor(log2(numTables))`                        |
| `BAD_RANGE_SHIFT`    | warning  | `rangeShift` does not match `numTables * 16 − searchRange`                     |

### Phase 3 — Table directory

| Code                         | Severity | What it catches                                                                                                       |
| ---------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `DIRECTORY_TRUNCATED`        | error    | The directory extends past the end of the file                                                                        |
| `DIRECTORY_ENTRY_UNREADABLE` | error    | A specific 16-byte directory entry could not be read                                                                  |
| `BAD_TABLE_TAG`              | error    | A table tag contains non-printable ASCII bytes                                                                        |
| `DUPLICATE_TABLE`            | error    | The same tag appears in two directory entries                                                                         |
| `TABLE_OUT_OF_BOUNDS`        | error    | A table's `offset + length` exceeds the file size                                                                     |
| `EMPTY_TABLE`                | warning  | A directory entry has zero length                                                                                     |
| `TABLE_MISALIGNED`           | warning  | Table data does not start on a 4-byte boundary (spec violation tolerated by most tools)                               |
| `DIRECTORY_NOT_SORTED`       | error    | Table directory is not in ascending tag order — Firefox/OTS rejects this (`Table directory is not correctly ordered`) |

### Phase 4 — Required tables

| Code                     | Severity | What it catches                                                                                 |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `MISSING_REQUIRED_TABLE` | error    | One of the seven core tables (`cmap`, `head`, `hhea`, `hmtx`, `maxp`, `name`, `post`) is absent |
| `NO_OUTLINES`            | error    | Neither TrueType (`glyf`/`loca`) nor CFF (`CFF `/`CFF2`) outlines present                       |
| `MIXED_OUTLINES`         | warning  | Both TrueType and CFF outline tables are present                                                |
| `UNKNOWN_TABLE`          | info     | A table tag is not recognized by Font Flux's parser registry                                    |

### Phase 5 — Checksums

| Code           | Severity | What it catches                                                                                                |
| -------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `BAD_CHECKSUM` | warning  | A table's stored `checksum` does not match the recomputed OpenType checksum (often safe; auto-fixed on export) |

### Phase 6 — Per-table parsing

| Code                 | Severity | What it catches                                                      |
| -------------------- | -------- | -------------------------------------------------------------------- |
| `TABLE_PARSED`       | info     | Successful parse confirmation for a table                            |
| `TABLE_PARSE_FAILED` | error    | A registered parser threw on the table's bytes (malformed structure) |

### Phase 7 — Cross-table consistency

| Code                                     | Severity | What it catches                                                                                                                                                             |
| ---------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BAD_MAGIC_NUMBER`                       | error    | `head.magicNumber` is not `0x5F0F3CF5`                                                                                                                                      |
| `BAD_UNITS_PER_EM`                       | error    | `head.unitsPerEm` is outside the spec range (16–16384)                                                                                                                      |
| `HEAD_MAJOR_VERSION_UNSUPPORTED`         | error    | `head.majorVersion` is not `1` — Firefox/OTS rejects this                                                                                                                   |
| `HEAD_BBOX_INVERTED`                     | error    | `head.xMin > head.xMax` or `head.yMin > head.yMax`                                                                                                                          |
| `HEAD_INDEX_TO_LOC_FORMAT_INVALID`       | error    | `head.indexToLocFormat` is not `0` (short offsets) or `1` (long offsets)                                                                                                    |
| `HEAD_GLYPH_DATA_FORMAT_INVALID`         | error    | `head.glyphDataFormat` is not `0` (the only currently-defined value)                                                                                                        |
| `MAXP_VERSION_INVALID`                   | error    | `maxp.version` is not `0x00005000` (0.5) or `0x00010000` (1.0)                                                                                                              |
| `MAXP_NUMGLYPHS_ZERO`                    | error    | `maxp.numGlyphs` is `0` — font contains no glyphs                                                                                                                           |
| `HHEA_MAJOR_VERSION_UNSUPPORTED`         | error    | `hhea.majorVersion` is not `1` — Firefox/OTS rejects this                                                                                                                   |
| `POST_VERSION_UNSUPPORTED`               | error    | `post.version` is not `1.0`, `2.0`, `2.5`, or `3.0`                                                                                                                         |
| `POST_NUMGLYPHS_MISMATCH`                | error    | `post.numGlyphs` (version 2.0) does not equal `maxp.numGlyphs`                                                                                                              |
| `OS2_VERSION_INVALID`                    | error    | `OS/2.version` is outside the supported range `0..5`                                                                                                                        |
| `HMTX_GLYPH_MISMATCH`                    | warning  | `hmtx` total entry count (metrics + LSBs) does not equal `maxp.numGlyphs`                                                                                                   |
| `HHEA_HMTX_MISMATCH`                     | warning  | `hhea.numberOfHMetrics` does not equal the number of full metric entries in `hmtx`                                                                                          |
| `LOCA_BEYOND_GLYF`                       | error    | The final `loca` offset extends past the end of the `glyf` table                                                                                                            |
| `CFF_GLYPH_MISMATCH`                     | warning  | CFF charstrings count does not equal `maxp.numGlyphs`                                                                                                                       |
| `NO_FAMILY_NAME`                         | warning  | `name` table contains no family name record (nameID 1)                                                                                                                      |
| `NO_STYLE_NAME`                          | warning  | `name` table contains no style name record (nameID 2)                                                                                                                       |
| `NAME_RECORDS_NOT_SORTED`                | error    | `name` records are not in ascending order by `(platformID, encodingID, languageID, nameID)` — Firefox/OTS rejects this                                                      |
| `CMAP_SUBTABLES_NOT_SORTED`              | error    | `cmap` encoding records are not in ascending order by `(platformID, encodingID, language)` — Firefox/OTS rejects this                                                       |
| `CMAP_VERSION_INVALID`                   | error    | `cmap.version` is non-zero — Firefox/OTS rejects this                                                                                                                       |
| `CMAP_NO_SUBTABLES`                      | error    | `cmap` has zero encoding records                                                                                                                                            |
| `CMAP_NO_SUPPORTED_SUBTABLE`             | error    | `cmap` lacks any well-known Unicode subtable: (3,1,4), (3,10,12), (3,10,13), (0,3,4), or (3,0,4)                                                                            |
| `CMAP_GLYPH_OUT_OF_RANGE`                | error    | A `cmap` mapping points to a glyph id ≥ `maxp.numGlyphs` (formats 4, 12, 13, 14)                                                                                            |
| `CMAP_LANGUAGE_NONZERO_FOR_WINDOWS`      | error    | A Windows-platform (`platformID = 3`) subtable has `language ≠ 0` — Firefox/OTS rejects this                                                                                |
| `CMAP_FORMAT4_INVALID_TERMINATOR`        | error    | The final segment of a `cmap` format-4 subtable is not `[0xFFFF, 0xFFFF]`                                                                                                   |
| `CMAP_FORMAT4_SEGCOUNT_INVALID`          | error    | A `cmap` format-4 subtable has zero segments                                                                                                                                |
| `CMAP_FORMAT4_RANGES_OUT_OF_ORDER`       | error    | `cmap` format-4 segments are not in ascending order, or `startCode > endCode`                                                                                               |
| `CMAP_FORMAT12_END_BEFORE_START`         | error    | A `cmap` format-12/13 group has `endCharCode < startCharCode`                                                                                                               |
| `CMAP_FORMAT12_GROUPS_OUT_OF_ORDER`      | error    | `cmap` format-12/13 groups are not in ascending order or overlap                                                                                                            |
| `CMAP_FORMAT14_VS_OUT_OF_RANGE`          | error    | A `cmap` format-14 record uses a code point outside the valid variation-selector ranges (Mongolian 180B-180D, VS1-16 FE00-FE0F, VS17-256 E0100-E01EF)                       |
| `CMAP_FORMAT14_VS_OUT_OF_ORDER`          | error    | `cmap` format-14 variation-selector records are not in ascending order                                                                                                      |
| `OS2_WEIGHT_CLAMPED`                     | warning  | `OS/2.usWeightClass` is outside `[1, 1000]` — OTS clamps silently                                                                                                           |
| `OS2_WIDTH_CLAMPED`                      | warning  | `OS/2.usWidthClass` is outside `[1, 9]` — OTS clamps silently                                                                                                               |
| `OS2_FSTYPE_RESERVED_BITS_SET`           | warning  | `OS/2.fsType` has bits set outside the valid mask `0x030F` — OTS strips these                                                                                               |
| `OS2_NEGATIVE_SIZE`                      | warning  | A subscript, superscript, or strikeout size in `OS/2` is negative — OTS clamps to 0                                                                                         |
| `OS2_FIRST_LAST_CHAR_INVERTED`           | warning  | `OS/2.usFirstCharIndex > OS/2.usLastCharIndex`                                                                                                                              |
| `OS2_TYPO_LINEGAP_NEGATIVE`              | warning  | `OS/2.sTypoLineGap` is negative — OTS clamps to 0                                                                                                                           |
| `OS2_X_HEIGHT_NEGATIVE`                  | warning  | `OS/2.sxHeight` is negative (v2+)                                                                                                                                           |
| `OS2_CAP_HEIGHT_NEGATIVE`                | warning  | `OS/2.sCapHeight` is negative (v2+)                                                                                                                                         |
| `OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE`     | warning  | `OS/2.usLowerOpticalPointSize > 0xFFFE` or `usUpperOpticalPointSize < 2` (v5)                                                                                               |
| `OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH` | warning  | The italic/bold bits in `OS/2.fsSelection` do not match `head.macStyle`                                                                                                     |
| `HEAD_MACSTYLE_RESERVED_BITS_SET`        | warning  | `head.macStyle` has bits set outside the valid mask `0x007F`                                                                                                                |
| `FILE_EXCEEDS_1GB`                       | error    | The font file is larger than 1 GiB — Firefox/OTS rejects oversize fonts                                                                                                     |
| `TABLE_LENGTH_EXCEEDS_1GB`               | error    | A single table directory entry declares a length > 1 GiB                                                                                                                    |
| `TABLES_OVERLAPPING`                     | error    | Two tables in the directory share overlapping byte ranges                                                                                                                   |
| `MAXP_VERSION_MISMATCH_FOR_OUTLINE`      | error    | `maxp.version` does not match the font's outline flavor (TT requires 1.0; CFF/CFF2 requires 0.5)                                                                            |
| `NAME_FORMAT_INVALID`                    | error    | The `name` table format/version field is greater than 1 (only 0 and 1 are defined)                                                                                          |
| `NAME_STRING_OFFSET_INVALID`             | error    | `name.stringOffset` is before the end of the records or beyond the table length                                                                                             |
| `NAME_RECORD_OUT_OF_BOUNDS`              | error    | A `name` record's string runs past the end of the table                                                                                                                     |
| `NAME_LANG_TAG_TOO_LONG`                 | error    | A `name` language-tag record exceeds the 200-byte spec limit                                                                                                                |
| `NAME_STRING_TOO_LONG`                   | warning  | A `name` record string exceeds 32 KiB (suspicious; OTS rejects oversize names)                                                                                              |
| `NAME_POSTSCRIPT_NAME_INVALID_CHARS`     | warning  | The PostScript name (nameID 6) contains characters other than printable 7-bit ASCII excluding `[](){}<>/%`                                                                  |
| `WOFF1_FILE_SIZE_MISMATCH`               | error    | WOFF1 header `length` field does not match the actual file size                                                                                                             |
| `WOFF1_RESERVED_FIELD_NONZERO`           | error    | WOFF1 reserved field (offset 14) is not zero                                                                                                                                |
| `WOFF1_SFNT_SIZE_MISMATCH`               | error    | WOFF1 `totalSfntSize` does not match the size computed from the table directory                                                                                             |
| `WOFF1_METADATA_BLOCK_INVALID`           | error    | WOFF1 metadata block has inconsistent offset/length, or is out of bounds                                                                                                    |
| `WOFF1_PRIVATE_BLOCK_INVALID`            | error    | WOFF1 private block has inconsistent offset/length, or is out of bounds                                                                                                     |
| `WOFF1_TRAILING_JUNK`                    | warning  | WOFF1 file has > 3 bytes of trailing data after the last declared block                                                                                                     |
| `WOFF2_FILE_SIZE_MISMATCH`               | error    | WOFF2 header `length` field does not match the actual file size                                                                                                             |
| `WOFF2_RESERVED_FIELD_NONZERO`           | error    | WOFF2 reserved field (offset 14) is not zero                                                                                                                                |
| `WOFF2_DECOMPRESSED_SIZE_INVALID`        | error    | WOFF2 `totalSfntSize` or `totalCompressedSize` is implausible (too small or larger than the file)                                                                           |
| `HVAR_WITHOUT_FVAR`                      | error    | `HVAR` table is present without `fvar` — horizontal variation tables require a variation axis table                                                                         |
| `VVAR_WITHOUT_FVAR`                      | error    | `VVAR` table is present without `fvar`                                                                                                                                      |
| `MVAR_WITHOUT_FVAR`                      | error    | `MVAR` table is present without `fvar`                                                                                                                                      |
| `AVAR_WITHOUT_FVAR`                      | error    | `avar` table is present without `fvar`                                                                                                                                      |
| `FVAR_AXIS_RANGE_INVALID`                | error    | An `fvar` axis violates min ≤ default ≤ max                                                                                                                                 |
| `FVAR_AXIS_DUPLICATE_TAG`                | error    | Two `fvar` axes share the same axis tag                                                                                                                                     |
| `FVAR_INSTANCE_OUT_OF_RANGE`             | error    | An `fvar` instance coordinate falls outside its axis's [min, max] range                                                                                                     |
| `GSUB_LOOKUP_TYPE_INVALID`               | error    | A `GSUB` lookup has a `lookupType` outside [1, 8]                                                                                                                           |
| `GPOS_LOOKUP_TYPE_INVALID`               | error    | A `GPOS` lookup has a `lookupType` outside [1, 9]                                                                                                                           |
| `LAYOUT_LOOKUP_FLAG_RESERVED`            | warning  | A `GSUB`/`GPOS` lookup has reserved bits set in `lookupFlag` (mask `0x00E0`)                                                                                                |
| `LAYOUT_LOOKUP_FLAG_INVALID`             | error    | A `GSUB`/`GPOS` lookup has bits set above `0x00FF` in `lookupFlag`                                                                                                          |
| `CFF_EMPTY_CHARSTRING`                   | error    | A CFF glyph charstring is empty (must contain at least an `endchar` operator) — Firefox/OTS reports `Failed validating CharStrings INDEX`                                   |
| `CFF_CHARSTRING_NO_ENDCHAR`              | warning  | A CFF glyph charstring does not terminate with `endchar` (0x0E) or `return` (0x0B)                                                                                          |
| `POST_VERSION_INVALID_FOR_CFF`           | error    | A CFF-flavored font (with `CFF` or `CFF2`) uses a `post` version other than 3.0 — Firefox rejects this with "Only version supported for fonts with CFF table is 0x00030000" |
| `VHEA_VMTX_MISMATCH`                     | warning  | `vhea.numOfLongVerMetrics` does not equal the number of full metric entries in `vmtx`                                                                                       |
| `GVAR_WITHOUT_FVAR`                      | error    | `gvar` is present without `fvar` — glyph variations require an axis definition                                                                                              |

### Collection (TTC/OTC) checks

| Code                           | Severity | What it catches                                                   |
| ------------------------------ | -------- | ----------------------------------------------------------------- |
| `EMPTY_COLLECTION`             | error    | TTC/OTC declares zero contained fonts                             |
| `COLLECTION_INFO`              | info     | Reports the collection version and font count                     |
| `COLLECTION_HEADER_UNREADABLE` | error    | Could not read the collection header                              |
| `NO_READABLE_ENTRIES`          | error    | None of the offsets in the collection header point to valid SFNTs |
| `TTC_VERSION_INVALID`          | error    | TTC `majorVersion` is not `1` or `2` — Firefox/OTS rejects this   |
| `TTC_TOO_MANY_FONTS`           | error    | TTC `numFonts` exceeds `0x10000` — Firefox/OTS rejects this       |

## Best practices

- Run `diagnoseFont()` on any font that fails to load in a browser. The error codes correspond directly to the messages browsers/sanitizers (Firefox/OTS) emit.
- For fonts you've authored or modified through Font Flux, an exported binary should produce zero errors when re-diagnosed — Font Flux automatically fixes the most common spec violations on export (directory ordering, cmap/name sort order, charstring termination).
- Use `font.validate()` instead when working with hand-authored JSON, before calling `font.export()`.
