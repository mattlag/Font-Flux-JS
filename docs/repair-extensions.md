# Narrow geometry, CFF, mitigation, and variable-metadata repairs

These are bounded operations in the byte-preserving repair registry. Milestone
acceptance covers these declared guards and evidence, not arbitrary restoration
of damaged fonts. No upstream implementation was copied.

## Integration contract

`src/validate/repair-extensions.js` exports:

- `EXTENDED_REPAIRS`: immutable descriptors with revision, formats, prerequisites,
  risk rationale, invariants, affected tables, decisions, rebuild requirements,
  explicit conflicts and ordering constraints. Optional actions are discoverable
  even without an existing finding.
- `extendedRepairReason(id, payloads, options)`: `null` or an explicit blocker.
  Supply `options.values` to validate a particular decision. Without decisions,
  assisted actions check structural prerequisites, not unspecified intent.
- `applyExtendedRepair({id, values}, payloads, options)`: atomically commits
  replacement buffers to the supplied detached map only after successful
  application. Original buffers are never modified, even on failure.
- `inspectDerivedRepairs(payloads, options)`: plain warning issues for supported
  derived inconsistencies. The parent must register and execute this hook.
- `inspectDerivedRepairCoverage(payloads, options)`: one evidence record per
  stable scope (`tt.bounds`, `tt.maxp-geometry`, `hhea.extrema`, `vhea.extrema`,
  `cff.maxp`) with `outcome: checked | blocked | unsupported | skipped` and a
  reason. `checked` means complete bounded prerequisites were inspected, not
  that consistency findings passed. Diagnosis must consume this companion
  evidence; an empty issues array is **not** evidence that an unsupported scope
  passed.
- `verifyExtendedRepairs(before, after, steps, options)`: returns
  `{failures, handledTags}`. Only extension steps may be passed; unknown IDs throw.
- `extendedTableChanges(steps, beforePayloads)`: exact `{removed, added}` tag
  arrays. This includes only the explicitly selected optional table, existing
  dehinting tables, or the requested outline-table swap—not every catalogued
  affected table.
- `extendedSfntVersion(steps)`: `0x4F54544F` for `outlines.to-cff`, otherwise
  `null`. The parent must apply this to the candidate SFNT header and verify it;
  retaining the TrueType flavor after conversion is not a valid integration.

The parent remains responsible for complete SFNT directory/checksum processing,
signatures, container/opaque-table relocation guards, decision validation,
explicit potentially-lossy consent, post-export diagnosis, and exact comparison
of **every table not returned in `handledTags`**. A handled table is not exempt
from verification: the extension compares its parsed semantics and/or exact
bytes outside explicitly permitted fields. Independent verification does not
replay the repair writer and accept its output as the oracle.

`tt.dehint` removes only existing `fpgm`, `prep`, and `cvt ` tables.
`tables.remove-optional` removes exactly its chosen tag. `outlines.to-cff`
removes `glyf`/`loca` and adds `CFF `. None implicitly removes AAT, vendor, bitmap,
or unknown tables. The parent must use `extendedTableChanges`, not broad
`affectedTables`, to authorize table-set changes. Rebuilding checksums is still
the parent's responsibility.

Shared-table operations that the extension cannot independently verify together
are explicitly declared in descriptor `conflicts`. In particular:

- Head mutations conflict with `head.magic`, `head.glyph-data-format`, and
  `metadata.style`; the checksum adjustment alone is an allowed parent change.
- Horizontal extrema/compaction/decomposition conflict with `metadata.italic`,
  `metrics.line`, and `metrics.advance`.
- The fvar-authoritative OS/2 class action conflicts with the other OS/2 writers.
- Name-reference decisions conflict with name-record additions/removal/editing;
  first establish authoritative names in a separate verified transaction.

The parent must enforce these conflicts, not blindly ignore a table because two
descriptors mention it. `after` orders dehinting before decomposition, geometry
updates after decomposition, and an explicit loca format choice after rebuilding.
If source-based applicability rejects a prerequisite-dependent action, use
separate verified transactions; do not bypass the guard.

## FQ-018: complete authoritative TrueType data

