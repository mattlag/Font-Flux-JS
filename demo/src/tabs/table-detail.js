/**
 * Generic table detail tab — renders any parsed table as a collapsible data tree.
 */

import { getTableDescription } from '../table-descriptions.js';

const COLLAPSE_THRESHOLD = 20; // Auto-collapse arrays/objects larger than this

// Keys whose primitive value is itself a glyph index. When seen, append a
// badge with the resolved glyph name so the human reader doesn't have to
// cross-reference numeric GIDs by hand.
const GID_LEAF_KEYS = new Set([
	'glyphID',
	'glyphId',
	'glyphIndex',
	'gid',
	'gID',
	'startGlyphID',
	'endGlyphID',
	'firstGlyph',
	'lastGlyph',
	'startGlyph',
	'endGlyph',
	'baseGlyph',
	'baseGlyphID',
	'ligGlyph',
	'markGlyph',
	'componentGlyphID',
	'secondGlyph',
]);

/**
 * Create a table detail tab definition for a given table tag.
 */
export function createTableTab(tag, tableData) {
	return {
		id: `table:${tag.trim()}`,
		label: tag.trim(),
		className: 'tab-btn-sm',
		render(container, fontData) {
			const wrap = document.createElement('div');
			wrap.className = 'table-detail';

			const header = document.createElement('div');
			header.className = 'table-detail-header';
			const description = getTableDescription(tag);
			header.innerHTML =
				`<h2>${escapeHTML(tag.trim())}</h2>` +
				(description
					? `<p class="table-detail-desc">${escapeHTML(description)}</p>`
					: '');
			wrap.appendChild(header);

			const ctx = makeContext(tag.trim(), fontData);

			const tree = document.createElement('div');
			tree.className = 'data-tree';
			if (
				tableData &&
				typeof tableData === 'object' &&
				!Array.isArray(tableData) &&
				!ArrayBuffer.isView(tableData)
			) {
				const keys = Object.keys(tableData).filter((k) => !k.startsWith('_'));
				const internalKeys = Object.keys(tableData).filter((k) =>
					k.startsWith('_'),
				);
				for (const k of keys) {
					tree.appendChild(buildNode(tableData[k], k, true, ctx, [k]));
				}
				for (const k of internalKeys) {
					tree.appendChild(buildNode(tableData[k], k, false, ctx, [k]));
				}
			} else {
				tree.appendChild(buildNode(tableData, tag.trim(), true, ctx, []));
			}
			wrap.appendChild(tree);

			container.appendChild(wrap);
		},
	};
}

/**
 * Build a per-tab context with a glyph lookup function and a per-table
 * "is this array gid-indexed?" mapper.
 */
function makeContext(tag, fontData) {
	const glyphs = fontData?.glyphs;
	const tables = fontData?.tables || {};

	function glyphBadge(gid) {
		if (!Number.isInteger(gid) || gid < 0) return null;
		const g = glyphs?.[gid];
		if (!g) return null;
		const name = g.name || null;
		const uni =
			typeof g.unicode === 'number'
				? `U+${g.unicode.toString(16).toUpperCase().padStart(4, '0')}`
				: null;
		const printable =
			typeof g.unicode === 'number' && g.unicode >= 0x20 && g.unicode !== 0x7f
				? String.fromCodePoint(g.unicode)
				: null;

		if (!name && !uni) return null;
		const parts = [];
		if (name) parts.push(name);
		if (uni) parts.push(printable ? `${uni} "${printable}"` : uni);
		return parts.join(' · ');
	}

	// Offsets for the trailing-LSB sub-arrays in hmtx/vmtx.
	const hmtxLsbOffset = tables.hhea?.numberOfHMetrics ?? null;
	const vmtxTsbOffset =
		tables.vhea?.numberOfLongVerMetrics ??
		tables.vhea?.numOfLongVerMetrics ??
		null;

	/**
	 * Return a function (index → gid) when `path` points at an array whose
	 * elements correspond 1:1 with glyph indices. Otherwise null.
	 */
	function gidMapperFor(pathArr) {
		const last = pathArr[pathArr.length - 1];

		if (tag === 'hmtx') {
			if (last === 'hMetrics') return (i) => i;
			if (last === 'leftSideBearings' && hmtxLsbOffset != null)
				return (i) => hmtxLsbOffset + i;
		}
		if (tag === 'vmtx') {
			if (last === 'vMetrics') return (i) => i;
			if (last === 'topSideBearings' && vmtxTsbOffset != null)
				return (i) => vmtxTsbOffset + i;
		}
		if (tag === 'loca' && last === 'offsets') {
			// loca has numGlyphs+1 entries; the trailing sentinel has no glyph.
			const numGlyphs = glyphs?.length;
			return (i) =>
				numGlyphs != null && i >= numGlyphs ? null : i;
		}
		if (tag === 'LTSH' && last === 'yPels') return (i) => i;
		if (
			tag === 'hdmx' &&
			last === 'widths' &&
			pathArr[pathArr.length - 3] === 'records'
		) {
			return (i) => i;
		}
		if (tag === 'VDMX' && last === 'widths') return (i) => i;

		return null;
	}

	return { fontData, tag, glyphBadge, gidMapperFor };
}

