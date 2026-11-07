import { convertOutlines } from '../convert.js';
import { remapLayoutGlyphs } from '../layout_remap.js';
import { interpretCharString } from '../otf/charstring_interpreter.js';
import { writeCFF } from '../otf/table_CFF.js';
import { parseCmap } from '../sfnt/table_cmap.js';
import { parseCOLR } from '../sfnt/table_COLR.js';
import { parseName } from '../sfnt/table_name.js';
import { _internal } from './diagnoseFont.js';
import { applyMetadataRepair, subtableMappings } from './metadata-repairs.js';
import { readCff } from './repair-cff.js';
import { nameLayout } from './repair-data.js';
import {
	applyTT, derivedMetricExtrema, inspectTT, integer, maskedEqual, need,
	readMetrics, readTT, same, semanticEqual, staticOnly, view,
} from './repair-tt.js';

export const REMOVABLE_TABLES = Object.freeze(['gasp', 'kern', 'SVG ', 'COLR', 'CPAL', 'meta', 'hdmx', 'LTSH', 'VDMX']);
const BASE_TABLES = ['head', 'maxp', 'name', 'OS/2', 'post', 'cmap', 'hhea', 'hmtx', 'glyf', 'loca', 'DSIG'];
const OPTIONAL_CONTEXT = new Set([...BASE_TABLES, ...REMOVABLE_TABLES, 'CFF ', 'vhea', 'vmtx',
	'GSUB', 'GPOS', 'GDEF', 'BASE', 'JSTF', 'MATH', 'fpgm', 'prep', 'cvt ']);
const REMOVE_CONTEXT = new Set([...BASE_TABLES, 'vhea', 'vmtx', 'gasp', 'COLR', 'CPAL']);

function knownTables(payloads, allowed) {
	staticOnly(payloads);
	for (const tag of payloads.keys())
		if (!allowed.has(tag)) throw new Error(`Unsupported opaque or reference dependency ${tag}.`);
}

function dehinted(tt, payloads) {
	if (['fpgm', 'prep', 'cvt '].some((tag) => payloads.has(tag)) ||
		tt.glyphs.some((glyph) => glyph?.instructions.length))
		throw new Error('Apply an explicitly verified dehinting transaction first.');
}

function basicMetadata(payloads) {
	if (view(need(payloads, 'head', 54)).getUint32(0) !== 0x10000)
		throw new Error('Unsupported head version.');
	if (view(payloads.get('head')).getInt16(52) !== 0)
		throw new Error('Unsupported head glyphDataFormat.');
	if (payloads.has('name')) nameLayout(need(payloads, 'name', 6));
	if (payloads.has('OS/2')) {
		const bytes = need(payloads, 'OS/2', 2);
		const version = view(bytes).getUint16(0);
		const lengths = [78, 86, 96, 96, 96, 100];
		if (version > 5 || bytes.length < lengths[version])
			throw new Error('Unsupported or truncated OS/2 dependency.');
	}
	if (payloads.has('post')) {
		const bytes = need(payloads, 'post', 32);
		if (view(bytes).getUint32(0) !== 0x30000 || bytes.length !== 32)
			throw new Error('A complete post format 3 header is required; explicitly drop glyph names first.');
	}
}

function cmapReferenceProof(payloads, count, removedGlyph, options) {
	const bytes = need(payloads, 'cmap', 4);
	const v = view(bytes);
	const records = v.getUint16(2);
	if (v.getUint16(0) !== 0 || 4 + records * 8 > bytes.length)
		throw new Error('Invalid cmap dependency.');
	for (let i = 0; i < records; i++) {
		const offset = v.getUint32(4 + i * 8 + 4);
		if (offset < 4 + records * 8 || offset + 16 > bytes.length)
			throw new Error('Truncated or aliased cmap dependency.');
		const format = v.getUint16(offset);
		if (format !== 4 && format !== 12)
			throw new Error('Reference proof supports only complete cmap formats 4 and 12; UVS and unknown formats are blocked.');
		const length = format === 4 ? v.getUint16(offset + 2) : v.getUint32(offset + 4);
		if (offset + length > bytes.length || length < 16)
			throw new Error('Truncated cmap subtable.');
		if (format === 4) {
			const twice = v.getUint16(offset + 6);
			if (!twice || twice % 2 || length % 2 || 16 + 4 * twice > length)
				throw new Error('Invalid cmap format-4 arrays.');
		} else if (length !== 16 + v.getUint32(offset + 12) * 12)
			throw new Error('Invalid cmap format-12 group count.');
	}
	const cmap = parseCmap(bytes);
	const issues = [];
	_internal.validateCmapDeep(cmap, { numGlyphs: count }, issues, options);
	if (issues.length) throw new Error(`cmap reference proof blocked by ${issues[0].code}.`);
	let work = 0;
	const maximum = integer(options.maxStructureNodes ?? 1000000, 1, 10000000, 'maxStructureNodes');
	for (const subtable of cmap.subtables) {
		const mappings = subtableMappings(subtable, { ...options, maxStructureNodes: maximum - work });
		work += mappings.size;
		if (work > maximum) throw new Error('cmap reference proof exceeds maxStructureNodes.');
		for (const glyph of mappings.values()) {
			if (glyph >= count) throw new Error('cmap references an out-of-range glyph.');
			if (glyph === removedGlyph) throw new Error('The selected glyph is referenced by cmap.');
		}
	}
}

