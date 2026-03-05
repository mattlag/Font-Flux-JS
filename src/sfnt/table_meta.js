/**
 * Font-to-JSON : meta table
 * Metadata table
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const META_HEADER_SIZE = 16;
const DATA_MAP_SIZE = 12;

export function parseMeta(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint32();
	const flags = reader.uint32();
	const reserved = reader.uint32();
	const dataMapsCount = reader.uint32();

	const dataMaps = [];
	for (let i = 0; i < dataMapsCount; i++) {
		const tag = reader.tag();
		const dataOffset = reader.uint32();
		const dataLength = reader.uint32();
		const start = dataOffset;
		const end = Math.min(rawBytes.length, start + dataLength);
		const data =
			start < META_HEADER_SIZE || start >= rawBytes.length || end < start
				? []
				: Array.from(rawBytes.slice(start, end));
		dataMaps.push({ tag, dataOffset, dataLength, data });
	}

	return {
		version,
		flags,
		reserved,
		dataMaps,
	};
}

export function writeMeta(meta) {
	const version = meta.version ?? 1;
	const flags = meta.flags ?? 0;
	const reserved = meta.reserved ?? 0;
	const dataMaps = meta.dataMaps ?? [];

	const mapData = dataMaps.map((entry) => ({
		tag: (entry.tag ?? '    ').slice(0, 4).padEnd(4, ' '),
		data: entry.data ?? [],
	}));

	let currentOffset = META_HEADER_SIZE + mapData.length * DATA_MAP_SIZE;
	const mapsWithOffsets = mapData.map((entry) => {
		const dataOffset = currentOffset;
		const dataLength = entry.data.length;
		currentOffset += dataLength;
		return {
			tag: entry.tag,
			dataOffset,
			dataLength,
			data: entry.data,
		};
	});

	const w = new DataWriter(currentOffset);
	w.uint32(version);
	w.uint32(flags);
	w.uint32(reserved);
	w.uint32(mapsWithOffsets.length);

	for (const entry of mapsWithOffsets) {
		w.tag(entry.tag);
		w.uint32(entry.dataOffset);
		w.uint32(entry.dataLength);
	}

	for (const entry of mapsWithOffsets) {
		w.rawBytes(entry.data);
	}

	return w.toArray();
}
