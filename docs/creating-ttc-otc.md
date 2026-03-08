# Creating a TTC / OTC Collection

This guide is for building a font collection (`.ttc`/`.otc`) with multiple faces.

## Required collection shape

At the top level, collection JSON must use this shape:

```json
{
  "collection": {
    "tag": "ttcf",
    "majorVersion": 2,
    "minorVersion": 0,
    "numFonts": 2
  },
  "fonts": [
    { "header": {}, "tables": {} },
    { "header": {}, "tables": {} }
  ]
}
```

## Required per-face tables

Each face in `fonts[]` is validated as a normal single font. That means each face must satisfy either:

- [Creating an OTF](./creating-otf.md), or
- [Creating a TTF](./creating-ttf.md).

In practice, each face still needs core tables such as:
- [`cmap`](./tables/cmap.md)
- [`head`](./tables/head.md)
- [`hhea`](./tables/hhea.md)
- [`hmtx`](./tables/hmtx.md)
- [`maxp`](./tables/maxp.md)
- [`name`](./tables/name.md)
- [`post`](./tables/post.md)

and a valid outline model for that face.

## Optional collection-level fields

- `collection.dsigTag`: DSIG tag for TTC v2+ metadata.
- `collection.dsigLength`: DSIG block length.
- `collection.dsigOffset`: DSIG block offset.

## Notes

- `collection.numFonts` should match `fonts.length`.
- Faces can be mixed (some CFF-based, some TrueType-based) as long as each face is internally valid.
- Validate full collection JSON with [`validateJSON`](./guide/validation.md) before export.
