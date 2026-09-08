/**
 * Preview tab — live text preview and glyph outline grid.
 */
import { drawGlyphTile } from '../components/glyph-tile.js';

export const previewTab = {
	id: 'preview',
	label: 'Preview',
	render,
};

function render(container, fontData) {
	const wrap = document.createElement('div');
	wrap.className = 'overview preview-tab';

	const tabList = document.createElement('div');
	tabList.className = 'preview-subtabs';
	tabList.setAttribute('role', 'tablist');
	tabList.setAttribute('aria-label', 'Preview type');

	const content = document.createElement('div');
	content.className = 'preview-subtab-content';

	const tabs = [
		{
			id: 'characters',
			label: 'Characters',
			render: () => [buildPreviewSection(fontData), buildGlyphSample(fontData)],
		},
		{
			id: 'ligatures',
			label: 'Ligatures',
			render: () => [buildLigaturePreview(fontData)],
		},
		{
			id: 'kerning',
			label: 'Kerning',
			render: () => [buildKerningPreview(fontData)],
		},
	];

	const buttons = new Map();
	function selectTab(id) {
		content.replaceChildren();
		for (const tab of tabs) {
			const active = tab.id === id;
			const button = buttons.get(tab.id);
			button.classList.toggle('active', active);
			button.setAttribute('aria-selected', String(active));
			button.tabIndex = active ? 0 : -1;
			if (active) content.append(...tab.render());
		}
	}

	for (const tab of tabs) {
		const button = document.createElement('button');
		button.className = 'preview-subtab';
		button.type = 'button';
		button.id = `preview-tab-${tab.id}`;
		button.setAttribute('role', 'tab');
		button.setAttribute('aria-controls', 'preview-subtab-panel');
		button.textContent = tab.label;
		button.addEventListener('click', () => selectTab(tab.id));
		tabList.appendChild(button);
		buttons.set(tab.id, button);
	}

	content.id = 'preview-subtab-panel';
	content.setAttribute('role', 'tabpanel');
	wrap.append(tabList, content);
	selectTab('characters');

	container.appendChild(wrap);
}

// ─── Live Preview ───────────────────────────────────────────────────────────

function buildPreviewSection(fontData) {
	const section = makeSection('Text Preview');
	const area = document.createElement('div');
	area.className = 'preview-area';

	// Controls
	const controls = document.createElement('div');
	controls.className = 'preview-controls';

	const label = document.createElement('label');
	label.textContent = 'Size';

	const slider = document.createElement('input');
	slider.type = 'range';
	slider.min = '12';
	slider.max = '120';
	slider.value = '48';

	const sizeDisplay = document.createElement('span');
	sizeDisplay.className = 'size-display';
	sizeDisplay.textContent = '48px';

	controls.append(label, slider, sizeDisplay);

	// Editable preview text
	const input = document.createElement('input');
	input.className = 'preview-text-input';
	input.type = 'text';
	input.value =
		fontData.font?.sampleText || 'The quick brown fox jumps over the lazy dog';
	input.placeholder = 'Type preview text…';

	// Preview output
	const preview = document.createElement('div');
	preview.className = 'preview-text';
	preview.style.fontFamily = "'DemoLoadedFont', sans-serif";
	preview.textContent = input.value;

	slider.addEventListener('input', () => {
		const size = slider.value;
		sizeDisplay.textContent = `${size}px`;
		preview.style.fontSize = `${size}px`;
	});

	input.addEventListener('input', () => {
		preview.textContent = input.value;
	});

	area.append(controls, input, preview);
	section.appendChild(area);
	return section;
}

// ─── Glyph Outlines Grid ───────────────────────────────────────────────────

