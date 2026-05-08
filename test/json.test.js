/**
 * Tests for fontToJSON / fontFromJSON (src/json.js)
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../src/export.js';
import { FontFlux } from '../src/font_flux.js';
import { importFont } from '../src/import.js';
import { fontFromJSON, fontToJSON } from '../src/json.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

describe('fontToJSON', () => {
	it('should return a valid JSON string', () => {
		const data = { font: { familyName: 'Test' }, glyphs: [] };
		const json = fontToJSON(data);
		expect(typeof json).toBe('string');
		expect(() => JSON.parse(json)).not.toThrow();
	});

	it('should convert BigInt values to numbers', () => {
		const data = {
			tables: { head: { created: 3_600_000_000n, modified: 3_700_000_000n } },
		};
		const json = fontToJSON(data);
		const parsed = JSON.parse(json);
		expect(parsed.tables.head.created).toBe(3_600_000_000);
		expect(parsed.tables.head.modified).toBe(3_700_000_000);
		expect(typeof parsed.tables.head.created).toBe('number');
	});

	it('should strip transient top-level underscore-prefixed properties', () => {
		const data = {
			font: { familyName: 'Test' },
			_header: { sfVersion: 65536 },
			_dirty: true,
			_fileName: 'test.otf',
			_originalBuffer: new ArrayBuffer(10),
		};
		const json = fontToJSON(data);
		const parsed = JSON.parse(json);
		expect(parsed.font).toBeDefined();
		expect(parsed._header).toBeDefined();
		expect(parsed._dirty).toBeUndefined();
		expect(parsed._fileName).toBeUndefined();
		expect(parsed._originalBuffer).toBeUndefined();
	});

	it('should preserve table-level _raw and _checksum', () => {
		const data = {
			tables: {
				head: { unitsPerEm: 1000, _checksum: 0x12345678 },
				FFTM: { _raw: [1, 2, 3], _checksum: 0xabcdef01 },
			},
		};
		const json = fontToJSON(data);
		const parsed = JSON.parse(json);
		expect(parsed.tables.head.unitsPerEm).toBe(1000);
		expect(parsed.tables.head._checksum).toBe(0x12345678);
		expect(parsed.tables.FFTM._raw).toEqual([1, 2, 3]);
		expect(parsed.tables.FFTM._checksum).toBe(0xabcdef01);
	});

	it('should respect the indent parameter', () => {
		const data = { font: { familyName: 'Test' } };
		const compact = fontToJSON(data, 0);
		const indented = fontToJSON(data, 4);
		expect(compact).not.toContain('\n');
		expect(indented).toContain('    ');
	});
});

describe('fontFromJSON', () => {
	it('should parse a JSON string into an object', () => {
		const original = { font: { familyName: 'Test' }, glyphs: [] };
		const json = JSON.stringify(original);
		const result = fontFromJSON(json);
		expect(result).toEqual(original);
	});

	it('should round-trip through fontToJSON', () => {
		const data = {
			font: { familyName: 'MyFont', unitsPerEm: 1000 },
			glyphs: [{ name: '.notdef', advanceWidth: 500 }],
			tables: { head: { created: 3_600_000_000, modified: 3_700_000_000 } },
		};
		const json = fontToJSON(data);
		const restored = fontFromJSON(json);
		expect(restored.font.familyName).toBe('MyFont');
		expect(restored.glyphs).toHaveLength(1);
		expect(restored.tables.head.created).toBe(3_600_000_000);
	});
});

describe('fontToJSON / fontFromJSON with real fonts', () => {
	it('OTF: should serialize and deserialize without losing data', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const fontData = importFont(buffer);

		const json = fontToJSON(fontData);
		expect(typeof json).toBe('string');
		expect(json.length).toBeGreaterThan(100);

		// _header is preserved for lossless re-export; transient props should be gone
		expect(json).not.toContain('"_dirty"');
		expect(json).not.toContain('"_fileName"');
		expect(json).toContain('"_header"');

		const restored = fontFromJSON(json);
		expect(restored.font.familyName).toBeDefined();
		expect(restored.glyphs).toBeDefined();
		expect(restored.tables).toBeDefined();
	});

	it('TTF: should serialize and deserialize without losing data', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const fontData = importFont(buffer);

		const json = fontToJSON(fontData);
		const restored = fontFromJSON(json);
		expect(restored.font.familyName).toBeDefined();
		expect(restored.glyphs).toBeDefined();
		expect(restored.tables).toBeDefined();
	});

	it('OTF: fontFromJSON output should be exportable back to binary', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const fontData = importFont(buffer);

		const json = fontToJSON(fontData);
		const restored = fontFromJSON(json);

		// exportFont should not throw on deserialized data
		const binary = exportFont(restored);
		expect(binary).toBeInstanceOf(ArrayBuffer);
		expect(binary.byteLength).toBeGreaterThan(0);

		// Re-import should produce valid data
		const reimported = importFont(binary);
		expect(reimported.font.familyName).toBe(fontData.font.familyName);
		expect(reimported.glyphs).toHaveLength(fontData.glyphs.length);
	});

	it('TTF: fontFromJSON output should be exportable back to binary', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const fontData = importFont(buffer);

		const json = fontToJSON(fontData);
		const restored = fontFromJSON(json);

		const binary = exportFont(restored);
		expect(binary).toBeInstanceOf(ArrayBuffer);
		expect(binary.byteLength).toBeGreaterThan(0);

		const reimported = importFont(binary);
		expect(reimported.font.familyName).toBe(fontData.font.familyName);
		expect(reimported.glyphs).toHaveLength(fontData.glyphs.length);
	});
});

describe('FontFlux.open() with JSON input', () => {
	it('should accept a JSON string and return a FontFlux instance', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const original = FontFlux.open(buffer);
		const json = original.toJSON();

		const restored = FontFlux.open(json);
		expect(restored).toBeInstanceOf(FontFlux);
		expect(restored.info.familyName).toBe(original.info.familyName);
		expect(restored.glyphs.length).toBe(original.glyphs.length);
	});

	it('should accept a Uint8Array of UTF-8 JSON bytes', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const original = FontFlux.open(buffer);
		const json = original.toJSON();
		const jsonBytes = new TextEncoder().encode(json);

		const restored = FontFlux.open(jsonBytes);
		expect(restored).toBeInstanceOf(FontFlux);
		expect(restored.info.familyName).toBe(original.info.familyName);
	});

	it('should accept JSON bytes with a UTF-8 BOM and leading whitespace', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const original = FontFlux.open(buffer);
		const json = '   \n' + original.toJSON();
		const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
		const body = new TextEncoder().encode(json);
		const combined = new Uint8Array(bom.length + body.length);
		combined.set(bom, 0);
		combined.set(body, bom.length);

		const restored = FontFlux.open(combined);
		expect(restored.info.familyName).toBe(original.info.familyName);
	});

	it('should still accept ArrayBuffer binary input', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = FontFlux.open(buffer);
		expect(font).toBeInstanceOf(FontFlux);
		expect(font.info.familyName).toBeDefined();
	});

	it('should roundtrip JSON → FontFlux → binary → re-import', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const original = FontFlux.open(buffer);
		const json = original.toJSON();

		const restored = FontFlux.open(json);
		const binary = restored.export({ format: 'sfnt' });
		expect(binary).toBeInstanceOf(ArrayBuffer);

		const reimported = FontFlux.open(binary);
		expect(reimported.info.familyName).toBe(original.info.familyName);
		expect(reimported.glyphs.length).toBe(original.glyphs.length);
	});

	it('should throw a clear error for unsupported input types', () => {
		expect(() => FontFlux.open(42)).toThrow(/ArrayBuffer/);
		expect(() => FontFlux.open(null)).toThrow();
	});
});
