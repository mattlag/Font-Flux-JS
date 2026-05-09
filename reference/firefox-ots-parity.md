# Firefox / OTS Validator Parity — Working Document

**Status:** research complete, implementation not started
**Goal:** bring `src/validate/diagnoseFont.js` to feature parity with Firefox's font sanitizer (OTS) so that "FFJS validator passes" ≈ "Firefox will load this font without complaint."
**Baseline at time of research:** FFJS v2.3.4 (post-CFF-version fix), ~50 diagnostic codes.

---

## 1. Background

Firefox does not load a font directly. Every font file goes through **OTS — the OpenType Sanitizer** — a C++ library Mozilla vendors from <https://github.com/khaledhosny/ots>. OTS does one of three things to every value it reads:

- **`Error()`** → reject the font (Firefox refuses to render it; surfaced as a console warning like _"downloadable font: Failed to read or incorrect magicNumber"_).
- **`Drop()`** → silently discard the offending table and continue with the rest of the font.
- **`Warning()`** → emit a console warning **and auto-fix** the value (clamp, recompute, mask reserved bits).

OTS is therefore the canonical "what does Firefox accept?" reference. If FFJS's validator catches everything OTS catches, a font that passes `font.validate()` will load cleanly in Firefox.

### Source locations

| Source                              | URL                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------- |
| Canonical OTS repo                  | <https://github.com/khaledhosny/ots>                                   |
| Raw source root                     | `https://raw.githubusercontent.com/khaledhosny/ots/main/src/<file>.cc` |
| Mozilla's vendored copy (identical) | <https://searchfox.org/mozilla-central/source/gfx/ots/src>             |

### Key OTS macros / patterns to look for when reading the source

```cpp
OTS_FAILURE_MSG_HDR("...")     // top-level error (returns false → reject font)
OTS_FAILURE_MSG_TAG("...", tag) // same, with table tag prefix
OTS_WARNING_MSG_HDR("...")      // top-level warning (continue)
return Error("...")             // table-method error → reject
Warning("...")                  // table-method warning + auto-fix
Drop("...")                     // table-method drop (table won't be serialized)
```

The `Table::Error/Warning/Drop` methods on the per-table classes are the most important — every `.cc` file under `src/` corresponds to one OpenType table.

---

## 2. Current FFJS validator codes (v2.3.4)

Extracted from `src/validate/diagnoseFont.js`. ~50 codes total, organized by phase. Full reference in [docs/validation.md](../docs/validation.md).

```
BAD_CHECKSUM, BAD_ENTRY_SELECTOR, BAD_MAGIC_NUMBER, BAD_RANGE_SHIFT,
BAD_SEARCH_RANGE, BAD_SF_VERSION, BAD_TABLE_TAG, BAD_UNITS_PER_EM,
CFF_CHARSTRING_NO_ENDCHAR, CFF_EMPTY_CHARSTRING, CFF_GLYPH_MISMATCH,
CMAP_SUBTABLES_NOT_SORTED, COLLECTION_HEADER_UNREADABLE, COLLECTION_INFO,
DIRECTORY_ENTRY_UNREADABLE, DIRECTORY_NOT_SORTED, DIRECTORY_TRUNCATED,
DUPLICATE_TABLE, EMPTY_COLLECTION, EMPTY_TABLE, EXCESSIVE_TABLES,
FORMAT_COLLECTION, FORMAT_WOFF1, FORMAT_WOFF2, GVAR_WITHOUT_FVAR,
HEADER_UNREADABLE, HHEA_HMTX_MISMATCH, HMTX_GLYPH_MISMATCH,
LOCA_BEYOND_GLYF, MISSING_REQUIRED_TABLE, MIXED_OUTLINES,
NAME_RECORDS_NOT_SORTED, NO_FAMILY_NAME, NO_OUTLINES, NO_READABLE_ENTRIES,
NO_STYLE_NAME, NO_TABLES, NOT_ARRAYBUFFER, POST_VERSION_INVALID_FOR_CFF,
TABLE_MISALIGNED, TABLE_OUT_OF_BOUNDS, TABLE_PARSE_FAILED, TABLE_PARSED,
TOO_SHORT, UNKNOWN_TABLE, VHEA_VMTX_MISMATCH, WOFF1_UNWRAP_FAILED,
WOFF1_UNWRAPPED, WOFF2_UNWRAP_FAILED, WOFF2_UNWRAPPED
```

