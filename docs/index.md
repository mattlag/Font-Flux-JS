# Font Flux JS Documentation

Convert fonts to JSON, make edits, then convert them back!

Font Flux JS parses OpenType/TrueType font binaries into editable JSON and exports fonts from imported or authored data. Supported tables have structured codecs; some complex subtables, instruction programs, images, and unknown tables remain byte payloads. Parsing a table does not imply that every field has a simplified authoring API.

Font Flux JS is part of the Glyphr Studio family. Any questions or feedback? We'd love to hear from you: mail@glyphrstudio.com

Version **{{ $params.version }}** — Generated {{ $params.buildDate }}.

## Get Started

Learn the basics of Font Flux JS and how to create fonts from scratch.

- [Default Technology](./default-technology.md) — What format decisions Font Flux makes for you, and why.
- [Creating Fonts](./creating-fonts.md) — Create a new font, set metadata, add glyphs, and export.
- [Authoring JSON From Scratch](./authoring-json.md) — Hand-write a complete font JSON document, no class API required.
- [Validation](./validation.md) — Check for structural issues in JSON before exporting.
- [Diagnostics](./diagnostics.md) — Inspect a binary font file for spec violations and corruption.

## Workflow Support

Preservation means retaining untouched font semantics, not identical table offsets or binary encoding. Unknown payload bytes are retained; checksums are recalculated from emitted bytes. Export does not silently strip unsupported dependencies to make an edit succeed.

| Domain                                | Parse / Preserve Unchanged                                             | Simplified Edit / Author                                                  | Conversion / Limits                                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Static TrueType outlines              | Points, components, instructions                                       | Simple glyphs and named composites; recursive bounds/maxp                 | Static TT/CFF conversion; point topology changes with retained hints are guarded                           |
| CFF1                                  | Programs, private dictionaries, global/local subroutines, CID FDSelect | Non-CID contours; unchanged CID geometry and metadata                     | Edited CID outlines/topology are guarded; edited CFF contours replace their compiled program               |
| CFF2                                  | Original programs and ordered private blend entries                    | Metadata and metrics, not a simplified outline compiler                   | Outline edits and incompatible variation-axis changes reject                                               |
| cmap                                  | Unicode, legacy encodings, variation selectors retained when unchanged | Unicode mapping edits retain UVS and non-Unicode subtables                | Glyph reorder with unsupported cmap encodings rejects                                                      |
| GPOS                                  | Original lookups, flags, Device/VariationIndex values                  | Pair/class authoring; unambiguous existing flat advances patched in place | Ambiguous shared, variable, or class reconstruction rejects; mark/cursive authoring remains raw-table work |
| GSUB                                  | Original unchanged structure and ordering                              | Single, multiple, alternate, ligature, reverse, contextual helpers        | Rebuilding edited complex raw/simplified combinations is not a blanket lossless guarantee                  |
| COLR / CPAL                           | Original unchanged color structures and palette metadata               | Layers, paint graphs, palettes                                            | Complex raw color edits require table-level knowledge                                                      |
| Variations                            | Axis metadata, variation stores, original outline programs             | Axes, instances, mapping/styles, metric metadata                          | No general outline-delta compiler or arbitrary glyph/axis remapper                                         |
| MATH / JSTF / MERG, bitmap/image data | Structured headers and retained payloads where implemented             | Raw escape hatches                                                        | No complete simplified authoring API                                                                       |

Glyph deletion/reordering rebinds imported composite references, GDEF classes/mark sets, GSUB single/multiple/alternate/ligature substitutions, GPOS single/pair positioning (including supported extension lookups), and COLR v0 base/layer references. Contextual layout, COLR v1 topology, variation, opaque, and other unsupported dependencies reject rather than silently retaining stale IDs. Appending glyphs is supported only when existing references stay valid. Removing a referenced glyph reports a dangling-reference error. This is not a general-purpose subsetter. Direct edits through live properties are checked at validation/export time too.

Supported imported GSUB edits patch the original lookup index and preserve unrelated features and raw lookups. Shared/contextual targets and ambiguous multi-subtable edits reject. WOFF2 export sets the required `head.flags` bit 11 and removes DSIG as required by that container; the source font is not mutated.

Explicit empty arrays clear their corresponding simplified data rather than falling back to stored originals; separately retained classes or raw lookups are not implicitly cleared by emptying only the flat array. `clearKerning()` clears flat/class and legacy kerning without deleting unrelated positioning. `clearSubstitutions()` clears simplified and retained raw substitution lookups. Ambiguous imported layout edits can reject rather than discard unrelated data. Removing variable axes may reject if retained variation data depends on them.

