## Editable Data Checks

`FontFlux.validate()` is observational: it checks simplified data and a detached resolved export candidate, including authored fonts that have no prebuilt tables. Warnings are retained. Resolution failures become `EXPORT_RESOLUTION_FAILED` issues rather than escaping as exceptions. The low-level raw-table validator's legacy repair behavior is separate.

Checks include finite/ranged advances and bearings, Unicode scalars, contour coordinates, glyph names and references, kerning values/classes, color layer references, axis tag/range constraints, and composite cycles/limits. Export enforces the same simplified checks. Imported duplicate names warn, but ambiguous topology changes reject. This is not a complete OpenType semantic validator: raw payloads and unsupported advanced authoring still require independent consumers.

WOFF/WOFF2 imports accept `{ maxUncompressedBytes: 256 * 1024 * 1024 }` by default. Decoded and reconstructed sizes are bounded; invalid directory/table extents, duplicate tags, malformed CFF INDEX structures, and excessive cmap expansion reject early. These limits are not a security sandbox or a total process-memory cap. Run hostile/untrusted font work in an isolated process with external resource limits.

Additional binary-import limits are listed in [Import Options](./api.md#import-options-and-types). Nested simplified layout/color data rejects cycles, depth above 64, or more than ten million visited fields. Contextual action references, paint glyph/palette references, component transform ranges, and required contour coordinates are checked before resolution. Arbitrary raw-table objects are still a low-level escape hatch, not exhaustively validated authoring input.

# Validation Guide

Use `.validate()` to catch structural and cross-table issues before export.
It builds and checks a detached export candidate, including generated tables
for fonts created from scratch. Validation does not mutate the live font or
change how subsequent edits are exported. Recoverable problems in the candidate
(missing headers, wrong directory fields, mismatched counts) are repaired and
reported as `info`-level issues. These repairs do not modify the source data.

## API

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.open(buffer);

const report = font.validate();
// The live font and its edits are unchanged.
if (!report.valid) {
	console.error(report.errors);
	throw new Error('Font failed validation');
}

const output = font.export();
```

## Severity levels

| Level       | Meaning                                                   | Effect on `valid` |
| ----------- | --------------------------------------------------------- | ----------------- |
| **error**   | Structural problem that will prevent export               | `valid = false`   |
| **warning** | Likely bug or unusual condition; export may still succeed | no effect         |
| **info**    | Auto-fixed or informational; no action needed             | no effect         |

## What `.validate()` checks

- The resolved export candidate's `header` and `tables`, rather than requiring
  callers to supply generated tables in the simplified authoring format.
- Header field sanity (`sfVersion`, `numTables`, directory fields) — auto-fixed when possible.
- Table tags are exactly 4 characters.
- Raw table bytes (`_raw`) are valid byte arrays.
- Parsed table support (unknown parsed tables must use `_raw`).
- Core table presence (`cmap`, `head`, `hhea`, `hmtx`, `maxp`, `name`, `post`).
- Outline requirements:
  - TrueType outline requires both `glyf` and `loca`.
  - CFF outline uses `CFF ` or `CFF2`.
- Common cross-table dependencies (for parsed tables), such as:
  - `hmtx` → `hhea`, `maxp`
  - `loca` → `head`, `maxp`
  - `glyf` → `loca`, `head`, `maxp`
  - `vmtx` → `vhea`, `maxp`

This is structural validation, not a full font sanitizer or a guarantee of
rendering equivalence. The internal `validateJSON()` helper still accepts raw
table data (including collections) and applies repairs directly to that input;
the public `.validate()` method isolates those repairs from the live font.

## Complete issue reference

### Errors

| Code                          | Message                                  | When                                                      |
| ----------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| `INPUT_INVALID`               | validate expects a font JSON object      | Input is not a plain object                               |
| `FONTDATA_INVALID`            | Font data must be an object              | Font entry (single or within collection) is not an object |
| `TABLES_MISSING`              | Font tables are required                 | `tables` missing or not an object                         |
| `TABLES_EMPTY`                | Font tables object is empty              | `tables` has zero entries                                 |
| `TABLE_TAG_INVALID`           | Table tag must be exactly 4 characters   | A key in `tables` is not a 4-char string                  |
| `TABLE_DATA_INVALID`          | Table must be an object                  | A table entry is not a plain object                       |
| `TABLE_CHECKSUM_INVALID`      | \_checksum must be uint32                | `_checksum` is present but not a valid uint32             |
| `TABLE_RAW_INVALID_TYPE`      | \_raw must be an array of byte values    | `_raw` is not an array                                    |
| `TABLE_RAW_INVALID_BYTE`      | \_raw byte must be 0-255                 | A value in `_raw` is out of byte range                    |
| `TABLE_WRITER_UNSUPPORTED`    | Parsed JSON but no writer available      | Unrecognized table tag with parsed data (no `_raw`)       |
| `TABLE_DEPENDENCY_MISSING`    | Parsed table requires another table      | A parsed table's dependency is missing                    |
| `REQUIRED_TABLE_MISSING`      | Required core table missing              | One of the 7 required core tables is absent               |
| `OUTLINE_MISSING`             | No outline tables found                  | Neither TrueType nor CFF outline tables present           |
| `TRUETYPE_OUTLINE_INCOMPLETE` | TrueType outline requires glyf/loca      | `glyf` or `loca` present without the other                |
| `HEADER_NUMTABLES_INVALID`    | numTables must be a non-negative integer | `numTables` is present but not a valid integer            |
| `COLLECTION_META_INVALID`     | collection must be an object             | Collection metadata is not an object                      |
| `COLLECTION_FONTS_INVALID`    | fonts must be a non-empty array          | `fonts` is missing or empty in a collection               |

### Warnings

| Code                        | Message                             | When                                        |
| --------------------------- | ----------------------------------- | ------------------------------------------- |
| `RECOMMENDED_TABLE_MISSING` | Recommended table "OS/2" is missing | `OS/2` table absent                         |
| `MULTIPLE_OUTLINE_TYPES`    | Both TrueType and CFF present       | Both outline types coexist                  |
| `VARIABLE_TABLE_DEPENDENCY` | gvar/cvar usually expects fvar      | Variable font table without axes definition |

### Info (auto-fixed or informational)

| Code                            | Message                                      | When                                                                                      |
| ------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `HEADER_SYNTHESIZED`            | No header found; synthesized one             | Neither `header` nor `_header` present; built from table data                             |
| `HEADER_PROMOTED`               | Promoted "\_header" for export compatibility | No `header` but `_header` exists (e.g. after `FontFlux.fromJSON()`)                       |
| `HEADER_SFVERSION_INFERRED`     | sfVersion inferred from outline tables       | `sfVersion` missing or invalid; inferred as `0x00010000` (TrueType) or `0x4F54544F` (CFF) |
| `HEADER_NUMTABLES_CORRECTED`    | numTables corrected to match table count     | `numTables` missing or does not match actual table count                                  |
| `HEADER_FIELDS_CORRECTED`       | Directory fields auto-corrected              | `searchRange`/`entrySelector`/`rangeShift` computed for actual table count                |
| `COLLECTION_NUMFONTS_CORRECTED` | numFonts corrected to match fonts array      | Collection `numFonts` does not match `fonts.length`                                       |
| `TABLE_UNRECOGNIZED_RAW`        | Unrecognized table preserved via \_raw       | Unknown tag with `_raw` — harmless, just noting it                                        |

## Report format

```js
{
  valid: false,
  errors:   [{ code, message, path, severity: 'error'   }],
  warnings: [{ code, message, path, severity: 'warning' }],
  infos:    [{ code, message, path, severity: 'info'    }],
  issues:   [...],  // all of the above combined
  summary: { errorCount, warningCount, infoCount, issueCount }
}
```

## Auto-fix behavior

When `.validate()` detects a recoverable issue, it repairs only a detached
export candidate and reports an `info`-level issue. The live font data is
unchanged; export independently resolves the current data:

```js
const report = font.validate();
// The live source is unchanged; the resolved candidate passed validation.
if (report.valid) {
	const buffer = font.export();
}
```

The internal raw-table validator can apply the following repairs. Through
`FontFlux.validate()`, they affect only the candidate. Calling the internal
`validateJSON()` directly retains its legacy in-place repair behavior:

- **Missing header**: Synthesized from table data (sfVersion inferred from CFF/TrueType tables).
- **`_header` promotion**: Copied to `header` when `header` is absent.
- **Missing/wrong sfVersion**: Inferred from outline tables.
- **numTables mismatch**: Set to actual `Object.keys(tables).length`.
- **Directory fields**: `searchRange`, `entrySelector`, `rangeShift` recomputed.
- **Collection numFonts**: Corrected to match `fonts.length`.

## Best practices

- Run `.validate()` before `.export()` to inspect issues without mutating live data. Export can still throw for errors only discovered during binary serialization.
- Treat warnings as "likely bugs" when hand-authoring JSON.
- Keep `_raw` for unknown tables to preserve round-trip behavior.
- Prefer small iterative edits and validate after each edit.