### Architecture cheat sheet

`diagnoseFont.js` is structured as a sequence of phase functions, each operating on already-parsed material:

- `phaseFormatDetection` — sniff sfnt / wOFF / wOF2 / ttcf signature
- `phaseHeaderChecks` — sfntVersion, numTables, search/entry/range
- `phaseDirectoryChecks` — table directory entries, sort order, duplicate detection
- `phaseTableBoundsChecks` — per-entry offset/length sanity
- `phaseTableParse` — try to parse known tables, capture parse errors
- `phaseCrossTableChecks(parsedTables, entries, issues, sfnt)` — multi-table consistency

New checks should be added to whichever phase is appropriate. The `addIssue(list, severity, code, message)` helper is the single entry point.

---

## 3. Full OTS → FFJS comparison

Legend: 🔴 Error · 🟡 Warning (auto-fixed) · ⚫ Drop · ✓ FFJS covers · ✗ FFJS gap

### 3.1 Top-level / SFNT directory (`ots.cc`)

| OTS message                                                        | Sev    | FFJS code                                            | Match                                  |
| ------------------------------------------------------------------ | ------ | ---------------------------------------------------- | -------------------------------------- |
| `file less than 4 bytes`                                           | 🔴     | `TOO_SHORT`                                          | ✓                                      |
| `file exceeds 1GB`                                                 | 🔴     | —                                                    | ✗                                      |
| `error reading sfntVersion`                                        | 🔴     | `HEADER_UNREADABLE`                                  | ✓                                      |
| `invalid sfntVersion: %d`                                          | 🔴     | `BAD_SF_VERSION`                                     | ✓                                      |
| `excessive (or zero) number of tables` (cap 4096)                  | 🔴     | `EXCESSIVE_TABLES`                                   | ✓ partial (no upper cap)               |
| `bad table directory searchRange`                                  | 🟡 fix | `BAD_SEARCH_RANGE` (info, auto-fixed)                | ✓                                      |
| `bad table directory entrySelector`                                | 🟡 fix | `BAD_ENTRY_SELECTOR`                                 | ✓                                      |
| `bad table directory rangeShift`                                   | 🟡 fix | `BAD_RANGE_SHIFT`                                    | ✓                                      |
| `error reading table directory`                                    | 🔴     | `DIRECTORY_TRUNCATED` / `DIRECTORY_ENTRY_UNREADABLE` | ✓                                      |
| `Table directory is not correctly ordered`                         | 🟡     | `DIRECTORY_NOT_SORTED`                               | ✓                                      |
| `Invalid table tag: 0x%X` (non-ASCII chars)                        | 🟡     | `BAD_TABLE_TAG`                                      | ✓                                      |
| `misaligned table` (offset & 3)                                    | 🔴     | `TABLE_MISALIGNED`                                   | ✓                                      |
| `invalid table offset`                                             | 🔴     | `TABLE_OUT_OF_BOUNDS`                                | ✓                                      |
| `zero-length table`                                                | 🔴     | `EMPTY_TABLE`                                        | ✓                                      |
| `table length exceeds 1GB`                                         | 🔴     | —                                                    | ✗                                      |
| `table overruns end of file`                                       | 🔴     | `TABLE_OUT_OF_BOUNDS`                                | ✓                                      |
| `overlapping tables` (pairwise)                                    | 🔴     | —                                                    | ✗ **gap**                              |
| `missing required table`                                           | 🔴     | `MISSING_REQUIRED_TABLE`                             | ✓                                      |
| `Failed to parse table`                                            | 🔴     | `TABLE_PARSE_FAILED`                                 | ✓                                      |
| `wrong sfntVersion for glyph data` (TT vs CFF mismatch — auto-fix) | 🟡 fix | `MIXED_OUTLINES` (warn only)                         | partial                                |
| `wrong maxp version for glyph data`                                | 🔴     | —                                                    | ✗ **gap**                              |
| `font contains both CFF and glyf/loca tables` (drops one)          | ⚫     | `MIXED_OUTLINES` (warn only)                         | partial                                |
| `no supported glyph data table(s) present`                         | 🔴     | `NO_OUTLINES`                                        | ✓                                      |
| (duplicate tag detection)                                          | 🔴     | `DUPLICATE_TABLE`                                    | ✓ FFJS extra                           |
| (table checksum verification)                                      | —      | `BAD_CHECKSUM`                                       | ✓ FFJS extra (OTS recomputes silently) |

