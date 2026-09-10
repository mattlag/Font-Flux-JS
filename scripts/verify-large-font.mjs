import * as hb from 'harfbuzzjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FontFlux } from '../src/font_flux.js';

const file = resolve(
	import.meta.dirname,
	'../test/sample fonts/NotoSerifCJK-Regular-otc-online-test.ttc',
);
const bytes = await readFile(file);
const faceIndex = process.argv[2];
if (faceIndex === undefined) {
	const count = bytes.readUInt32BE(8);
	for (let index = 0; index < count; index++) {
		const output = execFileSync(
			process.execPath,
			['--max-old-space-size=3072', import.meta.filename, String(index)],
			{ timeout: 180000, encoding: 'utf8', maxBuffer: 1024 * 1024 },
		);
		process.stdout.write(output);
	}
} else {
	const started = performance.now();
	const font = FontFlux.open(bytes, { faceIndex: Number(faceIndex) });
	font.info.familyName += ' Large Consumer';
	const exported = font.export({ format: 'sfnt' });
	const shape = (data, index) => {
		const face = new hb.Face(new hb.Blob(data), index);
		const buffer = new hb.Buffer();
		buffer.addText('\u65e5\u672c\u8a9e\u4e2d\u6587AVATAR');
		buffer.guessSegmentProperties();
		hb.shape(new hb.Font(face), buffer);
		return {
			infos: buffer.getGlyphInfos(),
			positions: buffer.getGlyphPositions(),
		};
	};
	const original = bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength,
	);
	assert.deepEqual(shape(exported, 0), shape(original, Number(faceIndex)));
	const originalFont = new hb.Font(
		new hb.Face(new hb.Blob(original), Number(faceIndex)),
	);
	const exportedFont = new hb.Font(new hb.Face(new hb.Blob(exported)));
	const glyphIds = new Set(
		Array.from('\u65e5\u672c\u8a9e\u4e2d\u6587AVATAR', (character) =>
			originalFont.nominalGlyph(character.codePointAt(0)),
		),
	);
	const dictionaries = new Set();
	for (const [index, dictionary] of font.tables[
		'CFF '
	].fonts[0].fdSelect.entries()) {
		if (!dictionaries.has(dictionary)) glyphIds.add(index);
		dictionaries.add(dictionary);
	}
	for (const glyphId of glyphIds)
		assert.equal(
			exportedFont.glyphToPath(glyphId),
			originalFont.glyphToPath(glyphId),
			`CID glyph ${glyphId} outline changed`,
		);
	console.log(
		JSON.stringify({
			faceIndex: Number(faceIndex),
			glyphs: font.glyphCount,
			outputBytes: exported.byteLength,
			elapsedMs: Math.round(performance.now() - started),
			peakRssMiB: Math.round(process.resourceUsage().maxRSS / 1024),
		}),
	);
}
