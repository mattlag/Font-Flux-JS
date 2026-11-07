import { FontFlux, initWoff2 } from 'font-flux-js';
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
let previewFontFace = null;
let currentFontData = null;
let currentPreviewBuffer = null;
let navigationVersion = 0;
let woff2Failure = null;
const documentStates = new WeakMap();
const transientKeys = new Set([
	'_fileName', '_originalBuffer', '_dirty', '_collection', '_collectionFonts',
	'_collectionIndex', '_collectionInstances', '_loadError', '_diagnoseOnly',
]);

function projectData(data) {
	return Object.fromEntries(Object.entries(data).filter(([key]) => !transientKeys.has(key)));
}

function snapshot(data) {
	return structuredClone(projectData(data));
}

function projectKey(data) {
	return new FontFlux(projectData(data)).toJSON(0);
}

function stateFor(data) {
	if (!documentStates.has(data)) {
		documentStates.set(data, {
			revision: 0,
			original: snapshot(data),
			originalDiagnoseOnly: !!data._diagnoseOnly,
			originalError: data._loadError,
			originalPreview: null,
			originalPreviewFace: null,
			originalPreviewWasCSS: false,
			undo: null,
			binary: data._originalBuffer ?? null,
			binaryKey: projectKey(data),
		});
	}
	return documentStates.get(data);
}

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
	const preservedBuffer = originalBuffer?.slice(0) ?? null;

	for (let i = 0; i < dataObjects.length; i++) {
		const d = dataObjects[i];
		if (instances[i] instanceof FontFlux) {
			for (const key of transientKeys) delete d[key];
		}
		d._fileName = fileName;
		if (preservedBuffer) d._originalBuffer = preservedBuffer;
		d._dirty = false;
		if (isCollection) {
			d._collection = { numFonts: dataObjects.length };
			d._collectionFonts = dataObjects;
			d._collectionIndex = i;
		}
		stateFor(d);
	}
	return dataObjects[0];
}

function showLoadingScreen() {
	currentFontData = null;
	clearFontPreview();

	app.className = '';
	app.innerHTML = '';
	const screen = createLoadingScreen(app, onFontLoaded);
	if (woff2Failure) screen.showError(`WOFF2 initialization failed: ${woff2Failure.message}. Other formats remain available; WOFF2 operations may be unavailable.`);

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

			let instances;
			try {
				instances = FontFlux.openAll(buffer);
			} catch (error) {
				// A corrupt later face must not hide readable faces. The bounded
				// header is used only for host navigation; core owns diagnosis.
				const view = new DataView(buffer);
				const count = buffer.byteLength >= 12 && view.getUint32(0) === 0x74746366
					? view.getUint32(8) : 0;
				if (!count || count > 64 || 12 + count * 4 > buffer.byteLength) throw error;
				instances = Array.from({ length: count }, (_, faceIndex) => {
					try {
						return FontFlux.open(buffer, { faceIndex });
					} catch (faceError) {
						return { data: { _diagnoseOnly: true, _loadError: faceError } };
					}
				});
			}

			const prepared = prepareFromInstances(instances, fileName, buffer);
			const first = prepared._collectionFonts?.find((face) => !face._diagnoseOnly) || prepared;
			if (!first._diagnoseOnly) {
				try {
					const preview = prepared._collectionFonts
						? new FontFlux(projectData(first)).export({ format: 'sfnt' }) : buffer;
					injectFontFace(preview, fileName);
				} catch (previewError) {
					console.warn('Font imported without a browser preview:', previewError);
				}
			}
			showApp(first, { initialTab: first._diagnoseOnly ? 'diagnose' : 'overview' });
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
			let inspectionError = null;
			try {
				FontFlux.inspect(buffer);
				canDiagnose = true;
			} catch (error) {
				inspectionError = error;
				console.error('Inspection failed:', error);
			}
			if (canDiagnose) {
				const stub = {
					_fileName: fileName,
					_originalBuffer: buffer.slice(0),
					_dirty: false,
					_diagnoseOnly: true,
					_loadError: err,
				};
				showApp(stub, { initialTab: 'diagnose', errorMode: true });
			} else {
				screen.showError(`Failed to parse font: ${err.message}. Inspection failed: ${inspectionError?.message}`);
			}
		}
	}
}

