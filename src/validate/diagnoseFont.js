// Re-use the import pipeline's table parser registry and parse order
import { tableParseOrder, tableParsers } from '../import.js';
import { DataReader } from '../reader.js';
import { unwrapWOFF1 } from '../woff/woff1.js';
import { unwrapWOFF2 } from '../woff/woff2.js';
import { ALL_SUPPORTED_TABLES, REQUIRED_CORE_TABLES } from './tables.js';

// =========================================================================
//  Known SFNT signatures
// =========================================================================

const SFNT_SIGNATURES = new Map([
	[0x00010000, 'TrueType'],
	[0x4f54544f, 'OpenType (CFF)'], // 'OTTO'
	[0x74727565, 'TrueType (Apple)'], // 'true'
]);

// =========================================================================
//  Helpers
// =========================================================================

function addIssue(list, severity, code, message) {
	list.push({ severity, code, message });
}

function buildReport(issues) {
	const errors = issues.filter((i) => i.severity === 'error');
	const warnings = issues.filter((i) => i.severity === 'warning');
	const infos = issues.filter((i) => i.severity === 'info');
	return {
		valid: errors.length === 0,
		errors,
		warnings,
		infos,
		issues,
		summary: {
			errorCount: errors.length,
			warningCount: warnings.length,
			infoCount: infos.length,
			issueCount: issues.length,
		},
	};
}

function isPrintableASCII(str) {
	for (let i = 0; i < str.length; i++) {
		const c = str.charCodeAt(i);
		if (c < 0x20 || c > 0x7e) return false;
	}
	return true;
}

/**
 * Compute the OpenType checksum for a table's raw bytes.
 * The checksum is the low 32 bits of the sum of uint32 values,
 * with the last partial word padded with zeroes.
 */
function computeChecksum(bytes, offset, length) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let sum = 0;
	const aligned = length & ~3;
	for (let i = 0; i < aligned; i += 4) {
		sum = (sum + view.getUint32(offset + i)) >>> 0;
	}
	// Pad the remaining bytes as a final uint32
	if (length & 3) {
		let last = 0;
		for (let i = aligned; i < length; i++) {
			last |= bytes[offset + i] << (24 - 8 * (i - aligned));
		}
		sum = (sum + last) >>> 0;
	}
	return sum;
}

// =========================================================================
//  Phase runners
// =========================================================================

/**
 * Phase 1: Buffer basics & format detection.
 * Returns the format string and the SFNT ArrayBuffer to continue with
 * (unwrapped if WOFF), or null if unrecoverable.
 */
function phaseSignature(buffer, issues) {
	if (!(buffer instanceof ArrayBuffer)) {
		addIssue(issues, 'error', 'NOT_ARRAYBUFFER', 'Input is not an ArrayBuffer.');
		return null;
	}
	if (buffer.byteLength < 12) {
		addIssue(
			issues,
			'error',
			'TOO_SHORT',
			`File is only ${buffer.byteLength} bytes — too short for a valid font header (minimum 12 bytes).`,
		);
		return null;
	}

	const bytes = new Uint8Array(buffer);
	const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);

	// WOFF1
	if (sig === 'wOFF') {
		addIssue(issues, 'info', 'FORMAT_WOFF1', 'File is WOFF1-wrapped.');
		validateWoff1Wrapper(buffer, issues);
		try {
			const { sfnt } = unwrapWOFF1(buffer);
			addIssue(
				issues,
				'info',
				'WOFF1_UNWRAPPED',
				'WOFF1 wrapper decompressed successfully.',
			);
			return { format: 'woff1', sfnt };
		} catch (err) {
			addIssue(
				issues,
				'error',
				'WOFF1_UNWRAP_FAILED',
				`WOFF1 decompression failed: ${err.message}`,
			);
			return null;
		}
	}

	// WOFF2
	if (sig === 'wOF2') {
		addIssue(issues, 'info', 'FORMAT_WOFF2', 'File is WOFF2-wrapped.');
		validateWoff2Wrapper(buffer, issues);
		try {
			const { sfnt } = unwrapWOFF2(buffer);
			addIssue(
				issues,
				'info',
				'WOFF2_UNWRAPPED',
				'WOFF2 wrapper decompressed successfully.',
			);
			return { format: 'woff2', sfnt };
		} catch (err) {
			addIssue(
				issues,
				'error',
				'WOFF2_UNWRAP_FAILED',
				`WOFF2 decompression failed: ${err.message}`,
			);
			return null;
		}
	}

	// TTC/OTC collection
	if (sig === 'ttcf') {
		addIssue(
			issues,
			'info',
			'FORMAT_COLLECTION',
			'File is a font collection (TTC/OTC). Diagnosing the first font in the collection.',
		);
		return { format: 'collection', sfnt: buffer };
	}

	// Plain SFNT
	return { format: 'sfnt', sfnt: buffer };
}

/**
 * Phase 2: Read and validate the SFNT header.
 */
function phaseHeader(sfnt, issues) {
	const bytes = new Uint8Array(sfnt);
	const reader = new DataReader(bytes);

	let header;
	try {
		header = {
			sfVersion: reader.uint32(),
			numTables: reader.uint16(),
			searchRange: reader.uint16(),
			entrySelector: reader.uint16(),
			rangeShift: reader.uint16(),
		};
	} catch (err) {
		addIssue(
			issues,
			'error',
			'HEADER_UNREADABLE',
			`Could not read font header: ${err.message}`,
		);
		return null;
	}

	// Validate sfVersion
	const sfVersionName = SFNT_SIGNATURES.get(header.sfVersion);
	if (sfVersionName) {
		addIssue(
			issues,
			'info',
			'SF_VERSION',
			`sfVersion indicates ${sfVersionName}.`,
		);
	} else {
		const hex = '0x' + header.sfVersion.toString(16).padStart(8, '0');
		addIssue(
			issues,
			'error',
			'BAD_SF_VERSION',
			`Unrecognized sfVersion ${hex}. Expected 0x00010000 (TrueType), 0x4F54544F (OTTO), or 0x74727565 ('true').`,
		);
	}

	// Validate numTables
	if (header.numTables === 0) {
		addIssue(
			issues,
			'error',
			'NO_TABLES',
			'numTables is 0 — the font contains no tables.',
		);
	} else if (header.numTables > 200) {
		addIssue(
			issues,
			'warning',
			'EXCESSIVE_TABLES',
			`numTables is ${header.numTables}, which is unusually high.`,
		);
	}

	// Check that the file is large enough for the table directory
	const directoryEnd = 12 + header.numTables * 16;
	if (directoryEnd > sfnt.byteLength) {
		addIssue(
			issues,
			'error',
			'DIRECTORY_TRUNCATED',
			`Table directory requires ${directoryEnd} bytes but the file is only ${sfnt.byteLength} bytes. The file appears truncated.`,
		);
		return null;
	}

	// Validate searchRange / entrySelector / rangeShift
	if (header.numTables > 0) {
		const maxPow2 = 2 ** Math.floor(Math.log2(header.numTables));
		const expectedSearchRange = maxPow2 * 16;
		const expectedEntrySelector = Math.floor(Math.log2(maxPow2));
		const expectedRangeShift = header.numTables * 16 - expectedSearchRange;

		if (header.searchRange !== expectedSearchRange) {
			addIssue(
				issues,
				'warning',
				'BAD_SEARCH_RANGE',
				`searchRange is ${header.searchRange}, expected ${expectedSearchRange}.`,
			);
		}
		if (header.entrySelector !== expectedEntrySelector) {
			addIssue(
				issues,
				'warning',
				'BAD_ENTRY_SELECTOR',
				`entrySelector is ${header.entrySelector}, expected ${expectedEntrySelector}.`,
			);
		}
		if (header.rangeShift !== expectedRangeShift) {
			addIssue(
				issues,
				'warning',
				'BAD_RANGE_SHIFT',
				`rangeShift is ${header.rangeShift}, expected ${expectedRangeShift}.`,
			);
		}
	}

	return header;
}

/**
 * Phase 3: Read and validate the table directory.
 */
function phaseDirectory(sfnt, header, issues) {
	const bytes = new Uint8Array(sfnt);
	const reader = new DataReader(bytes, 12); // skip header
	const entries = [];
	const seenTags = new Set();

	for (let i = 0; i < header.numTables; i++) {
		let entry;
		try {
			entry = {
				tag: reader.tag(),
				checksum: reader.uint32(),
				offset: reader.uint32(),
				length: reader.uint32(),
			};
		} catch (err) {
			addIssue(
				issues,
				'error',
				'DIRECTORY_ENTRY_UNREADABLE',
				`Could not read table directory entry ${i}: ${err.message}`,
			);
			continue;
		}

		// Validate tag
		if (!isPrintableASCII(entry.tag)) {
			const hex = [...entry.tag]
				.map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
				.join(' ');
			addIssue(
				issues,
				'error',
				'BAD_TABLE_TAG',
				`Table ${i} has non-printable tag bytes (${hex}).`,
			);
		}

		// Duplicate check
		if (seenTags.has(entry.tag)) {
			addIssue(
				issues,
				'error',
				'DUPLICATE_TABLE',
				`Duplicate table tag '${entry.tag}'.`,
			);
		}
		seenTags.add(entry.tag);

		// Bounds check
		if (entry.offset + entry.length > sfnt.byteLength) {
			addIssue(
				issues,
				'error',
				'TABLE_OUT_OF_BOUNDS',
				`Table '${entry.tag}' extends beyond end of file (offset ${entry.offset} + length ${entry.length} = ${entry.offset + entry.length}, but file is ${sfnt.byteLength} bytes).`,
			);
		}

		// Zero-length table
		if (entry.length === 0) {
			addIssue(
				issues,
				'warning',
				'EMPTY_TABLE',
				`Table '${entry.tag}' has zero length.`,
			);
		}

		// Alignment (tables should start on 4-byte boundaries per spec)
		if (entry.offset % 4 !== 0) {
			addIssue(
				issues,
				'warning',
				'TABLE_MISALIGNED',
				`Table '${entry.tag}' at offset ${entry.offset} is not 4-byte aligned.`,
			);
		}

		entries.push(entry);
	}

	// Spec: table directory entries must be sorted in ascending order by tag
	// (4-byte big-endian comparison).  Some sanitizers (e.g. Firefox/OTS)
	// reject fonts that violate this rule.
	for (let i = 1; i < entries.length; i++) {
		const prev = entries[i - 1].tag.padEnd(4, ' ');
		const curr = entries[i].tag.padEnd(4, ' ');
		if (prev >= curr) {
			addIssue(
				issues,
				'error',
				'DIRECTORY_NOT_SORTED',
				`Table directory is not sorted: '${entries[i - 1].tag}' precedes '${entries[i].tag}'. Tables must be sorted in ascending order by 4-byte tag.`,
			);
			break;
		}
	}

	// Tier 4: per-table 1 GiB cap (Firefox/OTS bails on huge tables).
	const ONE_GB = 1024 * 1024 * 1024;
	for (const e of entries) {
		if (e.length > ONE_GB) {
			addIssue(
				issues,
				'error',
				'TABLE_LENGTH_EXCEEDS_1GB',
				`Table '${e.tag}' has length ${e.length} bytes (> 1 GiB); Firefox/OTS will reject it.`,
			);
		}
	}

	// Tier 4: pairwise overlap detection.  We only consider tables with
	// non-zero length and offsets that fit in the file (other phases
	// already report out-of-bounds / empty tables).  Sort by offset so we
	// only need O(n) comparisons.
	const sortedByOffset = entries
		.filter((e) => e.length > 0 && e.offset + e.length <= sfnt.byteLength)
		.slice()
		.sort((a, b) => a.offset - b.offset);
	for (let i = 1; i < sortedByOffset.length; i++) {
		const prev = sortedByOffset[i - 1];
		const curr = sortedByOffset[i];
		const prevEnd = prev.offset + prev.length;
		if (prevEnd > curr.offset) {
			addIssue(
				issues,
				'error',
				'TABLES_OVERLAPPING',
				`Tables '${prev.tag}' and '${curr.tag}' overlap (${prev.tag} ends at ${prevEnd}, ${curr.tag} starts at ${curr.offset}).`,
			);
		}
	}

	return entries;
}

/**
 * Phase 4: Verify required tables and outline presence.
 */
function phaseRequiredTables(entries, issues) {
	const tags = new Set(entries.map((e) => e.tag));

	for (const req of REQUIRED_CORE_TABLES) {
		if (!tags.has(req)) {
			addIssue(
				issues,
				'error',
				'MISSING_REQUIRED_TABLE',
				`Required table '${req}' is missing.`,
			);
		}
	}

	const hasGlyf = tags.has('glyf') && tags.has('loca');
	const hasCFF = tags.has('CFF ') || tags.has('CFF2');
	if (!hasGlyf && !hasCFF) {
		addIssue(
			issues,
			'error',
			'NO_OUTLINES',
			'No outline data found. Expected glyf+loca (TrueType) or CFF/CFF2 (OpenType).',
		);
	}
	if (hasGlyf && hasCFF) {
		addIssue(
			issues,
			'warning',
			'MIXED_OUTLINES',
			'Font has both TrueType (glyf) and CFF outlines — unusual.',
		);
	}

	// Note unrecognized tables
	for (const tag of tags) {
		if (!ALL_SUPPORTED_TABLES.has(tag)) {
			addIssue(
				issues,
				'info',
				'UNKNOWN_TABLE',
				`Unrecognized table '${tag}' — will be preserved as raw bytes.`,
			);
		}
	}
}

/**
 * Phase 5: Table checksum verification.
 */
function phaseChecksums(sfnt, entries, issues) {
	const bytes = new Uint8Array(sfnt);

	for (const entry of entries) {
		if (entry.offset + entry.length > sfnt.byteLength) continue; // already flagged
		if (entry.length === 0) continue;

		// head table has a special checksumAdjustment field — skip verification
		if (entry.tag === 'head') continue;

		const actual = computeChecksum(bytes, entry.offset, entry.length);
		if (actual !== entry.checksum) {
			addIssue(
				issues,
				'warning',
				'BAD_CHECKSUM',
				`Table '${entry.tag}' checksum mismatch: directory says 0x${entry.checksum.toString(16).padStart(8, '0')}, computed 0x${actual.toString(16).padStart(8, '0')}.`,
			);
		}
	}
}

/**
 * Phase 6: Try to parse each table, catching per-table errors.
 */
function phaseParseTables(sfnt, entries, issues) {
	const entryByTag = new Map(entries.map((e) => [e.tag, e]));
	const parsedTables = {};

	// Sort: parse-order first, then remaining
	const orderedTags = tableParseOrder.filter((tag) => entryByTag.has(tag));
	const remainingTags = entries
		.map((e) => e.tag)
		.filter((tag) => !orderedTags.includes(tag));
	const sortedTags = [...orderedTags, ...remainingTags];

	for (const tag of sortedTags) {
		const entry = entryByTag.get(tag);
		if (entry.offset + entry.length > sfnt.byteLength) continue; // already flagged

		const parser = tableParsers[tag];
		if (!parser) continue; // no parser for this table

		try {
			const raw = new Uint8Array(sfnt, entry.offset, entry.length);
			const rawArray = Array.from(raw);
			parsedTables[tag] = parser(rawArray, parsedTables);
			addIssue(
				issues,
				'info',
				'TABLE_PARSED',
				`Table '${tag}' parsed successfully.`,
			);
		} catch (err) {
			addIssue(
				issues,
				'error',
				'TABLE_PARSE_FAILED',
				`Table '${tag}' failed to parse: ${err.message}`,
			);
		}
	}

	return parsedTables;
}

// =========================================================================
//  cmap deep validation (Tier 2 — Firefox/OTS parity)
// =========================================================================

/**
 * Valid Unicode variation-selector ranges (cmap format 14).
 * Mongolian Free Variation Selectors: 0x180B–0x180D
 * Variation Selectors (VS1–VS16):     0xFE00–0xFE0F
 * Variation Selectors Supplement:     0xE0100–0xE01EF (VS17–VS256)
 */
