# Diagnostics Guide

Use `diagnoseFont(buffer)` to inspect a binary font file (TTF/OTF/WOFF/WOFF2/TTC/OTC) and get a structured report of structural problems, spec violations, and cross-table inconsistencies. Unlike `font.validate()` (which works on the parsed JSON), `diagnoseFont()` reads the raw bytes directly — making it the right tool for analyzing fonts that fail to import or that other tools (browsers, sanitizers) reject.

## API

```js
import { diagnoseFont } from 'font-flux-js';

const report = diagnoseFont(buffer); // ArrayBuffer
if (!report.valid) {
	for (const e of report.errors) {
		console.error(`[${e.code}] ${e.message}`);
	}
}
```

## Report format

```js
{
  valid: false,                     // true iff errors.length === 0
  errors:   [{ severity, code, message }],
  warnings: [{ severity, code, message }],
  infos:    [{ severity, code, message }],
  issues:   [...],                  // all issues, in the order discovered
  summary: { errorCount, warningCount, infoCount, issueCount }
}
```

## Severity levels

| Level       | Meaning                                                              | Effect on `valid` |
| ----------- | -------------------------------------------------------------------- | ----------------- |
| **error**   | Spec violation — font will likely be rejected by browsers/sanitizers | `valid = false`   |
| **warning** | Suspicious but tolerated — may still load                            | no effect         |
| **info**    | Informational — format detection, parse success, etc.                | no effect         |

## Diagnostic phases

`diagnoseFont()` runs the following phases in order. A fatal failure in an earlier phase short-circuits the rest.

1. **Signature** — buffer basics, magic-bytes detection, WOFF unwrapping.
2. **Header** — `sfVersion`, `numTables`, directory hint fields.
3. **Directory** — per-entry tag/offset/length validation, sort order.
4. **Required tables** — core + outline table presence.
5. **Checksums** — per-table OpenType checksum verification.
6. **Parse tables** — runs each table's parser to surface format errors.
7. **Cross-table checks** — consistency between related tables.

## Complete check reference

### Phase 1 — Signature & format

| Code                  | Severity | What it catches                                                  |
| --------------------- | -------- | ---------------------------------------------------------------- |
| `NOT_ARRAYBUFFER`     | error    | Input is not an `ArrayBuffer`                                    |
| `TOO_SHORT`           | error    | File is smaller than the 12-byte font header                     |
| `FORMAT_WOFF1`        | info     | File is WOFF1-wrapped (will be unwrapped before further checks)  |
| `WOFF1_UNWRAPPED`     | info     | WOFF1 successfully unwrapped to SFNT                             |
| `WOFF1_UNWRAP_FAILED` | error    | WOFF1 unwrap threw (corrupted compressed stream, bad header)     |
| `FORMAT_WOFF2`        | info     | File is WOFF2-wrapped                                            |
| `WOFF2_UNWRAPPED`     | info     | WOFF2 successfully unwrapped (requires `await initWoff2()`)      |
| `WOFF2_UNWRAP_FAILED` | error    | WOFF2 unwrap threw (decoder not initialized, corrupted Brotli)   |
| `FORMAT_COLLECTION`   | info     | File is a TTC/OTC collection — diagnosed at the collection level |

### Phase 2 — Header

| Code                 | Severity | What it catches                                                                |
| -------------------- | -------- | ------------------------------------------------------------------------------ |
| `HEADER_UNREADABLE`  | error    | Could not read the 12-byte font header                                         |
| `SF_VERSION`         | info     | Reports the detected outline format (TrueType / OpenType-CFF / Apple TrueType) |
| `BAD_SF_VERSION`     | error    | `sfVersion` is not a recognized magic value (`0x00010000`, `OTTO`, `true`)     |
| `NO_TABLES`          | error    | `numTables` is zero                                                            |
| `EXCESSIVE_TABLES`   | warning  | `numTables` exceeds a sane upper bound (potential corruption)                  |
| `BAD_SEARCH_RANGE`   | warning  | `searchRange` does not match the spec formula `2^floor(log2(numTables)) * 16`  |
| `BAD_ENTRY_SELECTOR` | warning  | `entrySelector` does not match `floor(log2(numTables))`                        |
| `BAD_RANGE_SHIFT`    | warning  | `rangeShift` does not match `numTables * 16 − searchRange`                     |

### Phase 3 — Table directory

| Code                         | Severity | What it catches                                                                                                       |
| ---------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `DIRECTORY_TRUNCATED`        | error    | The directory extends past the end of the file                                                                        |
| `DIRECTORY_ENTRY_UNREADABLE` | error    | A specific 16-byte directory entry could not be read                                                                  |
| `BAD_TABLE_TAG`              | error    | A table tag contains non-printable ASCII bytes                                                                        |
| `DUPLICATE_TABLE`            | error    | The same tag appears in two directory entries                                                                         |
| `TABLE_OUT_OF_BOUNDS`        | error    | A table's `offset + length` exceeds the file size                                                                     |
| `EMPTY_TABLE`                | warning  | A directory entry has zero length                                                                                     |
| `TABLE_MISALIGNED`           | warning  | Table data does not start on a 4-byte boundary (spec violation tolerated by most tools)                               |
| `DIRECTORY_NOT_SORTED`       | error    | Table directory is not in ascending tag order — Firefox/OTS rejects this (`Table directory is not correctly ordered`) |

