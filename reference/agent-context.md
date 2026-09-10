# Font Flux JS

_Workflow correctness checkpoint: September 10, 2026. Historical table inventory below remains a May 2026 snapshot._

> **Note** — This folder holds long-form working notes written by agents for future agents.
> For the canonical, always-current overview, see [`docs/index.md`](../docs/index.md) and the
> repo memory in `/memories/repo/`. Some details below may lag the source of truth.

This project is a JavaScript library that converts binary font files (OTF, TTF, WOFF, WOFF2) to and from JSON. Distributed as a single ES module file for use in front-end HTML5 font editor programs. Part of the Glyphr Studio family.

## Read These Files in Order

1. **This file** (`agent-context.md`) — Project overview, architecture, current state
2. **`agent-written-notes.md`** — Technical deep-dive: registries, data flow, gotchas
3. **`gap-analysis.md`** — Table completeness audit (what's fully parsed vs raw bytes)

## Specs

- **OTF**: https://learn.microsoft.com/en-us/typography/opentype/spec/otff
- **TTF**: https://developer.apple.com/fonts/TrueType-Reference-Manual/
- **TTC/OTC**: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#collections
- **WOFF 1.0**: https://www.w3.org/TR/WOFF/ — **WOFF 2.0**: https://www.w3.org/TR/WOFF2/

**Key fact**: OTF and TTF are both OpenType fonts sharing the same sfnt container and required tables. The only difference is glyph outlines — TrueType uses quadratic Bézier (`glyf`/`loca`), CFF uses cubic Bézier (`CFF`/`CFF2`). All shared table parsers work identically for both.

## Project Organization

- **`src/`** — Library source. Entry: `src/main.js` exports `{ FontFlux, initWoff2, diagnoseFont, fontFromJSON, fontToJSON }`.
  - `src/font_flux.js` — The `FontFlux` class (v2 public API wrapper)
  - `src/import.js` / `src/export.js` — Core pipeline + parser/writer registries
  - `src/simplify.js` — Raw tables → simplified object; `src/expand.js` — simplified → raw tables
  - `src/glyph.js` / `src/kerning.js` / `src/substitution.js` / `src/color.js` / `src/json.js` / `src/svg_path.js` — Helpers
  - `src/sfnt/` — Shared table parsers (cmap, head, GPOS, COLR, etc.)
  - `src/otf/` — CFF/CFF2-specific (table*CFF.js, table_CFF2.js, cff_common.js, charstring*\*.js)
  - `src/ttf/` — TrueType-specific (glyf, loca, gvar, cvt, fpgm, prep, gasp, cvar)
  - `src/woff/` — WOFF 1/2 wrap/unwrap
  - `src/validate/` — Structural validation + auto-fix
- **`test/`** — Vitest tests mirroring `src/` structure. 592+ tests across 72 files.
- **`docs/`** — VitePress documentation site (API, guides, per-table reference)
- **`demo/`** — Vanilla JS demo app (Vite)
- **`dist/`** — Built output
- **`reference/`** — These agent-facing notes

**Naming convention**: Table files are `table_XYZ.js`. The OS/2 table uses `table_OS-2.js` (filename) but `'OS/2'` (registry key). Table tag case always matches the spec.

## v2 Public API

The library exports `{ FontFlux, initWoff2, diagnoseFont, fontFromJSON, fontToJSON }`. Public declarations and the v1 structural JSON schema ship with the package. See `docs/index.md#workflow-support` for the current capability matrix and verification commands; historical counts and completeness claims below are not acceptance criteria.

`FontFlux` is a class wrapping the internal simplified font object. See `README.md` and `docs/index.md` for the full API reference.

**Key methods**: `FontFlux.open(buffer)`, `FontFlux.create({family, style, unitsPerEm, ...})`, `FontFlux.openAll(buffer)`, `.addGlyph()`, `.addKerning()`, `.addSubstitution()`, `.export()`, `.validate()`, `.toJSON()`, `FontFlux.fromJSON()`.

**Instance properties** (live references): `.info`, `.glyphs`, `.kerning`, `.substitutions`, `.axes`, `.instances`, `.features`, `.tables`, `.glyphCount`, `.format`.

## Two Core Use Cases

### Scenario 1 — Load, Edit, Save

Load an existing font → make targeted changes → save. Everything NOT touched must survive the round-trip (GSUB rules, color layers, variable font deltas, bitmap data, etc.).

### Scenario 2 — Author from Scratch

Construct JSON by hand or via convenience functions → export as a real font. The user specifies only what matters; the library generates all required binary tables.

### How Export Works (Hybrid Reconciliation)

`resolveExportSource()` in `export.js` detects the data shape:

- **Simplified `font` and `glyphs` present**: Calls `buildRawFromSimplified()` for imported and authored fonts. Expansion owns per-domain preserve/rebuild/drop/reject decisions; export no longer applies a second blanket table merge or CFF override.
- **Raw `header` and `tables` only**: Uses the explicit table-level escape hatch. This does not promise full semantic validation of arbitrary raw data.

Editable outline/layout/hint projections are detached from retained originals. Direct live edits remain supported; unsupported destructive edits reject at validation/export instead of silently discarding dependencies.

## Verified Workflow Checkpoint

This implementation chunk is closed for documentation finalization, not a claim
that the original improvement plan is fully complete. Shared dependency checks
inside mutators, lazy disassembly/fewer numeric byte copies, the exhaustive
operation/format matrix, and standalone OTS remain follow-up work. Do not resume
those items without a new request. Combined WOFF/WOFF2 collection export is not
supported by the current wrappers; use TTC/OTC or export faces separately.

- Observational validation and explicit clears are covered by public-workflow regressions. Simplified validation checks nested references, geometry, components, axes, and color references; cycles and excessive complexity reject.
- First-export comparisons cover TrueType, CFF1, CFF2, variable coordinates, UVS, hinted nested composites, metadata/JSON/validation, representative glyph edit/add/remove and clear operations, collection faces, and standalone CFF. HarfBuzz checks glyphs/positions/paths; Chromium and Firefox check actual SFNT/WOFF/WOFF2 loading and nonblank rendering/widths.
- Supported structural changes remap composites, simple GDEF/GPOS/GSUB structures, and COLR v0. Contextual/shared ambiguity, complex paint topology, variation dependencies, and opaque tables remain guarded. Mutators keep live-edit compatibility; dependency errors are reported by validation/export.
- Binary limits cover input/decompression sizes, table/face/glyph/point counts, CFF INDEX bounds, and CFF/Type 1 execution. Per-face limits and a face-count cap are not an aggregate memory sandbox. Eager disassembly and numeric byte arrays remain; the measured CJK job passes without a broad storage rewrite.
- The five 65,535-glyph CJK faces passed in 18.3-19.2 seconds each at approximately 3.6 GiB peak RSS, under a 3 GiB V8 heap limit and 180-second child timeout. Native memory is outside the V8 cap.
- Gates: 1,047 tests across 84 files, lint, library/demo/docs builds, packed-package types/schema/browser checks, CJK job, and dependency audit passed. Browser sanitizers substitute for a standalone OTS executable; coverage is representative, not universal losslessness or pixel-identical rasterization.
- Package remains v2.8.0. No commit, tag, release, or version bump was performed. Advanced mark/cursive authoring, a general outline-variation compiler, arbitrary subsetting, and edited CID outlines are separate feature work.

## Current State (April 2026)

- **Version**: 2.0.0-beta.0
- **Tests**: 650+ passing across 75 files
- **Tables**: 51 table types with registered parsers/writers (see checklist below)
- **Formats**: TTF, OTF, TTC, OTC, WOFF, WOFF2 all fully supported. CFF, PFB, and PFA import supported (legacy Type 1 converted to CFF outlines).
- **FontFlux class**: Complete v2 API with glyph, kerning, substitution, axis, instance, feature, and hinting methods
- **GSUB decomposition**: Full simplified substitution pipeline (types 1–4, 8 decomposed; types 5/6 raw passthrough)
- **Validation**: Three-level severity (error/warning/info) with auto-fix
- **WOFF2**: Full import/export. Requires `await initWoff2()` once before use.

## Future Work

- COLR/CPAL simplified decomposition (color font editing)
- Variable font delta editing (gvar simplified representation)
- GPOS non-kerning simplified authoring (mark positioning, cursive attachment, etc.)
- WOFF2 forward transforms for better compression ratios (currently uses null transforms)
- Full MATH/JSTF subtable parsing (currently container-level only)
- CFF v1 CIDFont writing completion

## Table Checklist

All 51+ table types are implemented. Every table that has a parser also has a writer.

### SFNT — Shared Tables (src/sfnt)

**Required:** cmap, head, hhea, hmtx, maxp, name, OS/2, post
**Advanced Typographic:** GDEF, GPOS, GSUB, BASE, JSTF, MATH
**Vertical Metrics:** vhea, vmtx
**Variation:** fvar, avar, STAT, MVAR, HVAR, VVAR
**Color/Bitmap:** COLR, CPAL, SVG, CBDT, CBLC, EBDT, EBLC, EBSC, sbix
**Other:** kern, DSIG, hdmx, LTSH, MERG, meta, PCLT, VDMX

### TTF — TrueType-Specific (src/ttf)

**Outline:** loca, glyf
**Hinting:** cvt, fpgm, prep, gasp
**Variation:** gvar, cvar

### OTF — CFF-Specific (src/otf)

**Outline:** CFF (v1), CFF2 (v2)
**Optional:** VORG

### Collections

TTC/OTC container import/export (`ttcf`), including multi-face collections

### Apple AAT (src/sfnt)

bloc, bdat, ltag