function isValidVariationSelector(cp) {
	if (cp >= 0x180b && cp <= 0x180d) return true;
	if (cp >= 0xfe00 && cp <= 0xfe0f) return true;
	if (cp >= 0xe0100 && cp <= 0xe01ef) return true;
	return false;
}

/**
 * Compute the maximum glyph ID a cmap format-4 segment can produce.
 * Returns null when the segment uses idRangeOffset (we'd need the raw
 * glyphIdArray to walk it, but the parser already inlines mappings into
 * `glyphIdArray`; deep walking is left to a future tier).
 */
function format4MaxGlyphId(seg) {
	if (seg.idRangeOffset === 0) {
		// Direct mapping: glyph = (charCode + idDelta) & 0xFFFF
		const lo = (seg.startCode + seg.idDelta) & 0xffff;
		const hi = (seg.endCode + seg.idDelta) & 0xffff;
		return Math.max(lo, hi);
	}
	return null;
}

function validateCmapDeep(cmap, maxp, issues) {
	// Per spec, cmap.version must be 0.
	if (typeof cmap.version === 'number' && cmap.version !== 0) {
		addIssue(
			issues,
			'error',
			'CMAP_VERSION_INVALID',
			`cmap.version is ${cmap.version}; must be 0.`,
		);
	}

	const recs = cmap.encodingRecords || [];
	const subs = cmap.subtables || [];

	if (recs.length === 0) {
		addIssue(
			issues,
			'error',
			'CMAP_NO_SUBTABLES',
			'cmap has no encoding records.',
		);
		return;
	}

	// Firefox requires at least one of the well-known Unicode subtables:
	//   (3, 1, 4)   Windows Unicode BMP
	//   (3, 10, 12) Windows Unicode full
	//   (0, 3, 4)   Unicode BMP
	//   (3, 0, 4)   Symbol
	//   (3, 10, 13) Windows Unicode full (last-resort)
	let hasSupported = false;
	for (const r of recs) {
		const sub = subs[r.subtableIndex];
		if (!sub) continue;
		const fmt = sub.format;
		const key = `${r.platformID}-${r.encodingID}-${fmt}`;
		if (
			key === '3-1-4' ||
			key === '3-10-12' ||
			key === '3-10-13' ||
			key === '0-3-4' ||
			key === '3-0-4'
		) {
			hasSupported = true;
			break;
		}
	}
	if (!hasSupported) {
		addIssue(
			issues,
			'error',
			'CMAP_NO_SUPPORTED_SUBTABLE',
			'cmap has no supported Unicode subtable (expected one of (3,1,4), (3,10,12), (3,10,13), (0,3,4), or (3,0,4)).',
		);
	}

	// Windows-platform subtables (platformID 3) must use language = 0.
	for (const r of recs) {
		if (r.platformID !== 3) continue;
		const sub = subs[r.subtableIndex];
		if (!sub) continue;
		if (sub.language !== undefined && sub.language !== 0) {
			addIssue(
				issues,
				'error',
				'CMAP_LANGUAGE_NONZERO_FOR_WINDOWS',
				`cmap subtable (pid=3, eid=${r.encodingID}, fmt=${sub.format}) has language=${sub.language}; Windows-platform subtables must use language=0.`,
			);
			break;
		}
	}

	const numGlyphs = maxp?.numGlyphs;

	// Per-subtable structural checks.
	for (let s = 0; s < subs.length; s++) {
		const sub = subs[s];
		if (!sub) continue;
		const fmt = sub.format;

		if (fmt === 4) {
			const segs = sub.segments || [];
			if (segs.length < 1) {
				addIssue(
					issues,
					'error',
					'CMAP_FORMAT4_SEGCOUNT_INVALID',
					`cmap format-4 subtable ${s} has no segments.`,
				);
				continue;
			}
			// Final segment must be 0xFFFF–0xFFFF.
			const last = segs[segs.length - 1];
			if (last.startCode !== 0xffff || last.endCode !== 0xffff) {
				addIssue(
					issues,
					'error',
					'CMAP_FORMAT4_INVALID_TERMINATOR',
					`cmap format-4 subtable ${s}: final segment is [${last.startCode.toString(16)}-${last.endCode.toString(16)}], must be [FFFF-FFFF].`,
				);
			}
			// Range ordering: each segment must have startCode <= endCode,
			// and segments must be non-overlapping in ascending order.
			let prevEnd = -1;
			for (let i = 0; i < segs.length; i++) {
				const seg = segs[i];
				if (seg.startCode > seg.endCode) {
					addIssue(
						issues,
						'error',
						'CMAP_FORMAT4_RANGES_OUT_OF_ORDER',
						`cmap format-4 subtable ${s} segment ${i}: startCode (0x${seg.startCode.toString(16)}) > endCode (0x${seg.endCode.toString(16)}).`,
					);
					break;
				}
				if (seg.endCode <= prevEnd) {
					addIssue(
						issues,
						'error',
						'CMAP_FORMAT4_RANGES_OUT_OF_ORDER',
						`cmap format-4 subtable ${s} segment ${i}: endCode (0x${seg.endCode.toString(16)}) is not greater than previous endCode (0x${prevEnd.toString(16)}).`,
					);
					break;
				}
				prevEnd = seg.endCode;
			}
			// Glyph-out-of-range (best-effort: only direct-mapping segments).
			if (numGlyphs !== undefined) {
				let flagged = false;
				for (let i = 0; i < segs.length && !flagged; i++) {
					const seg = segs[i];
					// Skip the 0xFFFF terminator segment, whose mapped glyph
					// is conventionally 0 via wraparound.
					if (seg.startCode === 0xffff && seg.endCode === 0xffff) continue;
					const maxGid = format4MaxGlyphId(seg);
					if (maxGid !== null && maxGid >= numGlyphs) {
						addIssue(
							issues,
							'error',
							'CMAP_GLYPH_OUT_OF_RANGE',
							`cmap format-4 subtable ${s} segment ${i}: glyph id ${maxGid} >= numGlyphs (${numGlyphs}).`,
						);
						flagged = true;
					}
				}
				// Also walk the inlined glyphIdArray for any explicit overflows.
				const gids = sub.glyphIdArray || [];
				for (let i = 0; i < gids.length && !flagged; i++) {
					if (gids[i] !== 0 && gids[i] >= numGlyphs) {
						addIssue(
							issues,
							'error',
							'CMAP_GLYPH_OUT_OF_RANGE',
							`cmap format-4 subtable ${s} glyphIdArray[${i}] = ${gids[i]} >= numGlyphs (${numGlyphs}).`,
						);
						flagged = true;
					}
				}
			}
		} else if (fmt === 12 || fmt === 13) {
			const groups = sub.groups || [];
			let prevEnd = -1;
			let flaggedRange = false;
			let flaggedGid = false;
			for (let i = 0; i < groups.length; i++) {
				const g = groups[i];
				if (g.endCharCode < g.startCharCode && !flaggedRange) {
					addIssue(
						issues,
						'error',
						'CMAP_FORMAT12_END_BEFORE_START',
						`cmap format-${fmt} subtable ${s} group ${i}: endCharCode (0x${g.endCharCode.toString(16)}) < startCharCode (0x${g.startCharCode.toString(16)}).`,
					);
					flaggedRange = true;
					break;
				}
				if (g.startCharCode <= prevEnd && !flaggedRange) {
					addIssue(
						issues,
						'error',
						'CMAP_FORMAT12_GROUPS_OUT_OF_ORDER',
						`cmap format-${fmt} subtable ${s} group ${i}: startCharCode (0x${g.startCharCode.toString(16)}) is not greater than previous endCharCode (0x${prevEnd.toString(16)}).`,
					);
					flaggedRange = true;
					break;
				}
				prevEnd = g.endCharCode;
				if (numGlyphs !== undefined && !flaggedGid) {
					if (fmt === 12) {
						const span = g.endCharCode - g.startCharCode;
						const lastGid = g.startGlyphID + span;
						if (lastGid >= numGlyphs) {
							addIssue(
								issues,
								'error',
								'CMAP_GLYPH_OUT_OF_RANGE',
								`cmap format-12 subtable ${s} group ${i}: maps to glyph id ${lastGid} >= numGlyphs (${numGlyphs}).`,
							);
							flaggedGid = true;
						}
					} else if (fmt === 13) {
						if (g.glyphID >= numGlyphs) {
							addIssue(
								issues,
								'error',
								'CMAP_GLYPH_OUT_OF_RANGE',
								`cmap format-13 subtable ${s} group ${i}: glyphID ${g.glyphID} >= numGlyphs (${numGlyphs}).`,
							);
							flaggedGid = true;
						}
					}
				}
			}
		} else if (fmt === 14) {
			const records = sub.varSelectorRecords || [];
			let prev = -1;
			let flaggedOrder = false;
			let flaggedRange = false;
			for (let i = 0; i < records.length; i++) {
				const r = records[i];
				if (!isValidVariationSelector(r.varSelector) && !flaggedRange) {
					addIssue(
						issues,
						'error',
						'CMAP_FORMAT14_VS_OUT_OF_RANGE',
						`cmap format-14 subtable ${s} record ${i}: varSelector U+${r.varSelector.toString(16).toUpperCase()} is not in a valid variation-selector range.`,
					);
					flaggedRange = true;
					break;
				}
				if (r.varSelector <= prev && !flaggedOrder) {
					addIssue(
						issues,
						'error',
						'CMAP_FORMAT14_VS_OUT_OF_ORDER',
						`cmap format-14 subtable ${s} record ${i}: varSelector U+${r.varSelector.toString(16).toUpperCase()} is not greater than previous (U+${prev.toString(16).toUpperCase()}).`,
					);
					flaggedOrder = true;
					break;
				}
				prev = r.varSelector;
				// Glyph-out-of-range for non-default UVS mappings.
				if (numGlyphs !== undefined && r.nonDefaultUVS) {
					for (const m of r.nonDefaultUVS) {
						if (m.glyphID >= numGlyphs) {
							addIssue(
								issues,
								'error',
								'CMAP_GLYPH_OUT_OF_RANGE',
								`cmap format-14 subtable ${s} record ${i}: nonDefaultUVS mapping has glyphID ${m.glyphID} >= numGlyphs (${numGlyphs}).`,
							);
							break;
						}
					}
				}
			}
		}
	}
}

// =========================================================================
//  OS/2 sanitization (Tier 3 — Firefox/OTS parity)
//
//  OTS treats most of these as Warning() with silent auto-fix (clamp or
//  bit-mask).  FFJS reports them at `warning` severity so they're visible
//  but don't block export.  Future work: thread an `autoFix` option that
//  mutates the parsed table in-place.
// =========================================================================

/**
 * Mask of valid OS/2 fsType bits per spec: bits 0–3 (embedding levels),
 * bits 8 (no-subset) and 9 (bitmap-only).  All other bits are reserved
 * and OTS silently strips them.
 */
const OS2_FSTYPE_VALID_MASK = 0x030f;

/**
 * Mask of valid head.macStyle bits: 0..6 per spec.
 */
const HEAD_MACSTYLE_VALID_MASK = 0x007f;

function validateOS2Sanitization(os2, head, issues) {
	// usWeightClass must be in [1, 1000].
	if (typeof os2.usWeightClass === 'number') {
		if (os2.usWeightClass < 1 || os2.usWeightClass > 1000) {
			addIssue(
				issues,
				'warning',
				'OS2_WEIGHT_CLAMPED',
				`OS/2.usWeightClass is ${os2.usWeightClass}; must be in [1, 1000].`,
			);
		}
	}

	// usWidthClass must be in [1, 9].
	if (typeof os2.usWidthClass === 'number') {
		if (os2.usWidthClass < 1 || os2.usWidthClass > 9) {
			addIssue(
				issues,
				'warning',
				'OS2_WIDTH_CLAMPED',
				`OS/2.usWidthClass is ${os2.usWidthClass}; must be in [1, 9].`,
			);
		}
	}

	// fsType reserved bits — anything outside 0x030F is invalid.
	if (typeof os2.fsType === 'number') {
		if ((os2.fsType & ~OS2_FSTYPE_VALID_MASK) !== 0) {
			addIssue(
				issues,
				'warning',
				'OS2_FSTYPE_RESERVED_BITS_SET',
				`OS/2.fsType has reserved bits set (0x${(os2.fsType >>> 0).toString(16).padStart(4, '0')}); valid mask is 0x${OS2_FSTYPE_VALID_MASK.toString(16).padStart(4, '0')}.`,
			);
		}
	}

	// Sub/super-script and strikeout sizes must be non-negative.
	const NON_NEGATIVE_SIZE_FIELDS = [
		'ySubscriptXSize',
		'ySubscriptYSize',
		'ySuperscriptXSize',
		'ySuperscriptYSize',
		'yStrikeoutSize',
	];
	for (const f of NON_NEGATIVE_SIZE_FIELDS) {
		if (typeof os2[f] === 'number' && os2[f] < 0) {
			addIssue(
				issues,
				'warning',
				'OS2_NEGATIVE_SIZE',
				`OS/2.${f} is ${os2[f]}; must be ≥ 0.`,
			);
			break; // one report per font is enough
		}
	}

	// usFirstCharIndex must be ≤ usLastCharIndex.
	if (
		typeof os2.usFirstCharIndex === 'number' &&
		typeof os2.usLastCharIndex === 'number' &&
		os2.usFirstCharIndex > os2.usLastCharIndex
	) {
		addIssue(
			issues,
			'warning',
			'OS2_FIRST_LAST_CHAR_INVERTED',
			`OS/2.usFirstCharIndex (${os2.usFirstCharIndex}) > usLastCharIndex (${os2.usLastCharIndex}).`,
		);
	}

	// sTypoLineGap must be non-negative.
	if (typeof os2.sTypoLineGap === 'number' && os2.sTypoLineGap < 0) {
		addIssue(
			issues,
			'warning',
			'OS2_TYPO_LINEGAP_NEGATIVE',
			`OS/2.sTypoLineGap is ${os2.sTypoLineGap}; must be ≥ 0.`,
		);
	}

	// sxHeight / sCapHeight must be non-negative when present (v2+).
	if (typeof os2.sxHeight === 'number' && os2.sxHeight < 0) {
		addIssue(
			issues,
			'warning',
			'OS2_X_HEIGHT_NEGATIVE',
			`OS/2.sxHeight is ${os2.sxHeight}; must be ≥ 0.`,
		);
	}
	if (typeof os2.sCapHeight === 'number' && os2.sCapHeight < 0) {
		addIssue(
			issues,
			'warning',
			'OS2_CAP_HEIGHT_NEGATIVE',
			`OS/2.sCapHeight is ${os2.sCapHeight}; must be ≥ 0.`,
		);
	}

	// Optical-point-size range: lower must be ≤ 0xFFFE, upper must be ≥ 2.
	// Only meaningful for v5.
	if (
		typeof os2.usLowerOpticalPointSize === 'number' &&
		os2.usLowerOpticalPointSize > 0xfffe
	) {
		addIssue(
			issues,
			'warning',
			'OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE',
			`OS/2.usLowerOpticalPointSize is ${os2.usLowerOpticalPointSize}; must be ≤ 0xFFFE.`,
		);
	}
	if (
		typeof os2.usUpperOpticalPointSize === 'number' &&
		os2.usUpperOpticalPointSize < 2
	) {
		addIssue(
			issues,
			'warning',
			'OS2_OPTICAL_POINTSIZE_OUT_OF_RANGE',
			`OS/2.usUpperOpticalPointSize is ${os2.usUpperOpticalPointSize}; must be ≥ 2.`,
		);
	}

	// fsSelection ↔ head.macStyle italic/bold/regular consistency.
	// fsSelection bits: 0 = italic, 5 = bold, 6 = regular.
	// macStyle bits:    0 = bold,   1 = italic.
	if (
		head &&
		typeof os2.fsSelection === 'number' &&
		typeof head.macStyle === 'number'
	) {
		const fsItalic = (os2.fsSelection & 0x01) !== 0;
		const fsBold = (os2.fsSelection & 0x20) !== 0;
		const msBold = (head.macStyle & 0x01) !== 0;
		const msItalic = (head.macStyle & 0x02) !== 0;
		if (fsItalic !== msItalic || fsBold !== msBold) {
			addIssue(
				issues,
				'warning',
				'OS2_FSSELECTION_HEAD_MACSTYLE_MISMATCH',
				`OS/2.fsSelection (italic=${fsItalic}, bold=${fsBold}) does not match head.macStyle (italic=${msItalic}, bold=${msBold}).`,
			);
		}

		// head.macStyle reserved bits (anything beyond bits 0..6) must be 0.
		if ((head.macStyle & ~HEAD_MACSTYLE_VALID_MASK) !== 0) {
			addIssue(
				issues,
				'warning',
				'HEAD_MACSTYLE_RESERVED_BITS_SET',
				`head.macStyle has reserved bits set (0x${head.macStyle.toString(16).padStart(4, '0')}); valid mask is 0x${HEAD_MACSTYLE_VALID_MASK.toString(16).padStart(4, '0')}.`,
			);
		}
	}
}

