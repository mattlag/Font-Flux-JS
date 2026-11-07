# Explicit quality workflows

These are original FFJS implementations. They do not copy upstream checking or
repair code. Evidence is intentionally narrower than universal font conformance.
All workflows are observational unless explicitly returning detached repair or
replacement bytes. No workflow invents artwork, metrics, licensing permission,
or a family relationship.

Import the public class with `import { FontFlux } from 'font-flux-js'`.
The methods below are static unless shown on a font instance. Internal helper
names appear only in the worker architecture explanation; they are not package
exports and applications do not supply a core adapter or worker entry URL.

Findings retain their original workflow fields and also use the shared M0
`id`, `checkId`, `executionId`, `source`, `location`, `outcome`, and `evidence`
contract. IDs are deterministic by code/location/occurrence; check IDs use the
shared catalog. Policy/source workflows identify their source as
`declared-context`, legacy inspection as `original-bytes`. Execution summaries
remain scoped/partial and never manufacture a universal pass.

## Family and publishing context

`FontFlux.inspectFamily(inputs, options)` accepts an explicit array of
`{ id, input, faceIndex? }`. An input is font bytes, a FontFlux instance or
simplified data. Collections require an explicit `faceIndex`; a collection is
never automatically a family.

```js
const options = {
  family: {
    id: 'my-family',
    profile: 'my-publishing-policy-v1',
    expectedMembers: ['regular', 'bold'],
    policy: {
      requiredFields: ['license', 'version'],
      allowDifferences: ['familyName', 'verticalMetrics'],
      members: { bold: { styleName: 'Bold', weightClass: 700 } },
    },
  },
};
```

`family.id` and `family.profile` are mandatory. The profile is a caller-declared
policy label, not a claim of passing an external foundry's policy. Missing
`expectedMembers` means family completeness is unknown. Preferred naming,
PostScript identity, style-link bits, licenses, versions, normalized vertical
metrics, and variable axes/instance coordinates are compared. Differences can be
explicitly allowed and remain visible as information. Localized naming and
language-specific shaping are not certified.

`FontFlux.repairFamily(inputs, requestsById, options)` uses the core
`planRepairs` and `applyRepairs` methods internally. Supply nonempty repair requests for each
selected standalone member; unselected members should not be included in the
repair batch. Consent and decisions still belong to the core repair registry.
All plans are prepared before any candidate is applied. Any failure,
cancellation or caller-source mutation discards **all** candidates. Success
returns `{ state: 'verified', candidates: [{ id, result }], committed: false }`;
the caller remains responsible for atomically publishing the candidates.
Collection-face repairs require explicit extraction first.

`signal` and `onProgress` are forwarded into every member's core inspection,
planning, application, and verification phases. Progress events include
`memberId` to identify the active family member. Cancellation even during the
last member's verification discards earlier detached candidates. These are
cooperative phase boundaries, not in-phase worker isolation; use the disposable
worker APIs below when synchronous decode/traversal must be interruptible.

Default limits are 128 members, 128 MiB per binary input, and 256 MiB total
binary inputs; these limit admitted input, not total process memory.

## Repertoire and glyph expectations

`FontFlux.inspectExpectations(input, options)` accepts optional, caller-authored
`repertoires: [{ id, version, language?, source?, codePoints }]`. Version is
mandatory; code points must be Unicode scalars. No repertoire is enabled by
default and no language data is downloaded or silently upgraded.

Other options:

- `requiredGlyphs`: explicitly required glyph names.
- `behavior`: `{ codePoint, advanceWidth?, empty? }` expectations for selected
  whitespace, controls or marks. Zero-width marks are not universally assumed.
- `roots`: additional glyph names/indices that the caller declares reachable.
- `glyphNames: { id, version, maxLength?, asciiOnly? }`: optional versioned name
  length/printable-ASCII expectations; no automatic renaming or inferred Unicode
  meaning. A space is not printable-name ASCII under this selected policy.
- `maxWork` (default 1,000,000) and `maxGlyphs` (default 65,535).

