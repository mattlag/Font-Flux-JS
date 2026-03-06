/**
 * Font Flux JS : MERG table
 * Merge table (rare)
 *
 * Conservative implementation: preserves all bytes while exposing the
 * leading version field.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

export function parseMERG(rawBytes) {
	if (!rawBytes.length) {
		return { version: 0, data: [] };
	}

	const reader = new DataReader(rawBytes);
	const version = rawBytes.length >= 2 ? reader.uint16() : 0;
	const data = rawBytes.length >= 2 ? Array.from(rawBytes.slice(2)) : [];

	return {
		version,
		data,
	};
}

export function writeMERG(merg) {
	const version = merg.version ?? 0;
	const data = merg.data ?? [];
	const w = new DataWriter(2 + data.length);
	w.uint16(version);
	w.rawBytes(data);
	return w.toArray();
}
