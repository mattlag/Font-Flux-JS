# Analysis: `opentypejs/opentype.js` — Independent Review

Date: 2026-03-08  
Repo reviewed: https://github.com/opentypejs/opentype.js (branch `main`)  
Reviewer: Second agent (cross-checking existing analysis in `opentypejs-analysis.md`)

---

## Overview

Two questions were investigated:

1. On **import** (`parse(buffer)`), does opentype.js do anything beyond raw byte-to-JS translation?
2. On **export** (`font.toArrayBuffer()`), what fields are auto-calculated so a user constructing a font from scratch (or from JSON) can safely omit them?

---

## 1) Import: Beyond Raw Byte Translation

**Short answer: Yes, substantially.** The `parseBuffer()` function in `src/opentype.mjs` is not a passive byte-mapper. It performs significant semantic hydration, cross-table wiring, and runtime object construction.

### 1a) Format Detection & Decompression

- Reads the first 4 bytes to classify format: SFNT/TTF (`\0\1\0\0`, `true`, `typ1`), CFF (`OTTO`), WOFF (`wOFF` + flavor byte), or WOFF2 (rejected without external decompressor).
- WOFF table payloads are individually decompressed via `uncompressTable()` (zlib inflate) before table parsing.
- Sets `font.outlinesFormat` to `'truetype'` or `'cff'` — a runtime classification not present in raw bytes.

### 1b) Synthetic Empty Font Object

- Creates `new Font({empty: true})` first, then populates it. This means every imported font inherits the `Font` constructor's runtime infrastructure (encoding managers, position/substitution helpers, proxy on `tables`, etc.) even though the data came from binary.

### 1c) Top-Level Property Promotion

Certain table fields are copied up to top-level font properties for convenience:

| Table  | Font property set during parse                             |
| ------ | ---------------------------------------------------------- |
| `head` | `font.unitsPerEm`, local `indexToLocFormat`                |
| `hhea` | `font.ascender`, `font.descender`, `font.numberOfHMetrics` |
| `maxp` | `font.numGlyphs`                                           |
| `name` | `font.names` (alias to `font.tables.name`)                 |
| `post` | `font.glyphNames` = `new GlyphNames(post)`                 |
| `meta` | `font.metas` (alias to `font.tables.meta`)                 |
| `cmap` | `font.encoding` = `new CmapEncoding(cmap)`                 |

### 1d) Cross-Table Linking & Glyph Augmentation

- **hmtx → glyphs**: `parseHmtxTable()` merges `advanceWidth` and `leftSideBearing` directly onto each glyph object (normal mode) or caches them in `font._hmtxTableData` (low-memory mode, applied on glyph access).
- **cmap → glyphs (unicode assignment)**: `addGlyphNames(font, opt)` iterates `cmap.glyphIndexMap` and calls `glyph.addUnicode(parseInt(charCode))` for each mapping, then assigns `glyph.name` from either the CFF charset or the `post` table's glyph name list.
- **In low-memory mode**: Builds `font._IndexToUnicodeMap` instead, and defers name/unicode assignment until the glyph is actually fetched via `GlyphSet.get()`.

### 1e) Lazy Glyph Loading (Not Just Byte Copying)

For both TTF and CFF glyphs, the import does **not** eagerly parse glyph outlines. Instead:

- **TTF**: `ttfGlyphLoader()` returns a factory function. The glyph's `path` is a getter that, when first accessed, calls `parseGlyph(glyph, data, position)` + `buildPath()`. Properties like `xMin`, `yMin`, `xMax`, `yMax`, `points`, `numberOfContours` are bound via `defineDependentProperty()` — they only resolve when the path is first accessed.
- **CFF**: `cffGlyphLoader()` similarly defers `parseCFFCharstring()` to first `.path` access.
- **Low-memory mode**: Glyphs aren't even pushed into the GlyphSet until `font._push(index)` is called (triggered by `GlyphSet.get()`).

