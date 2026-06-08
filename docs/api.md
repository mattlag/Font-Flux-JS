# API Reference

Complete reference for the `FontFlux` class and the library's standalone
utilities. Every method lists its arguments, return value, and notable
behaviors.

Everything common goes through the `FontFlux` class. The library's main entry
point exports:

```js
import {
	FontFlux, // primary class — open / create / export
	initWoff2, // async WOFF2 initializer (call once before WOFF2 use)
	diagnoseFont, // standalone binary-font diagnostic
	fontFromJSON, // low-level JSON → simplified-data parser
	fontToJSON, // low-level simplified-data → JSON serializer
} from 'font-flux-js';
```

For most workflows you only need `FontFlux`; the standalone utilities are
exposed for tooling and tests.

[[toc]]

## Static factories

Create a `FontFlux` instance (or array of instances) from a file, JSON, or
metadata.

### `FontFlux.open(input)`

Parse a single font into a `FontFlux` instance.

| Argument | Type                                  | Description                                                                                                |
| -------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `input`  | `ArrayBuffer \| Uint8Array \| string` | Binary font (TTF/OTF/TTC/WOFF/WOFF2/CFF/PFB/PFA), a JSON string from `font.toJSON()`, or UTF-8 JSON bytes. |

**Returns** `FontFlux` — a single-font instance.

**Throws** if `input` is a collection (TTC/OTC) — use `openAll()` instead.

### `FontFlux.openAll(input)`

Parse a font collection (or single font), returning one instance per face.

| Argument | Type                                  | Description                            |
| -------- | ------------------------------------- | -------------------------------------- |
| `input`  | `ArrayBuffer \| Uint8Array \| string` | Same input types accepted by `open()`. |

**Returns** `FontFlux[]` — one `FontFlux` instance per face in the file.

### `FontFlux.create(options)`

Create a new empty font from scratch, pre-populated with `.notdef` and `space`
glyphs and a default `gasp` table, ready for `addGlyph()` and immediate export.

| Argument             | Type     | Default      | Description             |
| -------------------- | -------- | ------------ | ----------------------- |
| `options.family`     | `string` | `'Untitled'` | Font family name.       |
| `options.style`      | `string` | `'Regular'`  | Style / subfamily name. |
| `options.unitsPerEm` | `number` | `1000`       | Units per em (UPM).     |
| `options.ascender`   | `number` | `800`        | Ascender metric.        |
| `options.descender`  | `number` | `-200`       | Descender metric.       |

**Returns** `FontFlux`.

### `FontFlux.fromJSON(jsonString)`

Deserialize a JSON string (as produced by `font.toJSON()`) into a `FontFlux`
instance.

| Argument     | Type     | Description                       |
| ------------ | -------- | --------------------------------- |
| `jsonString` | `string` | JSON produced by `font.toJSON()`. |

**Returns** `FontFlux`.

### `FontFlux.exportCollection(fonts, options)`

Export multiple `FontFlux` instances as a single TTC/OTC collection.

| Argument         | Type         | Default  | Description                                      |
| ---------------- | ------------ | -------- | ------------------------------------------------ |
| `fonts`          | `FontFlux[]` | —        | Non-empty array of instances to bundle.          |
| `options.format` | `string`     | `'sfnt'` | Output container: `'sfnt'`, `'woff'`, `'woff2'`. |

**Returns** `ArrayBuffer` — the collection file bytes.

### `FontFlux.initWoff2()`

Initialize WOFF2 (Brotli) support. Must be called and **awaited** once before
opening or exporting WOFF2 files. The standalone `initWoff2()` export is
equivalent.

**Returns** `Promise<void>`.

```js
import { FontFlux } from 'font-flux-js';
await FontFlux.initWoff2();
const woff2 = font.export({ format: 'woff2' });
```

## Instance properties (live references)

These getters read directly into the simplified font data. Mutating the objects
they return (e.g. pushing to `.glyphs`) persists on the font.

