import { afterEach, describe, expect, it, vi } from 'vitest';
import { applySubset } from '../demo/src/tabs/subset.js';
import { FontFlux } from '../src/font_flux.js';

vi.mock('font-flux-js', () => import('../src/main.js'));

const ranges = [{ start: 0x41, end: 0x41, checked: true }];

function makeFont(composite = false, importedKerning = false) {
	const font = FontFlux.create({ family: 'Subset Test' });
	font.addGlyph({
		name: 'A',
		unicode: 0x41,
		advanceWidth: 600,
		path: 'M100 0 L100 500 L500 500 L500 0 Z',
		format: 'truetype',
	});
	font.addGlyph({
		name: 'B',
		unicode: 0x42,
		advanceWidth: 600,
		path: 'M100 0 L100 400 L400 400 L400 0 Z',
		format: 'truetype',
	});
	if (composite) {
		font.addGlyph({
			name: 'Aacute',
			unicode: 0xc1,
			advanceWidth: 600,
			components: [{ glyphName: 'A', dx: 0, dy: 0 }],
		});
	}
	if (importedKerning) font.addKerning({ left: 'A', right: 'B', value: -30 });
	const imported = FontFlux.open(font.export());
	if (!importedKerning)
		imported.addKerning({ left: 'A', right: 'B', value: -30 });
	return imported;
}

function context() {
	vi.stubGlobal(
		'confirm',
		vi.fn(() => true),
	);
	return {
		refreshPreview: vi.fn().mockResolvedValue(),
		markDirty: vi.fn(),
		invalidateL1Cache: vi.fn(),
	};
}

afterEach(() => vi.unstubAllGlobals());

describe('demo subset transactions', () => {
	it('exports before committing, retains original tables and collection references', async () => {
		const font = makeFont();
		const originalTables = structuredClone(font.tables);
		const collection = [font.data];
		font.data._collectionFonts = collection;
		font.data._collectionInstances = [font];
		const app = context();
		app.refreshPreview.mockImplementation(async (buffer) => {
			expect(font.glyphs.some((glyph) => glyph.name === 'A')).toBe(true);
			expect(FontFlux.open(buffer).glyphCount).toBe(3);
		});
		await applySubset(font.data, ranges, app);
		expect(font.glyphs.map((glyph) => glyph.name)).toEqual([
			'.notdef',
			'space',
			'B',
		]);
		expect(font.kerning).toEqual([]);
		expect(font.tables).toEqual(originalTables);
		expect(font.data._collectionFonts).toBe(collection);
		expect(app.markDirty).toHaveBeenCalledOnce();
		expect(app.invalidateL1Cache).toHaveBeenCalledWith();
		expect(FontFlux.open(font.export()).glyphCount).toBe(3);
	});

	it('rejects dangling composites without changing the live source or preview', async () => {
		const font = makeFont(true);
		const before = structuredClone(font.data);
		const app = context();
		await expect(applySubset(font.data, ranges, app)).rejects.toThrow();
		expect(font.data).toEqual(before);
		expect(app.refreshPreview).not.toHaveBeenCalled();
		expect(app.markDirty).not.toHaveBeenCalled();
	});

	it('keeps the font intact if the browser rejects the new preview', async () => {
		const font = makeFont();
		const before = structuredClone(font.data);
		const app = context();
		app.refreshPreview.mockRejectedValue(new Error('Font load failed'));
		await expect(applySubset(font.data, ranges, app)).rejects.toThrow(
			'Font load failed',
		);
		expect(font.data).toEqual(before);
		expect(app.markDirty).not.toHaveBeenCalled();
	});

	it('rejects retained positioning dependencies without changing the source', async () => {
		const font = makeFont(false, true);
		const before = structuredClone(font.data);
		const app = context();
		await expect(applySubset(font.data, ranges, app)).rejects.toThrow('GPOS');
		expect(font.data).toEqual(before);
		expect(app.refreshPreview).not.toHaveBeenCalled();
	});

	it('does not apply a canceled removal', async () => {
		const font = makeFont();
		const before = structuredClone(font.data);
		const app = context();
		confirm.mockReturnValue(false);
		await applySubset(font.data, ranges, app);
		expect(font.data).toEqual(before);
		expect(app.refreshPreview).not.toHaveBeenCalled();
	});
});
