# Authoring JSON From Scratch

This page is for humans (or scripts) who want to write a Font Flux JSON document directly in a text editor — no `FontFlux.create()`, no `.addGlyph()` — and pipe it straight through to a valid binary font.

If you'd rather drive the library through its class API, start with [Creating Fonts](./creating-fonts.md). Everything on this page is the JSON shape that the class methods produce internally.

## The contract

Font Flux's JSON loader (`FontFlux.fromJSON()` / `fontFromJSON()`) accepts any object that conforms to the **simplified internal shape**:

```text
{
  font:           // metadata — required
  glyphs:         // glyph list — required (at least .notdef)
  kerning?:       // pair adjustments
  substitutions?: // GSUB rules (ligatures, alternates, ...)
  axes?:          // variable-font axes
  instances?:     // named instances
  axisMapping?:   // avar coordinate remapping
  axisStyles?:    // STAT style labels
  metricVariations?: // MVAR deltas
  features?:      // raw GPOS/GSUB/GDEF structures (advanced)
  palettes?:      // CPAL color palettes (color fonts)
  colorGlyphs?:   // COLR layer/paint trees (color fonts)
  gasp?:          // grid-fitting hints (TrueType)
  tables?:        // any non-decomposed table, passed through verbatim
  _options?:      // export hints (e.g. kerningFormat)
}
```

Everything except `font` and `glyphs` is optional. There is **no `_header`** — that's a marker added by `FontFlux.open()` when reading a binary, and its absence is what tells the export pipeline that this is a hand-authored document.

## Minimal complete example

Three glyphs (`.notdef`, `space`, `A`), no kerning, no features. Save as `tiny.json` and run the snippet at the bottom of this page.

```json
{
	"font": {
		"familyName": "Tiny",
		"styleName": "Regular",
		"unitsPerEm": 1000,
		"ascender": 800,
		"descender": -200,
		"lineGap": 0
	},
	"glyphs": [
		{ "name": ".notdef", "advanceWidth": 500 },
		{ "name": "space", "unicode": 32, "advanceWidth": 250 },
		{
			"name": "A",
			"unicode": 65,
			"advanceWidth": 600,
			"path": "M 0 0 L 300 700 L 600 0 Z"
		}
	]
}
```

That's it. Pipe it through:

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { FontFlux } from 'font-flux-js';