`empty: false` explicitly requires known outline/component/color content; an empty known
outline produces `EXPECTATION_EMPTY_GLYPH`. `empty: true` conflicts with known
outline/component/color content through `EXPECTATION_VISIBLE_WHITESPACE`.
If raw charstring, bitmap, or SVG content prevents establishing emptiness,
`EXPECTATION_BEHAVIOR_UNSUPPORTED` reports that limitation instead of assuming
the glyph is empty. Absence of a requested policy never invents one.
Each explicit root, required glyph, and behavior request consumes `maxWork`,
including repeated requests, as do the existing graph/repertoire operations.

Per-glyph evidence separates cmap membership from potential uses via simplified
GSUB substitutions, composite components, COLR layers/paint glyph references,
and nondefault UVS mappings. Contextual/opaque rules can leave reachability
incomplete. Ligature/context edges deliberately overapproximate possible use;
this is not an executable shaping proof. Unencoded/unreachable glyphs are
**never** automatic removal candidates. Mark positioning and dotted-circle
shaping need an independent engine.

## Original source and master evidence

`FontFlux.inspectSourceQuality(projects, options)` takes
`[{ id, input, source?: callerMetadata }]`. Unique glyph names establish
correspondence across masters, not array order. It checks finite coordinates,
collapsed contours, coincident line vertices, straight-edge signed area,
control-bound overlap evidence, contour/command topology, component identities,
and units-per-em compatibility. Winding/overlap/tiny-area evidence is heuristic,
not a specification error or a recommendation to remove intentional overlaps.
Component compatibility distinguishes XY-offset attachment from point attachment
for both parsed flag objects and numeric flag masks; the two are not silently
treated as interchangeable master topology.

`tinyArea` is a nonnegative tolerance in font units squared (default 1).
Curved-contour winding/area is not evaluated. `samples: [{ id?, weights }]`
requests explicit linear interpolation at weights summing to one. Only
topologically compatible, non-composite contours with equal unitsPerEm are
sampled. This can expose an interior collapsed sample, but is not a gvar/CFF2
interpreter or proof of correct point correspondence.

`engineEvidence: [{ engine, version, outcome: 'pass'|'fail'|'unknown', ... }]`
retains caller-supplied evidence with explicit provenance; it never claims FFJS
independently ran that engine. Missing original source is reported. No contour
union, rounding, direction reversal or rescaling operation is offered: original
source tools must disclose tolerances, removed hints and variation consequences.
Default `maxMasters` is 32 and `maxWork` is 1,000,000.

## Standalone CFF and Type 1

`FontFlux.inspectLegacy(bytes, options)` diagnoses the **original format**, not a
synthetic SFNT produced by import:

| Format | Import | Inspection | Preserve original bytes | In-format repair | In-format export |
|---|---|---|---|---|---|
| CFF 1.0 | Existing importer | Bounded INDEX/DICT/storage checks and existing original-charstring validation | Yes, input unchanged | No | Existing writer |
| PFA/PFB Type 1 | Existing importer | Strict framing/hex, encrypted program extents/counts, selected operand/width/termination/subroutine checks | Yes, input unchanged | No | No |
| AFM | Not an artwork source | Explicit unsupported guidance | Input unchanged | No | No |
| Bare CFF2 | Requires OpenType context | Explicit unsupported context | Input unchanged | No | No |

Type 1 `seac`, flex/other-subroutine and general PostScript execution remain
unsupported evidence, not silently successful conversion. Missing `.notdef`,
programs or executed widths are not filled. Unsupported/missing context has
`diagnostics.valid: null` if no supported original check ran. `valid: true`
only means no errors were found by the executed slices; `complete` remains false.
Resource-limit outcomes do not by themselves declare the font invalid.
The selected structural/interoperability/publishing profile is retained, but
its SFNT-table expectations are explicitly `unsupported` for standalone legacy
input (`profileReport.valid: null`, `passed: false`). No missing SFNT tables are
invented as errors for a valid Type 1/CFF input.
For raw CFF, `maxTotalCharStringOperations` defaults to 10,000,000 and is
conservatively divided evenly among the glyph programs, further constrained by
`maxCharStringOperations`. Unevenly complex glyphs can therefore exhaust a
per-glyph allocation before the aggregate allowance; this is reported, not
silently treated as conformance.

