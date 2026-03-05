/**
 * Font-to-JSON : EBSC table
 * Embedded Bitmap Scaling Table
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const BITMAP_SCALE_TABLE_SIZE = 28;

export function parseEBSC(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint32();
	const numSizes = reader.uint32();
	const scales = [];

	for (let i = 0; i < numSizes; i++) {
		const start = reader.position;
		scales.push({
			hori: parseSbitLineMetrics(reader),
			vert: parseSbitLineMetrics(reader),
			substitutePpemX: reader.uint8(),
			substitutePpemY: reader.uint8(),
			originalPpemX: reader.uint8(),
			originalPpemY: reader.uint8(),
			_raw: Array.from(rawBytes.slice(start, start + BITMAP_SCALE_TABLE_SIZE)),
		});
	}

	return { version, scales };
}

export function writeEBSC(ebsc) {
	const version = ebsc.version ?? 0x00020000;
	const scales = ebsc.scales ?? [];
	const w = new DataWriter(8 + scales.length * BITMAP_SCALE_TABLE_SIZE);
	w.uint32(version);
	w.uint32(scales.length);
	for (const scale of scales) {
		if (scale._raw && scale._raw.length === BITMAP_SCALE_TABLE_SIZE) {
			w.rawBytes(scale._raw);
			continue;
		}
		writeSbitLineMetrics(w, scale.hori ?? {});
		writeSbitLineMetrics(w, scale.vert ?? {});
		w.uint8(scale.substitutePpemX ?? 0);
		w.uint8(scale.substitutePpemY ?? 0);
		w.uint8(scale.originalPpemX ?? 0);
		w.uint8(scale.originalPpemY ?? 0);
	}
	return w.toArray();
}

function parseSbitLineMetrics(reader) {
	return {
		ascender: reader.int8(),
		descender: reader.int8(),
		widthMax: reader.uint8(),
		caretSlopeNumerator: reader.int8(),
		caretSlopeDenominator: reader.int8(),
		caretOffset: reader.int8(),
		minOriginSB: reader.int8(),
		minAdvanceSB: reader.int8(),
		maxBeforeBL: reader.int8(),
		minAfterBL: reader.int8(),
		pad1: reader.int8(),
		pad2: reader.int8(),
	};
}

function writeSbitLineMetrics(writer, m) {
	writer.int8(m.ascender ?? 0);
	writer.int8(m.descender ?? 0);
	writer.uint8(m.widthMax ?? 0);
	writer.int8(m.caretSlopeNumerator ?? 0);
	writer.int8(m.caretSlopeDenominator ?? 0);
	writer.int8(m.caretOffset ?? 0);
	writer.int8(m.minOriginSB ?? 0);
	writer.int8(m.minAdvanceSB ?? 0);
	writer.int8(m.maxBeforeBL ?? 0);
	writer.int8(m.minAfterBL ?? 0);
	writer.int8(m.pad1 ?? 0);
	writer.int8(m.pad2 ?? 0);
}
