# Diagnostics Guide

Use `diagnoseFont(buffer, options?)` to inspect a binary font file (TTF/OTF/WOFF/WOFF2/TTC/OTC) and get a structured report of structural problems, spec violations, and cross-table inconsistencies. Unlike `font.validate()` (which works on the parsed JSON), `diagnoseFont()` reads the raw bytes directly — making it the right tool for analyzing fonts that fail to import or that other tools (browsers, sanitizers) reject. Diagnosis is observational: it does not change the supplied buffer or apply repairs.

## API

```js
import { diagnoseFont } from 'font-flux-js';

const report = diagnoseFont(buffer); // ArrayBuffer
const selected = diagnoseFont(collectionBuffer, { faceIndex: 1 }); // second face only
if (!report.valid) {
	for (const e of report.errors) {
		console.error(`[${e.code}] ${e.message}`);
	}
}
```

By default, every TTC/OTC face is diagnosed. Collection directories are read at
their declared SFNT offsets; table offsets remain relative to the **whole file**.
Tables can be shared between faces, including tables located before a face's
directory. There is no heuristic reinterpretation of invalid file-relative
offsets as face-relative offsets. Standalone WOFF2 requires `await initWoff2()`
before diagnosis. **WOFF2 collections are currently unsupported**: the decoder
does not reconstruct file-relative TTC table offsets, so diagnosis reports
`WOFF2_COLLECTION_UNSUPPORTED` and skips face checks rather than blaming the
input for reconstruction defects. Raw TTC/OTC collections are supported.

### Options and bounded work

The optional object uses the same limit names/defaults as import. Limits must
be positive safe integers; `faceIndex` must be a non-negative safe integer.
Invalid options produce `INVALID_DIAGNOSTIC_OPTIONS`, not an exception.
An index beyond the number of faces produces `FACE_INDEX_OUT_OF_RANGE`;
only `faceIndex: 0` is valid for a standalone font.

| Option | Default | Scope |
| --- | --- | --- |
| `faceIndex` | omitted | Diagnose all collection faces, or only this zero-based face |
| `maxInputBytes` | 268435456 (256 MiB) | Original input bytes, checked before directory traversal or decompression |
| `maxFonts` | 64 | Declared collection face count, including when selecting one face |
| `maxTables` | 4096 | Entries per SFNT face and WOFF wrapper table directory |
| `maxTableBytes` | 268435456 | Sum of declared table lengths per diagnosed face (including duplicate/shared references within that face); checked before checksumming/parsing. WOFF1 also checks this before decompression |
| `maxUncompressedBytes` | 268435456 | Passed to WOFF1/WOFF2 decoders to bound declared/reconstructed font and metadata output; separate from compressed input size |
| `maxGlyphs` | 65535 | Parsed `maxp` count and CFF/CFF2 CharStrings counts; remaining parsing stops when exceeded |
| `maxPoints` | 10000000 | Passed to the TrueType `glyf` parser; cumulative simple-glyph points per face |
| `maxCharStringOperations` | 1000000 | Diagnostic CFF/CFF2 bytecode steps per glyph, including operands and recursive subroutine calls |

Limit failures are visible errors. `DIAGNOSTIC_LIMIT_EXCEEDED` identifies
input/count/table-byte/glyph limits; decoder limits use `WOFF1_UNWRAP_FAILED` or
`WOFF2_UNWRAP_FAILED`; `glyf` point limits use `TABLE_PARSE_FAILED`; CFF diagnostic
step limits use `CFF_OPERATION_LIMIT_EXCEEDED`. Messages describe skipped work.
One failed face does not discard independently readable face reports.

These are **partial resource controls, not a comprehensive security guarantee**.
They do not bound every parser allocation, recursion path, issue count, or
elapsed time. CFF glyph counts are checked after parsing the CFF table.
WOFF2's per-face table-byte check follows bounded decompression.
Shared tables may be decoded/checked again for each face; table/point/operation
limits are not a single aggregate collection budget. `maxPoints` does not
perform or bound CFF outline execution, which diagnosis does not run.

## Report format

```js
{
  valid: false,                     // true iff errors.length === 0
  errors:   [{ severity, code, message, faceIndex? }],
  warnings: [{ severity, code, message, faceIndex? }],
  infos:    [{ severity, code, message, faceIndex? }],
  issues:   [...],                  // all issues, in the order discovered
  summary: { errorCount, warningCount, infoCount, issueCount },
  faces: [{
    faceIndex: 0,
    valid, errors, warnings, infos, issues, summary
  }]
}
```

All legacy top-level fields remain. They aggregate container findings and the
requested faces. Every issue generated for a face carries its `faceIndex`,
including malformed-face errors; container/options findings have no `faceIndex`.
A face report contains the same legacy fields plus `faceIndex` (no nested
`faces`). Fatal input/limit failures may yield `faces: []`. An unreadable selected
face still receives an error report when its declared index is known.

