/**
 * Save / Export dialog — modal overlay for downloading the font.
 * Preflights the selected target, then downloads those exact inspected bytes.
 */

import { FontFlux } from 'font-flux-js';
import { downloadQualityFile, preflightAudit } from '../quality-report.js';

/**
 * @param {HTMLElement} root - Append overlay to this element
 * @param {object} fontData - The font data object
 */
export function createSaveDialog(root, fontData, context) {
	let operation = 0;
	let verified = null;
	let audit = null;
	let closed = false;
	let controller = null;
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
	const profileLabel = document.createElement('label');
	profileLabel.className = 'field-group';
	profileLabel.textContent = 'Quality profile';
	const profile = document.createElement('select');
	profile.className = 'field-input';
	profile.setAttribute('aria-label', 'Export quality profile');
	for (const descriptor of FontFlux.qualityProfiles()) {
		const option = document.createElement('option');
		option.value = descriptor.id;
		option.dataset.version = descriptor.version;
		option.textContent = `${descriptor.id} v${descriptor.version}`;
		profile.appendChild(option);
	}
	profileLabel.appendChild(profile);
	dialog.appendChild(profileLabel);
	const policy = document.createElement('div');
	policy.hidden = true;
	const expectations = new Map();
	for (const [key, title] of [['expectedFileName', 'Expected filename'], ['expectedFamilyName', 'Expected family name']]) {
		const label = document.createElement('label');
		label.className = 'field-group';
		label.textContent = title;
		const input = document.createElement('input');
		input.className = 'field-input';
		input.setAttribute('aria-label', title);
		input.addEventListener('input', invalidate);
		label.appendChild(input);
		policy.appendChild(label);
		expectations.set(key, input);
	}
	dialog.appendChild(policy);
	profile.addEventListener('change', () => {
		policy.hidden = profile.value !== 'publishing';
		invalidate();
	});

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

	const reportBtn = document.createElement('button');
	reportBtn.className = 'btn-report';
	reportBtn.textContent = 'Download preflight report';
	reportBtn.disabled = true;
	reportBtn.addEventListener('click', () => {
		if (!audit || !isCurrent(audit.token)) return invalidate();
		try { downloadQualityFile(JSON.stringify(audit.report, null, 2), 'font-preflight-report.json', 'application/json'); }
		catch (error) {
			valResults.className = 'validation-results invalid';
			valResults.textContent = `Report download failed: ${error.message}. Project unchanged.`;
		}
	});

	actions.append(cancelBtn, validateBtn, reportBtn, downloadBtn);
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
			const focusable = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled)')]
				.filter((control) => !control.closest('[hidden]'));
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
		controller?.abort();
		operation++;
		verified = null;
		audit = null;
		document.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('fontflux:project-change', invalidate);
		observer.disconnect();
		overlay.remove();
		if (previousFocus?.isConnected) previousFocus.focus();
	}

	function invalidate() {
		controller?.abort();
		controller = null;
		operation++;
		verified = null;
		audit = null;
		reportBtn.disabled = true;
		downloadBtn.disabled = true;
		validateBtn.disabled = false;
		valResults.style.display = '';
		valResults.className = 'validation-results';
		valResults.textContent = 'Target, profile, policy, filename, or project changed. Run preflight again before downloading.';
	}

	async function runPreflight() {
		controller?.abort();
		controller = new AbortController();
		const id = ++operation;
		const token = capture();
		const fmt = formats[selectedIdx];
		verified = null;
		audit = null;
		reportBtn.disabled = true;
		downloadBtn.disabled = true;
		validateBtn.disabled = true;
		valResults.style.display = '';
		valResults.className = 'validation-results';
		valResults.textContent = `Preflighting ${fmt.label} - export and verification pending…`;
		try {
			const font = context?.projectFont() ?? new FontFlux(structuredClone(fontData));
			const result = await font.preflightAsync({
				format: fmt.format, profile: profile.value, signal: controller.signal,
				profileVersion: Number(profile.selectedOptions[0].dataset.version),
				originalSource: context?.originalSource?.(),
				context: {
					fileName: fileInput.value,
					...Object.fromEntries([...expectations].filter(([, input]) => input.value).map(([key, input]) => [key, input.value])),
				},
				onProgress: (progress) => {
					if (!closed && id === operation) valResults.textContent = `${fmt.label}: ${progress.phase} - ${progress.status}`;
				},
			});
			if (closed || id !== operation) return;
			const report = await preflightAudit(result, {
				target: fmt.format, fileName: fileInput.value, profile: profile.value,
				profileVersion: Number(profile.selectedOptions[0].dataset.version),
				sourceFaceIndex: fontData._collectionIndex ?? 0,
			});
			if (closed || id !== operation) return;
			if (!isCurrent(token)) {
				invalidate();
				return;
			}
			audit = { report, token };
			reportBtn.disabled = false;
			const ok = result.state === 'verified' && result.buffer;
			valResults.className = `validation-results ${ok ? 'valid' : 'invalid'}`;
			valResults.replaceChildren();
			const summary = document.createElement('strong');
			summary.textContent = `${fmt.label}: ${result.state}. ${ok ? `Exact output verified for covered ${profile.value} checks only; not full font certification.` : (result.error || 'No verified output available.')}`;
			valResults.appendChild(summary);
			const list = document.createElement('ul');
			const add = (text, className = '') => {
				const item = document.createElement('li');
				item.className = className;
				item.textContent = text.replaceAll('\u2014', '-');
				list.appendChild(item);
			};
			add(`Target: ${fmt.format}; source face ${Number(fontData._collectionIndex ?? 0) + 1}; ${profile.value} profile v${report.profileVersion ?? 'unavailable'}.`);
			if (report.outputFingerprint) add(`Output SHA-256: ${report.outputFingerprint}`);
			for (const stage of result.stages) add(`${stage.id}: ${stage.status} - ${stage.reasonCode}`);
			for (const normalization of result.normalizations) add(`${normalization.kind}: ${normalization.description}`);
			for (const effect of result.effects) add(`Export effect: ${effect}`);
			const findings = [...(result.validation?.issues ?? []), ...(result.output?.diagnostics?.issues ?? []),
				...(result.output?.profileReport?.issues ?? [])];
			const seen = new Set();
			for (const issue of findings) {
				const text = `[${issue.severity}] ${issue.code}: ${issue.message}`;
				if (seen.has(text)) continue;
				seen.add(text);
				add(text, issue.severity === 'error' ? 'val-error' : issue.severity === 'warning' ? 'val-warning' : '');
			}
			add('Partial coverage - review skipped and unsupported checks:');
			for (const coverage of result.output?.coverage ?? []) add(`${coverage.domain}: ${coverage.status} - ${coverage.reason}`);
			for (const limitation of result.output?.limitations ?? []) add(limitation);
			for (const check of result.output?.checks ?? []) add(`${check.id}: ${check.outcome}, ${check.coverage} - ${check.reason}`);
			valResults.appendChild(list);
			if (ok) {
				verified = { buffer: result.buffer, token, format: fmt.id, filename: fileInput.value, profile: profile.value };
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
		if (!verified || !isCurrent(verified.token) || verified.format !== fmt.id ||
			verified.filename !== fileInput.value || verified.profile !== profile.value) {
			invalidate();
			return;
		}
		try {
			downloadQualityFile(verified.buffer, fileInput.value || baseName + fmt.ext);
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
