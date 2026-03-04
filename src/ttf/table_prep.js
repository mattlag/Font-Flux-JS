/**
 * prep — Control Value Program
 *
 * A flat array of uint8 TrueType instructions executed whenever point size,
 * font, or transformation changes.  Also known as the "Pre Program".
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/prep
 */

/**
 * Parse the prep table from raw bytes.
 * @param {number[]} rawBytes
 * @returns {{ instructions: number[] }}
 */
export function parsePrep(rawBytes) {
	return { instructions: Array.from(rawBytes) };
}

/**
 * Write the prep table to raw bytes.
 * @param {{ instructions: number[] }} data
 * @returns {number[]}
 */
export function writePrep(data) {
	return Array.from(data.instructions);
}