function buildGlyphSample(fontData) {
	const glyphs = fontData.glyphs || [];
	const PAGE_SIZE = 100;

	// Collect up to 1000 glyphs that have contours
	const drawn = [];
	for (const glyph of glyphs) {
		if (drawn.length >= 1000) break;
		if (!glyph.contours || glyph.contours.length === 0) continue;
		drawn.push(glyph);
	}

	const section = makeSection(
		`Glyph Outlines (${drawn.length} of ${glyphs.length})`,
	);

	if (drawn.length === 0) {
		const msg = document.createElement('p');
		msg.style.cssText =
			'padding: 16px 20px; color: var(--text-tertiary); font-size: 0.85rem;';
		msg.textContent = 'No outline data available for any glyphs in this font.';
		section.appendChild(msg);
		return section;
	}

	// Detail panel container (shown when a glyph is clicked)
	const detailPanel = document.createElement('div');
	detailPanel.className = 'glyph-detail-panel';
	detailPanel.hidden = true;
	section.appendChild(detailPanel);

	const grid = document.createElement('div');
	grid.className = 'glyph-grid';
	section.appendChild(grid);

	const paging = document.createElement('div');
	paging.className = 'glyph-paging';
	section.appendChild(paging);

	let currentPage = 0;
	const totalPages = Math.ceil(drawn.length / PAGE_SIZE);

	function renderPage() {
		grid.innerHTML = '';
		const start = currentPage * PAGE_SIZE;
		const pageGlyphs = drawn.slice(start, start + PAGE_SIZE);

		for (const glyph of pageGlyphs) {
			const cell = document.createElement('div');
			cell.className = 'glyph-cell';

			const canvas = document.createElement('canvas');
			canvas.className = 'glyph-thumb';
			drawGlyphTile(canvas, { glyph, fontData, size: 56 });

			const label = document.createElement('div');
			label.className = 'glyph-label';
			const name = glyph.name || '';
			const uni = glyph.unicode
				? `U+${glyph.unicode.toString(16).toUpperCase().padStart(4, '0')}`
				: '';
			label.textContent = name || uni || '—';
			label.title = [name, uni].filter(Boolean).join(' · ');

			cell.addEventListener('click', () => {
				showGlyphDetail(detailPanel, glyph, fontData);
				detailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			});

			cell.append(canvas, label);
			grid.appendChild(cell);
		}

		renderPaging();
	}

	function renderPaging() {
		paging.innerHTML = '';
		if (totalPages <= 1) return;

		const prevBtn = document.createElement('button');
		prevBtn.className = 'glyph-page-btn';
		prevBtn.textContent = '← Prev';
		prevBtn.disabled = currentPage === 0;
		prevBtn.addEventListener('click', () => {
			currentPage--;
			renderPage();
			grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});

		const pageInfo = document.createElement('span');
		pageInfo.className = 'glyph-page-info';
		pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;

		const nextBtn = document.createElement('button');
		nextBtn.className = 'glyph-page-btn';
		nextBtn.textContent = 'Next →';
		nextBtn.disabled = currentPage === totalPages - 1;
		nextBtn.addEventListener('click', () => {
			currentPage++;
			renderPage();
			grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});

		paging.append(prevBtn, pageInfo, nextBtn);
	}

	renderPage();
	return section;
}

// ─── Glyph Detail Panel ─────────────────────────────────────────────────────

