# Creating Kerning

This guide covers how to create and work with kerning data in a Font Flux font. Whether you're adding kerning to a font built from scratch, editing kerning from an imported font, or looking up specific pair values — this is the reference for kerning structure, input formats, and the export pipeline.

## Quick start with `.addKerning()`

The `.addKerning()` method accepts kerning data in several flexible formats and merges them into the font's kerning array.

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({ family: 'My Font' });

font.addKerning([
	{ left: 'A', right: 'V', value: -80 },
	{ left: 'T', right: 'o', value: -40 },
]);
```

That's the simplest form — an array of `{ left, right, value }` pairs referencing glyphs by name. The method also supports grouping, maps, and class-based expansion for more compact authoring.

You can also construct kerning arrays directly as plain JSON and assign to `font.kerning` without using `.addKerning()`. The method is a convenience, not a requirement.

## Kerning pair reference

### Required fields

| Field   | Type     | Description                                                                  |
| ------- | -------- | ---------------------------------------------------------------------------- |
| `left`  | `string` | The glyph name on the left side of the pair (e.g. `"A"`, `"T"`, `"period"`). |
| `right` | `string` | The glyph name on the right side of the pair.                                |
| `value` | `number` | The kerning adjustment in font units. Negative values tighten spacing.       |

### Understanding kerning values

Kerning values are horizontal adjustments applied between two glyphs. A value of `-80` means the second glyph is moved 80 units closer to the first.

```
Without kerning:        With kerning (-80):
|  A  |  V  |          |  A  V  |
|     |     |          | (80 units tighter)
```

Positive values increase spacing (rare). Zero values have no effect but are valid.

## Input formats

`.addKerning()` accepts five formats, all of which can be freely mixed in an array.

### 1. Flat pair

A single `{ left, right, value }` object:

```js
font.addKerning({ left: 'A', right: 'V', value: -80 });
// adds: { left: 'A', right: 'V', value: -80 }
```

### 2. Array of flat pairs

```js
font.addKerning([
	{ left: 'A', right: 'V', value: -80 },
	{ left: 'A', right: 'W', value: -60 },
	{ left: 'T', right: 'o', value: -40 },
]);
```

### 3. Grouped by left glyph

All pairs sharing a left glyph, with right glyphs as keys:

```js
font.addKerning({ left: 'A', pairs: { V: -80, W: -60, T: -50 } });
// → [{ left: 'A', right: 'V', value: -80 },
//    { left: 'A', right: 'W', value: -60 },
//    { left: 'A', right: 'T', value: -50 }]
```

### 4. Grouped map

Multiple left glyphs, each with their own right-glyph map:

```js
font.addKerning({
	groups: {
		A: { V: -80, W: -60 },
		T: { o: -40, a: -35 },
	},
});
```

### 5. Class-based

Define glyph classes and reference them with `@className` in pairs:

```js
font.addKerning({
	classes: {
		roundLeft: ['O', 'C', 'G', 'Q'],
		diagonal: ['V', 'W', 'Y'],
	},
	pairs: [
		{ left: '@roundLeft', right: '@diagonal', value: -20 },
		{ left: 'A', right: '@diagonal', value: -80 },
	],
});
// Expands to 4×3 + 1×3 = 15 individual pairs
```

Class references work in all formats — flat pairs, grouped-by-left, and grouped maps.

### Mixed formats

All formats can be combined in a single array:

```js
font.addKerning([
	{ classes: { diag: ['V', 'W', 'Y'] } },
	{ left: 'A', pairs: { '@diag': -80, T: -50 } },
	{ groups: { T: { o: -40, a: -35, e: -35 } } },
	{ left: 'L', right: 'quoteright', value: -120 },
]);
```

### Deduplication

When the same pair appears multiple times, the last definition wins. This matches how GPOS merging works and lets you override specific pairs after class-based expansion:

```js
font.addKerning([
	{ left: '@caps', right: 'V', value: -60 },
	{ left: 'A', right: 'V', value: -80 }, // overrides the class value for A→V
]);
```

## Looking up kerning values

Use `.getKerning()` to look up the kerning value between two glyphs:

```js
font.getKerning('A', 'V'); // → -80
```

The arguments accept glyph names, numeric code points, or hex strings — the same flexible identifiers used by `.getGlyph()`:

```js
font.getKerning('A', 'V'); // by name
font.getKerning(65, 86); // by code point
font.getKerning('U+0041', 'U+0056'); // by hex string
font.getKerning('A', 0x56); // mixed
```

Returns `undefined` if no pair exists.

## Looking up glyphs

The `.getGlyph()` method looks up a glyph object from the font:

```js
font.getGlyph('A'); // by name
font.getGlyph(65); // by code point
font.getGlyph('U+0041'); // by hex string
```

Returns the glyph object or `undefined`. See [Creating Glyphs](./creating-glyphs.md) for more on glyph structure.

## How kerning is stored in fonts

Font Flux stores kerning in two complementary places:

- `kerning[]` — individual `{ left, right, value }` pairs (the flat representation used by `.addKerning()`, `.getKerning()`, and authoring from scratch).
- `kerningClasses[]` — **class-based** kerning preserved verbatim from the source font, so large class tables survive a round-trip without being permuted into millions of individual pairs.

When exporting, Font Flux builds the appropriate binary table(s) from these two structures.

### Import (any format → `kerning[]` + `kerningClasses[]`)

When you call `FontFlux.open()`, kerning is extracted from all available sources:

- **GPOS PairPos** (Format 1 and 2) — the modern standard
- **kern table** (OpenType Format 0 and 2, Apple Format 0, 1, 2, and 3)

Individual pairs (GPOS Format 1, kern Format 0/1) are merged into `kerning[]`. GPOS values take priority over kern on conflicts.

Class-based subtables (GPOS Format 2, kern Format 2/3) are preserved as `kerningClasses[]` instead of being expanded. Each source subtable becomes one entry in the array, so overlapping classes across subtables stay independent. See [Class-based kerning preservation](#class-based-kerning-preservation) below.

### Class-based kerning preservation

`kerningClasses` is an **array of subtable groups**. Each group maps 1:1 to a binary class-based subtable and has this shape:

```js
kerningClasses: [
	{
		// Multi-member classes only; singletons are referenced by bare glyph name.
		leftClasses: { '@kern_L1': ['A', 'Aacute', 'Agrave'] },
		rightClasses: { '@kern_R1': ['V', 'W', 'Y'] },
		// Pairs reference a class by '@name' or a single glyph by its bare name.
		pairs: [{ left: '@kern_L1', right: '@kern_R1', value: -80 }],
	},
	// ...one entry per source Format 2 / Format 3 subtable
];
```

`.getKerning()` resolves values from both `kerning[]` (individual pairs win) and every group in `kerningClasses[]` (later groups win), so lookups behave the same whether a pair came from a flat pair or a class.

On export, each group is written back as a single class-based subtable (GPOS PairPos Format 2) rather than being permuted. If a group's classes can't be represented as a single Format 2 subtable, only that group falls back to individual pairs. If you author or edit `kerningClasses` so that it deep-equals what was imported, the export is a fixed point — re-importing reproduces the same structure.

### Export (`kerning[]` + `kerningClasses[]` → binary)

By default, `.export()` writes individual pairs as **GPOS PairPos Format 1** and any `kerningClasses[]` groups as **GPOS PairPos Format 2** — the modern standard supported by all major text engines.

To target a different format, set `_options.kerningFormat`:

```js
const fontData = {
	font: { ... },
	glyphs: [ ... ],
	kerning: [ ... ],
	_options: { kerningFormat: 'gpos' }, // default
};
```

| Format            | Description                                      | Use case                       |
| ----------------- | ------------------------------------------------ | ------------------------------ |
| `'gpos'`          | GPOS PairPos Format 1 (default)                  | Modern fonts, broadest support |
| `'kern-ot-f0'`    | OpenType kern table, Format 0                    | Legacy compatibility           |
| `'kern-ot-f2'`    | OpenType kern table, Format 2 (class-based)      | Legacy with many pairs         |
| `'kern-apple-f0'` | Apple kern table, Format 0                       | macOS legacy apps              |
| `'kern-apple-f3'` | Apple kern table, Format 3 (compact class-based) | macOS with many pairs          |
| `'gpos+kern'`     | Both GPOS and kern Format 0                      | Maximum compatibility          |

### Cross-format conversion

Since formats funnel through the same `kerning[]` and `kerningClasses[]` structures, importing from one format and exporting to another happens automatically:

```js
// Open a font with legacy kern table
const font = FontFlux.open(legacyFontBuffer);

