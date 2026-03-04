/**
 * fpgm — Font Program
 *
 * A flat array of uint8 TrueType instructions that runs once when the font is
 * first used.  Used only for FDEFs and IDEFs (function and instruction
 * definitions).
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/fpgm
 */

/**
 * Parse the fpgm table from raw bytes.
 * @param {number[]} rawBytes
 * @returns {{ instructions: number[] }}
 */
export function parseFpgm(rawBytes) {
	return { instructions: Array.from(rawBytes) };
}

/**
 * Write the fpgm table to raw bytes.
 * @param {{ instructions: number[] }} data
 * @returns {number[]}
 */
export function writeFpgm(data) {
	return Array.from(data.instructions);
}