| Property         | Type         | Description                                                                   |
| ---------------- | ------------ | ----------------------------------------------------------------------------- |
| `.info`          | `object`     | Font metadata (`familyName`, `styleName`, `unitsPerEm`, `ascender`, …).       |
| `.glyphs`        | `object[]`   | Glyph objects (`name`, `unicode`, `advanceWidth`, `contours`, …).             |
| `.kerning`       | `object[]`   | Kerning pairs `{ left, right, value }`.                                       |
| `.substitutions` | `object[]`   | GSUB substitution rules (ligatures, small caps, alternates, …).               |
| `.axes`          | `object[]`   | Variable font axes (from `fvar`).                                             |
| `.instances`     | `object[]`   | Named instances (from `fvar`).                                                |
| `.palettes`      | `string[][]` | Color palettes — arrays of hex strings (`#RRGGBB` / `#RRGGBBAA`).             |
| `.colorGlyphs`   | `object[]`   | Color glyph definitions (COLR layers or paint graphs).                        |
| `.features`      | `object`     | OpenType layout features (GPOS, GSUB, GDEF).                                  |
| `.tables`        | `object`     | All parsed tables (advanced / lossless access).                               |
| `.glyphCount`    | `number`     | Number of glyphs.                                                             |
| `.format`        | `string`     | Outline format: `'truetype'`, `'cff'`, or `'cff2'`.                           |
| `.data`          | `object`     | The full simplified font data object. Escape hatch for bulk reads/transforms. |

## Glyph methods

### `.listGlyphs()`

**Returns** `Array<{ name: string, unicode: number|null, index: number }>` — a
lightweight summary of every glyph.

### `.getGlyph(id)`

| Argument | Type             | Description                                                 |
| -------- | ---------------- | ----------------------------------------------------------- |
| `id`     | `string\|number` | Glyph name, Unicode code point, or hex string (`'U+0041'`). |

**Returns** `object \| undefined` — the **live** internal glyph object (direct
mutation persists).

### `.hasGlyph(id)`

| Argument | Type             | Description                            |
| -------- | ---------------- | -------------------------------------- |
| `id`     | `string\|number` | Glyph name, code point, or hex string. |

**Returns** `boolean`.

### `.getGlyphContours(id)`

Get a glyph's renderable outline contours, recursively flattening composite
(component-based) glyphs into absolute TrueType contours and applying each
component's offset and 2×2 transform. The stored glyph is **not** mutated, so its
`components` remain intact for a lossless export.

| Argument | Type             | Description                            |
| -------- | ---------------- | -------------------------------------- |
| `id`     | `string\|number` | Glyph name, code point, or hex string. |

**Returns** `Array` — array of contours (`[{ x, y, onCurve }, …]`), or `[]` when
the glyph has no geometry or does not exist.

### `.addGlyph(glyphOrOptions)`

Add or replace a glyph. If raw options are provided (not a finished glyph
object), they are passed through `createGlyph()` automatically.

| Argument         | Type     | Description                                |
| ---------------- | -------- | ------------------------------------------ |
| `glyphOrOptions` | `object` | A glyph object or `createGlyph()` options. |

Replacement rules, in priority order:

1. A Unicode code point maps to exactly one glyph, so a new glyph claiming a
   code point already owned by another glyph **replaces** it.
2. Otherwise a glyph with the same `name` is replaced in place — unless doing so
   would discard a glyph that owns a _different_ code point. In that case the
   incoming glyph's name is auto-uniquified (AGL `uniXXXX` / `uXXXXXX`) and
   appended so both glyphs survive.

### `.removeGlyph(id)`

Remove a glyph and any kerning pairs referencing it.

| Argument | Type             | Description                            |
| -------- | ---------------- | -------------------------------------- |
| `id`     | `string\|number` | Glyph name, code point, or hex string. |

**Returns** `boolean` — `true` if a glyph was removed.

## Font info methods

### `.getInfo()`

**Returns** `object` — the live font metadata object.

### `.setInfo(partial)`

Merge partial updates into the font metadata.

| Argument  | Type     | Description                                     |
| --------- | -------- | ----------------------------------------------- |
| `partial` | `object` | Fields to merge (e.g. `{ familyName: 'New' }`). |