### 3.2 TTC container (`ots.cc::ProcessTTC`)

| OTS message                                        | Sev | FFJS                             |
| -------------------------------------------------- | --- | -------------------------------- |
| `Error reading TTC tag` / `Invalid TTC tag`        | 🔴  | `COLLECTION_HEADER_UNREADABLE` ✓ |
| `Invalid TTC version` (must be 0x10000 or 0x20000) | 🔴  | — ✗                              |
| `Too many fonts in TTC` (>0x10000)                 | 🔴  | — ✗                              |
| `Error reading offset to OffsetTable`              | 🔴  | `COLLECTION_HEADER_UNREADABLE` ✓ |

### 3.3 WOFF1 / WOFF2 wrappers

| OTS message                                  | Sev | FFJS                               |
| -------------------------------------------- | --- | ---------------------------------- |
| `invalid WOFF marker`                        | 🔴  | covered by `WOFF1_UNWRAP_FAILED` ✓ |
| `incorrect file size in WOFF header`         | 🔴  | — ✗                                |
| `error in reserved field of WOFF header`     | 🔴  | — ✗                                |
| `Invalid metadata block offset/length`       | 🔴  | — ✗                                |
| `Invalid private block offset/length`        | 🔴  | — ✗                                |
| `uncompressed sfnt size mismatch`            | 🔴  | — ✗                                |
| `junk before tables in WOFF file`            | 🔴  | — ✗                                |
| `File length mismatch (trailing junk?)`      | 🔴  | — ✗                                |
| `Failed to convert WOFF 2.0 font to SFNT`    | 🔴  | `WOFF2_UNWRAP_FAILED` ✓            |
| `Size of decompressed WOFF 2.0 exceeds %gMB` | 🔴  | — ✗                                |

→ **Major gap**: FFJS only checks "did the unwrap succeed", not WOFF header integrity.

### 3.4 `head` (`head.cc`)

| OTS message                                                     | Sev | FFJS                   |
| --------------------------------------------------------------- | --- | ---------------------- |
| `Failed to read table header`                                   | 🔴  | `TABLE_PARSE_FAILED` ✓ |
| `Unsupported majorVersion` (must be 1)                          | 🔴  | — ✗                    |
| `Failed to read or incorrect magicNumber` (≠ 0x5F0F3CF5)        | 🔴  | `BAD_MAGIC_NUMBER` ✓   |
| `unitsPerEm on in the range [16, 16384]`                        | 🔴  | `BAD_UNITS_PER_EM` ✓   |
| `Bad x dimension in the font bounding box` (xmin > xmax)        | 🔴  | — ✗                    |
| `Bad y dimension in the font bounding box` (ymin > ymax)        | 🔴  | — ✗                    |
| `Bad indexToLocFormat` (not 0/1)                                | 🔴  | — ✗                    |
| `Failed to read or bad glyphDataFormat` (must be 0)             | 🔴  | — ✗                    |
| Silent: masks `flags` to allowed bits (0..4, 11..13 → `0x381f`) | 🟡  | — ✗                    |
| Silent: masks `macStyle` to bits 0..6 (`0x7f`)                  | 🟡  | — ✗                    |

### 3.5 `maxp` (`maxp.cc`)