function showGlyphDetail(panel, glyph, fontData) {
	panel.hidden = false;
	panel.innerHTML = '';

	// Close button
	const close = document.createElement('button');
	close.className = 'glyph-detail-close';
	close.textContent = '×';
	close.title = 'Close';
	close.addEventListener('click', () => {
		panel.hidden = true;
	});
	panel.appendChild(close);

	// Layout: left (large canvas) + right (data)
	const layout = document.createElement('div');
	layout.className = 'glyph-detail-layout';

	// --- Left: large preview ---
	const canvasWrap = document.createElement('div');
	canvasWrap.className = 'glyph-detail-canvas-wrap';
	const canvas = document.createElement('canvas');
	let showBounds = false;
	drawGlyphTile(canvas, { glyph, fontData, size: 256, showBounds });
	canvasWrap.appendChild(canvas);

	const boundsToggle = document.createElement('label');
	boundsToggle.className = 'glyph-detail-bounds-toggle';
	const boundsCheckbox = document.createElement('input');
	boundsCheckbox.type = 'checkbox';
	boundsCheckbox.checked = showBounds;
	boundsCheckbox.addEventListener('change', () => {
		showBounds = boundsCheckbox.checked;
		drawGlyphTile(canvas, { glyph, fontData, size: 256, showBounds });
	});
	const boundsLabel = document.createTextNode(' Show glyph bounds');
	boundsToggle.append(boundsCheckbox, boundsLabel);
	canvasWrap.appendChild(boundsToggle);

	layout.appendChild(canvasWrap);

	// --- Right: data ---
	const data = document.createElement('div');
	data.className = 'glyph-detail-data';

	// Identity
	const name = glyph.name || '(unnamed)';
	const uni = glyph.unicode
		? `U+${glyph.unicode.toString(16).toUpperCase().padStart(4, '0')}`
		: null;
	const char = glyph.unicode ? String.fromCodePoint(glyph.unicode) : null;

	const title = document.createElement('h3');
	title.className = 'glyph-detail-title';
	title.textContent = name;
	if (uni) {
		const uniSpan = document.createElement('span');
		uniSpan.className = 'glyph-detail-unicode';
		uniSpan.textContent = ` ${uni}`;
		if (char) uniSpan.textContent += ` "${char}"`;
		title.appendChild(uniSpan);
	}
	data.appendChild(title);

	// Metrics
	const metrics = [];
	if (glyph.advanceWidth != null)
		metrics.push(['Advance Width', glyph.advanceWidth]);
	if (glyph.leftSideBearing != null)
		metrics.push(['Left Side Bearing', glyph.leftSideBearing]);
	if (glyph.advanceHeight != null)
		metrics.push(['Advance Height', glyph.advanceHeight]);
	if (glyph.topSideBearing != null)
		metrics.push(['Top Side Bearing', glyph.topSideBearing]);

	// Outline info
	const isCFF = glyph.contours?.[0]?.[0]?.type;
	const contourCount = glyph.contours?.length || 0;
	let pointCount = 0;
	if (glyph.contours) {
		for (const c of glyph.contours) pointCount += c.length;
	}
	metrics.push(['Contours', contourCount]);
	metrics.push(['Points / Commands', pointCount]);
	metrics.push([
		'Outline Format',
		isCFF ? 'CFF (Cubic Bézier)' : 'TrueType (Quadratic)',
	]);

	if (metrics.length) {
		const grid = document.createElement('div');
		grid.className = 'glyph-detail-metrics';
		for (const [label, value] of metrics) {
			const row = document.createElement('div');
			row.className = 'glyph-detail-metric';
			row.innerHTML = `<span class="gdm-label">${esc(label)}</span><span class="gdm-value">${esc(String(value))}</span>`;
			grid.appendChild(row);
		}
		data.appendChild(grid);
	}

	// CFF Disassembly
	if (glyph.charStringDisassembly) {
		const section = document.createElement('div');
		section.className = 'glyph-detail-section';
		const h4 = document.createElement('h4');
		h4.textContent = 'CharString Disassembly';
		section.appendChild(h4);
		const pre = document.createElement('pre');
		pre.className = 'glyph-detail-code';
		pre.textContent = glyph.charStringDisassembly;
		section.appendChild(pre);
		data.appendChild(section);
	}

	// Contour path data
	if (glyph.contours && glyph.contours.length > 0) {
		const section = document.createElement('div');
		section.className = 'glyph-detail-section';
		const h4 = document.createElement('h4');
		h4.textContent = 'Contour Data';
		section.appendChild(h4);
		const pre = document.createElement('pre');
		pre.className = 'glyph-detail-code';
		pre.textContent = formatContours(glyph.contours);
		section.appendChild(pre);
		data.appendChild(section);
	}

	// Raw charString bytes (collapsed by default)
	if (glyph.charString) {
		const section = document.createElement('div');
		section.className = 'glyph-detail-section';
		const toggle = document.createElement('h4');
		toggle.className = 'glyph-detail-toggle';
		toggle.textContent = '▶ Raw CharString Bytes';
		const pre = document.createElement('pre');
		pre.className = 'glyph-detail-code glyph-detail-collapsed';
		pre.textContent = formatBytes(glyph.charString);
		toggle.addEventListener('click', () => {
			const collapsed = pre.classList.toggle('glyph-detail-collapsed');
			toggle.textContent = (collapsed ? '▶' : '▼') + ' Raw CharString Bytes';
		});
		section.append(toggle, pre);
		data.appendChild(section);
	}

	layout.appendChild(data);
	panel.appendChild(layout);
}

