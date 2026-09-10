/**
 * Font Flux JS : JSON Serialization
 * Convert font data objects to/from JSON strings, handling BigInt values.
 */

// Top-level keys that are transient and should not be serialized.
// _header is preserved because exportFont needs it for lossless re-export.
// Table-level _raw and _checksum are part of the data model and must be preserved.
const SKIP_KEYS = new Set([
	'_dirty',
	'_fileName',
	'_originalBuffer',
	'_collection',
	'_collectionFonts',
]);

/**
 * Serialize a font data object to a JSON string.
 * Safe BigInt values become numbers; larger integers use an exact tagged form.
 * Durable headers and WOFF metadata survive; transient file bookkeeping is omitted.
 * Table-level _raw and _checksum are preserved for lossless round-trip.
 *
 * @param {object} fontData - The font data object from importFont.
 * @param {number} [indent=2] - Number of spaces for indentation (0 for compact).
 * @returns {string} JSON string.
 */
export function fontToJSON(fontData, indent = 2) {
	const document = { ...fontData, _schemaVersion: 1 };
	return JSON.stringify(
		document,
		function (key, value) {
			// Only strip known transient keys at the top level
			if (this === document && SKIP_KEYS.has(key)) return undefined;
			if (typeof value === 'bigint') {
				const numeric = Number(value);
				return Number.isSafeInteger(numeric)
					? numeric
					: { $fontFluxBigInt: value.toString() };
			}
			// TypedArrays (e.g. Uint8Array _raw) serialize as objects — convert to arrays
			if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
				return Array.from(value);
			}
			return value;
		},
		indent,
	);
}

/**
 * Deserialize a JSON string back into a font data object.
 * The resulting object can be passed directly to exportFont.
 *
 * @param {string} jsonString - JSON string produced by fontToJSON (or equivalent).
 * @returns {object} Font data object.
 */
export function fontFromJSON(jsonString) {
	const document = JSON.parse(jsonString, (_key, value) => {
		if (
			value &&
			typeof value === 'object' &&
			Object.keys(value).length === 1 &&
			typeof value.$fontFluxBigInt === 'string'
		) {
			if (!/^-?\d+$/.test(value.$fontFluxBigInt))
				throw new Error('Invalid exact integer encoding.');
			return BigInt(value.$fontFluxBigInt);
		}
		return value;
	});
	if (document?._schemaVersion !== undefined && document._schemaVersion !== 1)
		throw new Error(
			`Unsupported Font Flux JSON schema version: ${document._schemaVersion}`,
		);
	if (document && typeof document === 'object') delete document._schemaVersion;
	return document;
}
