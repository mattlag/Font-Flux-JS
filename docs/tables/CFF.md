# `CFF ` table

## Scope

- Format family: OTF-specific
- Table tag in JSON: `CFF `

## Specs

- (No explicit spec URL found in implementation source)
- OpenType table registry: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

```json
{
  "tables": {
    "CFF ": {
      "majorVersion": null,
      "minorVersion": null,
      "names": null,
      "strings": null,
      "globalSubrs": null,
      "fonts": null,
      "_checksum": 0
    }
  }
}
```

## Top-level Fields

- `majorVersion` - implementation-defined
- `minorVersion` - implementation-defined
- `names` - implementation-defined
- `strings` - implementation-defined
- `globalSubrs` - implementation-defined
- `fonts` - implementation-defined


## Nested JSON Structure

Parsed CFF v1 table:

```json
{
	"majorVersion": 1,
	"minorVersion": 0,
	"names": ["FontName"],
	"strings": ["CustomString"],
	"globalSubrs": [[0, 1, 2]],
	"fonts": [
		{
			"topDict": { "FullName": 391, "Weight": 392 },
			"charset": { "format": 0, "glyphSIDs": [0, 1, 2] },
			"encoding": { "format": 0, "codes": [{ "code": 65, "glyph": 1 }] },
			"charStrings": [[139, 14]],
			"privateDict": { "BlueValues": [0, 10] },
			"localSubrs": [[11]],
			"isCIDFont": true,
			"fdArray": [
				{
					"fontDict": { "FontName": 393 },
					"privateDict": { "BlueScale": 0.039625 },
					"localSubrs": [[11]]
				}
			],
			"fdSelect": { "format": 3, "ranges": [{ "first": 0, "fd": 0 }], "sentinel": 500 }
		}
	]
}
```

Notes:

- `charStrings`, `globalSubrs`, and `localSubrs` are byte arrays (Type 2 charstring programs) preserved as raw bytes.
- Offsets (for charset/encoding/Private/FDArray/FDSelect) are resolved during parse and re-derived during write.




## Validation Constraints

- Use tag `"CFF "` (with trailing space) in table JSON.
- CFF outlines are an alternative to TrueType `glyf`/`loca`; avoid mixing outline models unless intentional.
- `fonts[]` entries should include consistent `charStrings`, `charset`, and `encoding` payloads.
- CID-keyed fonts require coherent `fdArray` and `fdSelect` structures.

## Authoring Example

```json
{
	"tables": {
		"CFF ": {
			"majorVersion": 1,
			"minorVersion": 0,
			"names": ["ExampleFont"],
			"strings": [],
			"globalSubrs": [],
			"fonts": [
				{
					"topDict": {},
					"charset": { "format": 0, "glyphSIDs": [0] },
					"encoding": { "format": 0, "codes": [] },
					"charStrings": [[14]],
					"privateDict": {},
					"localSubrs": []
				}
			],
			"_checksum": 0
		}
	}
}
```



## Additional Nested Keys Seen In Implementation

- `fontDict`
- `privateDict`
- `localSubrs`
- `operator`
- `operands`

## Notes

- Preserve `_checksum` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in `_raw` instead of dropping data.
- Validate with `validateJSON` after edits.