## Kerning methods

### `.getKerning(left, right)`

| Argument | Type             | Description                             |
| -------- | ---------------- | --------------------------------------- |
| `left`   | `string\|number` | Left glyph (name, code point, or hex).  |
| `right`  | `string\|number` | Right glyph (name, code point, or hex). |

**Returns** `number \| undefined` — the kerning value, or `undefined` when no
pair exists.

### `.addKerning(input)`

Add kerning pair(s). Accepts every `createKerning()` input format. Duplicate
pairs resolve last-write-wins.

| Argument | Type               | Description                           |
| -------- | ------------------ | ------------------------------------- |
| `input`  | `object\|object[]` | Kerning data in any supported format. |

### `.removeKerning(left, right)`

| Argument | Type             | Description                             |
| -------- | ---------------- | --------------------------------------- |
| `left`   | `string\|number` | Left glyph (name, code point, or hex).  |
| `right`  | `string\|number` | Right glyph (name, code point, or hex). |

**Returns** `boolean` — `true` if a pair was removed.

### `.listKerning()`

**Returns** `Array<{ left: string, right: string, value: number }>`.

### `.clearKerning()`

Remove all kerning. Returns nothing.

## Substitution methods (GSUB)

### `.listSubstitutions(filter)`

| Argument | Type     | Description                              |
| -------- | -------- | ---------------------------------------- |
| `filter` | `object` | _Optional_ `{ type?, feature? }` filter. |

**Returns** `object[]` — all substitution rules (filtered if a filter is given).

### `.getSubstitution(glyphId, options)`

| Argument  | Type             | Description                            |
| --------- | ---------------- | -------------------------------------- |
| `glyphId` | `string\|number` | Glyph name, code point, or hex string. |
| `options` | `object`         | _Optional_ `{ type?, feature? }`.      |

**Returns** `object[]` — substitution rules involving the glyph.

### `.addSubstitution(input)`

Add substitution rule(s). Accepts the same flexible formats as
`createSubstitution()` — single rules, arrays, class-based, etc.

| Argument | Type               | Description           |
| -------- | ------------------ | --------------------- |
| `input`  | `object\|object[]` | Substitution rule(s). |

### `.removeSubstitution(filter)`

Remove rules matching a filter.

| Argument | Type     | Description                              |
| -------- | -------- | ---------------------------------------- |
| `filter` | `object` | `{ type?, feature?, from?, ligature? }`. |

**Returns** `number` — count of rules removed.

### `.clearSubstitutions()`

Remove all substitution rules. Returns nothing.

## Axis & instance methods

### `.listAxes()`

**Returns** `Array<{ tag, name, min, default, max }>`.

### `.getAxis(tag)`

| Argument | Type     | Description                           |
| -------- | -------- | ------------------------------------- |
| `tag`    | `string` | 4-character axis tag (e.g. `'wght'`). |

**Returns** `object \| undefined`.

### `.addAxis(axis)`

Add a new axis (or replace one with the same tag).

| Argument | Type     | Description                                  |
| -------- | -------- | -------------------------------------------- |
| `axis`   | `object` | `{ tag, name, min, default, max, hidden? }`. |

### `.removeAxis(tag)`

Remove an axis by tag. Also removes any named instances referencing it.

| Argument | Type     | Description |
| -------- | -------- | ----------- |
| `tag`    | `string` | Axis tag.   |

**Returns** `boolean`.

### `.setAxis(tag, partial)`

| Argument  | Type     | Description                    |
| --------- | -------- | ------------------------------ |
| `tag`     | `string` | Axis tag to update.            |
| `partial` | `object` | Fields to merge into the axis. |

**Returns** `boolean` — `true` if the axis existed.

### `.listInstances()`

**Returns** `Array<{ name: string, coordinates: object }>`.

### `.addInstance(instance)`

Add (or replace by name) a named instance.

| Argument   | Type     | Description                                |
| ---------- | -------- | ------------------------------------------ |
| `instance` | `object` | `{ name, coordinates: { wght: 700, … } }`. |

