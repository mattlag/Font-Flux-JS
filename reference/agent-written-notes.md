# Agent Working Notes — Font Flux JS

_Last reviewed: May 11, 2026 (codebase audit)_

> These notes are written BY agents FOR future agents. Optimized for fast onboarding.
> Read `agent-context.md` first for project overview. This file covers technical internals.
>
> **Note** — Source-of-truth for current architecture is `/memories/repo/` and the live source.
> Statements about specific exports, version numbers, or test counts may have drifted.

## Quick Start

- **Runtime**: Node.js, ES modules (`"type": "module"` in package.json)
- **Bundler**: Vite ^7.3.1 — library build, entry `src/main.js`, output `dist/font-flux-js.es.js`
- **Testing**: Vitest ^4.0.18 — run with `npx vitest run`, watch with `npx vitest`
- **Test glob**: `test/**/*.test.js` — 592+ tests across 72 files
- **All data is big-endian** (OpenType spec). DataReader/DataWriter default to big-endian.
- **Table docs generator**: `npm run docs:tables` rebuilds `docs/tables/*.md` from source parse/write shapes.

## Data Flow

```
Binary font (ArrayBuffer)
  → importFont(buffer)          [src/import.js]
    → detects ttcf → parses TTC collections
    → readFontHeader → readTableDirectory → extractTableData
    → builds { header, tables }
    → buildSimplified({ header, tables })   [src/simplify.js]
  → unified simplified object:
      { font, glyphs, tables, _header, features?, kerning?, axes?, ... }

Simplified object
  → exportFont(fontData)        [src/export.js]
    → resolveExportSource() detects data shape:
      1. Legacy { header, tables } — use as-is
      2. Imported simplified (_header + tables) — hybrid reconciliation
      3. Hand-authored (font + glyphs, no _header) — buildRawFromSimplified()
    → for each table: tableWriters[tag](data) or use _raw
    → reconstruct header + directory + table data
  → ArrayBuffer
```

## Registry Pattern (CRITICAL for adding new tables)

Adding a new table requires touching exactly 4 files:

1. **`src/sfnt/table_XYZ.js`** (or `src/otf/` or `src/ttf/`) — Create parse and write functions
2. **`src/import.js`** — Add to `tableParsers` registry
3. **`src/export.js`** — Add to `tableWriters` registry
4. **`test/*/table_XYZ.test.js`** — Create tests

**Parser signature**: `(rawBytes: number[], tables: object) → object`
**Writer signature**: `(data: object) → number[]`

The returned object from a parser should NOT include `_checksum` or `_raw` — those are managed by import.js/export.js.

## Table Data Shapes

**Unparsed** (no registered parser): `{ "_raw": [byte, ...], "_checksum": 0x12345678 }`
**Parsed** (registered parser): `{ "version": 0, "field1": ..., "_checksum": 0x12345678 }`

`_checksum` is always added by `extractTableData` — parsers never return it.

## Shared Modules

**`src/reader.js` — DataReader** (cursor-based binary reader)

- `new DataReader(bytes, startOffset?)` — auto-advancing cursor at `reader.position`
- Methods: `uint8`, `uint16`, `uint24`, `uint32`, `int8`, `int16`, `int32`, `tag`, `offset16`, `offset32`, `fixed`, `fword`, `ufword`, `f2dot14`, `longDateTime`
- Bulk: `array(methodName, count)`, `bytes(count)` — Navigation: `seek(offset)`, `skip(n)`

**`src/writer.js` — DataWriter** (cursor-based binary writer)

- `new DataWriter(size)` — matching write methods to DataReader
- Output: `toArray()` → `number[]` — all write methods return `this` (chainable)
- Bulk: `array(methodName, values)`, `rawBytes(data)` — Navigation: `seek(offset)`, `skip(n)`

## File Map

```
src/
  main.js           — entry. exports { FontFlux, initWoff2 }
  font_flux.js      — FontFlux class (v2 public API wrapper)
  import.js         — importFont(), importFontTables(), tableParsers registry, tableParseOrder
  export.js         — exportFont(), resolveExportSource(), tableWriters registry
  simplify.js       — buildSimplified(): { header, tables } → unified simplified object
  expand.js         — buildRawFromSimplified(): simplified → { header, tables }
  glyph.js          — createGlyph(), getGlyph()
  kerning.js        — createKerning(), getKerningValue()
  substitution.js   — createSubstitution(), getSubstitutions()
  json.js           — fontToJSON(), fontFromJSON()
  svg_path.js       — contoursToSVGPath(), svgPathToContours()
  reader.js         — DataReader class
  writer.js         — DataWriter class
  validate/         — validateJSON() + auto-fix
  sfnt/             — shared table parsers (~30 files)
  otf/              — CFF/CFF2 (table_CFF.js, table_CFF2.js, cff_common.js, charstring_*.js, table_VORG.js)
  ttf/              — TrueType (glyf, loca, gvar, cvt, fpgm, prep, gasp, cvar)
  woff/             — WOFF 1/2 wrap/unwrap

test/
  roundtrip.test.js               — import→export→reimport fidelity (primary correctness check)
  roundtrip-all-samples-double.test.js — all sample fonts double round-trip
  font-flux.test.js               — FontFlux class API tests
  glyph.test.js, kerning.test.js, substitution.test.js — convenience function tests
  sfnt/gsub-simplify.test.js      — GSUB simplification integration tests
  json.test.js                    — JSON serialization tests
  sample fonts/                   — binary font fixtures
  sfnt/, otf/, ttf/, woff/        — per-table test suites
```

