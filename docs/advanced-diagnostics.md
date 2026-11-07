# Advanced binary diagnostics

The original FFJS checks in `src/validate/advanced-*.js` run from the real
`diagnoseFont()` pipeline, after bounded parsing. They do not call the raw JSON
validator and do not rewrite bytes. CFF INDEX/DICT/charset/FDSelect storage is
also inspected **before** invoking its permissive codec.

These are structural and reference checks, not a shaping engine, TrueType VM,
image decoder, or proof of rendering equivalence. Passing a declared structural
scope is not certification of every behavior of that table.

## Executed scopes

| Backlog | Implemented evidence |
| --- | --- |
| FQ-021 | GSUB/GPOS scripts, language systems, features and lookup references; nested extension/context rules and action indices; nested coverage, class definitions, substitution outputs, pair-class matrices, mark-class/parallel-array relationships, Device/VariationIndex dependencies and feature conditions; GDEF attachment/caret and GPOS cursive/mark/base/ligature/mark-to-mark AnchorFormat2 references into simple and recursively composed TrueType outlines. |
| FQ-022 | CFF1/CFF2 bounded INDEX spans, DICT operand storage, local/global INDEX references, FDSelect ranges/sentinels, custom charset and encoding/supplement boundaries; existing per-glyph FD context, widths, termination, subroutine depth, vsindex/blend rules; deterministic CFF1 arithmetic, transient storage, stack operations and drawing operand cardinality; CFF2 ordered Private DICT stack/blend/cardinality/blendability checks and per-FD inherited variation context. |
| FQ-024 | PUSH-aware IF/ELSE and FDEF/IDEF structure, including valid definitions in prep; simple/composite point-attachment bounds and conflicting component flags; observed point/contour/component/depth/instruction-length requirements versus maxp; gasp range flags/order. Existing glyf/loca parsers and cycle checks remain in use. |
| FQ-026 | gvar/cvar tuple dimensions, normalized and interior-region coordinates, point/component/phantom/CVT references, delta cardinalities; original packed point/delta run boundaries and shared tuple references; gvar offsets; variation-store region/row/word counts; explicit and implicit HVAR/VVAR mappings; stores in MVAR/GDEF/BASE/COLR/CFF2. |
| FQ-028 | COLR v0 layer ranges; v1 shared/indirect paint graphs, glyph and palette references, alpha/stops/compositing, variation references and clip ranges; CPAL colors and metadata; original SVG document bounds and glyph ranges, without executing XML. |
| FQ-029 | CBLC/CBDT, EBLC/EBDT and bloc/bdat strike and index references, sparse indices, image boundaries, packed-pixel lengths and composite references; sbix offsets, dupe references/cycles and PNG headers/chunk spans; EBSC substitute-strike references. |
| FQ-030 | MATH 1.0 constants/Device references, coverage/count pairs, kern heights, variants and assemblies; BASE 1.0/1.1 coordinates/variation references and simple/composite reference-glyph point indices; JSTF 1.0 priority/modification-list references and embedded-lookup headers; MERG 0 class definitions and merge-entry flags. |

`binary.advanced.<table>` records execution separately for each present table.
Future versions and opaque formats receive `unsupported` entries; unreadable
tables are `blocked`. Resource limits produce partial coverage, never an
implicit complete pass. Existing broad legacy groups retain their original
identities. `binary.metadata` forwards the parent-owned metadata inspector's
findings from a complete original payload map; individual unavailable
derivations have blocked prerequisite entries.

`binary.derived.<scope>` invokes the parent-owned repair inspectors for
`tt.bounds`, `tt.maxp-geometry`, `hhea.extrema`, `vhea.extrema` and `cff.maxp`.
Each scope first consumes the inspector's explicit prerequisite outcome.
Absent representations are skipped; unsupported geometry and blocked inputs
never become passing checks merely because no findings were returned. A
duplicate/out-of-bounds table blocks all five scopes. Findings are routed to
their matching scope separately for each collection face.