### `.removeInstance(name)`

| Argument | Type     | Description    |
| -------- | -------- | -------------- |
| `name`   | `string` | Instance name. |

**Returns** `boolean`.

## Color font methods (COLR / CPAL)

### `.getPalette(index)`

| Argument | Type     | Description    |
| -------- | -------- | -------------- |
| `index`  | `number` | Palette index. |

**Returns** `string[] \| undefined` — array of hex color strings.

### `.addPalette(colors)`

| Argument | Type                    | Description                  |
| -------- | ----------------------- | ---------------------------- |
| `colors` | `Array<string\|object>` | Hex strings or BGRA objects. |

**Returns** `number` — the index of the added palette.

### `.removePalette(index)`

| Argument | Type     | Description    |
| -------- | -------- | -------------- |
| `index`  | `number` | Palette index. |

**Returns** `boolean` — `true` if a palette was removed.

### `.setPaletteColor(paletteIndex, colorIndex, hex)`

| Argument       | Type     | Description                            |
| -------------- | -------- | -------------------------------------- |
| `paletteIndex` | `number` | Index of the palette to modify.        |
| `colorIndex`   | `number` | Index of the color within the palette. |
| `hex`          | `string` | New hex color string.                  |

Throws if the palette or color index is out of range.

### `.getColorGlyph(id)`

| Argument | Type             | Description                            |
| -------- | ---------------- | -------------------------------------- |
| `id`     | `string\|number` | Glyph name, code point, or hex string. |

**Returns** `object \| undefined` — the color glyph object.

### `.addColorGlyph(input)`

Add (or replace) color data for a glyph.

| Argument | Type     | Description                                            |
| -------- | -------- | ------------------------------------------------------ |
| `input`  | `object` | Color data with `name` and either `layers` or `paint`. |

### `.removeColorGlyph(id)`

| Argument | Type             | Description                            |
| -------- | ---------------- | -------------------------------------- |
| `id`     | `string\|number` | Glyph name, code point, or hex string. |

**Returns** `boolean` — `true` if color data was removed.

### `.listColorGlyphs()`

**Returns** `Array<{ name: string, type: 'layers' | 'paint' }>`.

## Feature & hinting methods

### `.getFeatures()`

**Returns** `object` — OpenType features `{ GPOS?, GSUB?, GDEF? }`.

### `.setFeatures(partial)`

Replace or update feature tables.

| Argument  | Type     | Description                |
| --------- | -------- | -------------------------- |
| `partial` | `object` | `{ GPOS?, GSUB?, GDEF? }`. |

### `.getHinting()`

**Returns** `object` — TrueType hinting tables `{ gasp?, cvt?, fpgm?, prep? }`.

### `.setHinting(partial)`

Update TrueType hinting tables. Only the keys present in `partial` are changed.

| Argument  | Type     | Description                      |
| --------- | -------- | -------------------------------- |
| `partial` | `object` | `{ gasp?, cvt?, fpgm?, prep? }`. |

## Export & serialization

### `.export(options)`

Export the font to binary data.

| Argument         | Type     | Default  | Description                                                                  |
| ---------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `options.format` | `string` | `'sfnt'` | One of `'sfnt'`, `'woff'`, `'woff2'`, `'cff'`, `'ttf'`, `'otf'` (see below). |

**Returns** `ArrayBuffer`.

Format notes:

- `'sfnt'` — a plain TTF/OTF file matching the font's current outline format.
- `'woff'` / `'woff2'` — compressed web font wrappers (call `initWoff2()` first
  for WOFF2).
- `'cff'` — a bare CFF table (PostScript outlines only).
- `'ttf'` — an SFNT file, first converting outlines to TrueType (`glyf`).
- `'otf'` — an SFNT file, first converting outlines to PostScript (`CFF `).

### `.convertOutlines(target)`

Convert the font's glyph outlines between TrueType (`glyf`, quadratic) and
PostScript/CFF (`CFF `, cubic) technologies **in place**, switching the
`sfntVersion` and swapping the outline tables. Static (non-variable) fonts only.

