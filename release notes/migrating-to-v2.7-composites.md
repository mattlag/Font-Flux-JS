# Migrating to v2.7.0 — composite / `glyf` authoring

This note covers the composite-glyph and command-format-contour fixes shipped in
**font-flux-js v2.7.0**. It is written for callers who build TrueType compound
glyphs at runtime via `FontFlux.create()` → `font.addGlyph(glyph)` →
`font.export({ format })` (e.g. font editors integrating FFJS as a library).

**TL;DR:** the upgrade is **drop-in**. The composite-dropping bugs are fixed
library-side, so existing code keeps working unchanged. There is one optional
simplification we actively recommend (reference components by `glyphName`), and
one seeded-glyph behavior to be aware of.

## What was fixed (no action required)

### Command-format contours no longer break composite linking

When any glyph carried a compiled `charString` — which happens automatically
when you add a glyph using command-format contours
(`{ type: 'M' | 'L' | 'C' | 'Q', ... }`) — the whole font was previously
misclassified as CFF. CFF has no concept of composite glyphs, so every component
was dropped on export and the reopened font came back empty. This was triggered
in **two** code paths (the table builder *and* the `format: 'ttf'` conversion
path, which ran `cffToTrueType` and deleted components).

Both paths now use a count-based outline-technology heuristic where **the
presence of any composite forces TrueType**. Your compound glyphs survive a
round-trip even when sibling glyphs use command/cubic contours.

➡️ You can delete any workaround that forced all glyphs into TrueType
point-format purely to keep composites alive.

### Degenerate `M0,0` subpaths no longer break composite linking

`svgPathToContours` now drops move-only / empty subpaths, so a stray leading
`M0,0` no longer becomes a corrupt single-point contour.

➡️ You can stop stripping leading `M0,0` before handing paths to FFJS (harmless
to keep).

### Input glyphs are never mutated

`createGlyph` / `addGlyph` return a normalized **copy**; your input object and
its `path` field are never modified in place.

➡️ You can drop any defensive cloning you added before calling `addGlyph`.

## What you can now do better (optional)

### Reference a component by glyph **name**

Components previously required a numeric `glyphIndex`, forcing you to track index
math. v2.7 lets you reference components by name and fully supports the
high-level component shape (which was documented but previously never wired up,
and would crash). Both forms now work:

```js
// Recommended — reference by name, no index bookkeeping:
font.addGlyph({
  name: 'aacute',
  advanceWidth: 600,
  components: [
    { glyphName: 'a',     dx: 0,   dy: 0 },
    { glyphName: 'acute', dx: 120, dy: 420, scale: 1 },
  ],
});

// Still supported — explicit index:
font.addGlyph({
  name: 'aacute',
  advanceWidth: 600,
  components: [{ glyphIndex: 5, dx: 0, dy: 0 }],
});
```

Supported transform fields on a component: `scale` (uniform), `scaleXY`
(`{ x, y }`), or a full 2×2 `transform: { xx, xy, yx, yy }`. Optionally set
`useMyMetrics: true`.

Name resolution happens at **export time** against the finalized glyph array, so
you don't need to know a component's final index when you author it. An
unresolved name throws a clear error:
`Composite component references unknown glyph name`.

## One behavior to be aware of: seeded glyphs

`FontFlux.create()` pre-populates two glyphs before any of yours are added:

| Index | Glyph     | Notes                          |
| ----- | --------- | ------------------------------ |
| `0`   | `.notdef` | required                       |
| `1`   | `space`   | U+0020, advance ≈ `upm / 4`    |

Your added glyphs append starting at **index 2**. Nothing is injected *at
export* — the `space` comes from `create()`.

- If you compute component `glyphIndex` values yourself, offset by these two
  seeded glyphs. (Preferring `glyphName` sidesteps this entirely.)
- If you don't want the seeded `space`, overwrite or remove it after `create()`.

## Summary

| Finding                                  | Status in v2.7    | Action                                   |
| ---------------------------------------- | ----------------- | ---------------------------------------- |
| Command-format contours break composites | Fixed             | None — remove workaround if any          |
| Leading `M0,0` breaks composites         | Fixed             | None — remove workaround if any          |
| Reference component by name              | New feature       | Optional — switch to `glyphName`         |
| Seeded `.notdef` / `space` indices       | Documented        | Only if you do index math (prefer names) |
| Input glyph mutation                     | Confirmed safe    | None — drop defensive cloning if any     |

See also: [Creating glyphs](../docs/creating-glyphs.md).
