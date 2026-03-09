# Analysis: `opentypejs/opentype.js`

Date: 2026-03-08
Repo reviewed: https://github.com/opentypejs/opentype.js (branch `master`)

## Scope

Two questions were investigated:

1. On import (`parse(buffer)`), what does opentype.js do beyond raw byte-to-object translation?
2. On export (`font.toArrayBuffer()` / `font.toTables()`), what values are calculated/derived so a user can omit them?

## 1) Import Behavior: More Than Translation?

Short answer: yes, definitely.

`parseBuffer()` (`src/opentype.mjs`) does parse raw bytes, but it also performs substantial normalization, wiring, deferred loading setup, and derived-property assignment.

### Import-time actions and derived behavior

- Signature/flavor detection and format normalization:
- Detects SFNT/TTF (`\0\1\0\0`, `true`, `typ1`), CFF (`OTTO`), WOFF (`wOFF` + flavor), rejects WOFF2 without external decompressor.
- Decompresses WOFF table payloads before table parsing (`uncompressTable`).

- Creates a synthetic empty runtime object first:
- Starts with `new Font({ empty: true })`, then fills it from tables.
- This means imported fonts use runtime defaults/managers from `Font` even though source data came from binary.

- Promotes select table fields to top-level font properties:
- From `head`: `font.unitsPerEm`, `indexToLocFormat`.
- From `hhea`: `font.ascender`, `font.descender`, `font.numberOfHMetrics`.
- From `maxp`: `font.numGlyphs`.
- From `name`: `font.names`.

- Assigns encoding strategy dynamically:
- `cmap` -> `font.encoding = new CmapEncoding(...)`.
- For CFF, builds `font.cffEncoding`; if no cmap mapping, falls back to CFF encoding.

- Constructs glyph set lazily (important):
- For TTF/glyf and CFF outlines, glyphs are represented by deferred loaders.
- In low-memory mode, glyphs are pushed only on demand (`font._push` + `GlyphSet.get`).
- Glyph bbox/path/points are lazily materialized (`defineDependentProperty` pattern).

- Builds Unicode and name back-links (not just table copies):
- `addGlyphNames(font, opt)` links glyph indexes to unicode values via cmap.
- In normal mode: assigns unicodes + glyph names immediately.
- In low-memory mode: builds `_IndexToUnicodeMap` and applies names/unicodes only when glyph is fetched.

- Merges hmtx metrics into glyph objects/runtime caches:
- Normal mode: `glyph.advanceWidth` and `glyph.leftSideBearing` assigned directly.
- Low-memory mode: cached in `font._hmtxTableData`, applied when glyph is fetched.

- Builds kerning and positioning runtime helpers:
- Parses legacy `kern` into `font.kerningPairs` (or `{}` fallback).
- Parses `GPOS` and calls `font.position.init()` to precompute default kerning lookups.

- Parses variable-font structures and binds them to runtime objects:
- Parses `fvar/stat/gvar/cvar/avar/hvar` when present.
- Variation data parsing includes lazy packed-delta parsing in some internals.

- Adds convenience aliases/managers:
- If `meta` exists, also assigns `font.metas = font.tables.meta`.
- Always initializes `font.palettes = new PaletteManager(font)`.

Conclusion: import path is a semantic hydration pipeline, not a passive byte mapping.

## 2) Export Behavior: What Is Calculated Automatically?

Short answer: a lot is calculated, and this is where users can omit many technical fields.

Export flow:

- `Font.toArrayBuffer()` -> `Font.toTables()` -> `sfnt.fontToTable(this)` (`src/tables/sfnt.mjs`).
- `fontToSfntTable` computes table data + SFNT wrapper metadata + checksums.

### Auto-calculated values during export

#### Global/glyph-derived metrics

Computed from glyphs (`glyph.getMetrics()`, widths, unicode scan):

- Font bbox: `xMin`, `yMin`, `xMax`, `yMax`.
- `advanceWidthMax`, average width, min/max side bearings.
- `usFirstCharIndex`, `usLastCharIndex`.
- `ulUnicodeRange1..4` from glyph unicodes.

#### `head` table