`FontFlux.recoverLegacy(original, replacementBytes, { authorizeReplacement: true })`
inspects the actual supplied modern replacement through `FontFlux.inspect` and
returns a detached copy only for a valid inspected SFNT/WOFF/WOFF2 replacement.
It is a **source replacement**, not a Type 1 repair or equivalence guarantee.
No conversion is performed implicitly. Recover AFM metrics and missing artwork
in original source tools with explicit author decisions, then inspect the
resulting modern bytes.

## Responsive Node and browser workers

The public worker APIs and their internal implementation helpers are:

| Public API | Internal helper | Result |
|---|---|---|
| `FontFlux.inspectAsync(input, options)` | `inspectInWorker` | Inspection, optionally with explicit cache provenance |
| `FontFlux.repairAsync(input, requests, options)` | `repairInWorker` | Plan-and-apply in one worker; for an explicit new repair decision |
| `FontFlux.planRepairsAsync(input, requests, options)` | `planInWorker` | Serializable review envelope containing `plan`, `planFingerprint`, `inputFingerprint`, `entryURL` |
| `FontFlux.applyRepairsAsync(input, serializedPlanOrReview, options)` | `applyPlanInWorker` | Resume and apply the exact reviewed plan, never substitute new requests |
| `font.preflightAsync(options)` | `preflightInWorker` | Detached project export/preflight, preserving supplied original-stage evidence |

The internal low-level dispatcher is
`runQualityWorker('inspect'|'repair'|'plan'|'apply'|'preflight', input, options)`.

The public wrapper injects a **trusted module URL**, not a font-provided URL.
`entryURL: import.meta.url` identifies the engine for reviewed plans and cache
keys. Node and direct-module browser workers also import that URL, which must
export `FontFlux` (or a default class) with `inspect`, `planRepairs`,
`resumeRepairPlan`, `applyRepairs`, instance `preflight`, and WOFF2 `initWoff2`.

When a consumer bundles the library into an application, that URL may identify
the application entry instead: it can have DOM side effects and need not export
`FontFlux`. The low-level **`browserWorkerFactory: () => Worker`** option lets a
trusted wrapper synchronously create a fresh dedicated module worker instead.
The dispatcher owns its lifecycle and terminates it on every terminal path.
The factory is used only in browsers, never cloned into payloads, and excluded
from cache identity. `entryURL` remains the review/cache identity. Caller-supplied
factories must be overridden by the public wrapper, not trusted as font data.

`src/validate/quality-worker-entry.js` statically imports `FontFlux` directly from
`font_flux.js`; it never imports the app entry or `main.js`.
`workflow-worker-runtime.js` provides the **same handler** used by the dedicated
browser entry and inline Node/direct-module workers. The bundler-recognizable
`new Worker(new URL('./validate/quality-worker-entry.js', import.meta.url), { type: 'module' })`
expression belongs only in `src/main.js`, registered through the internal
configuration hook in `font_flux.js`. Keeping that constructor out of the
worker's dependency graph avoids circular worker bundling.

`test/quality-worker-browser-build.test.js` builds consumers with Vite's default
worker settings against both the public source entry and the actual
`dist/font-flux-js.js`, then serves only production assets to Chromium and
Firefox. The consumer exports no `FontFlux` and performs
DOM side effects. Coverage includes SFNT/WOFF2 inspection, immutable cache reuse,
serialized reviewed apply, plan-and-repair, original-baseline preflight,
cancellation, termination counting, ignored caller factories/URLs, and explicit
worker CSP refusal. Its successful path forbids Blob workers using
`worker-src 'self'`; output and server/browser resources are cleaned up.
The library build uses relative asset URLs so downstream bundlers can discover
the shipped worker. Deploy `dist/assets/` alongside the library when serving it
without rebundling; it is included in the npm package.
Bundle into the application or serve the worker from the application's origin.
A cross-origin CDN import does not bypass the browser's worker-origin policy.

```js
const controller = new AbortController();
const report = await FontFlux.inspectAsync(bytes, {
  signal: controller.signal,
  onProgress(event) { console.log(event.stage, event.status); },
  maxInputBytes: 64 * 1024 * 1024,
  maxDurationMs: 30000,
});
```

Snapshots preserve the caller's bytes and typed-array extent; caller buffers are
never transferred/detached. Original bytes are compared again before result
delivery; caller mutations reject with `QUALITY_WORKER_STALE_INPUT`.
Abort terminates the worker and rejects with
`AbortError`. Deadline expiry terminates it with `QUALITY_WORKER_DEADLINE`;
neither returns candidates. AbortSignal/progress callbacks and the trusted
browser factory are stripped before cloning. All other options/requests must
be structured-cloneable.