function completeTTStorage(payloads, tt) {
	if (need(payloads, 'maxp').length !== 32 ||
		need(payloads, 'loca').length !== tt.offsets.length * (tt.format ? 4 : 2) ||
		tt.offsets[0] !== 0 || tt.offsets.at(-1) !== need(payloads, 'glyf').length)
		throw new Error('Opaque maxp/loca/glyf storage prevents complete outline replacement proof.');
}

function optionalRemoval(step, payloads, options) {
	const tag = step.values?.tag;
	if (!REMOVABLE_TABLES.includes(tag)) throw new Error('Select exactly one supported optional table.');
	need(payloads, tag);
	knownTables(payloads, OPTIONAL_CONTEXT);
	if (tag === 'CPAL' && (payloads.has('COLR') || payloads.has('SVG ')))
		throw new Error('CPAL is retained while COLR or SVG may reference its palettes.');
	if (['COLR', 'SVG '].includes(tag)) {
		if (payloads.has('glyf')) readTT(payloads, options);
		else readCff(payloads, options);
	}
	return tag;
}

function lastGlyphProof(payloads, options, selected) {
	knownTables(payloads, REMOVE_CONTEXT);
	const tt = readTT(payloads, options);
	dehinted(tt, payloads);
	basicMetadata(payloads);
	completeTTStorage(payloads, tt);
	const last = tt.glyphs.length - 1;
	if (last < 1) throw new Error('The original .notdef glyph cannot be removed.');
	if (selected !== undefined && integer(selected, 1, last, 'glyphIndex') !== last)
		throw new Error('Only the isolated final glyph may be removed; no renumbering is offered.');
	for (const glyph of tt.glyphs.slice(0, last))
		if (glyph?.components?.some((component) => component.glyphIndex === last))
			throw new Error('A retained composite references the selected final glyph.');
	cmapReferenceProof(payloads, tt.glyphs.length, last, options);
	if (payloads.has('COLR')) {
		const bytes = need(payloads, 'COLR', 14);
		const v = view(bytes);
		if (v.getUint16(0) !== 0 || v.getUint16(2) && v.getUint32(4) < 14 ||
			v.getUint16(12) && v.getUint32(8) < 14)
			throw new Error('Only complete COLR v0 references are supported.');
		const color = parseCOLR(bytes, options);
		if (color.baseGlyphRecords.length !== v.getUint16(2) || color.layerRecords.length !== v.getUint16(12) ||
			color.baseGlyphRecords.some((record) => record.firstLayerIndex + record.numLayers > color.layerRecords.length))
			throw new Error('Invalid COLR reference arrays.');
		// Reuse the existing subset/remap guard. No serialized layout table is rewritten.
		const indices = new Map(Array.from({ length: last }, (_, index) => [index, index]));
		remapLayoutGlyphs(color, 'COLR', indices);
	}
	const layout = tt.layouts[last];
	if (layout && need(payloads, 'glyf').subarray(layout.contentEnd, layout.end).some((byte) => byte))
		throw new Error('Nonzero opaque bytes in the selected glyph cannot be discarded.');
	for (const vertical of [false, true]) {
		const header = vertical ? 'vhea' : 'hhea';
		const tag = vertical ? 'vmtx' : 'hmtx';
		if (vertical && !payloads.has(header) && !payloads.has(tag)) continue;
		const metrics = readMetrics(payloads, vertical);
		if (need(payloads, tag).length !== metrics.length)
			throw new Error(`Opaque ${tag} suffix blocks glyph-count changes.`);
	}
	if (inspectTT(payloads, options).some((issue) => issue.code === 'TT_DERIVED_BOUNDS_MISMATCH'))
		throw new Error('Repair derived bounds first; removing a glyph must not reposition retained glyphs.');
	return tt;
}

