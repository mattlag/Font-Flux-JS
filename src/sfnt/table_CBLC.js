/**
 * Font-to-JSON : CBLC table
 * Color Bitmap Location Table
 *
 * Structurally identical to EBLC at top level.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const BITMAP_SIZE_TABLE_SIZE = 48;

export function parseCBLC(rawBytes) {
	return parseBitmapLocationTable(rawBytes);
}

export function writeCBLC(cblc) {
	return writeBitmapLocationTable(cblc);
}

function parseBitmapLocationTable(rawBytes) {
	const reader = new DataReader(rawBytes);
	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const numSizes = reader.uint32();

	const sizes = [];
	for (let i = 0; i < numSizes; i++) {
		const start = reader.position;
		const table = {
			indexSubTableArrayOffset: reader.uint32(),
			indexTablesSize: reader.uint32(),
			numberOfIndexSubTables: reader.uint32(),
			colorRef: reader.uint32(),
			hori: parseSbitLineMetrics(reader),
			vert: parseSbitLineMetrics(reader),
			startGlyphIndex: reader.uint16(),
			endGlyphIndex: reader.uint16(),
			ppemX: reader.uint8(),
			ppemY: reader.uint8(),
			bitDepth: reader.uint8(),
			flags: reader.int8(),
		};
		table._raw = Array.from(rawBytes.slice(start, start + BITMAP_SIZE_TABLE_SIZE));
		sizes.push(table);
	}

	const dataStart = 8 + numSizes * BITMAP_SIZE_TABLE_SIZE;
	return {
		majorVersion,
		minorVersion,
		sizes,
		data: Array.from(rawBytes.slice(dataStart)),
	};
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

function writeBitmapLocationTable(table) {
	const majorVersion = table.majorVersion ?? 2;
	const minorVersion = table.minorVersion ?? 0;
	const sizes = table.sizes ?? [];
	const body = table.data ?? [];
	const totalSize = 8 + sizes.length * BITMAP_SIZE_TABLE_SIZE + body.length;

	const w = new DataWriter(totalSize);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint32(sizes.length);

	for (const size of sizes) {
		if (size._raw && size._raw.length === BITMAP_SIZE_TABLE_SIZE) {
			w.rawBytes(size._raw);
			continue;
		}
		w.uint32(size.indexSubTableArrayOffset ?? 0);
		w.uint32(size.indexTablesSize ?? 0);
		w.uint32(size.numberOfIndexSubTables ?? 0);
		w.uint32(size.colorRef ?? 0);
		writeSbitLineMetrics(w, size.hori ?? {});
		writeSbitLineMetrics(w, size.vert ?? {});
		w.uint16(size.startGlyphIndex ?? 0);
		w.uint16(size.endGlyphIndex ?? 0);
		w.uint8(size.ppemX ?? 0);
		w.uint8(size.ppemY ?? 0);
		w.uint8(size.bitDepth ?? 0);
		w.int8(size.flags ?? 0);
	}

	w.rawBytes(body);
	return w.toArray();
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
