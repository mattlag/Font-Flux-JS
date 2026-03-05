/**
 * Font-to-JSON : PCLT table
 * PCL 5 Table
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const PCLT_SIZE = 54;

export function parsePCLT(rawBytes) {
	const reader = new DataReader(rawBytes);

	return {
		version: reader.uint32(),
		fontNumber: reader.uint32(),
		pitch: reader.uint16(),
		xHeight: reader.uint16(),
		style: reader.uint16(),
		typeFamily: reader.uint16(),
		capHeight: reader.uint16(),
		symbolSet: reader.uint16(),
		typeface: decodeAscii(reader.bytes(16)),
		characterComplement: decodeAscii(reader.bytes(8)),
		fileName: decodeAscii(reader.bytes(6)),
		strokeWeight: reader.int8(),
		widthType: reader.int8(),
		serifStyle: reader.uint8(),
		reserved: reader.uint8(),
	};
}

export function writePCLT(pclt) {
	const w = new DataWriter(PCLT_SIZE);
	w.uint32(pclt.version ?? 0x00010000);
	w.uint32(pclt.fontNumber ?? 0);
	w.uint16(pclt.pitch ?? 0);
	w.uint16(pclt.xHeight ?? 0);
	w.uint16(pclt.style ?? 0);
	w.uint16(pclt.typeFamily ?? 0);
	w.uint16(pclt.capHeight ?? 0);
	w.uint16(pclt.symbolSet ?? 0);
	w.rawBytes(encodeAsciiFixed(pclt.typeface ?? '', 16));
	w.rawBytes(encodeAsciiFixed(pclt.characterComplement ?? '', 8));
	w.rawBytes(encodeAsciiFixed(pclt.fileName ?? '', 6));
	w.int8(pclt.strokeWeight ?? 0);
	w.int8(pclt.widthType ?? 0);
	w.uint8(pclt.serifStyle ?? 0);
	w.uint8(pclt.reserved ?? 0);
	return w.toArray();
}

function decodeAscii(bytes) {
	return String.fromCharCode(...bytes).replace(/\0+$/g, '');
}

function encodeAsciiFixed(value, length) {
	const bytes = new Array(length).fill(0);
	for (let i = 0; i < length && i < value.length; i++) {
		const code = value.charCodeAt(i);
		bytes[i] = code >= 0 && code <= 0x7f ? code : 0x3f;
	}
	return bytes;
}