function clearFontPreview(retainFace = null) {
	const prev = document.getElementById('demo-font-face');
	if (prev) prev.remove();
	if (fontFaceURL) URL.revokeObjectURL(fontFaceURL);
	fontFaceURL = null;
	if (previewFontFace && previewFontFace !== retainFace) document.fonts.delete(previewFontFace);
	previewFontFace = null;
	currentPreviewBuffer = null;
}

async function refreshFontPreview(buffer, expectedFontData) {
	const expectedNavigation = navigationVersion;
	const nextPreview = buffer.slice(0);
	const replacement = new FontFace('DemoLoadedFont', buffer);
	await replacement.load();
	if (currentFontData !== expectedFontData || navigationVersion !== expectedNavigation) {
		throw new Error('The active font changed while loading the preview');
	}
	document.fonts.add(replacement);
	clearFontPreview(replacement);
	previewFontFace = replacement;
	currentPreviewBuffer = nextPreview;
}

function prepareCSSPreview(buffer, fileName) {
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
	const url = URL.createObjectURL(blob);

	const style = document.createElement('style');
	style.media = 'not all';
	style.textContent = `
		@font-face {
			font-family: 'DemoLoadedFont';
			src: url('${url}');
		}
	`;
	try {
		document.head.appendChild(style);
	} catch (error) {
		URL.revokeObjectURL(url);
		throw error;
	}
	return { style, url };
}

function activateCSSPreview({ style, url }) {
	style.id = 'demo-font-face';
	style.media = 'all';
	fontFaceURL = url;
}

function injectFontFace(buffer, fileName) {
	const nextPreview = buffer.slice(0);
	const prepared = prepareCSSPreview(buffer, fileName);
	clearFontPreview();
	activateCSSPreview(prepared);
	currentPreviewBuffer = nextPreview;
}