| Argument | Type                  | Description                 |
| -------- | --------------------- | --------------------------- |
| `target` | `'truetype' \| 'cff'` | Desired outline technology. |

**Returns** `FontFlux` — `this`, for chaining.

```js
const otf = font.convertOutlines('cff').export({ format: 'sfnt' });
```

### `.toJSON(indent)`

Serialize the font to a JSON string.

| Argument | Type     | Default | Description        |
| -------- | -------- | ------- | ------------------ |
| `indent` | `number` | `2`     | Indentation level. |

**Returns** `string`.

### `.validate()`

Check the font data for structural issues.

**Returns** `object` — `{ valid, errors, warnings, infos }`. Only call
`.export()` when `valid === true`.

### `.detach()`

Strip stored tables and header, converting to a pure hand-authored shape.
Non-decomposed tables (COLR, gvar, bitmap data, etc.) are lost.

**Returns** `FontFlux` — `this`, for chaining.

## Static utilities

Font-independent helpers for diagnostics, SVG conversion, and low-level
charstring work.

### `FontFlux.diagnose(buffer)`

Diagnose a binary font file and return a detailed problem report. Unlike
`FontFlux.open()`, which throws on corruption, this catches errors at each phase
and continues, explaining exactly what is wrong with the file.

| Argument | Type          | Description          |
| -------- | ------------- | -------------------- |
| `buffer` | `ArrayBuffer` | Raw font file bytes. |

**Returns** `object` — `{ valid, errors, warnings, infos, issues, summary }`.

### `FontFlux.svgToContours(pathData, format)`

Parse an SVG path `d` string into font contour data.

| Argument   | Type     | Description                                                             |
| ---------- | -------- | ----------------------------------------------------------------------- |
| `pathData` | `string` | An SVG path `d` string (M, L, H, V, C, S, Q, T, Z plus relative forms). |
| `format`   | `string` | `'cff'` (cubic command objects) or `'truetype'` (point arrays).         |

For `'cff'`, quadratic curves are promoted to cubic (lossless degree elevation).
For `'truetype'`, cubic curves are approximated as quadratic (subdivision with a
0.5-unit error threshold).

### `FontFlux.contoursToSVG(contours)`

Convert font contours to an SVG path `d` string, auto-detecting TrueType
(emits `Q`) vs CFF (emits `C`).

| Argument   | Type    | Description        |
| ---------- | ------- | ------------------ |
| `contours` | `Array` | Font contour data. |

**Returns** `string` — an SVG path `d` string.

### `FontFlux.compileCharString(contours)`

Compile CFF contours into Type 2 charstring bytecode.

| Argument   | Type    | Description         |
| ---------- | ------- | ------------------- |
| `contours` | `Array` | CFF cubic contours. |

**Returns** the charstring byte array.

### `FontFlux.assembleCharString(text)`

Assemble human-readable charstring assembly text into Type 2 bytecode.

| Argument | Type     | Description               |
| -------- | -------- | ------------------------- |
| `text`   | `string` | Charstring assembly text. |

### `FontFlux.interpretCharString(bytes, globalSubrs, localSubrs)`

Interpret Type 2 charstring bytecode into cubic Bézier contours.

| Argument      | Type    | Description                         |
| ------------- | ------- | ----------------------------------- |
| `bytes`       | `Array` | Charstring bytecode.                |
| `globalSubrs` | `Array` | _Optional_ global subroutine index. |
| `localSubrs`  | `Array` | _Optional_ local subroutine index.  |

**Returns** decoded cubic Bézier contours.

### `FontFlux.disassembleCharString(bytes)`

Disassemble Type 2 charstring bytecode into human-readable assembly text.

| Argument | Type    | Description          |
| -------- | ------- | -------------------- |
| `bytes`  | `Array` | Charstring bytecode. |

**Returns** `string`.

## Internal data structure

`FontFlux.open()` parses a font binary into a **simplified** internal structure.
The instance properties (`.info`, `.glyphs`, `.kerning`, …) are live references
into this data:

```json
{
	"font": {
		"familyName": "MyFont",
		"styleName": "Regular",
		"unitsPerEm": 1000,
		"ascender": 800,
		"descender": -200
	},
	"glyphs": [
		{ "name": ".notdef", "advanceWidth": 500 },
		{ "name": "A", "unicode": 65, "advanceWidth": 600, "contours": ["..."] }
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
	"axes": [
		{ "tag": "wght", "name": "Weight", "min": 100, "default": 400, "max": 900 }
	],
	"instances": [{ "name": "Bold", "coordinates": { "wght": 700 } }],
	"axisMapping": {
		"wght": [
			{ "from": -1, "to": -1 },
			{ "from": 0, "to": 0 },
			{ "from": 1, "to": 1 }
		]
	},
	"axisStyles": { "elidedFallbackName": "Regular", "values": ["..."] },
	"metricVariations": {
		"regions": ["..."],
		"metrics": { "ascender": ["..."] }
	},
	"tables": {
		"head": { "unitsPerEm": 1000, "...": "..." },
		"cmap": { "...": "..." }
	},
	"_header": { "sfVersion": 65536 }
}
```

The top-level fields (`font`, `glyphs`, `kerning`) are the human-friendly editing
interface. The `tables` object preserves every parsed table for lossless binary
round-trip.

## Working with glyph outlines

`FontFlux.open()` produces simplified glyph data with decoded outline contours
ready for inspection and editing. For a complete guide to creating glyphs from
scratch, see [Creating Glyphs](./creating-glyphs.md).

### TrueType glyphs (TTF)

TrueType glyphs use **quadratic Bézier** curves. Each contour is an array of
points:

```json
{ "x": 200, "y": 500, "onCurve": true }
```

- `onCurve: true` — an on-curve point (line endpoint or curve anchor).
- `onCurve: false` — a quadratic off-curve control point.
- Consecutive off-curve points have an implied on-curve midpoint between them.

### CFF glyphs (OTF)

CFF glyphs use **cubic Bézier** curves. The raw table stores opaque Type 2
charstring byte arrays. Font Flux interprets these into contour commands:

```json
{ "type": "M", "x": 100, "y": 700 }
{ "type": "L", "x": 400, "y": 700 }
{ "type": "C", "x1": 400, "y1": 500, "x2": 200, "y2": 300, "x": 100, "y": 300 }
```

- `M` — moveTo (start of contour)
- `L` — lineTo
- `C` — cubic curveTo with two control points (`x1,y1`, `x2,y2`) and an endpoint (`x,y`)

Each simplified CFF glyph includes:

- `contours` — decoded cubic Bézier commands (as above)
- `charString` — the raw charstring byte array (for lossless round-tripping)
- `charStringDisassembly` — human-readable disassembly text

Use `FontFlux.interpretCharString()` and `FontFlux.disassembleCharString()` for
manual charstring work at the table level.

### SVG path conversion

Font Flux provides read/write conversion between glyph contours and SVG path `d`
strings. This is useful for visual editing, round-trip glyph modification, and
interop with SVG-based tools.

```js
import { FontFlux } from 'font-flux-js';

// Read: contours → SVG path string
const d = FontFlux.contoursToSVG(glyph.contours);
// d = "M100 700 L400 700 C400 500 200 300 100 300 Z"

// Write: SVG path string → contours
const cffContours = FontFlux.svgToContours(d, 'cff'); // cubic commands
const ttfContours = FontFlux.svgToContours(d, 'truetype'); // quadratic points
```

Coordinates are kept in font-space (Y-up). To render in SVG (Y-down), apply
`transform="scale(1,-1)"` on the SVG element.

## Workflow recommendation

1. Start from `FontFlux.open()` output when possible.
2. Edit via instance properties and methods (`.info`, `.glyphs`, `.addGlyph()`,
   etc.) for common changes.
3. Edit `.tables` directly for low-level or table-specific changes.
4. Run `.validate()` to check for structural issues.
5. Only call `.export()` when `report.valid === true`.
