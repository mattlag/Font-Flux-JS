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
changed bytes rejects as stale, including edits made during an asynchronous
planning/application phase. Reports and plan descriptions can be serialized
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

Verification compares findings by semantic location, not physical file offsets.
Previously executed checks must retain their coverage; disappearing checks or
new blocked/unsupported execution cannot silently pass. An explicitly removed
table or a check becoming genuinely not applicable is distinguished from lost
coverage. Partial inspection remains partial, even when the selected repair passes.

`verified` means **this selected repair was verified**. Unrelated original
findings can remain; inspect `result.after`. A failure returns no downloadable
buffer. Invalid input, inapplicable selections, bad decisions, stale/forged plans,
and execution failures throw explicit errors; callers must display them.

## Available repairs

The registry contains **57 actions** (20 conditionally safe, 27 assisted, 10
potentially lossy), with availability evaluated for each input.
Guarded SFNT, WOFF1/WOFF2 and selected TTC/OTC faces are supported. Wrapper
re-encoding preserves metadata/private payloads and version fields. Collection
repair requires `faceIndex` and appends a copy-on-write face, retaining original
shared bytes and every other face. WOFF2 collections and collection-level
signature changes remain blocked. Format conversion is a separate explicit
operation, never a hidden repair side effect.
Collection reapplication may append an equivalent face again: idempotence is
semantic, while `changed` honestly reports changed container bytes. Retain the
verified result rather than repeatedly rewriting the collection.

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
| `os2.average-width`, `os2.character-range` | Safe under stated prerequisites | Versioned nonzero-advance average and character bounds from complete Windows symbol/Unicode mappings |
| `os2.unicode-ranges` | Assisted | Explicitly choose mapped-character presence using the OpenType 1.5 / Unicode 5.1 assignments for OS/2 v4/v5; not a claim of functional range or language support |
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

### Unicode coverage metadata policy

`os2.unicode-ranges` requires `inputs: { authority: true }`. Its descriptor records
`policyVersion: 'OpenType-1.5-Unicode-5.1-mapped-characters-v1'`. The four words use
all 169 ranges assigned to bits 0-122 in the normative OS/2 table, with bit 57
covering supplementary scalars and reserved bits 123-127 cleared. Only Windows
Unicode encodings 3/1 and 3/10 contribute. Earlier OS/2 versions are refused
because their assignments can differ. The specification leaves *functional*
coverage to the designer: existing declarations are not diagnosed as incorrect
merely because they differ from this optional presence policy.

Character bounds instead include Windows symbol encoding 3/0 as well as 3/1
and 3/10, and saturate supplementary values at 65535. Unicode-platform-only
records do not expand those fields. Duplicate Windows encodings or unsupported
mapping representations block derivation; unrelated mappings and UVS bytes stay
intact.

Newly authored fonts share the complete Unicode assignment table, correcting
the former incomplete/shifted range bits. Imported range declarations are not
silently replaced by this policy. No artwork, encoding repertoire or licensing
permission is inferred.

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

**Diagnose & fix** has two tabs: **Current font** and **Original file**. The first is the
working copy; the second is a read-only reference that stays unchanged after
repairs. Current font has compact icon/count indicators for open errors, warnings,
and unfixed actionable suggestions (excluding unavailable operations). Unknown counts
show `?`, not a successful zero. Original file has no tab badge.
The main **Diagnose & fix** badge also follows the current working copy: errors
take priority, then remaining warnings, and the badge disappears when both are
clear. Repairs, undo, revert and current-font checks update it. Unchecked edits
show `?` instead of retaining a stale count; viewing Original file does not
replace the current count with original-file findings.

**Errors and warnings** expands by default in both tabs, with errors before
warnings. Top-level collapsible
sections use larger, bold, dark subtitles; nested details retain lighter styling.
Warnings use light, saturated amber-orange accents. Card titles include severity and the
specific issue message, with the bold fix subtitle directly below. Risk labels
use subtle pills. A single **Details and consequences** expander combines issue
metadata and compact, two-column fix explanations. Each issue includes its core-linked fix
details, required inputs, a red consequence warning for potentially lossy changes, and an
**Apply fix** button. That one action plans only the requested fix and required
safe companions, verifies the exact repaired bytes, checks browser compatibility,
and atomically updates the working copy. There is no separate proposed-changes
tab or mandatory plan/preview navigation. Inputs in other cards are not applied.
Unavailable fixes explain their blocker; issues without registered repairs say so.
One repair may address several issues. Additional non-safe companions must be
handled separately rather than silently authorized.
The inline workflow does not assemble arbitrary batches. If independent repairs
must be combined before the font can pass its browser check, use a grouped core
repair plan; the Demo will not install an unrenderable intermediate version.