// =========================================================================
//  name table deep validation (Tier 5 — Firefox/OTS parity)
// =========================================================================

/**
 * Maximum byte length OTS allows for a single name record string or
 * language-tag.  Firefox/OTS uses 32 KiB; the spec doesn't impose a hard
 * limit but anything beyond a few KB is suspicious.
 */
const NAME_STRING_MAX_BYTES = 32 * 1024;

/**
 * Maximum byte length OTS allows for a language-tag string (200 bytes per
 * the OpenType spec recommendation).
 */
const NAME_LANG_TAG_MAX_BYTES = 200;

/**
 * Characters disallowed in a PostScript name (nameID 6) per the spec:
 * `[`, `]`, `(`, `)`, `{`, `}`, `<`, `>`, `/`, `%`, plus anything outside
 * printable 7-bit ASCII (0x21–0x7E).
 */
const POSTSCRIPT_NAME_INVALID_CHARS = /[\x00-\x20\x7F-\uFFFF[\](){}<>/%]/;

function validateNameDeep(name, entries, sfnt, issues) {
	// 1. Format must be 0 or 1.  Parser exposes it as `version`.
	if (typeof name.version === 'number' && name.version > 1) {
		addIssue(
			issues,
			'error',
			'NAME_FORMAT_INVALID',
			`name table format is ${name.version}; must be 0 or 1.`,
		);
	}

	// 2. Walk raw bytes to verify stringOffset and per-record bounds.
	const entry = entries.find((e) => e.tag === 'name');
	if (
		entry &&
		entry.length >= 6 &&
		entry.offset + entry.length <= sfnt.byteLength
	) {
		const raw = new DataView(sfnt, entry.offset, entry.length);
		const count = raw.getUint16(2);
		const storageOffset = raw.getUint16(4);

		// Header is 6 bytes; each name record is 12 bytes.
		const recordsEnd = 6 + count * 12;
		if (storageOffset < recordsEnd || storageOffset > entry.length) {
			addIssue(
				issues,
				'error',
				'NAME_STRING_OFFSET_INVALID',
				`name.stringOffset (${storageOffset}) is outside the table (records end at ${recordsEnd}, table length ${entry.length}).`,
			);
		}

		// Per-record bounds.  We stop after the first violation per record
		// type (length vs. offset) to avoid noisy reports.
		let outOfBoundsReported = false;
		const recCount = Math.min(count, Math.floor((entry.length - 6) / 12));
		for (let i = 0; i < recCount; i++) {
			const recOff = 6 + i * 12;
			const length = raw.getUint16(recOff + 8);
			const stringOffset = raw.getUint16(recOff + 10);
			const start = storageOffset + stringOffset;
			const end = start + length;
			if (end > entry.length) {
				if (!outOfBoundsReported) {
					addIssue(
						issues,
						'error',
						'NAME_RECORD_OUT_OF_BOUNDS',
						`name record ${i} string overruns the table (offset ${start} + length ${length} = ${end}, table length ${entry.length}).`,
					);
					outOfBoundsReported = true;
				}
			}
			if (length > NAME_STRING_MAX_BYTES) {
				addIssue(
					issues,
					'warning',
					'NAME_STRING_TOO_LONG',
					`name record ${i} (nameID=${raw.getUint16(recOff + 6)}) is ${length} bytes; > ${NAME_STRING_MAX_BYTES} is suspicious.`,
				);
			}
		}
	}

	// 3. Language-tag records (format 1 only): each tag must be ≤ 200 bytes.
	if (Array.isArray(name.langTagRecords)) {
		for (let i = 0; i < name.langTagRecords.length; i++) {
			const tag = name.langTagRecords[i].tag ?? '';
			// Each char in a UTF-16BE string is 2 bytes on the wire.
			const byteLen = tag.length * 2;
			if (byteLen > NAME_LANG_TAG_MAX_BYTES) {
				addIssue(
					issues,
					'error',
					'NAME_LANG_TAG_TOO_LONG',
					`name.langTagRecord ${i} is ${byteLen} bytes; spec limit is ${NAME_LANG_TAG_MAX_BYTES}.`,
				);
			}
		}
	}

	// 4. PostScript name (nameID 6) must use only printable 7-bit ASCII
	// excluding `[`, `]`, `(`, `)`, `{`, `}`, `<`, `>`, `/`, `%`.
	const records = name.nameRecords ?? name.names ?? name.records ?? [];
	for (const rec of records) {
		if (rec.nameID !== 6) continue;
		const value = rec.value ?? rec.string ?? '';
		if (typeof value !== 'string') continue;
		if (POSTSCRIPT_NAME_INVALID_CHARS.test(value)) {
			addIssue(
				issues,
				'warning',
				'NAME_POSTSCRIPT_NAME_INVALID_CHARS',
				`PostScript name "${value}" contains invalid characters; only printable 7-bit ASCII excluding [](){}<>/% is allowed.`,
			);
			break; // one report per font is enough
		}
	}
}

// =========================================================================
//  WOFF1/WOFF2 wrapper integrity (Tier 6 — Firefox/OTS parity)
// =========================================================================

const WOFF1_HEADER_SIZE = 44;
const WOFF1_DIR_ENTRY_SIZE = 20;
const WOFF2_HEADER_SIZE = 48;

function validateWoff1Wrapper(buffer, issues) {
	if (buffer.byteLength < WOFF1_HEADER_SIZE) return;
	const view = new DataView(buffer);
	const length = view.getUint32(8);
	const numTables = view.getUint16(12);
	const reserved = view.getUint16(14);
	const totalSfntSize = view.getUint32(16);
	const metaOffset = view.getUint32(24);
	const metaLength = view.getUint32(28);
	const privOffset = view.getUint32(36);
	const privLength = view.getUint32(40);

	// Reserved field must be 0.
	if (reserved !== 0) {
		addIssue(
			issues,
			'error',
			'WOFF1_RESERVED_FIELD_NONZERO',
			`WOFF1 header reserved field is 0x${reserved.toString(16)}; must be 0.`,
		);
	}

	// Total file size declared in header must match the actual buffer.
	if (length !== buffer.byteLength) {
		addIssue(
			issues,
			'error',
			'WOFF1_FILE_SIZE_MISMATCH',
			`WOFF1 header.length (${length}) does not match file size (${buffer.byteLength}).`,
		);
	}

	// Compute expected uncompressed SFNT size from the directory and compare
	// against header.totalSfntSize.  SFNT size = 12 (offset table)
	// + 16 * numTables (table directory) + sum of origLength padded to 4.
	const dirEnd = WOFF1_HEADER_SIZE + numTables * WOFF1_DIR_ENTRY_SIZE;
	if (dirEnd <= buffer.byteLength) {
		let sfntSize = 12 + 16 * numTables;
		for (let i = 0; i < numTables; i++) {
			const origLength = view.getUint32(
				WOFF1_HEADER_SIZE + i * WOFF1_DIR_ENTRY_SIZE + 12,
			);
			sfntSize += (origLength + 3) & ~3;
		}
		if (sfntSize !== totalSfntSize) {
			addIssue(
				issues,
				'error',
				'WOFF1_SFNT_SIZE_MISMATCH',
				`WOFF1 header.totalSfntSize (${totalSfntSize}) does not match computed size from directory (${sfntSize}).`,
			);
		}
	}

	// Metadata block: offset+length must be in-bounds and consistent.
	if ((metaOffset === 0) !== (metaLength === 0)) {
		addIssue(
			issues,
			'error',
			'WOFF1_METADATA_BLOCK_INVALID',
			`WOFF1 metadata block has inconsistent offset/length (offset=${metaOffset}, length=${metaLength}); both must be zero or both non-zero.`,
		);
	} else if (metaLength > 0) {
		if (metaOffset < dirEnd || metaOffset + metaLength > buffer.byteLength) {
			addIssue(
				issues,
				'error',
				'WOFF1_METADATA_BLOCK_INVALID',
				`WOFF1 metadata block (offset ${metaOffset}, length ${metaLength}) is out of bounds (file size ${buffer.byteLength}, directory ends at ${dirEnd}).`,
			);
		}
	}

	// Private block: same rules.
	if ((privOffset === 0) !== (privLength === 0)) {
		addIssue(
			issues,
			'error',
			'WOFF1_PRIVATE_BLOCK_INVALID',
			`WOFF1 private block has inconsistent offset/length (offset=${privOffset}, length=${privLength}); both must be zero or both non-zero.`,
		);
	} else if (privLength > 0) {
		if (privOffset < dirEnd || privOffset + privLength > buffer.byteLength) {
			addIssue(
				issues,
				'error',
				'WOFF1_PRIVATE_BLOCK_INVALID',
				`WOFF1 private block (offset ${privOffset}, length ${privLength}) is out of bounds (file size ${buffer.byteLength}, directory ends at ${dirEnd}).`,
			);
		}
	}

	// Detect trailing junk: the last byte consumed should equal length.
	// Last block is the latest of: end of last table, end of meta, end of priv.
	let lastEnd = dirEnd;
	if (dirEnd <= buffer.byteLength) {
		for (let i = 0; i < numTables; i++) {
			const off = view.getUint32(WOFF1_HEADER_SIZE + i * WOFF1_DIR_ENTRY_SIZE + 4);
			const compLen = view.getUint32(
				WOFF1_HEADER_SIZE + i * WOFF1_DIR_ENTRY_SIZE + 8,
			);
			const padded = (off + compLen + 3) & ~3;
			if (padded > lastEnd) lastEnd = padded;
		}
	}
	if (metaLength > 0) {
		const padded = (metaOffset + metaLength + 3) & ~3;
		if (padded > lastEnd) lastEnd = padded;
	}
	if (privLength > 0) {
		// Spec says private data is the last block and is NOT padded.
		const end = privOffset + privLength;
		if (end > lastEnd) lastEnd = end;
	}
	if (lastEnd > 0 && lastEnd < buffer.byteLength) {
		const trailing = buffer.byteLength - lastEnd;
		// Allow up to 3 bytes of zero-padding trailing garbage; anything more
		// is suspicious.
		if (trailing > 3) {
			addIssue(
				issues,
				'warning',
				'WOFF1_TRAILING_JUNK',
				`WOFF1 file has ${trailing} bytes of trailing data after the last block (ends at ${lastEnd}, file size ${buffer.byteLength}).`,
			);
		}
	}
}

function validateWoff2Wrapper(buffer, issues) {
	if (buffer.byteLength < WOFF2_HEADER_SIZE) return;
	const view = new DataView(buffer);
	const length = view.getUint32(8);
	const reserved = view.getUint16(14);
	const totalSfntSize = view.getUint32(16);
	const totalCompressedSize = view.getUint32(20);

	if (reserved !== 0) {
		addIssue(
			issues,
			'error',
			'WOFF2_RESERVED_FIELD_NONZERO',
			`WOFF2 header reserved field is 0x${reserved.toString(16)}; must be 0.`,
		);
	}
	if (length !== buffer.byteLength) {
		addIssue(
			issues,
			'error',
			'WOFF2_FILE_SIZE_MISMATCH',
			`WOFF2 header.length (${length}) does not match file size (${buffer.byteLength}).`,
		);
	}
	// totalSfntSize must be plausible — at minimum > 12 (SFNT header).
	if (totalSfntSize < 12) {
		addIssue(
			issues,
			'error',
			'WOFF2_DECOMPRESSED_SIZE_INVALID',
			`WOFF2 header.totalSfntSize (${totalSfntSize}) is too small to be a valid SFNT.`,
		);
	}
	// totalCompressedSize must fit in the file.
	if (totalCompressedSize > buffer.byteLength) {
		addIssue(
			issues,
			'error',
			'WOFF2_DECOMPRESSED_SIZE_INVALID',
			`WOFF2 header.totalCompressedSize (${totalCompressedSize}) exceeds file size (${buffer.byteLength}).`,
		);
	}
}

// =========================================================================
//  fvar / GSUB / GPOS deep validation (Tier 7 — Firefox/OTS parity)
// =========================================================================

const LAYOUT_LOOKUP_FLAG_VALID_MASK = 0x00ff;
const LAYOUT_LOOKUP_FLAG_RESERVED_MASK = 0x00e0;

function validateFvarDeep(fvar, issues) {
	const axes = fvar.axes ?? [];
	const seenTags = new Set();
	for (let i = 0; i < axes.length; i++) {
		const a = axes[i];
		if (!(a.minValue <= a.defaultValue && a.defaultValue <= a.maxValue)) {
			addIssue(
				issues,
				'error',
				'FVAR_AXIS_RANGE_INVALID',
				`fvar axis '${a.axisTag}' violates min ≤ default ≤ max (min=${a.minValue}, default=${a.defaultValue}, max=${a.maxValue}).`,
			);
		}
		if (seenTags.has(a.axisTag)) {
			addIssue(
				issues,
				'error',
				'FVAR_AXIS_DUPLICATE_TAG',
				`fvar has multiple axes with tag '${a.axisTag}'.`,
			);
		} else {
			seenTags.add(a.axisTag);
		}
	}

	const instances = fvar.instances ?? [];
	for (let i = 0; i < instances.length; i++) {
		const inst = instances[i];
		const coords = inst.coordinates ?? inst.coords ?? [];
		// Coordinates align with axes index-wise.
		for (let j = 0; j < Math.min(coords.length, axes.length); j++) {
			const v = coords[j];
			const a = axes[j];
			if (typeof v !== 'number' || v < a.minValue || v > a.maxValue) {
				addIssue(
					issues,
					'error',
					'FVAR_INSTANCE_OUT_OF_RANGE',
					`fvar instance ${i} coordinate for axis '${a.axisTag}' is ${v}, outside axis range [${a.minValue}, ${a.maxValue}].`,
				);
				break; // one report per instance is enough
			}
		}
	}
}