## Cross-Table Dependencies

- `tableParseOrder` in import.js defines parse sequence: `['head', 'maxp', 'hhea', 'cmap', 'hmtx', 'name', ...]`
- Tables in the order list are parsed first; remaining tables after
- Each parser receives `(rawBytes, tables)` — `tables` contains previously-parsed tables
- Writers do NOT need cross-table deps — they serialize their own data only
- **Exception**: glyf ↔ loca coordination. `coordinateTableWrites()` in export.js pre-computes glyf bytes, derives loca offsets, and updates head.indexToLocFormat. Uses a `Map<tag, number[]>` of pre-computed bytes, checked first in the main write loop.

## Export Resolution: Hybrid Reconciliation

`resolveExportSource()` in export.js detects the data shape and handles three cases:

1. **Legacy `{ header, tables }`** — pass through as-is (from `importFontTables()`)
2. **Imported simplified (`_header` + `tables`)** — Rebuild DECOMPOSED_TABLES from simplified fields (honoring edits), preserve non-decomposed tables from stored originals
3. **Hand-authored (`font` + `glyphs`, no `_header`)** — `buildRawFromSimplified()` generates everything

**DECOMPOSED_TABLES** (in simplify.js): head, hhea, hmtx, vmtx, name, OS/2, post, maxp, cmap, glyf, loca, CFF, kern, fvar, avar, STAT, MVAR, GPOS, GSUB, GDEF, gasp, cvt, fpgm, prep, COLR, CPAL

**Non-decomposed tables** pass through from stored `tables`: gvar, HVAR, VVAR, cvar, CBDT, CBLC, EBDT, EBLC, EBSC, sbix, SVG, BASE, JSTF, MATH, hdmx, LTSH, VDMX, vhea, DSIG, MERG, meta, PCLT, VORG, ltag, CFF2

## Test Policy

- `test/roundtrip-all-samples-double.test.js` should run against all `.ttf/.otf/.ttc` fixtures by default.
- Avoid `KNOWN_*_EXCLUSIONS` patterns — they hide missing import/export behavior.
- If a fixture fails, fix parser/writer logic first and keep the fixture visible.
- Table-specific tests use `importFontTables()` (not `importFont()`) to access internal `{ header, tables }` shape directly.
- Primary test fonts: `oblegg.otf` (CFF) and `oblegg.ttf` (TrueType).

## Substitution (GSUB) Data Flow

GSUB is now fully decomposed (like kerning/GPOS):

```
Import: GSUB binary → parseGSUB() → raw GSUB table
  → extractSubstitutions(gsub, glyphs)    [simplify.js]
    → types 1–4, 8: extracted to simplified rules in `substitutions[]`
    → types 5, 6: preserved as `_rawGSUBLookups[]` (contextual, reference other lookups)
    → deduplicateFeatureRefs: one rule set per lookup×feature (not per script/language)
    → allScripts stored on rules to reconstruct script/language associations

Export: substitutions[] + _rawGSUBLookups[]
  → buildGSUBFromSubstitutions()           [expand.js]
    → groups rules by type+feature → builds lookup per group
    → appends raw lookups (types 5/6) with index remapping
    → builds featureList + scriptList from rule metadata
  → full GSUB table → writeGSUB() → binary
```

**Simplified rule shape** (in `substitutions[]`):

```json
{ "type": "single|multiple|alternate|ligature|reverse",
  "feature": "liga", "script": "latn", "language": null,
  "from": "a", "to": "a.smcp",               // single
  "from": "ffi", "to": ["f", "f", "i"],       // multiple
  "from": "a", "alternates": ["a.alt1", ...],  // alternate
  "components": ["f", "i"], "ligature": "fi",  // ligature
  "from": "a", "to": "b"                      // reverse (+ backtrack/lookahead)
}
```

**FontFlux convenience methods**: `addSubstitution()`, `removeSubstitution()`, `listSubstitutions()`, `getSubstitution()`, `clearSubstitutions()` — mirrors the kerning API pattern.

**Helper module**: `src/substitution.js` provides `createSubstitution()` (validation + normalization) and `getSubstitutions()` (lookup by glyph).

