import { ALL_SUPPORTED_TABLES, REQUIRED_CORE_TABLES } from './tables.js';

// =========================================================================
//  Helpers
// =========================================================================

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUInt32(value) {
	return Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

function isUInt16(value) {
	return Number.isInteger(value) && value >= 0 && value <= 0xffff;
}

function hasRawTable(tableData) {
	return Array.isArray(tableData?._raw);
}

function addIssue(list, severity, code, message, path) {
	list.push({ severity, code, message, path });
}

// =========================================================================
//  Header helpers — compute correct directory fields for N tables
// =========================================================================

function computeDirectoryFields(numTables) {
	const maxPow2 = numTables > 0 ? 2 ** Math.floor(Math.log2(numTables)) : 0;
	const searchRange = maxPow2 * 16;
	const entrySelector = maxPow2 > 0 ? Math.floor(Math.log2(maxPow2)) : 0;
	const rangeShift = numTables * 16 - searchRange;
	return { searchRange, entrySelector, rangeShift };
}

/**
 * Infer sfVersion from the tables present.
 * CFF/CFF2 → 'OTTO' (0x4F54544F), otherwise TrueType (0x00010000).
 */
function inferSfVersion(tables) {
	if (isPlainObject(tables) && (tables['CFF '] || tables.CFF2)) {
		return 0x4f54544f;
	}
	return 0x00010000;
}

// =========================================================================
//  Report builder
// =========================================================================

export function buildReport(issues) {
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

export function validateSimplifiedJSON(data) {
	const issues = [];
	const error = (code, message, path) =>
		addIssue(issues, 'error', code, message, path);
	const integer = (value, min, max, path) => {
		if (
			value !== undefined &&
			(!Number.isInteger(value) || value < min || value > max)
		) {
			error(
				'NUMBER_OUT_OF_RANGE',
				`${path} must be an integer from ${min} to ${max}.`,
				path,
			);
		}
	};
	if (!isPlainObject(data?.font) || !Array.isArray(data?.glyphs)) {
		error(
			'SIMPLIFIED_SHAPE_INVALID',
			'Simplified fonts require a font object and a glyphs array.',
			'$',
		);
		return buildReport(issues);
	}
	integer(data.font.unitsPerEm, 16, 16384, '$.font.unitsPerEm');
	const active = new WeakSet();
	let visited = 0;
	const checkNested = (value, path, depth = 0) => {
		if (++visited > 10000000 || depth > 64) {
			error(
				'COMPLEXITY_LIMIT',
				'Nested authoring data exceeds the complexity limit.',
				path,
			);
			return false;
		}
		if (!value || typeof value !== 'object') return true;
		if (active.has(value)) {
			error('CYCLIC_DATA', 'Authoring data must not contain cycles.', path);
			return false;
		}
		active.add(value);
		for (const key of Object.keys(value)) {
			if (!checkNested(value[key], `${path}.${key}`, depth + 1)) return false;
		}
		active.delete(value);
		return true;
	};
	for (const key of [
		'substitutions',
		'kerning',
		'kerningClasses',
		'colorGlyphs',
	]) {
		if (!checkNested(data[key], `$.${key}`)) return buildReport(issues);
	}
	const array = (value, path, objects = false) => {
		if (value === undefined) return;
		if (
			!Array.isArray(value) ||
			(objects && value.some((entry) => !isPlainObject(entry)))
		)
			error(
				'ARRAY_SHAPE_INVALID',
				`${path} must be an array${objects ? ' of objects' : ''}.`,
				path,
			);
	};
	for (const key of [
		'kerning',
		'kerningClasses',
		'substitutions',
		'axes',
		'instances',
		'colorGlyphs',
	])
		array(data[key], `$.${key}`, true);
	array(data.palettes, '$.palettes');
	for (const [index, palette] of (Array.isArray(data.palettes)
		? data.palettes
		: []
	).entries())
		array(palette, `$.palettes[${index}]`);
	for (const [index, glyph] of data.glyphs.entries()) {
		if (!isPlainObject(glyph)) continue;
		for (const key of ['unicodes', 'instructions', 'charString'])
			array(glyph[key], `$.glyphs[${index}].${key}`);
		array(glyph.components, `$.glyphs[${index}].components`, true);
	}
	for (const [index, group] of (Array.isArray(data.kerningClasses)
		? data.kerningClasses
		: []
	).entries()) {
		if (group) array(group.pairs, `$.kerningClasses[${index}].pairs`, true);
	}
	for (const [index, glyph] of (Array.isArray(data.colorGlyphs)
		? data.colorGlyphs
		: []
	).entries()) {
		if (glyph) array(glyph.layers, `$.colorGlyphs[${index}].layers`, true);
	}
	if (issues.length) return buildReport(issues);
	if (data.glyphs.length < 1 || data.glyphs.length > 65535)
		error(
			'GLYPH_COUNT_INVALID',
			'Glyph count must be between 1 and 65535.',
			'$.glyphs',
		);
	const names = new Set();
	for (const [index, glyph] of data.glyphs.entries()) {
		const path = `$.glyphs[${index}]`;
		if (!isPlainObject(glyph)) {
			error('GLYPH_INVALID', 'Glyph must be an object.', path);
			continue;
		}
		if (glyph.name && names.has(glyph.name))
			addIssue(
				issues,
				data._header && data.tables ? 'warning' : 'error',
				'GLYPH_NAME_DUPLICATE',
				`Duplicate glyph name: ${glyph.name}`,
				`${path}.name`,
			);
		if (glyph.name) names.add(glyph.name);
		if (glyph.name !== undefined && typeof glyph.name !== 'string')
			error(
				'GLYPH_NAME_INVALID',
				'Glyph name must be a string.',
				`${path}.name`,
			);
		for (const key of ['instructions', 'charString']) {
			for (const value of glyph[key] || [])
				integer(value, 0, 255, `${path}.${key}`);
		}
		for (const key of ['advanceWidth', 'advanceHeight'])
			integer(glyph[key], 0, 65535, `${path}.${key}`);
		for (const key of ['leftSideBearing', 'topSideBearing'])
			integer(glyph[key], -32768, 32767, `${path}.${key}`);
		const codes = [
			glyph.unicode,
			...(Array.isArray(glyph.unicodes) ? glyph.unicodes : []),
		];
		for (const code of codes) {
			if (code == null) continue;
			integer(code, 0, 0x10ffff, `${path}.unicode`);
			if (code >= 0xd800 && code <= 0xdfff)
				error(
					'UNICODE_INVALID',
					'Unicode mappings cannot contain surrogate code points.',
					`${path}.unicode`,
				);
		}
		if (glyph.contours !== undefined && !Array.isArray(glyph.contours))
			error(
				'CONTOURS_INVALID',
				'Contours must be an array.',
				`${path}.contours`,
			);
		for (const contour of Array.isArray(glyph.contours) ? glyph.contours : []) {
			if (!Array.isArray(contour)) {
				error(
					'CONTOUR_INVALID',
					'Each contour must be an array.',
					`${path}.contours`,
				);
				continue;
			}
			for (const point of contour) {
				if (!isPlainObject(point)) {
					error(
						'POINT_INVALID',
						'Contour points must be objects.',
						`${path}.contours`,
					);
					continue;
				}
				for (const key of ['x', 'y', 'x1', 'y1', 'x2', 'y2']) {
					if (point?.[key] !== undefined && !Number.isFinite(point[key]))
						error(
							'COORDINATE_INVALID',
							'Outline coordinates must be finite numbers.',
							`${path}.contours`,
						);
				}
				const required =
					point.type === 'Z'
						? []
						: point.type === 'C'
							? ['x', 'y', 'x1', 'y1', 'x2', 'y2']
							: point.type === 'Q'
								? ['x', 'y', 'x1', 'y1']
								: ['x', 'y'];
				if (required.some((key) => !Number.isFinite(point[key])))
					error(
						'COORDINATE_INVALID',
						'Contour points require finite coordinates for their command.',
						`${path}.contours`,
					);
			}
		}
	}
	const axisTags = new Set();
	const unicodeNames = new Map();
	for (const glyph of data.glyphs) {
		if (!glyph) continue;
		for (const code of [glyph.unicode, ...(glyph.unicodes || [])])
			if (code != null) unicodeNames.set(code, glyph.name);
	}
	const reference = (value, path) => {
		if (Array.isArray(value)) {
			for (const member of value) reference(member, path);
			return;
		}
		const hex =
			typeof value === 'string' && /^(?:U\+|0x)([0-9a-f]+)$/i.exec(value);
		const name =
			typeof value === 'number'
				? unicodeNames.get(value)
				: hex
					? unicodeNames.get(parseInt(hex[1], 16))
					: value;
		if (!names.has(name))
			error(
				'GLYPH_REFERENCE_INVALID',
				`Unknown glyph reference: ${String(value)}`,
				path,
			);
	};
	for (const [index, glyph] of data.glyphs.entries()) {
		for (const component of glyph?.components || []) {
			const path = `$.glyphs[${index}].components`;
			if (component.glyphName == null && component.glyphIndex === undefined)
				error(
					'COMPONENT_REFERENCE_MISSING',
					'Component requires a glyphName or glyphIndex.',
					path,
				);
			integer(
				component.glyphIndex,
				0,
				(data.tables?.maxp?.numGlyphs ?? data.glyphs.length) - 1,
				`${path}.glyphIndex`,
			);
			for (const key of ['dx', 'dy', 'argument1', 'argument2'])
				integer(
					component[key],
					component.flags?.argsAreXYValues === false ? 0 : -32768,
					component.flags?.argsAreXYValues === false ? 65535 : 32767,
					`${path}.${key}`,
				);
			for (const key of ['scaleXY', 'transform'])
				if (component[key] !== undefined && !isPlainObject(component[key]))
					error(
						'COMPONENT_TRANSFORM_INVALID',
						'Component transforms must be objects.',
						`${path}.${key}`,
					);
			for (const value of [
				component.scale,
				...Object.values(component.scaleXY || {}),
				...Object.values(component.transform || {}),
			]) {
				if (
					value !== undefined &&
					(!Number.isFinite(value) || value < -2 || value > 32767 / 16384)
				)
					error(
						'COMPONENT_TRANSFORM_INVALID',
						'Component transforms must fit F2DOT14 (-2 to 1.99993896484375).',
						path,
					);
			}
			if (component.glyphName != null)
				reference(component.glyphName, `$.glyphs[${index}].components`);
		}
	}
	for (const [index, pair] of (data.kerning || []).entries()) {
		reference(pair.left, `$.kerning[${index}].left`);
		reference(pair.right, `$.kerning[${index}].right`);
		integer(pair.value, -32768, 32767, `$.kerning[${index}].value`);
	}
	for (const [index, group] of (data.kerningClasses || []).entries()) {
		for (const side of ['left', 'right']) {
			const classes = group[`${side}Classes`] || group.classes || {};
			for (const members of Object.values(classes))
				reference(members, `$.kerningClasses[${index}].${side}Classes`);
			for (const pair of group.pairs || []) {
				const ref = pair[side];
				if (typeof ref === 'string' && ref.startsWith('@')) {
					if (!classes[ref.slice(1)])
						error(
							'KERNING_CLASS_INVALID',
							`Unknown kerning class: ${ref}`,
							`$.kerningClasses[${index}]`,
						);
				} else reference(ref, `$.kerningClasses[${index}]`);
				integer(pair.value, -32768, 32767, `$.kerningClasses[${index}].value`);
			}
		}
	}
	const checkRule = (rule, path) => {
		if (!isPlainObject(rule)) {
			error('SUBSTITUTION_INVALID', 'Substitution must be an object.', path);
			return;
		}
		if (!Array.isArray(rule.actions) && rule.actions !== undefined) {
			error(
				'SUBSTITUTION_INVALID',
				'Substitution actions must be an array.',
				path,
			);
			return;
		}
		for (const key of [
			'from',
			'to',
			'alternates',
			'components',
			'ligature',
			'input',
			'backtrack',
			'lookahead',
		]) {
			if (rule[key] !== undefined) reference(rule[key], `${path}.${key}`);
		}
		if (rule.substitution !== undefined)
			checkRule(rule.substitution, `${path}.substitution`);
		for (const [index, action] of (rule.actions || []).entries()) {
			const actionPath = `${path}.actions[${index}]`;
			if (!isPlainObject(action)) {
				error(
					'SUBSTITUTION_INVALID',
					'Substitution actions must be objects.',
					actionPath,
				);
				continue;
			}
			if (action.substitution !== undefined)
				checkRule(action.substitution, `${actionPath}.substitution`);
			if (action.substitutions !== undefined) {
				array(action.substitutions, `${actionPath}.substitutions`, true);
				if (Array.isArray(action.substitutions))
					for (const nested of action.substitutions)
						checkRule(nested, `${actionPath}.substitutions`);
			}
		}
	};
	for (const [index, rule] of (data.substitutions || []).entries())
		checkRule(rule, `$.substitutions[${index}]`);
	const checkPaint = (paint, path) => {
		if (!isPlainObject(paint)) {
			error('PAINT_INVALID', 'Paint nodes must be objects.', path);
			return;
		}
		if (paint.glyphID !== undefined) {
			if (typeof paint.glyphID === 'string')
				reference(paint.glyphID, `${path}.glyphID`);
			else integer(paint.glyphID, 0, data.glyphs.length - 1, `${path}.glyphID`);
		}
		if (paint.paletteIndex !== undefined) {
			integer(paint.paletteIndex, 0, 65535, `${path}.paletteIndex`);
			if (
				paint.paletteIndex !== 65535 &&
				(!data.palettes?.length ||
					data.palettes.some((palette) => paint.paletteIndex >= palette.length))
			)
				error(
					'PALETTE_REFERENCE_INVALID',
					'Paint references a missing palette entry.',
					path,
				);
		}
		for (const [key, value] of Object.entries(paint)) {
			if (typeof value === 'number' && !Number.isFinite(value))
				error(
					'PAINT_INVALID',
					'Paint numeric values must be finite.',
					`${path}.${key}`,
				);
			if (Array.isArray(value)) {
				for (const item of value)
					if (item && typeof item === 'object')
						checkPaint(item, `${path}.${key}`);
			} else if (value && typeof value === 'object')
				checkPaint(value, `${path}.${key}`);
		}
	};
	for (const [index, glyph] of (data.colorGlyphs || []).entries()) {
		reference(glyph.name, `$.colorGlyphs[${index}].name`);
		if (glyph.paint !== undefined)
			checkPaint(glyph.paint, `$.colorGlyphs[${index}].paint`);
		for (const layer of glyph.layers || []) {
			reference(layer.glyph, `$.colorGlyphs[${index}].layers`);
			integer(
				layer.paletteIndex,
				0,
				65535,
				`$.colorGlyphs[${index}].paletteIndex`,
			);
			if (
				layer.paletteIndex !== 65535 &&
				data.palettes?.some((palette) => layer.paletteIndex >= palette.length)
			)
				error(
					'PALETTE_REFERENCE_INVALID',
					'Color layer references a missing palette entry.',
					`$.colorGlyphs[${index}].layers`,
				);
		}
	}
	for (const [index, axis] of (Array.isArray(data.axes)
		? data.axes
		: []
	).entries()) {
		const path = `$.axes[${index}]`;
		if (
			!axis ||
			typeof axis.tag !== 'string' ||
			!/^[\x20-\x7e]{4}$/.test(axis.tag) ||
			axisTags.has(axis.tag)
		)
			error(
				'AXIS_TAG_INVALID',
				'Axis tags must be unique four-character ASCII strings.',
				`${path}.tag`,
			);
		axisTags.add(axis?.tag);
		if (
			!axis ||
			![axis.min, axis.default, axis.max].every(Number.isFinite) ||
			axis.min > axis.default ||
			axis.default > axis.max
		)
			error(
				'AXIS_RANGE_INVALID',
				'Axes require finite min <= default <= max.',
				path,
			);
	}
	for (const [index, instance] of (data.instances || []).entries()) {
		const path = `$.instances[${index}].coordinates`;
		if (!isPlainObject(instance.coordinates)) {
			error(
				'INSTANCE_COORDINATES_INVALID',
				'Instance coordinates must be an object.',
				path,
			);
			continue;
		}
		for (const [tag, coordinate] of Object.entries(instance.coordinates)) {
			const axis = data.axes?.find((entry) => entry.tag === tag);
			if (
				!axis ||
				!Number.isFinite(coordinate) ||
				coordinate < axis.min ||
				coordinate > axis.max
			)
				error(
					'INSTANCE_COORDINATES_INVALID',
					`Instance coordinate ${tag} must reference an axis and lie within its range.`,
					path,
				);
		}
	}
	return buildReport(issues);
}

// =========================================================================
//  Header validation — with auto-fix
// =========================================================================

function validateHeader(fontData, tableCount, path, issues) {
	let header = fontData.header;

	// --- Resolve missing header ------------------------------------------
	if (!isPlainObject(header)) {
		if (isPlainObject(fontData._header)) {
			// Promoted from _header (e.g. fontFromJSON round-trip)
			fontData.header = { ...fontData._header };
			header = fontData.header;
			addIssue(
				issues,
				'info',
				'HEADER_PROMOTED',
				'No "header" found; promoted "_header" for export compatibility.',
				path,
			);
		} else {
			// Synthesize a header from scratch
			const sfVersion = inferSfVersion(fontData.tables);
			const dir = computeDirectoryFields(tableCount);
			fontData.header = {
				sfVersion,
				numTables: tableCount,
				...dir,
			};
			header = fontData.header;
			addIssue(
				issues,
				'info',
				'HEADER_SYNTHESIZED',
				`No header found; synthesized one (sfVersion=0x${sfVersion.toString(16).toUpperCase().padStart(8, '0')}, ${tableCount} tables).`,
				path,
			);
			return; // fully computed — no further checks needed
		}
	}

	// --- sfVersion -------------------------------------------------------
	if (!isUInt32(header.sfVersion)) {
		const inferred = inferSfVersion(fontData.tables);
		header.sfVersion = inferred;
		addIssue(
			issues,
			'info',
			'HEADER_SFVERSION_INFERRED',
			`header.sfVersion was missing or invalid; set to 0x${inferred.toString(16).toUpperCase().padStart(8, '0')} based on outline tables.`,
			`${path}.sfVersion`,
		);
	}

	// --- numTables -------------------------------------------------------
	if (
		header.numTables !== undefined &&
		(!Number.isInteger(header.numTables) || header.numTables < 0)
	) {
		addIssue(
			issues,
			'error',
			'HEADER_NUMTABLES_INVALID',
			'header.numTables must be a non-negative integer when provided.',
			`${path}.numTables`,
		);
	}

	if (header.numTables !== tableCount) {
		const old = header.numTables;
		header.numTables = tableCount;
		addIssue(
			issues,
			'info',
			'HEADER_NUMTABLES_CORRECTED',
			old === undefined
				? `header.numTables was missing; set to ${tableCount}.`
				: `header.numTables corrected from ${old} to ${tableCount}.`,
			`${path}.numTables`,
		);
	}

	// --- Directory fields (searchRange, entrySelector, rangeShift) -------
	const expected = computeDirectoryFields(tableCount);

	const needsCorrection =
		header.searchRange !== expected.searchRange ||
		header.entrySelector !== expected.entrySelector ||
		header.rangeShift !== expected.rangeShift;

	if (needsCorrection) {
		header.searchRange = expected.searchRange;
		header.entrySelector = expected.entrySelector;
		header.rangeShift = expected.rangeShift;
		addIssue(
			issues,
			'info',
			'HEADER_FIELDS_CORRECTED',
			`Header directory fields auto-corrected for ${tableCount} tables (searchRange=${expected.searchRange}, entrySelector=${expected.entrySelector}, rangeShift=${expected.rangeShift}).`,
			path,
		);
	}
}

// =========================================================================
//  Raw byte validation
// =========================================================================

function validateTableRawBytes(raw, path, issues) {
	if (!Array.isArray(raw)) {
		addIssue(
			issues,
			'error',
			'TABLE_RAW_INVALID_TYPE',
			'_raw must be an array of byte values.',
			path,
		);
		return;
	}

	for (let i = 0; i < raw.length; i++) {
		const value = raw[i];
		if (!Number.isInteger(value) || value < 0 || value > 255) {
			addIssue(
				issues,
				'error',
				'TABLE_RAW_INVALID_BYTE',
				`_raw[${i}] must be an integer byte (0-255).`,
				`${path}[${i}]`,
			);
			break;
		}
	}
}

// =========================================================================
//  Table-level validation
// =========================================================================

function validateTables(tables, path, issues) {
	if (!isPlainObject(tables)) {
		addIssue(
			issues,
			'error',
			'TABLES_MISSING',
			'Font tables are required and must be an object keyed by 4-char table tag.',
			path,
		);
		return [];
	}

	const tags = Object.keys(tables);
	if (tags.length === 0) {
		addIssue(
			issues,
			'error',
			'TABLES_EMPTY',
			'Font tables object is empty; at least core required tables are needed.',
			path,
		);
	}

	for (const tag of tags) {
		if (typeof tag !== 'string' || tag.length !== 4) {
			addIssue(
				issues,
				'error',
				'TABLE_TAG_INVALID',
				`Table tag "${tag}" must be exactly 4 characters.`,
				`${path}.${tag}`,
			);
		}

		const tableData = tables[tag];
		const tablePath = `${path}.${tag}`;

		if (!isPlainObject(tableData)) {
			addIssue(
				issues,
				'error',
				'TABLE_DATA_INVALID',
				`Table "${tag}" must be an object.`,
				tablePath,
			);
			continue;
		}

		if (tableData._checksum !== undefined && !isUInt32(tableData._checksum)) {
			addIssue(
				issues,
				'error',
				'TABLE_CHECKSUM_INVALID',
				`Table "${tag}" _checksum must be uint32 when provided.`,
				`${tablePath}._checksum`,
			);
		}

		if (tableData._raw !== undefined) {
			validateTableRawBytes(tableData._raw, `${tablePath}._raw`, issues);
		}

		const isSupported = ALL_SUPPORTED_TABLES.has(tag);
		const isRaw = hasRawTable(tableData);

		if (!isRaw && !isSupported) {
			// Parsed data for an unrecognized table — will fail at export
			addIssue(
				issues,
				'error',
				'TABLE_WRITER_UNSUPPORTED',
				`Table "${tag}" is parsed JSON but no writer is available. Use _raw for unknown tables.`,
				tablePath,
			);
		} else if (isRaw && !isSupported) {
			// Unrecognized table preserved as raw bytes — fine, just noting it
			addIssue(
				issues,
				'info',
				'TABLE_UNRECOGNIZED_RAW',
				`Table "${tag}" is not a recognized OpenType table; preserved via _raw bytes.`,
				tablePath,
			);
		}
	}

	return tags;
}

// =========================================================================
//  Cross-table dependency checks
// =========================================================================

function validateTableDependencies(tables, path, issues) {
	const hasTable = (tag) => tables[tag] !== undefined;
	const isParsed = (tag) => hasTable(tag) && !hasRawTable(tables[tag]);

	const requireForParsed = (tag, deps, messagePrefix = 'requires') => {
		if (!isParsed(tag)) return;
		for (const dep of deps) {
			if (!hasTable(dep)) {
				addIssue(
					issues,
					'error',
					'TABLE_DEPENDENCY_MISSING',
					`Parsed table "${tag}" ${messagePrefix} table "${dep}".`,
					`${path}.${tag}`,
				);
			}
		}
	};

	requireForParsed('hmtx', ['hhea', 'maxp']);
	requireForParsed('loca', ['head', 'maxp']);
	requireForParsed('glyf', ['loca', 'head', 'maxp']);
	requireForParsed('vmtx', ['vhea', 'maxp']);

	if (isParsed('gvar') && !hasTable('fvar')) {
		addIssue(
			issues,
			'warning',
			'VARIABLE_TABLE_DEPENDENCY',
			'Parsed table "gvar" usually expects "fvar" to describe variation axes.',
			`${path}.gvar`,
		);
	}

	if (isParsed('cvar') && !hasTable('fvar')) {
		addIssue(
			issues,
			'warning',
			'VARIABLE_TABLE_DEPENDENCY',
			'Parsed table "cvar" usually expects "fvar" to describe variation axes.',
			`${path}.cvar`,
		);
	}
}

// =========================================================================
//  Outline & required table checks
// =========================================================================

function validateOutlineAndRequiredTables(tables, path, issues) {
	const hasTable = (tag) => tables[tag] !== undefined;

	for (const tag of REQUIRED_CORE_TABLES) {
		if (!hasTable(tag)) {
			addIssue(
				issues,
				'error',
				'REQUIRED_TABLE_MISSING',
				`Required core table "${tag}" is missing.`,
				path,
			);
		}
	}

	if (!hasTable('OS/2')) {
		addIssue(
			issues,
			'warning',
			'RECOMMENDED_TABLE_MISSING',
			'Recommended table "OS/2" is missing.',
			path,
		);
	}

	const hasTrueTypeOutline = hasTable('glyf') || hasTable('loca');
	const hasCffOutline = hasTable('CFF ') || hasTable('CFF2');

	if (!hasTrueTypeOutline && !hasCffOutline) {
		addIssue(
			issues,
			'error',
			'OUTLINE_MISSING',
			'No outline tables found. Include TrueType (glyf+loca) or CFF (CFF / CFF2) outlines.',
			path,
		);
	}

	if (hasTrueTypeOutline) {
		if (!hasTable('glyf')) {
			addIssue(
				issues,
				'error',
				'TRUETYPE_OUTLINE_INCOMPLETE',
				'TrueType outline requires table "glyf".',
				path,
			);
		}
		if (!hasTable('loca')) {
			addIssue(
				issues,
				'error',
				'TRUETYPE_OUTLINE_INCOMPLETE',
				'TrueType outline requires table "loca".',
				path,
			);
		}
	}

	if (hasTrueTypeOutline && hasCffOutline) {
		addIssue(
			issues,
			'warning',
			'MULTIPLE_OUTLINE_TYPES',
			'Both TrueType and CFF outline tables are present; most fonts use one outline model.',
			path,
		);
	}
}

// =========================================================================
//  Single-font validation
// =========================================================================

function validateSingleFont(fontData, path, issues) {
	if (!isPlainObject(fontData)) {
		addIssue(
			issues,
			'error',
			'FONTDATA_INVALID',
			'Font data must be an object.',
			path,
		);
		return;
	}

	const tags = validateTables(fontData.tables, `${path}.tables`, issues);
	validateHeader(fontData, tags.length, `${path}.header`, issues);

	if (isPlainObject(fontData.tables)) {
		validateOutlineAndRequiredTables(fontData.tables, `${path}.tables`, issues);
		validateTableDependencies(fontData.tables, `${path}.tables`, issues);
	}
}

// =========================================================================
//  Collection validation
// =========================================================================

function validateCollection(collectionData, path, issues) {
	const collection = collectionData.collection;
	const fonts = collectionData.fonts;

	if (!isPlainObject(collection)) {
		addIssue(
			issues,
			'error',
			'COLLECTION_META_INVALID',
			'collection must be an object for TTC/OTC inputs.',
			`${path}.collection`,
		);
	}

	if (!Array.isArray(fonts) || fonts.length === 0) {
		addIssue(
			issues,
			'error',
			'COLLECTION_FONTS_INVALID',
			'fonts must be a non-empty array for TTC/OTC inputs.',
			`${path}.fonts`,
		);
		return;
	}

	if (
		isPlainObject(collection) &&
		collection.numFonts !== undefined &&
		collection.numFonts !== fonts.length
	) {
		collection.numFonts = fonts.length;
		addIssue(
			issues,
			'info',
			'COLLECTION_NUMFONTS_CORRECTED',
			`collection.numFonts corrected to ${fonts.length} to match fonts array.`,
			`${path}.collection.numFonts`,
		);
	}

	for (let i = 0; i < fonts.length; i++) {
		validateSingleFont(fonts[i], `${path}.fonts[${i}]`, issues);
	}
}

// =========================================================================
//  Public API
// =========================================================================

/**
 * Validate JSON font data before calling exportFont.
 *
 * This validator checks structure, table tag validity, raw byte sanity,
 * required core tables, and common cross-table dependencies.  Where possible
 * it auto-fixes recoverable issues (missing header, wrong directory fields,
 * mismatched counts) and reports them as "info" level issues.
 *
 * The input object may be **mutated** when auto-fixes are applied — the same
 * object can then be passed directly to `exportFont`.
 *
 * @param {object} fontData
 * @returns {{
 *   valid: boolean,
 *   errors:   Array<{severity:'error',   code:string, message:string, path:string}>,
 *   warnings: Array<{severity:'warning', code:string, message:string, path:string}>,
 *   infos:    Array<{severity:'info',    code:string, message:string, path:string}>,
 *   issues:   Array<{severity:string,    code:string, message:string, path:string}>,
 *   summary: { errorCount:number, warningCount:number, infoCount:number, issueCount:number }
 * }}
 */
export function validateJSON(fontData) {
	const issues = [];

	if (!isPlainObject(fontData)) {
		addIssue(
			issues,
			'error',
			'INPUT_INVALID',
			'validateJSON expects a font JSON object.',
			'$',
		);
		return buildReport(issues);
	}

	const looksLikeCollection =
		fontData.collection !== undefined || fontData.fonts !== undefined;

	if (looksLikeCollection) {
		validateCollection(fontData, '$', issues);
	} else {
		validateSingleFont(fontData, '$', issues);
	}

	return buildReport(issues);
}
