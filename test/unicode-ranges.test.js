import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { computeUnicodeRangeBits, UNICODE_RANGE_POLICY } from '../src/sfnt/unicode_ranges.js';

function specificationRanges() {
	const html = readFileSync(new URL('../specs/opentype/os2.html', import.meta.url), 'utf8');
	const start = html.indexOf('<td>Basic Latin</td>');
	const table = html.slice(html.lastIndexOf('<table>', start), html.indexOf('</table>', start));
	const ranges = [];
	let bit;
	for (const row of table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
		const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
			.map((match) => match[1].replace(/<[^>]*>/g, '').trim());
		if (!cells.length) continue;
		if (/^\d+$/.test(cells[0])) bit = Number(cells[0]);
		const span = /^([0-9A-F]+)-([0-9A-F]+)$/.exec(cells[2] ?? '');
		if (span) ranges.push([bit, parseInt(span[1], 16), parseInt(span[2], 16)]);
	}
	return ranges;
}

function os2Offset(bytes) {
	const view = new DataView(bytes);
	for (let i = 0; i < view.getUint16(4); i++) {
		const record = 12 + i * 16;
		if (String.fromCharCode(...new Uint8Array(bytes, record, 4)) === 'OS/2')
			return view.getUint32(record + 8);
	}
	throw new Error('Missing fixture OS/2.');
}

describe('M1 versioned Unicode range policy', () => {
	it('matches every normative assignment and boundary independently of the implementation table', () => {
		const ranges = specificationRanges();
		expect(ranges).toHaveLength(169);
		const points = new Set(ranges.flatMap(([, start, end]) => [start - 1, start, end, end + 1])
			.filter((point) => point >= 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)));
		for (const point of points) {
			const expected = [0, 0, 0, 0];
			for (const [bit, start, end] of ranges)
				if (point >= start && point <= end)
					expected[Math.floor(bit / 32)] = (expected[Math.floor(bit / 32)] | 2 ** (bit % 32)) >>> 0;
			expect(computeUnicodeRangeBits(new Set([point])), `U+${point.toString(16)}`).toEqual(expected);
		}
		expect(computeUnicodeRangeBits(new Set())).toEqual([0, 0, 0, 0]);
		expect(() => computeUnicodeRangeBits(new Set([0xd800]))).toThrow(/scalar/);
	});

	it('uses the same complete mapping for authored fonts and explicitly authorized repairs', async () => {
		const font = FontFlux.create({ family: 'Unicode range policy' });
		for (const unicode of [0x0905, 0x2000, 0x1d400])
			font.addGlyph({ name: `u${unicode.toString(16)}`, unicode, advanceWidth: 500 });
		const source = font.export(), offset = os2Offset(source), view = new DataView(source);
		const expected = [0x80008001, 0x02000000, 0x02000000, 0];
		expect([0, 1, 2, 3].map((word) => view.getUint32(offset + 42 + word * 4))).toEqual(expected);
		for (let word = 0; word < 4; word++) view.setUint32(offset + 42 + word * 4, 0);
		const original = new Uint8Array(source).slice();
		const offer = FontFlux.inspect(source).repairs.find((fix) => fix.id === 'os2.unicode-ranges');
		expect(offer).toMatchObject({ risk: 'assisted', availability: 'needs-input', policyVersion: UNICODE_RANGE_POLICY });
		await expect(FontFlux.planRepairs(source, [{ id: offer.id, inputs: { authority: false } }])).rejects.toThrow(/confirmation/);
		const plan = await FontFlux.planRepairs(source, [{ id: offer.id, inputs: { authority: true } }]);
		expect(new Uint8Array(source)).toEqual(original);
		const result = await FontFlux.applyRepairs(source, plan);
		expect(result.verification.failures).toEqual([]);
		expect(result.state).toBe('verified');
		const output = new DataView(result.buffer), resultOffset = os2Offset(result.buffer);
		expect([0, 1, 2, 3].map((word) => output.getUint32(resultOffset + 42 + word * 4))).toEqual(expected);
		const again = await FontFlux.planRepairs(result.buffer, plan.requests);
		expect((await FontFlux.applyRepairs(result.buffer, again)).changed).toBe(false);
		view.setUint16(offset, 3);
		await expect(FontFlux.planRepairs(source, plan.requests)).rejects.toThrow(/v4|v5/);
		expect(new Uint8Array(source).subarray(offset + 42, offset + 58)).toEqual(new Uint8Array(16));
	});
});