`binary.CFF2.private-dict.<fd>` checks an ordered Private DICT once per selected
FD, before inspecting its associated glyph programs. Unreferenced FDs are
checked separately without executing their local subroutines. Blend results
remain symbolic: prefixes, repeated blends, higher-order blends, zero-region
blends, destination cardinalities and forbidden blended controls can all be
checked without interpolation. The selected Private DICT vsindex is inherited
by its glyphs but can be overridden by a glyph's own vsindex. The 513-element
stack limit includes retained results between encoded DICT entries. An
unordered `privateDict.blend` projection without the original ordered entries
is explicitly unsupported, not guessed.

Findings carry table/path locations, and glyph indices or source byte offsets
where known. Paths refer to **actual parser shapes**: one Extension layer is
intentionally unwrapped by the layout codec; feature-condition endpoints retain
integer F2DOT14 units. NULL ItemVariationData offsets and `0xFFFF:0xFFFF` indices
retain their specified no-variation meaning. MERG classes beyond its merge
matrix retain the specified “never merge” meaning.

## Bounds and preservation

Every new graph, array and binary-span traversal uses the existing
`maxStructureNodes` / `maxStructureDepth` budgets. Packed data is checked inside
its own declared tuple/image span. PNG payload bytes count toward work before
copying; there is no decompression. Large bitmap or variable fonts can exhaust
the default work budget and must remain partial unless inspected with a larger,
explicitly chosen limit.

Contour-point references use concatenated stored component points, not
variation phantom points. Transforming or attaching a component does not
change its point numbering. Cached subtree heights still enforce depth limits
when a shared component is reached along a longer path. Empty glyphs have zero
points; missing outlines are blocked and CFF point numbering is unsupported.
The same cached-height discipline bounds TrueType component counting, COLR
paint graphs, and bitmap duplicate/component graphs, including a shared subtree
reached later through a longer path. Actual binary-path regressions distinguish
parser limits from advanced traversal limits; neither is a passing scope.
No geometric decomposition or hinted anchor positioning is claimed by diagnosis.

The only coupled codec correction is removal of an erroneous empty-store
parse in COLR v1. No upstream implementation was translated or copied. Formats were
checked against local normative OpenType specifications under `specs/opentype/`,
and existing FFJS parser/writer contracts.

All reference/artwork/program findings are **no automatic fix / source-required**
unless a separate repair establishes intent and preservation. Sorting coverage,
dropping lookups, appending charstring terminators, inventing deltas or replacing
pixels is not a diagnostic repair.

## M3 acceptance evidence and semantic boundaries

The original fixtures and independent repair consumers establish the following
bounded evidence; diagnostic execution itself is still structural, not a shaping
engine, virtual machine, or rasterizer:

- Public repair tests retain contextual/extension GSUB and GPOS payloads and
  compare actual HarfBuzz glyph sequences, positions, and nonempty paths before
  and after repairing SFNT search fields. Hinted anchor placement and CFF contour-point numbering remain
  unimplemented; supported TrueType simple/composite point-index references
  are checked. Unknown feature-condition/anchor formats are not interpreted.
- CFF random/obsolete operators, uninitialized transient values, endchar
  composite execution and numeric Private DICT hint interpolation remain unsupported.
  Ordered CFF2 Private DICT blend structure and inherited context are checked;
  malformed programs require authoritative source, not invented hint values.
  Independent tests distinguish two CID FDs with different local subroutines
  and compare nonempty glyph paths before/after structural repair. Standalone
  import tests verify each FD's declared default width and explicit width
  prefixes, including zero. Predefined charset semantics and
  every DICT operator's semantic constraints are not exhaustively certified.
- No dynamic TrueType stack, function ID, jump target, CVT access, VM-derived
  maxima or rasterizer verification. This is not an autohinter.
- Independent CFF2 geometry tests sample a declared blend region at weights
  100, 300, 500, 700, and 900 (normalized 0, .25, .5, .75, and 1).
  Real RobotoFlex metadata-repair tests sample axis minima/defaults/maxima, a
  custom instance, and the start/peak/end vectors of a selected interior HVAR
  region, inverse-mapped through avar v1. This is a finite sample set, not
  exhaustive axis-order correspondence, avar v2 evaluation, or all-instance
  interpolation/IUP certification.
- No color compositing/rendering, SVG XML/gzip validation, scripts or external
  resources. Geometric transform singularities and full artwork semantics are
  not certified.