function expectedCubic(contour) {
	if (contour.length < 2 || !contour[0].onCurve || !contour.at(-1).onCurve)
		throw new Error('Conversion currently requires explicit on-curve contour endpoints; implied starts/closure require source-aware conversion.');
	const result = [{ type: 'M', x: contour[0].x, y: contour[0].y }];
	let start = contour[0];
	for (let i = 1; i < contour.length; i++) {
		const point = contour[i];
		if (point.onCurve) {
			result.push({ type: 'L', x: point.x, y: point.y });
			start = point;
		} else {
			const end = contour[++i];
			if (!end?.onCurve) throw new Error('Consecutive off-curve points are not covered by the conversion proof.');
			result.push({ type: 'C',
				x1: (start.x + 2 * point.x) / 3, y1: (start.y + 2 * point.y) / 3,
				x2: (end.x + 2 * point.x) / 3, y2: (end.y + 2 * point.y) / 3,
				x: end.x, y: end.y });
			start = end;
		}
	}
	return result;
}

function conversionProof(payloads, options) {
	knownTables(payloads, new Set(BASE_TABLES));
	const tt = readTT(payloads, options);
	basicMetadata(payloads);
	completeTTStorage(payloads, tt);
	dehinted(tt, payloads);
	integer(tt.glyphs.length, 1, 65146, 'CFF custom charset SID count');
	if (!payloads.has('post')) throw new Error('A complete post format 3 header is required before conversion.');
	cmapReferenceProof(payloads, tt.glyphs.length, -1, options);
	if (inspectTT(payloads, options).some((issue) => issue.code === 'TT_DERIVED_BOUNDS_MISMATCH'))
		throw new Error('Repair derived TrueType bounds before converting outlines.');
	const metrics = readMetrics(payloads);
	const upm = integer(view(need(payloads, 'head')).getUint16(18), 16, 16384, 'unitsPerEm');
	const contours = tt.glyphs.map((glyph, i) => {
		if (glyph?.components) throw new Error('Explicitly decompose composite glyphs before outline conversion.');
		if (tt.geometry[i].points && metrics.records[i][1] !== tt.geometry[i].bounds[0])
			throw new Error('TrueType bearing/outline origin mismatch requires source-aware position reconciliation.');
		const layout = tt.layouts[i];
		if (layout && need(payloads, 'glyf').subarray(layout.contentEnd, layout.end).some((byte) => byte))
			throw new Error('Nonzero opaque glyph suffixes cannot be lost in conversion.');
		return (glyph?.contours ?? []).map(expectedCubic);
	});
	const post = view(need(payloads, 'post'));
	const postMetadata = {
		isFixedPitch: post.getUint32(12), ItalicAngle: post.getInt32(4) / 65536,
		UnderlinePosition: post.getInt16(8), UnderlineThickness: post.getInt16(10),
	};
	if (postMetadata.isFixedPitch > 1) throw new Error('Unsupported nonboolean post fixed-pitch declaration.');
	return { tt, metrics, upm, contours, postMetadata };
}

function conversionValues(values) {
	if (values.allowOutlineLoss !== true) throw new Error('Explicit outline/program representation loss authorization is required.');
	if (typeof values.tolerance !== 'number' || !Number.isFinite(values.tolerance) || values.tolerance < 0 || values.tolerance > 1)
		throw new Error('tolerance must be a finite Euclidean font-unit bound between 0 and 1.');
	if (typeof values.postScriptName !== 'string' || !/^[!-~]{1,63}$/.test(values.postScriptName) || /[[\](){}<>/%]/.test(values.postScriptName))
		throw new Error('Supply a valid authoritative ASCII PostScript font name of at most 63 characters.');
}

