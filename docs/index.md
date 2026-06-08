# Font Flux JS Documentation

Convert fonts to JSON, make edits, then convert them back!

Font Flux JS is a JavaScript library for parsing OpenType/TrueType font binaries into structured JSON, then exporting that JSON back into a valid font binary. Every table is fully parsed into human-readable fields! If you're ambitious, you can also create a font from scratch.

Font Flux JS is part of the Glyphr Studio family. Any questions or feedback? We'd love to hear from you: mail@glyphrstudio.com

Version **{{ $params.version }}** — Generated {{ $params.buildDate }}.

## Get Started

Learn the basics of Font Flux JS and how to create fonts from scratch.

- [Default Technology](./default-technology.md) — What format decisions Font Flux makes for you, and why.
- [Creating Fonts](./creating-fonts.md) — Create a new font, set metadata, add glyphs, and export.
- [Authoring JSON From Scratch](./authoring-json.md) — Hand-write a complete font JSON document, no class API required.
- [Validation](./validation.md) — Check for structural issues in JSON before exporting.
- [Diagnostics](./diagnostics.md) — Inspect a binary font file for spec violations and corruption.

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