Calculated/forced:

- `flags` forced to `3`.
- `lowestRecPPEM` forced to `3`.
- `macStyle` derived from `weightClass` and `italicAngle`.
- BBox fields written from computed globals.
- `checkSumAdjustment` computed at end from full encoded sfnt bytes.

#### `hhea` table

Calculated:

- `advanceWidthMax`, `minLeftSideBearing`, `minRightSideBearing`.
- `xMaxExtent` computed.
- `numberOfHMetrics` set to `font.glyphs.length`.

#### `maxp` table

Calculated:

- `numGlyphs = font.glyphs.length`.

#### `OS/2` table

Calculated defaults/derived values (then merged with `font.tables.os2`):

- `xAvgCharWidth` from width average.
- `usFirstCharIndex`, `usLastCharIndex`.
- `ulUnicodeRange1..4`.
- `sTypoAscender`, `sTypoDescender`, `sTypoLineGap`.
- `usWinAscent`, `usWinDescent`.
- `sxHeight` and `sCapHeight` estimated from representative glyphs with fallback.
- `usDefaultChar`, `usBreakChar` default to space if present.
- `ulCodePageRange1` currently hardcoded to Latin-1 bit.

#### Name-related fields

Calculated/fallback-filled:

- `postScriptName` synthesized if missing (`Family-Style`, no spaces).
- `uniqueID` synthesized per platform from manufacturer + full name.
- `preferredFamily` and `preferredSubfamily` filled across unicode/mac/windows if missing.
- `ltag` generated only if language tags are needed by name records.

#### CFF table (`CFF `)

Calculated from glyph paths + naming metadata:

- `fontMatrix` from `1 / unitsPerEm`.
- `charsets` generated from glyph names (skips glyph 0 in charset list).
- `charStrings` generated from glyph outlines (`M/L/C/Q` converted to CFF ops).
- Uses standard encoding in CFF (`encoding = 0`), expecting cmap to be authoritative.
- Recomputes internal offsets for charset/charstrings/private dict.

#### SFNT container-level values

Calculated:

- Table record checksums.
- Table offsets + 4-byte alignment paddings.
- Record sorting by tag.
- Header values `numTables`, `searchRange`, `entrySelector`, `rangeShift`.
- Final `head.checkSumAdjustment`.

### Optional table write support notes

`sfnt.fontToSfntTable` includes optional writers for:

- `gsub`, `cpal`, `colr`, `stat`, `avar`, `cvar`, `fvar`, `gvar`, `gasp`, `svg`.

But write support is uneven:

- `gvar.make()` currently logs "not yet supported".
- `cvar.make()` currently logs "not yet supported".
- So these parse, but do not round-trip as full writers yet.

## Practical "what can user omit" guidance

If you model a JSON input API similar to opentype.js, users can usually omit these and let export derive them:

- Safe to derive automatically:
- Font bbox (`head.xMin..yMax`), most `hhea` metrics, `maxp.numGlyphs`.
- Most `OS/2` statistical/range metrics (`xAvgCharWidth`, unicode ranges, xHeight/capHeight, first/last char indexes).
- SFNT wrapper fields (table checksums, offsets, search params, checksum adjustment).
- `name` helper values (`uniqueID`, `postScriptName`, preferredFamily/preferredSubfamily).

- Usually still required from user or strongly recommended:
- Glyph outlines and `glyph.advanceWidth`.
- Core identity: family/style names, unitsPerEm, ascender/descender.
- Any intentional overrides (vendor ID, explicit fsSelection, typographic values).

- Edge caveat:
- opentype.js export path is CFF-centric (`CFF ` is always built); parsed CFF2 currently writes back as CFF v1.

## Direct answers to the two original questions

1. Import: yes, it does substantial extra work beyond byte translation, including decompression, runtime object hydration, lazy loader setup, cross-table linking, glyph unicode/name assignment, kerning/GPOS initialization, and manager initialization.

2. Export: many fields are computed automatically, especially table-container values and metrics derived from glyphs. This supports a higher-level authoring JSON where humans provide core glyph/name/metric intent and the exporter fills technical bookkeeping fields.
