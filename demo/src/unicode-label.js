import { getUnicodeName } from './unicode_definitions/index.js';

/**
 * Format a glyph's optional Unicode code point for preview tooltips.
 * @param {number | null | undefined} codePoint
 * @returns {string}
 */
export function formatUnicodeLabel(codePoint) {
	if (codePoint == null) return '';
	const code = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
	const name = getUnicodeName(codePoint);
	return name ? `${code} - ${name}` : code;
}