The Demo assumes the author has authority to modify the loaded font. It omits
repeated authority questions and supplies `authority: true` for that declared
metadata input when **Apply fix** is clicked; the core API contract is unchanged.
Intended values and policy evidence still require input. Potentially lossy fixes
show their specific consequences in a red warning area instead of a consent
checkbox. Clicking **Apply fix** authorizes only that selected change and supplies
the core plan's required consent; viewing warnings, navigating to prerequisites
and changing check profiles never authorize or apply changes.
Changing embedding or license metadata does not itself grant legal rights.
Repair inputs use aligned label/value columns, with monospace numeric fields.
Details use a narrow label column and spaced rows to leave room for explanations.
Each visible repair input has a small **i** button that reveals expected units,
constraints and examples, including numeric weight/width classes, decimal Unicode
values, bit masks and existing-record indices. Help works with click, touch and
keyboard; Escape closes it. Opening help never fills a value or grants consent.
Issue and suggestion details include **Learn more** links to relevant official
specifications when available, including in Original file and unavailable cards.
Links open in a new tab. Missing or known-broken references are omitted; guidance
does not relax core validation or make every in-range record ID valid for a font.

Progress and failures appear in the same card. Failed, stale or cancelled work
never replaces the project. **Cancel pending work** stops in-progress operations;
it does not reverse an applied change. **Undo last change** restores the previous
working copy (one step). Resolved issues and applied suggestions stay in their
original positions as green **Fixed** cards; an issue still present after a change
remains open rather than being marked fixed. Result evidence, reviewed plans and
audit downloads live inside the retained cards, not in a top-level applied notice.
Only the latest exact applied bytes are retained for font download; earlier cards
keep their audit evidence without accumulating binary snapshots. Undo restores
the preceding fixed-card state. Revert, related collection transactions or
subsequent project edits reset this history when its bytes are no longer current.

Edited/authored projects use **Check current font** to inspect a test export.
Export changes are disclosed before applying a fix to those bytes. **Use checked
export** can apply that export without a further repair; checking or downloading
alone never changes the working copy.

**Suggestions** is a counted collapsible section, initially expanded, following
errors and warnings. It includes actionable changes not already shown with
those findings. Its count separates remaining suggestions from retained fixed
cards. These are optional edits, not a count of detected problems. The filter
defaults to **All suggestions**, with lightweight risk choices that preserve
entered values and never hide issue cards. Collapsing the section also preserves
entered values.
Unavailable operations appear afterward in a collapsed **Unavailable for this
font** informational section, without inputs, consent controls or Apply buttons.
Their core blocker and recovery guidance remain visible when the section is
expanded. Unavailable fixes linked to an error or warning stay with that issue,
also without unusable controls. Known prerequisites, such as signature removal
or dehinting, have a **Review prerequisite** link only when that prerequisite is
actionable. The link never approves or applies a change. Other blockers may
remain; unsupported structures can require source recovery or another editor.
Availability is reevaluated after each repair, so an operation can move into the
actionable section. Core guards remain enforced; authorizing a fix does not
override unavailable operations.
Technical check details sit below
the current font's issues and suggestions. The always-visible **Checks** row
contains **Structure**, **Compatibility**, and **Publishing** checkboxes alongside
**Check current font**. Structure is required; Publishing includes Compatibility,
and clearing Compatibility clears Publishing. These map to existing core
profiles rather than inventing unsupported check combinations. Explanations
and the description of which font bytes were checked are collapsed under
**About these checks**. Changing checks reruns inspection
and cancels pending operations, unlike the presentation-only suggestion filter.
Technical details use two-column inspection, coverage, and check tables, with
monospace identifiers such as `binary.advanced.BASE` and separate status/reason
text. **Download original** is below the original inspection content.

In v2.10.3, Diagnose and Export use the same core profiles and explicit publishing
expectations. Decisions and consent start empty. Planning, inspection,
application and preflight use workers; navigation, profile/target changes and
**Cancel pending work** invalidate pending work. Reports distinguish all four preflight stages.
Download saves exact verified bytes; audit JSON includes the reviewed plan.