function verifyConversionGeometry(source, cff, tolerance, options) {
	if (cff.isCff2 || cff.parsed.fonts.length !== 1 || cff.programs.length !== source.tt.glyphs.length)
		throw new Error('Converted CFF glyph count/context differs from the original.');
	const font = cff.parsed.fonts[0];
	if (font.isCIDFont || cff.parsed.globalSubrs.length || font.localSubrs.length)
		throw new Error('Unexpected converted CFF subroutine or CID context.');
	const matrix = font.topDict.FontMatrix ?? [0.001, 0, 0, 0.001, 0, 0];
	const expectedMatrix = [1 / source.upm, 0, 0, 1 / source.upm, 0, 0];
	if (!same(matrix, expectedMatrix)) throw new Error('Converted font matrix changed scale or origin.');
	const strings = Array.from({ length: source.tt.glyphs.length - 1 }, (_, i) => `gid${i + 1}`);
	const boxes = source.tt.geometry.filter((glyph) => glyph.points).map((glyph) => glyph.bounds);
	const fontBox = boxes.length ? [
		Math.min(...boxes.map((box) => box[0])), Math.min(...boxes.map((box) => box[1])),
		Math.max(...boxes.map((box) => box[2])), Math.max(...boxes.map((box) => box[3])),
	] : [0, 0, 0, 0];
	if (!semanticEqual(font.topDict, { FontMatrix: expectedMatrix, FontBBox: fontBox, ...source.postMetadata }) ||
		!semanticEqual(font.privateDict, {}) || !same(cff.parsed.strings, strings) ||
		!same(font.charset, strings.map((_, i) => 391 + i)) ||
		font.encoding !== 'Standard' || cff.parsed.majorVersion !== 1 || cff.parsed.minorVersion !== 0)
		throw new Error('Unexpected converted CFF dictionary, charset, encoding or naming data.');
	const maximum = integer(options.maxCharStringOperations ?? 1000000, 1, 10000000, 'maxCharStringOperations');
	for (let i = 0; i < cff.programs.length; i++) {
		const program = cff.programs[i];
		for (let pos = 0; pos < program.length; pos++) {
			const opcode = program[pos];
			if (opcode === 28) pos += 2;
			else if (opcode === 255) pos += 4;
			else if (opcode >= 247) pos++;
			else if (opcode < 32 && ![4, 5, 6, 7, 8, 14, 21, 22].includes(opcode))
				throw new Error('Unexpected hints, arithmetic or subroutine operators in converted CFF.');
		}
		const actual = interpretCharString(cff.programs[i], [], [], {
			maxCharStringOperations: Math.max(1, Math.floor(maximum / cff.programs.length)),
		});
		const width = actual.width === null ? font.privateDict.defaultWidthX ?? 0 :
			actual.width + (font.privateDict.nominalWidthX ?? 0);
		if (width !== source.metrics.records[i][0]) throw new Error(`Converted glyph ${i} advance differs.`);
		const expected = source.contours[i];
		// The compiler represents an empty glyph as an otherwise inert move.
		const contours = actual.contours.filter((contour) => contour.length > 1);
		if (contours.length !== expected.length) throw new Error(`Converted glyph ${i} contour count differs.`);
		for (let j = 0; j < contours.length; j++) {
			if (contours[j].length !== expected[j].length) throw new Error('Converted curve topology differs.');
			for (let k = 0; k < contours[j].length; k++) {
				const a = contours[j][k], b = expected[j][k];
				if (a.type !== b.type) throw new Error('Converted segment type differs.');
				for (const [x, y] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
					if (b[x] === undefined) continue;
					if (!Number.isFinite(a[x]) || !Number.isFinite(a[y]) || Math.hypot(a[x] - b[x], a[y] - b[y]) > tolerance + 1e-10)
						throw new Error(`Converted glyph ${i} exceeds the explicit geometric tolerance.`);
				}
			}
		}
	}
}

export function mitigationPrerequisites(id, payloads, options = {}) {
	if (id === 'tt.remove-last-glyph') lastGlyphProof(payloads, options);
	else if (id === 'outlines.to-cff') conversionProof(payloads, options);
	else if (id === 'tables.remove-optional') {
		knownTables(payloads, OPTIONAL_CONTEXT);
		if (!REMOVABLE_TABLES.some((tag) => payloads.has(tag))) throw new Error('No supported optional table is present.');
	} else throw new Error(`Unknown mitigation: ${id}`);
}