| OTS message                                            | Sev | FFJS |
| ------------------------------------------------------ | --- | ---- |
| `Unsupported table version 0x%x`                       | 🔴  | — ✗  |
| `numGlyphs is 0`                                       | 🔴  | — ✗  |
| `Unexpected version 0x%08x; attempting to read as 1.0` | 🟡  | — ✗  |
| `Failed to read v1.0 fields, downgrading to 0.5`       | 🟡  | — ✗  |
| `Bad maxZones` (auto-clamps to [1,2])                  | 🟡  | — ✗  |

### 3.6 `hhea` / `vhea`

| Check                                      | FFJS                                                    |
| ------------------------------------------ | ------------------------------------------------------- |
| `Unsupported majorVersion`                 | — ✗                                                     |
| numberOfHMetrics ↔ hmtx length consistency | `HHEA_HMTX_MISMATCH`, `VHEA_VMTX_MISMATCH` ✓ FFJS extra |

### 3.7 `cmap` (`cmap.cc`) — heaviest validator in OTS

| OTS message                                                                        | Sev | FFJS                                             |
| ---------------------------------------------------------------------------------- | --- | ------------------------------------------------ |
| `Non zero cmap version`                                                            | 🔴  | — ✗                                              |
| `No subtables in cmap!`                                                            | 🔴  | — ✗                                              |
| `Bad subtable offset in cmap subtable %d`                                          | 🔴  | — ✗                                              |
| `Excessive overlap count`                                                          | 🔴  | — ✗                                              |
| out-of-order subtables (warning)                                                   | 🟡  | `CMAP_SUBTABLES_NOT_SORTED` ✓                    |
| `No maxp table in font! Needed by cmap.`                                           | 🔴  | (caught upstream by `MISSING_REQUIRED_TABLE`) ~✓ |
| `Required OS/2 table missing` (from format 4)                                      | 🔴  | — ✗                                              |
| Format 4: `Languages should be 0`                                                  | 🔴  | — ✗                                              |
| Format 4: `Bad subcmap structure`                                                  | 🔴  | — ✗                                              |
| Format 4: `Segcount < 1`                                                           | 🔴  | — ✗                                              |
| Format 4: `expected search range != search range`                                  | 🔴  | — ✗                                              |
| Format 4: `entry selector != log2(segment count)`                                  | 🔴  | — ✗                                              |
| Format 4: `Non zero cmap subtable segment padding`                                 | 🔴  | — ✗                                              |
| Format 4: `bad id_range_offset` (auto-fix at terminator)                           | 🟡  | — ✗                                              |
| Format 4: `Out of order end range` / `out of order start range`                    | 🔴  | — ✗                                              |
| Format 4: `multiple 0xffff terminators found`                                      | 🟡  | — ✗                                              |
| Format 4: `Final segment start and end must be 0xFFFF`                             | 🔴  | — ✗                                              |
| Format 4: `Range glyph reference too high` (glyphID ≥ numGlyphs)                   | 🔴  | — ✗ **important**                                |
| Format 4: `bad glyph id offset`                                                    | 🔴  | — ✗                                              |
| Format 12/13: `subtable language should be zero`                                   | 🔴  | — ✗                                              |
| Format 12/13: bad startCharCode/endCharCode/startGlyphID (>0x10FFFF or >65535)     | 🔴  | — ✗                                              |
| Format 12: `endCharCode before startCharCode`                                      | 🔴  | — ✗                                              |
| Format 12: `bad startGlyphID` (range exceeds numGlyphs)                            | 🔴  | — ✗                                              |
| Format 12/13: out-of-order/overlapping groups                                      | 🔴  | — ✗                                              |
| Format 14: `Bad record variation selector` (must be Mongolian/VS/IVS ranges)       | 🔴  | — ✗                                              |
| Format 14: `Out of order variation selector`                                       | 🔴  | — ✗                                              |
| `no supported subtables were found` (no 3-0-4 / 3-1-4 / 0-3-4 / 3-10-12 / 3-10-13) | 🔴  | — ✗                                              |

