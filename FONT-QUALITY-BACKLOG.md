# Font quality: detection and repair backlog

Status: **M0 complete; M1–M3 scoped implementation delivered in v2.10.2**.
Final integrated verification is recorded below. **Isolated package installation
is optional, not a release requirement**. Required consumer verification uses the
built distribution and existing dependencies; it does not claim installation coverage.
See the status table and [implemented API guide](./docs/font-quality.md), rather
than treating every possible font defect as repairable.
Work-item IDs remain stable and suitable for later issues.

## Implementation progress

All implementations are original FFJS code, not copied or translated upstream
fixers. The current registry provides **56 actions: 20 conditionally safe,
26 assisted, and 10 potentially lossy**. Plans bind source bytes, decisions,
registry, profile/context, format, face and optional project revision.
Container-preserving adapters, operation-specific verification, resumable review,
real worker cancellation and the Demo use these shared contracts.
The inventory contains **398 active identifiers** (369 findings and 29
informational identifiers), retaining all 228 baseline IDs. Counts are not
coverage percentages.

| Work items | Current status | Implemented scope and boundaries |
| --- | --- | --- |
| FQ-001 through FQ-004 | Implemented | Generated provenance ledger, drift/baseline tests, versioned profiles, scoped execution outcomes, stable findings, and original mutation/preservation fixtures |
| FQ-005 through FQ-007 | Implemented | Collection offsets/face recovery; legal flags versus GDEF references; Unicode 17 selectors/scalars, supplementary mappings, UVS conflicts, and correct direct/indirect format-4 mapping checks |
| FQ-008, FQ-009 | Implemented for M0's declared scope | Original-wrapper versus decoded checks, checksums/extents, explicit failure coverage, import-aligned limits, bounded layout/color/composite traversal. WOFF2 collections and exhaustive semantic/process-memory guarantees remain explicitly unsupported, not certified |
| FQ-010 | Implemented | Retained originals and optional explicitly declared baselines; original/project/resolved/output stages stay distinct |
| FQ-011 through FQ-015 | Implemented | Complete descriptor validation, deterministic companion/conflict graphs, immutable source-bound plans, explicit serialized resumption, transaction/cancellation guards and selected-operation preservation proofs |
| FQ-016, FQ-017 | Implemented with declared guards | SFNT normalization, exact WOFF header patches, preserving rewrap, copy-on-write selected collection faces, localized/legacy record preservation, guarded post/maxp encodings |
| FQ-018 | Implemented | Static TT bounds, geometric maxp, horizontal/vertical extrema, metric compaction and coordinated loca; missing geometry/metrics, ambiguous transforms and variable-bound assumptions are refused |
| FQ-019, FQ-020 | Implemented | Localized names, style/caret/fixed-pitch policy, embedding authority, versioned average/range derivation, declared code pages, selected mappings/widths and line/clipping policy; no inferred artwork, rights or language completeness |
| FQ-021, FQ-022 | Implemented for supported structures | Bounded layout graphs and point references; CFF storage/arithmetic/transient/stack checks and supported CFF2 Private DICT programs; no general shaping/PostScript execution guarantee |
| FQ-023 through FQ-027 | Implemented with declared guards | CFF header/INDEX/confirmed-empty actions; TT instruction/composite checks and opt-in dehint/decompose/flag/removal/conversion; variation structures, existing name references and additive instance policy |
| FQ-028 through FQ-030 | Implemented for supported structures | Color/paint/palette/SVG, bitmap/storage/PNG-header, and MATH/BASE/JSTF/MERG checks; unsupported image codecs, embedded execution and rendering remain explicit |
| FQ-031 through FQ-034 | Implemented as explicit-context workflows | Declared family/repertoire/source-master evidence, atomic detached family candidates, bounded reachability/interpolation samples, original CFF1/Type 1 inspection and authorized source replacement |
| FQ-035 | Implemented | Disposable Node/browser workers, phase progress, cancellation/deadlines, stale-source checks and bounded content-keyed report reuse; five CJK faces measured; VM/cache limits are not RSS caps |
| FQ-036, FQ-037 | Implemented | Public types/examples, source and production-worker tests, built-distribution artifacts, independent HarfBuzz and browser consumers; isolated installation is optional |
| FQ-038 through FQ-043 | Implemented | Core profiles and typed decision forms, explicit consent, worker cancellation, reviewed-plan/audit downloads, exact bytes, staged preflight, transactional collection/preview/undo handling and browser regressions |
| FQ-044 | Implemented; acceptance closeout remains | Current API/limitations guides, generated 398-ID ledger, 56-action mapping, independent evidence and explicit unsupported/source-required boundaries |

### M1–M3 delivery evidence

| Area | Persistent evidence |
| --- | --- |
| Contracts, metadata, containers, public APIs | [Integration tests](./test/quality-m1.test.js), [core contracts](./docs/font-quality.md), [declarations](./index.d.ts) |
| Advanced original-byte inspection | [Scope/limits](./docs/advanced-diagnostics.md), [adversarial fixtures](./test/diagnose-advanced.test.js) |
| Advanced repair preservation | [Operation contracts](./docs/repair-extensions.md), [geometry/CFF/variation/mitigation fixtures](./test/repair-extensions.test.js) |
| Context and worker workflows | [Contracts](./docs/quality-workflows.md), [workflow tests](./test/quality-workflows.test.js), [production-built browser regression](./test/quality-worker-browser-build.test.js) |
| Large-font scheduling | [All-five-face measurements](./docs/quality-worker-baseline.jsonl), [repeatable worker harness](./scripts/verify-quality-workers.mjs) |
| Demo | [Chromium/Firefox acceptance harness](./scripts/verify-demo-quality.mjs) |
| Inventory | [Generated ledger](./docs/check-inventory.md), [AST/baseline drift tests](./test/check-inventory.test.js) |

Verified delivery:

- The full regression run passed **1,545 tests across 102 files**. Subsequent
  source-entry and actual-distribution browser regressions both passed (one
  additional case). Four consumer-mode regressions cover the no-install default,
  explicit local mode, optional installation and conflicting flags; the current
  suite contains 1,550 tests.
- Chromium and Firefox passed the expanded Demo flows, including typed choices,
  publishing context, persisted reviews, exact WOFF/collection transactions,
  four-stage preflight, commit/undo and cancellation.
- Strict declaration checking, changed-file lint, library/Demo/docs builds and
  immutable inventory-baseline verification passed.
- The complete local-build HarfBuzz and Chromium/Firefox consumer matrix passed.
  Final built-library Node smoke checks additionally passed worker/cache,
  serialized review/application and WOFF2 preflight/source-preservation cases.
- Package inspection confirms the worker asset is included. Source and
  distribution workers passed WOFF2, cancellation, CSP refusal and termination
  tests without Blob workers or general JavaScript `unsafe-eval`. Relative
  library asset URLs are required for downstream bundling.

No automatic source reconstruction, font-rights grant, universal language/family
profile, full hint VM, shaping/rasterizer certification, WOFF2 collection repair
or process-wide memory cap is claimed. Unsupported evidence is not a pass.
The historical isolated-install attempt for 2.10.0 rejected dependency fetching
with `EALLOWREMOTE`; no policy bypass or substitute installation claim was used.
Installation verification is now optional via
`npm run test:consumers -- --installed`, not a blocker for release acceptance.
The default `npm run test:consumers` retains declarations/schema, built-library,
HarfBuzz and browser verification without installing the package.

### M0 acceptance evidence

The [generated inventory](./docs/check-inventory.md) records **264 active
identifiers**, including all **228 baseline identifiers**, **248 finding
identifiers**, and **16 informational identifiers**. These are not counts of
independent executed checks or coverage percentages. All 15 existing repair
registrations are mapped; this milestone adds inspection capability, not a claim
that every finding is safely repairable. Upstream code was not copied.

