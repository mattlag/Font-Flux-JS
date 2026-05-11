import { diagnoseFont, FontFlux, initWoff2 } from 'font-flux-js';
import { createLoadingScreen } from './components/loading.js';
import { createSaveDialog } from './components/save-dialog.js';
import { createTabBar } from './components/tab-bar.js';
import { diagnoseTab } from './tabs/diagnose.js';
import { renderInfoTab } from './tabs/info.js';
import { overviewTab } from './tabs/overview.js';
import { previewTab } from './tabs/preview.js';
import { subsetTab } from './tabs/subset.js';
import { createTableTab } from './tabs/table-detail.js';

const app = document.getElementById('app');

let fontFaceURL = null;

/**
 * Bridge between FontFlux class instances and the demo's tab UI.
 *
 * The tabs were originally written against the raw simplified-data shape
 * returned by the (now-internal) `importFont()` helper. Rather than rewrite
 * every tab to read instance getters one by one, we attach the per-document
 * demo state (`_fileName`, `_originalBuffer`, `_dirty`, `_collection*`,
 * `_loadError`, ...) directly to `font.data` — the live simplified object
 * exposed by the public `FontFlux` API. Tabs receive that simplified object
 * unchanged.
 *
 * @param {import('font-flux-js').FontFlux[]} instances
 * @param {string} fileName
 * @param {ArrayBuffer|null} originalBuffer Binary source, or null for JSON.
 * @returns {object} fontData for tab consumption
 */
function prepareFromInstances(instances, fileName, originalBuffer) {
	const dataObjects = instances.map((inst) => inst.data);
	const isCollection = dataObjects.length > 1;

	for (let i = 0; i < dataObjects.length; i++) {
		const d = dataObjects[i];
		d._fileName = fileName;
		if (originalBuffer) d._originalBuffer = originalBuffer;
		d._dirty = false;
		if (isCollection) {
			d._collection = { numFonts: dataObjects.length };
			d._collectionFonts = dataObjects;
			d._collectionIndex = i;
			d._collectionInstances = instances;
		}
	}
	return dataObjects[0];
}

function showLoadingScreen() {
	// Revoke previous blob URL
	if (fontFaceURL) {
		URL.revokeObjectURL(fontFaceURL);
		fontFaceURL = null;
	}

	app.className = '';
	app.innerHTML = '';
	const screen = createLoadingScreen(app, onFontLoaded);

	async function onFontLoaded(buffer, fileName) {
		try {
			// JSON file: buffer is actually a string of JSON text.
			if (typeof buffer === 'string') {
				// FontFlux.openAll() handles both single fonts and collections,
				// in either JSON or binary form. Always returns an array.
				const instances = FontFlux.openAll(buffer);

				// Try to produce a binary blob for live @font-face preview.
				// If export fails, the preview tab will simply not have a
				// custom font available — the rest of the app still works.
				try {
					const exported = instances[0].export({ format: 'sfnt' });
					injectFontFace(exported, fileName.replace(/\.json$/i, '.otf'));
				} catch (exportErr) {
					console.warn(
						'JSON imported but could not be exported for live preview:',
						exportErr,
					);
				}

				showApp(prepareFromInstances(instances, fileName, null));
				return;
			}

			const instances = FontFlux.openAll(buffer);

			// Inject @font-face from original binary for live preview
			injectFontFace(buffer, fileName);

			showApp(prepareFromInstances(instances, fileName, buffer));
		} catch (err) {
			console.error('Import error:', err);
			if (typeof buffer === 'string') {
				screen.showError(`Failed to parse JSON font: ${err.message}`);
				return;
			}
			// Binary font failed to fully parse. Switch into the regular
			// tabs UI but in "diagnose-only" mode, landing on the Diagnose
			// tab so the user immediately sees what went wrong.
			let canDiagnose = false;
			try {
				diagnoseFont(buffer);
				canDiagnose = true;
			} catch (_) {
				// diagnose itself blew up — fall back to a flat error.
			}
			if (canDiagnose) {
				const stub = {
					_fileName: fileName,
					_originalBuffer: buffer,
					_dirty: false,
					_diagnoseOnly: true,
					_loadError: err,
				};
				showApp(stub, { initialTab: 'diagnose', errorMode: true });
			} else {
				screen.showError(`Failed to parse font: ${err.message}`);
			}
		}
	}
}

