/**
 * Font-to-JSON : EBLC table
 * Embedded Bitmap Location Table
 */

import { parseCBLC, writeCBLC } from './table_CBLC.js';

export function parseEBLC(rawBytes) {
	return parseCBLC(rawBytes);
}

export function writeEBLC(eblc) {
	return writeCBLC(eblc);
}
