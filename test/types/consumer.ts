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
FontFlux.diagnose(bytes, { faceIndex: 0, maxFonts: 4 });
// @ts-expect-error Only the implemented structural profile is exposed.
FontFlux.inspect(bytes, { profile: 'googlefonts' });
fontFromJSON(restored.toJSON());
void [valid, count, selected];
// @ts-expect-error Advances must be numeric.
font.addGlyph({ name: 'invalid', advanceWidth: 'wide' });
