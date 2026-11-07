import {
	FontFlux,
	diagnoseFont,
	fontFromJSON,
	fontToJSON,
	initWoff2,
	type FontData,
} from 'font-flux-js';

await initWoff2();
const font = FontFlux.create({ family: 'Type Consumer', unitsPerEm: 1000 });
font.addGlyph({
	name: 'A',
	unicode: 65,
	path: 'M0 0 L100 500 L200 0 Z',
	format: 'truetype',
});
font.addKerning({ left: 'A', right: 'A', value: -20 });
font.addSubstitution({
	type: 'single',
	feature: 'salt',
	substitution: { from: 'A', to: 'A' },
});
font.addAxis({ tag: 'wght', min: 100, default: 400, max: 900 });
font.addInstance({ name: 'Bold', coordinates: { wght: 700 } });
font.addPalette(['#ff0000']);
font.addColorGlyph({ name: 'A', layers: [{ glyph: 'A', paletteIndex: 0 }] });
const data: FontData = font.data;
const restored = FontFlux.fromJSON(fontToJSON(data));
const bytes: ArrayBuffer = restored.export({ format: 'woff2' });
const valid: boolean = diagnoseFont(bytes).valid;
const count: number = FontFlux.open(bytes).glyphCount;
const selected: FontFlux = FontFlux.open(bytes, {
	faceIndex: 0,
	maxUncompressedBytes: 1024 * 1024,
});
const preflight = await font.preflight({ format: 'sfnt' });
if (preflight.buffer) {
	const inspection = FontFlux.inspect(preflight.buffer);
	const safe = inspection.repairs
		.filter((fix) => fix.risk === 'safe' && fix.availability === 'available')
		.map((fix) => ({ id: fix.id }));
	if (safe.length) {
		const plan = await FontFlux.planRepairs(preflight.buffer, safe);
		const repair = await FontFlux.applyRepairs(preflight.buffer, plan);
		const candidate: ArrayBuffer | null = repair.buffer;
		void candidate;
	}
}
FontFlux.diagnose(bytes, { faceIndex: 0, maxFonts: 4, maxStructureDepth: 64, maxStructureNodes: 10000 });
const catalog = FontFlux.checkCatalog();
const references: readonly string[] = catalog.BAD_CHECKSUM.references;
const profiles = FontFlux.qualityProfiles();
const publishing = FontFlux.inspect(bytes, { profile: 'publishing', profileVersion: 1, context: {
	fileName: 'TypeConsumer.woff2', expectedFileName: 'TypeConsumer.woff2',
	expectedFamilyName: 'Type Consumer',
} });
const complete: boolean = publishing.profileReport.complete;
for (const stage of preflight.stages) {
	if (stage.id === 'original' || stage.id === 'output') {
		const report = stage.report?.diagnostics;
		void report;
	}
}
void [references, profiles, complete];
const cache = FontFlux.createInspectionCache({ maxEntries: 2, maxBytes: 1024 * 1024 });
await FontFlux.inspectAsync(bytes, { cache, maxDurationMs: 30000, onProgress: (event) => {
	const phase: string = event.phase;
	void phase;
} });
const review = await FontFlux.planRepairsAsync(bytes, [{ id: 'sfnt.checksums' }]);
const reviewed = await FontFlux.applyRepairsAsync(bytes, review);
const digest: string = await FontFlux.fingerprintRepairPlan(review.plan);
await FontFlux.applyRepairsAsync(bytes, review.plan, { reviewedPlanFingerprint: digest });
await font.preflightAsync({ format: 'woff2', originalSource: { bytes }, maxProjectBytes: 1024 * 1024 });
FontFlux.inspectFamily([{ id: 'regular', input: font }], {
	family: { id: 'declared', profile: 'my-policy-v1', expectedMembers: ['regular'] },
});
FontFlux.inspectExpectations(font, { repertoires: [{ id: 'demo', version: '1', codePoints: [65] }] });
FontFlux.inspectSourceQuality([{ id: 'master', input: font, source: { format: 'project' } }]);
const legacyValid: boolean | null = FontFlux.inspectLegacy(bytes).diagnostics.valid;
const replacement = FontFlux.recoverLegacy(bytes, bytes, { authorizeReplacement: true });
if (replacement.state === 'inspected') {
	const replaced: ArrayBuffer = replacement.buffer;
	void replaced;
}
void [reviewed, legacyValid];
// @ts-expect-error Worker entry URLs are chosen by FFJS, not by font data.
FontFlux.inspectAsync(bytes, { entryURL: 'https://untrusted.invalid/worker.js' });
// @ts-expect-error Unsupported foundry profiles must not silently become structural.
FontFlux.inspect(bytes, { profile: 'googlefonts' });
fontFromJSON(restored.toJSON());
void [valid, count, selected];
// @ts-expect-error Advances must be numeric.
font.addGlyph({ name: 'invalid', advanceWidth: 'wide' });