## Gotchas & Lessons Learned

### Binary Format Gotchas

1. **Table tags with trailing spaces**: `'CFF '`, `'cvt '`, `'SVG '` are 4 bytes with trailing space. Registry keys must match.
2. **OS/2 filename vs registry key**: File is `table_OS-2.js`, but registry key must be `'OS/2'` (slash in tag).
3. **Version fields are raw uint32**: maxp `0x00010000`, post `0x00020000`, vhea `0x00010000`/`0x00011000`. Compare with hex, not float.
4. **vhea version differs from hhea**: hhea uses two uint16s (majorVersion/minorVersion), vhea uses one uint32 (Version16Dot16).
5. **CPAL colors are BGRA, not RGBA**: blue, green, red, alpha — each uint8.
6. **BigInt in head table**: `created`/`modified` are LONGDATETIME (BigInt). Standard JSON.stringify can't handle them — use `fontToJSON()`/`fontFromJSON()`.
7. **4-byte table padding**: export.js pads each table to 4-byte boundaries. `paddedLength = length + ((4 - (length % 4)) % 4)`.

### Parser/Writer Gotchas

8. **Cross-table parse order matters**: hmtx depends on hhea and maxp. When adding new tables with deps, add AFTER dependencies in `tableParseOrder`.
9. **loca offsets stripped from JSON**: import.js deletes `tables.loca.offsets` after glyf parsing — they're binary artifacts. `coordinateTableWrites()` regenerates them on export.
10. **glyf flag packing may differ**: Our writer uses optimal compression. Re-encoded glyf may be smaller, so loca offsets can't be preserved as-is.
11. **Composite glyph argument sizing**: Writer re-evaluates `ARG_1_AND_2_ARE_WORDS` based on actual values. Binary layout may change.
12. **DataWriter output is `toArray()`, not `finish()`**: Common confusion.
13. **CFF does not use DataReader/DataWriter**: CFF has its own encoding scheme in `cff_common.js`.
14. **CFF DICT offset encoding**: Writers use forced 5-byte int32 for all offset operators, making Top DICT size deterministic.
15. **CFF Private DICT Subrs offset is relative**: Relative to Private DICT start, not CFF start.
16. **CFF INDEX v1 vs v2**: v1 uses uint16 count (empty=2 bytes), v2 uses uint32 count (empty=4 bytes).
17. **CFF2 isOperatorByte range**: Byte values 0-11 and 13-21 are operators. Value 12 is the two-byte escape prefix. Values 22-27 are also operators. ≥28 are number-encoded.

### Layout Table Gotchas

18. **OpenType Layout data shapes are wrapped**: `parseLookupList` returns `{ lookups: [...] }`, not a bare array. Access via `.lookups`, `.scriptRecords`, `.featureRecords`.
19. **Extension Lookup transparency**: Parser auto-unwraps Extension types (GSUB 7, GPOS 9). JSON stores inner type only. Writer auto-wraps when LookupList exceeds 64KB.
20. **LookupList Offset16 overflow**: Large fonts can exceed 64KB. Writer wraps ALL lookups in Extension headers when overflow occurs.
21. **markFilteringSet flag**: Bit 0x0010 in Lookup flags. When set, a `markFilteringSet` uint16 follows the subtable offset array.
22. **GPOS ValueRecord variable size**: Byte count from `valueFormat` bitfield popcount × 2. Parser reads only fields for set bits.
23. **Layout writers use bottom-up serialization**: Serialize children first, compute offsets from sizes, write parent header + offsets + child data.

### Bitmap Table Gotchas

24. **DataReader performance**: Creating DataReader per-glyph causes massive allocations for large tables. Create ONE per table and reuse via `seek()`.
25. **Bulk image data**: Use `rawBytes.slice()` instead of `reader.bytes()` for image blobs.

### Round-Trip Gotchas

26. **CFF2 VariationStore size field**: When writing VariationStore, the `length` field is total byte count of the entire VariationStore structure, not just the data after the header.
27. **JSON serialization strips transient keys**: `fontToJSON()` strips `_dirty`, `_fileName`, `_originalBuffer`, `_collection`, `_collectionFonts`, `_woff`. Preserves `_header` (needed for lossless re-export).
28. **WOFF2 requires async init**: `await initWoff2()` once before use. Uses native zlib in Node.js, brotli-wasm in browsers.
29. **`FontFlux.open()` accepts JSON too**: As of v2.3.4, `FontFlux.open(input)` and `FontFlux.openAll(input)` accept three input shapes: a binary `ArrayBuffer`, a JSON `string` (from `font.toJSON()`), or a `Uint8Array` of either binary or UTF-8 JSON bytes. Detection sniffs the first non-whitespace byte for `{` or `[` (BOM-aware). The demo's loading screen now also accepts `.json` files. Internal helper: `detectInput()` in `src/font_flux.js`.