/**
 * Recursively build a DOM tree for a value.
 *
 * @param value          The value to render.
 * @param key            The label to show in front of the value.
 * @param startOpen      Whether to expand the node by default.
 * @param ctx            Per-tab context (glyph lookup + gid mapping rules).
 * @param path           Key path from the root of the current table.
 * @param glyphBadgeText Optional pre-computed glyph badge for this row.
 */
function buildNode(value, key, startOpen = false, ctx, path = [], glyphBadgeText = null) {
	// Handle null/undefined
	if (value === null || value === undefined) {
		return makeLeaf(key, 'null', 'null', null, glyphBadgeText);
	}

	// Handle typed arrays / ArrayBuffer
	if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
		const arr = value instanceof ArrayBuffer ? new Uint8Array(value) : value;
		if (arr.length <= 32) {
			return makeLeaf(
				key,
				`[${arr.join(', ')}]`,
				'bytes',
				`${arr.length} bytes`,
				glyphBadgeText,
			);
		}
		return makeCollapsible(
			key,
			`${arr.length} bytes`,
			false,
			() => {
				const pre = document.createElement('pre');
				pre.className = 'data-bytes';
				pre.textContent = formatHexDump(arr);
				return pre;
			},
			glyphBadgeText,
		);
	}

	// Handle BigInt
	if (typeof value === 'bigint') {
		return makeLeaf(key, value.toString(), 'number', null, glyphBadgeText);
	}

	// Handle arrays
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return makeLeaf(key, '[]', 'empty', '0 items', glyphBadgeText);
		}

		const mapper = ctx?.gidMapperFor ? ctx.gidMapperFor(path) : null;

		// Check if it's a simple number array (like instructions, values).
		// If the array is glyph-indexed we always expand it so each gid badge is
		// visible; otherwise keep the existing compact rendering.
		if (value.length > 0 && value.every((v) => typeof v === 'number')) {
			if (!mapper) {
				if (value.length <= 20) {
					return makeLeaf(
						key,
						`[${value.join(', ')}]`,
						'array',
						`${value.length} numbers`,
						glyphBadgeText,
					);
				}
				const open = startOpen && value.length < COLLAPSE_THRESHOLD;
				return makeCollapsible(
					key,
					`${value.length} numbers`,
					open,
					() => {
						const pre = document.createElement('pre');
						pre.className = 'data-number-array';
						const rows = [];
						for (let i = 0; i < value.length; i += 16) {
							const chunk = value.slice(i, i + 16);
							rows.push(`[${String(i).padStart(4)}] ${chunk.join(', ')}`);
						}
						pre.textContent = rows.join('\n');
						return pre;
					},
					glyphBadgeText,
				);
			}
			// Glyph-indexed number array — render each entry as its own row so
			// the human reader sees `0  0  .notdef` instead of an opaque list.
			const open = startOpen && value.length < COLLAPSE_THRESHOLD;
			return makeCollapsible(
				key,
				`${value.length} numbers`,
				open,
				() => {
					const list = document.createElement('div');
					list.className = 'data-children';
					for (let i = 0; i < value.length; i++) {
						const gid = mapper(i);
						const badge = gid != null ? ctx.glyphBadge(gid) : null;
						list.appendChild(
							buildNode(
								value[i],
								String(i),
								false,
								ctx,
								[...path, String(i)],
								badge,
							),
						);
					}
					return list;
				},
				glyphBadgeText,
			);
		}

		// Array of objects/mixed
		const open = startOpen && value.length < COLLAPSE_THRESHOLD;
		return makeCollapsible(
			key,
			`${value.length} items`,
			open,
			() => {
				const list = document.createElement('div');
				list.className = 'data-children';
				for (let i = 0; i < value.length; i++) {
					const gid = mapper ? mapper(i) : null;
					const badge = gid != null ? ctx.glyphBadge(gid) : null;
					list.appendChild(
						buildNode(
							value[i],
							String(i),
							false,
							ctx,
							[...path, String(i)],
							badge,
						),
					);
				}
				return list;
			},
			glyphBadgeText,
		);
	}

	// Handle objects
	if (typeof value === 'object') {
		const keys = Object.keys(value).filter((k) => !k.startsWith('_'));
		const internalKeys = Object.keys(value).filter((k) => k.startsWith('_'));

		if (keys.length === 0 && internalKeys.length === 0) {
			return makeLeaf(key, '{}', 'empty', '0 fields', glyphBadgeText);
		}

		const totalKeys = keys.length + internalKeys.length;
		const open = startOpen && totalKeys < COLLAPSE_THRESHOLD;
		return makeCollapsible(
			key,
			`${totalKeys} fields`,
			open,
			() => {
				const list = document.createElement('div');
				list.className = 'data-children';
				for (const k of keys) {
					list.appendChild(
						buildNode(value[k], k, false, ctx, [...path, k]),
					);
				}
				if (internalKeys.length > 0) {
					for (const k of internalKeys) {
						list.appendChild(
							buildNode(value[k], k, false, ctx, [...path, k]),
						);
					}
				}
				return list;
			},
			glyphBadgeText,
		);
	}

	// Primitives — also append a glyph badge when this leaf's key names a GID.
	const leafBadge =
		glyphBadgeText ||
		(GID_LEAF_KEYS.has(key) && typeof value === 'number' && ctx?.glyphBadge
			? ctx.glyphBadge(value)
			: null);

	const type = typeof value;
	if (type === 'boolean') {
		return makeLeaf(key, String(value), 'boolean', null, leafBadge);
	}
	if (type === 'number') {
		return makeLeaf(key, String(value), 'number', null, leafBadge);
	}
	// String
	const strVal = String(value);
	if (strVal.length > 200) {
		return makeCollapsible(
			key,
			`${strVal.length} chars`,
			false,
			() => {
				const pre = document.createElement('pre');
				pre.className = 'data-string-long';
				pre.textContent = strVal;
				return pre;
			},
			leafBadge,
		);
	}
	return makeLeaf(key, strVal, 'string', null, leafBadge);
}

