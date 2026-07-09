/**
 * "Familying" metadata tests.
 *
 * Covers the info → binary mapping that lets multiple exported fonts group as a
 * single family in modern apps (Windows Font Viewer, Office, Affinity, Adobe):
 *
 *   1. Typographic family/subfamily (name IDs 16/17) emitted only when they
 *      differ from the legacy family/subfamily (IDs 1/2), and surfaced on read.
 *   2. WWS family/subfamily (name IDs 21/22) round-trip through info.
 *   3. The PostScript-name fallback strips spaces / non-ASCII and caps at 63.
 *   4. head.macStyle is honored when explicit and stays coordinated with
 *      OS/2.fsSelection; the derived bold bit follows the RIBBI rule
 *      (weight === 700), so ExtraBold/Black do not get contradictory bits.
 *   5. The variations PostScript name prefix (name ID 25) round-trips.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../src/export.js';
import { FontFlux } from '../src/font_flux.js';
import { importFontTables } from '../src/import.js';
import { buildSimplified } from '../src/simplify.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

async function openSample(name) {
	const buf = await readFile(resolve(SAMPLES_DIR, name));
	return FontFlux.open(
		buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
	);
}

/** Author a minimal font, override info, export, and re-parse its tables. */
function roundTrip(infoOverrides) {
	const font = FontFlux.create({ family: 'Acme Sans', style: 'Regular' });
	font.setInfo(infoOverrides);
	const buffer = exportFont(font._data, { format: 'ttf' });
	const { header, tables } = importFontTables(buffer);
	return { tables, simplified: buildSimplified({ header, tables }) };
}

/** Collect all values for a given nameID across platforms. */
function nameValues(nameTable, nameID) {
	return nameTable.names.filter((r) => r.nameID === nameID).map((r) => r.value);
}

describe('typographic family/subfamily (name IDs 16/17)', () => {
	it('emits IDs 16/17 when they differ from IDs 1/2', () => {
		const { tables, simplified } = roundTrip({
			familyName: 'Acme Sans Light',
			styleName: 'Regular',
			typographicFamily: 'Acme Sans',
			typographicSubfamily: 'Light',
		});

		expect(nameValues(tables.name, 16)).toContain('Acme Sans');
		expect(nameValues(tables.name, 17)).toContain('Light');
		// Surfaced back onto info when read.
		expect(simplified.font.typographicFamily).toBe('Acme Sans');
		expect(simplified.font.typographicSubfamily).toBe('Light');
	});

	it('omits IDs 16/17 when they match IDs 1/2', () => {
		const { tables } = roundTrip({
			familyName: 'Acme Sans',
			styleName: 'Regular',
			typographicFamily: 'Acme Sans',
			typographicSubfamily: 'Regular',
		});

		expect(nameValues(tables.name, 16)).toHaveLength(0);
		expect(nameValues(tables.name, 17)).toHaveLength(0);
	});

	it('does not synthesize IDs 16/17 when not supplied', () => {
		const { tables } = roundTrip({ familyName: 'Acme Sans' });
		expect(nameValues(tables.name, 16)).toHaveLength(0);
		expect(nameValues(tables.name, 17)).toHaveLength(0);
	});
});

describe('WWS family/subfamily (name IDs 21/22)', () => {
	it('round-trips info.wwsFamily / info.wwsSubfamily', () => {
		const { tables, simplified } = roundTrip({
			wwsFamily: 'Acme Sans Display',
			wwsSubfamily: 'Bold',
		});

		expect(nameValues(tables.name, 21)).toContain('Acme Sans Display');
		expect(nameValues(tables.name, 22)).toContain('Bold');
		expect(simplified.font.wwsFamily).toBe('Acme Sans Display');
		expect(simplified.font.wwsSubfamily).toBe('Bold');
	});
});

describe('PostScript-name fallback sanitation', () => {
	it('strips spaces / non-ASCII and caps at 63 characters', () => {
		const { tables } = roundTrip({
			familyName: 'Acmé Sans Ünicode',
			styleName: 'Condensed Bold',
			postScriptName: undefined,
		});

		const ps = nameValues(tables.name, 6)[0];
		expect(ps).toBe('AcmSansnicode-CondensedBold');
		expect(ps).not.toMatch(/\s/);
		expect(ps).toMatch(/^[\x21-\x7e]+$/);
		expect(ps.length).toBeLessThanOrEqual(63);
	});

	it('does not override an explicit PostScript name', () => {
		const { tables } = roundTrip({ postScriptName: 'AcmeSans-Regular' });
		expect(nameValues(tables.name, 6)).toContain('AcmeSans-Regular');
	});
});