- No PNG CRC or compressed-pixel validation; JPEG/TIFF/other image codecs remain
  explicitly unsupported. Bitmap index-table layout is not an exhaustive
  proof of all permitted overlap/aliasing arrangements.
- Safe public repair tests preserve exact COLR/CPAL, SVG, sbix image bytes and
  origin metrics, and MATH/BASE/JSTF/MERG payloads. Unexamined SVG/image codecs
  and each specialist scope remain explicitly partial. JSTF positioning beyond
  embedded headers/offsets and independent specialist-rendering equivalence
  remain unsupported; byte preservation is not a rendering claim.

The dedicated original fixtures include valid/bad/boundary/unsupported cases,
shared and cyclic references, conditional definitions, source-byte truncation,
interior multi-axis regions and deterministic repeated reports. Existing
diagnostic/CFF-context suites remain compatibility evidence, not an external
rendering oracle. Independent HarfBuzz and Chromium/Firefox repair evidence is
described in [repair extensions](./repair-extensions.md); criterion-level
closeout is tracked in the [backlog](../FONT-QUALITY-BACKLOG.md).

## Internal hooks and inventory integration

The integration hook is `runAdvancedDiagnostics(tables, entries, sfnt, issues,
options)`. Narrow module exports are test hooks, not new package public APIs:
`validateAdvancedLayout`, `validateAdvancedGdef`, `validateAdvancedStore`,
`validateAdvancedVariation`, `validateTupleBytes`, `validateCffStructures`,
`executeCffArithmetic`, `validateAdvancedTrueType`, `validateAdvancedColor`,
`validateAdvancedBitmap`, `inspectPng`, `validateAdvancedSpecialist`,
`validateCff2PrivateDictionary`, and `outlinePointCount`.
`diagnoseFont._internal.validateCffCharStrings` is preserved.

Stable export-to-scope mapping:

| Module/export | Pipeline scope |
| --- | --- |
| `advanced-layout`: `validateAdvancedLayout` / `validateAdvancedGdef` | `binary.advanced.GSUB`, `.GPOS` / `.GDEF` |
| `advanced-common`: `outlinePointCount` | Shared by `binary.advanced.GDEF`, `.GPOS`, `.BASE` |
| `advanced-cff-private`: `validateCff2PrivateDictionary` | `binary.CFF2.private-dict.<fd>` |
| `advanced-programs`: `validateCffStructures` | `binary.preflight.<CFF tag>.storage`, `binary.advanced.<CFF tag>` |
| `advanced-programs`: `executeCffArithmetic` / `validateAdvancedTrueType` | `binary.CFF` / `binary.advanced.truetype` |
| `advanced-variation`: `validateAdvancedVariation`, `validateAdvancedStore`, `validateTupleBytes` | `binary.advanced.gvar`, `.cvar`, `.HVAR`, `.VVAR`, `.MVAR`; stores additionally in GDEF/BASE/COLR/CFF2 |
| `advanced-color`: `validateAdvancedColor` | `binary.advanced.COLR`, `.CPAL`, `.SVG ` |
| `advanced-bitmap`: `validateAdvancedBitmap`, `inspectPng` | `binary.advanced.CBLC`, `.EBLC`, `.bloc`, `.sbix`, `.EBSC` |
| `advanced-specialist`: `validateAdvancedSpecialist` | `binary.advanced.MATH`, `.BASE`, `.JSTF`, `.MERG` |

The inventory extractor discovers literal/finite IDs and records
family/table/reachability metadata for these modules and the metadata/derived
forwarding sites in the generated ledger. With the pipeline's helper signatures
included, the advanced modules emit 88 distinct codes: 77 new codes below plus
the existing `CFF_BLEND_INVALID_COUNT`, `CFF_CONTEXT_UNSUPPORTED`,
`CFF_INVALID_NUMBER`, `CFF_INVALID_OPERAND_COUNT`, `CFF_STACK_OVERFLOW`,
`CFF_STACK_UNDERFLOW`, `CFF_VARIATION_CONTEXT_INVALID`,
`CFF_VARIATION_CONTEXT_MISSING`, `CFF_VSINDEX_OUT_OF_RANGE`, `DIAGNOSTIC_CHECK_FAILED`, and
`DIAGNOSTIC_LIMIT_EXCEEDED`.