| ID | Supported operation |
|---|---|
| `tt.bounds` | Static per-glyph and font control-point hulls |
| `tt.maxp-geometry` | Geometric maxima and glyph instruction byte-length maximum |
| `hhea.extrema`, `vhea.extrema` | Stored advances/bearings plus static outline extents |
| `hmtx.compact`, `vmtx.compact` | Compact equal trailing advances and coordinate counts |
| `tt.loca-format` | Explicit short/long representation of valid original offsets |

Bounds are conservative integer control-point hulls, not tight Bézier extrema.
Transformed component coordinates retain fractions for bounds, with outward
floor/ceil rounding. Composite point attachment, nested transforms, explicit
scaled/unscaled offsets, empty child glyphs, zero-contour and zero-byte glyphs
are supported. Ambiguous platform-dependent transformed offsets are blocked.
Only nonempty geometry contributes to font/bearing extrema; every advance
contributes to the advance maximum.

No contours, advances, side bearings, missing offsets, or missing metric records
are invented. A corrupt metric count is not inferred from a table's potentially
padded byte length. Compaction uses the complete existing decoded metrics.
Metric suffix bytes are preserved. Both loca representations preserve original
glyph extents; odd offsets and overflow cannot be silently truncated.

Geometric maxp updates retain all VM-dependent maxima. Cycles, invalid attachment
points/references, excessive expansion, contradictory transforms, and exact
integer/range overflow are blockers. Static bounds/extrema reject variation
dependencies; they do not claim default-instance bounds cover every instance.
TrueType maxp must already be a complete known version 1.0 record. A version
0.5 header is not promoted by inventing missing VM fields; unknown future
versions are never downgraded.

Reusable parent helpers in `repair-tt.js`:

- `readTT(payloads, options).geometry[i]` has `bounds`, `points`, `contours`,
  and component `depth`, from authoritative glyphs.
- `readMetrics(payloads, vertical).records` contains `[advance, bearing]`
  for every glyph, including compact trailing metrics.
- `derivedMetricExtrema(payloads, vertical, options)` returns
  `[advanceMax, minLeadingBearing, minTrailingBearing, maxExtent]`. It performs
  static-variation guards and exact representability checks. This can coordinate
  a separately authorized advance edit without guessing glyph widths.

## FQ-023: deliberately narrow CFF repairs

| ID | Supported operation |
|---|---|
| `cff.maxp` | CFF maxp version and count from the complete CharStrings INDEX |
| `cff.charstrings-index` | Append a canonical INDEX with identical complete programs |
| `cff.empty-glyph` | Add CFF1 endchar only to a source-confirmed zero-byte program |

INDEX re-encoding redirects the existing five-byte Top DICT CharStrings offset.
It preserves every original byte except that operand, including old INDEX data
and unknown/trailing bytes. File size increases; this is not compaction. Other
DICT offset encodings are explicitly unsupported rather than recompiled.

The parser bounds INDEX counts/offsets and every DICT numeric operand, including
BCD termination, before invoking existing codecs. Existing contextual bytecode
checks must report no errors **or unsupported/warning outcomes**. CID FD
assignments, per-FD subroutines, dictionaries, and CFF2 variation programs remain
unchanged. Complete program bytes, rather than recompilation, establish
preservation for the structural operations.

Corrupt INDEX boundaries and truncated nonempty programs require source data.
The empty-glyph action requires `confirmedEmpty: true` and a zero-byte CFF1
program. It retains the existing Private DICT default width and SFNT advances.
It never empties a nonempty program. CFF2's legitimate zero-byte programs must
not receive a CFF1 endchar.

The maxp action accepts only an existing complete known version 0.5 or 1.0
record. Established CFF data permits the version 0.5 header/count, but an
unknown future version or incomplete version-1 record is blocked. Only the
first six bytes change; pre-existing additional bytes remain preserved rather
than being silently discarded as part of this narrow header action.

## FQ-025: explicit mitigations, not safe outline restoration

- `tt.dehint`: remove glyph programs and `fpgm`/`prep`/`cvt `; coordinate
  instruction length, loca and maxp. Preserve contours, component records,
  metric records, glyph padding/opaque suffixes, and existing `gasp`.