→ **Major gap**: cmap subtable internals are essentially unvalidated.

### 3.8 `name` (`name.cc`)

| OTS message                                                            | Sev    | FFJS                                                           |
| ---------------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| `Failed to read table format or bad format` (>1)                       | 🔴     | — ✗                                                            |
| `Failed to read or bad stringOffset`                                   | 🔴     | — ✗                                                            |
| `name records are not sorted.` (auto-sort)                             | 🟡 fix | `NAME_RECORDS_NOT_SORTED` ✓                                    |
| Skips records with unknown platform/encoding (silent drop)             | ⚫     | — ✗                                                            |
| `bad end of tag` (lang tag overruns)                                   | 🔴     | — ✗                                                            |
| `Too long language tag` (>200 bytes UTF-16)                            | 🔴     | — ✗                                                            |
| `Bad table offset` (string overlaps records)                           | 🔴     | — ✗                                                            |
| Synthesizes nameIDs 1, 2, 4, 5, 6 if missing                           | 🟡 fix | `NO_FAMILY_NAME`, `NO_STYLE_NAME` (warn only, no synthesis) ~✓ |
| Sanitizes PostScript name (nameID 6) — replaces non-URI chars with `_` | 🟡 fix | — ✗                                                            |

### 3.9 `post` (`post.cc`)

| OTS message                                                                       | Sev    | FFJS                                                      |
| --------------------------------------------------------------------------------- | ------ | --------------------------------------------------------- |
| `Unsupported table version` (must be 1.0/2.0/3.0)                                 | 🔴     | — ✗                                                       |
| `Bad number of glyphs` (≠ maxp.numGlyphs)                                         | 🔴     | — ✗                                                       |
| `Bad string length` / `Bad string of length`                                      | 🔴     | — ✗                                                       |
| `Bad string index` (≥ num_strings)                                                | 🔴     | — ✗                                                       |
| `Only version supported for fonts with CFF table is 0x00030000` (auto-fix to 3.0) | 🟡 fix | `POST_VERSION_INVALID_FOR_CFF` ✓ (the recent Firefox fix) |

### 3.10 `OS/2` (`os2.cc`) — heavily lenient/auto-fixing

| OTS message                                                          | Sev       | FFJS |
| -------------------------------------------------------------------- | --------- | ---- |
| `Unsupported table version` (>5)                                     | 🔴        | — ✗  |
| `Bad usWeightClass` (clamp to [1,1000])                              | 🟡 fix    | — ✗  |
| `Bad usWidthClass` (clamp to [1,9])                                  | 🟡 fix    | — ✗  |
| Masks `fsType` reserved bits (`& 0x30f`)                             | 🟡 silent | — ✗  |
| `Bad ySubscriptXSize/...` (clamp neg→0)                              | 🟡 fix    | — ✗  |
| `Adjusting head.macStyle (italic/bold/regular) to match fsSelection` | 🟡 fix    | — ✗  |
| `fsSelection bits 8 and 9 must be unset for table version <4`        | 🟡        | — ✗  |
| `usFirstCharIndex > usLastCharIndex` (clamp)                         | 🟡 fix    | — ✗  |
| `Bad sTypoLineGap, setting to 0` (was negative)                      | 🟡 fix    | — ✗  |
| `Bad sxHeight / sCapHeight` (negative → 0)                           | 🟡 fix    | — ✗  |
| `usLowerOpticalPointSize > 0xFFFE` (clamp)                           | 🟡 fix    | — ✗  |
| `usUpperOpticalPointSize < 2` (clamp)                                | 🟡 fix    | — ✗  |

### 3.11 CFF / CFF2 (`cff.cc`, `cff_charstring.cc`)

OTS validates: header version, Top DICT operands, charstring opcodes, endchar presence, subroutine recursion depth, hint counts, etc. FFJS has:

| Check                                            | FFJS                          |
| ------------------------------------------------ | ----------------------------- |
| Empty charstring                                 | `CFF_EMPTY_CHARSTRING` ✓      |
| Charstring missing endchar                       | `CFF_CHARSTRING_NO_ENDCHAR` ✓ |
| Glyph count mismatch (CFF vs maxp)               | `CFF_GLYPH_MISMATCH` ✓        |
| Operator validity / stack underflow / subr depth | — ✗                           |

### 3.12 `glyf` / `loca`

| Check                                                | FFJS                 |
| ---------------------------------------------------- | -------------------- |
| Loca offset table within bounds                      | `LOCA_BEYOND_GLYF` ✓ |
| Glyph header bounds (numContours, xMin/xMax, etc.)   | — ✗                  |
| Composite glyph component cycle / depth              | — ✗                  |
| TrueType instructions safety (storage, stack limits) | — ✗                  |

### 3.13 Variable-font tables (`fvar`, `gvar`, `avar`, `cvar`, `HVAR`, `MVAR`, `STAT`, `VVAR`)

OTS heavily validates each (axis bounds, instance counts, ItemVariationStore structure, delta-set indices). FFJS has only `GVAR_WITHOUT_FVAR`. Everything else is a gap.

### 3.14 Layout tables (`GDEF`, `GSUB`, `GPOS`, `MATH`, `BASE`, `JSTF`)

OTS validates Lookup/Coverage/ClassDef/Subtable structure deeply (hundreds of checks). FFJS: none beyond presence/parse-failure detection.

---

## 4. Coverage summary

| Category                   | OTS checks        | FFJS coverage                          |
| -------------------------- | ----------------- | -------------------------------------- |
| Container & directory      | ~25               | **strong** (~18 covered)               |
| WOFF1/2 wrapper validation | ~12               | **weak** (just unwrap success/fail)    |
| `head`                     | 10                | partial (3/10)                         |
| `maxp`                     | 5                 | none (0/5)                             |
| `cmap`                     | ~30               | **very weak** (1/30 — sort order only) |
| `name`                     | 7                 | partial (1 auto-fix + 2 warnings)      |
| `post`                     | 5                 | partial (1 critical CFF check covered) |
| `OS/2`                     | ~12 sanitizations | none                                   |
| CFF/CFF2                   | dozens            | basic (3 charstring-level)             |
| `glyf` / `loca`            | ~15               | bounds only                            |
| Variable-font tables       | ~50 across tables | one cross-table check                  |
| Layout tables              | hundreds          | none                                   |

---

## 5. Recommended implementation order

Tackle in this order — earlier items are higher value-per-LOC and will catch the most "Firefox refuses to render this" cases.

### Tier 1 — quick wins (low LOC, high value)

1. **`MAXP_NUMGLYPHS_ZERO`** + **`MAXP_VERSION_INVALID`** — trivial.
2. **`HEAD_BBOX_INVERTED`** (`xMin > xMax` or `yMin > yMax`).
3. **`HEAD_INDEX_TO_LOC_FORMAT_INVALID`** (must be 0 or 1).
4. **`HEAD_GLYPH_DATA_FORMAT_INVALID`** (must be 0).
5. **`HEAD_MAJOR_VERSION_UNSUPPORTED`** + **`HHEA_MAJOR_VERSION_UNSUPPORTED`**.
6. **`POST_VERSION_UNSUPPORTED`** (only 1.0 / 2.0 / 3.0 allowed).
7. **`POST_NUMGLYPHS_MISMATCH`** (post 2.0 numGlyphs ≠ maxp.numGlyphs).
8. **`OS2_VERSION_INVALID`** (>5).
9. **`TTC_VERSION_INVALID`** + **`TTC_TOO_MANY_FONTS`**.

### Tier 2 — cmap deep validation (the largest single gap)

Recommend a new `phaseCmapDeep` phase or a `validateCmapSubtables(cmapTable, numGlyphs, issues)` helper invoked from `phaseCrossTableChecks`. Codes:

- `CMAP_VERSION_INVALID`
- `CMAP_NO_SUBTABLES`
- `CMAP_NO_SUPPORTED_SUBTABLE` (no 3-1-4 / 3-10-12 / 3-0-4 / 3-10-13)
- `CMAP_GLYPH_OUT_OF_RANGE` (glyphID ≥ numGlyphs) — **most important single check**
- `CMAP_FORMAT4_INVALID_TERMINATOR` (final segment must be 0xFFFF–0xFFFF)
- `CMAP_FORMAT4_SEGCOUNT_INVALID`
- `CMAP_FORMAT4_RANGES_OUT_OF_ORDER`
- `CMAP_FORMAT12_GROUPS_OUT_OF_ORDER`
- `CMAP_FORMAT12_END_BEFORE_START`
- `CMAP_FORMAT14_VS_OUT_OF_RANGE` (must be in Mongolian/VS/IVS ranges)
- `CMAP_LANGUAGE_NONZERO_FOR_WINDOWS` (platform 3 subtables must have language=0)

### Tier 3 — OS/2 sanitization (lots of small clamps) ✅ Shipped in v2.4.2

Implemented as `warning`-severity codes (matches OTS `Warning()` semantics).
Auto-fix is not yet wired through writers; callers can manually correct
the JSON before re-export. Codes shipped:

- `OS2_WEIGHT_CLAMPED` (1..1000)
- `OS2_WIDTH_CLAMPED` (1..9)
- `OS2_FSTYPE_RESERVED_BITS_SET` (mask `0x030F`)
- `OS2_NEGATIVE_SIZE` (sub/superscript x/y, strikeout)
- `OS2_FIRST_LAST_CHAR_INVERTED`
- `OS2_TYPO_LINEGAP_NEGATIVE`
- `OS2_X_HEIGHT_NEGATIVE` / `OS2_CAP_HEIGHT_NEGATIVE`
- `OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE` (lower ≤ 0xFFFE, upper ≥ 2; v5)
- `OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH` (cross-table italic/bold check)
- `HEAD_MACSTYLE_RESERVED_BITS_SET` (bonus — mask `0x007F`)

### Tier 4 — directory robustness ✅ Shipped in v2.4.2

- `TABLES_OVERLAPPING` (pairwise overlap detection — currently you only check `offset+length ≤ fileLength`).
- `TABLE_LENGTH_EXCEEDS_1GB`.
- `FILE_EXCEEDS_1GB`.
- `MAXP_VERSION_MISMATCH_FOR_OUTLINE` (TT requires v1.0, CFF requires v0.5).

### Tier 5 — name table

✅ Shipped in v2.4.3.

- `NAME_FORMAT_INVALID` (format/version >1).
- `NAME_STRING_OFFSET_INVALID` (storage offset before records or beyond table).
- `NAME_LANG_TAG_TOO_LONG` (>200 bytes).
- `NAME_RECORD_OUT_OF_BOUNDS` (string overruns table).
- `NAME_STRING_TOO_LONG` (warning, >32 KiB).
- `NAME_POSTSCRIPT_NAME_INVALID_CHARS` (warning, sanitize like OTS).

### Tier 6 — WOFF wrapper integrity

✅ Shipped in v2.4.4.

- `WOFF1_FILE_SIZE_MISMATCH`
- `WOFF1_RESERVED_FIELD_NONZERO`
- `WOFF1_METADATA_BLOCK_INVALID`
- `WOFF1_PRIVATE_BLOCK_INVALID`
- `WOFF1_SFNT_SIZE_MISMATCH`
- `WOFF1_TRAILING_JUNK` (warning)
- `WOFF2_FILE_SIZE_MISMATCH`
- `WOFF2_RESERVED_FIELD_NONZERO`
- `WOFF2_DECOMPRESSED_SIZE_INVALID`

### Tier 7 — deep table validation (largest scope)

Variable-font tables, layout tables (GSUB/GPOS/GDEF), CFF charstring opcode validation. This is a substantial body of work — consider doing it incrementally, table by table, prioritized by which tables real-world fonts most often have problems with (GSUB > GPOS > GDEF > variable-font tables > MATH).

---

## 6. Implementation guidance for the next agent