// Kerning is now in font.kerning as [{ left, right, value }]
// Export writes it as modern GPOS by default
const modernBuffer = font.export();
```

## Adding kerning to a font from scratch

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({
	family: 'My Font',
	unitsPerEm: 1000,
	ascender: 800,
	descender: -200,
});

font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600, path: '...' });
font.addGlyph({ name: 'V', unicode: 86, advanceWidth: 600, path: '...' });
font.addGlyph({ name: 'T', unicode: 84, advanceWidth: 550, path: '...' });
font.addGlyph({ name: 'o', unicode: 111, advanceWidth: 500, path: '...' });

font.addKerning([
	{ left: 'A', pairs: { V: -80, T: -50 } },
	{ left: 'T', pairs: { o: -40, a: -35 } },
]);

const buffer = font.export();
```

## Editing kerning from an imported font

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.open(buffer);

// Inspect existing kerning
console.log(font.kerning.length); // e.g. 1200

// Add pairs (duplicates are merged with last-write-wins)
font.addKerning({ left: 'A', right: 'V', value: -80 });

// Or clear and start fresh
font.clearKerning();
font.addKerning({
	groups: {
		A: { V: -80, W: -60 },
		T: { o: -40, a: -35 },
	},
});

// Remove a specific pair
font.removeKerning('A', 'V');

const output = font.export();
```

## Validation

Run `.validate()` on your font to catch structural issues before export:

```js
const report = font.validate();
if (!report.valid) {
	console.error(report.issues);
}
```

See the [Validation guide](./validation.md) for details on what's checked.

## Related table references

- [`GPOS`](./tables/GPOS.md) — default kerning output (PairPos Format 1).
- [`kern`](./tables/kern.md) — legacy Apple/OpenType kerning subtables (Format 0 / 2 / Apple 0–3).