- `tt.decompose`: flatten one already-dehinted static composite, including nested
  transforms and point attachment. Round resulting fractional points to integer
  units; preserve contour/point order and on-curve status. Recalculate dependent
  bounds, geometric maxima, and existing horizontal/vertical extrema. Set the
  overlap flag without pretending to perform contour union.
- `tt.overlap-flag`: explicitly set/clear only the selected glyph's first
  simple-point/composite-component overlap bit.

All three are potentially lossy and require parent-enforced consent.
Decomposition blocks `USE_MY_METRICS`, existing hints, unsupported point-index
dependencies, variation, and opaque tables. Dehinting also refuses device-metric
tables whose behavior it cannot reconcile. These guards never purge a table to
make the action applicable.

Additional concrete opt-in actions:

| ID | Narrow supported scope |
|---|---|
| `tt.remove-last-glyph` | Remove the final non-.notdef glyph after complete supported reference proof |
| `tables.remove-optional` | Remove exactly one selected `gasp`, `kern`, `SVG `, `COLR`, `CPAL`, `meta`, `hdmx`, `LTSH`, or `VDMX` |
| `outlines.to-cff` | Reuse the existing converter for guarded static simple TT contours |

Final-glyph removal requires dehinted data, correct source bounds (so retained
glyphs are not repositioned), known metadata, complete metrics/storage, and
post format 3 when post exists. All retained glyph IDs remain unchanged.
Every supported cmap format-4/12 subtable and composite reference is checked;
COLR v0 uses the existing subset/remap guard. Referenced glyphs, UVS/unsupported
cmaps, general layout references, variation, nonzero discarded opaque bytes,
and unknown dependencies are blocked. Only the selected glyph and its metrics
are removed. Font bounds, geometric maxima, metric counts/extrema, and OS/2
version-3+ nonzero-average advance are coordinated. Original VM maxima and
retained glyph bytes/positions are preserved.

Optional-table removal never means "remove all problematic tables." CPAL cannot
be removed while COLR or SVG may reference its palettes. Removing color
representations requires complete supported fallback outlines. Unknown or
variable dependencies block removal. A deliberately selected corrupt optional
payload can be discarded, but unrelated dependencies are not silently purged.

TT-to-CFF conversion requires a separately verified dehinted, decomposed font,
post format 3, known basic tables, complete cmap format 4/12, correct source
bounds, and bearings compatible with the original outline origins. Vertical
metrics, layout/point dependencies, unsupported metadata, and opaque data are
blocked. Contours need explicit on-curve first/last points and isolated
quadratic controls; implied-start/closure and consecutive off-curve cases are
not claimed. The existing `convertOutlines` converter is reused, but the full
font is **not** rebuilt: unrelated payloads remain exact.

Inputs explicitly authorize representation loss, name the CFF font, and choose
a Euclidean tolerance from 0 to 1 font unit. Existing PostScript name records,
when present, must agree. Independent verification degree-elevates each source
quadratic analytically and bounds every emitted Bézier control point's
deviation; the convex-hull property bounds the entire parameterized curve.
Widths, contour/segment topology, charset, FontMatrix, FontBBox, common post
metadata, and absence of unexpected hints/subroutines are checked separately.
The output uses a six-byte CFF maxp and zero head.indexToLocFormat, and requires
the parent to emit OTTO. This is not a general CFF-to-TT converter, nor a promise
of identical small-size rasterization.

## FQ-027: references and explicit instance policy

| ID | Supported operation |
|---|---|
| `fvar.axis-name` | One existing axis's display-name reference, not its tag |
| `fvar.instance-name` | One existing subfamily/PostScript name reference |
| `stat.axis-name`, `stat.value-name`, `stat.fallback-name` | Selected supported STAT name reference |
| `fvar.default-style` | Existing wght/wdth default authoritative for one OS/2 class |
| `fvar.add-instance` | Append one explicitly named coordinate tuple |
| `fvar.standard-instance` | Opt into one named standard wght coordinate (100–900), retaining other-axis defaults |