## Severity levels

| Level       | Meaning                                                              | Effect on `valid` |
| ----------- | -------------------------------------------------------------------- | ----------------- |
| **error**   | Spec violation — font will likely be rejected by browsers/sanitizers | `valid = false`   |
| **warning** | Suspicious but tolerated — may still load                            | no effect         |
| **info**    | Informational — format detection, parse success, etc.                | no effect         |

## Diagnostic phases

`diagnoseFont()` detects the container once, then runs the face phases for each
requested face. A fatal face failure short-circuits that face, not the others.

1. **Signature** — buffer basics, magic-bytes detection, WOFF unwrapping.
2. **Header** — `sfVersion`, `numTables`, directory hint fields.
3. **Directory** — per-entry tag/offset/length validation, sort order.
4. **Required tables** — core + outline table presence.
5. **Checksums** — per-table OpenType checksum verification, including `head`
   with its `checksumAdjustment` field treated as zero. Original standalone
   SFNT files with an in-bounds `head` adjustment field are also checked for the
   whole-font sum `0xB1B0AFBA` (zero-padding a final partial word).
6. **Parse tables** — runs each table's parser to surface format errors.
7. **Cross-table checks** — consistency between related tables.

The standalone whole-font sum is **not** imposed on TTC/OTC, or on WOFF/WOFF2
reconstruction whose table placement may differ from the original SFNT.
Missing/truncated `head` tables cannot receive that check. Checksum findings
remain warnings; therefore `valid: true` does not imply checksum correctness.
Diagnosis is not exhaustive font certification, shaping validation, or a full
upstream sanitizer implementation. No standardized per-check coverage/outcome
ledger is provided by this API.

## Diagnostic code reference

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
| `FORMAT_COLLECTION`   | info     | File is a TTC/OTC collection; requested faces are diagnosed separately |

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
| `BAD_CHECKSUM` | warning  | A table's stored checksum differs from its recomputed checksum; `head.checksumAdjustment` is treated as zero |
| `BAD_CHECKSUM_ADJUSTMENT` | warning | An original standalone SFNT's whole-font sum is not `0xB1B0AFBA`; the adjustment or other font bytes are inconsistent |

### Phase 6 — Per-table parsing

| Code                 | Severity | What it catches                                                      |
| -------------------- | -------- | -------------------------------------------------------------------- |
| `TABLE_PARSED`       | info     | Successful parse confirmation for a table                            |
| `TABLE_PARSE_FAILED` | error    | A registered parser threw on the table's bytes (malformed structure) |

### Phase 7 — Cross-table consistency

