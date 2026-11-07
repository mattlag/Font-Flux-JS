# Inspecting, repairing, and preflighting fonts

FFJS now provides a core-owned repair workflow. It separates finding a problem,
planning a change, and verifying the emitted result. Version 2.10.2 adds guarded
container, metadata, geometry, CFF and variable-font operations, plus cancellable
worker workflows. It does not promise to reconstruct missing artwork, validate
every program, or fix every font.

## Inspect without changing the source

```js
import { FontFlux } from 'font-flux-js';

const inspection = FontFlux.inspect(originalBytes);
console.log(inspection.diagnostics, inspection.coverage);
for (const fix of inspection.repairs) {
	console.log(fix.title, fix.risk, fix.availability);
	console.log(fix.ifApplied, fix.ifUnfixed, fix.reason);
}
```

`inspect` accepts an `ArrayBuffer` or `Uint8Array`, including a sliced view, and
the [diagnostic import limits](./diagnostics.md). Versioned profiles are described
below; unsupported names or versions reject rather than silently becoming
structural. Findings retain legacy diagnostic IDs. In particular, the
`OS2_WEIGHT_CLAMPED` and `OS2_WIDTH_CLAMPED` IDs describe out-of-range values,
**not a clamp FFJS has applied**.

The report includes format, diagnostic findings, applicable repair offers, and
partial/unsupported coverage. Original standalone CFF1 and Type 1 have bounded
[legacy inspection](./quality-workflows.md#standalone-cff-and-type-1); AFM, bare
CFF2 context and unimplemented PostScript execution remain explicit limitations.
Legacy SFNT profiles have `valid: null`, `passed: false`; no missing SFNT tables
are invented. A null diagnosis means no applicable completed diagnosis, not a pass.

### Inventory, outcomes, and profiles

[`FontFlux.checkCatalog()`](./check-inventory.md) lists every diagnostic identifier,
its pipeline, source/specification evidence, public reachability, and registered
repairs or no-fix reason. Informational identifiers are separate from findings.
Identifier counts are **not coverage percentages**. A catalog entry does not
mean its check ran against the current font.

`inspection.checks` records actual execution groups: stable `id`, `revision`,
`source`, `location`, `outcome`, `coverage`, `reasonCode`, `reason`, and
`findingIds`. Outcomes are `passed`, `failed`, `skipped`, `blocked`, or
`unsupported`; coverage is `complete`, `partial`, or `not-checked` **for that
group's declared scope**. A pass never fills in a skipped dependent check.
Parsing an unknown/opaque table is not semantic validation. Layout execution,
rendering, complete CFF evaluation, and unsupported cmap formats remain explicit
gaps. Top-level inspection `complete` remains false: this is not full font
certification.

Findings retain legacy fields and add stable `id`, catalog `checkId`, runtime
`executionId`, structured `location`, `source`, `outcome`, and `evidence`.
Severity does not indicate whether a repair was executed. `valid` still means
no **error-severity** findings, not that every check passed or completed.

`FontFlux.qualityProfiles()` lists these version-1 profiles:

| Profile | Scope and decisions |
| --- | --- |
| `structural` (default) | Implemented binary diagnostics and OpenType required tables. Missing OS/2 is a profile error for OpenType flavors, but not Apple's legacy `true` flavor. No publisher/family assumptions. |
| `interoperability` | Structural checks plus Windows Unicode family/style naming recommendations and legacy sanitizer compatibility thresholds. |
| `publishing` | Interoperability plus caller-declared filename and family expectations. This is not a Google Fonts profile or a complete family QA suite. |

```js
const report = FontFlux.inspect(bytes, {
	profile: 'publishing',
	profileVersion: 1,
	context: {
		fileName: 'Example-Regular.ttf',
		expectedFileName: 'Example-Regular.ttf',
		expectedFamilyName: 'Example',
	},
});
console.log(report.profileReport);
```

Missing context yields **blocked**, not passed. The family rule checks for at
least one matching family/typographic-family record; it does not demand that all
localizations be identical or assume that collection faces form a family.
Each policy check carries provenance, rationale, and consequences. Filename
errors are external packaging policy, not corrupt bytes. Selecting a profile
never selects or consents to a repair.

**Compatibility:** low-level `diagnose()` retains legacy severity and required-table
behavior. Modern `inspect()` adds the flavor-specific OS/2 requirement. The legacy
`CMAP_NO_SUPPORTED_SUBTABLE` and 16-level `GLYF_COMPOSITE_DEPTH_EXCEEDED` findings
are interoperability advisories under `structural`, retaining `originalSeverity`;
the interoperability/publishing profiles retain their legacy severity. Actual
execution-budget failures remain errors in every profile.

## Plan, apply to a copy, and verify

```js
const selected = inspection.repairs
	.filter((fix) => fix.risk === 'safe' && fix.availability === 'available')
	.map((fix) => ({ id: fix.id }));

if (selected.length) {
	// Review the proposed operations and consequences before selecting them.
	const plan = await FontFlux.planRepairs(originalBytes, selected);
	console.log(plan.steps);
	const result = await FontFlux.applyRepairs(originalBytes, plan);
	if (result.state === 'verified') {
		// Save this exact buffer, not a separately re-exported font.
		const repairedBytes = result.buffer;
		console.log(result.changes, result.after, result.verification);
	} else {
		console.error(result.verification.failures);
	}
}
```

These APIs never mutate the original bytes. Plans are frozen, associated with
their source snapshot, and contain a SHA-256 input fingerprint. Applying to
changed bytes rejects as stale. Reports and plan descriptions can be serialized
for review. **A deserialized plan cannot execute directly**: explicitly call
`resumeRepairPlan(bytes, savedPlan, currentOptions)` to reinspect/replan and
compare the entire persisted plan. Source, registry, decisions, descriptions,
profile/context, target, face and optional project revision must match.
Companion actions are resolved deterministically; conflicts and ordering cycles
are rejected. Web Crypto is required for planning/application (a secure
browser context or a supported Node runtime).

Table changes include a checksum companion. Operations requiring reconstruction
also rebuild offsets, alignment, lengths, and directory fields; the plan
discloses that effect. Header-only WOFF repairs patch the exact original wrapper.

Verification diagnoses the actual output and requires targeted diagnostic fixes
to resolve without new unapproved warnings/errors. Optional policy/loss actions
instead verify their exact selected operation; unrelated same-code findings can
remain. It independently compares retained table
payload bytes, permitting only the approved field changes, checksum adjustment,
and requested signature removal. Added names are checked against the original
encoded names and language tags. Unchanged payloads are **not** thereby
semantically certified.

`verified` means **this selected repair was verified**. Unrelated original
findings can remain; inspect `result.after`. A failure returns no downloadable
buffer. Invalid input, inapplicable selections, bad decisions, stale/forged plans,
and execution failures throw explicit errors; callers must display them.

## Available repairs

The registry contains **56 actions**, with availability evaluated for each input.
Guarded SFNT, WOFF1/WOFF2 and selected TTC/OTC faces are supported. Wrapper
re-encoding preserves metadata/private payloads and version fields. Collection
repair requires `faceIndex` and appends a copy-on-write face, retaining original
shared bytes and every other face. WOFF2 collections and collection-level
signature changes remain blocked. Format conversion is a separate explicit
operation, never a hidden repair side effect.

| Fix ID | Risk | Decision / exact scope |
| --- | --- | --- |
| `sfnt.checksums` | Safe under stated prerequisites | Recalculate directory checksums and standalone `head.checksumAdjustment` |
| `sfnt.search-fields` | Safe under stated prerequisites | Derive the three directory search fields |
| `sfnt.directory-order` | Safe under stated prerequisites | Sort records without relocating table payloads |
| `sfnt.alignment` | Safe under stated prerequisites | Rebuild four-byte-aligned table placement; opaque dependencies or nonzero unreferenced bytes block it |
| `name.order` | Safe under stated prerequisites | Sort records without changing encoded strings or their associations |
| `cmap.order` | Safe under stated prerequisites | Sort unique platform/encoding records without changing mappings; duplicates are blocked |
| `head.magic` | Safe under stated prerequisites | Restore the normative constant in a supported version-1 head table |
| `head.glyph-data-format` | Assisted | Confirm the existing representation should declare `value: 0`; does not convert glyph data |
| `cmap.version` | Assisted | Confirm an otherwise readable cmap should declare `value: 0`; does not alter mappings |
| `name.family`, `name.style` | Assisted | Supply `value` and numeric Windows `languageID`; append one Unicode record without replacing localized records |
| `os2.weight` | Assisted | Supply an intended weight class, 1..1000; no inferred clamp |
| `os2.width` | Assisted | Supply an intended width class, 1..9; does not change glyph widths |
| `os2.typo-linegap` | Assisted | Supply 0..32767; may change line layout, leaves hhea metrics untouched |
| `dsig.remove` | Potentially lossy | Require `consent: true`; removes authentication evidence, does not re-sign |

Additional practical actions:

| Fix ID(s) | Risk | Decision / exact scope |
| --- | --- | --- |
| `container.length`, `container.reserved`, `container.sfnt-size` | Safe under stated prerequisites | Exact wrapper-header fields; decoded-size correction is WOFF1-only |
| `name.record` | Assisted | Authoritative value, name ID and Windows locale; preserve other records, encodings and language tags |
| `name.remove-record` | Potentially lossy | One unambiguous platform/encoding/name/locale record |
| `metadata.style`, `metadata.italic`, `metadata.fixed-pitch` | Assisted | Explicit style bits/classes, angle/caret or spacing declaration; no inferred design intent |
| `rights.embedding` | Assisted | Authorized embedding mask and explicit authority, not a legal permission grant |
| `metrics.line` | Assisted | Chosen line metrics, clipping extents and typographic policy; disclose reflow |
| `os2.average-width`, `os2.character-range` | Safe under stated prerequisites | Versioned nonzero-advance average and bounds from complete supported Unicode mappings |
| `os2.code-pages` | Assisted | Selected masks plus recorded repertoire/authority evidence, not inferred language completeness |
| `cmap.mapping`, `cmap.remove-mapping` | Assisted / potentially lossy | One scalar in one selected encoding; preserve other encodings and UVS bytes |
| `metrics.advance` | Assisted | Existing glyph width with coordinated extrema/average; preserve bearings and geometry |
| `post.drop-names` | Potentially lossy | Drop post glyph names, preserving the common header |

The [advanced repair guide](./repair-extensions.md) documents the remaining
24 actions: derived TT bounds/maxp/metric extrema, metric/loca encodings, narrow
CFF structure corrections, variable name/instance metadata, dehinting,
decomposition, overlap flags, isolated final-glyph/optional-table removal and
guarded TT-to-CFF conversion. Each lists prerequisite, decision, preservation and
loss boundaries; a registered action is not permission to repair arbitrary damage.

`FontFlux.repairCatalog()` returns immutable descriptors, including input
constraints, prerequisites, and apply/decline consequences. An inspection only
offers relevant diagnostic fixes and explicitly optional policy/loss actions;
a diagnostic without an offer is not automatically repairable. Resolved
diagnostic fixes disappear; optional actions are not claims of a font defect.

For example, after a missing family-name finding:

```js
const plan = await FontFlux.planRepairs(originalBytes, [{
	id: 'name.family',
	inputs: { value: 'Intended Family', languageID: 1033 },
}]);
```

No "Regular", "Untitled", filename-derived name, weight, locale, or permission is
chosen on the user's behalf. Name insertion currently supports Windows language
IDs below `0x8000`; existing language-tag records remain unchanged. No operation
regenerates missing artwork or grants rights. Boolean, enum, numeric and textual
decisions are explicit; input schemas never silently supply authority or consent.

## Responsive inspection and reviewed plans

```js
const controller = new AbortController();
const cache = FontFlux.createInspectionCache({ maxEntries: 2 });
const report = await FontFlux.inspectAsync(originalBytes, {
	cache, signal: controller.signal, maxDurationMs: 30000,
	onProgress: ({ phase, status }) => console.log(phase, status),
});
const review = await FontFlux.planRepairsAsync(originalBytes, selected, {
	projectRevision: 4,
});
// Persist the entire envelope and show review.plan before the user approves.
const repaired = await FontFlux.applyRepairsAsync(originalBytes, review, {
	projectRevision: 4, signal: controller.signal,
});
```

`repairAsync` is the explicit plan-and-apply convenience method.
`preflightAsync` performs instance preflight in a worker. Cancellation/deadline
expiry terminates the worker, never commits changes, and has no blocking fallback.
Fresh content/options fingerprints bind cache reuse; each returned report is
detached and exposes reuse provenance. Cache byte budgets and Node VM limits
are **not process-memory caps**. See [worker requirements, saved-plan integrity
and measured CJK evidence](./quality-workflows.md#responsive-node-and-browser-workers).

`inspectFamily`, atomic detached `repairFamily`, `inspectExpectations`,
`inspectSourceQuality`, `inspectLegacy` and `recoverLegacy` expose the
[explicit-context workflows](./quality-workflows.md). Family membership,
versioned repertoires, source masters and replacement authority are caller
declarations. Source replacement returns **inspected**, not a verified repair or
an equivalence claim.

### Signatures and unsupported data

Signed inputs block other repairs unless signature removal is explicitly selected
and consented to. It can be a companion in the same plan:

```js
const plan = await FontFlux.planRepairs(originalBytes, [
	{ id: 'dsig.remove', consent: true },
	{ id: 'sfnt.search-fields' },
]);
```

Only select IDs actually offered for the current input. For unknown table tags,
in-place repairs retain payloads and offsets; operations needing relocation are
blocked because opaque dependencies cannot be proven safe. Ambiguous duplicate or
overlapping extents, incomplete head tables, failed parsing/checks, and exhausted
diagnostic limits also block repair. Keeping the original is always an option.
Rebuilding also blocks if nonzero bytes outside known table extents would be
discarded; unreferenced data is not silently treated as disposable padding.

## Preflight an edited or authored project

```js
const candidate = await font.preflight({ format: 'woff2' });
if (candidate.state === 'verified') {
	// Show warnings, effects, and coverage before saving.
	console.log(candidate.output, candidate.effects);
	saveBytes(candidate.buffer);
} else {
	console.error(candidate.error, candidate.validation, candidate.output);
}
```

Initialize WOFF2 with `await FontFlux.initWoff2()` first. `preflight` validates a
detached project, serializes the selected format, and diagnoses those exact bytes.
Invalid fields that survive normal `validate()`/`export()` cannot earn a clean
preflight merely because serialization succeeded. The live font is unchanged.

`stages` retains four separate reports:

| Stage | What was checked |
| --- | --- |
| `original` | An immutable binary snapshot retained by `open`/`openAll`, using the structural profile and original face index. Unsupported originals remain explicit. |
| `project` | Observational simplified-data validation. |
| `resolved` | Detached target-specific resolution and validation; legacy normalizations affect a separate validation copy. |
| `output` | The exact chosen-format bytes, with the selected profile and caller-supplied output context. |

`create`, `fromJSON`, and JSON `open` have no original binary: that stage is
`skipped` with `no-original-bytes`, unless `originalSource: { bytes, options? }`
explicitly supplies a caller-declared baseline. This is not an authenticity
claim; an imported instance's private retained original always takes priority.
Original bytes are private, are not serialized
into project JSON, and remain independent of later caller-buffer mutations.
Collection source face indices are not reused as standalone output indices.
Retaining originals costs one binary snapshot (shared among `openAll` faces).

Stage `checked` means the inspection ran, not that every finding passed.
`normalizations` distinguishes changes made only in the detached validation copy
from original findings no longer observed by a comparable, completed output
check. The latter can result from import/export normalization **or project
edits**; it is evidence, not an automatically applied repair or proof of semantic
equivalence. A skipped target check (such as the standalone checksum for WOFF)
cannot masquerade as resolving an original defect.

Possible states are `verified`, `failed`, and `unsupported`. Only `verified`
includes downloadable bytes; warnings and partial coverage can still be present.
An implemented check that actually aborts (for example unsupported CFF execution
context) yields `unsupported`, even when its legacy finding is only a warning.
This differs from a disclosed domain for which no complete validator exists.
Missing required publishing context yields `unsupported`, without a downloadable
buffer. Publishing mismatches yield policy errors; interoperability
recommendations can remain warnings.
Existing DSIG blocks preflight rather than silently losing authentication.
Standalone legacy output does not satisfy the SFNT preflight profile. Ordinary `validate()` and
`export()` retain their existing contracts.

Preflight checks output validity within implemented coverage, **not preservation
of all source behavior**: ordinary export can normalize or convert data. Review
its effects and target-format choices. [Advanced structural diagnostics](./advanced-diagnostics.md)
do not establish full shaping/rasterizer correctness, exhaustive interpolation,
or automatic source recovery.

## Demo review and export

Diagnose and Export use the same core profiles and explicit publishing
expectations. Decisions and consent start empty. Planning, inspection,
application and preflight use workers; navigation, profile/target changes and
Cancel invalidate pending work. Reports distinguish all four preflight stages.
Download saves exact verified bytes; audit JSON includes the reviewed plan.

Collection candidate previews use a separately preflighted selected-face
extraction, explicitly labeled as such. Committing retains the complete repaired
collection while updating the selected editable face and shared source snapshots.
Separate unreconciled face edits block original-collection repair. Undo is bounded
to the recent pre-commit project; a collection transaction invalidates older undo
steps on its other faces. Original downloads remain explicitly unverified.