const json = readFileSync('tiny.json', 'utf8');
const font = FontFlux.fromJSON(json);
const buffer = font.export(); // → ArrayBuffer (TrueType .ttf by default)
writeFileSync('tiny.ttf', Buffer.from(buffer));
```

By default `font.export()` produces a TrueType `.ttf` (quadratic outlines via the `glyf` table). To produce an OTF, see [Creating an OTF](./creating-otf.md).

## What each field looks like

### `font` — metadata

| Field                 | Type   | Notes                                             |
| --------------------- | ------ | ------------------------------------------------- |
| `familyName`          | string | Required.                                         |
| `styleName`           | string | e.g. `"Regular"`, `"Bold Italic"`.                |
| `unitsPerEm`          | number | 16..16384. Common values: 1000 (CFF), 2048 (TTF). |
| `ascender`            | number | In font units, positive.                          |
| `descender`           | number | In font units, negative.                          |
| `lineGap`             | number | Extra leading. Usually 0.                         |
| `xMin/yMin/xMax/yMax` | number | Optional; recomputed from glyphs on export.       |
| `version`             | string | Optional version string written to `name` table.  |

See the [`head`](./tables/head.md), [`hhea`](./tables/hhea.md), [`OS/2`](./tables/OS-2.md), and [`name`](./tables/name.md) table docs for the full set of fields that get written into the binary.

### `glyphs` — one entry per glyph

```json
{
	"name": "A",
	"unicode": 65,
	"advanceWidth": 600,
	"leftSideBearing": 0,
	"path": "M 0 0 L 300 700 L 600 0 Z"
}
```

- `name` — required. `.notdef` must be the first entry (the library will insert one if missing).
- `unicode` — code point (number) or array of code points. Omit for unmapped glyphs.
- `advanceWidth` — required. Horizontal advance in font units.
- `path` — SVG path string. Easiest authoring format. Alternative shapes (`contours` arrays, raw `charString` bytes, composite `components`) are documented in [Creating Glyphs](./creating-glyphs.md).
- `leftSideBearing` — optional; computed from outlines if omitted.

The relevant binary tables built from `glyphs` are [`glyf`](./tables/glyf.md) + [`loca`](./tables/loca.md) (TrueType), [`CFF`](./tables/CFF.md) (OTF), [`hmtx`](./tables/hmtx.md), [`cmap`](./tables/cmap.md), and [`post`](./tables/post.md).

### `kerning` — optional

```json
"kerning": [
  { "left": "A", "right": "V", "value": -80 },
  { "left": "T", "right": "o", "value": -40 }
]
```

By default this is written as [`GPOS`](./tables/GPOS.md) PairPos Format 1. To force a [`kern`](./tables/kern.md) variant instead, add `"_options": { "kerningFormat": "kern-ot-f0" }` at the top level. See [Creating Kerning](./creating-kerning.md) for the full menu of input shapes.

### `kerningClasses` — optional

Class-based kerning preserved verbatim from an imported font. This is an **array of subtable groups**, each mapping 1:1 to a binary class-based subtable, so large class tables round-trip without being permuted into individual pairs:

```json
"kerningClasses": [
  {
    "leftClasses": { "@kern_L1": ["A", "Aacute"] },
    "rightClasses": { "@kern_R1": ["V", "W", "Y"] },
    "pairs": [{ "left": "@kern_L1", "right": "@kern_R1", "value": -80 }]
  }
]
```

Each group is exported as a single [`GPOS`](./tables/GPOS.md) PairPos Format 2 subtable. Singleton classes are referenced by bare glyph name; multi-member classes use `@name`. See [Creating Kerning](./creating-kerning.md#class-based-kerning-preservation) for details.

### `substitutions` — optional

```json
"substitutions": [
  { "type": "ligature", "feature": "liga", "components": ["f", "i"], "ligature": "fi" },
  { "type": "single", "feature": "smcp", "from": "a", "to": "a.sc" }
]
```

Written into the [`GSUB`](./tables/GSUB.md) table. Supported types and their JSON shapes are documented in [Creating Substitutions](./creating-substitutions.md).

### Variable-font fields — optional

```json
"axes": [
  { "tag": "wght", "name": "Weight", "min": 100, "default": 400, "max": 900 }
],
"instances": [
  { "name": "Regular", "coordinates": { "wght": 400 } },
  { "name": "Bold",    "coordinates": { "wght": 700 } }
]
```

Variable fonts also use [`fvar`](./tables/fvar.md), [`avar`](./tables/avar.md), [`STAT`](./tables/STAT.md), [`MVAR`](./tables/MVAR.md), and per-glyph delta tables. The full authoring story lives in [Creating Variable Fonts](./creating-variables.md).

### Color-font fields — optional

```json
"palettes": [["#c90900", "#ffffff", "#000000"]],
"colorGlyphs": [
	{ "name": "A", "type": "layers", "layers": [
		{ "glyph": "A.shadow", "paletteIndex": 2 },
		{ "glyph": "A",        "paletteIndex": 0 }
	] }
]
```

Written into [`CPAL`](./tables/CPAL.md) and [`COLR`](./tables/COLR.md). See [Creating Color Fonts](./creating-color-fonts.md) for COLRv0 layer stacks and COLRv1 paint trees.

### `tables` — escape hatch

Any table that Font Flux doesn't decompose into a top-level field can be authored verbatim:

```json
"tables": {
	"meta": { "tags": { "dlng": "en-US", "slng": "Latn" } }
}
```

The [All Tables](./tables/index.md) reference lists every table the library knows about. Tables in the "decomposed" set (`head`, `hhea`, `hmtx`, `name`, `OS/2`, `post`, `maxp`, `cmap`, `glyf`, `loca`, `CFF`, `kern`, `fvar`, `avar`, `STAT`, `MVAR`, `GPOS`, `GSUB`, `GDEF`, `gasp`, `cvt`, `fpgm`, `prep`, `COLR`, `CPAL`) are owned by their corresponding top-level field — don't write them in both places.

## Validate before exporting

```js
const font = FontFlux.fromJSON(json);
const report = font.validate();
if (!report.valid) {
	console.error(report.issues);
} else {
	const buffer = font.export();
}
```

See [Validation](./validation.md) for the full list of checks and what's auto-fixed versus what's a hard error.

## A more complete example

This document exercises kerning, a ligature, a tiny variable axis stub, and a `gasp` override:

```json
{
	"font": {
		"familyName": "Sampler",
		"styleName": "Regular",
		"unitsPerEm": 1000,
		"ascender": 800,
		"descender": -200,
		"lineGap": 0
	},
	"glyphs": [
		{ "name": ".notdef", "advanceWidth": 500 },
		{ "name": "space", "unicode": 32, "advanceWidth": 250 },
		{
			"name": "A",
			"unicode": 65,
			"advanceWidth": 600,
			"path": "M 0 0 L 300 700 L 600 0 Z"
		},
		{
			"name": "V",
			"unicode": 86,
			"advanceWidth": 600,
			"path": "M 0 700 L 300 0 L 600 700 Z"
		},
		{
			"name": "f",
			"unicode": 102,
			"advanceWidth": 350,
			"path": "M 100 0 L 100 700 L 300 700 L 300 600 L 200 600 L 200 0 Z"
		},
		{
			"name": "i",
			"unicode": 105,
			"advanceWidth": 200,
			"path": "M 50 0 L 50 600 L 150 600 L 150 0 Z"
		},
		{
			"name": "fi",
			"advanceWidth": 500,
			"path": "M 100 0 L 100 700 L 400 700 L 400 600 L 200 600 L 200 0 Z"
		}
	],
	"kerning": [{ "left": "A", "right": "V", "value": -80 }],
	"substitutions": [
		{
			"type": "ligature",
			"feature": "liga",
			"components": ["f", "i"],
			"ligature": "fi"
		}
	],
	"gasp": [{ "maxPPEM": 65535, "behavior": 10 }]
}
```

Feed it through `FontFlux.fromJSON(text).export()` and you'll get a working `.ttf`.

## See also

- [Creating Fonts](./creating-fonts.md) — the class-based authoring path.
- [Creating Glyphs](./creating-glyphs.md) — outline formats and SVG-path conversion.
- [All Tables](./tables/index.md) — table-by-table reference.
- [Validation](./validation.md) — pre-export structural checks.