/**
 * A simple key: value leaf node.
 */
function makeLeaf(key, displayValue, type, badge, glyphBadge) {
	const row = document.createElement('div');
	row.className = 'data-row';

	row.innerHTML = `
		<span class="data-key">${escapeHTML(key)}</span>
		<span class="data-value data-${type}">${escapeHTML(displayValue)}</span>
		${badge ? `<span class="data-badge">${escapeHTML(badge)}</span>` : ''}
		${glyphBadge ? `<span class="data-badge data-badge-glyph">${escapeHTML(glyphBadge)}</span>` : ''}
	`;
	return row;
}

/**
 * A collapsible node (click to expand).
 */
function makeCollapsible(key, summary, startOpen, buildChildren, glyphBadge) {
	const row = document.createElement('div');
	row.className = 'data-collapsible';

	const header = document.createElement('div');
	header.className = 'data-row data-row-toggle';
	header.innerHTML = `
		<span class="data-arrow">${startOpen ? '▼' : '▶'}</span>
		<span class="data-key">${escapeHTML(key)}</span>
		<span class="data-badge">${escapeHTML(summary)}</span>
		${glyphBadge ? `<span class="data-badge data-badge-glyph">${escapeHTML(glyphBadge)}</span>` : ''}
	`;

	row.appendChild(header);

	let childContainer = null;
	let expanded = startOpen;

	if (startOpen) {
		childContainer = buildChildren();
		childContainer.classList.add('data-expanded');
		row.appendChild(childContainer);
	}

	header.addEventListener('click', () => {
		expanded = !expanded;
		header.querySelector('.data-arrow').textContent = expanded ? '▼' : '▶';

		if (expanded) {
			if (!childContainer) {
				childContainer = buildChildren();
				row.appendChild(childContainer);
			}
			childContainer.classList.add('data-expanded');
		} else if (childContainer) {
			childContainer.classList.remove('data-expanded');
		}
	});

	return row;
}

function formatHexDump(arr) {
	const rows = [];
	for (let i = 0; i < arr.length; i += 16) {
		const hex = [];
		const ascii = [];
		for (let j = 0; j < 16; j++) {
			if (i + j < arr.length) {
				hex.push(arr[i + j].toString(16).padStart(2, '0'));
				const c = arr[i + j];
				ascii.push(c >= 32 && c <= 126 ? String.fromCharCode(c) : '.');
			} else {
				hex.push('  ');
				ascii.push(' ');
			}
		}
		const offset = i.toString(16).padStart(6, '0');
		rows.push(
			`${offset}  ${hex.slice(0, 8).join(' ')}  ${hex.slice(8).join(' ')}  |${ascii.join('')}|`,
		);
	}
	return rows.join('\n');
}

function escapeHTML(str) {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
}
