# Inspecting, repairing, and preflighting fonts

FFJS now provides a core-owned repair workflow. It separates finding a problem,
planning a change, and verifying the emitted result. The first implementation is
deliberately narrow: it does not promise to reconstruct missing artwork, validate
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
the [diagnostic import limits](./diagnostics.md). Its only implemented profile is
`structural`; unsupported profile names are rejected rather than silently treated
as structural. Findings retain legacy diagnostic IDs. In particular, the
`OS2_WEIGHT_CLAMPED` and `OS2_WIDTH_CLAMPED` IDs describe out-of-range values,
**not a clamp FFJS has applied**.

The report includes format, diagnostic findings, applicable repair offers, and
partial/unsupported coverage. Original standalone CFF/Type 1 diagnosis is marked
unsupported instead of misrepresenting those inputs as malformed SFNTs.

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
for review, but **a deserialized plan cannot execute**: create a fresh plan in
the current process. Web Crypto is required for planning/application (a secure
browser context or a supported Node runtime).

Every change includes a checksum companion. Name insertion and signature removal
also rebuild offsets, alignment, lengths, and directory fields; the change log
discloses that reconstruction. Other repairs patch existing bytes in place.

Verification diagnoses the actual output and requires all targeted findings to
disappear without new warnings/errors. It independently compares retained table
payload bytes, permitting only the approved field changes, checksum adjustment,
and requested signature removal. Added names are checked against the original
encoded names and language tags. Unchanged payloads are **not** thereby
semantically certified.

`verified` means **this selected repair was verified**. Unrelated original
findings can remain; inspect `result.after`. A failure returns no downloadable
buffer. Invalid input, inapplicable selections, bad decisions, stale/forged plans,
and execution failures throw explicit errors; callers must display them.

## Available repairs

All current repairs target **standalone SFNT TTF/OTF**. WOFF1/2 and collections can
be inspected, but repair-in-container is not yet implemented. Do not silently
convert or extract a font and describe that as a lossless original-format repair.

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

`FontFlux.repairCatalog()` returns immutable descriptors, including input
constraints, prerequisites, and apply/decline consequences. An inspection only
offers relevant fixes; a diagnostic without an offer is not automatically
repairable. Fixed fonts do not continue advertising a resolved fix.

For example, after a missing family-name finding:

```js
const plan = await FontFlux.planRepairs(originalBytes, [{
	id: 'name.family',
	inputs: { value: 'Intended Family', languageID: 1033 },
}]);
```

No "Regular", "Untitled", filename-derived name, weight, locale, or permission is
chosen on the user's behalf. Name insertion currently supports Windows language
IDs below `0x8000`; existing language-tag records remain unchanged. Other name
replacements, style linking, licensing edits, broad metric policies, and
regenerating missing glyphs are not implemented.

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

Possible states are `verified`, `failed`, and `unsupported`. Only `verified`
includes downloadable bytes; warnings and partial coverage can still be present.
Existing DSIG blocks preflight rather than silently losing authentication.
Standalone CFF output diagnosis remains unsupported. Ordinary `validate()` and
`export()` retain their existing contracts.

Preflight checks output validity within implemented coverage, **not preservation
of all source behavior**: ordinary export can normalize or convert data. Review
its effects and target-format choices. Full shaping/rasterizer validation, advanced
repair, exhaustive variation coverage, and automatic source recovery remain
future work.