// ─── Ligatures ──────────────────────────────────────────────────────────────

function buildLigaturePreview(fontData) {
	const ligatures = (fontData.substitutions || []).filter(
		(substitution) => substitution.type === 'ligature',
	);
	const section = makeSection(`Ligatures (${ligatures.length})`);
	if (ligatures.length === 0) {
		section.appendChild(
			makeEmptyMessage('No ligature substitutions are defined in this font.'),
		);
		return section;
	}

	const glyphsByName = makeGlyphMap(fontData.glyphs);
	const detailPanel = makeDetailPanel(section);
	const grid = document.createElement('div');
	grid.className = 'glyph-grid preview-rule-grid';
	const paging = document.createElement('div');
	paging.className = 'glyph-paging';
	section.append(grid, paging);

	buildPagedGrid(ligatures, grid, paging, (ligature) => {
		const resultGlyph = glyphsByName.get(ligature.ligature);
		const cell = makeRuleCell();
		if (resultGlyph?.contours?.length) {
			const canvas = document.createElement('canvas');
			canvas.className = 'glyph-thumb';
			drawGlyphTile(canvas, { glyph: resultGlyph, fontData, size: 64 });
			cell.appendChild(canvas);
		} else {
			cell.appendChild(
				makeFontSpecimen(glyphNamesToText(ligature.components, glyphsByName)),
			);
		}
		cell.appendChild(
			makeRuleLabel(
				`${ligature.components.join(' + ')} → ${ligature.ligature}`,
			),
		);
		cell.addEventListener('click', () => {
			showLigatureDetail(
				detailPanel,
				ligature,
				resultGlyph,
				fontData,
				glyphsByName,
			);
		});
		return cell;
	});
	return section;
}

function showLigatureDetail(
	panel,
	ligature,
	resultGlyph,
	fontData,
	glyphsByName,
) {
	const layout = openDetailPanel(panel);
	const preview = document.createElement('div');
	preview.className = 'glyph-detail-canvas-wrap rule-detail-preview';
	if (resultGlyph?.contours?.length) {
		const canvas = document.createElement('canvas');
		drawGlyphTile(canvas, {
			glyph: resultGlyph,
			fontData,
			size: 224,
			showBounds: true,
		});
		preview.appendChild(canvas);
	} else {
		preview.appendChild(
			makeFontSpecimen(
				glyphNamesToText(ligature.components, glyphsByName),
				true,
			),
		);
	}
	layout.appendChild(preview);

	const data = document.createElement('div');
	data.className = 'glyph-detail-data';
	const title = document.createElement('h3');
	title.className = 'glyph-detail-title';
	title.textContent = `${ligature.components.join(' + ')} → ${ligature.ligature}`;
	data.append(
		title,
		makeMetricGrid([
			['Feature', ligature.feature || '—'],
			['Script', ligature.script || '—'],
			['Language', ligature.language || 'Default'],
			['Components', ligature.components.length],
			['Result glyph', ligature.ligature],
		]),
	);
	layout.appendChild(data);
}

// ─── Kerning ────────────────────────────────────────────────────────────────

function buildKerningPreview(fontData) {
	const entries = collectKerningEntries(fontData);
	const section = makeSection(`Kerning Pairs (${entries.length})`);
	if (entries.length === 0) {
		section.appendChild(
			makeEmptyMessage('No kerning pairs are defined in this font.'),
		);
		return section;
	}

	const glyphsByName = makeGlyphMap(fontData.glyphs);
	const detailPanel = makeDetailPanel(section);
	const grid = document.createElement('div');
	grid.className = 'glyph-grid preview-rule-grid kerning-grid';
	const paging = document.createElement('div');
	paging.className = 'glyph-paging';
	section.append(grid, paging);

	buildPagedGrid(entries, grid, paging, (entry) => {
		const cell = makeRuleCell();
		const text = glyphNamesToText(
			[entry.displayLeft, entry.displayRight],
			glyphsByName,
		);
		cell.append(
			makeFontSpecimen(text),
			makeRuleLabel(`${entry.left} · ${entry.right}`),
			makeAdjustmentLabel(entry.value),
		);
		cell.addEventListener('click', () =>
			showKerningDetail(detailPanel, entry, glyphsByName),
		);
		return cell;
	});
	return section;
}

