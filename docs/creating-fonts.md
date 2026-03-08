# Creating Fonts

Use these guides when authoring Font Flux JSON from scratch.

## Choose a target format

- [Creating an OTF](./creating-otf.md)
- [Creating a TTF](./creating-ttf.md)
- [Creating a TTC / OTC Collection](./creating-ttc-otc.md)

## Shared workflow

1. Start from a minimal valid JSON shape with `header` and `tables`.
2. Add required tables for your target format first.
3. Add optional tables only when needed for features (layout, color, variations, metadata).
4. Run `validateJSON` frequently.
5. Export only when `report.valid === true`.

See [Validation guide](./guide/validation.md) and [All table references](./tables/index.md).
