/**
 * Font Flux JS : CBDT table
 * Color Bitmap Data Table
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

export function parseCBDT(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint32();
	return {
		version,
		data: Array.from(rawBytes.slice(4)),
	};
}

export function writeCBDT(cbdt) {
	const version = cbdt.version ?? 0x00030000;
	const data = cbdt.data ?? [];
	const w = new DataWriter(4 + data.length);
	w.uint32(version);
	w.rawBytes(data);
	return w.toArray();
}