The generated [repair contracts](./check-inventory.md#registered-repair-contracts) document
every shipped action's scope, input decisions, consequences, guards and regression
evidence. The Demo displays those same descriptors, including affected tables and
versioned policy provenance. Saved reviews identify target format, selected face,
profile/version and source fingerprint for the exact applied operation.

### Review evidence and exact downloads

The core's `RepairResult.findingChanges` counts resolved, introduced and remaining
error/warning **occurrences** using semantic locations. Repeated occurrences count
separately; physical table relocation alone does not produce a new finding.
The Demo uses these counts rather than comparing messages or mutable table offsets.
No-change or verified does not mean every possible defect has been checked.

Export's **Download preflight report** is available for completed failed/unsupported
results as well as successful results. It retains original/project/resolved/output
stages, normalizations, conversion effects, unresolved issues and coverage, plus
the chosen filename, target, profile and source face. Successful reports include
the SHA-256 of the exact downloadable output; unavailable bytes have a null
fingerprint. Diagnose's project-preflight audit retains this same evidence.
Changing inputs or the project invalidates both the report and binary download.
Font bytes are not embedded in report JSON.

Repair downloads use `.ttf`/`.otf` and `.ttc`/`.otc` according to actual outline
signatures, or `.woff`/`.woff2` for wrappers. Export filenames remain editable
host-level choices, not a core naming policy. **Download original** saves the
unchanged input, not a verified repair. A core-verified result that fails the browser
check can still be downloaded for investigation; its inline status and audit
disclose the failure and the working copy is not changed.

Collection browser checks use a separately preflighted selected-face
extraction, identified in the audit. Applying retains the complete repaired
collection while updating the selected editable face and shared source snapshots.
Separate unreconciled face edits block original-collection repair. Undo is bounded
to the recent pre-commit project; a collection transaction invalidates older undo
steps on its other faces. Downloading the original does not certify or repair it.

Revert restores the selected original project, not all edited family members.
When the other faces are still original, it also restores their shared source
references, making original-collection repair available again. Independent edits
on another face survive revert; they continue to block whole-collection repair
until reconciled. Undo is one step, not an unlimited editing history.
Keyboard navigation stays inside Export while it is open; Escape restores its
opener. Applying a fix focuses its retained card; undo/revert focus the Current
font tab.

### Failure, partial results and recovery

- **No applicable fix:** inspect the reason and keep the original. `source-required`
  or `blocked` is not an invitation to select a different risk category to bypass
  the guard. Correct missing/ambiguous information in an authoritative source and
  import or preflight the corrected project.
- **Partial inspection:** an import-failing binary remains in diagnose-only mode.
  Findings and skipped/unsupported checks stay visible; an unreadable later
  collection face does not erase usable earlier faces. JSON instead routes to
  project preflight, with original-byte evidence explicitly skipped.
- **Failed verification:** the core returns no downloadable repaired buffer.
  Review the failure and outstanding findings; do not treat successful application
  of an intermediate step, a preview, or a dirty flag as verification. Download
  available audit evidence and retain the original project.
- **Preview, export or download failure:** the Demo reports the error, retains the
  existing project, and does not commit the candidate. A cancelled or stale worker
  result cannot become a committed project. A WOFF2 startup failure is reported
  separately and does not prevent loading supported non-WOFF2 inputs.
- **Recovered source:** when the authoritative original source becomes available,
  rebuild it and inspect/preflight its output. For supported legacy recovery,
  explicitly authorize `FontFlux.recoverLegacy(original, replacement,
  { authorizeReplacement: true })`. Its `equivalent: null` deliberately means
  replacement was inspected, **not** that equivalence or authenticity was proved.
  See [source and legacy workflows](./quality-workflows.md).

### Migration from the old Demo fix behavior

The old Demo-only fix factories and **Fix All** path are replaced by core repair
descriptors and **Select available safe repairs** followed by explicit review.
Safe selection is not automatic application; assisted inputs and lossy consent
start empty and must be reviewed again after changes. Setting `_dirty` only means
the project has edits, never “Fixed.”

Host integrations should use `inspect` -> `planRepairs` -> `applyRepairs` (or their
worker equivalents), then check `state === 'verified'`, preservation/coverage and
any required host preview before committing. Save `result.buffer` itself rather
than reopening and exporting it again. Use `preflight` for authored projects;
ordinary `validate()`/`export()` retain their existing non-repair contracts.

`npm run test:demo -- --quality` is the focused Chromium/Firefox acceptance gate;
`npm run test:demo` additionally runs the existing metadata/subset/collection
flows. These use installed repository dependencies and browsers, without isolated
package installation.