function validateLayoutLookups(layoutTable, tableName, issues) {
	const lookups = layoutTable?.lookupList?.lookups ?? [];
	const minType = 1;
	const maxType = tableName === 'GSUB' ? 8 : 9;
	let invalidTypeReported = false;
	let invalidFlagReported = false;
	for (let i = 0; i < lookups.length; i++) {
		const lk = lookups[i];
		if (
			typeof lk.lookupType !== 'number' ||
			lk.lookupType < minType ||
			lk.lookupType > maxType
		) {
			if (!invalidTypeReported) {
				addIssue(
					issues,
					'error',
					`${tableName}_LOOKUP_TYPE_INVALID`,
					`${tableName} lookup ${i} has invalid lookupType ${lk.lookupType}; must be in [${minType}, ${maxType}].`,
				);
				invalidTypeReported = true;
			}
		}
		if (
			typeof lk.lookupFlag === 'number' &&
			(lk.lookupFlag & LAYOUT_LOOKUP_FLAG_RESERVED_MASK) !== 0 &&
			!invalidFlagReported
		) {
			addIssue(
				issues,
				'warning',
				'LAYOUT_LOOKUP_FLAG_RESERVED',
				`${tableName} lookup ${i} has reserved bits set in lookupFlag (0x${lk.lookupFlag
					.toString(16)
					.padStart(
						4,
						'0',
					)}); reserved mask is 0x${LAYOUT_LOOKUP_FLAG_RESERVED_MASK.toString(16).padStart(4, '0')}.`,
			);
			invalidFlagReported = true;
		}
		// Bits above 0x00FF should never be set in a lookupFlag uint16.
		if (
			typeof lk.lookupFlag === 'number' &&
			(lk.lookupFlag & ~LAYOUT_LOOKUP_FLAG_VALID_MASK & 0xffff) !== 0
		) {
			addIssue(
				issues,
				'error',
				'LAYOUT_LOOKUP_FLAG_INVALID',
				`${tableName} lookup ${i} has bits set outside the valid lookupFlag mask 0x00FF (got 0x${lk.lookupFlag.toString(16).padStart(4, '0')}).`,
			);
			break;
		}
	}
}

// -------------------------------------------------------------------------
//  fvar instance / axis name-id and flags validation (Tier 7 deeper pass)
// -------------------------------------------------------------------------

const FVAR_AXIS_RESERVED_FLAGS_MASK = 0xfffe; // bit 0 = HIDDEN_AXIS; rest reserved
const FVAR_INSTANCE_RESERVED_FLAGS_MASK = 0xfffe; // bit 0 only (reserved per spec)

function validateFvarNamesAndFlags(fvar, nameTable, issues) {
	const axes = fvar.axes ?? [];
	const instances = fvar.instances ?? [];
	const validNameIds = new Set();
	if (nameTable && Array.isArray(nameTable.names)) {
		for (const rec of nameTable.names) {
			if (rec && typeof rec.nameID === 'number') validNameIds.add(rec.nameID);
		}
	}

	for (let i = 0; i < axes.length; i++) {
		const a = axes[i];
		if (
			typeof a.flags === 'number' &&
			(a.flags & FVAR_AXIS_RESERVED_FLAGS_MASK) !== 0
		) {
			addIssue(
				issues,
				'warning',
				'FVAR_AXIS_FLAGS_RESERVED',
				`fvar axis '${a.axisTag}' has reserved bits set in flags (0x${a.flags.toString(16).padStart(4, '0')}); only bit 0 (HIDDEN_AXIS) is defined.`,
			);
		}
		if (typeof a.axisNameID === 'number' && a.axisNameID < 256) {
			addIssue(
				issues,
				'warning',
				'FVAR_AXIS_NAMEID_RESERVED',
				`fvar axis '${a.axisTag}' axisNameID is ${a.axisNameID}; axis name IDs should be ≥ 256.`,
			);
		} else if (
			typeof a.axisNameID === 'number' &&
			validNameIds.size > 0 &&
			!validNameIds.has(a.axisNameID)
		) {
			addIssue(
				issues,
				'warning',
				'FVAR_AXIS_NAMEID_MISSING',
				`fvar axis '${a.axisTag}' axisNameID ${a.axisNameID} has no matching name record.`,
			);
		}
	}

	for (let i = 0; i < instances.length; i++) {
		const inst = instances[i];
		if (
			typeof inst.flags === 'number' &&
			(inst.flags & FVAR_INSTANCE_RESERVED_FLAGS_MASK) !== 0
		) {
			addIssue(
				issues,
				'warning',
				'FVAR_INSTANCE_FLAGS_RESERVED',
				`fvar instance ${i} has reserved bits set in flags (0x${inst.flags.toString(16).padStart(4, '0')}).`,
			);
		}
		const ids = [
			['subfamilyNameID', inst.subfamilyNameID],
			['postScriptNameID', inst.postScriptNameID],
		];
		for (const [fieldName, id] of ids) {
			if (id === undefined || id === 0xffff) continue; // 0xFFFF = no ps name
			if (typeof id !== 'number') continue;
			// 2 and 17 are valid pre-defined IDs for subfamily; 6 for postscript
			if (
				validNameIds.size > 0 &&
				!validNameIds.has(id) &&
				id !== 2 &&
				id !== 17 &&
				id !== 6
			) {
				addIssue(
					issues,
					'warning',
					'FVAR_INSTANCE_NAMEID_MISSING',
					`fvar instance ${i} ${fieldName} ${id} has no matching name record.`,
				);
			}
		}
	}
}

// -------------------------------------------------------------------------
//  STAT (style attributes) validation
// -------------------------------------------------------------------------

function validateSTAT(stat, fvar, issues) {
	if (typeof stat.majorVersion === 'number' && stat.majorVersion !== 1) {
		addIssue(
			issues,
			'error',
			'STAT_VERSION_INVALID',
			`STAT majorVersion must be 1, got ${stat.majorVersion}.`,
		);
	}
	if (typeof stat.designAxisSize === 'number' && stat.designAxisSize < 8) {
		addIssue(
			issues,
			'error',
			'STAT_DESIGN_AXIS_SIZE_INVALID',
			`STAT designAxisSize must be ≥ 8, got ${stat.designAxisSize}.`,
		);
	}
	const axes = stat.designAxes ?? [];
	const fvarAxes = fvar?.axes ?? [];

	const seenTags = new Set();
	for (let i = 0; i < axes.length; i++) {
		const a = axes[i];
		if (typeof a.axisTag === 'string') {
			if (seenTags.has(a.axisTag)) {
				addIssue(
					issues,
					'warning',
					'STAT_AXIS_DUPLICATE_TAG',
					`STAT designAxes contains duplicate axisTag '${a.axisTag}'.`,
				);
			}
			seenTags.add(a.axisTag);
		}
	}

	// Cross-check with fvar: every fvar axis should have a STAT entry
	if (fvarAxes.length > 0) {
		for (const fa of fvarAxes) {
			if (!seenTags.has(fa.axisTag)) {
				addIssue(
					issues,
					'warning',
					'STAT_MISSING_FVAR_AXIS',
					`STAT designAxes is missing an entry for fvar axis '${fa.axisTag}'.`,
				);
			}
		}
	}

	const axisValues = stat.axisValues ?? [];
	for (let i = 0; i < axisValues.length; i++) {
		const av = axisValues[i];
		if (!av || typeof av !== 'object') continue;
		if (av.format === 1 || av.format === 2 || av.format === 3) {
			if (
				typeof av.axisIndex === 'number' &&
				(av.axisIndex < 0 || av.axisIndex >= axes.length)
			) {
				addIssue(
					issues,
					'error',
					'STAT_AXIS_VALUE_AXIS_INDEX_OUT_OF_RANGE',
					`STAT axisValue ${i} (format ${av.format}) references axisIndex ${av.axisIndex} but only ${axes.length} design axes are defined.`,
				);
			}
		}
		if (av.format === 2) {
			if (
				typeof av.rangeMinValue === 'number' &&
				typeof av.rangeMaxValue === 'number' &&
				typeof av.nominalValue === 'number' &&
				!(
					av.rangeMinValue <= av.nominalValue && av.nominalValue <= av.rangeMaxValue
				)
			) {
				addIssue(
					issues,
					'error',
					'STAT_AXIS_VALUE_RANGE_INVALID',
					`STAT axisValue ${i} (format 2) violates rangeMin ≤ nominal ≤ rangeMax (min=${av.rangeMinValue}, nominal=${av.nominalValue}, max=${av.rangeMaxValue}).`,
				);
			}
		}
		if (av.format === 4 && Array.isArray(av.axisValues)) {
			for (const sub of av.axisValues) {
				if (
					typeof sub.axisIndex === 'number' &&
					(sub.axisIndex < 0 || sub.axisIndex >= axes.length)
				) {
					addIssue(
						issues,
						'error',
						'STAT_AXIS_VALUE_AXIS_INDEX_OUT_OF_RANGE',
						`STAT axisValue ${i} (format 4) sub-record references axisIndex ${sub.axisIndex} but only ${axes.length} design axes are defined.`,
					);
					break;
				}
			}
		}
	}
}

// -------------------------------------------------------------------------
//  avar (axis variations) validation
// -------------------------------------------------------------------------

function validateAvar(avar, fvar, issues) {
	const segmentMaps = avar.segmentMaps ?? [];
	const fvarAxes = fvar?.axes ?? [];

	if (fvarAxes.length > 0 && segmentMaps.length !== fvarAxes.length) {
		addIssue(
			issues,
			'error',
			'AVAR_SEGMENT_COUNT_MISMATCH',
			`avar has ${segmentMaps.length} segment maps but fvar declares ${fvarAxes.length} axes.`,
		);
	}

	for (let i = 0; i < segmentMaps.length; i++) {
		const map = segmentMaps[i].axisValueMaps ?? [];
		let prevFrom = -Infinity;
		let hasNeg1 = false;
		let hasZero = false;
		let hasPos1 = false;
		let outOfRangeReported = false;
		let notIncreasingReported = false;
		for (let j = 0; j < map.length; j++) {
			const { fromCoordinate: f, toCoordinate: t } = map[j];
			if (
				!outOfRangeReported &&
				(typeof f !== 'number' ||
					typeof t !== 'number' ||
					f < -1 ||
					f > 1 ||
					t < -1 ||
					t > 1)
			) {
				addIssue(
					issues,
					'error',
					'AVAR_COORD_OUT_OF_RANGE',
					`avar axis ${i} segment map entry ${j} has out-of-range coordinate (from=${f}, to=${t}); both must be in [-1, 1].`,
				);
				outOfRangeReported = true;
			}
			if (!notIncreasingReported && typeof f === 'number' && f <= prevFrom) {
				addIssue(
					issues,
					'error',
					'AVAR_FROM_COORD_NOT_INCREASING',
					`avar axis ${i} segment map fromCoordinate values must be strictly increasing (entry ${j} = ${f}, previous = ${prevFrom}).`,
				);
				notIncreasingReported = true;
			}
			if (typeof f === 'number') prevFrom = f;
			if (f === -1 && t === -1) hasNeg1 = true;
			if (f === 0 && t === 0) hasZero = true;
			if (f === 1 && t === 1) hasPos1 = true;
		}
		// Per spec, segment maps must include the three normalised endpoints
		// (-1,-1), (0,0), (1,1) when they have any entries at all. An empty
		// segment map (positionMapCount = 0) is a valid identity mapping.
		if (map.length > 0 && !(hasNeg1 && hasZero && hasPos1)) {
			addIssue(
				issues,
				'error',
				'AVAR_MISSING_REQUIRED_ENDPOINTS',
				`avar axis ${i} segment map must include (-1,-1), (0,0), and (1,1) entries when non-empty.`,
			);
		}
	}
}

// -------------------------------------------------------------------------
//  ItemVariationStore validation (used by HVAR/VVAR/MVAR/GDEF)
// -------------------------------------------------------------------------

function validateItemVariationStore(ivs, fvarAxisCount, owner, issues) {
	if (!ivs) return;
	const regionList = ivs.variationRegionList;
	if (!regionList) return;
	if (
		fvarAxisCount > 0 &&
		typeof regionList.axisCount === 'number' &&
		regionList.axisCount !== fvarAxisCount
	) {
		addIssue(
			issues,
			'error',
			'IVS_AXIS_COUNT_MISMATCH',
			`${owner} ItemVariationStore declares axisCount=${regionList.axisCount} but fvar has ${fvarAxisCount} axes.`,
		);
	}
	const regions = regionList.regions ?? [];
	let regionCoordReported = false;
	for (let r = 0; r < regions.length; r++) {
		const axes = regions[r].regionAxes ?? [];
		for (let a = 0; a < axes.length; a++) {
			const { startCoord: s, peakCoord: p, endCoord: e } = axes[a];
			if (
				!regionCoordReported &&
				(typeof s !== 'number' ||
					typeof p !== 'number' ||
					typeof e !== 'number' ||
					s < -1 ||
					s > 1 ||
					p < -1 ||
					p > 1 ||
					e < -1 ||
					e > 1)
			) {
				addIssue(
					issues,
					'error',
					'IVS_REGION_COORD_OUT_OF_RANGE',
					`${owner} ItemVariationStore region ${r} axis ${a} has out-of-range coords (start=${s}, peak=${p}, end=${e}); all must be in [-1, 1].`,
				);
				regionCoordReported = true;
			}
			if (
				!regionCoordReported &&
				typeof s === 'number' &&
				typeof p === 'number' &&
				typeof e === 'number' &&
				!(s <= p && p <= e)
			) {
				addIssue(
					issues,
					'error',
					'IVS_REGION_PEAK_OUT_OF_ORDER',
					`${owner} ItemVariationStore region ${r} axis ${a} violates start ≤ peak ≤ end (start=${s}, peak=${p}, end=${e}).`,
				);
				regionCoordReported = true;
			}
		}
	}

	const ivd = ivs.itemVariationData ?? [];
	let regionIndexReported = false;
	for (let i = 0; i < ivd.length; i++) {
		const sub = ivd[i];
		if (!sub) continue;
		const regionIndexes = sub.regionIndexes ?? [];
		for (let k = 0; k < regionIndexes.length; k++) {
			if (regionIndexes[k] >= regions.length && !regionIndexReported) {
				addIssue(
					issues,
					'error',
					'IVS_REGION_INDEX_OUT_OF_RANGE',
					`${owner} ItemVariationData ${i} regionIndex ${regionIndexes[k]} is ≥ regionCount (${regions.length}).`,
				);
				regionIndexReported = true;
			}
		}
	}
}

// -------------------------------------------------------------------------
//  MVAR-specific validation
// -------------------------------------------------------------------------

function validateMVAR(mvar, fvar, issues) {
	if (typeof mvar.valueRecordSize === 'number' && mvar.valueRecordSize < 8) {
		addIssue(
			issues,
			'error',
			'MVAR_VALUE_RECORD_SIZE_INVALID',
			`MVAR valueRecordSize must be ≥ 8, got ${mvar.valueRecordSize}.`,
		);
	}
	const ivs = mvar.itemVariationStore;
	const records = mvar.valueRecords ?? [];
	const ivd = ivs?.itemVariationData ?? [];
	let outerReported = false;
	let innerReported = false;
	for (let i = 0; i < records.length; i++) {
		const r = records[i];
		const outer = r.deltaSetOuterIndex;
		const inner = r.deltaSetInnerIndex;
		if (!outerReported && typeof outer === 'number' && outer >= ivd.length) {
			addIssue(
				issues,
				'error',
				'MVAR_DELTA_SET_OUTER_OUT_OF_RANGE',
				`MVAR record '${r.valueTag}' deltaSetOuterIndex ${outer} is ≥ ItemVariationData count (${ivd.length}).`,
			);
			outerReported = true;
		}
		const sub = ivd[outer];
		if (
			!innerReported &&
			sub &&
			typeof inner === 'number' &&
			inner >= (sub.itemCount ?? 0)
		) {
			addIssue(
				issues,
				'error',
				'MVAR_DELTA_SET_INNER_OUT_OF_RANGE',
				`MVAR record '${r.valueTag}' deltaSetInnerIndex ${inner} is ≥ itemCount (${sub.itemCount}).`,
			);
			innerReported = true;
		}
	}
	validateItemVariationStore(ivs, fvar?.axes?.length ?? 0, 'MVAR', issues);
}

// -------------------------------------------------------------------------
//  HVAR/VVAR validation
// -------------------------------------------------------------------------

function validateHVVAR(table, owner, fvar, issues) {
	validateItemVariationStore(
		table.itemVariationStore,
		fvar?.axes?.length ?? 0,
		owner,
		issues,
	);
}

// -------------------------------------------------------------------------
//  GDEF validation
// -------------------------------------------------------------------------

