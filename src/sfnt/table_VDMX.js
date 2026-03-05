/**
 * Font-to-JSON : VDMX table
 * Vertical Device Metrics Table
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const HEADER_SIZE = 6;
const RATIO_RECORD_SIZE = 4;
const OFFSET_RECORD_SIZE = 2;
const VTABLE_RECORD_SIZE = 6;

export function parseVDMX(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint16();
	const numRecs = reader.uint16();
	const numRatios = reader.uint16();

	const ratios = [];
	for (let i = 0; i < numRatios; i++) {
		ratios.push({
			bCharSet: reader.uint8(),
			xRatio: reader.uint8(),
			yStartRatio: reader.uint8(),
			yEndRatio: reader.uint8(),
		});
	}

	const offsets = [];
	for (let i = 0; i < numRatios; i++) {
		offsets.push(reader.offset16());
	}

	const uniqueOffsets = [...new Set(offsets)].sort((a, b) => a - b);
	const groups = uniqueOffsets.map((offset) => parseGroup(rawBytes, offset));
	const groupByOffset = new Map(
		uniqueOffsets.map((offset, idx) => [offset, idx]),
	);

	const ratioGroups = ratios.map((ratio, index) => ({
		...ratio,
		groupIndex: groupByOffset.get(offsets[index]) ?? 0,
	}));

	return {
		version,
		numRecs,
		numRatios,
		ratios: ratioGroups,
		groups,
	};
}

export function writeVDMX(vdmx) {
	const version = vdmx.version ?? 0;
	const ratios = vdmx.ratios ?? [];
	const groups = vdmx.groups ?? [];

	const groupBytes = groups.map((group) => writeGroup(group));
	const numRecs =
		vdmx.numRecs ?? Math.max(0, ...groups.map((g) => (g.entries ?? []).length));
	const numRatios = ratios.length;

	let currentOffset =
		HEADER_SIZE +
		numRatios * RATIO_RECORD_SIZE +
		numRatios * OFFSET_RECORD_SIZE;
	const groupOffsets = groupBytes.map((bytes) => {
		const offset = currentOffset;
		currentOffset += bytes.length;
		return offset;
	});

	const w = new DataWriter(currentOffset);
	w.uint16(version);
	w.uint16(numRecs);
	w.uint16(numRatios);

	for (const ratio of ratios) {
		w.uint8(ratio.bCharSet ?? 0);
		w.uint8(ratio.xRatio ?? 0);
		w.uint8(ratio.yStartRatio ?? 0);
		w.uint8(ratio.yEndRatio ?? 0);
	}

	for (const ratio of ratios) {
		const groupIndex = ratio.groupIndex ?? 0;
		const offset = groupOffsets[groupIndex] ?? 0;
		w.offset16(offset);
	}

	for (const bytes of groupBytes) {
		w.rawBytes(bytes);
	}

	return w.toArray();
}

function parseGroup(rawBytes, offset) {
	if (!offset || offset >= rawBytes.length) {
		return { recs: 0, startsz: 0, endsz: 0, entries: [] };
	}

	const reader = new DataReader(rawBytes, offset);
	const recs = reader.uint16();
	const startsz = reader.uint8();
	const endsz = reader.uint8();
	const entries = [];

	for (let i = 0; i < recs; i++) {
		if (reader.position + VTABLE_RECORD_SIZE > rawBytes.length) {
			break;
		}
		entries.push({
			yPelHeight: reader.uint16(),
			yMax: reader.int16(),
			yMin: reader.int16(),
		});
	}

	return { recs, startsz, endsz, entries };
}

function writeGroup(group) {
	const entries = group.entries ?? [];
	const recs = group.recs ?? entries.length;
	const safeEntries = entries.slice(0, recs);
	while (safeEntries.length < recs) {
		safeEntries.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
	}

	const w = new DataWriter(4 + recs * VTABLE_RECORD_SIZE);
	w.uint16(recs);
	w.uint8(group.startsz ?? 0);
	w.uint8(group.endsz ?? 0);
	for (const entry of safeEntries) {
		w.uint16(entry.yPelHeight ?? 0);
		w.int16(entry.yMax ?? 0);
		w.int16(entry.yMin ?? 0);
	}
	return w.toArray();
}
