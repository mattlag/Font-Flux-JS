/**
 * Standalone common tests for SFNT container-level behavior.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../../src/export.js';
import { FontFlux } from '../../src/font_flux.js';
import { importFontTables } from '../../src/import.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

function readDirectoryEntries(buffer, sfntOffset = 0) {
	const view = new DataView(buffer);
	const numTables = view.getUint16(sfntOffset + 4);
	const entries = [];
	for (let i = 0; i < numTables; i++) {
		const pos = sfntOffset + 12 + i * 16;
		const tag = String.fromCharCode(
			view.getUint8(pos),
			view.getUint8(pos + 1),
			view.getUint8(pos + 2),
			view.getUint8(pos + 3),
		);
		entries.push({
			tag,
			checksum: view.getUint32(pos + 4),
			offset: view.getUint32(pos + 8),
			length: view.getUint32(pos + 12),
		});
	}
	return entries;
}

function checksum(bytes) {
	const padded = new Uint8Array(Math.ceil(bytes.length / 4) * 4);
	padded.set(bytes);
	const view = new DataView(padded.buffer);
	let sum = 0;
	for (let offset = 0; offset < padded.length; offset += 4) {
		sum = (sum + view.getUint32(offset)) >>> 0;
	}
	return sum;
}

describe('SFNT container common functionality', () => {
	it('leaves collection face adjustments zero and can export each face independently', () => {
		const fonts = ['First', 'Second'].map((family) =>
			FontFlux.create({ family }),
		);
		const collection = FontFlux.exportCollection(fonts);
		const view = new DataView(collection);
		for (let index = 0; index < fonts.length; index++) {
			const faceOffset = view.getUint32(12 + index * 4);
			const head = readDirectoryEntries(collection, faceOffset).find(
				(entry) => entry.tag === 'head',
			);
			expect(view.getUint32(head.offset + 8)).toBe(0);
		}
		const reopened = FontFlux.openAll(collection);
		expect(reopened.map((font) => font.info.familyName)).toEqual([
			'First',
			'Second',
		]);
		for (const font of reopened) {
			expect(checksum(new Uint8Array(font.export()))).toBe(0xb1b0afba);
		}
	});

	it.each(['ttf', 'otf'])('finalizes standalone %s checksums', (format) => {
		const font = FontFlux.create({ family: 'Checksum' });
		const buffer = font.export({ format });
		expect(checksum(new Uint8Array(buffer))).toBe(0xb1b0afba);

		for (const entry of readDirectoryEntries(buffer)) {
			const bytes = new Uint8Array(
				buffer.slice(entry.offset, entry.offset + entry.length),
			);
			if (entry.tag === 'head') new DataView(bytes.buffer).setUint32(8, 0);
			expect(checksum(bytes), entry.tag).toBe(entry.checksum);
		}
	});

	it('recomputes the head checksum without changing original parsed or raw data', () => {
		const original = FontFlux.create({ family: 'Checksum' }).export();
		const source = importFontTables(original);
		source.tables.head.checksumAdjustment = 0x12345678;
		const before = structuredClone(source);
		expect(checksum(new Uint8Array(exportFont(source)))).toBe(0xb1b0afba);
		expect(source).toEqual(before);

		const head = readDirectoryEntries(original).find(
			(entry) => entry.tag === 'head',
		);
		source.tables.head = {
			_raw: Array.from(new Uint8Array(original, head.offset, head.length)),
			_checksum: 0,
		};
		const rawBefore = structuredClone(source);
		const output = exportFont(source);
		expect(checksum(new Uint8Array(output))).toBe(0xb1b0afba);
		const exportedHead = readDirectoryEntries(output).find(
			(entry) => entry.tag === 'head',
		);
		const bytes = new Uint8Array(
			output.slice(
				exportedHead.offset,
				exportedHead.offset + exportedHead.length,
			),
		);
		new DataView(bytes.buffer).setUint32(8, 0);
		expect(exportedHead.checksum).toBe(checksum(bytes));
		expect(source).toEqual(rawBefore);
	});

	it('should parse header search values consistent with numTables', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const { numTables, searchRange, entrySelector, rangeShift } = font.header;

		const expectedEntrySelector = Math.floor(Math.log2(numTables));
		const expectedSearchRange = Math.pow(2, expectedEntrySelector) * 16;
		const expectedRangeShift = numTables * 16 - expectedSearchRange;

		expect(entrySelector).toBe(expectedEntrySelector);
		expect(searchRange).toBe(expectedSearchRange);
		expect(rangeShift).toBe(expectedRangeShift);
	});

	it('should write directory entries with 4-byte aligned table offsets', () => {
		const fontData = {
			header: {
				sfVersion: 0x00010000,
				numTables: 0,
				searchRange: 32,
				entrySelector: 1,
				rangeShift: 0,
			},
			tables: {
				ABCD: { _raw: [1, 2, 3], _checksum: 0x01010101 },
				WXYZ: { _raw: [4, 5, 6, 7, 8], _checksum: 0x02020202 },
			},
		};

		const buffer = exportFont(fontData);
		const entries = readDirectoryEntries(buffer);

		expect(entries.length).toBe(2);
		for (const entry of entries) {
			expect(entry.offset % 4).toBe(0);
		}
		expect(entries[1].offset).toBe(entries[0].offset + 4);
	});

	it('recomputes stale raw checksums and preserves raw length', () => {
		const fontData = {
			header: {
				sfVersion: 0x00010000,
				numTables: 0,
				searchRange: 16,
				entrySelector: 0,
				rangeShift: 0,
			},
			tables: {
				TEST: { _raw: [9, 8, 7, 6, 5], _checksum: 0x11223344 },
			},
		};

		const buffer = exportFont(fontData);
		const [entry] = readDirectoryEntries(buffer);

		expect(entry.tag).toBe('TEST');
		expect(entry.checksum).toBe(checksum(new Uint8Array([9, 8, 7, 6, 5])));
		expect(entry.length).toBe(5);
	});
});