function validateGDEFTable(gdef, numGlyphs, fvar, issues, ctx) {
	ctx ||= makeStructuralCtx();
	if (typeof gdef.majorVersion === 'number' && gdef.majorVersion !== 1) {
		addIssue(
			issues,
			'error',
			'GDEF_VERSION_INVALID',
			`GDEF majorVersion must be 1, got ${gdef.majorVersion}.`,
		);
	}
	if (gdef.glyphClassDef) {
		validateClassDef(
			gdef.glyphClassDef,
			numGlyphs,
			'GDEF.glyphClassDef',
			issues,
			{ maxClass: 4 }, // 1=base, 2=ligature, 3=mark, 4=component
			ctx,
		);
	}
	if (gdef.markAttachClassDef) {
		validateClassDef(
			gdef.markAttachClassDef,
			numGlyphs,
			'GDEF.markAttachClassDef',
			issues,
			{},
			ctx,
		);
	}
	if (gdef.attachList?.coverage) {
		validateCoverage(
			gdef.attachList.coverage,
			numGlyphs,
			'GDEF.attachList.coverage',
			issues,
			ctx,
		);
	}
	if (gdef.ligCaretList?.coverage) {
		validateCoverage(
			gdef.ligCaretList.coverage,
			numGlyphs,
			'GDEF.ligCaretList.coverage',
			issues,
			ctx,
		);
	}
	if (gdef.markGlyphSetsDef?.coverages) {
		for (let i = 0; i < gdef.markGlyphSetsDef.coverages.length; i++) {
			validateCoverage(
				gdef.markGlyphSetsDef.coverages[i],
				numGlyphs,
				`GDEF.markGlyphSetsDef.coverages[${i}]`,
				issues,
				ctx,
			);
		}
	}
	if (gdef.itemVariationStore) {
		validateItemVariationStore(
			gdef.itemVariationStore,
			fvar?.axes?.length ?? 0,
			'GDEF',
			issues,
		);
	}
}

// -------------------------------------------------------------------------
//  Coverage / ClassDef structural validation (shared by GDEF + GSUB/GPOS)
// -------------------------------------------------------------------------

function makeStructuralCtx() {
	return { coverages: new WeakSet(), classDefs: new WeakSet() };
}

function validateCoverage(cov, numGlyphs, label, issues, ctx) {
	if (!cov) return;
	if (ctx) {
		if (ctx.coverages.has(cov)) return;
		ctx.coverages.add(cov);
	}
	if (cov.format !== 1 && cov.format !== 2) {
		addIssue(
			issues,
			'error',
			'COVERAGE_FORMAT_INVALID',
			`${label}: Coverage format must be 1 or 2, got ${cov.format}.`,
		);
		return;
	}
	if (cov.format === 1) {
		const glyphs = cov.glyphs ?? [];
		let prev = -1;
		for (let i = 0; i < glyphs.length; i++) {
			const g = glyphs[i];
			if (numGlyphs > 0 && g >= numGlyphs) {
				addIssue(
					issues,
					'error',
					'COVERAGE_GLYPH_OUT_OF_RANGE',
					`${label}: Coverage format 1 references glyphID ${g} but font has only ${numGlyphs} glyphs.`,
				);
				return;
			}
			if (g <= prev) {
				addIssue(
					issues,
					'error',
					'COVERAGE_GLYPHS_NOT_SORTED',
					`${label}: Coverage format 1 glyph list is not strictly ascending at index ${i} (got ${g} after ${prev}).`,
				);
				return;
			}
			prev = g;
		}
	} else {
		const ranges = cov.ranges ?? [];
		let prevEnd = -1;
		for (let i = 0; i < ranges.length; i++) {
			const r = ranges[i];
			if (
				typeof r.startGlyphID !== 'number' ||
				typeof r.endGlyphID !== 'number' ||
				r.startGlyphID > r.endGlyphID
			) {
				addIssue(
					issues,
					'error',
					'COVERAGE_RANGE_INVALID',
					`${label}: Coverage format 2 range ${i} is invalid (start=${r.startGlyphID}, end=${r.endGlyphID}).`,
				);
				return;
			}
			if (numGlyphs > 0 && r.endGlyphID >= numGlyphs) {
				addIssue(
					issues,
					'error',
					'COVERAGE_GLYPH_OUT_OF_RANGE',
					`${label}: Coverage format 2 range ${i} endGlyphID ${r.endGlyphID} is ≥ numGlyphs (${numGlyphs}).`,
				);
				return;
			}
			if (r.startGlyphID <= prevEnd) {
				addIssue(
					issues,
					'error',
					'COVERAGE_RANGES_NOT_SORTED',
					`${label}: Coverage format 2 ranges overlap or are not sorted at index ${i} (start=${r.startGlyphID}, prev end=${prevEnd}).`,
				);
				return;
			}
			prevEnd = r.endGlyphID;
		}
	}
}

function validateClassDef(cd, numGlyphs, label, issues, opts = {}, ctx) {
	if (!cd) return;
	if (ctx) {
		if (ctx.classDefs.has(cd)) return;
		ctx.classDefs.add(cd);
	}
	if (cd.format !== 1 && cd.format !== 2) {
		addIssue(
			issues,
			'error',
			'CLASSDEF_FORMAT_INVALID',
			`${label}: ClassDef format must be 1 or 2, got ${cd.format}.`,
		);
		return;
	}
	const maxClass = opts.maxClass;
	if (cd.format === 1) {
		const start = cd.startGlyphID ?? 0;
		const values = cd.classValues ?? [];
		if (numGlyphs > 0 && start + values.length > numGlyphs) {
			addIssue(
				issues,
				'error',
				'CLASSDEF_GLYPH_OUT_OF_RANGE',
				`${label}: ClassDef format 1 covers glyphs [${start}, ${start + values.length - 1}] but font has only ${numGlyphs} glyphs.`,
			);
			return;
		}
		if (maxClass !== undefined) {
			for (let i = 0; i < values.length; i++) {
				if (values[i] > maxClass) {
					addIssue(
						issues,
						'error',
						'CLASSDEF_CLASS_OUT_OF_RANGE',
						`${label}: ClassDef format 1 entry ${i} has class ${values[i]}, which exceeds the maximum ${maxClass} for this table.`,
					);
					return;
				}
			}
		}
	} else {
		const ranges = cd.ranges ?? [];
		let prevEnd = -1;
		for (let i = 0; i < ranges.length; i++) {
			const r = ranges[i];
			if (r.startGlyphID > r.endGlyphID) {
				addIssue(
					issues,
					'error',
					'CLASSDEF_RANGE_INVALID',
					`${label}: ClassDef format 2 range ${i} is invalid (start=${r.startGlyphID}, end=${r.endGlyphID}).`,
				);
				return;
			}
			if (numGlyphs > 0 && r.endGlyphID >= numGlyphs) {
				addIssue(
					issues,
					'error',
					'CLASSDEF_GLYPH_OUT_OF_RANGE',
					`${label}: ClassDef format 2 range ${i} endGlyphID ${r.endGlyphID} is ≥ numGlyphs (${numGlyphs}).`,
				);
				return;
			}
			if (r.startGlyphID <= prevEnd) {
				addIssue(
					issues,
					'error',
					'CLASSDEF_RANGES_NOT_SORTED',
					`${label}: ClassDef format 2 ranges overlap or are not sorted at index ${i} (start=${r.startGlyphID}, prev end=${prevEnd}).`,
				);
				return;
			}
			if (maxClass !== undefined && r.class > maxClass) {
				addIssue(
					issues,
					'error',
					'CLASSDEF_CLASS_OUT_OF_RANGE',
					`${label}: ClassDef format 2 range ${i} has class ${r.class}, which exceeds the maximum ${maxClass} for this table.`,
				);
				return;
			}
			prevEnd = r.endGlyphID;
		}
	}
}

// -------------------------------------------------------------------------
//  GSUB / GPOS subtable structural validation
// -------------------------------------------------------------------------

function validateLayoutSubtables(
	layoutTable,
	tableName,
	numGlyphs,
	issues,
	ctx,
) {
	ctx ||= makeStructuralCtx();
	const lookups = layoutTable?.lookupList?.lookups ?? [];
	for (let li = 0; li < lookups.length; li++) {
		const lk = lookups[li];
		const subtables = lk.subtables ?? [];
		for (let si = 0; si < subtables.length; si++) {
			const st = subtables[si];
			if (!st || typeof st !== 'object') continue;
			const label = `${tableName} lookup ${li} (type ${lk.lookupType}) subtable ${si}`;

			if (st.coverage) {
				validateCoverage(st.coverage, numGlyphs, `${label}.coverage`, issues, ctx);
			}
			if (Array.isArray(st.coverages)) {
				for (let ci = 0; ci < st.coverages.length; ci++) {
					validateCoverage(
						st.coverages[ci],
						numGlyphs,
						`${label}.coverages[${ci}]`,
						issues,
						ctx,
					);
				}
			}
			if (st.classDef) {
				validateClassDef(
					st.classDef,
					numGlyphs,
					`${label}.classDef`,
					issues,
					{},
					ctx,
				);
			}

			// GSUB type 1 — single substitution: substitute glyph IDs in range
			if (
				tableName === 'GSUB' &&
				lk.lookupType === 1 &&
				Array.isArray(st.substituteGlyphIDs)
			) {
				for (const g of st.substituteGlyphIDs) {
					if (numGlyphs > 0 && g >= numGlyphs) {
						addIssue(
							issues,
							'error',
							'GSUB_SUBSTITUTE_GLYPH_OUT_OF_RANGE',
							`${label}: substituteGlyphID ${g} is ≥ numGlyphs (${numGlyphs}).`,
						);
						break;
					}
				}
			}
			// GSUB type 4 — ligature substitution
			if (
				tableName === 'GSUB' &&
				lk.lookupType === 4 &&
				Array.isArray(st.ligatureSets)
			) {
				let outOfRangeReported = false;
				for (const set of st.ligatureSets) {
					if (outOfRangeReported) break;
					for (const lig of set ?? []) {
						if (numGlyphs > 0 && lig.ligatureGlyph >= numGlyphs) {
							addIssue(
								issues,
								'error',
								'GSUB_LIGATURE_GLYPH_OUT_OF_RANGE',
								`${label}: ligatureGlyph ${lig.ligatureGlyph} is ≥ numGlyphs (${numGlyphs}).`,
							);
							outOfRangeReported = true;
							break;
						}
						for (const cg of lig.componentGlyphIDs ?? []) {
							if (numGlyphs > 0 && cg >= numGlyphs) {
								addIssue(
									issues,
									'error',
									'GSUB_LIGATURE_COMPONENT_OUT_OF_RANGE',
									`${label}: ligature componentGlyphID ${cg} is ≥ numGlyphs (${numGlyphs}).`,
								);
								outOfRangeReported = true;
								break;
							}
						}
					}
				}
			}
		}
	}
}

// -------------------------------------------------------------------------
//  MATH table validation (light — version + raw presence)
// -------------------------------------------------------------------------

function validateMATH(math, issues) {
	if (typeof math.version === 'number' && math.version !== 0x00010000) {
		addIssue(
			issues,
			'error',
			'MATH_VERSION_INVALID',
			`MATH table version must be 0x00010000, got 0x${math.version.toString(16).padStart(8, '0')}.`,
		);
	}
}

// -------------------------------------------------------------------------
//  CFF / CFF2 charstring opcode validation (Type 2 CharStrings)
// -------------------------------------------------------------------------
//
// Catches the same classes of charstring corruption that Firefox/OTS
// reports as "Failed validating CharStrings INDEX": invalid operators,
// stack underflow, runaway subroutine recursion, and (for CFF1) operators
// that are illegal in CFF2 or vice-versa.
//
// Spec: Adobe Tech Note #5177 (Type 2 Charstring Format).

const CFF_TYPE2_OPS = new Set([
	1, 3, 4, 5, 6, 7, 8, 10, 11, 14, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 29,
	30,
	31,
	// 12 is the escape byte; valid two-byte ops are checked separately.
]);

// CFF2 adds vsindex (15) and blend (16); removes endchar (14).
const CFF2_TYPE2_OPS = new Set([
	1, 3, 4, 5, 6, 7, 8, 10, 11, 15, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
	29, 30, 31,
]);

const CFF_TYPE2_OPS_TWOBYTE = new Set([
	34,
	35,
	36,
	37, // hflex, flex, hflex1, flex1
	// Plus arithmetic/storage ops 0,3,4,5,9,10,11,12,14,15,18,20,21,22,23,24,
	// 26,27,28,29,30 — but the interpreter doesn't decode those, so we don't
	// require them. We only flag operators that are not in either set.
	0,
	3,
	4,
	5,
	9,
	10,
	11,
	12,
	14,
	15,
	18,
	20,
	21,
	22,
	23,
	24,
	26,
	27,
	28,
	29,
	30,
]);

// Operators that exist in CFF1 but were removed in CFF2: endchar (14) and
// the legacy hsbw/seac path. The CFF2 op set above already excludes them, so
// they will be reported as CFF_INVALID_OPERATOR in CFF2 contexts — no
// separate code is needed.

const CFF_MAX_SUBR_DEPTH = 10; // Type 2 spec limit
const CFF_MAX_STACK = 48; // Type 2 / CFF1 spec stack depth
const CFF2_MAX_STACK = 513; // CFF2 spec stack depth

function validateCffCharStrings(cffTable, owner, issues, isCff2 = false) {
	const fontList = isCff2
		? [
				{
					charStrings: cffTable.charStrings || [],
					localSubrs: cffTable.fontDicts?.[0]?.localSubrs || [],
				},
			]
		: cffTable.fonts || [];
	const globalSubrs = cffTable.globalSubrs || [];
	const globalBias = calcCffSubrBias(globalSubrs.length);

	// We report only the first occurrence per code per call to avoid noise on
	// systemically broken fonts.
	const reported = new Set();
	function report(code, severity, message) {
		if (reported.has(code)) return;
		reported.add(code);
		addIssue(issues, severity, code, message);
	}

	for (let f = 0; f < fontList.length; f++) {
		const font = fontList[f];
		const charStrings = font.charStrings || [];
		const localSubrs = font.localSubrs || [];
		const localBias = calcCffSubrBias(localSubrs.length);

		for (let gid = 0; gid < charStrings.length; gid++) {
			const cs = charStrings[gid];
			if (!cs || cs.length === 0) continue; // Caught by CFF_EMPTY_CHARSTRING

			const ctx = {
				stack: [],
				maxStackSeen: 0,
				stemCount: 0,
				depth: 0,
				returned: false,
				saw: { endchar: false, anyDraw: false },
			};

			validateCharStringBytecode(
				cs,
				ctx,
				localSubrs,
				localBias,
				globalSubrs,
				globalBias,
				owner,
				f,
				gid,
				report,
				isCff2,
			);

			if (ctx.maxStackSeen > (isCff2 ? CFF2_MAX_STACK : CFF_MAX_STACK)) {
				report(
					'CFF_STACK_OVERFLOW',
					'error',
					`${owner}: charstring for glyph ${gid} pushed ${ctx.maxStackSeen} operands, exceeding the ${isCff2 ? 'CFF2' : 'Type 2'} limit of ${isCff2 ? CFF2_MAX_STACK : CFF_MAX_STACK}.`,
				);
			}
		}
	}
}

function calcCffSubrBias(subrCount) {
	if (subrCount < 1240) return 107;
	if (subrCount < 33900) return 1131;
	return 32768;
}