function collectKerningEntries(fontData) {
	const entries = (fontData.kerning || []).map((pair) => ({
		...pair,
		displayLeft: pair.left,
		displayRight: pair.right,
		kind: 'Individual pair',
	}));
	const groups = Array.isArray(fontData.kerningClasses)
		? fontData.kerningClasses
		: fontData.kerningClasses
			? [fontData.kerningClasses]
			: [];
	for (const group of groups) {
		for (const pair of group.pairs || []) {
			const left = resolveKerningSide(pair.left, group.leftClasses);
			const right = resolveKerningSide(pair.right, group.rightClasses);
			entries.push({
				...pair,
				displayLeft: left.members[0] || pair.left,
				displayRight: right.members[0] || pair.right,
				leftMembers: left.members,
				rightMembers: right.members,
				kind: 'Class pair',
			});
		}
	}
	return entries;
}

function resolveKerningSide(reference, classes = {}) {
	if (!reference?.startsWith('@')) return { members: [reference] };
	return { members: classes[reference.slice(1)] || [] };
}

function showKerningDetail(panel, entry, glyphsByName) {
	const layout = openDetailPanel(panel);
	const preview = document.createElement('div');
	preview.className = 'glyph-detail-canvas-wrap kerning-detail-preview';
	const text = glyphNamesToText(
		[entry.displayLeft, entry.displayRight],
		glyphsByName,
	);
	const unkerned = makeFontSpecimen(text, true);
	unkerned.style.fontKerning = 'none';
	unkerned.dataset.label = 'Unkerned';
	const kerned = makeFontSpecimen(text, true);
	kerned.style.fontKerning = 'normal';
	kerned.dataset.label = 'Kerned';
	preview.append(unkerned, kerned);
	layout.appendChild(preview);

	const data = document.createElement('div');
	data.className = 'glyph-detail-data';
	const title = document.createElement('h3');
	title.className = 'glyph-detail-title';
	title.textContent = `${entry.left} · ${entry.right}`;
	const metrics = [
		['Adjustment', `${entry.value} font units`],
		['Source', entry.kind],
		['Preview glyphs', `${entry.displayLeft} + ${entry.displayRight}`],
	];
	if (entry.leftMembers)
		metrics.push(['Left class members', entry.leftMembers.join(', ') || '—']);
	if (entry.rightMembers)
		metrics.push(['Right class members', entry.rightMembers.join(', ') || '—']);
	data.append(title, makeMetricGrid(metrics));
	layout.appendChild(data);
}

// ─── Shared Preview Helpers ─────────────────────────────────────────────────

function buildPagedGrid(items, grid, paging, renderCell) {
	const pageSize = 100;
	let currentPage = 0;
	const totalPages = Math.ceil(items.length / pageSize);
	function renderPage() {
		grid.replaceChildren();
		const start = currentPage * pageSize;
		for (const item of items.slice(start, start + pageSize))
			grid.appendChild(renderCell(item));
		paging.replaceChildren();
		if (totalPages <= 1) return;
		const previous = makePageButton('← Prev', currentPage === 0, () => {
			currentPage--;
			renderPage();
		});
		const info = document.createElement('span');
		info.className = 'glyph-page-info';
		info.textContent = `Page ${currentPage + 1} of ${totalPages}`;
		const next = makePageButton(
			'Next →',
			currentPage === totalPages - 1,
			() => {
				currentPage++;
				renderPage();
			},
		);
		paging.append(previous, info, next);
	}
	renderPage();
}

function makePageButton(label, disabled, onClick) {
	const button = document.createElement('button');
	button.className = 'glyph-page-btn';
	button.type = 'button';
	button.textContent = label;
	button.disabled = disabled;
	button.addEventListener('click', onClick);
	return button;
}