```text
ADVANCED_CLASS_RANGE_INVALID
ADVANCED_COVERAGE_INVALID
ADVANCED_DEVICE_INVALID
ADVANCED_GLYPH_REFERENCE_INVALID
ADVANCED_PARALLEL_ARRAY_MISMATCH
ADVANCED_STRUCTURE_CYCLE
ADVANCED_STRUCTURE_INVALID
ADVANCED_VARIATION_REFERENCE_INVALID
BASE_DEFAULT_BASELINE_INVALID
BASE_POINT_REFERENCE_INVALID
BITMAP_DATA_OFFSETS_INVALID
BITMAP_DATA_TABLE_MISSING
BITMAP_DUPLICATE_INVALID
BITMAP_GLYPH_REFERENCE_INVALID
BITMAP_IMAGE_LENGTH_INVALID
BITMAP_IMAGE_METRICS_MISMATCH
BITMAP_LOCATION_TABLE_MISSING
BITMAP_PNG_INVALID
BITMAP_REFERENCE_CYCLE
BITMAP_SCALE_REFERENCE_INVALID
BITMAP_STRIKE_INVALID
BITMAP_SUBTABLE_RANGE_INVALID
CFF_ARITHMETIC_OPERAND_INVALID
CFF_CHARSET_DUPLICATE
CFF_CHARSET_REFERENCE_INVALID
CFF_ENCODING_INVALID
CFF_FDSELECT_STRUCTURE_INVALID
CFF_HEADER_INVALID
CFF_PRIVATE_DICT_BLEND_FORBIDDEN
CFF_PRIVATE_DICT_TRAILING_VALUES
COLOR_PALETTE_REFERENCE_INVALID
COLR_ALPHA_INVALID
COLR_BASE_GLYPH_ORDER_INVALID
COLR_CLIP_INVALID
COLR_COLOR_LINE_INVALID
COLR_COMPOSITE_MODE_INVALID
COLR_LAYER_RANGE_INVALID
COLR_PAINT_CYCLE
COLR_PAINT_REFERENCE_INVALID
CPAL_COLOR_RECORD_INVALID
CPAL_METADATA_INVALID
CPAL_PALETTE_COUNT_INVALID
GASP_RANGE_INVALID
GDEF_POINT_REFERENCE_INVALID
GLYF_ATTACHMENT_POINT_INVALID
GLYF_COMPONENT_FLAGS_CONFLICT
GLYF_MAXP_LIMIT_EXCEEDED
GPOS_ANCHOR_POINT_INVALID
GVAR_DATA_OFFSETS_INVALID
JSTF_LOOKUP_REFERENCE_INVALID
JSTF_MAX_LOOKUP_TYPE_INVALID
LAYOUT_CONTEXT_EMPTY
LAYOUT_EXTENSION_CYCLE
LAYOUT_EXTENSION_TYPE_INVALID
LAYOUT_GRAPH_REFERENCE_INVALID
LAYOUT_LANGSYS_RESERVED
LAYOUT_VARIATION_CONDITION_INVALID
MATH_ASSEMBLY_PART_INVALID
MATH_KERN_HEIGHTS_INVALID
MATH_VARIANT_ORDER_INVALID
MERG_ENTRY_FLAGS_INVALID
SVG_DOCUMENT_OFFSET_INVALID
SVG_DOCUMENT_RANGE_INVALID
SVG_RESERVED_FIELD_INVALID
TT_INSTR_DEFINITION_LOCATION_INVALID
TT_INSTR_DEFINITION_SCOPE_INVALID
TT_INSTR_ELSE_INVALID
VARIATION_MAP_ENCODING_INVALID
VARIATION_POINT_REFERENCE_INVALID
VARIATION_REGION_INVALID
VARIATION_REGION_REFERENCE_INVALID
VARIATION_SHARED_TUPLE_INVALID
VARIATION_TUPLE_COORDINATE_INVALID
VARIATION_TUPLE_DATA_SIZE_INVALID
VARIATION_TUPLE_FLAGS_INVALID
VARIATION_TUPLE_REGION_INVALID
VARIATION_WORD_DELTA_COUNT_INVALID
```