function validateCharStringBytecode(
	bytes,
	ctx,
	localSubrs,
	localBias,
	globalSubrs,
	globalBias,
	owner,
	fontIndex,
	gid,
	report,
	isCff2,
) {
	if (ctx.depth > CFF_MAX_SUBR_DEPTH) {
		report(
			'CFF_SUBR_DEPTH_EXCEEDED',
			'error',
			`${owner}: charstring for glyph ${gid} exceeded subroutine recursion depth ${CFF_MAX_SUBR_DEPTH}.`,
		);
		return;
	}

	let i = 0;
	while (i < bytes.length) {
		const b0 = bytes[i];

		// Numeric operand?
		if (b0 === 28 || b0 >= 32) {
			const num = decodeCffNumber(bytes, i);
			if (num === null) {
				report(
					'CFF_INVALID_NUMBER',
					'error',
					`${owner}: charstring for glyph ${gid} contains a malformed numeric operand at byte ${i}.`,
				);
				return;
			}
			if (i + num.bytesConsumed > bytes.length) {
				report(
					'CFF_TRUNCATED_OPERAND',
					'error',
					`${owner}: charstring for glyph ${gid} truncated mid-operand at byte ${i}.`,
				);
				return;
			}
			ctx.stack.push(num.value);
			if (ctx.stack.length > ctx.maxStackSeen) {
				ctx.maxStackSeen = ctx.stack.length;
			}
			i += num.bytesConsumed;
			continue;
		}

		// Two-byte operator escape
		if (b0 === 12) {
			if (i + 1 >= bytes.length) {
				report(
					'CFF_TRUNCATED_OPERATOR',
					'error',
					`${owner}: charstring for glyph ${gid} ends mid-escaped operator at byte ${i}.`,
				);
				return;
			}
			const b1 = bytes[i + 1];
			if (!CFF_TYPE2_OPS_TWOBYTE.has(b1)) {
				report(
					'CFF_INVALID_OPERATOR',
					'error',
					`${owner}: charstring for glyph ${gid} uses unrecognised two-byte operator 12 ${b1} at byte ${i}.`,
				);
				return;
			}
			// Flex operators each consume a fixed number of operands; check
			// stack underflow only for those four.
			const flexArgs = { 34: 7, 35: 13, 36: 9, 37: 11 }[b1];
			if (flexArgs !== undefined && ctx.stack.length < flexArgs) {
				report(
					'CFF_STACK_UNDERFLOW',
					'error',
					`${owner}: charstring for glyph ${gid} two-byte op ${b1} requires ${flexArgs} operands but stack has ${ctx.stack.length}.`,
				);
				return;
			}
			ctx.stack.length = 0;
			ctx.saw.anyDraw = true;
			i += 2;
			continue;
		}

		// One-byte operators
		const opSet = isCff2 ? CFF2_TYPE2_OPS : CFF_TYPE2_OPS;
		if (!opSet.has(b0)) {
			report(
				'CFF_INVALID_OPERATOR',
				'error',
				`${owner}: charstring for glyph ${gid} uses unknown operator 0x${b0.toString(16).padStart(2, '0')} at byte ${i}.`,
			);
			return;
		}

		// CFF2 vsindex (15): pops 1 operand (variation store index), no draw.
		if (isCff2 && b0 === 15) {
			if (ctx.stack.length < 1) {
				report(
					'CFF_STACK_UNDERFLOW',
					'error',
					`${owner}: charstring for glyph ${gid} vsindex with empty stack at byte ${i}.`,
				);
				return;
			}
			ctx.stack.pop();
			i++;
			continue;
		}

		// CFF2 blend (16): pops top operand n, then n*(k+1) blend operands,
		// leaves n on stack. We can't know k without reading ItemVariationStore;
		// just treat as stack-modifying with no underflow check beyond "≥ 1".
		if (isCff2 && b0 === 16) {
			if (ctx.stack.length < 1) {
				report(
					'CFF_STACK_UNDERFLOW',
					'error',
					`${owner}: charstring for glyph ${gid} blend with empty stack at byte ${i}.`,
				);
				return;
			}
			const n = ctx.stack.pop();
			// We don't know k; conservatively keep n operands and discard the rest.
			if (typeof n === 'number' && n >= 0 && n <= ctx.stack.length) {
				ctx.stack.length = n;
			} else {
				ctx.stack.length = 0;
			}
			i++;
			continue;
		}

		// Stem operators — count stems for hintmask byte calculation
		if (b0 === 1 || b0 === 3 || b0 === 18 || b0 === 23) {
			ctx.stemCount += ctx.stack.length >> 1;
			ctx.stack.length = 0;
			i++;
			continue;
		}

		// hintmask / cntrmask have N follow-on bytes (one per 8 stems).
		if (b0 === 19 || b0 === 20) {
			ctx.stemCount += ctx.stack.length >> 1;
			ctx.stack.length = 0;
			i++;
			const maskBytes = Math.ceil(ctx.stemCount / 8);
			if (i + maskBytes > bytes.length) {
				report(
					'CFF_TRUNCATED_OPERATOR',
					'error',
					`${owner}: charstring for glyph ${gid} truncated mid-mask at byte ${i}.`,
				);
				return;
			}
			i += maskBytes;
			continue;
		}

		// Subroutine calls
		if (b0 === 10 || b0 === 29) {
			if (ctx.stack.length < 1) {
				report(
					'CFF_STACK_UNDERFLOW',
					'error',
					`${owner}: charstring for glyph ${gid} ${b0 === 10 ? 'callsubr' : 'callgsubr'} with empty stack at byte ${i}.`,
				);
				return;
			}
			const sIdx = ctx.stack.pop();
			const subrIdx = sIdx + (b0 === 10 ? localBias : globalBias);
			const subrTable = b0 === 10 ? localSubrs : globalSubrs;
			if (subrIdx < 0 || subrIdx >= subrTable.length) {
				report(
					'CFF_SUBR_INDEX_OUT_OF_RANGE',
					'error',
					`${owner}: charstring for glyph ${gid} ${b0 === 10 ? 'callsubr' : 'callgsubr'} index ${sIdx} (biased ${subrIdx}) out of range [0, ${subrTable.length}).`,
				);
				return;
			}
			ctx.depth++;
			validateCharStringBytecode(
				subrTable[subrIdx],
				ctx,
				localSubrs,
				localBias,
				globalSubrs,
				globalBias,
				owner,
				fontIndex,
				gid,
				report,
				isCff2,
			);
			ctx.depth--;
			i++;
			continue;
		}

		if (b0 === 11) {
			// return
			ctx.returned = true;
			return;
		}

		if (b0 === 14) {
			// endchar
			ctx.saw.endchar = true;
			ctx.stack.length = 0;
			i++;
			continue;
		}

		// Drawing/move operators — clear stack
		ctx.stack.length = 0;
		ctx.saw.anyDraw = true;
		i++;
	}
}

function decodeCffNumber(bytes, offset) {
	const b0 = bytes[offset];
	if (b0 >= 32 && b0 <= 246) return { value: b0 - 139, bytesConsumed: 1 };
	if (b0 >= 247 && b0 <= 250) {
		if (offset + 1 >= bytes.length) return null;
		return {
			value: (b0 - 247) * 256 + bytes[offset + 1] + 108,
			bytesConsumed: 2,
		};
	}
	if (b0 >= 251 && b0 <= 254) {
		if (offset + 1 >= bytes.length) return null;
		return {
			value: -(b0 - 251) * 256 - bytes[offset + 1] - 108,
			bytesConsumed: 2,
		};
	}
	if (b0 === 28) {
		if (offset + 2 >= bytes.length) return null;
		const val = (bytes[offset + 1] << 8) | bytes[offset + 2];
		return { value: val > 0x7fff ? val - 0x10000 : val, bytesConsumed: 3 };
	}
	if (b0 === 255) {
		if (offset + 4 >= bytes.length) return null;
		const val =
			((bytes[offset + 1] << 24) |
				(bytes[offset + 2] << 16) |
				(bytes[offset + 3] << 8) |
				bytes[offset + 4]) >>>
			0;
		const signed = val > 0x7fffffff ? val - 0x100000000 : val;
		return { value: signed / 65536, bytesConsumed: 5 };
	}
	return null;
}

// -------------------------------------------------------------------------
//  glyf composite-cycle / depth detection
// -------------------------------------------------------------------------

const GLYF_MAX_COMPOSITE_DEPTH = 16;

function validateGlyfComposites(glyf, numGlyphs, issues) {
	const glyphs = glyf?.glyphs;
	if (!Array.isArray(glyphs)) return;

	let cycleReported = false;
	let depthReported = false;
	let outOfRangeReported = false;

	function walk(gid, stack) {
		if (cycleReported || depthReported) return;
		const g = glyphs[gid];
		if (!g || !Array.isArray(g.components)) return;
		if (stack.length >= GLYF_MAX_COMPOSITE_DEPTH) {
			depthReported = true;
			addIssue(
				issues,
				'error',
				'GLYF_COMPOSITE_DEPTH_EXCEEDED',
				`glyf composite glyph chain starting at glyph ${stack[0]} exceeds maximum nesting depth ${GLYF_MAX_COMPOSITE_DEPTH}.`,
			);
			return;
		}
		for (const comp of g.components) {
			const childGid = comp.glyphIndex ?? comp.glyphID;
			if (typeof childGid !== 'number') continue;
			if (numGlyphs > 0 && (childGid < 0 || childGid >= numGlyphs)) {
				if (!outOfRangeReported) {
					outOfRangeReported = true;
					addIssue(
						issues,
						'error',
						'GLYF_COMPOSITE_GLYPH_OUT_OF_RANGE',
						`glyf composite glyph ${gid} references component glyph ${childGid}, which is out of range [0, ${numGlyphs}).`,
					);
				}
				continue;
			}
			if (stack.includes(childGid)) {
				cycleReported = true;
				addIssue(
					issues,
					'error',
					'GLYF_COMPOSITE_CYCLE',
					`glyf composite glyph chain forms a cycle: ${[...stack, childGid].join(' → ')}.`,
				);
				return;
			}
			stack.push(childGid);
			walk(childGid, stack);
			stack.pop();
			if (cycleReported || depthReported) return;
		}
	}

	for (let gid = 0; gid < glyphs.length; gid++) {
		const g = glyphs[gid];
		if (g && Array.isArray(g.components)) {
			walk(gid, [gid]);
			if (cycleReported || depthReported) break;
		}
	}
}

// -------------------------------------------------------------------------
//  glyf header bounds (numContours sanity, bbox sanity)
// -------------------------------------------------------------------------

function validateGlyfHeaders(glyf, head, issues) {
	const glyphs = glyf?.glyphs;
	if (!Array.isArray(glyphs)) return;
	const headXMin = head?.xMin;
	const headXMax = head?.xMax;
	const headYMin = head?.yMin;
	const headYMax = head?.yMax;
	let bboxReported = false;
	let outsideHeadReported = false;
	let contoursReported = false;
	for (let gid = 0; gid < glyphs.length; gid++) {
		const g = glyphs[gid];
		if (!g) continue;
		// Empty glyphs are valid (e.g. .notdef, space)
		if (
			!bboxReported &&
			typeof g.xMin === 'number' &&
			typeof g.xMax === 'number' &&
			g.xMin > g.xMax
		) {
			bboxReported = true;
			addIssue(
				issues,
				'warning',
				'GLYF_BBOX_INVERTED',
				`glyf glyph ${gid} has xMin (${g.xMin}) > xMax (${g.xMax}).`,
			);
		}
		if (
			!bboxReported &&
			typeof g.yMin === 'number' &&
			typeof g.yMax === 'number' &&
			g.yMin > g.yMax
		) {
			bboxReported = true;
			addIssue(
				issues,
				'warning',
				'GLYF_BBOX_INVERTED',
				`glyf glyph ${gid} has yMin (${g.yMin}) > yMax (${g.yMax}).`,
			);
		}
		if (
			!outsideHeadReported &&
			typeof headXMin === 'number' &&
			typeof headXMax === 'number' &&
			typeof g.xMin === 'number' &&
			typeof g.xMax === 'number' &&
			(g.xMin < headXMin || g.xMax > headXMax)
		) {
			outsideHeadReported = true;
			addIssue(
				issues,
				'warning',
				'GLYF_BBOX_OUTSIDE_HEAD',
				`glyf glyph ${gid} bounding box [${g.xMin},${g.xMax}] x [${g.yMin},${g.yMax}] extends outside the head.bbox [${headXMin},${headXMax}] x [${headYMin},${headYMax}].`,
			);
		}
		if (
			!contoursReported &&
			typeof g.numberOfContours === 'number' &&
			g.numberOfContours < -1
		) {
			contoursReported = true;
			addIssue(
				issues,
				'error',
				'GLYF_NUM_CONTOURS_INVALID',
				`glyf glyph ${gid} numberOfContours = ${g.numberOfContours}; only ≥ -1 is valid (-1 indicates a composite).`,
			);
		}
	}
}

// -------------------------------------------------------------------------
//  cmap deeper subtable internals (format 12/13/14 specifics on top of
//  what Tier 2's validateCmapDeep already covers).
// -------------------------------------------------------------------------

const CMAP_FORMAT14_VALID_VS_RANGES = [
	[0x180b, 0x180d], // Mongolian Free Variation Selectors
	[0xfe00, 0xfe0f], // Variation Selectors
	[0xe0100, 0xe01ef], // Variation Selectors Supplement
];

function validateCmapFormat14(cmap, issues) {
	const subs = cmap?.subTables ?? cmap?.subtables ?? [];
	let outOfRangeReported = false;
	let outOfOrderReported = false;
	for (const sub of subs) {
		if (sub?.format !== 14) continue;
		const records = sub.varSelectorRecords ?? sub.variationSelectors ?? [];
		let prevVs = -1;
		for (let i = 0; i < records.length; i++) {
			const r = records[i];
			const vs = r.varSelector ?? r.variationSelector;
			if (typeof vs !== 'number') continue;
			const inRange = CMAP_FORMAT14_VALID_VS_RANGES.some(
				([lo, hi]) => vs >= lo && vs <= hi,
			);
			if (!inRange && !outOfRangeReported) {
				outOfRangeReported = true;
				addIssue(
					issues,
					'error',
					'CMAP_FORMAT14_VS_OUT_OF_RANGE',
					`cmap format 14 record ${i} variation selector U+${vs.toString(16).toUpperCase().padStart(4, '0')} is not in any defined VS range (Mongolian FVS, FE00–FE0F, or E0100–E01EF).`,
				);
			}
			if (vs <= prevVs && !outOfOrderReported) {
				outOfOrderReported = true;
				addIssue(
					issues,
					'error',
					'CMAP_FORMAT14_VS_OUT_OF_ORDER',
					`cmap format 14 variation selectors must be strictly ascending; record ${i} U+${vs.toString(16).toUpperCase()} follows U+${prevVs.toString(16).toUpperCase()}.`,
				);
			}
			prevVs = vs;
		}
	}
}

// -------------------------------------------------------------------------
//  cmap format 12/13 sequential map group sort + overlap analysis.
// -------------------------------------------------------------------------
//
// Per OpenType spec, format 12 (segmented coverage) and format 13 (many-to-one
// range mappings) groups must be sorted by `startCharCode` and the character
// ranges (start..end inclusive) must not overlap. Firefox/OTS reject fonts
// that violate either constraint.

function validateCmapFormat12And13(cmap, issues) {
	const subs = cmap?.subTables ?? cmap?.subtables ?? [];
	let sortReported = false;
	let overlapReported = false;
	let endLessReported = false;
	for (const sub of subs) {
		if (sub?.format !== 12 && sub?.format !== 13) continue;
		const groups =
			sub.groups ?? sub.sequentialMapGroups ?? sub.constantMapGroups ?? [];
		for (let i = 0; i < groups.length; i++) {
			const g = groups[i];
			const start = g.startCharCode ?? g.startcharCode ?? g.start;
			const end = g.endCharCode ?? g.endcharCode ?? g.end;
			if (typeof start !== 'number' || typeof end !== 'number') continue;
			if (end < start && !endLessReported) {
				endLessReported = true;
				addIssue(
					issues,
					'error',
					'CMAP_FORMAT12_END_BEFORE_START',
					`cmap format ${sub.format} group ${i} has endCharCode (U+${end.toString(16).toUpperCase()}) < startCharCode (U+${start.toString(16).toUpperCase()}).`,
				);
			}
			if (i > 0) {
				const prev = groups[i - 1];
				const pStart = prev.startCharCode ?? prev.startcharCode ?? prev.start;
				const pEnd = prev.endCharCode ?? prev.endcharCode ?? prev.end;
				if (typeof pStart === 'number' && start <= pStart && !sortReported) {
					sortReported = true;
					addIssue(
						issues,
						'error',
						'CMAP_FORMAT12_GROUPS_NOT_SORTED',
						`cmap format ${sub.format} groups must be sorted by startCharCode; group ${i} (U+${start.toString(16).toUpperCase()}) follows group ${i - 1} (U+${pStart.toString(16).toUpperCase()}).`,
					);
				}
				if (typeof pEnd === 'number' && start <= pEnd && !overlapReported) {
					overlapReported = true;
					addIssue(
						issues,
						'error',
						'CMAP_FORMAT12_GROUPS_OVERLAP',
						`cmap format ${sub.format} group ${i} (U+${start.toString(16).toUpperCase()}–U+${end.toString(16).toUpperCase()}) overlaps with group ${i - 1} (ends at U+${pEnd.toString(16).toUpperCase()}).`,
					);
				}
			}
		}
	}
}