### Phase 4 — Required tables

| Code                     | Severity | What it catches                                                                                 |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `MISSING_REQUIRED_TABLE` | error    | One of the seven core tables (`cmap`, `head`, `hhea`, `hmtx`, `maxp`, `name`, `post`) is absent |
| `NO_OUTLINES`            | error    | Neither TrueType (`glyf`/`loca`) nor CFF (`CFF `/`CFF2`) outlines present                       |
| `MIXED_OUTLINES`         | warning  | Both TrueType and CFF outline tables are present                                                |
| `UNKNOWN_TABLE`          | info     | A table tag is not recognized by Font Flux's parser registry                                    |

### Phase 5 — Checksums

| Code           | Severity | What it catches                                                                                                |
| -------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `BAD_CHECKSUM` | warning  | A table's stored `checksum` does not match the recomputed OpenType checksum (often safe; auto-fixed on export) |

### Phase 6 — Per-table parsing

| Code                 | Severity | What it catches                                                      |
| -------------------- | -------- | -------------------------------------------------------------------- |
| `TABLE_PARSED`       | info     | Successful parse confirmation for a table                            |
| `TABLE_PARSE_FAILED` | error    | A registered parser threw on the table's bytes (malformed structure) |

### Phase 7 — Cross-table consistency

| Code                        | Severity | What it catches                                                                                                                           |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `BAD_MAGIC_NUMBER`          | error    | `head.magicNumber` is not `0x5F0F3CF5`                                                                                                    |
| `BAD_UNITS_PER_EM`          | error    | `head.unitsPerEm` is outside the spec range (16–16384)                                                                                    |
| `HMTX_GLYPH_MISMATCH`       | warning  | `hmtx` total entry count (metrics + LSBs) does not equal `maxp.numGlyphs`                                                                 |
| `HHEA_HMTX_MISMATCH`        | warning  | `hhea.numberOfHMetrics` does not equal the number of full metric entries in `hmtx`                                                        |
| `LOCA_BEYOND_GLYF`          | error    | The final `loca` offset extends past the end of the `glyf` table                                                                          |
| `CFF_GLYPH_MISMATCH`        | warning  | CFF charstrings count does not equal `maxp.numGlyphs`                                                                                     |
| `NO_FAMILY_NAME`            | warning  | `name` table contains no family name record (nameID 1)                                                                                    |
| `NO_STYLE_NAME`             | warning  | `name` table contains no style name record (nameID 2)                                                                                     |
| `NAME_RECORDS_NOT_SORTED`   | error    | `name` records are not in ascending order by `(platformID, encodingID, languageID, nameID)` — Firefox/OTS rejects this                    |
| `CMAP_SUBTABLES_NOT_SORTED` | error    | `cmap` encoding records are not in ascending order by `(platformID, encodingID, language)` — Firefox/OTS rejects this                     |
| `CFF_EMPTY_CHARSTRING`      | error    | A CFF glyph charstring is empty (must contain at least an `endchar` operator) — Firefox/OTS reports `Failed validating CharStrings INDEX` |
| `CFF_CHARSTRING_NO_ENDCHAR` | warning  | A CFF glyph charstring does not terminate with `endchar` (0x0E) or `return` (0x0B)                                                        |
| `VHEA_VMTX_MISMATCH`        | warning  | `vhea.numOfLongVerMetrics` does not equal the number of full metric entries in `vmtx`                                                     |
| `GVAR_WITHOUT_FVAR`         | error    | `gvar` is present without `fvar` — glyph variations require an axis definition                                                            |

### Collection (TTC/OTC) checks

| Code                           | Severity | What it catches                                                   |
| ------------------------------ | -------- | ----------------------------------------------------------------- |
| `EMPTY_COLLECTION`             | error    | TTC/OTC declares zero contained fonts                             |
| `COLLECTION_INFO`              | info     | Reports the collection version and font count                     |
| `COLLECTION_HEADER_UNREADABLE` | error    | Could not read the collection header                              |
| `NO_READABLE_ENTRIES`          | error    | None of the offsets in the collection header point to valid SFNTs |

## Best practices

- Run `diagnoseFont()` on any font that fails to load in a browser. The error codes correspond directly to the messages browsers/sanitizers (Firefox/OTS) emit.
- For fonts you've authored or modified through Font Flux, an exported binary should produce zero errors when re-diagnosed — Font Flux automatically fixes the most common spec violations on export (directory ordering, cmap/name sort order, charstring termination).
- Use `font.validate()` instead when working with hand-authored JSON, before calling `font.export()`.