| Requirement | Persistent evidence |
| --- | --- |
| FQ-001 | [Catalog and pinned provenance](./docs/check-inventory.md), [deterministic generator](./scripts/generate-check-inventory.mjs), [drift/baseline tests](./test/check-inventory.test.js) |
| FQ-002, FQ-003 | [Execution coverage](./src/validate/coverage.js), [versioned profiles](./src/validate/profiles.js), [public types](./index.d.ts), [determinism/context tests](./test/quality-m0.test.js) |
| FQ-004 through FQ-007 | [Exact binary mutation/collection tests](./test/diagnose-correctness.test.js), [compact horizontal/vertical metrics, raw mapping, UVS, opaque-data and profile fixtures](./test/quality-m0.test.js), [localized-name preservation](./test/quality.test.js) |
| FQ-008, FQ-009 | [Wrapper/decompression/original-source and exact composite budget tests](./test/quality-m0.test.js), [parser depth/work/cycle fixtures](./test/structure-limits.test.js), [CFF context/operation tests](./test/diagnose-cff-context.test.js) |
| FQ-010 | [Original/project/resolved/output stage tests](./test/quality-m0.test.js), [persisting invalid output and incomplete-check guards](./test/quality.test.js), [stage/normalization contract](./docs/font-quality.md#preflight-an-edited-or-authored-project) |

M0 verification:

- **708 tests across 23 focused files passed**, including inventory drift,
  binary/profile/preflight fixtures, affected layout/color parsers, CFF/TT
  diagnostics, repair preservation, and existing Demo unit tests.
- Strict declaration checking and focused lint passed; library, Demo, and
  documentation builds passed.
- Chromium and Firefox quality workflows passed at desktop/mobile sizes,
  including exact downloads, consent, failure paths, stale work, and collections.
- A built-library smoke test exercised all new APIs, SFNT/WOFF/WOFF2/OTF
  preflights, publishing context, and source preservation. Independent HarfBuzz
  glyph sequences, positions, and paths matched for the tested repair/preflight.
- Baseline verification and generated-inventory drift checks passed. No
  dependencies were added. Isolated npm installation was not retested; that
  historical check was not an M0 inspection requirement and is no longer a release gate.

M0-era remaining gaps (retained for historical context; see the current table
above for subsequent implementations) were **reported**, not hidden by `valid`, a catalog entry, or a
generic export success: standalone CFF/Type 1 inspection, WOFF2 collections,
complete shaping/rendering/variation semantics, unsupported cmap formats, and
total process-memory/time scheduling. These remain advanced follow-up work.
M0's check groups state their implemented scope; they do not manufacture a pass
for every absent diagnostic code.

Earlier core/Demo increment verification (retained for provenance):

- 546 focused tests across 15 files passed, covering diagnostic corrections,
  CFF context, public APIs, repair/rollback guards, and existing Demo unit tests.
- Library, Demo, and documentation builds passed; focused lint passed.
- The Demo implementation was exercised end-to-end in Chromium and Firefox,
  including desktop/mobile, exact candidate downloads, consent, and failure paths.
- The then-required isolated-installation check was blocked: the environment
  refused a dependency tarball with `EALLOWREMOTE`. No fetching policy was changed.
  The successful `--local` mode used existing dependencies and did not claim
  installation coverage. That mode is now the default required consumer check;
  isolated installation is optional.
- The complete local-build consumer matrix passed: declarations/schema, original
  versus exported HarfBuzz glyph sequences/positions/paths, variation samples,
  Chromium/Firefox SFNT/WOFF/WOFF2 loading/rendering, and the new repair workflow.

New entry points are documented in [Font Quality](./docs/font-quality.md).
Existing `validate()` and `export()` semantics remain separate; no claim is made
that a verified narrow repair certifies all font behavior. In particular, an
unchanged opaque payload or sampled rendering result is not semantic certification.

## Goal and delivery order

Help users inspect an existing font, understand its problems, make informed
repair decisions, and export a project at a known level of quality.

1. Make diagnosis trustworthy.
2. Deliver inspection, repair planning, transactional application, and verification
   in the **FFJS core library**.
3. Expose useful existing normalizations and add assisted repairs.
4. Update the **Demo App to consume the core**, replacing its local fix logic.
5. Expand advanced checks and repairs incrementally, always shipping the core
   capability before exposing it in the Demo.

This is the complete roadmap, not a commitment to implement every item in one
release. Advanced core work is grouped together below for navigation; it does
**not** block the first useful Demo release.

| Milestone | Required work | Exit condition |
| --- | --- | --- |
| **M0: trustworthy inspection - complete** | FQ-001 through FQ-010 | Known false positives/negatives fixed; original, candidate, and skipped coverage distinguished; evidence above |
| M1: usable core repair | FQ-011 through FQ-020, FQ-036, FQ-037 | Narrow safe repairs and assisted metadata/metrics repairs have public, verified workflows |
| M2: user-facing repair | FQ-038 through FQ-044, after M1 | Demo uses core plans, consent, verified candidates, and honest export reports |
| M3: advanced coverage | FQ-021 through FQ-035, incrementally | Each added domain states its coverage, limitations, and independently tested repair preconditions |

Priorities: **P0** = correctness/trust prerequisite; **P1** = first core/Demo
release; **P2** = expanded practical coverage; **P3** = advanced integrations or
source-dependent follow-up. Dependencies in each item are prerequisites, not
merely suggested ordering. No implementation or GitHub issue creation is implied
by recording an item here.

## Baseline and evidence

The analysis reviewed FFJS 2.9.1 at
[`f2646a5`](https://github.com/mattlag/Font-Flux-JS/tree/f2646a5b05c48d948b654ab27533c3c067d2e909),
[Fontspector at `6dfa585`](https://github.com/fonttools/fontspector/tree/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25),
and [fontTools at `1ff10da`](https://github.com/fonttools/fonttools/tree/1ff10daa33d4e40af00a76cda7fa804af4200b30).
Recheck applicability when implementing against a newer revision.

- FFJS has separate binary diagnosis, editable-data validation, and export
  normalization pipelines. Successful parsing or validation is not proof of a
  healthy exported binary. Public validation does not repair the live object.
- The inventory found 175 binary diagnostic identifiers and 53 additional
  validation/wrapper identifiers. These include informational and internal-path
  identifiers: **228 identifiers is not 228 independent checks or public repairs**.
- The comparison covered 180 issue/capability rows. Fontspector's three reviewed
  provider directories contained 232 check definitions and 33 binary-fixer
  registrations. Definitions are not active profile counts; registrations do not
  establish that a fix works for a particular font.
- Fontspector is a Rust QA framework, not a front end to Python fontTools.
  fontTools is a parsing/editing/compiler toolkit, not an equivalent unified QA
  report engine. Their capabilities should inform requirements, not be conflated.
- Upstream findings came from source review, not executing their full suites.
  FFJS findings were checked with 213 focused tests and 24 targeted probes.
  Those results are investigation evidence, not release acceptance for this work.

### Confirmed problems to address first

| Baseline finding | Required outcome | Work item |
| --- | --- | --- |
| TTC diagnosis reads SFNT structures at collection offset zero | Correct file-relative table offsets and per-face reports | FQ-005 |
| Legal lookup flags such as `0x0100` are rejected | Preserve legal `0xFF00` mark-attachment-class bits | FQ-006 |
| U+180F is omitted from accepted variation selectors | Use versioned Unicode property data and boundary tests | FQ-007 |
| Format-4 ranges 65..70 and 68..80 evade overlap detection | Detect overlap even when `endCode` increases | FQ-007 |
| Corrupting only `head.checksumAdjustment` is not diagnosed | Check standalone SFNT sums and special-case `head` correctly | FQ-008 |
| Invalid `head.glyphDataFormat` and cmap version can survive validation/export | Inspect the actual emitted bytes; do not treat candidate validation as sufficient | FQ-010, FQ-015 |
| `OS2_WEIGHT_CLAMPED` / `OS2_WIDTH_CLAMPED` describe no actual FFJS clamp | Describe an out-of-range value, not an applied repair | FQ-002 |
| Advanced checks and diagnostic resource controls are uneven | Explicit partial/blocked/unsupported coverage and bounded work | FQ-009, FQ-021 through FQ-035 |
| Demo has its own fix factories and can display "Fixed" after only setting `_dirty` | Core-owned fixes; distinguish pending export from verified repair | FQ-038 through FQ-043 |

Current implementation entry points:
[binary diagnosis](./src/validate/diagnoseFont.js),
[JSON validation](./src/validate/validateJSON.js),
[public API](./src/font_flux.js), [import](./src/import.js),
[resolution](./src/expand.js), and [export](./src/export.js).
Current contract documentation:
[diagnostics](./docs/diagnostics.md), [validation](./docs/validation.md),
[workflow limitations](./docs/index.md), and [API](./docs/api.md).

## Non-negotiable implementation rules

1. **Understand upstream; do not copy upstream code.** Write original FFJS
   implementations and original regression tests from normative specifications
   and observed requirements. Do not translate upstream implementation bodies
   into JavaScript. Record upstream references, relevant specification clauses,
   intended differences, and fixture provenance. No vendored fixer or runtime
   dependency on Fontspector/fontTools is required.
2. **Preserve the original.** Inspection and planning are observational. Repair
   operates on a detached candidate and never overwrites the original input.
3. **Safety is conditional.** A deterministic change is not necessarily safe.
   Missing data, signatures, unsupported dependencies, raw payloads, and target
   format can change applicability and risk.
4. **No silent loss or guessed intent.** Do not invent missing outlines, names,
   mappings, variation deltas, licensing permission, or hint program intent.
   Recovery from a trusted source and lossy mitigation are different outcomes.
5. **No success-shaped failure.** Failed/skipped checks, import failures,
   unsupported repairs, cancellation, and verification failures remain visible.
6. **Core owns behavior and explanations.** The Demo renders core metadata and
   results; it must not have a second checker, repair implementation, or competing
   issue-to-advice dictionary.
7. **Preserve existing APIs deliberately.** Additive contracts are preferred.
   Existing import/export behavior must not silently acquire new destructive
   defaults. Any intentional compatibility change needs migration documentation.

## Shared check and fix contract

The dimensions below define the roadmap contract. Implemented M0 spellings are
documented in [Font Quality](./docs/font-quality.md); broader repair execution and
availability concepts remain subject to the unfinished M1 work.

### Separate severity, risk, availability, and execution

| Dimension | Proposed values | Meaning |
| --- | --- | --- |
| Finding severity | error, warning, info | Consequence under the selected profile, not fix safety |
| Check outcome | passed, failed, skipped, blocked, unsupported | Whether the check actually ran and what it established |
| Check coverage | complete-for-declared-scope, partial | Explicit tested scope; never a whole-font certification |
| Fix risk | safe, assisted, potentially-lossy | Preserve semantics under stated preconditions; require a design/policy decision; or potentially remove/change behavior |
| Fix availability | available, needs-input, blocked, source-required, unsupported, not-applicable | Whether this specific operation can be performed on this specific input |
| Execution state | planned, applied-to-candidate, verified, failed, cancelled | A change is not "fixed" merely because a writer ran |

A fix may be both **potentially-lossy** and **needs-input**. Policy-driven changes
are tagged as policy changes; they are not made safe by belonging to a profile.
Source-required is an availability outcome, not a promise that FFJS can reconstruct
missing information. A false positive is corrected in the checker, not "fixed"
by changing a valid font.

"Apply safe fixes" means apply the **user-selected batch of currently applicable
safe fixes**. It excludes unresolved decisions, lossy operations, signatures that
would be invalidated, and unverified dependencies. Nothing is auto-applied just
because a font was inspected.

### Required information for every fix

Each registered fix and generated plan must carry:

- Stable check/fix IDs and revisions; affected face, table, glyph, record, and
  byte offset or data path where meaningful; evidence and expected values.
- A plain-language problem description, proposed change, reason for its risk
  classification, prerequisites, supported formats, and unsupported cases.
- **Decision points** with typed input, allowed values, validation, suggested
  values labeled as suggestions, and any required explicit consent.
- **If applied:** expected benefits, fields changed, possible behavior changes,
  compatibility implications, lost data, signature consequences, and limits.
- **If left unfixed:** likely impact and uncertainty. Distinguish invalidity,
  interoperability risks, optional recommendations, and foundry policy.
- Dependencies/conflicts, required companion repairs, expected invariant changes,
  output format, verification steps, and reasons a plan cannot proceed.
- Source/project revision or input fingerprint, profile/version, changes actually
  made, original and output reports, unresolved/new findings, and verification
  evidence. Include implicit export normalization in the audit.

### User-facing repair decision catalogue

These are intended behaviors, not claims that the fixes exist today. "Safe"
always requires the shared preservation contract and successful verification.

| Issue / proposed action | Risk and prerequisites | User decision | If applied | If left unfixed | Owner |
| --- | --- | --- | --- | --- | --- |
| Bad directory hints/order, alignment, table checksum, standalone checksum adjustment | Safe only with unambiguous readable table extents and no unhandled signature effect | Choose output container; approve any separate signature action | Rebuild structural fields without changing font semantics | Some consumers may reject; checksum no longer verifies emitted data | FQ-016 |
| Known fixed constants or reserved encoding fields | Safe only for a recognized supported table/version and normative requirement | None for proven constants; ambiguity blocks | Correct encoding, retaining meaning-bearing fields | Structural warning or consumer rejection can remain | FQ-017 |
| Unsorted name/cmap records or equivalent serialization | Safe only when record associations, legacy mappings, UVS, and duplicate handling are preserved | Resolve conflicting duplicates separately | Canonical storage without changing values or mappings | Interoperability/order violations remain | FQ-017 |
| Derived bounds, offsets, counts, or metric extrema | Safe only with complete authoritative geometry/metrics; no guessed hints or variation extrema | Supply/recover missing source data if incomplete | Regenerate mathematically derived values | Clipping, wrong addressing, or rejection may remain | FQ-018 |
| Missing family/style/PostScript names, trailing spaces, illegal particles, name line breaks | Assisted; renaming may change identity and application matching | Supply intended names; choose affected locales and policy | Consistent explicit names; possible family/font identity change | Missing/ambiguous names or selected policy findings remain | FQ-019 |
| Style bits, weight/width, italic angle/caret slope, fixed-pitch/PANOSE claims | Assisted unless one authoritative value and exact invariant are established | Select authoritative metadata; resolve conflicts | Consistent style selection; possibly different application behavior | Style linking or classification may remain inconsistent | FQ-019 |
| Rights/embedding flags, license metadata, foundry requirements | Assisted and potentially-lossy for clearing restrictions; authority required | Confirm licensing authority and desired publishing policy | Changes embedding permissions metadata, not the underlying license | Existing restrictions/policy disagreement remain | FQ-019 |
| OS/2 average width, Unicode ranges, code-page ranges, first/last character metadata | Safe only for an exact versioned derivation with sufficient evidence; otherwise assisted | Choose standard/version where alternatives exist; confirm inferred code-page claims | Consistent derived metadata without changing glyph coverage | Applications may misclassify coverage/metrics | FQ-020 |
| Line gaps, hhea/OS/2 metrics, USE_TYPO_METRICS, CJK metrics | Assisted; may change line layout and clipping | Choose metric authority, target environments, and spacing policy | May reduce clipping but alter wrapping/line heights | Existing clipping/layout differences persist | FQ-020 |
| Missing NBSP mapping or unequal whitespace widths | Assisted; existing glyphs/mappings must be usable | Confirm desired mapping and width; do not fabricate missing space | Changes encoding/spacing of text using those characters | Space-related behavior or profile warnings remain | FQ-020 |
| Control character or soft-hyphen mapping removal; legacy name record removal | Potentially-lossy; supported reference updates required | Explicitly select each removal policy | May satisfy a profile while removing intentional compatibility behavior/data | Mappings/localizations remain; policy findings can remain | FQ-019, FQ-020 |
| Invalid lookup references or contextual/class relationships | Usually source-required or assisted; intended target cannot be inferred | Supply intended target/source; never delete a feature by default | Supported repair may restore shaping; changes must be demonstrated | Shaping failures or parser rejection may remain | FQ-021 |
| Malformed CFF programs, missing outlines, or missing subroutines | Source-required unless complete intent is independently known | Recover source; separately consent to a supported mitigation | Recovered content or explicitly reduced functionality, not invented restoration | Affected glyphs may fail or remain unexportable | FQ-022, FQ-023, FQ-034 |
| Wrong geometric maxp values versus unknown VM resource maxima | Geometry-derived values can be safe; VM limits require proof/source | Preserve unknown program requirements; do not guess | Correct established maxima without claiming VM validity | Bad maxima can cause failures; opaque execution remains unverified | FQ-018, FQ-024 |
| Dehinting, component decomposition, overlap removal, outline conversion, glyph/table removal | Potentially-lossy; guard all dependent tables and point references | Choose losses/tolerance and acknowledge affected environments | May improve compatibility but change rasterization, topology, or features | Original behavior retained, including the diagnosed problem | FQ-025, FQ-033 |
| Axis/default/name/STAT/instance inconsistencies | Assisted; distinguish metadata from outline/metric deltas | Choose intended axes/styles/instances; preserve custom instances unless explicitly replaced | Consistent supported metadata, not recovered missing variation data | Instance selection or variation behavior may remain wrong | FQ-027 |
| Invalid color/bitmap references or dimensions | Safe for verified derived offsets/counts; missing assets require source; deletion is lossy | Supply assets or explicitly drop affected representations | Supported representations load, or explicitly reduced color/strike coverage | Some colors, glyphs, or sizes may not render | FQ-028, FQ-029 |
| Invalid MATH/BASE/JSTF/MERG references or constructions | Source-required for unknown intent; safe only for fully known structural encodings | Provide intended assembly, positioning, or justification behavior | Supported corrections; no automatic deletion of specialist behavior | Math, baseline, or justification issues remain | FQ-030 |
| Missing source masters, incompatible contours, bad interpolation | Source-required; optional lossy static instance is a separate conversion | Repair original masters or choose a supported fallback | Can rebuild from source; cannot recover lost design intent from diagnostics | Variation/interpolation defects remain | FQ-033, FQ-034 |
| Existing DSIG becomes invalid after an edit | Blocked until signature policy is resolved; removal is potentially-lossy | Preserve original, authorize removal, or arrange external re-signing | Modified output is unsigned or independently re-signed, never falsely authenticated | Signed original retained; requested edit cannot be safely published as signed | FQ-012 |
| Missing/truncated required tables or ambiguous overlapping bytes | Source-required, except independently reconstructible derived structures | Recover trusted source; select alternate representation only with explicit loss review | Recoverable metadata can be rebuilt; lost content is not guessed | Import/export may remain blocked | FQ-010, FQ-018, FQ-034 |
| Filename fails a foundry convention | Assisted host/file policy, not binary corruption | Choose output filename | File renamed; font contents need not change | Only the chosen distribution convention is unmet | FQ-003, FQ-041 |

## Definition of done for every implementation item

All work items below inherit these acceptance criteria:

- [ ] Original implementation with a linked specification/behavior rationale and
  provenance for fixtures. Confirm any upstream-derived assumption independently.
- [ ] Detection and repair coverage stated separately for imported binaries,
  editable projects, and emitted output, including outline flavor and container.
- [ ] Tests include a good input, a bad input, applicability boundaries, and a
  known unsupported or blocked case. A false-positive fix preserves valid data.
- [ ] A fixer has the complete description/decision/consequence contract above;
  test apply and decline paths, repeated application, and source immutability.
- [ ] A failed application or verification leaves the original and live project
  unchanged. No hidden fallback dropping tables, glyphs, hints, or mappings.
- [ ] Inspect emitted output and check both targeted issue resolution and
  declared preservation invariants. Test for new issues, not just fewer issues.
- [ ] Update affected public types, exported entry points, schemas where relevant,
  core docs, and capability inventory. Demo-only work must not add repair logic.
- [ ] Use focused existing test commands first; add consumer/browser coverage for
  behavior that depends on a font consumer. State what was not verified.

## Phase 0 - requirements and evidence

### FQ-001 - Establish the capability and provenance ledger

- **Priority:** P0. **Depends on:** None.
- **Outcome:** An auditable inventory, not an undocumented list of "fixable" codes.
- **Scope:** Map each current diagnostic/validation identifier to its pipeline,
  check family, formats, public reachability, evidence, and repair availability.
  Record informational codes separately. Map the comparison's capability groups
  and upstream fixer registrations to work items or an explicit exclusion.
- **Acceptance:** Inventory all baseline identifiers without treating counts as
  coverage percentages; every new check/fixer updates the inventory. Document
  original FFJS implementation requirements and specification references. Explain
  unsupported/no-fix cases rather than omitting them.
- **Surfaces:** [diagnosis](./src/validate/diagnoseFont.js),
  [validation](./src/validate/validateJSON.js), [specification index](./specs/README.md).

### FQ-002 - Define structured findings, coverage, and compatibility

- **Priority:** P0. **Depends on:** FQ-001.
- **Outcome:** Consumers can distinguish a failed check, an incomplete inspection,
  and a repair that actually occurred.
- **Scope:** Implement the shared dimensions above, stable locations and IDs,
  report/schema versioning, source scope, evidence, and machine-readable reasons.
  Correct misleading "clamped" descriptions. Preserve existing issue codes through
  aliases/deprecation or a documented versioned migration, not silent renaming.
- **Acceptance:** Reports serialize deterministically apart from explicit run
  metadata; partial/unsupported coverage cannot be presented as complete success.
  Legacy callers still receive documented fields. Values 1001/10 produce
  out-of-range findings and never an "applied clamp" without a recorded change.
- **Surfaces:** [diagnosis](./src/validate/diagnoseFont.js),
  [validation](./src/validate/validateJSON.js), [declarations](./index.d.ts),
  [diagnostic docs](./docs/diagnostics.md).

### FQ-003 - Separate validity, interoperability, and publishing profiles

- **Priority:** P0. **Depends on:** FQ-001.
- **Outcome:** Users know whether they are fixing corruption or choosing a policy.
- **Scope:** Versioned profiles for structural validity, interoperability, and
  opt-in foundry/family rules. Resolve required-table differences, including OS/2,
  by format/specification/profile. Handle filename and family-context checks
  without pretending they are binary repairs.
- **Acceptance:** Valid non-Google-Fonts designs are not rejected by a default
  foundry policy. Missing context is reported as blocked/skipped, not passed.
  Each policy result identifies its source, rationale, and consequence; selecting
  a profile never silently authorizes its fixes.
- **Surfaces:** [table dependencies](./src/validate/tables.js),
  [diagnosis](./src/validate/diagnoseFont.js), [validation docs](./docs/validation.md).

### FQ-004 - Build reproducible mutation and preservation fixtures

- **Priority:** P0. **Depends on:** None.
- **Outcome:** Every advertised detection and repair can be demonstrated.
- **Scope:** Turn the confirmed repro cases into original repository tests with
  small synthetic fixtures. Add helpers for controlled corruption, raw-byte
  assertions, and semantic before/after comparison. Retain fixture provenance.
- **Acceptance:** Reproduce all baseline defects in the evidence table; assertions
  cover the actual defect, not merely a format-info code. Include compact metrics,
  localized names, UVS, shared collection tables, and unknown payloads. Helpers
  must not reuse the production algorithm as their sole correctness oracle.
- **Surfaces:** [diagnostic tests](./test/diagnose.test.js),
  [validation tests](./test/common/validate_json.test.js),
  [existing compliance tests](./test/ots-compliance.test.js).

## Phase 1 - trustworthy inspection

### FQ-005 - Correct collection addressing and inspect every face

- **Priority:** P0. **Depends on:** FQ-002, FQ-004.
- **Scope:** Read each face's SFNT header at its declared offset while honoring
  collection-relative table addressing. Distinguish collection errors from face
  errors and support selected-face versus all-face reports.
- **Fix stance:** This repairs FFJS's checker, not a valid input font.
- **Acceptance:** Valid two-face TTF/CFF collections have no spurious SFNT/tag/
  required-table errors. Test shared tables, later corrupt faces, out-of-bounds
  face offsets, empty collections, and TTC versions. One failed face must not hide
  independently readable faces. Preserve original face indices and output scope.
- **Surfaces:** [diagnosis](./src/validate/diagnoseFont.js),
  [collection import](./src/import.js), [diagnostic tests](./test/diagnose.test.js).

### FQ-006 - Correct lookup-flag legality and related evidence

- **Priority:** P0. **Depends on:** FQ-004.
- **Scope:** Apply OpenType's actual reserved-bit mask; recognize legal
  mark-attachment-class bits and distinguish flag legality from invalid GDEF/
  mark-filter references.
- **Fix stance:** Never clear legal high bits to satisfy the old checker.
- **Acceptance:** `0x0100` and supported legal combinations pass; reserved bits
  fail. Test mark-filter-set presence/index and attachment-class relationships
  where checked. No lookup flags or shaping data change during diagnosis.
- **Surfaces:** [layout diagnostics](./src/validate/diagnoseFont.js);
  normative [Lookup Table specification](https://learn.microsoft.com/en-us/typography/opentype/spec/chapter2#lookup-table).

### FQ-007 - Close cmap ordering, overlap, and Unicode repertoire gaps

- **Priority:** P0. **Depends on:** FQ-004.
- **Scope:** Correct format-4 overlap detection and include U+180F in the versioned
  variation-selector repertoire. Audit boundary cases for supported cmap formats,
  UVS default/non-default mappings, scalar values, and glyph-ID bounds.
- **Fix stance:** Valid UVS is preserved; overlapping mappings with competing
  meanings require input/source, not arbitrary sorting or deletion.
- **Acceptance:** Test increasing ends with overlapping starts, touching versus
  disjoint ranges, terminal segments, format-4 delta/range-offset behavior, and
  all selector boundaries. Include good legacy/non-Unicode subtables and
  supplementary-plane mappings; unsupported coverage is explicit.
- **Surfaces:** [cmap diagnostics](./src/validate/diagnoseFont.js),
  [cmap codec](./src/sfnt/table_cmap.js);
  [Unicode 17 properties](https://www.unicode.org/Public/17.0.0/ucd/PropList.txt).

### FQ-008 - Complete container and checksum diagnostics

- **Priority:** P0. **Depends on:** FQ-004.
- **Scope:** Diagnose `head` table checksum with its adjustment field zeroed and
  whole-font checksum adjustment for applicable standalone SFNTs. Audit directory
  extents, duplicate tags, ordering, alignment, overlap, and WOFF wrapper fields.
  Distinguish reconstructed SFNT checks from original wrapper checks.
- **Fix stance:** Rebuild only readable, unambiguous structures; corruption and
  ambiguous overlapping bytes do not become safe through reserialization.
- **Acceptance:** Changing only checksum adjustment is detected. Independently
  sum emitted standalone SFNT words to `0xB1B0AFBA`; cover padding and non-word
  lengths. Do not apply that standalone formula to a TTC container. Test WOFF
  metadata/private extents, reserved fields, decompression failure, and WOFF2
  initialization failure without hiding either behind a pass.
- **Surfaces:** [diagnosis](./src/validate/diagnoseFont.js),
  [container export](./src/export.js), [container import](./src/import.js).

### FQ-009 - Bound diagnostic work and retain partial failure evidence

- **Priority:** P0. **Depends on:** FQ-002.
- **Scope:** Align diagnostics with import's configurable byte/table/face/glyph/
  point/program-work limits. Bound nested layout/color/composite traversal and
  decompression. Reconcile or explicitly explain differing composite depth limits.
  Translate expected parser/resource failures into located, actionable results.
- **Fix stance:** Raising a limit is a user execution choice, not a font repair.
- **Acceptance:** Tests just below/above configured limits; no unbounded recursion
  or broad catch returning success. Include failed import with useful diagnosis,
  unsupported version, unavailable decompressor, and partial collection results.
  Unexpected internal errors remain visible. Document that this is not a sandbox
  or total process-memory guarantee.
- **Surfaces:** [import limits](./src/import.js),
  [diagnosis](./src/validate/diagnoseFont.js), [API docs](./docs/api.md).

### FQ-010 - Add scoped inspection and actual-output export preflight

- **Priority:** P0. **Depends on:** FQ-002, FQ-003, FQ-005, FQ-006, FQ-007, FQ-008, FQ-009.
- **Scope:** Unify orchestration without conflating stages: inspect original
  bytes; validate a detached editable candidate; serialize the requested format;
  inspect actual output. Authored projects without original bytes start at the
  project stage. Keep all stage reports and implicit normalization evidence.
- **Fix stance:** Preflight is observational; successful export is not itself a
  repair. Missing non-derivable required content is source-required.
- **Acceptance:** Invalid `head.glyphDataFormat` and nonzero cmap version cannot
  earn a clean output result while persisting in bytes. Report when original
  corruption was normalized during import/export. Detect failures for the chosen
  target, not a different preview format. Existing `validate()` retains its
  documented observational contract.
- **Surfaces:** [public validation/export](./src/font_flux.js),
  [resolution](./src/expand.js), [export](./src/export.js),
  [validation docs](./docs/validation.md).

## Phase 2 - core repair framework

### FQ-011 - Create the core check/fix metadata registry

- **Priority:** P1. **Depends on:** FQ-002, FQ-003, FQ-010.
- **Scope:** Centralize descriptions, applicability evaluators, risk reasons,
  decision schemas, effects of applying/declining, supported formats, and
  verification requirements. Model multiple fixes per finding and one fix
  resolving multiple findings.
- **Acceptance:** Metadata validation rejects missing consequences, ambiguous
  risk labels, or an advertised safe fix without prerequisites/invariants. A
  pure listing API explains unavailable repairs. Serialized metadata is usable
  in Node and browsers without a UI dependency.
- **Surfaces:** [validation area](./src/validate),
  [public API](./src/font_flux.js), [declarations](./index.d.ts).

### FQ-012 - Define preservation, signatures, and opaque-data policy

- **Priority:** P1. **Depends on:** FQ-011.
- **Scope:** Establish invariants for glyph order/count, mappings/UVS, metrics,
  names/locales, layout, variations, color/bitmap payloads, and unknown tables.
  Evaluate DSIG and container-specific signature removal before proposing fixes.
  Distinguish byte-preserved payloads from semantically validated data.
- **Decision/consequence:** A signature-invalidating edit blocks until the user
  retains the original, consents to removal, or arranges external re-signing.
  Unknown dependencies block edits that could invalidate their references.
- **Acceptance:** No "safe" batch silently drops DSIG/AAT/vendor tables or changes
  glyph topology. Test WOFF2's existing signature behavior and report it as an
  output effect. Raw-byte preservation alone must not certify unknown semantics.
  Unchanged opaque data is reported as retained but unverified.
- **Surfaces:** [preservation guards](./src/expand.js),
  [export coordination](./src/export.js), [workflow docs](./docs/index.md).

### FQ-013 - Plan repairs with dependencies, conflicts, and stale-input checks

- **Priority:** P1. **Depends on:** FQ-011, FQ-012.
- **Scope:** Produce an immutable dry-run plan tied to input/project revision,
  report/profile revision, output format, selected faces, and selected fix IDs.
  Resolve companion repairs, conflicts, and required user inputs before applying.
- **Acceptance:** Identical inputs produce equivalent plans. Detect cyclic/
  incompatible repairs and mutually exclusive source choices. Reject stale plans
  after edits, face changes, changed decisions, or target changes. Safe selection
  excludes assisted/lossy/blocked operations; previews disclose writer-wide
  normalization rather than pretending a full rewrite touches one field.
- **Surfaces:** [public API](./src/font_flux.js),
  [validation area](./src/validate), [declarations](./index.d.ts).

### FQ-014 - Apply selected repairs transactionally

- **Priority:** P1. **Depends on:** FQ-013.
- **Scope:** Execute a plan on detached data or a narrowly scoped binary candidate
  where supported. Return candidate bytes/data and changes; never mutate caller
  input. Define atomic batch behavior, cancellation, errors, and explicit commit
  ownership for callers.
- **Acceptance:** Inject failure at every operation/serialization stage and prove
  original bytes, live project, and other collection faces remain unchanged.
  A no-op is reported honestly. Repeated application is idempotent semantically.
  Missing decompression support or incomplete parsing cannot trigger a fallback
  that silently drops data. Diagnose-only inputs get only proven byte-level
  repairs, otherwise a source-required/blocked result.
- **Surfaces:** [public API](./src/font_flux.js),
  [resolution](./src/expand.js), [export](./src/export.js).

### FQ-015 - Verify candidates and reject unapproved semantic changes

- **Priority:** P1. **Depends on:** FQ-004, FQ-010, FQ-014.
- **Scope:** Reinspect emitted bytes, compare original/target findings by stable
  identity, and compare semantic invariants under the selected plan. Retain
  original, candidate, and output reports. Verification is separate from applying.
- **Acceptance:** A targeted finding must be resolved, required checks must run,
  and no new unapproved failures or invariant changes may occur. New warnings
  that were not predicted require review; issue-count reduction alone is
  insufficient. Partial coverage is not promoted to complete verification.
  Inject an exporter that leaves the target invalid and a fixer that introduces
  an unrelated mapping change: both fail verification without committing.
- **Surfaces:** [diagnosis](./src/validate/diagnoseFont.js),
  [export](./src/export.js), [consumer verification](./scripts/verify-consumers.mjs).

## Phase 3 - useful first-release core repairs

### FQ-016 - Expose named container and checksum normalizations

- **Priority:** P1. **Depends on:** FQ-008, FQ-015.
- **Scope:** Named repairs for directory hints/order, alignment, offsets,
  per-table checksums, standalone checksum adjustment, and supported WOFF
  lengths/reserved fields. Reuse existing writer logic rather than duplicate it.
- **Decision/consequence:** Safe only for fully identified data and approved
  output effects. Preserve wrapper metadata/private data or report the unsupported
  preservation requirement; dropping it is not an implicit normalization.
- **Acceptance:** One mutation per advertised repair, combined repairs,
  idempotence, and exact before/after changed-structure reporting. Diagnose each
  supported emitted container. Ambiguous duplicate/overlapping table contents
  are blocked, not resolved by first/last-wins parsing.
- **Surfaces:** [export](./src/export.js),
  [diagnosis](./src/validate/diagnoseFont.js), [diagnostic tests](./test/diagnose.test.js).

### FQ-017 - Normalize supported constants and record encodings

- **Priority:** P1. **Depends on:** FQ-006, FQ-007, FQ-015.
- **Scope:** Audit and expose supported head constants, cmap version/record
  ordering, name ordering, and outline-appropriate maxp/post encodings.
  Separate fixed normative values from meaningful flags and ambiguous values.
- **Decision/consequence:** Do not clear legal lookup bits, delete UVS, drop names,
  or downgrade an unknown future table version to make it parse. A conflict
  needing an authoritative record leaves safe mode.
- **Acceptance:** Preserve duplicate-record semantics or reject ambiguous inputs.
  Sorting must move associated values together. Test legacy encodings, localized
  names, format-14 mappings, CFF maxp 0.5 versus TT 1.0, and unsupported versions.
  Verify real bytes, not just resolved objects.
- **Surfaces:** [shared table codecs](./src/sfnt), [CFF codecs](./src/otf),
  [export](./src/export.js),
  [resolution](./src/expand.js).

### FQ-018 - Rebuild provably derived geometry and metrics structures

- **Priority:** P1. **Depends on:** FQ-015.
- **Scope:** Expose safe recalculation of glyph/font bounds, glyf/loca/head
  coordination, geometric maxp fields, hhea/vhea metric extrema, and hmtx/vmtx
  counts from complete authoritative data. State representation-specific bounds.
- **Decision/consequence:** Never pad missing metrics with guessed values, invent
  contours, infer TrueType VM maxima from geometry, or claim default-instance
  bounds cover all variation instances.
- **Acceptance:** Test empty/simple/transformed composite glyphs, compact trailing
  metrics, both loca formats, vertical metrics, and representable-range overflow.
  Preserve point topology, instructions, mapping/order, and intended advances.
  Cyclic components, missing data, and unsupported variable bounds block the
  relevant repair.
- **Surfaces:** [resolution/builders](./src/expand.js),
  [export coordination](./src/export.js), [metrics codecs](./src/sfnt),
  [TrueType codecs](./src/ttf).

### FQ-019 - Add assisted naming, style, and rights corrections

- **Priority:** P1. **Depends on:** FQ-003, FQ-015.
- **Scope:** Missing/invalid names, PostScript names, whitespace/line-break issues,
  referenced name IDs, style linking, weight/width, italic/caret metadata,
  fixed-pitch claims, and rights/embedding metadata. Include optional foundry
  naming rules, not a universal "rebuild names" operation.
- **Decision/consequence:** Ask for authoritative values and affected locales.
  Show name/style/installation effects. "Regular", "Untitled", a filename-derived
  family, inferred weight, or cleared embedding flags are never silent defaults.
  Removing legacy names is a separate lossy choice.
- **Acceptance:** Test conflicting name records, missing locales, variable style
  metadata, trailing whitespace, reserved versus meaningful flag bits, and decline
  paths. No blanket weight/width clamp. Preserve unrelated names and rights;
  require explicit authority before relaxing embedding restrictions.
- **Surfaces:** [font metadata resolution](./src/expand.js),
  [metadata codecs](./src/sfnt), [public API](./src/font_flux.js).

### FQ-020 - Add coverage metadata and assisted spacing/metric repairs

- **Priority:** P1. **Depends on:** FQ-003, FQ-007, FQ-015.
- **Scope:** Versioned average-width and character-range derivation; code-page
  evidence; whitespace/NBSP mappings and widths; missing mandatory-glyph findings;
  vertical/line metrics, clipping evidence, and optional metric policies. Include
  control/soft-hyphen mapping policies only as explicit removal choices.
- **Decision/consequence:** Users choose metric authority and spacing intent.
  Do not equate missing character coverage with permission to invent artwork.
  UPM correction is not merely changing one number: require source or a separately
  verified complete scaling operation; otherwise block it.
- **Acceptance:** Cover compact hMetrics, shared space/NBSP glyphs, variable
  metrics, UVS/legacy subtables, supplementary characters, CJK policy exceptions,
  and zero/nonzero line gaps. A mapping edit preserves all unrelated encodings.
  Width/gap changes declare reflow effects; metric heuristics are not labeled safe.
- **Surfaces:** [resolution](./src/expand.js),
  [cmap/metrics codecs](./src/sfnt), [public API](./src/font_flux.js).

## Phase 4 - advanced core coverage

### FQ-021 - Complete supported layout graph and cross-table checks

- **Priority:** P2. **Depends on:** FQ-006, FQ-009, FQ-010, FQ-015.
- **Scope:** Recursively validate supported GSUB/GPOS contextual/chained/extension
  lookups; coverage/class/parallel-array relationships; feature/script/language/
  lookup references; GDEF classes, mark sets, attachment references, and
  Device/VariationIndex dependencies. Preserve extension and rule order.
- **Decision/consequence:** Wrong targets usually require source/intent. Permit
  only proven encoding repairs; sorting coverage without reordering associated
  outputs is forbidden. Feature/lookup deletion is separately lossy.
- **Acceptance:** Nested extension/contextual fixtures, out-of-range actions,
  conflicting class arrays, shared lookups, valid high flags, and bounded cycles.
  Compare supported shaping sequences/positions before and after a repair;
  unsupported structures are explicitly partial, not implicitly certified.
- **Surfaces:** [layout diagnostics](./src/validate/diagnoseFont.js),
  [layout codecs](./src/sfnt), [dependency guards](./src/expand.js).

### FQ-022 - Make CFF/CFF2 diagnostics context-correct

- **Priority:** P2. **Depends on:** FQ-004, FQ-009, FQ-010.
- **Scope:** Diagnose INDEX/DICT/charset/encoding structures and charstring
  execution with correct CFF1/CFF2 semantics, global/local subroutines, CID FDSelect,
  per-FD private dictionaries, widths, stack/call limits, and variation context.
  Do not assume the first font dictionary applies to every glyph.
- **Fix stance:** A malformed/missing program is source-required unless intent is
  independently established; a missing terminator is not permission to append one.
- **Acceptance:** Multiple font dictionaries using different local subroutines;
  CFF1 versus CFF2 termination/operator differences; missing FD references;
  malformed INDEX bounds; subroutine cycles; blend/vsindex cases. Cross-check
  diagnostic context against correctly imported glyph behavior without sharing
  the same bug as the only oracle.
- **Surfaces:** [CFF diagnostics](./src/validate/diagnoseFont.js),
  [CFF codec](./src/otf/table_CFF.js), [import](./src/import.js).

### FQ-023 - Add narrowly scoped CFF structural repairs

- **Priority:** P2. **Depends on:** FQ-022, FQ-015.
- **Scope:** Re-encode fully parsed INDEX offsets, known counts and related SFNT
  headers; handle genuinely known-empty CFF1 glyphs only with established intent.
  Keep CID/CFF2 context and original subroutine relationships intact.
- **Decision/consequence:** Never turn a truncated nonempty charstring into an
  empty glyph or treat de-subroutinization/recompilation as automatically lossless.
  Unsupported program changes require source or an explicitly reviewed mitigation.
- **Acceptance:** Before/after interpreted geometry, widths, FD assignments,
  private data, and variation behavior agree for supported fixes. Empty CFF1 and
  empty CFF2 cases are not conflated. Reject unrecoverable program corruption
  rather than emitting an apparently healthy replacement glyph.
- **Surfaces:** [CFF codec](./src/otf/table_CFF.js),
  [export](./src/export.js), [resolution](./src/expand.js).

### FQ-024 - Expand TrueType outline and hint-program diagnostics

- **Priority:** P2. **Depends on:** FQ-004, FQ-009, FQ-010.
- **Scope:** Complete supported glyf/loca bounds, component transform/attachment,
  point/contour, flag, and maxp relationships. Check structural instruction
  decoding/control-flow evidence across glyph programs, fpgm, prep, cvt, and gasp.
  Separate structural checking from actual TrueType VM execution.
- **Fix stance:** Correct only established geometric invariants. VM-dependent
  maxima, instructions, and rendering intent cannot be guessed.
- **Acceptance:** Malformed PUSH operands, invalid point/component references,
  cycles, valid unusual programs, and function/stack-related unknowns. Report
  unsupported dynamic behavior explicitly. External VM evidence may enrich a
  report, but absence of such evidence cannot mean "hints verified".
- **Surfaces:** [TrueType diagnostics](./src/validate/diagnoseFont.js),
  [TrueType codecs](./src/ttf), [resolution](./src/expand.js).

### FQ-025 - Add explicit lossy outline/hint/table mitigation plans

- **Priority:** P2. **Depends on:** FQ-024, FQ-015.
- **Scope:** Independently implement supported dehinting, static nested/transformed
  component decomposition, overlap-flag corrections, and opt-in glyph/table
  removal or outline conversion. Keep contour union distinct from setting a flag.
  Optional rasterizer-policy changes to gasp/prep are not an autohinter.
- **Decision/consequence:** Explain small-size rendering, topology, file size,
  platform features, and reference losses. Require explicit consent; reject
  variable/point-index/opaque dependencies the operation cannot preserve.
- **Acceptance:** Each operation is separately selectable and tested. No implicit
  AAT/vendor-table purge, no bypass of existing edit guards, and no "safe" label
  for decomposition/dehinting. Verify downstream references and independent
  shaping/rasterization evidence for affected cases; refusal leaves source intact.
- **Surfaces:** [outline conversion/edit guards](./src/expand.js),
  [public API](./src/font_flux.js), [export](./src/export.js).

### FQ-026 - Deepen variation structure and dependency diagnostics

- **Priority:** P2. **Depends on:** FQ-004, FQ-009, FQ-010.
- **Scope:** fvar axis/instance consistency, avar mapping rules, STAT/name
  relationships, gvar tuple/point/composite references, cvar and item variation
  stores, HVAR/VVAR/MVAR, CFF2 variation context, and variation references in
  layout/color tables. State supported versions explicitly.
- **Fix stance:** Missing deltas/axes cannot be reconstructed from min/default/max
  metadata. Changing axis order/ranges is not a metadata-only fix.
- **Acceptance:** Axis-order mismatches, bad region indices, tuple cardinality,
  invalid normalized coordinates, references across tables, and good multi-axis
  fonts. Include interior region boundaries, not only axis endpoints. Any sampled
  behavior checks identify their sample set and do not claim exhaustive coverage.
- **Surfaces:** [variation diagnostics](./src/validate/diagnoseFont.js),
  [shared variation codecs](./src/sfnt), [TrueType variation codecs](./src/ttf),
  [CFF2 codec](./src/otf/table_CFF2.js), [variation guards](./src/expand.js).

### FQ-027 - Add assisted variable-font metadata and instance corrections

- **Priority:** P2. **Depends on:** FQ-026, FQ-015, FQ-019.
- **Scope:** Supported axis/name/STAT/instance references and consistency between
  default axis coordinates and style metadata. Add opt-in standard-instance
  policies without overwriting custom instances by default.
- **Decision/consequence:** Ask which metadata is authoritative. Changes to axis
  topology, ranges, or source geometry are blocked until every dependency can be
  updated; recovering lost deltas remains source-required. Static instancing is
  a separate explicitly lossy fallback, not restoration of a variable font.
- **Acceptance:** Preserve custom instance names/coordinates and all unmodified
  deltas. Test axis renaming versus reordering, contradictory defaults, nonstandard
  axes, and supported/unsupported STAT cases. Verify selected instances and
  region boundaries with documented limitations.
- **Surfaces:** [public variable API](./src/font_flux.js),
  [resolution](./src/expand.js), [variation metadata codecs](./src/sfnt).

### FQ-028 - Validate color graphs and SVG representations

- **Priority:** P2. **Depends on:** FQ-009, FQ-010, FQ-015.
- **Scope:** COLR v0/v1 graph references/cycles/depth, palette indices, CPAL
  metadata, transforms/compositing/variation references, clip ranges, and SVG
  glyph/document ranges. Distinguish byte preservation from rendering support.
- **Decision/consequence:** Rebuild only fully known counts/offsets. Missing paints,
  palettes, or artwork require source; deleting color/SVG is lossy. Do not
  execute active SVG content as part of diagnosis or render untrusted documents
  without appropriate isolation.
- **Acceptance:** Valid nested paints; cycles and invalid glyph/palette references;
  shared paints; variable colors; malformed SVG ranges. Test semantic preservation
  of safe encoding changes and transparent reporting of unexamined payloads.
- **Surfaces:** [color codecs](./src/sfnt),
  [authoring guards](./src/validate/validateJSON.js), [export](./src/export.js).

### FQ-029 - Validate bitmap strikes and image payload relationships

- **Priority:** P2. **Depends on:** FQ-009, FQ-010, FQ-015.
- **Scope:** CBDT/CBLC, EBDT/EBLC/EBSC, sbix, and supported AAT bitmap equivalents:
  strike indices, glyph ranges, offsets, sizes, metrics, duplicate-glyph
  references, and supported image header/payload consistency.
- **Decision/consequence:** Derived offsets/counts can be safe if payloads are
  complete. Missing pixels cannot be invented. Dropping a strike/representation
  requires explicit loss disclosure.
- **Acceptance:** Truncated images, cyclic/invalid duplicates, inconsistent sizes,
  good mixed strikes, and unsupported codecs. Bound image/decompression work.
  Prove unchanged image payloads and metrics for structural-only repairs; report
  image decoders not run rather than certifying pixels.
- **Surfaces:** [bitmap codecs](./src/sfnt), [export](./src/export.js),
  [diagnosis](./src/validate/diagnoseFont.js).

### FQ-030 - Expand MATH, BASE, JSTF, and specialist-table validation

- **Priority:** P2. **Depends on:** FQ-009, FQ-010, FQ-015.
- **Scope:** Supported MATH constants/coverage/variants/assemblies, BASE coordinate
  and variation references, JSTF lookup dependencies, and MERG reference
  consistency. Track each table/version as a separate coverage entry.
- **Decision/consequence:** Safe changes are limited to known encodings/counts.
  Unknown mathematical constructions, baselines, or justification intent require
  source/input; stripping these tables is not a default remedy.
- **Acceptance:** Table-specific valid and malformed fixtures, cross-table/glyph
  reference failures, parallel-array mismatches, and unsupported version outcomes.
  Tests show that a safe fix retains specialist behavior where an independent
  consumer is available; otherwise evidence explicitly remains partial.
- **Surfaces:** [specialist table codecs](./src/sfnt),
  [diagnosis](./src/validate/diagnoseFont.js), [table dependencies](./src/validate/tables.js).

### FQ-031 - Add family-level and publishing QA

- **Priority:** P2. **Depends on:** FQ-003, FQ-010, FQ-019, FQ-026.
- **Scope:** Inspect multiple related inputs/faces for duplicate identities,
  style/weight linking, inconsistent naming/licensing/version metadata, compatible
  vertical metrics, axis/instance conventions, and selected foundry requirements.
  Do not assume every collection is a single typographic family.
- **Decision/consequence:** Users declare the family set and publishing profile.
  Missing family members are missing context, not proof of conformance. Proposed
  changes use the same assisted fix registry and atomic cross-font plan.
- **Acceptance:** Mixed collections, incomplete families, duplicate styles,
  variable/static families, and intentionally different names/metrics. Reports
  locate all affected inputs; failure in a cross-font batch leaves every source
  unchanged. Licensing and naming intent are never inferred as authorization.
- **Surfaces:** [public collection API](./src/font_flux.js),
  [validation area](./src/validate), [API docs](./docs/api.md).

### FQ-032 - Add language, Unicode, and glyph-quality expectations

- **Priority:** P2. **Depends on:** FQ-003, FQ-007, FQ-010.
- **Scope:** Versioned optional language repertoires, mandatory glyph expectations,
  whitespace/control behavior, combining marks, dotted-circle/mark behavior,
  unencoded/unreachable glyph evidence, and naming conventions. Separate
  reachability through shaping/components/color from cmap membership.
- **Decision/consequence:** Missing coverage is guidance/source-required unless
  an explicitly chosen mapping to an existing appropriate glyph is supported.
  Never remove an unencoded glyph merely because it lacks a Unicode assignment.
- **Acceptance:** Complex-script and mark fixtures, shaping-only glyphs, component
  helpers, UVS-only uses, intentionally limited character sets, and differing
  repertoire versions. Report selected language expectations, not universal
  completeness; mapping/removal fixes route through FQ-020/FQ-025.
- **Surfaces:** [cmap/layout diagnostics](./src/validate/diagnoseFont.js),
  [public API](./src/font_flux.js), [workflow docs](./docs/index.md).

### FQ-033 - Add outline-quality, interpolation, and source-repair workflows

- **Priority:** P3. **Depends on:** FQ-024, FQ-025, FQ-026, FQ-032, FQ-015.
- **Scope:** Original checks for degeneracy, winding/overlap evidence, tiny paths,
  contour/component compatibility, and selected interpolation problems. Support
  optional user-supplied masters/source metadata and independent engine evidence.
  Split implementation by outline representation and document each coverage slice.
- **Decision/consequence:** Contour union, rounding, direction reversal, and
  rescaling need explicit topology/hint/variation loss analysis. Offer source
  guidance for missing masters or intent, not fabricated repaired geometry.
- **Acceptance:** Good intentional overlaps, degenerate outlines, incompatible
  masters, interior variation samples, and source-unavailable cases. Distinguish
  heuristics from spec errors. A contour-union operation is opt-in and reports
  geometry tolerances and removed hints; no blanket claim of visual equivalence.
- **Surfaces:** [outline processing](./src/expand.js),
  [public API](./src/font_flux.js), [consumer verification](./scripts/verify-consumers.mjs).

### FQ-034 - Inspect standalone CFF/Type 1 and support honest recovery guidance

- **Priority:** P2. **Depends on:** FQ-009, FQ-010, FQ-022, FQ-015.
- **Scope:** Route standalone CFF and PFA/PFB to appropriate diagnostics rather than
  an SFNT signature failure. Report original-format evidence separately from
  conversion output. Handle source replacement/recovery as a distinct operation.
- **Decision/consequence:** Type 1 conversion is not Type 1 repair/re-export or
  complete hint-preserving recovery. Explain unsupported AFM/source inputs and
  missing metrics. Do not invent missing charstrings or silently fill widths.
- **Acceptance:** Valid, truncated, and malformed legacy inputs; unsupported
  constructs; user-supplied recovery sources; modern-format output reinspection.
  Format support lists import, inspect, preserve, repair, and export separately.
  A new Type 1 writer or general UFO editor is not implied by this item.
- **Surfaces:** [legacy import](./src/import.js),
  [CFF codec](./src/otf/table_CFF.js),
  [legacy format docs](./docs/importing-legacy-formats.md).

### FQ-035 - Make large-font inspection and repair responsive and bounded

- **Priority:** P2. **Depends on:** FQ-009, FQ-010, FQ-014.
- **Scope:** Progress/cancellation hooks, work scheduling appropriate to Node/
  browser callers, and efficient reuse of immutable decoded data without bypassing
  input fingerprints. Benchmark large CJK collections and repeated inspection.
- **Decision/consequence:** Lower limits can leave partial reports; raising them
  increases resource requirements and never changes the font's validity.
- **Acceptance:** Establish explicit time/memory budgets from representative
  measured baselines before optimization; record hardware/runtime/fixture size.
  Test cancellation during decode, traversal, planning, and verification; no
  cancelled/stale result may commit. Large-font tests report skipped faces/checks.
  Do not advertise a heap limit as a process-memory cap.
- **Surfaces:** [large-font verification](./scripts/verify-large-font.mjs),
  [import](./src/import.js), [public API](./src/font_flux.js).

## Phase 5 - core delivery and independent verification

### FQ-036 - Publish the core workflow with types and compatibility examples

- **Priority:** P1. **Depends on:** FQ-002, FQ-010, FQ-015, FQ-016, FQ-017, FQ-018, FQ-019, FQ-020.
- **Scope:** Public inspect/plan/apply-and-verify entry points, serializable reports,
  typed decisions/results, and documented error/resource behavior. Keep Node and
  browser packaging usable; initialize WOFF2 through its public API.
- **Acceptance:** Built-distribution consumers can inspect an invalid upload, repair
  a supported issue, decline an assisted fix, handle unsupported cases, and
  preflight an authored project. Declarations and examples match actual exports.
  Existing `open`, `validate`, `export`, and collection workflows retain intended
  behavior. No core UI dependency or required Python/Rust service is introduced.
- **Surfaces:** [public API](./src/font_flux.js), [declarations](./index.d.ts),
  [package manifest](./package.json), [API docs](./docs/api.md),
  [validation docs](./docs/validation.md), [diagnostic docs](./docs/diagnostics.md).

### FQ-037 - Verify outputs with independent consumers and optional QA tools

- **Priority:** P1. **Depends on:** FQ-004, FQ-015, FQ-036.
- **Scope:** Extend existing built-distribution, HarfBuzz, browser, and large-font
  verification. Add optional, version-pinned local/CI adapters for Fontspector,
  fontTools, OTS/FreeType, or interpolation tools when needed to establish an
  independent assertion. These are test/integration tools, not copied core code.
- **Acceptance:** Test repaired TTF/CFF OTF, TTC/OTC faces, WOFF1/2, and supported
  standalone/converted outputs. Compare glyph sequences, positions, paths, names,
  mappings, variation samples, and retained data according to the repair contract.
  Capture external failures and skipped tools distinctly. Fontspector's inspected
  normal file matcher targets TTF/OTF: extract/decompress with provenance rather
  than claim native equivalent collection/WOFF checks.
- **Limits:** Browser acceptance is not standalone OTS certification; nonblank
  pixels are not rendering equivalence. Pin tools/profiles and document known
  disagreements rather than accepting whichever validator passes.
- **Surfaces:** [consumer verification](./scripts/verify-consumers.mjs),
  [large-font verification](./scripts/verify-large-font.mjs),
  [existing compliance tests](./test/ots-compliance.test.js).

## Phase 6 - Demo consumes the core

### FQ-038 - Replace Demo-specific diagnosis/fix metadata with core reports

- **Priority:** P1. **Depends on:** FQ-036.
- **Scope:** Remove the competing `ISSUE_META` recommendation/fix factories and
  render core findings, coverage, explanations, risk, availability, and locations.
  Keep original-input, current-project, and candidate-output reports distinct.
- **Acceptance:** No Demo-only mutation is advertised as a fix. Replace "Fix All"
  with an explicitly reviewed safe selection; include assisted/lossy findings
  without selecting them. Original findings remain visible after a repair.
  "Applied to candidate", "pending verification", "verified", and "failed" are
  distinguishable; setting `_dirty` never displays "Fixed".
- **Surfaces:** [Diagnose tab](./demo/src/tabs/diagnose.js),
  [Demo state](./demo/src/main.js).

### FQ-039 - Render decisions, consequences, and explicit loss consent

- **Priority:** P1. **Depends on:** FQ-038, FQ-019, FQ-020.
- **Scope:** Forms driven by core decision schemas; show exact change previews,
  authority choices, apply/decline ramifications, affected locales/glyphs/faces,
  policy provenance, and unavailable/source-required reasons.
- **Acceptance:** Names, style, spacing, and licensing decisions have no silently
  accepted invented default. Loss consent is unselected and scoped to the current
  plan; it resets when input/target/decisions change. Bad inputs are explained
  through core validation. Newly shipped advanced fixers use the same contract,
  but unsupported advanced operations do not appear executable.
- **Surfaces:** [Diagnose tab](./demo/src/tabs/diagnose.js),
  [Demo components](./demo/src/components).

### FQ-040 - Review, commit, undo, and revert verified candidates

- **Priority:** P1. **Depends on:** FQ-038, FQ-014, FQ-015.
- **Scope:** Detached candidate review with issue differences, changed fields,
  preservation evidence, and font preview. Commit only after core verification
  and required preview checks. Support undo to the pre-repair project and revert
  to the immutable original; retain downloadable audit reports.
- **Acceptance:** Apply/preview/export failure, cancellation, navigation, and
  face switching leave the prior project/preview intact. Never commit a stale
  async result. Keep collection faces and preview caches coherent. Define bounded
  undo storage with visible limits, not silent history loss. Candidate preview
  is supporting evidence, not proof that all glyphs render identically.
- **Surfaces:** [Demo state/preview](./demo/src/main.js),
  [existing transactional subset pattern](./demo/src/tabs/subset.js),
  [Diagnose tab](./demo/src/tabs/diagnose.js).

### FQ-041 - Integrate export-quality preflight and download exact verified bytes

- **Priority:** P1. **Depends on:** FQ-038, FQ-010, FQ-036.
- **Scope:** Replace disconnected Validate/Download behavior with selected-format
  preflight, unresolved findings, deliberate policy choices, and an exact candidate
  download. Support authored JSON projects without original binary input.
- **Decision/consequence:** Blocking errors prevent a "verified repaired" download.
  If a separate best-effort/original download remains available, label it clearly;
  it must not inherit the verified result. Warnings require contextual display,
  not an arbitrary all-warning ban.
- **Acceptance:** Changing target, profile, data, or filename policy invalidates
  affected plan/preflight state. Download the same bytes whose fingerprint/report
  was verified, not a fresh unverified re-export. Show conversion/signature losses.
  Filename conventions remain host-level choices. Exported report states target,
  face scope, unresolved issues, and partial coverage.
- **Surfaces:** [save dialog](./demo/src/components/save-dialog.js),
  [Demo state](./demo/src/main.js), [Diagnose tab](./demo/src/tabs/diagnose.js).

### FQ-042 - Support diagnose-only, collection, and unsupported-format UX

- **Priority:** P1. **Depends on:** FQ-005, FQ-009, FQ-038.
- **Scope:** Inspect import-failing binaries, select/all-inspect faces, show
  collection versus face problems, expose limits/skips, and keep failures visible.
  Add legacy diagnostics when FQ-034 ships, without claiming them beforehand.
- **Acceptance:** A bad later face is discoverable without losing good faces.
  Diagnose-only mode offers only core-proven applicable repairs; no metadata
  mutation assumes a successfully imported font. JSON input is routed to project
  preflight, not "no original buffer" as the entire experience. WOFF2 availability,
  unsupported format, and parser failure have distinct messages.
- **Surfaces:** [Demo loader/state](./demo/src/main.js),
  [loading component](./demo/src/components/loading.js),
  [Diagnose tab](./demo/src/tabs/diagnose.js).

### FQ-043 - Add end-to-end repair, accessibility, and failure regressions

- **Priority:** P1. **Depends on:** FQ-039, FQ-040, FQ-041, FQ-042, FQ-037.
- **Scope:** Extend the existing Demo harness for the complete inspect/decide/
  apply/verify/review/download/undo flow. Exercise desktop/mobile and supported
  browsers, not only core tests or visual snapshots.
- **Acceptance:** Include a safe checksum repair, assisted name/spacing input,
  explicit lossy consent via an available fixer, unsupported repair, failing
  verification, authored JSON, and later-face collection issue. Inspect downloaded
  bytes/report and verify no mutation on failure. Keyboard operation, focus
  restoration, screen-reader status, and non-color-only risk states work.
  Assert that declining a fix preserves both content and outstanding findings.
- **Surfaces:** [Demo verification](./scripts/verify-demo.mjs),
  [Demo components](./demo/src/components), [Demo tabs](./demo/src/tabs).

## Phase 7 - release and ongoing capability accounting

### FQ-044 - Publish honest capability documentation and release gates

- **Priority:** P1. **Depends on:** FQ-036, FQ-043.
- **Scope:** Publish versioned check/fix tables and user examples for repairing
  imports and preflighting authored projects. Explain safe versus assisted/lossy,
  source-required outcomes, profile choices, and verification limits. Generate
  documentation from core metadata where practical, not a second manual registry.
- **Acceptance:** Every shipped fix links to its scope, decisions, consequences,
  limitations, and tests. Unsupported roadmap items remain visibly planned.
  Examples cover no-fix, partial-result, failed-verification, and recovered-source
  cases as well as success. Document old Demo "Fixed" behavior changes and code
  migrations. Each later advanced release updates the same ledger and tests.
- **Surfaces:** [README](./README.md), [documentation index](./docs/index.md),
  [diagnostics](./docs/diagnostics.md), [validation](./docs/validation.md),
  [API](./docs/api.md), [this backlog](./FONT-QUALITY-BACKLOG.md).

## Upstream capability-to-work mapping

This mapping carries the behavioral research into the backlog without importing
upstream implementation code. It covers the 33 reviewed Fontspector binary hook
registrations, including restricted/stub cases. A reference here is **not**
endorsement of the upstream fix as safe or proof of FFJS parity.

| Upstream behavior / checks reviewed | FFJS work | Important difference or limit |
| --- | --- | --- |
| OpenType `caret_slope`, `fsselection`, `mac_style`, `monospace`, `weight_class_fvar` | FQ-019, FQ-027 | Inferred style/monospace intent needs authority; preserve unrelated bits |
| OpenType `maxp_version` | FQ-017, FQ-018, FQ-024 | Upstream CFF downgrade does not recover TT VM maxima |
| OpenType `xavgcharwidth` | FQ-020 | Exact versioned formula and metric coverage are prerequisites |
| Universal `control_chars`, `soft_hyphen`, `whitespace_glyphs`, `whitespace_widths` | FQ-007, FQ-020, FQ-032 | Preserve unsupported encodings/UVS; test compact hMetrics; removal is a choice |
| Universal `dsig` | FQ-012 | Removing a signature is not re-signing or restoring authenticity |
| Universal `integer_ppem_if_hinted`, `overlaps_bit` | FQ-017, FQ-024, FQ-025 | Establish prerequisites; setting an overlap bit is not contour union |
| Universal `linegaps`, `os2_metrics_match_hhea`, `typoascender_exceeds_Agrave` | FQ-020 | Policy/authority affects line layout; one glyph is not complete clipping analysis |
| Universal `name/trailing_spaces`, `no_mac_entries` | FQ-019 | Reviewed trailing-space binary hook is unfixable; source hook differs; locale removal is lossy |
| Universal `nested_components`, `transformed_components` | FQ-024, FQ-025 | Reviewed fixers refuse gvar; FFJS must not silently destroy variable behavior |
| Universal `unwanted_aat_tables`, `unwanted_tables` | FQ-012, FQ-025 | Profile preference is not evidence that a table is unnecessary |
| Google Fonts `canonical_filename` | FQ-003, FQ-041 | Host filename policy, not a binary-content repair |
| Google Fonts `cjk_vertical_metrics`, `use_typo_metrics` | FQ-020, FQ-030 | CJK/layout policies need explicit choices and target-environment verification |
| Google Fonts `font_names`, `name/illegal_particles`, `no_oblique_bit`, `weightclass` | FQ-019, FQ-031 | Foundry conventions are opt-in and may change identity/style interpretation |
| Google Fonts `fstype` | FQ-019 | No blanket removal of embedding restrictions |
| Google Fonts `fvar_instances` | FQ-026, FQ-027 | Preserve designer instances unless replacement is explicitly chosen |
| Google Fonts `gasp` | FQ-024, FQ-025 | Not an autohinter; distinguish supported unhinted cases and existing programs |
| Source-only fixes: mandatory glyphs, glyph names, unreachable glyphs, line breaks, whitespace and metric policies | FQ-019, FQ-020, FQ-032, FQ-033, FQ-034 | Binary-only repair cannot recover missing source intent |
| fontTools table compilation, checksums, bounds/maxp/metric/range recalculation | FQ-008, FQ-016, FQ-017, FQ-018, FQ-020, FQ-023 | Recalculation depends on parsed/compiled data; raw copying is not repair |
| fontTools dehinting, subsetting, overlap removal, interpolation, legacy/UFO validation | FQ-025, FQ-033, FQ-034, FQ-037 | Loss and source requirements remain explicit; no general source editor is promised |
| Fontspector semantic/family profiles, rasterizer/interpolation integrations | FQ-003, FQ-021 through FQ-033, FQ-037 | No UI port; distinguish policy, engine-dependent checks, and coverage gaps |

Useful pinned references:

- Fontspector profile registration:
  [OpenType](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/profile-opentype/src/lib.rs),
  [universal](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/profile-universal/src/lib.rs),
  [Google Fonts](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/profile-googlefonts/src/lib.rs).
- Fontspector [fix outcomes](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/fontspector-checkapi/src/fix.rs),
  [trailing-space binary stub](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/profile-universal/src/checks/name/trailing_spaces.rs),
  [maxp fixer](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/profile-opentype/src/checks/opentype/maxp_version.rs),
  [whitespace widths](https://github.com/fonttools/fontspector/blob/6dfa585dfc04078f8bd96a5be6d6c43d8bf32a25/profile-universal/src/checks/whitespace_widths.rs).
- fontTools [SFNT compilation](https://github.com/fonttools/fonttools/blob/1ff10daa33d4e40af00a76cda7fa804af4200b30/Lib/fontTools/ttLib/sfnt.py),
  [OS/2 derivation helpers](https://github.com/fonttools/fonttools/blob/1ff10daa33d4e40af00a76cda7fa804af4200b30/Lib/fontTools/ttLib/tables/O_S_2f_2.py),
  [overlap removal](https://github.com/fonttools/fonttools/blob/1ff10daa33d4e40af00a76cda7fa804af4200b30/Lib/fontTools/ttLib/removeOverlaps.py),
  [interpolation analysis](https://github.com/fonttools/fonttools/blob/1ff10daa33d4e40af00a76cda7fa804af4200b30/Lib/fontTools/varLib/interpolatable.py).
- Normative starting points: [OpenType specification](https://learn.microsoft.com/en-us/typography/opentype/spec/),
  [local specification index](./specs/README.md),
  [WOFF 1](https://www.w3.org/TR/WOFF/),
  [WOFF 2](https://www.w3.org/TR/WOFF2/),
  and [Unicode versioned data](https://www.unicode.org/versions/).

## Release verification checklist

- [ ] Focused core regressions first, including:
  `npm test -- test/diagnose.test.js test/common/validate_json.test.js test/ots-compliance.test.js`.
  Extend selectors as individual repair tests are introduced.
- [ ] Public built-distribution/type/consumer verification with `npm run test:consumers`;
  declared supported output formats and repaired invariants are exercised.
  Isolated package installation is optional and is not a release gate.
- [ ] `npm run test:demo` covers exact downloaded candidates, consent, rollback,
  authored input, collections, and failure states in supported browsers.
- [ ] `npm run test:large` covers affected large-font paths with measured budgets.
- [ ] Build/lint and documentation build use existing scripts as applicable;
  no new toolchain is introduced solely for the backlog.
- [ ] Original-input hashes/data snapshots remain unchanged after inspection,
  planning, failed repair, declined repair, and successful candidate generation.
- [ ] Every claimed safe repair has a passing post-export check and preservation
  evidence, plus negative tests for its applicability guards.
- [ ] Profiles, Unicode/spec versions, external tool versions, sampled behaviors,
  and unsupported checks appear in the report/documentation.
- [ ] Product wording says **"passed these checks"** or **"verified this repair"**,
  never "all font errors fixed" or "guaranteed to render identically everywhere".

The success metric is not the number of automatic fixes. It is the number of
well-understood problems for which FFJS can offer a correctly classified action,
explain the trade-off, preserve the original, and demonstrate the result.