function injectFontFace(buffer, fileName) {
	// Remove previous injected style
	const prev = document.getElementById('demo-font-face');
	if (prev) prev.remove();

	// Determine MIME by extension
	const ext = fileName.split('.').pop().toLowerCase();
	const mimeMap = {
		ttf: 'font/ttf',
		otf: 'font/otf',
		woff: 'font/woff',
		ttc: 'font/collection',
		otc: 'font/collection',
	};
	const mime = mimeMap[ext] || 'font/ttf';

	const blob = new Blob([buffer], { type: mime });
	fontFaceURL = URL.createObjectURL(blob);

	const style = document.createElement('style');
	style.id = 'demo-font-face';
	style.textContent = `
		@font-face {
			font-family: 'DemoLoadedFont';
			src: url('${fontFaceURL}');
		}
	`;
	document.head.appendChild(style);
}

function showApp(fontData, options = {}) {
	const { initialTab = 'overview', errorMode = false } = options;
	app.className = 'app-loaded';
	app.innerHTML = '';

	// ── App context shared with tabs ──

	function markDirty() {
		fontData._dirty = true;
	}

	function invalidateL1Cache(key) {
		if (key) {
			delete l1Cache[key];
		} else {
			for (const k of Object.keys(l1Cache)) delete l1Cache[k];
		}
		// Re-render active tab
		if (activeL1) {
			const prev = activeL1;
			activeL1 = null;
			setL1Active(prev);
		}
	}

	const appContext = { fontData, markDirty, invalidateL1Cache };

	// Header
	const header = document.createElement('header');
	header.className = 'app-header';

	// Left: title + font name
	const headerLeft = document.createElement('div');
	headerLeft.className = 'header-left';

	const title = document.createElement('img');
	title.src = new URL('./assets/font-flux-js-logo.svg', import.meta.url).href;
	title.alt = 'font flux js';
	title.className = 'header-logo';

	const fontName = document.createElement('span');
	fontName.className = 'font-name';
	const displayName =
		fontData.font?.fullName ||
		fontData.font?.familyName ||
		fontData._fileName ||
		'Untitled Font';
	fontName.textContent = displayName;

	headerLeft.append(title, fontName);

	// Collection font chooser
	if (fontData._collectionFonts && fontData._collectionFonts.length > 1) {
		const chooser = document.createElement('select');
		chooser.className = 'font-chooser';
		for (let i = 0; i < fontData._collectionFonts.length; i++) {
			const f = fontData._collectionFonts[i];
			const opt = document.createElement('option');
			opt.value = String(i);
			opt.textContent = f.font?.fullName || f.font?.familyName || `Font ${i + 1}`;
			if (i === (fontData._collectionIndex ?? 0)) opt.selected = true;
			chooser.appendChild(opt);
		}
		chooser.addEventListener('change', () => {
			const idx = parseInt(chooser.value, 10);
			showApp(fontData._collectionFonts[idx]);
		});
		headerLeft.appendChild(chooser);
	}

	// Center: L1 nav
	const l1Nav = document.createElement('nav');
	l1Nav.className = 'l1-nav';

	const l1Defs = [
		{ key: 'overview', label: 'Overview' },
		{ key: 'preview', label: 'Preview' },
		{ key: 'subset', label: 'Subset' },
		{ key: 'tables', label: 'Tables' },
		{ key: 'diagnose', label: 'Diagnose' },
		{ key: 'info', label: 'Info' },
	];

	const l1Buttons = {};
	l1Defs.forEach(({ key, label }) => {
		const btn = document.createElement('button');
		btn.className = 'l1-tab';
		btn.textContent = label;
		const disabled = errorMode && key !== 'diagnose' && key !== 'info';
		if (disabled) {
			btn.disabled = true;
			btn.classList.add('l1-tab-disabled');
			btn.title = 'Not available — fix the font errors first.';
		} else {
			btn.addEventListener('click', () => setL1Active(key));
		}
		l1Nav.appendChild(btn);
		l1Buttons[key] = btn;
	});

	// Diagnose tab badge: red error count, or orange warning count.
	if (fontData._originalBuffer) {
		try {
			const diag = diagnoseFont(fontData._originalBuffer);
			const errs = diag.summary.errorCount || 0;
			const warns = diag.summary.warningCount || 0;
			if (errs > 0 || warns > 0) {
				const badge = document.createElement('span');
				badge.className =
					'l1-tab-badge ' +
					(errs > 0 ? 'l1-tab-badge-error' : 'l1-tab-badge-warning');
				badge.textContent = String(errs > 0 ? errs : warns);
				badge.title =
					errs > 0
						? `${errs} error${errs !== 1 ? 's' : ''}`
						: `${warns} warning${warns !== 1 ? 's' : ''}`;
				l1Buttons.diagnose.appendChild(badge);
			}
		} catch (_) {
			// Diagnose itself failed — leave the tab unbadged.
		}
	}

	// Tables tab badge: medium-gray count of parsed tables.
	if (fontData.tables) {
		const tableCount = Object.keys(fontData.tables).length;
		if (tableCount > 0) {
			const badge = document.createElement('span');
			badge.className = 'l1-tab-badge l1-tab-badge-neutral';
			badge.textContent = String(tableCount);
			badge.title = `${tableCount} parsed table${tableCount !== 1 ? 's' : ''}`;
			l1Buttons.tables.appendChild(badge);
		}
	}

	// Right: Download JSON + Export Font (hidden in error mode — there is
	// no parsed font data to export.)
	const headerRight = document.createElement('div');
	headerRight.className = 'header-right';

	if (!errorMode) {
		const jsonBtn = document.createElement('button');
		jsonBtn.className = 'header-btn';
		jsonBtn.textContent = 'Download JSON';
		jsonBtn.addEventListener('click', () => {
			const name =
				fontData.font?.familyName ||
				fontData.font?.fullName ||
				fontData._fileName?.replace(/\.[^.]+$/, '') ||
				'font';
			// Wrap the live simplified object back into a FontFlux instance
			// so we go through the public toJSON() serializer.
			const snapshot = new FontFlux(fontData);
			const json = snapshot.toJSON();
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${name}.json`;
			a.click();
			URL.revokeObjectURL(url);
		});

		const exportBtn = document.createElement('button');
		exportBtn.className = 'header-btn header-btn-primary';
		exportBtn.textContent = 'Export Font';
		exportBtn.addEventListener('click', () => {
			createSaveDialog(app, fontData);
		});

		headerRight.append(jsonBtn, exportBtn);
	}
	header.append(headerLeft, l1Nav, headerRight);
	app.appendChild(header);

	// Content area
	const content = document.createElement('div');
	content.className = 'app-content';
	app.appendChild(content);

	// L1 state
	const l1Cache = {};
	let activeL1 = null;

	function setL1Active(key) {
		if (activeL1 === key) return;
		activeL1 = key;

		Object.entries(l1Buttons).forEach(([k, btn]) => {
			btn.classList.toggle('active', k === key);
		});

		if (!l1Cache[key]) {
			const panel = document.createElement('div');
			panel.className = 'l1-panel';

			if (key === 'overview') {
				panel.classList.add('l1-panel-padded');
				overviewTab.render(panel, fontData, appContext);
			} else if (key === 'preview') {
				panel.classList.add('l1-panel-padded');
				previewTab.render(panel, fontData);
			} else if (key === 'subset') {
				panel.classList.add('l1-panel-padded');
				subsetTab.render(panel, fontData, appContext);
			} else if (key === 'tables') {
				panel.classList.add('l1-panel-tables');
				renderTablesPanel(panel, fontData);
			} else if (key === 'diagnose') {
				panel.classList.add('l1-panel-padded');
				diagnoseTab.render(panel, fontData, appContext);
			} else if (key === 'info') {
				panel.classList.add('l1-panel-padded');
				renderInfoTab(panel);
			}

			l1Cache[key] = panel;
		}

		content.innerHTML = '';
		content.appendChild(l1Cache[key]);
	}

	setL1Active(initialTab);
}

function renderTablesPanel(panel, fontData) {
	if (!fontData.tables) {
		panel.textContent = 'No tables found.';
		return;
	}

	const tags = Object.keys(fontData.tables).sort();
	const tabs = tags.map((tag) => createTableTab(tag, fontData.tables[tag]));
	createTabBar(panel, tabs, fontData);
}

// Boot
initWoff2().then(showLoadingScreen);