// -------------------------------------------------------------------------
//  TrueType instruction stream safety (`prep`, `fpgm`, glyf instructions).
// -------------------------------------------------------------------------
//
// Walks the bytecode counting variable-length push operands, IF/EIF balance,
// and FDEF/ENDF balance. Catches the structural corruption Firefox/OTS
// reports as "Bad instructions" / "instruction stream truncated".
//
// Spec: Apple TrueType Reference Manual, Chapter 5 — Instruction Set.

function validateTrueTypeInstructions(bytes, owner, issues) {
	if (!bytes || bytes.length === 0) return;
	let i = 0;
	let ifDepth = 0;
	let inFdef = false;
	let truncReported = false;
	let unbalancedIfReported = false;
	let nestedFdefReported = false;
	let strayEndfReported = false;
	while (i < bytes.length) {
		const op = bytes[i];

		// PUSHB[N] (0xB0–0xB7): N+1 bytes follow
		if (op >= 0xb0 && op <= 0xb7) {
			const n = (op & 0x07) + 1;
			i++;
			if (i + n > bytes.length) {
				if (!truncReported) {
					truncReported = true;
					addIssue(
						issues,
						'error',
						'TT_INSTR_TRUNCATED_PUSH',
						`${owner}: PUSHB[${n - 1}] at byte ${i - 1} would read ${n} operands past end of stream (length ${bytes.length}).`,
					);
				}
				return;
			}
			i += n;
			continue;
		}

		// PUSHW[N] (0xB8–0xBF): (N+1)*2 bytes follow
		if (op >= 0xb8 && op <= 0xbf) {
			const n = ((op & 0x07) + 1) * 2;
			i++;
			if (i + n > bytes.length) {
				if (!truncReported) {
					truncReported = true;
					addIssue(
						issues,
						'error',
						'TT_INSTR_TRUNCATED_PUSH',
						`${owner}: PUSHW[${op & 7}] at byte ${i - 1} would read ${n} operand bytes past end of stream (length ${bytes.length}).`,
					);
				}
				return;
			}
			i += n;
			continue;
		}

		// NPUSHB (0x40): next byte = N, then N bytes
		if (op === 0x40) {
			i++;
			if (i >= bytes.length) {
				if (!truncReported) {
					truncReported = true;
					addIssue(
						issues,
						'error',
						'TT_INSTR_TRUNCATED_PUSH',
						`${owner}: NPUSHB at end of stream with no count byte.`,
					);
				}
				return;
			}
			const n = bytes[i];
			i++;
			if (i + n > bytes.length) {
				if (!truncReported) {
					truncReported = true;
					addIssue(
						issues,
						'error',
						'TT_INSTR_TRUNCATED_PUSH',
						`${owner}: NPUSHB at byte ${i - 2} declares ${n} operands but only ${bytes.length - i} remain.`,
					);
				}
				return;
			}
			i += n;
			continue;
		}

		// NPUSHW (0x41): next byte = N, then N*2 bytes
		if (op === 0x41) {
			i++;
			if (i >= bytes.length) {
				if (!truncReported) {
					truncReported = true;
					addIssue(
						issues,
						'error',
						'TT_INSTR_TRUNCATED_PUSH',
						`${owner}: NPUSHW at end of stream with no count byte.`,
					);
				}
				return;
			}
			const n = bytes[i] * 2;
			i++;
			if (i + n > bytes.length) {
				if (!truncReported) {
					truncReported = true;
					addIssue(
						issues,
						'error',
						'TT_INSTR_TRUNCATED_PUSH',
						`${owner}: NPUSHW at byte ${i - 2} declares ${n / 2} word operands but only ${bytes.length - i} bytes remain.`,
					);
				}
				return;
			}
			i += n;
			continue;
		}

		// IF (0x58)
		if (op === 0x58) {
			ifDepth++;
			i++;
			continue;
		}
		// EIF (0x59)
		if (op === 0x59) {
			if (ifDepth === 0) {
				if (!unbalancedIfReported) {
					unbalancedIfReported = true;
					addIssue(
						issues,
						'error',
						'TT_INSTR_UNBALANCED_EIF',
						`${owner}: EIF at byte ${i} with no matching IF.`,
					);
				}
			} else {
				ifDepth--;
			}
			i++;
			continue;
		}

		// FDEF (0x2C) — function definition (cannot nest)
		if (op === 0x2c) {
			if (inFdef && !nestedFdefReported) {
				nestedFdefReported = true;
				addIssue(
					issues,
					'error',
					'TT_INSTR_NESTED_FDEF',
					`${owner}: FDEF at byte ${i} nested inside another FDEF.`,
				);
			}
			inFdef = true;
			i++;
			continue;
		}
		// ENDF (0x2D)
		if (op === 0x2d) {
			if (!inFdef && !strayEndfReported) {
				strayEndfReported = true;
				addIssue(
					issues,
					'error',
					'TT_INSTR_STRAY_ENDF',
					`${owner}: ENDF at byte ${i} with no matching FDEF.`,
				);
			}
			inFdef = false;
			i++;
			continue;
		}

		// All other opcodes are single-byte; we don't validate semantics here.
		i++;
	}

	if (ifDepth !== 0) {
		addIssue(
			issues,
			'error',
			'TT_INSTR_UNBALANCED_IF',
			`${owner}: ${ifDepth} unclosed IF block(s) at end of stream.`,
		);
	}
	if (inFdef) {
		addIssue(
			issues,
			'error',
			'TT_INSTR_UNCLOSED_FDEF',
			`${owner}: FDEF was never closed by ENDF before end of stream.`,
		);
	}
}

function validateTrueTypeProgramTables(parsedTables, issues) {
	if (parsedTables.fpgm?.instructions) {
		validateTrueTypeInstructions(parsedTables.fpgm.instructions, 'fpgm', issues);
	}
	if (parsedTables.prep?.instructions) {
		validateTrueTypeInstructions(parsedTables.prep.instructions, 'prep', issues);
	}
	const glyphs = parsedTables.glyf?.glyphs;
	if (Array.isArray(glyphs)) {
		// To avoid noise, only walk each glyph until the first issue is found.
		// validateTrueTypeInstructions already de-duplicates per call, but we
		// also stop after the first glyph that reports anything.
		const firstIssueCount = issues.length;
		for (let gid = 0; gid < glyphs.length; gid++) {
			const instr = glyphs[gid]?.instructions;
			if (!instr || instr.length === 0) continue;
			validateTrueTypeInstructions(instr, `glyf glyph ${gid}`, issues);
			if (issues.length > firstIssueCount) break;
		}
	}
}