| Code                                      | Severity | What it catches                                                                                                                                                             |
| ----------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BAD_MAGIC_NUMBER`                        | error    | `head.magicNumber` is not `0x5F0F3CF5`                                                                                                                                      |
| `BAD_UNITS_PER_EM`                        | error    | `head.unitsPerEm` is outside the spec range (16–16384)                                                                                                                      |
| `HEAD_MAJOR_VERSION_UNSUPPORTED`          | error    | `head.majorVersion` is not `1` — Firefox/OTS rejects this                                                                                                                   |
| `HEAD_BBOX_INVERTED`                      | error    | `head.xMin > head.xMax` or `head.yMin > head.yMax`                                                                                                                          |
| `HEAD_INDEX_TO_LOC_FORMAT_INVALID`        | error    | `head.indexToLocFormat` is not `0` (short offsets) or `1` (long offsets)                                                                                                    |
| `HEAD_GLYPH_DATA_FORMAT_INVALID`          | error    | `head.glyphDataFormat` is not `0` (the only currently-defined value)                                                                                                        |
| `MAXP_VERSION_INVALID`                    | error    | `maxp.version` is not `0x00005000` (0.5) or `0x00010000` (1.0)                                                                                                              |
| `MAXP_NUMGLYPHS_ZERO`                     | error    | `maxp.numGlyphs` is `0` — font contains no glyphs                                                                                                                           |
| `HHEA_MAJOR_VERSION_UNSUPPORTED`          | error    | `hhea.majorVersion` is not `1` — Firefox/OTS rejects this                                                                                                                   |
| `POST_VERSION_UNSUPPORTED`                | error    | `post.version` is not `1.0`, `2.0`, `2.5`, or `3.0`                                                                                                                         |
| `POST_NUMGLYPHS_MISMATCH`                 | error    | `post.numGlyphs` (version 2.0) does not equal `maxp.numGlyphs`                                                                                                              |
| `OS2_VERSION_INVALID`                     | error    | `OS/2.version` is outside the supported range `0..5`                                                                                                                        |
| `HMTX_GLYPH_MISMATCH`                     | warning  | `hmtx` total entry count (metrics + LSBs) does not equal `maxp.numGlyphs`                                                                                                   |
| `HHEA_HMTX_MISMATCH`                      | warning  | `hhea.numberOfHMetrics` does not equal the number of full metric entries in `hmtx`                                                                                          |
| `LOCA_BEYOND_GLYF`                        | error    | The final `loca` offset extends past the end of the `glyf` table                                                                                                            |
| `CFF_GLYPH_MISMATCH`                      | warning  | CFF charstrings count does not equal `maxp.numGlyphs`                                                                                                                       |
| `NO_FAMILY_NAME`                          | warning  | `name` table contains no family name record (nameID 1)                                                                                                                      |
| `NO_STYLE_NAME`                           | warning  | `name` table contains no style name record (nameID 2)                                                                                                                       |
| `NAME_RECORDS_NOT_SORTED`                 | error    | `name` records are not in ascending order by `(platformID, encodingID, languageID, nameID)` — Firefox/OTS rejects this                                                      |
| `CMAP_SUBTABLES_NOT_SORTED`               | error    | `cmap` encoding records are not in ascending order by `(platformID, encodingID, language)` — Firefox/OTS rejects this                                                       |
| `CMAP_VERSION_INVALID`                    | error    | `cmap.version` is non-zero — Firefox/OTS rejects this                                                                                                                       |
| `CMAP_NO_SUBTABLES`                       | error    | `cmap` has zero encoding records                                                                                                                                            |
| `CMAP_NO_SUPPORTED_SUBTABLE`              | error    | `cmap` lacks any well-known Unicode subtable: (3,1,4), (3,10,12), (3,10,13), (0,3,4), or (3,0,4)                                                                            |
| `CMAP_GLYPH_OUT_OF_RANGE`                 | error    | A `cmap` mapping points to a glyph id ≥ `maxp.numGlyphs` (formats 4, 12, 13, 14)                                                                                            |
| `CMAP_LANGUAGE_NONZERO_FOR_WINDOWS`       | error    | A Windows-platform (`platformID = 3`) subtable has `language ≠ 0` — Firefox/OTS rejects this                                                                                |
| `CMAP_FORMAT4_INVALID_TERMINATOR`         | error    | The final segment of a `cmap` format-4 subtable is not `[0xFFFF, 0xFFFF]`                                                                                                   |
| `CMAP_FORMAT4_SEGCOUNT_INVALID`           | error    | A `cmap` format-4 subtable has zero segments                                                                                                                                |
| `CMAP_FORMAT4_RANGES_OUT_OF_ORDER`        | error    | `cmap` format-4 segments overlap or are out of order (`startCode <= previous endCode`), or `startCode > endCode` |
| `CMAP_FORMAT12_END_BEFORE_START`          | error    | A `cmap` format-12/13 group has `endCharCode < startCharCode`                                                                                                               |
| `CMAP_FORMAT12_GROUPS_OUT_OF_ORDER`       | error    | `cmap` format-12/13 groups are not in ascending order or overlap                                                                                                            |
| `CMAP_FORMAT14_VS_OUT_OF_RANGE`           | error    | A `cmap` format-14 record is outside Unicode 16.0's Variation_Selector property: 180B-180D, **180F**, FE00-FE0F, E0100-E01EF; 180E is not a selector |
| `CMAP_FORMAT14_VS_OUT_OF_ORDER`           | error    | `cmap` format-14 variation-selector records are not in ascending order                                                                                                      |
| `OS2_WEIGHT_CLAMPED`                      | warning  | `OS/2.usWeightClass` is outside `[1, 1000]`; historical code retained, **no clamp or repair is performed** |
| `OS2_WIDTH_CLAMPED`                       | warning  | `OS/2.usWidthClass` is outside `[1, 9]`; historical code retained, **no clamp or repair is performed** |
| `OS2_FSTYPE_RESERVED_BITS_SET`            | warning  | `OS/2.fsType` has bits set outside the valid mask `0x030F` — OTS strips these                                                                                               |
| `OS2_NEGATIVE_SIZE`                       | warning  | A subscript, superscript, or strikeout size in `OS/2` is negative — OTS clamps to 0                                                                                         |
| `OS2_FIRST_LAST_CHAR_INVERTED`            | warning  | `OS/2.usFirstCharIndex > OS/2.usLastCharIndex`                                                                                                                              |
| `OS2_TYPO_LINEGAP_NEGATIVE`               | warning  | `OS/2.sTypoLineGap` is negative — OTS clamps to 0                                                                                                                           |
| `OS2_X_HEIGHT_NEGATIVE`                   | warning  | `OS/2.sxHeight` is negative (v2+)                                                                                                                                           |
| `OS2_CAP_HEIGHT_NEGATIVE`                 | warning  | `OS/2.sCapHeight` is negative (v2+)                                                                                                                                         |
| `OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE`      | warning  | `OS/2.usLowerOpticalPointSize > 0xFFFE` or `usUpperOpticalPointSize < 2` (v5)                                                                                               |
| `OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH`  | warning  | The italic/bold bits in `OS/2.fsSelection` do not match `head.macStyle`                                                                                                     |
| `HEAD_MACSTYLE_RESERVED_BITS_SET`         | warning  | `head.macStyle` has bits set outside the valid mask `0x007F`                                                                                                                |
| `FILE_EXCEEDS_1GB`                        | error    | The font file is larger than 1 GiB — Firefox/OTS rejects oversize fonts                                                                                                     |
| `TABLE_LENGTH_EXCEEDS_1GB`                | error    | A single table directory entry declares a length > 1 GiB                                                                                                                    |
| `TABLES_OVERLAPPING`                      | error    | Two tables in the directory share overlapping byte ranges                                                                                                                   |
| `MAXP_VERSION_MISMATCH_FOR_OUTLINE`       | error    | `maxp.version` does not match the font's outline flavor (TT requires 1.0; CFF/CFF2 requires 0.5)                                                                            |
| `NAME_FORMAT_INVALID`                     | error    | The `name` table format/version field is greater than 1 (only 0 and 1 are defined)                                                                                          |
| `NAME_STRING_OFFSET_INVALID`              | error    | `name.stringOffset` is before the end of the records or beyond the table length                                                                                             |
| `NAME_RECORD_OUT_OF_BOUNDS`               | error    | A `name` record's string runs past the end of the table                                                                                                                     |
| `NAME_LANG_TAG_TOO_LONG`                  | error    | A `name` language-tag record exceeds the 200-byte spec limit                                                                                                                |
| `NAME_STRING_TOO_LONG`                    | warning  | A `name` record string exceeds 32 KiB (suspicious; OTS rejects oversize names)                                                                                              |
| `NAME_POSTSCRIPT_NAME_INVALID_CHARS`      | warning  | The PostScript name (nameID 6) contains characters other than printable 7-bit ASCII excluding `[](){}<>/%`                                                                  |
| `WOFF1_FILE_SIZE_MISMATCH`                | error    | WOFF1 header `length` field does not match the actual file size                                                                                                             |
| `WOFF1_RESERVED_FIELD_NONZERO`            | error    | WOFF1 reserved field (offset 14) is not zero                                                                                                                                |
| `WOFF1_SFNT_SIZE_MISMATCH`                | error    | WOFF1 `totalSfntSize` does not match the size computed from the table directory                                                                                             |
| `WOFF1_METADATA_BLOCK_INVALID`            | error    | WOFF1 metadata block has inconsistent offset/length, or is out of bounds                                                                                                    |
| `WOFF1_PRIVATE_BLOCK_INVALID`             | error    | WOFF1 private block has inconsistent offset/length, or is out of bounds                                                                                                     |
| `WOFF1_TRAILING_JUNK`                     | warning  | WOFF1 file has > 3 bytes of trailing data after the last declared block                                                                                                     |
| `WOFF2_FILE_SIZE_MISMATCH`                | error    | WOFF2 header `length` field does not match the actual file size                                                                                                             |
| `WOFF2_RESERVED_FIELD_NONZERO`            | error    | WOFF2 reserved field (offset 14) is not zero                                                                                                                                |
| `WOFF2_DECOMPRESSED_SIZE_INVALID`         | error    | WOFF2 `totalSfntSize` or `totalCompressedSize` is implausible (too small or larger than the file)                                                                           |
| `HVAR_WITHOUT_FVAR`                       | error    | `HVAR` table is present without `fvar` — horizontal variation tables require a variation axis table                                                                         |
| `VVAR_WITHOUT_FVAR`                       | error    | `VVAR` table is present without `fvar`                                                                                                                                      |
| `MVAR_WITHOUT_FVAR`                       | error    | `MVAR` table is present without `fvar`                                                                                                                                      |
| `AVAR_WITHOUT_FVAR`                       | error    | `avar` table is present without `fvar`                                                                                                                                      |
| `FVAR_AXIS_RANGE_INVALID`                 | error    | An `fvar` axis violates min ≤ default ≤ max                                                                                                                                 |
| `FVAR_AXIS_DUPLICATE_TAG`                 | error    | Two `fvar` axes share the same axis tag                                                                                                                                     |
| `FVAR_INSTANCE_OUT_OF_RANGE`              | error    | An `fvar` instance coordinate falls outside its axis's [min, max] range                                                                                                     |
| `GSUB_LOOKUP_TYPE_INVALID`                | error    | A `GSUB` lookup has a `lookupType` outside [1, 8]                                                                                                                           |
| `GPOS_LOOKUP_TYPE_INVALID`                | error    | A `GPOS` lookup has a `lookupType` outside [1, 9]                                                                                                                           |
| `LAYOUT_LOOKUP_FLAG_RESERVED`             | warning  | A `GSUB`/`GPOS` lookup has reserved bits set in `lookupFlag` (mask `0x00E0`)                                                                                                |
| `LAYOUT_LOOKUP_FLAG_INVALID`              | error    | A lookup flag value is outside uint16 (internal helper guard); legal high-byte mark-attachment classes are accepted |
| `FVAR_AXIS_FLAGS_RESERVED`                | warning  | An `fvar` axis has reserved bits set in `flags` (only bit 0, `HIDDEN_AXIS`, is defined)                                                                                     |
| `FVAR_AXIS_NAMEID_RESERVED`               | warning  | An `fvar` axis `axisNameID` is < 256 (axis names should use IDs ≥ 256)                                                                                                      |
| `FVAR_AXIS_NAMEID_MISSING`                | warning  | An `fvar` axis `axisNameID` has no matching record in the `name` table                                                                                                      |
| `FVAR_INSTANCE_FLAGS_RESERVED`            | warning  | An `fvar` instance has reserved bits set in `flags`                                                                                                                         |
| `FVAR_INSTANCE_NAMEID_MISSING`            | warning  | An `fvar` instance `subfamilyNameID` or `postScriptNameID` has no matching `name` record                                                                                    |
| `STAT_VERSION_INVALID`                    | error    | `STAT` `majorVersion` is not 1                                                                                                                                              |
| `STAT_DESIGN_AXIS_SIZE_INVALID`           | error    | `STAT` `designAxisSize` is < 8                                                                                                                                              |
| `STAT_AXIS_DUPLICATE_TAG`                 | warning  | Two `STAT` design axes share the same `axisTag`                                                                                                                             |
| `STAT_MISSING_FVAR_AXIS`                  | warning  | `STAT` `designAxes` does not include an entry for one of the `fvar` axes                                                                                                    |
| `STAT_AXIS_VALUE_AXIS_INDEX_OUT_OF_RANGE` | error    | A `STAT` axisValue references an `axisIndex` that exceeds the number of design axes                                                                                         |
| `STAT_AXIS_VALUE_RANGE_INVALID`           | error    | A `STAT` axisValue (format 2) violates `rangeMin ≤ nominal ≤ rangeMax`                                                                                                      |
| `AVAR_SEGMENT_COUNT_MISMATCH`             | error    | `avar` segment-map count does not equal `fvar.axes.length`                                                                                                                  |
| `AVAR_COORD_OUT_OF_RANGE`                 | error    | An `avar` segment-map coordinate is outside `[-1, 1]`                                                                                                                       |
| `AVAR_FROM_COORD_NOT_INCREASING`          | error    | `avar` `fromCoordinate` values within a segment map are not strictly increasing                                                                                             |
| `AVAR_MISSING_REQUIRED_ENDPOINTS`         | error    | An `avar` segment map is non-empty but is missing one of the required identity entries `(-1,-1)`, `(0,0)`, `(1,1)`                                                          |
| `IVS_AXIS_COUNT_MISMATCH`                 | error    | An `ItemVariationStore` (in `HVAR`/`VVAR`/`MVAR`/`GDEF`) declares a different `axisCount` than `fvar`                                                                       |
| `IVS_REGION_COORD_OUT_OF_RANGE`           | error    | An `ItemVariationStore` region coordinate is outside `[-1, 1]`                                                                                                              |
| `IVS_REGION_PEAK_OUT_OF_ORDER`            | error    | An `ItemVariationStore` region violates `start ≤ peak ≤ end`                                                                                                                |
| `IVS_REGION_INDEX_OUT_OF_RANGE`           | error    | An `ItemVariationData` references a `regionIndex` ≥ `regionCount`                                                                                                           |
| `MVAR_VALUE_RECORD_SIZE_INVALID`          | error    | `MVAR` `valueRecordSize` is < 8                                                                                                                                             |
| `MVAR_DELTA_SET_OUTER_OUT_OF_RANGE`       | error    | An `MVAR` value record `deltaSetOuterIndex` exceeds the `ItemVariationData` count                                                                                           |
| `MVAR_DELTA_SET_INNER_OUT_OF_RANGE`       | error    | An `MVAR` value record `deltaSetInnerIndex` exceeds the `itemCount` of its `ItemVariationData`                                                                              |
| `GDEF_VERSION_INVALID`                    | error    | `GDEF` `majorVersion` is not 1                                                                                                                                              |
| `COVERAGE_FORMAT_INVALID`                 | error    | A Coverage table has a format other than 1 or 2                                                                                                                             |
| `COVERAGE_GLYPH_OUT_OF_RANGE`             | error    | A Coverage table references a glyph ID ≥ `numGlyphs`                                                                                                                        |
| `COVERAGE_GLYPHS_NOT_SORTED`              | error    | Coverage format 1 glyph list is not strictly ascending                                                                                                                      |
| `COVERAGE_RANGE_INVALID`                  | error    | A Coverage format 2 range has `start > end`                                                                                                                                 |
| `COVERAGE_RANGES_NOT_SORTED`              | error    | Coverage format 2 ranges overlap or are not in ascending order                                                                                                              |
| `CLASSDEF_FORMAT_INVALID`                 | error    | A ClassDef table has a format other than 1 or 2                                                                                                                             |
| `CLASSDEF_GLYPH_OUT_OF_RANGE`             | error    | A ClassDef table references a glyph ID ≥ `numGlyphs`                                                                                                                        |
| `CLASSDEF_RANGE_INVALID`                  | error    | A ClassDef format 2 range has `start > end`                                                                                                                                 |
| `CLASSDEF_RANGES_NOT_SORTED`              | error    | ClassDef format 2 ranges overlap or are not in ascending order                                                                                                              |
| `CLASSDEF_CLASS_OUT_OF_RANGE`             | error    | `GDEF.glyphClassDef` references a class > 4 (only base/ligature/mark/component are defined)                                                                                 |
| `GSUB_SUBSTITUTE_GLYPH_OUT_OF_RANGE`      | error    | A GSUB type 1 substitute glyph ID is ≥ `numGlyphs`                                                                                                                          |
| `GSUB_LIGATURE_GLYPH_OUT_OF_RANGE`        | error    | A GSUB type 4 ligature glyph ID is ≥ `numGlyphs`                                                                                                                            |
| `GSUB_LIGATURE_COMPONENT_OUT_OF_RANGE`    | error    | A GSUB type 4 ligature component glyph ID is ≥ `numGlyphs`                                                                                                                  |
| `MATH_VERSION_INVALID`                    | error    | `MATH` table version is not `0x00010000`                                                                                                                                    |
| `CFF_INVALID_OPERATOR`                    | error    | A CFF/CFF2 charstring uses an unrecognised one-byte or two-byte Type 2 operator                                                                                             |
| `CFF_INVALID_NUMBER`                      | error    | A CFF/CFF2 charstring contains a malformed numeric operand                                                                                                                  |
| `CFF_TRUNCATED_OPERAND`                   | error    | A CFF/CFF2 charstring is truncated mid-operand                                                                                                                              |
| `CFF_TRUNCATED_OPERATOR`                  | error    | A CFF/CFF2 charstring ends mid-operator (escape byte with no follow-up, or hintmask with insufficient mask bytes)                                                           |
| `CFF_STACK_UNDERFLOW`                     | error    | A CFF/CFF2 charstring operator (callsubr, blend, flex, …) was issued with insufficient operands on the stack                                                                |
| `CFF_STACK_OVERFLOW`                      | error    | A CFF/CFF2 charstring exceeded the Type 2 operand-stack limit (48 for CFF1, 513 for CFF2)                                                                                   |
| `CFF_SUBR_INDEX_OUT_OF_RANGE`             | error    | A CFF/CFF2 `callsubr`/`callgsubr` referenced a (biased) subroutine index outside the subroutine INDEX                                                                       |
| `CFF_SUBR_DEPTH_EXCEEDED`                 | error    | A CFF/CFF2 charstring exceeded the Type 2 subroutine recursion limit (10)                                                                                                   |
| `CFF_FDARRAY_MISSING`                    | error    | CID CFF1 / CFF2 glyph context has no font dictionaries; bytecode checks are skipped |
| `CFF_FDSELECT_MISSING`                   | error    | Required glyph-to-FD mapping is missing (only single-dictionary CFF2 may omit it) |
| `CFF_FD_INDEX_OUT_OF_RANGE`              | error    | A glyph's FDSelect entry is missing, nonintegral, or references a nonexistent dictionary; no fallback is used |
| `CFF_RETURN_OUTSIDE_SUBR`                | error    | CFF1 `return` occurs at glyph level, not inside a subroutine |
| `CFF_SUBR_NO_RETURN`                     | error    | Execution reaches the end of a CFF1 subroutine without `return` or `endchar` |
| `CFF_INVALID_OPERAND_COUNT`              | error    | Move, stem/mask, `endchar`, or `vsindex` has an invalid operand count for its CFF1/CFF2 context |
| `CFF_VARIATION_CONTEXT_MISSING`          | error    | CFF2 `vsindex`/`blend` requires a missing VariationStore |
| `CFF_VARIATION_CONTEXT_INVALID`          | error    | The selected CFF2 variation subtable or its region references are missing/invalid |
| `CFF_VSINDEX_OUT_OF_RANGE`               | error    | CFF2 `vsindex` is not a valid ItemVariationData index |
| `CFF_VSINDEX_ORDER_INVALID`              | error    | Charstring `vsindex` occurs more than once or after `blend`, including across calls |
| `CFF_BLEND_INVALID_COUNT`               | error    | CFF2 `blend` count is not a positive integer |
| `CFF_CONTEXT_UNSUPPORTED`               | warning  | A recognized context cannot be evaluated; the message identifies the skipped checks, not successful validation |
| `GLYF_COMPOSITE_CYCLE`                    | error    | A `glyf` composite chain forms a cycle (a composite directly or indirectly references itself)                                                                               |
| `GLYF_COMPOSITE_DEPTH_EXCEEDED`           | error    | A `glyf` composite chain nests deeper than the spec maximum of 16 levels                                                                                                    |
| `GLYF_COMPOSITE_GLYPH_OUT_OF_RANGE`       | error    | A `glyf` composite component references a glyph ID ≥ `numGlyphs`                                                                                                            |
| `GLYF_BBOX_INVERTED`                      | warning  | A `glyf` glyph has `xMin > xMax` or `yMin > yMax`                                                                                                                           |
| `GLYF_BBOX_OUTSIDE_HEAD`                  | warning  | A `glyf` glyph bounding box extends outside the `head.bbox`                                                                                                                 |
| `GLYF_NUM_CONTOURS_INVALID`               | error    | A `glyf` glyph has `numberOfContours < -1` (only ≥ −1 is valid)                                                                                                             |
| `CMAP_FORMAT14_VS_OUT_OF_RANGE`           | error    | A `cmap` format-14 record uses a variation selector outside Mongolian FVS, FE00–FE0F, or E0100–E01EF                                                                        |
| `CMAP_FORMAT14_VS_OUT_OF_ORDER`           | error    | `cmap` format-14 variation-selector records are not strictly ascending                                                                                                      |
| `CFF_EMPTY_CHARSTRING`                    | error    | A CFF glyph charstring is empty (must contain at least an `endchar` operator) — Firefox/OTS reports `Failed validating CharStrings INDEX`                                   |
| `CFF_CHARSTRING_NO_ENDCHAR`               | warning  | CFF1 glyph execution reaches its byte-string end without executing `endchar`, including in called subroutines |
| `POST_VERSION_INVALID_FOR_CFF`            | error    | A CFF-flavored font (with `CFF` or `CFF2`) uses a `post` version other than 3.0 — Firefox rejects this with "Only version supported for fonts with CFF table is 0x00030000" |
| `VHEA_VMTX_MISMATCH`                      | warning  | `vhea.numOfLongVerMetrics` does not equal the number of full metric entries in `vmtx`                                                                                       |
| `GVAR_WITHOUT_FVAR`                       | error    | `gvar` is present without `fvar` — glyph variations require an axis definition                                                                                              |
| `CMAP_FORMAT12_END_BEFORE_START`          | error    | A `cmap` format 12/13 group has `endCharCode < startCharCode`                                                                                                               |
| `CMAP_FORMAT12_GROUPS_NOT_SORTED`         | error    | `cmap` format 12/13 groups must be sorted by `startCharCode`                                                                                                                |
| `CMAP_FORMAT12_GROUPS_OVERLAP`            | error    | `cmap` format 12/13 group character ranges must be disjoint                                                                                                                 |
| `TT_INSTR_TRUNCATED_PUSH`                 | error    | A TrueType `PUSHB`/`PUSHW`/`NPUSHB`/`NPUSHW` operand list runs past the end of the instruction stream                                                                       |
| `TT_INSTR_UNBALANCED_IF`                  | error    | A TrueType `IF` block was never closed by an `EIF`                                                                                                                          |
| `TT_INSTR_UNBALANCED_EIF`                 | error    | A TrueType `EIF` appears with no matching `IF`                                                                                                                              |
| `TT_INSTR_NESTED_FDEF`                    | error    | A TrueType `FDEF` is nested inside another `FDEF`                                                                                                                           |
| `TT_INSTR_STRAY_ENDF`                     | error    | A TrueType `ENDF` appears outside any `FDEF`                                                                                                                                |
| `TT_INSTR_UNCLOSED_FDEF`                  | error    | A TrueType `FDEF` was never closed by `ENDF` before end of stream                                                                                                           |

### CFF/CFF2 execution coverage

Charstring checks select each glyph's FDSelect and Private DICT local subroutines,
including local calls made inside global subroutines. CFF1 uses the import
pipeline's glyph-context helper after validating FD references; invalid mappings
never fall back to the font-global Private DICT or FD 0. Only single-dictionary
CFF2 permits omitted FDSelect.

CFF1 `endchar` ends glyph execution even inside a subroutine; `return` is valid
only in a subroutine. CFF2 glyphs and subroutines end implicitly, and empty CFF2
programs are allowed. CFF1 `return`, `endchar`, and arithmetic/storage operators
are not CFF2 operators. CFF1 optional widths and shared stem counts are tracked
across calls; CFF2 does not accept width operands.

CFF2 blend checks inherit `vsindex` from the selected Private DICT (default 0),
allow one charstring override before blending, and use that VariationStore
subtable's region count to check stack consumption while preserving earlier
operands. These are structural checks, not variation interpolation. Blended
coordinates are not guessed when used as subroutine indices or blend counts.

`CFF_CONTEXT_UNSUPPORTED` explicitly marks incomplete checking for CFF1
arithmetic/storage operations, non-Type-2 programs, `endchar` composite components,
CFF2 Private DICT blend programs, or blended control/nested-blend operands.
This bounded walker is **not** a complete Type 2 VM, outline renderer, or
INDEX/DICT/charset/encoding validator. INDEX bounds failures are surfaced through
the existing parser as `TABLE_PARSE_FAILED`; raw FDSelect range/sentinel
validation and complete drawing/hint ordering or operand-count checks remain
outside this coverage. Warnings must not be interpreted as certification.
Diagnosis never appends terminators, replaces programs, or modifies source bytes.
Per-glyph operation, stack, and subroutine-depth limits still apply.

### Collection (TTC/OTC) checks

| Code                           | Severity | What it catches                                                   |
| ------------------------------ | -------- | ----------------------------------------------------------------- |
| `EMPTY_COLLECTION`             | error    | TTC/OTC declares zero contained fonts                             |
| `COLLECTION_INFO`              | info     | Reports the declared face count and requested scope |
| `COLLECTION_HEADER_UNREADABLE` | error    | Version-2 collection DSIG header fields are truncated |
| `NO_READABLE_ENTRIES`          | error    | A face's declared table directory has no readable entries |
| `TTC_VERSION_INVALID`          | error    | TTC version is not exactly `0x00010000` or `0x00020000` |
| `TTC_TOO_MANY_FONTS`           | error    | TTC `numFonts` exceeds `0x10000` — Firefox/OTS rejects this       |
| `TTC_OFFSETS_TRUNCATED`        | error    | The declared face-offset array does not fit in the file |
| `TTC_FACE_OFFSET_UNREADABLE`   | error    | The requested face's offset entry is missing |
| `TTC_FACE_OFFSET_INVALID`      | error    | Face header offset overlaps the collection header or cannot contain a 12-byte SFNT header within the file |
| `FACE_INDEX_OUT_OF_RANGE`      | error    | Requested face is outside the declared face count |

### Options and incomplete checks

| Code | Severity | Meaning |
| --- | --- | --- |
| `INVALID_DIAGNOSTIC_OPTIONS` | error | Invalid options object, limit value, or face-index value |
| `DIAGNOSTIC_LIMIT_EXCEEDED` | error | An input/count/table-byte/glyph limit prevented further work |
| `CFF_OPERATION_LIMIT_EXCEEDED` | error | Per-glyph CFF diagnostic step budget exceeded |
| `DIAGNOSTIC_CHECK_FAILED` | error | An unexpected face-check failure prevented remaining checks; findings and other faces are retained |
| `WOFF2_COLLECTION_UNSUPPORTED` | error | WOFF2 collection reconstruction currently prevents trustworthy face checks; no faces are diagnosed |

### Specification basis and regression scope

- [OpenType font file and collection organization](https://learn.microsoft.com/en-us/typography/opentype/spec/otff): file-relative TTC table offsets, shared tables, and checksum rules.
- [OpenType `head`](https://learn.microsoft.com/en-us/typography/opentype/spec/head): zero the adjustment for the table checksum; standalone adjustment target.
- [OpenType common layout formats](https://learn.microsoft.com/en-us/typography/opentype/spec/chapter2#lookup-table): `0xFF00` is the legal mark-attachment-class field, not invalid flags. Reserved low bits `0x00E0` retain warning severity.
- [OpenType `cmap`](https://learn.microsoft.com/en-us/typography/opentype/spec/cmap): disjoint format-4 segments and format-14 variation selectors.
- [Unicode 16.0 PropList.txt](https://www.unicode.org/Public/16.0.0/ucd/PropList.txt): the pinned `Variation_Selector` property, including U+180F but excluding U+180E.

Corrections and regression constructions are original FFJS implementations, not
copied upstream fixer code. Focused tests construct shared-table TTC/OTC
containers from existing repository samples, mutate specific bytes, and check
selector/range/flag boundaries, limits, per-face reports, and source immutability.

## Best practices

- Run `diagnoseFont()` on fonts that fail to load. Codes are FFJS identifiers, not a guarantee of matching every browser/sanitizer result.
- Re-diagnose the actual exported binary. Export normalization is not proof that all problems were repaired; check warnings and any limit/parse failures too.
- Use `font.validate()` instead when working with hand-authored JSON, before calling `font.export()`.
