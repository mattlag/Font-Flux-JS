/**
 * Save / Export dialog — modal overlay for downloading the font.
 * Preflights the selected target, then downloads those exact inspected bytes.
 */

import { FontFlux } from 'font-flux-js';

/**
 * @param {HTMLElement} root - Append overlay to this element
 * @param {object} fontData - The font data object
 */
export function createSaveDialog(root, fontData, context) {
	let operation = 0;
	let verified = null;
	let closed = false;
	const previousFocus = document.activeElement;
	const capture = () => context?.capture() ?? new FontFlux(fontData).toJSON(0);
	const isCurrent = (token) => context ? context.isCurrent(token) : capture() === token;

	// Determine default format from source
	const hasCFF = !!(fontData.tables?.['CFF '] || fontData.tables?.CFF2);
	const isStandaloneCFF = fontData._standalone === 'cff';
	const woffVersion = fontData._woff?.version;

	const formats = [
		{
			id: 'sfnt-native',
			label: hasCFF ? 'OTF' : 'TTF',
			ext: hasCFF ? '.otf' : '.ttf',
			format: 'sfnt',
		},
		// Cross-technology export: convert outlines to the other flavour.
		// (CFF source → also offer TTF; glyf source → also offer OTF.)
		hasCFF
			? { id: 'ttf', label: 'TTF', ext: '.ttf', format: 'ttf' }
			: { id: 'otf', label: 'OTF', ext: '.otf', format: 'otf' },
		{ id: 'woff', label: 'WOFF', ext: '.woff', format: 'woff' },
		{ id: 'woff2', label: 'WOFF2', ext: '.woff2', format: 'woff2' },
	];

	if (isStandaloneCFF) {
		formats.push({ id: 'cff', label: 'CFF', ext: '.cff', format: 'cff' });
	}

	// Variable and color fonts can't have their outlines converted; drop the
	// cross-technology option when conversion would fail.
	const isVariable = !!(
		fontData.axes?.length ||
		fontData.tables?.fvar ||
		fontData.tables?.gvar ||
		fontData.tables?.CFF2
	);
	if (isVariable) {
		const crossId = hasCFF ? 'ttf' : 'otf';
		const idx = formats.findIndex((f) => f.id === crossId);
		if (idx !== -1) formats.splice(idx, 1);
	}

	// Default selection based on source format
	const woff2Idx = formats.findIndex((f) => f.id === 'woff2');
	const woffIdx = formats.findIndex((f) => f.id === 'woff');
	let selectedIdx = isStandaloneCFF
		? formats.length - 1
		: woffVersion === 2
			? woff2Idx
			: woffVersion === 1
				? woffIdx
				: 0;

	// Build filename from font data
	const baseName = sanitizeFilename(
		fontData.font?.familyName ||
			fontData.font?.fullName ||
			fontData._fileName?.replace(/\.[^.]+$/, '') ||
			'font',
	);

	// ── Overlay ──
	const overlay = document.createElement('div');
	overlay.className = 'modal-overlay';
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) close();
	});

	const dialog = document.createElement('div');
	dialog.className = 'save-dialog';
	dialog.setAttribute('role', 'dialog');
	dialog.setAttribute('aria-modal', 'true');
	dialog.setAttribute('aria-label', 'Export Font');

	// Title
	const title = document.createElement('h2');
	title.textContent = 'Export Font';
	dialog.appendChild(title);

	// Filename field
	const fileGroup = document.createElement('div');
	fileGroup.className = 'field-group';
	const fileLabel = document.createElement('div');
	fileLabel.className = 'field-label';
	fileLabel.textContent = 'Filename';
	const fileInput = document.createElement('input');
	fileInput.className = 'field-input';
	fileInput.type = 'text';
	fileInput.setAttribute('aria-label', 'Filename');
	fileInput.value = baseName + formats[selectedIdx].ext;
	fileInput.addEventListener('input', invalidate);
	fileGroup.append(fileLabel, fileInput);
	dialog.appendChild(fileGroup);

	// Format selection
	const fmtGroup = document.createElement('div');
	fmtGroup.className = 'field-group';
	const fmtLabel = document.createElement('div');
	fmtLabel.className = 'field-label';
	fmtLabel.textContent = 'Format';
	const fmtOptions = document.createElement('div');
	fmtOptions.className = 'format-options';

	const optionEls = [];
	formats.forEach((fmt, i) => {
		const opt = document.createElement('label');
		opt.className = 'format-option' + (i === selectedIdx ? ' selected' : '');

		const radio = document.createElement('input');
		radio.type = 'radio';
		radio.name = 'exportFormat';
		radio.value = fmt.id;
		radio.checked = i === selectedIdx;
		radio.addEventListener('change', () => {
			invalidate();
			selectedIdx = i;
			for (const el of optionEls) el.classList.remove('selected');
			opt.classList.add('selected');
			// Update extension in filename
			const current = fileInput.value;
			const withoutExt = current.replace(/\.[^.]+$/, '');
			fileInput.value = withoutExt + fmt.ext;
		});

		const labelText = document.createElement('span');
		labelText.className = 'format-option-label';
		labelText.textContent = fmt.label;

		const extText = document.createElement('span');
		extText.className = 'format-option-ext';
		extText.textContent = fmt.ext;

		opt.append(radio, labelText, extText);
		fmtOptions.appendChild(opt);
		optionEls.push(opt);
	});

	fmtGroup.append(fmtLabel, fmtOptions);
	dialog.appendChild(fmtGroup);

	// Validation results area (hidden initially)
	const valResults = document.createElement('div');
	valResults.className = 'validation-results';
	valResults.setAttribute('role', 'status');
	valResults.setAttribute('aria-live', 'polite');
	valResults.style.display = 'none';
	dialog.appendChild(valResults);

	// Actions
	const actions = document.createElement('div');
	actions.className = 'save-dialog-actions';

	const cancelBtn = document.createElement('button');
	cancelBtn.className = 'btn-cancel';
	cancelBtn.textContent = 'Cancel';
	cancelBtn.addEventListener('click', close);

	const validateBtn = document.createElement('button');
	validateBtn.className = 'btn-validate';
	validateBtn.textContent = 'Preflight';
	validateBtn.addEventListener('click', () => {
		runPreflight();
	});

	const downloadBtn = document.createElement('button');
	downloadBtn.className = 'btn-download';
	downloadBtn.textContent = 'Download';
	downloadBtn.disabled = true;
	downloadBtn.addEventListener('click', () => {
		doExport();
	});

	actions.append(cancelBtn, validateBtn, downloadBtn);
	dialog.appendChild(actions);

	overlay.appendChild(dialog);
	root.appendChild(overlay);

	// Focus filename
	fileInput.focus();
	fileInput.select();

	// Close on Escape
	function onKeyDown(e) {
		if (e.key === 'Escape') close();
		if (e.key === 'Tab') {
			const focusable = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
			const first = focusable[0];
			const last = focusable.at(-1);
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}
	document.addEventListener('keydown', onKeyDown);
	window.addEventListener('fontflux:project-change', invalidate);
	const observer = new MutationObserver(() => {
		if (!overlay.isConnected) close();
	});
	observer.observe(root, { childList: true });

	function close() {
		if (closed) return;
		closed = true;
		operation++;
		verified = null;
		document.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('fontflux:project-change', invalidate);
		observer.disconnect();
		overlay.remove();
		if (previousFocus?.isConnected) previousFocus.focus();
	}

	function invalidate() {
		operation++;
		verified = null;
		downloadBtn.disabled = true;
		validateBtn.disabled = false;
		valResults.style.display = '';
		valResults.className = 'validation-results';
		valResults.textContent = 'Target, filename, or project changed. Run preflight again before downloading.';
	}

	async function runPreflight() {
		const id = ++operation;
		const token = capture();
		const fmt = formats[selectedIdx];
		verified = null;
		downloadBtn.disabled = true;
		validateBtn.disabled = true;
		valResults.style.display = '';
		valResults.className = 'validation-results';
		valResults.textContent = `Preflighting ${fmt.label} — export and verification pending…`;
		try {
			const font = context?.projectFont() ?? new FontFlux(structuredClone(fontData));
			const result = await font.preflight({ format: fmt.format });
			if (closed || id !== operation) return;
			if (!isCurrent(token)) {
				invalidate();
				return;
			}
			const ok = result.state === 'verified' && result.buffer;
			valResults.className = `validation-results ${ok ? 'valid' : 'invalid'}`;
			valResults.replaceChildren();
			const summary = document.createElement('strong');
			summary.textContent = `${fmt.label}: ${result.state}. ${ok ? 'Exact output verified for covered structural checks only; not full font certification.' : (result.error || 'No verified output available.')}`;
			valResults.appendChild(summary);
			const list = document.createElement('ul');
			const add = (text, className = '') => {
				const item = document.createElement('li');
				item.className = className;
				item.textContent = text;
				list.appendChild(item);
			};
			add(`Target: ${fmt.format}; face ${Number(fontData._collectionIndex ?? 0) + 1}; structural profile.`);
			for (const effect of result.effects) add(`Export effect: ${effect}`);
			const findings = [...(result.validation?.issues ?? []), ...(result.output?.diagnostics?.issues ?? [])];
			const seen = new Set();
			for (const issue of findings) {
				const text = `[${issue.severity}] ${issue.code}: ${issue.message}`;
				if (seen.has(text)) continue;
				seen.add(text);
				add(text, issue.severity === 'error' ? 'val-error' : issue.severity === 'warning' ? 'val-warning' : '');
			}
			add('Partial coverage — review skipped and unsupported checks:');
			for (const coverage of result.output?.coverage ?? []) add(`${coverage.domain}: ${coverage.status} — ${coverage.reason}`);
			for (const limitation of result.output?.limitations ?? []) add(limitation);
			valResults.appendChild(list);
			if (ok) {
				verified = { buffer: result.buffer, token, format: fmt.id, filename: fileInput.value };
				downloadBtn.disabled = false;
			}
		} catch (err) {
			if (closed || id !== operation) return;
			valResults.className = 'validation-results invalid';
			valResults.textContent = `Preflight failed: ${err.message}. Project unchanged.`;
		} finally {
			if (!closed && id === operation) validateBtn.disabled = false;
		}
	}

	function doExport() {
		const fmt = formats[selectedIdx];
		if (!verified || !isCurrent(verified.token) || verified.format !== fmt.id || verified.filename !== fileInput.value) {
			invalidate();
			return;
		}
		try {
			const blob = new Blob([verified.buffer], {
				type: 'application/octet-stream',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileInput.value || baseName + fmt.ext;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			close();
		} catch (err) {
			valResults.style.display = '';
			valResults.className = 'validation-results invalid';
			valResults.textContent = `Export failed: ${err.message}`;
		}
	}
}

function sanitizeFilename(name) {
	return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'font';
}
