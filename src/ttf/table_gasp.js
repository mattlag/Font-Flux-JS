/**
 * gasp — Grid-fitting and Scan-conversion Procedure Table
 *
 * Contains recommended rasterizer behaviors (grid-fitting, grayscale rendering,
 * ClearType symmetric smoothing) for various ppem size ranges.
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/gasp
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

/**
 * Parse the gasp table from raw bytes.
 * @param {number[]} rawBytes
 * @returns {{ version: number, gaspRanges: Array<{ rangeMaxPPEM: number, rangeGaspBehavior: number }> }}
 */
export function parseGasp(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint16();
	const numRanges = reader.uint16();

	const gaspRanges = [];
	for (let i = 0; i < numRanges; i++) {
		gaspRanges.push({
			rangeMaxPPEM: reader.uint16(),
			rangeGaspBehavior: reader.uint16(),
		});
	}

	return { version, gaspRanges };
}

/**
 * Write the gasp table to raw bytes.
 * @param {{ version: number, gaspRanges: Array<{ rangeMaxPPEM: number, rangeGaspBehavior: number }> }} data
 * @returns {number[]}
 */
export function writeGasp(data) {
	const { version, gaspRanges } = data;
	// 4 bytes header + 4 bytes per range
	const writer = new DataWriter(4 + gaspRanges.length * 4);
	writer.uint16(version);
	writer.uint16(gaspRanges.length);

	for (const range of gaspRanges) {
		writer.uint16(range.rangeMaxPPEM);
		writer.uint16(range.rangeGaspBehavior);
	}

	return writer.toArray();
}
