/**
 * Font Flux JS : sbix table
 * Standard Bitmap Graphics Table
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

export function parseSbix(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint16();
	const flags = reader.uint16();
	const numStrikes = reader.uint32();
	const strikeOffsets = [];

	for (let i = 0; i < numStrikes + 1; i++) {
		strikeOffsets.push(reader.uint32());
	}

	const strikes = [];
	for (let i = 0; i < numStrikes; i++) {
		const start = strikeOffsets[i];
		const end = strikeOffsets[i + 1] ?? rawBytes.length;
		if (start >= rawBytes.length || end <= start) {
			strikes.push({ ppem: 0, ppi: 0, _raw: [] });
			continue;
		}
		const strikeReader = new DataReader(rawBytes, start);
		const ppem = strikeReader.uint16();
		const ppi = strikeReader.uint16();
		strikes.push({
			ppem,
			ppi,
			_raw: Array.from(rawBytes.slice(start, end)),
		});
	}

	return { version, flags, strikes };
}

export function writeSbix(sbix) {
	const version = sbix.version ?? 1;
	const flags = sbix.flags ?? 0;
	const strikes = sbix.strikes ?? [];
	const strikeBlobs = strikes.map((s) => {
		if (s._raw) {
			return s._raw;
		}
		const w = new DataWriter(4);
		w.uint16(s.ppem ?? 0);
		w.uint16(s.ppi ?? 0);
		return w.toArray();
	});

	let offset = 8 + (strikes.length + 1) * 4;
	const offsets = [offset];
	for (const blob of strikeBlobs) {
		offset += blob.length;
		offsets.push(offset);
	}

	const w = new DataWriter(offset);
	w.uint16(version);
	w.uint16(flags);
	w.uint32(strikes.length);
	for (const off of offsets) {
		w.uint32(off);
	}
	for (const blob of strikeBlobs) {
		w.rawBytes(blob);
	}
	return w.toArray();
}