describe('macStyle / fsSelection coordination', () => {
	it('follows the RIBBI rule: ExtraBold (800) gets no bold bit', () => {
		const { tables } = roundTrip({ weightClass: 800 });
		expect(tables.head.macStyle & 0x1).toBe(0); // not bold
		expect(tables['OS/2'].fsSelection & 0x0020).toBe(0); // not bold
	});

	it('sets bold bits when weight is exactly 700', () => {
		const { tables } = roundTrip({ weightClass: 700 });
		expect(tables.head.macStyle & 0x1).toBe(0x1);
		expect(tables['OS/2'].fsSelection & 0x0020).toBe(0x0020);
	});

	it('honors an explicit macStyle', () => {
		const { tables } = roundTrip({ macStyle: 0x2 }); // italic only
		expect(tables.head.macStyle).toBe(0x2);
	});

	it('honors explicit isBold / isItalic flags', () => {
		const { tables } = roundTrip({ weightClass: 400, isBold: true });
		expect(tables.head.macStyle & 0x1).toBe(0x1);
		expect(tables['OS/2'].fsSelection & 0x0020).toBe(0x0020);
	});
});

describe('variations PostScript name prefix (name ID 25)', () => {
	it('round-trips info.variationsPostScriptNamePrefix', () => {
		const { tables, simplified } = roundTrip({
			variationsPostScriptNamePrefix: 'AcmeSans',
		});
		expect(nameValues(tables.name, 25)).toContain('AcmeSans');
		expect(simplified.font.variationsPostScriptNamePrefix).toBe('AcmeSans');
	});
});

describe('full name-table round-trip fidelity (Tier 1)', () => {
	/** Key a record by its full (platform, encoding, language, nameID) tuple. */
	const tuple = (r) =>
		`${r.platformID},${r.encodingID},${r.languageID},${r.nameID}`;

	it('preserves localized (non-English) name records on a static font', async () => {
		const font = await openSample('arial-test.ttf');
		const original = font._data.tables.name.names;

		// Localized copies of nameID 2 (Windows, languageID != US English).
		const localized = original.filter(
			(r) => r.nameID === 2 && r.platformID === 3 && r.languageID !== 0x0409,
		);
		expect(localized.length).toBeGreaterThan(0);

		const out = font.export();
		const { tables } = importFontTables(out);
		const resultByTuple = new Map(tables.name.names.map((r) => [tuple(r), r]));

		for (const rec of localized) {
			const kept = resultByTuple.get(tuple(rec));
			expect(kept, `missing localized record ${tuple(rec)}`).toBeDefined();
			expect(kept.value).toBe(rec.value);
		}
	});

	it('preserves unknown name IDs (e.g. ID 18) on a variable font', async () => {
		const font = await openSample('SegUIVar-test.ttf');
		const original = font._data.tables.name.names;
		const id18 = original.filter((r) => r.nameID === 18);
		expect(id18.length).toBeGreaterThan(0);

		const out = font.export();
		const { tables } = importFontTables(out);
		const resultByTuple = new Map(tables.name.names.map((r) => [tuple(r), r]));

		for (const rec of id18) {
			const kept = resultByTuple.get(tuple(rec));
			expect(kept, `missing record ${tuple(rec)}`).toBeDefined();
			expect(kept.value).toBe(rec.value);
		}
	});

	it('does not duplicate name records or the fvar 256+ range on a variable font', async () => {
		const font = await openSample('SegUIVar-test.ttf');
		const out = font.export();
		const { tables } = importFontTables(out);

		// No exact-tuple duplicates anywhere in the rebuilt name table.
		const seen = new Set();
		for (const r of tables.name.names) {
			const key = tuple(r);
			expect(seen.has(key), `duplicate name record ${key}`).toBe(false);
			seen.add(key);
		}

		// fvar named instances still resolve to real names (256+ regenerated,
		// not carried as stale duplicates).
		const { header } = importFontTables(out);
		const simplified = buildSimplified({ header, tables });
		expect(simplified.instances.length).toBeGreaterThan(0);
		for (const inst of simplified.instances) {
			expect(typeof inst.name).toBe('string');
			expect(inst.name.length).toBeGreaterThan(0);
		}
	});

	it('carries nothing when authoring from scratch (no imported tables)', () => {
		// A hand-authored font has no simplified.tables, so the merge is a no-op
		// and only info-driven records are emitted.
		const { tables } = roundTrip({ familyName: 'Scratch' });
		const ids = [...new Set(tables.name.names.map((r) => r.nameID))].sort(
			(a, b) => a - b,
		);
		expect(ids.every((id) => id <= 25)).toBe(true);
	});
});
