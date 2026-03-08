# `glyf` table

## Scope

- Format family: TTF-specific
- Table tag in JSON: `glyf`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/glyf
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "glyf": {
      "glyphs": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `glyphs` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `x`
- `y`
- `onCurve`
- `type`
- `flags`
- `xScale`
- `yScale`
- `scale01`
- `scale10`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