function showApp(fontData, options = {}) {
	const { initialTab = 'overview', errorMode = !!fontData._diagnoseOnly } = options;
	navigationVersion++;
	currentFontData = fontData;
	const state = stateFor(fontData);
	if (!state.originalPreview && !fontData._dirty && currentPreviewBuffer) {
		state.originalPreview = currentPreviewBuffer.slice(0);
		state.originalPreviewFace = previewFontFace;
		state.originalPreviewWasCSS = !!document.getElementById('demo-font-face');
	}
	app.className = 'app-loaded';
	app.innerHTML = '';

	// ── App context shared with tabs ──

	function markDirty() {
		fontData._dirty = true;
		state.revision++;
		window.dispatchEvent(new Event('fontflux:project-change'));
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

	function capture() {
		return { data: fontData, revision: state.revision, navigation: navigationVersion, key: projectKey(fontData) };
	}

	function isCurrent(token) {
		return !!token && currentFontData === token.data && state.revision === token.revision
			&& navigationVersion === token.navigation && projectKey(fontData) === token.key;
	}

	let diagnoseLeave = null;
	let inspectionFace = '';

	async function installProject(next, buffer, token, restore = null, isAllowed = () => true, binary = buffer) {
		// Prepare everything before changing either live data or the visible face.
		// Undo restores the previous preview resource, including an original
		// CSS fallback for damaged fonts; it must not require repairing it first.
		const replacement = restore ? restore.previewFace
			: buffer ? new FontFace('DemoLoadedFont', buffer) : null;
		const nextBinary = restore ? restore.binary : binary.slice(0);
		const nextPreview = buffer?.slice(0) ?? null;
		const nextBinaryKey = restore ? restore.binaryKey : new FontFlux(projectData(next)).toJSON(0);
		const nextCollectionKeys = !restore && binary.byteLength >= 4 && new DataView(binary).getUint32(0) === 0x74746366
			? (fontData._collectionFonts ?? []).map((data) => ({ data, key: data === fontData ? nextBinaryKey : projectKey(data) })) : [];
		if (replacement && !restore) await replacement.load();
		if (!isCurrent(token) || !isAllowed()) throw new Error('The project, active view, or decision changed; candidate is stale');
		const previous = {
			data: snapshot(fontData),
			dirty: fontData._dirty,
			diagnoseOnly: fontData._diagnoseOnly,
			loadError: fontData._loadError,
			preview: currentPreviewBuffer?.slice(0) ?? null,
			previewFace: previewFontFace,
			previewWasCSS: !!document.getElementById('demo-font-face'),
			binary: state.binary,
			binaryKey: state.binaryKey,
			collectionBinaries: (fontData._collectionFonts ?? []).map((data) => ({
				data, binary: stateFor(data).binary, binaryKey: stateFor(data).binaryKey,
			})),
		};
		const cssPreview = !replacement && restore?.previewWasCSS && buffer
			? prepareCSSPreview(buffer, fontData._fileName) : null;
		if (replacement) document.fonts.add(replacement);
		diagnoseLeave?.();
		for (const key of Object.keys(fontData)) if (!transientKeys.has(key)) delete fontData[key];
		Object.assign(fontData, next);
		fontData._dirty = restore ? restore.dirty : true;
		fontData._diagnoseOnly = restore?.diagnoseOnly ?? false;
		fontData._loadError = restore?.loadError;
		state.revision++;
		state.binary = nextBinary;
		state.binaryKey = nextBinaryKey;
		state.undo = restore ? null : previous;
		for (const data of fontData._collectionFonts ?? []) {
			if (data !== fontData) stateFor(data).undo = null;
		}
		if (restore?.collectionBinaries) {
			for (const previous of restore.collectionBinaries) {
				const member = stateFor(previous.data);
				member.binary = previous.binary;
				member.binaryKey = previous.binaryKey;
			}
		} else {
			for (const { data, key } of nextCollectionKeys) {
				const member = stateFor(data);
				member.binary = state.binary;
				member.binaryKey = key;
			}
		}
		clearFontPreview(replacement);
		if (replacement) {
			previewFontFace = replacement;
		} else if (cssPreview) {
			activateCSSPreview(cssPreview);
		}
		currentPreviewBuffer = nextPreview;
		window.dispatchEvent(new Event('fontflux:project-change'));
		showApp(fontData, { initialTab: 'diagnose' });
		const heading = app.querySelector('.diagnose-page h2');
		if (heading) {
			heading.tabIndex = -1;
			heading.focus();
		}
	}

	const appContext = {
		fontData,
		markDirty,
		invalidateL1Cache,
		refreshPreview: (buffer) => refreshFontPreview(buffer, fontData),
		capture,
		isCurrent,
		projectFont: () => new FontFlux(snapshot(fontData)),
		originalSource: () => fontData._originalBuffer ? {
			bytes: fontData._originalBuffer,
			options: fontData._collection ? { faceIndex: fontData._collectionIndex ?? 0 } : {},
		} : undefined,
		repairInput: () => {
			if (!state.binary || state.binaryKey !== projectKey(fontData)) return null;
			if (state.binary.byteLength >= 4 && new DataView(state.binary).getUint32(0) === 0x74746366 &&
				fontData._collectionFonts?.some((data) => {
					const other = stateFor(data);
					return other.binary !== state.binary || other.binaryKey !== projectKey(data);
				})) return null;
			return state.binary.slice(0);
		},
		canUndo: () => !!state.undo,
		canRevert: () => !!state.original,
		onDiagnoseLeave: (handler) => { diagnoseLeave = handler; },
		get inspectionFace() { return inspectionFace; },
		commit: async (buffer, token, isAllowed, scope = {}) => {
			if (!isCurrent(token)) throw new Error('Candidate is stale');
			const collection = scope.format === 'collection';
			if (collection && scope.faceIndex !== (fontData._collectionIndex ?? 0))
				throw new Error('The repaired collection face is not the active project face.');
			const font = FontFlux.open(buffer, collection ? { faceIndex: scope.faceIndex } : {});
			let preview = buffer;
			if (collection) {
				const checked = await font.preflightAsync({ format: 'sfnt' });
				if (checked.state !== 'verified') throw new Error(checked.error);
				preview = checked.buffer;
			}
			await installProject(font.data, preview, token, null, isAllowed, buffer);
		},
		undo: async () => {
			const previous = state.undo;
			if (!previous) throw new Error('No undo step is available');
			await installProject(structuredClone(previous.data), previous.preview, capture(), previous);
		},
		revert: async () => {
			const original = {
				dirty: false, diagnoseOnly: state.originalDiagnoseOnly, loadError: state.originalError,
				binary: fontData._originalBuffer ?? null, binaryKey: new FontFlux(state.original).toJSON(0),
				previewFace: state.originalPreviewFace, previewWasCSS: state.originalPreviewWasCSS,
			};
			const members = fontData._collectionFonts ?? [];
			if (members.every((data) => data === fontData || projectKey(data) === new FontFlux(stateFor(data).original).toJSON(0)))
				original.collectionBinaries = members.map((data) => ({
					data, binary: data._originalBuffer ?? null,
					binaryKey: data === fontData ? original.binaryKey : projectKey(data),
				}));
			await installProject(structuredClone(state.original), state.originalPreview, capture(), original);
		},
	};

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
		chooser.setAttribute('aria-label', 'Active collection face');
		for (let i = 0; i < fontData._collectionFonts.length; i++) {
			const f = fontData._collectionFonts[i];
			const opt = document.createElement('option');
			opt.value = String(i);
			opt.textContent =
				f.font?.fullName || f.font?.familyName || `Font ${i + 1}`;
			if (i === (fontData._collectionIndex ?? 0)) opt.selected = true;
			chooser.appendChild(opt);
		}
		chooser.addEventListener('change', async () => {
			const idx = parseInt(chooser.value, 10);
			const nextFont = fontData._collectionFonts[idx];
			if (nextFont._diagnoseOnly) {
				diagnoseLeave?.();
				chooser.value = String(fontData._collectionIndex ?? 0);
				inspectionFace = idx;
				delete l1Cache.diagnose;
				activeL1 = null;
				setL1Active('diagnose');
				return;
			}
			chooser.disabled = true;
			try {
				diagnoseLeave?.();
				navigationVersion++;
				const buffer = new FontFlux(nextFont).export({ format: 'sfnt' });
				await refreshFontPreview(buffer, fontData);
				showApp(nextFont);
			} catch (err) {
				chooser.value = String(fontData._collectionIndex ?? 0);
				alert(`Unable to preview this face: ${err.message}`);
			} finally {
				chooser.disabled = false;
			}
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
			const diag = FontFlux.inspect(fontData._originalBuffer).diagnostics;
			const errs = diag?.summary.errorCount || 0;
			const warns = diag?.summary.warningCount || 0;
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
		} catch (error) {
			console.error('Original-input badge inspection failed:', error);
			const badge = document.createElement('span');
			badge.className = 'l1-tab-badge l1-tab-badge-error';
			badge.textContent = '!';
			badge.title = `Inspection failed: ${error.message}`;
			badge.setAttribute('aria-label', badge.title);
			l1Buttons.diagnose.appendChild(badge);
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
			const json = new FontFlux(projectData(fontData)).toJSON();
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
			createSaveDialog(app, fontData, appContext);
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
		if (activeL1 === 'diagnose') diagnoseLeave?.();
		navigationVersion++;
		activeL1 = key;
		if (key === 'diagnose') delete l1Cache.diagnose;

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
initWoff2().then(showLoadingScreen, (error) => {
	woff2Failure = error;
	console.error('WOFF2 initialization failed:', error);
	showLoadingScreen();
});
