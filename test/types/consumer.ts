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
fontFromJSON(restored.toJSON());
void [valid, count, selected];
// @ts-expect-error Advances must be numeric.
font.addGlyph({ name: 'invalid', advanceWidth: 'wide' });