Fvar 1.0 uses known 20-byte axes and standard instance layouts. STAT 1.0–1.2
supports value formats 1–4, with unknown/aliased layouts blocked. Axis name
references must identify existing nonempty name records. Custom instances,
axis order/tags/ranges/defaults, unrelated flags, extension bytes, and all deltas
remain intact. Exact default width-class conversion only accepts standard
percentages; it never chooses a nearby class.

Appending an instance requires exact 16.16-representable comma-separated decimal
coordinates in the existing axis order and range, and existing authoritative
name IDs. Existing coordinate tuples are not overwritten or duplicated.
The existing optional PostScript field layout is retained; no implicit layout
upgrade occurs. Topology changes, tag renaming/reordering, changed ranges/defaults,
recovered deltas, and static instancing are not offered.

The standard-instance policy is explicitly selected one instance at a time.
It requires an existing wght axis, in-range standard weight, and authoritative
existing name IDs. All other axes—including nonstandard axes—retain their
existing default coordinates. Existing custom instances and all deltas remain
byte-identical. An existing coordinate tuple is refused rather than overwritten,
duplicated, or reported as a successful addition.

## Limits, acceptance evidence, and unsupported operations

Limits are bounded by `maxRepairPoints` (default 1,000,000; ceiling 10,000,000),
`maxRepairDepth` (default/ceiling 64), and `maxRepairCffObjects` (default 100,000;
ceiling 1,000,000). CFF program checking divides `maxCharStringOperations`
(default 1,000,000; ceiling 10,000,000) across glyphs. STAT inspection accepts
at most 256 axes and 4,096 axis values. Hitting a limit blocks the action;
it never counts as successful inspection.

`test/repair-extensions.test.js` checks original-buffer immutability, atomic
failure, both loca formats, compact trailing horizontal/vertical metrics,
transforms, point attachment, empty glyphs, overflow, unknown/variation guards,
instruction and opaque suffix preservation, verifier tampering, malformed CFF
programs, CFF1/CFF2 emptiness, CID private/subroutine context, supported STAT
formats, existing custom instances, and exact coordinate/name decisions.
Independent HarfBuzz tests compare shaping and paths across supported integer
transformed/point-attached decomposition, isolated final-glyph removal, exact
line conversion, and distinct CID per-FD subroutines. CFF2 blend geometry is
sampled at normalized 0/.25/.5/.75/1 around an interior support region.
RobotoFlex metadata repairs retain independent shaping/paths at selected
min/default/max coordinates, a custom instance, and all-axis start/peak/end
vectors of a selected interior HVAR region (with inverse avar v1 mapping).
Unchanged variation payloads and custom instance bytes are checked separately.
These are finite samples, not exhaustive design-space certification.

The built-distribution `scripts/verify-consumers.mjs` gate separately selects
all six mitigation actions: dehinting, decomposition, overlap flag, final-glyph
removal, one optional-table removal, and TT-to-CFF conversion. It checks refusal
without consent, immutable originals, the actual requested changes, and
HarfBuzz glyph sequences/positions/paths. Chromium and Firefox load the exact
original/candidate bytes and check nonblank rasterization and advance stability
at 12, 24, and 48 px. Pixel identity is deliberately not asserted: removing hints
or changing rasterizer policy/overlap interpretation can affect pixels.
Authored fixtures meet the guards; this does not authorize applying a mitigation
to a font whose dependencies cannot be preserved.

Public safe-repair tests also retain contextual/extension GSUB/GPOS behavior,
exact artwork/image/metric payloads, and specialist-table bytes while preserving
explicit unsupported/partial coverage.

**Unsupported, not silently repaired:** arbitrary damaged loca/metric-count recovery, all-instance
variable bounds, general CFF offset-graph rewriting and corrupted program
recovery, TrueType VM inference, contour union, general glyph deletion/reference
rewriting, arbitrary optional-table removal, general bidirectional outline
conversion, rasterizer-policy editing, static instancing, and bulk automatic
standard-instance generation.
Hint loss/rounding can change rasterization; no exhaustive multi-platform or
small-size rasterization equivalence is claimed. See the
[criterion-level backlog](../FONT-QUALITY-BACKLOG.md) for milestone acceptance
within this declared scope.
