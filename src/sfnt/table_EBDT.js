/**
 * Font-to-JSON : EBDT table
 * Embedded Bitmap Data Table
 */

import { parseCBDT, writeCBDT } from './table_CBDT.js';

export function parseEBDT(rawBytes) {
	return parseCBDT(rawBytes);
}

export function writeEBDT(ebdt) {
	return writeCBDT(ebdt);
}