export function applyMitigation(step, payloads, options = {}) {
	if (step.id === 'tables.remove-optional') {
		payloads.delete(optionalRemoval(step, payloads, options));
		return;
	}
	if (step.id === 'tt.remove-last-glyph') {
		const tt = lastGlyphProof(payloads, options, integer(step.values?.glyphIndex, 1, 65534, 'glyphIndex'));
		const last = tt.glyphs.length - 1;
		for (const vertical of [false, true]) {
			if (vertical && !payloads.has('vmtx') && !payloads.has('vhea')) continue;
			const metrics = readMetrics(payloads, vertical);
			payloads.set(metrics.tag, need(payloads, metrics.tag).slice(0, metrics.length - (metrics.longCount === last + 1 ? 4 : 2)));
			const header = need(payloads, metrics.headerTag).slice();
			view(header).setUint16(34, Math.min(last, metrics.longCount));
			payloads.set(metrics.headerTag, header);
		}
		payloads.set('glyf', need(payloads, 'glyf').slice(0, tt.offsets[last]));
		payloads.set('loca', need(payloads, 'loca').slice(0, - (tt.format ? 4 : 2)));
		const maxp = need(payloads, 'maxp').slice();
		view(maxp).setUint16(4, last);
		payloads.set('maxp', maxp);
		for (const id of ['tt.bounds', 'tt.maxp-geometry', 'hhea.extrema', ...(payloads.has('vhea') ? ['vhea.extrema'] : [])])
			applyTT({ id }, payloads, options);
		if (payloads.has('OS/2') && view(payloads.get('OS/2')).getUint16(0) >= 3)
			applyMetadataRepair({ id: 'os2.average-width', values: {} }, payloads, options);
		return;
	}
	if (step.id !== 'outlines.to-cff') throw new Error(`Unknown mitigation: ${step.id}`);
	conversionValues(step.values ?? {});
	const source = conversionProof(payloads, options);
	if (payloads.has('name') && parseName(Array.from(payloads.get('name'))).names
		.some((record) => record.nameID === 6 && record.value !== step.values.postScriptName))
		throw new Error('The CFF font name must agree with every existing PostScript name record; repair naming separately first.');
	const converted = convertOutlines({
		font: { unitsPerEm: source.upm },
		glyphs: source.tt.glyphs.map((glyph, i) => ({
			name: i ? `gid${i}` : '.notdef', contours: glyph?.contours ?? [],
			advanceWidth: source.metrics.records[i][0], leftSideBearing: source.metrics.records[i][1],
		})),
		tables: { glyf: { glyphs: source.tt.glyphs } },
	}, 'cff');
	const strings = converted.glyphs.slice(1).map((glyph) => glyph.name);
	const head = view(need(payloads, 'head'));
	payloads.set('CFF ', Uint8Array.from(writeCFF({
		majorVersion: 1, minorVersion: 0, names: [step.values.postScriptName], strings, globalSubrs: [],
		fonts: [{
			topDict: { ...source.postMetadata, FontMatrix: [1 / source.upm, 0, 0, 1 / source.upm, 0, 0],
				FontBBox: [36, 38, 40, 42].map((offset) => head.getInt16(offset)) },
			charset: strings.map((_, i) => 391 + i), encoding: 'Standard',
			charStrings: converted.glyphs.map((glyph) => glyph.charString), privateDict: {}, localSubrs: [],
		}],
	})));
	payloads.delete('glyf');
	payloads.delete('loca');
	const maxp = new Uint8Array(6);
	view(maxp).setUint32(0, 0x5000);
	view(maxp).setUint16(4, source.tt.glyphs.length);
	payloads.set('maxp', maxp);
	const header = need(payloads, 'head').slice();
	view(header).setInt16(50, 0);
	payloads.set('head', header);
	verifyConversionGeometry(source, readCff(payloads, options), step.values.tolerance, options);
}