Progress includes ordered `loading`, optional `codec-initialization`,
`decode-and-traversal` (inspection), `planning`, and
`application-and-verification` stages, with `started`/`completed` status.
The real core's `inspection`, `planning`, `application`, and `verification`
phase callbacks are forwarded with `origin: 'core'`; worker boundaries use
`origin: 'worker'`. They are honest **coarse** boundaries, not per-glyph
percentages. Public wrappers also alias `stage` as `phase`.
Planning/resumption and application remain in the same worker, preserving
source-bound private plan state.

Node uses `worker_threads`; browsers use a trusted factory when registered, or
Blob module workers for direct-module usage otherwise. Missing worker support,
factory failures, blocked imports or CSP failures are explicit errors: there is
no blocking-main-thread fallback. Dedicated bundled workers can use
`worker-src 'self'` without permitting `blob:`; the direct-module Blob path needs
blob workers and imports from the trusted entry origin. For WOFF2, Vite's library
build embeds Brotli WASM as a data URL: its worker CSP must allow
`connect-src 'self' data:` and WASM compilation (for example
`script-src 'self' 'wasm-unsafe-eval'`). This does not require Blob workers or
general JavaScript `unsafe-eval`. Missing permissions fail explicitly; SFNT-only
inspection does not initialize the WOFF2 codec.
Optional Node `workerResourceLimits` accepts
`maxOldGenerationSizeMb`, `maxYoungGenerationSizeMb`, `codeRangeSizeMb`, and
`stackSizeMb`. These are **VM limits, not process-memory/RSS caps**.

Cache misses and non-inspection operations start fresh disposable workers.
Cancellation never commits a result.
Applications must additionally reject changed user selections before committing
a candidate: byte equality cannot identify application-level selection changes.

### Bounded explicit inspection reuse

`FontFlux.createInspectionCache({ maxEntries, maxBytes, ttlMs })` returns a handle for
`FontFlux.inspectAsync(bytes, { cache, ...options })`. Defaults are four
entries, 16 MiB of accounted serialized report/key payload, and a 60-second TTL.
LRU eviction, TTL expiry and `cache.clear()` remove entries.
`cache.stats` is a detached, frozen statistics object. Clearing a cache also
prevents already-running misses from repopulating it.

Each lookup computes a **fresh SHA-256 of exact input content**, a canonical
options fingerprint (including limits), and a key including the trusted entry
URL. Cache hits do not use input object identity. Cache options must be finite
JSON data; unsupported identity types are explicitly rejected. AbortSignal and
progress handlers and the trusted browser factory are not identity data.

Stored reports and each returned report are detached clones; caller edits
cannot corrupt reuse. `report.cache` discloses `status`, input/options
fingerprints, key, entry URL, creation/age, and `workerStarted`. Oversized reports
remain usable but are explicitly not retained. Cancelled, errored or stale work
is never cached. Partial reports remain partial. Cache hits can work without
starting another worker; this is explicit reuse, not a blocking fallback.

This reuses immutable **inspection evidence**, not mutable decoded font objects.
`maxBytes` accounts serialized payload, **not JS heap or process/RSS**. Clear
caches when changing engine code behind an unchanged entry URL, or use a
versioned entry URL; TTL is not a substitute for application revision policy.

### Persisting and applying reviewed decisions

Persist the complete JSON review envelope returned by `FontFlux.planRepairsAsync`,
show its exact `plan` to the user, and pass that saved envelope to
`FontFlux.applyRepairsAsync`.
For an existing core plan, persist `await FontFlux.fingerprintRepairPlan(plan)` alongside
the plan and provide it as `options.reviewedPlanFingerprint`. Raw plans without
a persisted digest are rejected. The default `maxPlanBytes` is one MiB.

Application freshly verifies source and plan content, calls the public
`resumeRepairPlan`, then applies the resumed plan with target/profile/face/
project-revision controls. Modified decisions, descriptions, source bytes,
entry URL, context, or caller mutations during execution reject without
candidate bytes. A new request list is not accepted by the apply helper.
`result.review` records the source/plan fingerprints and `resume-and-apply`
provenance. Digests provide integrity binding, not licensing authority, user
consent authentication or cryptographic signatures.