Mutators and live-array edits do not perform a complete dependency check immediately. Call `validate()` before export; export also enforces the supported dependency rules. Validation is observational and does not repair the live source object.

## Verification

`npm test` runs codec and public-workflow regressions. `npm run test:consumers` packs and installs the package outside the repository, type-checks its declarations, validates its schema, and compares first-export glyph sequences, positions, and outline paths using HarfBuzz. It covers no-op, metadata, validation, JSON, minimum/default/maximum variation coordinates, authored glyph edit/add/remove, clears, collection faces, and standalone CFF. Chromium and Firefox check actual SFNT/WOFF/WOFF2 loading, nonblank rendering, and advance widths. Install those browsers with `npx playwright install chromium firefox` first. Browser sanitization is used here; this is not a standalone OTS executable test or pixel-identical rasterization test.

`npm run test:large` tests the five-face Noto Serif CJK collection serially, using a 3 GiB V8 heap limit and a 180-second timeout per child. Each 65,535-glyph face passed metadata-export shaping and sampled outline comparisons, including every CID font dictionary. The measured Windows run took about 18-20 seconds per face and peaked at 3.6-3.7 GiB RSS. Heap limits do not cap native process memory. Fixtures retain their existing provenance in the sample-font directory. This is sampled semantic coverage, not proof for every font or variation coordinate.

`npm run test:demo` starts a temporary demo server and checks transactional
subsetting, rejected dependencies, downloaded fonts, updated previews, and
collection-face switching in Chromium and Firefox. It checks desktop/mobile
layout and nonblank canvas rendering, and writes screenshots to the system
temporary directory. Install both Playwright browsers with the command above
first. This is a separate local check, not currently a CI release gate.

The demo validates and exports a detached subset candidate, loads its preview,
then commits the glyph changes. Failed validation, export, or preview loading
leaves the source unchanged. It preserves the original tables and refreshes
cached glyph views after successful edits; this does not make arbitrary
subsetting supported by the library.

PR CI runs the CJK checks in a dedicated job; release CI also blocks publication on consumer, CJK, unit, lint, library, demo, and documentation gates.

### Remaining Follow-up Work

Passing these gates does not complete every item in the original improvement plan. Shared dependency analysis directly integrated into mutators, allocation reductions such as lazy disassembly and fewer numeric byte-array copies, exhaustive operation/outline/container combinations, and a standalone OTS executable gate remain follow-up work. Current consumer tests cover representative combinations, including nonempty variation-selector mappings and hinted nested composites. Advanced authoring features outside this correctness work remain subject to the capability limits above.

## Font Features

Guides for adding specific font features to your fonts.

- [Creating Glyphs](./creating-glyphs.md) — Glyph metadata, outline formats, and SVG path conversion.
- [Creating Kerning](./creating-kerning.md) — Add pair-based kerning adjustments.
- [Creating Substitutions](./creating-substitutions.md) — Ligatures, alternates, small caps, and other GSUB rules.
- [Creating Color Fonts](./creating-color-fonts.md) — Palettes and color glyphs using COLR/CPAL.
- [Creating Variable Fonts](./creating-variables.md) — Axes, instances, axis mapping, axis styles, and metric variations.
- [Importing Legacy Formats](./importing-legacy-formats.md) — CFF, PFB, and PFA (PostScript Type 1) import.

## Reference

Low-level format details and table-by-table documentation.

- [API Reference](./api.md) — The `FontFlux` class and standalone utilities, with full argument documentation.
- [Creating an OTF](./creating-otf.md) — CFF-specific outline details and export options.
- [Creating a TTF](./creating-ttf.md) — TrueType-specific outline details and export options.
- [All Tables](./tables/index.md) — Table-by-table reference with JSON examples, notes, and pitfalls.

## API

The complete `FontFlux` class reference — every method, its arguments, and return values — lives on its own page: **[API Reference](./api.md)**.

The library's main entry point exports:

```js
import {
	FontFlux, // primary class — open / create / export
	initWoff2, // async WOFF2 initializer (call once before WOFF2 use)
	diagnoseFont, // standalone binary-font diagnostic (Scenario 1 input)
	fontFromJSON, // low-level JSON → simplified-data parser
	fontToJSON, // low-level simplified-data → JSON serializer
} from 'font-flux-js';
```

For most workflows you only need `FontFlux`; the standalone utilities are exposed for tooling and tests. See the full **[API Reference](./api.md)** for every method, its arguments, return values, the internal data structure, and glyph-outline details.
