import { describe, expect, it } from 'vitest';
import { formatUnicodeLabel } from '../demo/src/unicode-label.js';

describe('demo Unicode labels', () => {
	it.each([
		[0x41, 'U+0041 - LATIN CAPITAL LETTER A'],
		[0x20, 'U+0020 - SPACE'],
		[0x1f600, 'U+1F600 - GRINNING FACE'],
		[0x20000, 'U+20000 - CJK UNIFIED IDEOGRAPH-20000'],
		[0, 'U+0000'],
		[0x378, 'U+0378'],
		[0xe000, 'U+E000'],
		[0xffff, 'U+FFFF'],
		[null, ''],
		[undefined, ''],
	])('formats %s without inventing Unicode names', (codePoint, expected) => {
		expect(formatUnicodeLabel(codePoint)).toBe(expected);
	});
});