export function verifyMitigations(before, after, steps, options = {}) {
	const failures = [];
	const handled = new Set();
	const check = (ok, message) => { if (!ok) failures.push(message); };
	for (const step of steps) {
		if (step.id === 'tables.remove-optional') {
			const tag = optionalRemoval(step, before, options);
			handled.add(tag);
			check(!after.has(tag), `Selected optional table ${tag} was not removed.`);
		} else if (step.id === 'outlines.to-cff') {
			conversionValues(step.values ?? {});
			const source = conversionProof(before, options);
			const cff = readCff(after, options);
			verifyConversionGeometry(source, cff, step.values.tolerance, options);
			check(cff.parsed.names.length === 1 && cff.parsed.names[0] === step.values.postScriptName, 'Unauthorized CFF font name.');
			const maxp = need(after, 'maxp', 6);
			check(maxp.length === 6 && view(maxp).getUint32(0) === 0x5000 &&
				view(maxp).getUint16(4) === source.tt.glyphs.length, 'Incorrect converted maxp encoding.');
			check(!after.has('glyf') && !after.has('loca'), 'TrueType outline tables remain after conversion.');
			check(view(need(after, 'head', 54)).getInt16(50) === 0 &&
				maskedEqual(need(before, 'head'), need(after, 'head'), [[8, 12], [50, 52]]),
			'Unapproved converted head format or metadata change.');
			for (const tag of ['glyf', 'loca', 'CFF ', 'maxp', 'head']) handled.add(tag);
		} else if (step.id === 'tt.remove-last-glyph') {
			const old = lastGlyphProof(before, options, integer(step.values?.glyphIndex, 1, 65534, 'glyphIndex'));
			const now = readTT(after, options);
			const count = old.glyphs.length - 1;
			check(now.glyphs.length === count && same(now.offsets, old.offsets.slice(0, -1)), 'Unexpected glyph count or retained loca offsets.');
			check(need(after, 'glyf').length === old.offsets[count], 'Unexpected trailing glyph data after removal.');
			check(same(need(after, 'loca'), need(before, 'loca').subarray(0, -(old.format ? 4 : 2))), 'Retained loca bytes changed.');
			now.glyphs.forEach((glyph, i) => {
				const original = old.glyphs[i];
				if (!glyph || !original) { check(glyph === original, 'Retained empty glyph changed.'); return; }
				const expected = { ...original };
				for (const key of ['xMin', 'yMin', 'xMax', 'yMax']) expected[key] = glyph[key];
				check(semanticEqual(expected, glyph), `Retained glyph ${i} topology/program changed.`);
				check(maskedEqual(need(before, 'glyf').subarray(old.offsets[i], old.offsets[i + 1]),
					need(after, 'glyf').subarray(now.offsets[i], now.offsets[i + 1]), [[2, 10]]), 'Retained glyph bytes changed.');
			});
			check(inspectTT(after, options).length === 0, 'Derived structures remain inconsistent after glyph removal.');
			check(maskedEqual(need(before, 'head'), need(after, 'head'), [[8, 12], [36, 44]]), 'Unapproved head mutation.');
			check(maskedEqual(need(before, 'maxp'), need(after, 'maxp'), [[4, 14], [26, 32]]), 'Unapproved VM maximum mutation.');
			for (const vertical of [false, true]) {
				if (vertical && !before.has('vmtx') && !before.has('vhea')) continue;
				const a = readMetrics(before, vertical), b = readMetrics(after, vertical);
				check(b.longCount === Math.min(count, a.longCount), 'Unapproved long-metric count after removal.');
				check(semanticEqual(a.records.slice(0, -1), b.records), 'Retained metrics changed.');
				check(same(need(after, a.tag), need(before, a.tag).subarray(0, b.length)), 'Retained metric encoding changed.');
				check(maskedEqual(need(before, a.headerTag), need(after, a.headerTag), [[10, 18], [34, 36]]), 'Unapproved metric header mutation.');
				const v = view(need(after, a.headerTag));
				check(derivedMetricExtrema(after, vertical, options).every((n, i) => n === (i ? v.getInt16(10 + i * 2) : v.getUint16(10))), 'Incorrect retained metric extrema.');
				handled.add(a.tag); handled.add(a.headerTag);
			}
			for (const tag of ['glyf', 'loca', 'maxp', 'head']) handled.add(tag);
			if (before.has('OS/2') && view(before.get('OS/2')).getUint16(0) >= 3) {
				const widths = readMetrics(after).records.map(([advance]) => advance).filter((value) => value !== 0);
				const average = widths.length ? Math.round(widths.reduce((sum, width) => sum + width, 0) / widths.length) : 0;
				check(view(need(after, 'OS/2')).getInt16(2) === average &&
					maskedEqual(need(before, 'OS/2'), need(after, 'OS/2'), [[2, 4]]), 'Unapproved OS/2 average or metadata change.');
				handled.add('OS/2');
			}
		} else throw new Error(`Unknown mitigation: ${step.id}`);
	}
	return { failures, handledTags: [...handled] };
}
