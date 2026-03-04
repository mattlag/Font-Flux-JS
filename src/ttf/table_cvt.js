/**
 * cvt — Control Value Table
 *
 * A flat array of FWORD (int16) values referenced by TrueType hinting
 * instructions.  The number of entries is table-length / 2.
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/cvt
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

/**
 * Parse the cvt table from raw bytes.
 * @param {number[]} rawBytes
 * @returns {{ values: number[] }}
 */
export function parseCvt(rawBytes) {
	const reader = new DataReader(rawBytes);
	const count = rawBytes.length >>> 1; // each value is 2 bytes (FWORD = int16)
	const values = reader.array('fword', count);
	return { values };
}

/**
 * Write the cvt table to raw bytes.
 * @param {{ values: number[] }} data
 * @returns {number[]}
 */
export function writeCvt(data) {
	const values = data.values;
	const writer = new DataWriter(values.length * 2);
	writer.array('fword', values);
	return writer.toArray();
}