### Where to write code

- **All new checks** go in `src/validate/diagnoseFont.js` (or split into `src/validate/checks/<table>.js` if the file gets too big — check current file size first).
- **Documentation** for every new code goes in `docs/validation.md` under the appropriate severity table.
- **Tests** go in `test/diagnose.test.js` (existing) — add at least one positive (catches the bug) and one negative (clean font passes) per code.

### Pattern for a new check

```js
// In an appropriate phase function:
if (head.unitsPerEm < 16 || head.unitsPerEm > 16384) {
	addIssue(
		issues,
		'error',
		'BAD_UNITS_PER_EM',
		`unitsPerEm must be in range [16, 16384], got ${head.unitsPerEm}`,
	);
}
```

For auto-fix style (info severity), mutate the parsed table object in place and emit `info`:

```js
if (os2.usWeightClass < 1) {
	addIssue(
		issues,
		'info',
		'OS2_WEIGHT_CLAMPED',
		`usWeightClass ${os2.usWeightClass} clamped to 1`,
	);
	os2.usWeightClass = 1;
}
```

### How to verify against OTS directly

OTS ships a CLI: `ots-sanitize input.ttf output.ttf` prints all warnings/errors to stderr. Useful for ground-truth comparison on edge-case fonts. Build instructions: <https://github.com/khaledhosny/ots#building>.

The Mozilla console also surfaces every OTS message live — load a font in Firefox with the web console open and you'll see exactly what messages OTS emits for that file.

### Sample fonts for testing

`test/sample fonts/` already has a broad range. For deliberately-broken fonts to test new validators, the OTS test corpus is at <https://github.com/khaledhosny/ots/tree/main/tests/fonts> (most are unfortunately not in the repo — they were corpora-based).

A practical approach: write a small fuzzing helper that takes a clean font, mutates one byte (or one field via the JSON pipeline), and asserts the validator catches it.

### Versioning / process notes

- Per user convention: **bump patch on every coding change** (v2.x.y semver, keep major at 2 for now).
- User prefers small iterative PRs — implement one tier at a time and ship.
- Don't create new markdown docs documenting code changes unless asked — `docs/validation.md` is the single source of truth.
- `reference/agent-written-notes.md` gets numbered insights when something non-obvious is learned.

### Files to read first when picking this up

1. `src/validate/diagnoseFont.js` — existing validator (architecture, addIssue pattern, all phases)
2. `docs/validation.md` — current doc to extend
3. `test/diagnose.test.js` — test patterns to follow
4. `src/sfnt/table_*.js` — what fields are available on each parsed table object
5. `reference/agent-written-notes.md` — accumulated wisdom

---

## 7. Estimated scope

- **Tier 1**: ~9 codes, ~150 LOC, half a session.
- **Tier 2 (cmap)**: ~11 codes, ~400–600 LOC + tests, full session.
- **Tier 3 (OS/2)**: ~9 codes, ~250 LOC, half a session.
- **Tier 4**: ~4 codes, ~150 LOC, short session.
- **Tier 5 (name)**: ~5 codes, ~200 LOC, short session.
- **Tier 6 (WOFF)**: ~7 codes, ~300 LOC, short session.
- **Tier 7**: open-ended; multiple sessions per table family.

Tiers 1–6 together would close ~50 of OTS's most impactful checks and roughly double FFJS's diagnostic coverage. Tier 7 is the "long tail" — diminishing returns per LOC, but necessary for true 1:1 parity.

---

## 8. Open questions for the user when resuming

1. Should auto-fix codes (OS/2 clamps, head bit-masking) actually mutate the parsed font, or only report? Current FFJS pattern is to mutate (matches OTS behavior).
2. Should validator gain a `strict: true` option that treats OTS warnings as FFJS errors? Useful for "would Firefox even open this without a console message"?
3. Do we want a `font.validateAgainstFirefox()` alias as a discovery aid, or keep everything under `.validate()`?
4. For Tier 7, prioritize variable-font tables (modern fonts) or layout tables (broader impact)?