### Project preflight and original evidence

`font.preflightAsync({ originalSource?, ...options })`
snapshots the instance's project and optional `{ bytes, options }` original-source
baseline. Inside the worker it constructs `new FontFlux(projectData)` and calls
`instance.preflight({ ...options, originalSource })`; it does **not** reimport
the baseline as the editable project. Thus damaged original bytes can be
inspected independently while a valid edited project is exported.

The public instance wrapper prioritizes its privately retained imported
original over an optional caller baseline. Authored/restored projects may
explicitly declare a baseline; this is not authenticated source provenance.
The worker records `supplied-baseline-not-authenticated` or `no-original-source`
and both project/original fingerprints in `result.worker`.

BigInt, dates and binary-view project fields are snapshot-safe. Cycles,
callbacks and shared-memory project buffers are rejected. `maxProjectBytes`
defaults to 64 MiB of accounted canonical project representation, not an actual
memory cap. Snapshots/fingerprints require bounded admission/copy work on the
caller; export, diagnostics and conversion run in the worker.
Project, baseline bytes, and baseline-option mutations reject with
`QUALITY_WORKER_STALE_PROJECT` or `QUALITY_WORKER_STALE_SOURCE`. Cancellation
terminates even synchronous in-phase work and never returns candidate bytes.

### Public report adaptation

`FontFlux.inspectLegacy` returns a discriminated legacy inspection report (`scope: 'legacy'`,
`format: 'cff'|'pfa'|'pfb'|'afm'|'unknown'`). Its diagnostic shape now includes
`errors`, `warnings`, `infos`, `issues`, `summary`, `checks`, `faces: []`,
`source`, and `complete`; **`valid` is `boolean | null`**. Keep `null` for
unsupported/no-evidence outcomes rather than coercing it to success or invalid
font. A true diagnostic result still does not imply a supported/passed profile
or exhaustive conformance.
`FontFlux.inspect` also routes legacy bytes to this engine, adapting the outer
report to `scope: 'binary'` and retaining the specific format in `legacyFormat`.
An unsupported profile still has `profileReport.valid: null`; this adaptation
never invents SFNT errors or a passing profile for legacy input.
When no supported original diagnostic ran, the adapted binary report has
`diagnostics: null` rather than a fabricated valid diagnostic result.

## Verification

```text
npx vitest run test\quality-workflows.test.js test\quality-legacy.test.js test\quality-worker.test.js test\quality-worker-reuse.test.js test\quality-worker-preflight.test.js
node scripts\verify-quality-workers.mjs --browser
node scripts\verify-quality-workers.mjs --record
```

The browser probe uses existing Vite/Playwright dependencies, verifies Chromium
and Firefox workers, responsiveness, deterministic cancellation gates for
decode/traversal/planning/verification/preflight, actual core phase cancellation,
detached cache reuse, serialized review application, project preflight, and CSP refusal. All browser/server
processes are closed. Cancellation gates are test instrumentation inside an
actual busy worker, not a sleep that races font completion.

The baseline probe reports runtime/hardware, a 26,411,360-byte Noto CJK collection,
all five individually selected faces, covered/skipped faces, input/deadline/VM
budgets, sampled process RSS, main-thread heartbeats, lower-limit skipped
checks, immediate content-keyed reuse, and active-worker cancellation per face.
Defaults admit 64 MiB inputs, use a 60-second deadline and 1,024 MiB Node
old-generation allowance. RSS is sampled every 20 ms and may miss peaks; it
includes the parent and worker. Faces execute sequentially, not simultaneously.
`--record` persists the exact JSONL evidence in
[`quality-worker-baseline.jsonl`](./quality-worker-baseline.jsonl).
No whole-process memory guarantee is inferred from this baseline.

### Initial pre-reuse baseline (2026-11-06)

Windows 10.0.26300, Node v27.0.0-alpha.0.0.0, AMD Ryzen AI 7 PRO 350,
16 logical CPUs, 56,982 MiB physical RAM; shared development machine, not an
isolated performance lab:

| Selected face 0 run | Time | Sampled process RSS | Coverage |
|---|---:|---:|---|
| `maxGlyphs: 1000` | 228–744 ms | 234–246 MiB | Glyph limit reported; 27 checks blocked, 27 skipped |
| Full configured baseline | 3.2–5.1 s | 922–943 MiB | 27 skipped, 1 unsupported; `complete: false` |
| Repeated fresh worker | 4.2–5.5 s | 967–988 MiB | Same declared coverage; no cache-speedup claim |

These observed runs motivate the generous 60-second verification deadline and
1,024 MiB VM old-generation allowance; neither is a process-memory cap or an
expected performance guarantee. Main-thread heartbeat timers continued during
each worker inspection. The core's lower-limit diagnostic currently returns
`valid: false` alongside `DIAGNOSTIC_LIMIT_EXCEEDED`; this is an **incomplete
inspection**, not evidence that the underlying font became malformed. The
worker intentionally preserves that core result rather than hiding its limits.

### Complete sequential CJK face matrix (2026-11-06, 16:15 PST)

The recorded follow-up covers **faces 0–4; no faces skipped**. Every face also
completed immediate fresh-content-keyed reuse and an independently started
worker cancellation after its decode/traversal stage began. All cancellations
returned `AbortError`, no candidate, and the complete original collection's
SHA-256 remained unchanged. Node/browser tests additionally cover deterministic
in-phase gates and the actual core's four repair phase callbacks.

| Face | Uncached inspection | Content-keyed reuse | Uncached sampled RSS | Cancellation |
|---|---:|---:|---:|---:|
| 0 | 7,196 ms | 65 ms | 1,000 MiB | 398 ms |
| 1 | 8,438 ms | 120 ms | 1,011 MiB | 419 ms |
| 2 | 6,287 ms | 44 ms | 938 MiB | 216 ms |
| 3 | 3,990 ms | 53 ms | 1,010 MiB | 220 ms |
| 4 | 4,116 ms | 46 ms | 1,105 MiB | 234 ms |

This shared-machine run overlapped other verification; timings are observations,
not isolated performance guarantees. Each face retained `complete: false`,
31 skipped checks and two unsupported checks. The two-entry, 4 MiB cache ended
with five hits/five misses, three evictions and 305,289 accounted payload bytes.
Fresh fingerprints and exact source comparisons ran on cache hits. Native-byte
copying/hashing and an indexed comparison avoid the earlier per-byte callback
overhead; there is still bounded caller-side admission work.

The observed 1,105 MiB RSS despite a 1,024 MiB VM old-generation setting
demonstrates why that setting **must not be described as a process-memory cap**.

### M3 refreshed sequential CJK matrix (2026-11-07, 09:11 UTC)

The current [recorded evidence](./quality-worker-baseline.jsonl) uses the same
hardware/runtime, fixture, and budgets. No other FFJS verification harness ran
concurrently with this measurement; the machine itself remains shared.
All five faces were inspected, reused, and actively cancelled independently;
no faces were skipped, no cancellation returned a candidate, and the original
collection fingerprint remained unchanged.

| Face | Uncached inspection | Content-keyed reuse | Uncached sampled RSS | Cancellation |
|---|---:|---:|---:|---:|
| 0 | 3,684 ms | 41 ms | 1,082 MiB | 203 ms |
| 1 | 3,609 ms | 64 ms | 1,180 MiB | 211 ms |
| 2 | 3,549 ms | 41 ms | 1,064 MiB | 216 ms |
| 3 | 3,627 ms | 42 ms | 1,136 MiB | 196 ms |
| 4 | 3,696 ms | 41 ms | 1,062 MiB | 193 ms |

Every full inspection retained `complete: false`, 32 skipped checks and two
unsupported checks. The two-entry cache recorded five hits/five misses, three
evictions, and 310,027 accounted payload bytes. Fresh inspections recorded
110-114 main-thread heartbeats; content-keyed reuse still fingerprints the
source and returns detached reports. The lower-glyph-budget probe explicitly
reported the 65,535-glyph face exceeding `maxGlyphs: 1000`, rather than treating
unexecuted checks as passed. The observed 1,180 MiB sampled RSS again exceeds
the 1,024 MiB old-generation allowance: neither that allowance nor the cache
budget is a whole-process memory cap or a performance guarantee.
