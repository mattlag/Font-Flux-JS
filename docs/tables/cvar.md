# `cvar` table

## Scope

- Format family: TTF-specific
- Table tag in JSON: `cvar`

## Specs

- https://learn.microsoft.com/en-us/typography/opentype/spec/cvar
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "cvar": {
      "majorVersion": 0,
      "minorVersion": 0,
      "tupleVariationHeadersRaw": null,
      "tupleVariationHeaders": null,
      "serializedData": null,
      "tupleVariationCountPacked": 0,
      "tupleVariationFlags": null,
      "tupleVariationCount": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - number (0..65535)
- `minorVersion` - number (0..65535)
- `tupleVariationHeadersRaw` - implementation-defined
- `tupleVariationHeaders` - implementation-defined
- `serializedData` - implementation-defined
- `tupleVariationCountPacked` - number (0..65535)
- `tupleVariationFlags` - implementation-defined
- `tupleVariationCount` - implementation-defined





## Additional Nested Keys Seen In Implementation

- `usesSharedPointNumbers`
- `flags`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