This is a significant architectural decision — the import creates a _smart_ object graph, not a passive data dump.

### 1f) Runtime Manager Initialization

- `font.position = new Position(font)` — initialized in Font constructor.
- After GPOS parsing: `font.position.init()` pre-computes default kerning lookups.
- `font.substitution = new Substitution(font)` — initialized in Font constructor, wired to GSUB if present.
- `font.kerningPairs` = parsed `kern` table (or `{}` if absent).
- `font.palettes = new PaletteManager(font)` — always initialized at end of parse.

### 1g) Variable Font Wiring

The following tables are parsed with cross-table dependencies:

- `fvar` parsed → passed to `stat`, `gvar`, `cvar`, `avar`, `hvar` parsers.
- `gvar` receives `font.glyphs` reference for per-glyph variation data.
- `cvar` receives `font.tables.cvt` for CVT variation.
- Lazy delta parsing inside `parseTupleVariationStore` uses `Object.defineProperty` getters.

### 1h) Validation / Warnings During Parse

- Checks `head.magicNumber === 0x5F0F3CF5`.
- Warns (but doesn't error) on missing table dependencies (e.g., gvar without fvar, hvar without hmtx).
- `gasp` parsing wrapped in try/catch — silently skips on failure.

### Import Summary

The import path is a **semantic hydration pipeline**:

1. Decompress → 2. Parse raw tables → 3. Promote key fields → 4. Cross-link tables to glyphs → 5. Build lazy glyph loaders → 6. Initialize runtime managers → 7. Wire variable font data

---

## 2) Export: What Is Auto-Calculated

**Short answer: Many fields are derived from glyph data and naming, making it possible for users to omit most technical bookkeeping fields.**

The export chain is:
`Font.toArrayBuffer()` → `Font.toTables()` → `sfnt.fontToSfntTable(font)` → `makeSfntTable(tables)` → binary encoding.

### 2a) Glyph-Derived Global Metrics

`fontToSfntTable()` (in `src/tables/sfnt.mjs`) iterates all glyphs and computes:

```
for each glyph:
  glyph.getMetrics() → { xMin, yMin, xMax, yMax, leftSideBearing, rightSideBearing }
  glyph.advanceWidth
  glyph.unicodes → used for firstCharIndex, lastCharIndex, ulUnicodeRange1-4
```

These are aggregated into a `globals` object:

- `globals.xMin` = min of all glyph xMins
- `globals.yMin` = min of all yMins
- `globals.xMax` = max of all xMaxes
- `globals.yMax` = max of all yMaxes
- `globals.advanceWidthMax` = max advance width
- `globals.advanceWidthAvg` = average advance width
- `globals.minLeftSideBearing` / `globals.maxLeftSideBearing`
- `globals.minRightSideBearing`
- `globals.ascender` = `font.ascender` (from hhea or user)
- `globals.descender` = `font.descender`

### 2b) head Table — Auto-Calculated Fields

| Field                  | Source                                                                             | User can omit?                 |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------ |
| `version`              | Hardcoded `0x00010000`                                                             | Yes                            |
| `fontRevision`         | Hardcoded `0x00010000`                                                             | Yes                            |
| `checkSumAdjustment`   | Computed from full SFNT bytes at end                                               | **Yes** (always overwritten)   |
| `magicNumber`          | Hardcoded `0x5F0F3CF5`                                                             | Yes                            |
| `flags`                | Hardcoded `3`                                                                      | Yes (but limits customization) |
| `unitsPerEm`           | From `font.unitsPerEm`                                                             | **Required from user**         |
| `created` / `modified` | `Date.now()` or `font.createdTimestamp`                                            | Yes (auto-set to now)          |
| `xMin/yMin/xMax/yMax`  | Computed from glyph metrics                                                        | **Yes**                        |
| `macStyle`             | Derived from `font.weightClass` (≥600 = BOLD) and `font.italicAngle` (<0 = ITALIC) | Yes                            |
| `lowestRecPPEM`        | Hardcoded `3`                                                                      | Yes                            |
| `fontDirectionHint`    | Hardcoded `2`                                                                      | Yes                            |
| `indexToLocFormat`     | Hardcoded `0`                                                                      | Yes                            |

### 2c) hhea Table — Auto-Calculated Fields

| Field                 | Source                                                       |
| --------------------- | ------------------------------------------------------------ |
| `ascender`            | `globals.ascender` (= `font.ascender`)                       |
| `descender`           | `globals.descender` (= `font.descender`)                     |
| `advanceWidthMax`     | Max of all glyph advance widths                              |
| `minLeftSideBearing`  | Min of all glyphs' left side bearings                        |
| `minRightSideBearing` | Min of all glyphs' right side bearings                       |
| `xMaxExtent`          | `globals.maxLeftSideBearing + (globals.xMax - globals.xMin)` |
| `numberOfHMetrics`    | `font.glyphs.length`                                         |

All except ascender/descender are derived from glyphs. User needs to supply `font.ascender` and `font.descender`.

### 2d) maxp Table — Fully Auto

- `numGlyphs` = `font.glyphs.length`
- `version` = hardcoded CFF version (`0x00005000`)

### 2e) OS/2 Table — Heavily Auto-Calculated

The `fontToSfntTable` computes defaults, then merges with `font.tables.os2` (user overrides win):

| Field               | Auto-computed value                                                              | User can omit?                   |
| ------------------- | -------------------------------------------------------------------------------- | -------------------------------- |
| `xAvgCharWidth`     | `Math.round(globals.advanceWidthAvg)`                                            | Yes                              |
| `usFirstCharIndex`  | Min unicode across all glyphs                                                    | Yes                              |
| `usLastCharIndex`   | Max unicode across all glyphs                                                    | Yes                              |
| `ulUnicodeRange1-4` | Computed from glyph unicode coverage                                             | Yes                              |
| `sTypoAscender`     | `globals.ascender`                                                               | Yes (derived from font.ascender) |
| `sTypoDescender`    | `globals.descender`                                                              | Yes                              |
| `sTypoLineGap`      | `0`                                                                              | Yes                              |
| `usWinAscent`       | `globals.yMax`                                                                   | Yes                              |
| `usWinDescent`      | `Math.abs(globals.yMin)`                                                         | Yes                              |
| `ulCodePageRange1`  | Hardcoded `1` (Latin-1 only — **FIXME** in code)                                 | Yes (but limited)                |
| `sxHeight`          | Estimated from metrics of chars `x`, `y`, `v`, `w` (with fallback to ascender/2) | Yes                              |
| `sCapHeight`        | Estimated from metrics of `H`, `I`, `K`, `L`, `E`, `F`, `J`, `M`, etc.           | Yes                              |
| `usDefaultChar`     | `32` if space glyph exists, else `0`                                             | Yes                              |
| `usBreakChar`       | `32` if space glyph exists, else `0`                                             | Yes                              |
| `usWeightClass`     | From `font.tables.os2` if set, else `0`                                          | Recommended to set               |
| `fsSelection`       | From `font.tables.os2` if set                                                    | Recommended to set               |
| `achVendID`         | Default `'XXXX'`                                                                 | Can omit (gets default)          |

Note: The `Object.assign(computed, font.tables.os2)` pattern means user-supplied values in `font.tables.os2` **override** all auto-computed values.

### 2f) name Table — Synthesized Fields

| Field                                          | Auto-behavior                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `fullName`                                     | `familyName + ' ' + styleName`                                         |
| `postScriptName`                               | `familyName.replace(/\s/g, '') + '-' + styleName` (if not already set) |
| `uniqueID`                                     | `manufacturer + ': ' + fullName` per platform                          |
| `preferredFamily`                              | Falls back across unicode/macintosh/windows platforms                  |
| `preferredSubfamily`                           | Falls back across platforms                                            |
| `version`                                      | `'Version 0.1'` (from Font constructor defaults)                       |
| `copyright`, `trademark`, `manufacturer`, etc. | Default to `' '` (single space) in Font constructor                    |

The name table is synthesized for all three platforms (unicode, macintosh, windows) with cross-platform fallbacks.

### 2g) CFF Table — Fully Derived from Glyphs

| Component        | Source                                                             |
| ---------------- | ------------------------------------------------------------------ |
| `fontMatrix`     | `1 / unitsPerEm`                                                   |
| `charsets`       | Generated from glyph names (SID encoding)                          |
| `charStrings`    | Generated from glyph path commands (M/L/C/Q → CFF charstring ops)  |
| `encoding`       | Hardcoded `0` (standard; cmap is authoritative)                    |
| Internal offsets | Recomputed from summed sizes of header/nameIndex/topDictIndex/etc. |
| `fontBBox`       | `[0, globals.yMin, globals.ascender, globals.advanceWidthMax]`     |
| `topDict`        | Merged with `font.tables.cff.topDict` if present                   |

**Important CFF limitation**: opentype.js always writes CFF v1, even if the source was CFF2. This is acknowledged in a TODO comment.

### 2h) post Table — Mostly Defaults

| Field            | Value                                                               |
| ---------------- | ------------------------------------------------------------------- |
| `version`        | Hardcoded `3.0` (no glyph names stored)                             |
| `italicAngle`    | From `font.tables.post.italicAngle` or `font.italicAngle * 0x10000` |
| All other fields | `0` defaults, overridable from `font.tables.post`                   |

### 2i) hmtx Table — From Glyphs

- Each glyph's `advanceWidth` and `leftSideBearing` are written directly.
- Falls back to `0` if either is missing.

### 2j) cmap Table — From Glyph Unicodes

- Auto-generates format 4 (BMP) or format 12 (full Unicode) subtables.
- Iterates all `glyph.unicodes` to build segment map.
- Completely auto-generated from glyph data.

### 2k) SFNT Container — Fully Auto

| Field                   | Auto-computed                             |
| ----------------------- | ----------------------------------------- |
| `numTables`             | Count of tables array                     |
| `searchRange`           | `16 * highestPowerOf2(numTables)`         |
| `entrySelector`         | `log2(highestPowerOf2)`                   |
| `rangeShift`            | `numTables * 16 - searchRange`            |
| Table record checksums  | `computeCheckSum(table.encode())`         |
| Table offsets           | Accumulated with 4-byte alignment padding |
| `checkSumAdjustment`    | `0xB1B0AFBA - wholeFileChecksum`          |
| Table record sort order | Alphabetical by tag                       |

### 2l) Optional Tables — Write Support Status

| Table  | Write support                                |
| ------ | -------------------------------------------- |
| `gsub` | **Yes** — full round-trip                    |
| `gpos` | **Yes** — full round-trip                    |
| `cpal` | **Yes**                                      |
| `colr` | **Yes**                                      |
| `stat` | **Yes**                                      |
| `avar` | **Yes**                                      |
| `fvar` | **Yes**                                      |
| `gasp` | **Yes**                                      |
| `svg`  | **Yes**                                      |
| `gvar` | **No** — `console.warn('not yet supported')` |
| `cvar` | **No** — `console.warn('not yet supported')` |
| `hvar` | **No** — `console.warn('not yet supported')` |

---

## 3) What a User MUST Supply vs. Can Omit

### Must Supply (cannot be auto-derived):

1. **`familyName`** — font family name
2. **`styleName`** — style name (e.g., "Regular", "Bold")
3. **`unitsPerEm`** — coordinate system scale
4. **`ascender`** — typographic ascender
5. **`descender`** — typographic descender
6. **Glyph data**: For each glyph:
   - `name` (glyph name string)
   - `unicode` (code point)
   - `advanceWidth` (numeric — **export throws** if NaN)
   - `path` (a Path object with outline commands)

### Safe to Omit (auto-derived or defaulted):

| Category            | Fields                                                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Font bbox**       | `head.xMin/yMin/xMax/yMax` — computed from glyph metrics                                                                                                                                |
| **hhea metrics**    | `advanceWidthMax`, `minLeftSideBearing`, `minRightSideBearing`, `xMaxExtent`, `numberOfHMetrics`                                                                                        |
| **maxp**            | `numGlyphs` — computed from glyph count                                                                                                                                                 |
| **OS/2 statistics** | `xAvgCharWidth`, `usFirstCharIndex`, `usLastCharIndex`, `ulUnicodeRange1-4`, `sxHeight`, `sCapHeight`, `sTypoAscender/Descender`, `usWinAscent/Descent`, `usDefaultChar`, `usBreakChar` |
| **name helpers**    | `postScriptName`, `uniqueID`, `fullName`, `preferredFamily`, `preferredSubfamily` — synthesized from familyName + styleName                                                             |
| **CFF internals**   | `fontMatrix`, `charsets`, `charStrings`, encoding, internal offsets                                                                                                                     |
| **SFNT container**  | All of `searchRange`, `entrySelector`, `rangeShift`, checksums, offsets, padding, table sorting                                                                                         |
| **Timestamps**      | `head.created/modified` — defaults to current time                                                                                                                                      |
| **macStyle**        | Derived from `weightClass` and `italicAngle`                                                                                                                                            |

### Recommended but Optional (have defaults but affect quality):

| Field                    | Default         | Why you might want to set it                   |
| ------------------------ | --------------- | ---------------------------------------------- |
| `weightClass`            | `0`             | Affects macStyle derivation and font selection |
| `italicAngle`            | `0`             | Affects macStyle italic flag                   |
| `fsSelection`            | Derived         | For precise style flagging                     |
| `achVendID`              | `'XXXX'`        | Font vendor identification                     |
| `copyright`, `trademark` | `' '` (space)   | Metadata completeness                          |
| `version` name record    | `'Version 0.1'` | Font versioning                                |

---

## 4) Comparison With Previous Analysis

The analysis in `opentypejs-analysis.md` is **largely accurate**. Here are the specific points where I can confirm, correct, or supplement:

### Confirmed accurate:

- ✅ Signature/flavor detection and format normalization
- ✅ Creates empty Font first, then populates
- ✅ Top-level property promotion (unitsPerEm, ascender, descender, etc.)
- ✅ Dynamic encoding assignment (CmapEncoding, CffEncoding)
- ✅ Lazy glyph loading via deferred loaders and `defineDependentProperty`
- ✅ Unicode/name back-linking via `addGlyphNames`
- ✅ hmtx merging into glyphs (both modes)
- ✅ Kerning pairs from `kern`, GPOS `position.init()`
- ✅ Variable font parsing with cross-table dependencies
- ✅ PaletteManager always initialized
- ✅ All export auto-calculated fields (head, hhea, maxp, OS/2, name, CFF, SFNT)

### Minor corrections/clarifications:

1. **`head.flags`**: Previous analysis says "forced to 3". This is confirmed — it's hardcoded as `flags: 3` in the `fontToSfntTable` call to `head.make()`.

2. **`postScriptName` synthesis**: Previous analysis says "`Family-Style`, no spaces". The actual code is `familyName.replace(/\s/g, '') + '-' + englishStyleName` — so it's `FamilyName-StyleName` with hyphens, not just concatenation. Confirmed.

3. **`gvar.make()` / `cvar.make()`**: Previous analysis says "currently logs 'not yet supported'". Confirmed — `gvar` logs a warning, `cvar` logs a warning. Additionally, **`hvar` write** is also not supported (logs same warning). The previous analysis didn't mention `hvar.make()` being unsupported.

4. **CFF2 → CFF1 downgrade**: Previous analysis mentions "CFF2 currently writes back as CFF v1" — confirmed. The `makeCFFTable` function has a `// @TODO: make it configurable` comment and hardcodes `cffVersion = 1`.

5. **`ulCodePageRange1`**: Previous analysis says "currently hardcoded to Latin-1 bit" — confirmed. The code has `ulCodePageRange1: 1` with a `// FIXME` comment.

6. **`sxHeight` estimation**: Previous analysis says "estimated from representative glyphs". Confirmed — specifically, it calls `metricsForChar(font, 'xyvw', {yMax: Math.round(globals.ascender / 2)})` — tries chars x, y, v, w and falls back to ascender/2.

7. **`sCapHeight` estimation**: Confirmed — `metricsForChar(font, 'HIKLEFJMNTZBDPRAGOQSUVWXY', globals)` — tries many uppercase letters, falls back to global yMax.

### Supplementary findings not in previous analysis:

1. **Glyph `getMetrics()` on export**: The export path calls `glyph.getMetrics()` which computes xMin/yMin/xMax/yMax from path commands, plus `leftSideBearing` and `rightSideBearing` — this means even the per-glyph bounding box doesn't need to be stored; it's recomputed from the path at export time.

2. **`font.tables` Proxy**: The Font constructor sets up a `Proxy` on `font.tables` — this isn't just a plain object. The proxy is used for table access interception (visible in `src/font.mjs`).

3. **`advanceWidth` is validated at export**: `fontToSfntTable` explicitly checks `isNaN(glyph.advanceWidth)` and throws `'Glyph ... advanceWidth is not a number'`. This is the only hard validation I found in the export path — meaning `advanceWidth` is truly non-negotiable.

4. **Default name info**: The Font constructor calls `createDefaultNamesInfo(options)` which fills in `copyright`, `description`, `manufacturer`, `designer`, `version` (as `'Version 0.1'`), etc. with single-space fallbacks. These are not really "missing" — they have default values from construction time.

5. **`leftSideBearing` defaults to 0 on export**: `makeHmtxTable` uses `glyph.leftSideBearing || 0`, so users don't need to provide it — it's safely defaulted.

6. **cmap format selection**: `makeCmapTable` automatically chooses format 4 (BMP only, more compact) vs format 12 (full Unicode) based on whether any glyph has a unicode > 0xFFFF.

7. **Table ordering**: `makeSfntTable` sorts table records alphabetically by tag — matching the OpenType recommendation — regardless of the order tables are pushed.

---

## 5) Implications for Font-Flux-JS

Based on this analysis, when designing the JSON-to-font export for Font-Flux-JS, you can simplify the user-facing JSON schema by:

1. **Making these fields auto-computed** (user should never need to provide them):
   - All SFNT header/container fields (checksums, offsets, searchRange, etc.)
   - Font bounding box (`head.xMin/yMin/xMax/yMax`)
   - `hhea` computed metrics (advanceWidthMax, minLeftSideBearing, etc.)
   - `maxp.numGlyphs`
   - OS/2 statistical fields (xAvgCharWidth, unicode ranges, first/last char, xHeight, capHeight)
   - `loca` table (entirely derivable from glyph data)
   - `hmtx` table (derivable from glyph advanceWidth + leftSideBearing)
   - `cmap` table (derivable from glyph unicodes)
   - CFF internal offsets, charstrings (derivable from glyph paths)

2. **Auto-synthesizing these with intelligent defaults** (but allowing override):
   - `postScriptName` (from familyName + styleName)
   - `uniqueID`
   - `fullName`
   - `preferredFamily` / `preferredSubfamily`
   - `macStyle` (from weight + italic angle)
   - `head.flags`, `head.lowestRecPPEM`
   - `post` version and most fields
   - `fsSelection`
   - timestamps

3. **Requiring only from user**:
   - `familyName`, `styleName`
   - `unitsPerEm`
   - `ascender`, `descender`
   - Per-glyph: `name`, `unicode`(s), `advanceWidth`, `path`/outline data
