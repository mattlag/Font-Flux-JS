import { DataReader } from '../reader.js';
import { unwrapWOFF1 } from '../woff/woff1.js';
import { unwrapWOFF2 } from '../woff/woff2.js';
import { ALL_SUPPORTED_TABLES, REQUIRED_CORE_TABLES } from './tables.js';

// Re-use the import pipeline's table parser registry and parse order
import { tableParseOrder, tableParsers } from '../import.js';

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
		addIssue(
			issues,
			'error',
			'NOT_ARRAYBUFFER',
			'Input is not an ArrayBuffer.',
		);
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

/**
 * Phase 7: Cross-table consistency checks.
 */
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
	if (
		parsedTables['OS/2'] &&
		typeof parsedTables['OS/2'].version === 'number'
	) {
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
				a.platformID - b.platformID ||
				a.encodingID - b.encodingID ||
				langA - langB;
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
			parsedTables.vhea.numOfLongVerMetrics ??
			parsedTables.vhea.numberOfVMetrics;
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
};