function phaseCrossTableChecks(parsedTables, entries, issues, sfnt) {
	const tags = new Set(entries.map((e) => e.tag));

	// head.magicNumber
	if (parsedTables.head) {
		if (parsedTables.head.magicNumber !== 0x5f0f3cf5) {
			addIssue(
				issues,
				'error',
				'BAD_MAGIC_NUMBER',
				`head.magicNumber is 0x${(parsedTables.head.magicNumber >>> 0).toString(16).padStart(8, '0')}, expected 0x5F0F3CF5.`,
			);
		}

		// unitsPerEm range (16–16384 per spec)
		const upm = parsedTables.head.unitsPerEm;
		if (upm !== undefined && (upm < 16 || upm > 16384)) {
			addIssue(
				issues,
				'error',
				'BAD_UNITS_PER_EM',
				`head.unitsPerEm is ${upm} — must be between 16 and 16384.`,
			);
		}

		// head.majorVersion must be 1 (Firefox/OTS rejects otherwise).
		if (
			parsedTables.head.majorVersion !== undefined &&
			parsedTables.head.majorVersion !== 1
		) {
			addIssue(
				issues,
				'error',
				'HEAD_MAJOR_VERSION_UNSUPPORTED',
				`head.majorVersion is ${parsedTables.head.majorVersion}, expected 1.`,
			);
		}

		// Bounding box sanity — xMin must be ≤ xMax and yMin ≤ yMax.
		const { xMin, xMax, yMin, yMax } = parsedTables.head;
		if (xMin !== undefined && xMax !== undefined && xMin > xMax) {
			addIssue(
				issues,
				'error',
				'HEAD_BBOX_INVERTED',
				`head.xMin (${xMin}) is greater than head.xMax (${xMax}).`,
			);
		}
		if (yMin !== undefined && yMax !== undefined && yMin > yMax) {
			addIssue(
				issues,
				'error',
				'HEAD_BBOX_INVERTED',
				`head.yMin (${yMin}) is greater than head.yMax (${yMax}).`,
			);
		}

		// indexToLocFormat must be 0 (short) or 1 (long).
		const itl = parsedTables.head.indexToLocFormat;
		if (itl !== undefined && itl !== 0 && itl !== 1) {
			addIssue(
				issues,
				'error',
				'HEAD_INDEX_TO_LOC_FORMAT_INVALID',
				`head.indexToLocFormat is ${itl}; must be 0 (short offsets) or 1 (long offsets).`,
			);
		}

		// glyphDataFormat must be 0 for the current OpenType format.
		const gdf = parsedTables.head.glyphDataFormat;
		if (gdf !== undefined && gdf !== 0) {
			addIssue(
				issues,
				'error',
				'HEAD_GLYPH_DATA_FORMAT_INVALID',
				`head.glyphDataFormat is ${gdf}; must be 0.`,
			);
		}
	}

	// maxp.version + numGlyphs sanity (Firefox/OTS).
	if (parsedTables.maxp) {
		const v = parsedTables.maxp.version;
		if (v !== undefined && v !== 0x00005000 && v !== 0x00010000) {
			addIssue(
				issues,
				'error',
				'MAXP_VERSION_INVALID',
				`maxp.version is 0x${(v >>> 0).toString(16).padStart(8, '0')}; must be 0x00005000 (0.5) or 0x00010000 (1.0).`,
			);
		}
		if (parsedTables.maxp.numGlyphs === 0) {
			addIssue(
				issues,
				'error',
				'MAXP_NUMGLYPHS_ZERO',
				'maxp.numGlyphs is 0 — font contains no glyphs.',
			);
		}

		// Tier 4: outline-flavor must agree with maxp.version.
		// TrueType outlines (glyf/loca) require maxp v1.0 (0x00010000); CFF
		// or CFF2 outlines require maxp v0.5 (0x00005000).
		if (v === 0x00005000 && tags.has('glyf')) {
			addIssue(
				issues,
				'error',
				'MAXP_VERSION_MISMATCH_FOR_OUTLINE',
				'maxp.version is 0.5 (CFF) but font contains a glyf table; TrueType outlines require maxp 1.0.',
			);
		}
		if (
			v === 0x00010000 &&
			(tags.has('CFF ') || tags.has('CFF2')) &&
			!tags.has('glyf')
		) {
			addIssue(
				issues,
				'error',
				'MAXP_VERSION_MISMATCH_FOR_OUTLINE',
				'maxp.version is 1.0 (TrueType) but font has only CFF/CFF2 outlines; CFF requires maxp 0.5.',
			);
		}
	}

	// hhea.majorVersion must be 1.
	if (
		parsedTables.hhea &&
		parsedTables.hhea.majorVersion !== undefined &&
		parsedTables.hhea.majorVersion !== 1
	) {
		addIssue(
			issues,
			'error',
			'HHEA_MAJOR_VERSION_UNSUPPORTED',
			`hhea.majorVersion is ${parsedTables.hhea.majorVersion}, expected 1.`,
		);
	}

	// post.version must be 1.0, 2.0, 2.5, or 3.0 (per OpenType spec).
	if (parsedTables.post && typeof parsedTables.post.version === 'number') {
		const pv = parsedTables.post.version;
		const valid =
			pv === 0x00010000 ||
			pv === 0x00020000 ||
			pv === 0x00025000 ||
			pv === 0x00030000;
		if (!valid) {
			addIssue(
				issues,
				'error',
				'POST_VERSION_UNSUPPORTED',
				`post.version is 0x${(pv >>> 0).toString(16).padStart(8, '0')}; must be 1.0, 2.0, 2.5, or 3.0.`,
			);
		}

		// post 2.0 carries its own glyph count which must match maxp.numGlyphs.
		if (
			pv === 0x00020000 &&
			parsedTables.maxp &&
			typeof parsedTables.post.numGlyphs === 'number' &&
			parsedTables.post.numGlyphs !== parsedTables.maxp.numGlyphs
		) {
			addIssue(
				issues,
				'error',
				'POST_NUMGLYPHS_MISMATCH',
				`post.numGlyphs (${parsedTables.post.numGlyphs}) does not match maxp.numGlyphs (${parsedTables.maxp.numGlyphs}).`,
			);
		}
	}

	// OS/2 version must be 0..5 (Firefox/OTS rejects unknown versions).
	if (parsedTables['OS/2'] && typeof parsedTables['OS/2'].version === 'number') {
		const v = parsedTables['OS/2'].version;
		if (v < 0 || v > 5) {
			addIssue(
				issues,
				'error',
				'OS2_VERSION_INVALID',
				`OS/2.version is ${v}; must be in range 0..5.`,
			);
		}
	}

	// OS/2 sanitization checks (Tier 3 — Firefox/OTS parity).
	// OTS auto-fixes most of these via Warning(); FFJS reports them as
	// `warning` so users can fix the JSON or rely on a future autoFix pass.
	if (parsedTables['OS/2']) {
		validateOS2Sanitization(parsedTables['OS/2'], parsedTables.head, issues);
	}

	// maxp.numGlyphs vs hmtx
	if (parsedTables.maxp && parsedTables.hmtx) {
		const numGlyphs = parsedTables.maxp.numGlyphs;
		const hmtxEntries = parsedTables.hmtx.hMetrics?.length ?? 0;
		const lsbs = parsedTables.hmtx.leftSideBearings?.length ?? 0;
		const totalHmtx = hmtxEntries + lsbs;
		if (totalHmtx !== numGlyphs) {
			addIssue(
				issues,
				'warning',
				'HMTX_GLYPH_MISMATCH',
				`hmtx has ${totalHmtx} entries (${hmtxEntries} metrics + ${lsbs} LSBs) but maxp.numGlyphs is ${numGlyphs}.`,
			);
		}
	}

	// hhea.numberOfHMetrics vs hmtx
	if (parsedTables.hhea && parsedTables.hmtx) {
		const expected = parsedTables.hhea.numberOfHMetrics;
		const actual = parsedTables.hmtx.hMetrics?.length ?? 0;
		if (actual !== expected) {
			addIssue(
				issues,
				'warning',
				'HHEA_HMTX_MISMATCH',
				`hhea.numberOfHMetrics is ${expected} but hmtx has ${actual} full metric entries.`,
			);
		}
	}

	// loca + glyf consistency
	if (parsedTables.loca && parsedTables.glyf) {
		const offsets = parsedTables.loca.offsets;
		if (offsets && offsets.length > 0) {
			const glyfEntry = entries.find((e) => e.tag === 'glyf');
			if (glyfEntry) {
				const last = offsets[offsets.length - 1];
				if (last > glyfEntry.length) {
					addIssue(
						issues,
						'error',
						'LOCA_BEYOND_GLYF',
						`loca final offset (${last}) exceeds glyf table length (${glyfEntry.length}).`,
					);
				}
			}
		}
	}

	// CFF consistency: numGlyphs vs charStrings count
	const cffTable = parsedTables['CFF '] || parsedTables.CFF2;
	if (cffTable && parsedTables.maxp) {
		const charStrCount =
			cffTable.topDict?.charStrings?.length ??
			cffTable.charStrings?.length ??
			null;
		if (charStrCount !== null && charStrCount !== parsedTables.maxp.numGlyphs) {
			addIssue(
				issues,
				'warning',
				'CFF_GLYPH_MISMATCH',
				`CFF charStrings count (${charStrCount}) doesn't match maxp.numGlyphs (${parsedTables.maxp.numGlyphs}).`,
			);
		}
	}

	// name table: should have family & style names
	if (parsedTables.name) {
		validateNameDeep(parsedTables.name, entries, sfnt, issues);
		const records =
			parsedTables.name.nameRecords ??
			parsedTables.name.names ??
			parsedTables.name.records ??
			[];
		const hasFamily = records.some((r) => r.nameID === 1);
		const hasStyle = records.some((r) => r.nameID === 2);
		if (!hasFamily) {
			addIssue(
				issues,
				'warning',
				'NO_FAMILY_NAME',
				'name table has no family name (nameID 1).',
			);
		}
		if (!hasStyle) {
			addIssue(
				issues,
				'warning',
				'NO_STYLE_NAME',
				'name table has no style name (nameID 2).',
			);
		}

		// Spec: name records must be sorted in ascending order by
		// (platformID, encodingID, languageID, nameID).  Some sanitizers
		// (e.g. Firefox/OTS) reject fonts with out-of-order name records.
		for (let i = 1; i < records.length; i++) {
			const a = records[i - 1];
			const b = records[i];
			const cmp =
				a.platformID - b.platformID ||
				a.encodingID - b.encodingID ||
				a.languageID - b.languageID ||
				a.nameID - b.nameID;
			if (cmp >= 0) {
				addIssue(
					issues,
					'error',
					'NAME_RECORDS_NOT_SORTED',
					`name records are not sorted: record ${i - 1} (pid=${a.platformID}, eid=${a.encodingID}, lid=${a.languageID}, nid=${a.nameID}) precedes record ${i} (pid=${b.platformID}, eid=${b.encodingID}, lid=${b.languageID}, nid=${b.nameID}).`,
				);
				break;
			}
		}
	}

	// cmap encoding records: spec requires ascending order by
	// (platformID, encodingID, language).  Some sanitizers (e.g. Firefox/OTS)
	// reject fonts with out-of-order subtables.
	if (parsedTables.cmap?.encodingRecords) {
		const recs = parsedTables.cmap.encodingRecords;
		const subs = parsedTables.cmap.subtables || [];
		for (let i = 1; i < recs.length; i++) {
			const a = recs[i - 1];
			const b = recs[i];
			const langA = (subs[a.subtableIndex] || {}).language || 0;
			const langB = (subs[b.subtableIndex] || {}).language || 0;
			const cmp =
				a.platformID - b.platformID || a.encodingID - b.encodingID || langA - langB;
			if (cmp >= 0) {
				addIssue(
					issues,
					'error',
					'CMAP_SUBTABLES_NOT_SORTED',
					`cmap encoding records are not sorted: record ${i - 1} (pid=${a.platformID}, eid=${a.encodingID}, lang=${langA}) precedes record ${i} (pid=${b.platformID}, eid=${b.encodingID}, lang=${langB}).`,
				);
				break;
			}
		}
	}

	// cmap deep structural validation (Tier 2 — Firefox/OTS parity).
	if (parsedTables.cmap) {
		validateCmapDeep(parsedTables.cmap, parsedTables.maxp, issues);
	}

	// CFF CharStrings INDEX: every charstring must end with the endchar
	// operator (0x0E = 14) at top level, otherwise font sanitizers will
	// reject the table with "Failed validating CharStrings INDEX".
	const cffParsed = parsedTables['CFF '];
	if (cffParsed?.fonts) {
		for (let f = 0; f < cffParsed.fonts.length; f++) {
			const cs = cffParsed.fonts[f].charStrings || [];
			for (let i = 0; i < cs.length; i++) {
				const bytes = cs[i];
				if (!bytes || bytes.length === 0) {
					addIssue(
						issues,
						'error',
						'CFF_EMPTY_CHARSTRING',
						`CFF font ${f}: charstring for glyph ${i} is empty (must contain at least an endchar operator).`,
					);
					break;
				}
				const last = bytes[bytes.length - 1];
				// 14 = endchar (Type 2). Charstrings using subroutines may end
				// with the endchar inside the subr, but the last byte of the
				// outer string is normally still endchar after our parser
				// converts items to byte arrays.  Operator 11 (return) is also
				// permitted as a tail when a subr is the final call site.
				if (last !== 14 && last !== 11) {
					addIssue(
						issues,
						'warning',
						'CFF_CHARSTRING_NO_ENDCHAR',
						`CFF font ${f}: charstring for glyph ${i} does not terminate with endchar (last byte = 0x${last.toString(16).padStart(2, '0')}).`,
					);
					break;
				}
			}
		}
	}

	// CFF + post version compatibility.  Per OpenType spec, CFF-flavored
	// fonts (those with a CFF or CFF2 table) MUST use post version 3.0 —
	// glyph names live in the CFF Charset, so the post table omits them.
	// Firefox/OTS rejects CFF fonts with post 2.0 ("Only version supported
	// for fonts with CFF table is 0x00030000").
	if (tags.has('CFF ') || tags.has('CFF2')) {
		// Prefer the parsed table; fall back to reading the version field
		// directly from the raw bytes if the parser failed (e.g. a malformed
		// post 2.0 with no glyph-name data).
		let postVersion;
		if (parsedTables.post && typeof parsedTables.post.version === 'number') {
			postVersion = parsedTables.post.version;
		} else if (sfnt) {
			const postEntry = entries.find((e) => e.tag === 'post');
			if (
				postEntry &&
				postEntry.length >= 4 &&
				postEntry.offset + 4 <= sfnt.byteLength
			) {
				postVersion = new DataView(sfnt).getUint32(postEntry.offset);
			}
		}
		if (postVersion !== undefined && postVersion !== 0x00030000) {
			const vStr = `0x${(postVersion >>> 0).toString(16).padStart(8, '0')}`;
			addIssue(
				issues,
				'error',
				'POST_VERSION_INVALID_FOR_CFF',
				`post table version is ${vStr} but CFF-flavored fonts must use 0x00030000 (3.0).`,
			);
		}
	}

	// vmtx + vhea consistency
	if (parsedTables.vhea && parsedTables.vmtx) {
		const expected =
			parsedTables.vhea.numOfLongVerMetrics ?? parsedTables.vhea.numberOfVMetrics;
		const actual = parsedTables.vmtx.metrics?.length ?? 0;
		if (expected !== undefined && actual !== expected) {
			addIssue(
				issues,
				'warning',
				'VHEA_VMTX_MISMATCH',
				`vhea.numOfLongVerMetrics is ${expected} but vmtx has ${actual} full metric entries.`,
			);
		}
	}

	// fvar + gvar: variable font consistency
	if (tags.has('gvar') && !tags.has('fvar')) {
		addIssue(
			issues,
			'error',
			'GVAR_WITHOUT_FVAR',
			'gvar table present without fvar — glyph variations require a variation axis table.',
		);
	}
	for (const dep of ['HVAR', 'VVAR', 'MVAR', 'avar']) {
		if (tags.has(dep) && !tags.has('fvar')) {
			addIssue(
				issues,
				'error',
				`${dep.toUpperCase()}_WITHOUT_FVAR`,
				`${dep} table present without fvar — variation tables require a variation axis table.`,
			);
		}
	}

	// Tier 7: deep table validation for variable + layout tables.
	const numGlyphs = parsedTables.maxp?.numGlyphs ?? 0;
	const fvar = parsedTables.fvar;
	const structCtx = makeStructuralCtx();
	if (fvar) {
		validateFvarDeep(fvar, issues);
		validateFvarNamesAndFlags(fvar, parsedTables.name, issues);
	}
	if (parsedTables.STAT) {
		validateSTAT(parsedTables.STAT, fvar, issues);
	}
	if (parsedTables.avar) {
		validateAvar(parsedTables.avar, fvar, issues);
	}
	if (parsedTables.HVAR) {
		validateHVVAR(parsedTables.HVAR, 'HVAR', fvar, issues);
	}
	if (parsedTables.VVAR) {
		validateHVVAR(parsedTables.VVAR, 'VVAR', fvar, issues);
	}
	if (parsedTables.MVAR) {
		validateMVAR(parsedTables.MVAR, fvar, issues);
	}
	if (parsedTables.GDEF) {
		validateGDEFTable(parsedTables.GDEF, numGlyphs, fvar, issues, structCtx);
	}
	if (parsedTables.GSUB) {
		validateLayoutLookups(parsedTables.GSUB, 'GSUB', issues);
		validateLayoutSubtables(
			parsedTables.GSUB,
			'GSUB',
			numGlyphs,
			issues,
			structCtx,
		);
	}
	if (parsedTables.GPOS) {
		validateLayoutLookups(parsedTables.GPOS, 'GPOS', issues);
		validateLayoutSubtables(
			parsedTables.GPOS,
			'GPOS',
			numGlyphs,
			issues,
			structCtx,
		);
	}
	if (parsedTables.MATH) {
		validateMATH(parsedTables.MATH, issues);
	}

	// Tier 7 second-pass: deep CFF charstring opcode validation.
	if (parsedTables['CFF ']) {
		validateCffCharStrings(parsedTables['CFF '], 'CFF', issues, false);
	}
	if (parsedTables.CFF2) {
		validateCffCharStrings(parsedTables.CFF2, 'CFF2', issues, true);
	}

	// Tier 7 second-pass: glyf composite cycle / depth + header bounds.
	if (parsedTables.glyf) {
		validateGlyfComposites(parsedTables.glyf, numGlyphs, issues);
		validateGlyfHeaders(parsedTables.glyf, parsedTables.head, issues);
	}

	// Tier 7 second-pass: cmap format-14 variation selector validation.
	if (parsedTables.cmap) {
		validateCmapFormat14(parsedTables.cmap, issues);
		validateCmapFormat12And13(parsedTables.cmap, issues);
	}

	// Tier 7 third-pass: TrueType instruction stream safety.
	validateTrueTypeProgramTables(parsedTables, issues);
}

// =========================================================================
//  Collection handling
// =========================================================================

function getCollectionFirstFontBuffer(buffer) {
	const reader = new DataReader(new Uint8Array(buffer));
	reader.skip(4); // 'ttcf'
	const majorVersion = reader.uint16();
	reader.skip(2); // minorVersion
	const numFonts = reader.uint32();
	if (numFonts === 0) return null;
	const firstOffset = reader.uint32();
	return { majorVersion, numFonts, firstOffset };
}

// =========================================================================
//  Main entry point
// =========================================================================

/**
 * Diagnose a binary font file and produce a detailed report of any problems.
 *
 * Unlike `importFont()` which throws on corruption, this function catches
 * errors at each phase and continues, building a comprehensive diagnostic
 * report that explains exactly what's wrong.
 *
 * @param {ArrayBuffer} buffer - Raw font file bytes.
 * @returns {object} Report: `{ valid, errors, warnings, infos, issues, summary }`.
 */
export function diagnoseFont(buffer) {
	const issues = [];

	// Tier 4: oversize file guard.  Firefox/OTS rejects fonts larger than
	// 1 GiB outright (`OTS_PARSER_BAILED`), so flag the file but continue
	// best-effort diagnosis.
	if (buffer && typeof buffer.byteLength === 'number') {
		const ONE_GB = 1024 * 1024 * 1024;
		if (buffer.byteLength > ONE_GB) {
			addIssue(
				issues,
				'error',
				'FILE_EXCEEDS_1GB',
				`Font file is ${buffer.byteLength} bytes (> 1 GiB); Firefox/OTS will reject it.`,
			);
		}
	}

	// --- Phase 1: Signature & format detection --------------------------
	const sig = phaseSignature(buffer, issues);
	if (!sig) return buildReport(issues);

	let sfnt = sig.sfnt;

	// Handle collections: diagnose the first font
	if (sig.format === 'collection') {
		try {
			const info = getCollectionFirstFontBuffer(sfnt);
			if (!info || info.numFonts === 0) {
				addIssue(
					issues,
					'error',
					'EMPTY_COLLECTION',
					'Collection contains no fonts.',
				);
				return buildReport(issues);
			}
			// TTC majorVersion must be 1 or 2 (Firefox/OTS rejects other values).
			if (info.majorVersion !== 1 && info.majorVersion !== 2) {
				addIssue(
					issues,
					'error',
					'TTC_VERSION_INVALID',
					`TTC majorVersion is ${info.majorVersion}; must be 1 or 2.`,
				);
				return buildReport(issues);
			}
			// Sanity-cap numFonts (OTS rejects > 0x10000).
			if (info.numFonts > 0x10000) {
				addIssue(
					issues,
					'error',
					'TTC_TOO_MANY_FONTS',
					`TTC numFonts is ${info.numFonts}; must be ≤ ${0x10000}.`,
				);
				return buildReport(issues);
			}
			addIssue(
				issues,
				'info',
				'COLLECTION_INFO',
				`Collection contains ${info.numFonts} font(s). Diagnosing the first font at offset ${info.firstOffset}.`,
			);
			// For collections, we diagnose at the SFNT offset within the same buffer
			// We create a virtual sub-reader starting at firstOffset
			sfnt = buffer; // Use the full buffer — phases must account for offset
		} catch (err) {
			addIssue(
				issues,
				'error',
				'COLLECTION_HEADER_UNREADABLE',
				`Could not read collection header: ${err.message}`,
			);
			return buildReport(issues);
		}
	}

	// --- Phase 2: SFNT header -------------------------------------------
	const header = phaseHeader(sfnt, issues);
	if (!header) return buildReport(issues);

	// --- Phase 3: Table directory ---------------------------------------
	const entries = phaseDirectory(sfnt, header, issues);
	if (entries.length === 0 && header.numTables > 0) {
		addIssue(
			issues,
			'error',
			'NO_READABLE_ENTRIES',
			'Could not read any table directory entries.',
		);
		return buildReport(issues);
	}

	// --- Phase 4: Required tables & outlines ----------------------------
	phaseRequiredTables(entries, issues);

	// --- Phase 5: Checksums ---------------------------------------------
	phaseChecksums(sfnt, entries, issues);

	// --- Phase 6: Per-table parsing ------------------------------------
	const parsedTables = phaseParseTables(sfnt, entries, issues);

	// --- Phase 7: Cross-table consistency -------------------------------
	phaseCrossTableChecks(parsedTables, entries, issues, sfnt);

	return buildReport(issues);
}

// =========================================================================
//  Internal helpers exposed for unit testing
// =========================================================================

export const _internal = {
	validateCmapDeep,
	validateOS2Sanitization,
	validateNameDeep,
	validateWoff1Wrapper,
	validateWoff2Wrapper,
	validateFvarDeep,
	validateFvarNamesAndFlags,
	validateLayoutLookups,
	validateSTAT,
	validateAvar,
	validateItemVariationStore,
	validateMVAR,
	validateHVVAR,
	validateGDEFTable,
	validateCoverage,
	validateClassDef,
	validateLayoutSubtables,
	validateMATH,
	validateCffCharStrings,
	validateGlyfComposites,
	validateGlyfHeaders,
	validateCmapFormat14,
	validateCmapFormat12And13,
	validateTrueTypeInstructions,
	validateTrueTypeProgramTables,
};