function makeRuleCell() {
	const cell = document.createElement('button');
	cell.type = 'button';
	cell.className = 'glyph-cell preview-rule-cell';
	return cell;
}

function makeFontSpecimen(text, large = false) {
	const specimen = document.createElement('div');
	specimen.className = `rule-specimen${large ? ' rule-specimen-large' : ''}`;
	specimen.style.fontFamily = "'DemoLoadedFont', sans-serif";
	specimen.textContent = text || '—';
	return specimen;
}

function makeRuleLabel(text) {
	const label = document.createElement('div');
	label.className = 'glyph-label rule-label';
	label.textContent = text;
	label.title = text;
	return label;
}

function makeAdjustmentLabel(value) {
	const label = document.createElement('span');
	label.className = `kerning-value ${value < 0 ? 'negative' : 'positive'}`;
	label.textContent = value > 0 ? `+${value}` : String(value);
	return label;
}

function makeGlyphMap(glyphs = []) {
	return new Map(glyphs.map((glyph) => [glyph.name, glyph]));
}

function glyphNamesToText(names, glyphsByName) {
	return names
		.map((name) => glyphsByName.get(name)?.unicode)
		.filter((unicode) => unicode != null)
		.map((unicode) => String.fromCodePoint(unicode))
		.join('');
}

function makeEmptyMessage(text) {
	const message = document.createElement('p');
	message.className = 'preview-empty';
	message.textContent = text;
	return message;
}

function makeDetailPanel(section) {
	const panel = document.createElement('div');
	panel.className = 'glyph-detail-panel';
	panel.hidden = true;
	section.appendChild(panel);
	return panel;
}

function openDetailPanel(panel) {
	panel.hidden = false;
	panel.replaceChildren();
	const close = document.createElement('button');
	close.className = 'glyph-detail-close';
	close.type = 'button';
	close.textContent = '×';
	close.title = 'Close';
	close.setAttribute('aria-label', 'Close details');
	close.addEventListener('click', () => {
		panel.hidden = true;
	});
	const layout = document.createElement('div');
	layout.className = 'glyph-detail-layout';
	panel.append(close, layout);
	panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	return layout;
}

function makeMetricGrid(metrics) {
	const grid = document.createElement('div');
	grid.className = 'glyph-detail-metrics';
	for (const [label, value] of metrics) {
		const row = document.createElement('div');
		row.className = 'glyph-detail-metric';
		const key = document.createElement('span');
		key.className = 'gdm-label';
		key.textContent = label;
		const content = document.createElement('span');
		content.className = 'gdm-value';
		content.textContent = String(value);
		row.append(key, content);
		grid.appendChild(row);
	}
	return grid;
}

function formatContours(contours) {
	const lines = [];
	for (let i = 0; i < contours.length; i++) {
		lines.push(`Contour ${i}:`);
		for (const pt of contours[i]) {
			if (pt.type) {
				// CFF command format
				switch (pt.type) {
					case 'M':
						lines.push(`  M ${pt.x} ${pt.y}`);
						break;
					case 'L':
						lines.push(`  L ${pt.x} ${pt.y}`);
						break;
					case 'C':
						lines.push(
							`  C ${pt.x1} ${pt.y1}  ${pt.x2} ${pt.y2}  ${pt.x} ${pt.y}`,
						);
						break;
				}
			} else {
				// TrueType point format
				lines.push(`  ${pt.onCurve ? 'on' : 'off'}  ${pt.x} ${pt.y}`);
			}
		}
	}
	return lines.join('\n');
}

function formatBytes(bytes) {
	const rows = [];
	for (let i = 0; i < bytes.length; i += 16) {
		const chunk = bytes.slice(i, i + 16);
		const hex = chunk.map((b) => b.toString(16).padStart(2, '0')).join(' ');
		rows.push(`${i.toString(16).padStart(4, '0')}  ${hex}`);
	}
	return rows.join('\n');
}

function esc(str) {
	const d = document.createElement('div');
	d.textContent = str;
	return d.innerHTML;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSection(title) {
	const section = document.createElement('section');
	section.className = 'overview-section';
	const h2 = document.createElement('h2');
	h2.textContent = title;
	section.appendChild(h2);
	return section;
}
