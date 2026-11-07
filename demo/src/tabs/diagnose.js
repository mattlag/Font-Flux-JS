/**
 * Core-owned inspection and repair decisions. Candidate bytes remain detached
 * until verification, a browser preview check, and explicit commit succeed.
 */
import { FontFlux } from 'font-flux-js';
import { candidateExtension, downloadQualityFile, preflightAudit } from '../quality-report.js';

export const diagnoseTab = { id: 'diagnose', label: 'Diagnose', render };

function element(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = text;
	return node;
}

function button(text, action) {
	const node = element('button', 'dx-action', text);
	node.type = 'button';
	node.addEventListener('click', action);
	return node;
}

function issues(report) {
	return report?.diagnostics?.issues ?? report?.issues ?? [];
}

function renderReport(report, title) {
	const section = element('section', 'dx-section dx-report');
	section.appendChild(element('h3', 'dx-section-heading', title));
	if (!report) {
		section.appendChild(element('p', 'dx-empty', 'No binary inspection is available.'));
		return section;
	}
	section.appendChild(element('p', 'dx-card-msg',
		`${report.profile} profile v${report.profileVersion} · ${report.legacyFormat || report.format} · ${report.scope}. This is not full font certification.`));
	const findings = [...issues(report), ...report.profileReport?.issues ?? []];
	const errors = findings.filter((issue) => issue.severity === 'error').length;
	const warnings = findings.filter((issue) => issue.severity === 'warning').length;
	section.appendChild(element('div', `dx-banner ${errors ? 'dx-banner-bad' : ''}`,
		report.diagnostics ? `${errors} errors · ${warnings} warnings` : 'No completed original-format diagnosis; review scoped evidence.'));
	if (report.profileReport) section.appendChild(element('p', 'dx-card-msg',
		`Profile execution: ${report.profileReport.complete ? report.profileReport.passed ? 'passed' : 'failed' : 'incomplete/unsupported'}.`));
	const coverage = element('details', 'dx-coverage');
	coverage.appendChild(element('summary', 'dx-info-summary', 'Coverage and limitations (partial checks only)'));
	for (const item of report.coverage ?? []) {
		coverage.appendChild(element('p', 'dx-card-msg', `${item.domain}: ${item.status} — ${item.reason}`));
	}
	for (const limitation of report.limitations ?? []) {
		coverage.appendChild(element('p', 'dx-card-msg', limitation));
	}
	for (const check of report.checks ?? [])
		coverage.appendChild(element('p', 'dx-card-msg',
			`${check.id}: ${check.outcome}, ${check.coverage} — ${check.reason}`));
	section.appendChild(coverage);
	const info = element('details');
	info.appendChild(element('summary', 'dx-info-summary', 'Informational findings'));
	for (const issue of findings) {
		const card = element('div', `dx-card dx-${issue.severity}`);
		card.appendChild(element('div', 'dx-card-header', `${issue.severity}: ${issue.code}`));
		card.appendChild(element('div', 'dx-card-msg', issue.message));
		const location = [
			issue.table && `Table ${issue.table}`,
			issue.faceIndex != null && `Face ${issue.faceIndex + 1}`,
			issue.glyphIndex != null && `Glyph ${issue.glyphIndex}`,
			issue.offset != null && `Offset ${issue.offset}`,
			issue.location && JSON.stringify(issue.location),
		].filter(Boolean).join(' · ');
		if (location) card.appendChild(element('code', 'dx-card-code', location));
		(issue.severity === 'info' ? info : section).appendChild(card);
	}
	if (info.children.length > 1) section.appendChild(info);
	return section;
}

function render(container, fontData, context) {
	const wrap = element('div', 'diagnose-page');
	container.appendChild(wrap);
	let version = 0;
	let source = null;
	let candidate = null;
	let candidatePreview = null;
	let sourceToken = null;
	let busy = false;
	let controller = null;
	let sourceOptions = {};
	const inspectionCache = FontFlux.createInspectionCache({ maxEntries: 2, maxBytes: 8 * 1024 * 1024 });
	const selections = new Map();
	const consentBoxes = [];
	const actions = element('div', 'dx-actions');
	const status = element('div', 'dx-status');
	status.tabIndex = -1;
	status.setAttribute('role', 'status');
	status.setAttribute('aria-live', 'polite');
	const originalArea = element('div', 'dx-original');
	const currentArea = element('div', 'dx-current');
	const repairArea = element('div', 'dx-repairs');
	const candidateArea = element('div', 'dx-candidate');

	wrap.appendChild(element('h2', '', 'Inspect and repair'));
	wrap.appendChild(element('p', 'dx-card-msg',
		'Original input, current project, and candidate output are separate. Repairs below come from the core registry; advanced repairs without a registered offer are unavailable.'));
	if (fontData._loadError) {
		wrap.appendChild(element('div', 'dx-parse-error',
			`Import failed: ${fontData._loadError.message}. Inspection may still identify recoverable problems.`));
	}
	wrap.append(actions, status, originalArea, currentArea, repairArea, candidateArea);
	const profileLabel = element('label', 'dx-decision', 'Quality profile ');
	const profile = element('select', 'field-input');
	profile.setAttribute('aria-label', 'Quality profile');
	for (const descriptor of FontFlux.qualityProfiles()) {
		const option = element('option', '', `${descriptor.id} v${descriptor.version}`);
		option.value = descriptor.id;
		option.dataset.version = descriptor.version;
		profile.appendChild(option);
	}
	profileLabel.appendChild(profile);
	const policy = element('div', 'dx-policy');
	policy.hidden = true;
	const policyFields = new Map();
	for (const [key, title] of [['expectedFileName', 'Expected filename'], ['expectedFamilyName', 'Expected family name']]) {
		const label = element('label', 'dx-decision', title);
		const input = element('input', 'field-input');
		input.type = 'text';
		input.setAttribute('aria-label', title);
		input.addEventListener('input', () => { invalidate(); refreshInspections(); });
		label.appendChild(input);
		policy.appendChild(label);
		policyFields.set(key, input);
	}
	status.before(profileLabel, policy);
	profile.addEventListener('change', () => {
		policy.hidden = profile.value !== 'publishing';
		invalidate();
		refreshInspections();
	});

	function inspectionOptions(face = false) {
		return {
			profile: profile.value,
			profileVersion: Number(profile.selectedOptions[0].dataset.version),
			...(profile.value === 'publishing' ? { context: {
				fileName: fontData._fileName,
				...Object.fromEntries([...policyFields].filter(([, input]) => input.value).map(([key, input]) => [key, input.value])),
			} } : {}),
			...(face && fontData._collection ? { faceIndex: fontData._collectionIndex ?? 0 } : {}),
		};
	}

	function beginWork() {
		controller?.abort();
		controller = new AbortController();
		const activeController = controller;
		return {
			signal: controller.signal,
			onProgress: (progress) => {
				if (!activeController.signal.aborted)
					message(`${progress.phase}: ${progress.status ?? 'working'} — no project changes committed.`);
			},
		};
	}

	function message(text, failed = false) {
		status.textContent = text;
		status.className = `dx-status${failed ? ' validation-results invalid' : ''}`;
	}

	function download(buffer, name, type) {
		try { downloadQualityFile(buffer, name, type); }
		catch (error) { message(`Download failed: ${error.message}. Project and preview unchanged.`, true); }
	}

	function disposePreview() {
		if (candidatePreview) document.fonts.delete(candidatePreview);
		candidatePreview = null;
	}

	function invalidate(resetConsent = true) {
		controller?.abort();
		controller = null;
		version++;
		busy = false;
		candidate = null;
		disposePreview();
		candidateArea.replaceChildren();
		if (resetConsent) for (const box of consentBoxes) box.checked = false;
	}

	function active(token, operation) {
		return operation === version && context.isCurrent(token);
	}

	function updateActions() {
		const selected = [...selections.values()].some(({ checkbox }) => checkbox.checked);
		planButton.disabled = busy || !source || !selected;
		safeButton.disabled = busy || !source || ![...selections.values()].some(({ offer }) =>
			offer.risk === 'safe' && offer.availability === 'available' && !offer.inputs.length);
	}

	function focusReview() {
		(planButton.disabled ? preflightButton ?? status : planButton).focus();
	}

	function decisionsChanged(resetConsent = true) {
		invalidate(resetConsent);
		message('Selection changed. Review a new plan before applying.');
		updateActions();
	}

	const safeButton = button('Select available safe repairs', () => {
		decisionsChanged();
		for (const { offer, checkbox } of selections.values()) {
			checkbox.checked = offer.risk === 'safe' && offer.availability === 'available' && !offer.inputs.length;
		}
		message('Safe repairs selected for review only. No changes applied.');
		updateActions();
	});
	const planButton = button('Review repair plan', reviewPlan);
	let preflightButton = null;
	actions.append(safeButton, planButton);
	actions.appendChild(button('Cancel pending work', () => {
		invalidate();
		message('Operation cancelled. No candidate committed; original and project unchanged.');
		updateActions();
		status.focus();
	}));
	if (!fontData._diagnoseOnly) {
		preflightButton = button('Preflight current project', preflightProject);
		actions.appendChild(preflightButton);
	}
	if (fontData._originalBuffer) {
		actions.appendChild(button('Download original (unverified)', () => {
			download(fontData._originalBuffer, fontData._fileName || 'original.font');
		}));
	}
	if (context.canUndo()) {
		actions.appendChild(button('Undo last commit', async () => {
			invalidate();
			try {
				await context.undo();
			} catch (error) {
				message(`Undo failed: ${error.message}. Project and preview unchanged.`, true);
			}
		}));
	}
	if (fontData._dirty && context.canRevert()) {
		actions.appendChild(button('Revert to original project', async () => {
			if (!window.confirm('Discard current edits and restore the original project?')) return;
			invalidate();
			try {
				await context.revert();
			} catch (error) {
				message(`Revert failed: ${error.message}. Project and preview unchanged.`, true);
			}
		}));
	}
	wrap.appendChild(element('p', 'dx-card-msg',
		'Undo retains one pre-commit project; a collection commit invalidates older undo steps on its other faces. Separate edits on another face block original-collection repair until reconciled. Candidate previews are supporting evidence, not proof that all glyphs render identically.'));

	let inspectionFace = context.inspectionFace ?? '';
	if (fontData._collection?.numFonts > 1) {
		const label = element('label', 'dx-decision', 'Original collection scope ');
		const chooser = element('select', 'dx-face-chooser');
		chooser.setAttribute('aria-label', 'Original collection scope');
		const all = element('option', '', 'All faces and collection');
		all.value = '';
		chooser.appendChild(all);
		for (let i = 0; i < fontData._collection.numFonts; i++) {
			const option = element('option', '', `Face ${i + 1}`);
			option.value = String(i);
			chooser.appendChild(option);
		}
		chooser.value = String(inspectionFace);
		chooser.addEventListener('change', () => {
			inspectionFace = chooser.value;
			invalidate();
			refreshInspections();
			updateActions();
		});
		originalArea.before(label);
		label.appendChild(chooser);
	}

	async function renderOriginal(controls, operation) {
		originalArea.replaceChildren();
		if (!fontData._originalBuffer) {
			originalArea.appendChild(element('p', 'dx-empty',
				'Authored JSON project — no original binary. Use current-project preflight to inspect exact export bytes.'));
			return;
		}
		try {
			const options = { ...inspectionOptions(), ...controls, ...(inspectionFace === '' ? {} : { faceIndex: Number(inspectionFace) }) };
			const report = await FontFlux.inspectAsync(fontData._originalBuffer, { ...options, cache: inspectionCache });
			if (operation !== version) return;
			originalArea.appendChild(renderReport(report, inspectionFace === ''
				? 'Original input (unchanged)' : `Original input — face ${Number(inspectionFace) + 1} (unchanged)`));
		} catch (error) {
			if (operation !== version || error.name === 'AbortError') return;
			originalArea.appendChild(element('p', 'dx-parse-error', `Inspection failed: ${error.message}`));
		}
	}

	function showOffers(report, buffer, token, options = {}) {
		source = buffer;
		sourceOptions = options;
		sourceToken = token;
		selections.clear();
		consentBoxes.length = 0;
		repairArea.replaceChildren(element('h3', 'dx-section-heading', 'Available repair decisions'));
		if (!report?.repairs?.length) {
			repairArea.appendChild(element('p', 'dx-empty',
				'No registered repairs for these findings. Unsupported operations are not automatic fixes.'));
		}
		for (const offer of report?.repairs ?? []) {
			const card = element('div', 'dx-card dx-offer');
			card.dataset.repairId = offer.id;
			const label = element('label', 'dx-card-header');
			const checkbox = element('input');
			checkbox.type = 'checkbox';
			checkbox.disabled = !buffer || !['available', 'needs-input'].includes(offer.availability);
			checkbox.addEventListener('change', () => decisionsChanged());
			label.append(checkbox, element('strong', '', offer.title),
				element('span', 'dx-risk', `${offer.risk} · ${offer.availability}`));
			card.append(label, element('p', 'dx-card-msg', offer.description));
			for (const [title, value] of [
				['If applied', offer.ifApplied], ['If unfixed', offer.ifUnfixed],
				['Prerequisites', offer.prerequisites], ['Availability', offer.reason],
				['Risk rationale', offer.riskReason], ['Preservation', offer.invariants],
				['Findings', offer.codes],
				['Policy version', offer.policyVersion], ['Affected tables', offer.affectedTables],
			]) {
				if (value?.length) card.appendChild(element('p', 'dx-card-msg',
					`${title}: ${Array.isArray(value) ? value.join('; ') : value}`));
			}
			const inputs = new Map();
			for (const schema of offer.inputs) {
				const inputLabel = element('label', 'dx-decision', schema.label);
				const input = element(['enum', 'boolean'].includes(schema.type) ? 'select' : 'input', 'field-input');
				if (['enum', 'boolean'].includes(schema.type)) {
					const empty = element('option', '', 'Choose explicitly');
					empty.value = '';
					input.appendChild(empty);
					for (const value of schema.type === 'boolean' ? ['true', 'false'] : schema.values) {
						const option = element('option', '', schema.type === 'boolean' ? value === 'true' ? 'Yes' : 'No' : value);
						option.value = value;
						input.appendChild(option);
					}
				} else input.type = ['integer', 'number'].includes(schema.type) ? 'number' : 'text';
				input.required = true;
				if (schema.type === 'integer') input.step = '1';
				if (schema.type === 'number') input.step = 'any';
				input.setAttribute('aria-label', schema.label);
				for (const key of ['min', 'max', 'maxLength']) {
					if (schema[key] != null) input[key] = schema[key];
				}
				input.disabled = checkbox.disabled;
				input.addEventListener('input', () => decisionsChanged());
				inputLabel.appendChild(input);
				card.appendChild(inputLabel);
				inputs.set(schema.key, { input, schema });
			}
			let consent = null;
			if (offer.risk === 'potentially-lossy') {
				const label = element('label', 'dx-decision dx-consent');
				consent = element('input');
				consent.type = 'checkbox';
				consent.disabled = checkbox.disabled;
				consent.addEventListener('change', () => decisionsChanged(false));
				label.append(consent, document.createTextNode(
					`I explicitly consent to this loss: ${offer.ifApplied}`));
				card.appendChild(label);
				consentBoxes.push(consent);
			}
			selections.set(offer.id, { offer, checkbox, inputs, consent });
			repairArea.appendChild(card);
		}
		updateActions();
	}

	async function preflightProject() {
		invalidate();
		const operation = version;
		const token = context.capture();
		busy = true;
		updateActions();
		message('Preflighting current project — export and verification pending…');
		try {
			const controls = beginWork(), options = inspectionOptions();
			const result = await context.projectFont().preflightAsync({
				...options, format: 'sfnt', originalSource: context.originalSource?.(), ...controls,
			});
			if (!active(token, operation)) return;
			const audit = await preflightAudit(result, {
				target: 'sfnt', profile: options.profile, profileVersion: options.profileVersion, fileName: fontData._fileName,
				sourceFaceIndex: fontData._collectionIndex ?? 0,
			});
			if (!active(token, operation)) return;
			currentArea.replaceChildren(element('h3', 'dx-section-heading', 'Current project preflight'));
			currentArea.appendChild(element('p', 'dx-card-msg', result.error || `Preflight: ${result.state}`));
			for (const effect of result.effects) currentArea.appendChild(element('p', 'dx-card-msg', effect));
			for (const stage of result.stages)
				currentArea.appendChild(element('p', 'dx-card-msg', `${stage.id}: ${stage.status} — ${stage.reasonCode}`));
			for (const normalization of result.normalizations)
				currentArea.appendChild(element('p', 'dx-card-msg', `${normalization.kind}: ${normalization.description}`));
			if (result.output) currentArea.appendChild(renderReport(result.output, 'Current project output (not original input)'));
			for (const issue of result.validation?.issues ?? []) {
				currentArea.appendChild(element('p', `dx-card-msg dx-${issue.severity}`,
					`${issue.severity}: ${issue.code} — ${issue.message}`));
			}
			if (result.state !== 'verified' || !result.buffer) {
				showOffers(result.output, null, token, options);
				candidateArea.appendChild(button('Download audit report', () => {
					if (!active(token, operation)) return message('Report is stale. Preflight the current project again.', true);
					download(JSON.stringify(audit, null, 2), 'font-preflight-report.json', 'application/json');
				}));
				message(`Project preflight ${result.state}. No verified bytes available; original input and edits unchanged.`, true);
				return;
			}
			showOffers(result.output, result.buffer, token, options);
			await showCandidate({
				state: 'verified', buffer: result.buffer, before: null, after: result.output,
				preflight: audit, outputFingerprint: audit.outputFingerprint,
				changes: result.effects.map((description) => ({ id: 'export', description })),
				verification: { passed: true, evidence: ['Exact project export passed core preflight.'], failures: [] },
			}, token, operation, 'Preflight candidate');
		} catch (error) {
			if (active(token, operation)) message(`Preflight failed: ${error.message}. Project unchanged.`, true);
		} finally {
			if (active(token, operation)) {
				busy = false;
				updateActions();
			}
		}
	}

	async function reviewPlan() {
		invalidate(false);
		const operation = version;
		const token = context.capture();
		if (!context.isCurrent(sourceToken)) {
			message('Project changed. Preflight the current project before planning repairs.', true);
			return;
		}
		const requests = [];
		try {
			for (const { offer, checkbox, inputs, consent } of selections.values()) {
				if (!checkbox.checked) continue;
				const values = {};
				for (const [key, { input, schema }] of inputs) {
					if (!input.value.trim()) {
						input.reportValidity();
						input.focus();
						throw new Error(`Provide ${schema.label}; no default is assumed.`);
					}
					values[key] = ['integer', 'number'].includes(schema.type) ? Number(input.value)
						: schema.type === 'boolean' ? input.value === 'true' : input.value;
				}
				if (consent && !consent.checked) throw new Error(`Explicit loss consent is required for ${offer.title}.`);
				requests.push({ id: offer.id, inputs: values, consent: consent?.checked === true });
			}
			if (!requests.length) throw new Error('Select at least one repair.');
			busy = true;
			updateActions();
			message('Planning selected repairs…');
			const review = await FontFlux.planRepairsAsync(source, requests, {
				...sourceOptions, projectRevision: token.revision, ...beginWork(),
			});
			const plan = review.plan;
			if (!active(token, operation)) return;
			candidateArea.replaceChildren(element('h3', 'dx-section-heading', 'Repair plan — review before applying'));
			candidateArea.appendChild(element('p', 'dx-card-msg',
				`Target: ${plan.format}; ${plan.faceIndex == null ? 'standalone face' : `face ${plan.faceIndex + 1}`}; ${plan.profile} profile v${plan.profileVersion}. Input fingerprint: ${plan.inputFingerprint}`));
			for (const step of plan.steps) {
				candidateArea.appendChild(element('p', 'dx-card-msg',
					`${step.title} (${step.risk}${step.implicit ? ', required companion' : ''}): ${step.ifApplied} ${JSON.stringify(step.values)}`));
				if (step.policyVersion) candidateArea.appendChild(element('p', 'dx-card-msg', `Policy version: ${step.policyVersion}`));
			}
			for (const effect of plan.effects) candidateArea.appendChild(element('p', 'dx-card-msg', effect));
			candidateArea.appendChild(button('Download reviewed plan', () =>
				download(JSON.stringify(review, null, 2), 'font-repair-plan.json', 'application/json')));
			candidateArea.appendChild(button('Apply plan to detached candidate', () => applyPlan(review, token, operation)));
			candidateArea.appendChild(button('Decline plan', () => {
				invalidate();
				message('Plan declined. Project, original bytes, and outstanding findings unchanged.');
				updateActions();
				focusReview();
			}));
			message('Plan ready for review. No project changes applied.');
		} catch (error) {
			if (active(token, operation)) message(`Plan failed: ${error.message}`, true);
		} finally {
			if (active(token, operation)) {
				busy = false;
				updateActions();
			}
		}
	}

	async function applyPlan(plan, token, operation) {
		if (busy || !active(token, operation)) return;
		busy = true;
		updateActions();
		candidateArea.replaceChildren();
		message('Applying to detached candidate; verification pending…');
		try {
			const result = await FontFlux.applyRepairsAsync(source, plan, beginWork());
			if (!active(token, operation)) return;
			if (result.state !== 'verified' || !result.verification.passed || !result.buffer) {
				candidateArea.appendChild(renderReport(result.after, 'Failed candidate inspection'));
				for (const failure of result.verification.failures) candidateArea.appendChild(element('p', 'dx-card-msg', failure));
				candidateArea.appendChild(button('Download audit report', () => {
					if (!active(token, operation)) return message('Report is stale. Inspect the current project again.', true);
					const { buffer: _buffer, ...audit } = result;
					download(JSON.stringify({ ...audit, target: result.format, sourceFaceIndex: fontData._collectionIndex ?? 0,
						browserPreview: { state: 'not-run' } }, null, 2), 'font-quality-report.json', 'application/json');
				}));
				message('Repair verification failed. No repaired binary can be committed or downloaded; audit remains available. Project and preview unchanged.', true);
				return;
			}
			await showCandidate(result, token, operation, 'Verified repair candidate');
		} catch (error) {
			if (active(token, operation)) message(`Repair failed: ${error.message}. Project and preview unchanged.`, true);
		} finally {
			if (active(token, operation)) {
				busy = false;
				updateActions();
			}
		}
	}

	async function showCandidate(result, token, operation, title) {
		candidate = result;
		candidateArea.replaceChildren(element('h3', 'dx-section-heading', title));
		candidateArea.appendChild(element('p', 'dx-card-msg',
			'Core verification passed for this narrow operation only. Review unresolved findings and partial coverage below.'));
		for (const change of result.changes) candidateArea.appendChild(element('p', 'dx-card-msg', `${change.id}: ${change.description}`));
		for (const evidence of result.verification.evidence) candidateArea.appendChild(element('p', 'dx-card-msg', evidence));
		if (result.findingChanges) {
			const { resolved, introduced, remaining } = result.findingChanges;
			candidateArea.appendChild(element('p', 'dx-card-msg',
				`Finding differences: ${resolved} resolved; ${introduced} new; ${remaining} remaining errors/warnings. Counts come from core semantic identities; unresolved findings remain listed.`));
		}
		if (result.inputFingerprint) candidateArea.appendChild(element('code', 'dx-fingerprint',
			`Input ${result.inputFingerprint} → output ${result.outputFingerprint}`));
		else if (result.outputFingerprint) candidateArea.appendChild(element('code', 'dx-fingerprint', `Output ${result.outputFingerprint}`));
		candidateArea.appendChild(renderReport(result.after, 'Candidate output — unresolved findings'));
		const controls = element('div', 'dx-actions');
		const current = () => candidate === result && active(token, operation);
		let browserPreview = { state: 'pending', scope: result.after?.format === 'collection' ? 'extracted-selected-face' : 'candidate' };
		controls.appendChild(button('Download exact candidate', () => {
			if (!current()) return message('Candidate is stale. Inspect the current project again.', true);
			const ext = candidateExtension(result.buffer, result.after?.format);
			download(result.buffer, `${(fontData._fileName || 'font').replace(/\.[^.]+$/, '')}-candidate${ext}`);
		}));
		controls.appendChild(button('Download audit report', () => {
			if (!current()) return message('Candidate is stale. Inspect the current project again.', true);
			const { buffer: _buffer, ...audit } = result;
			download(JSON.stringify({ ...audit, browserPreview, target: result.after?.format, faceIndex: result.faceIndex ?? 0,
				sourceFaceIndex: fontData._collectionIndex ?? 0, profile: result.after?.profile }, null, 2),
				'font-quality-report.json', 'application/json');
		}));
		const commit = button('Commit candidate', async () => {
			if (!current()) return message('Candidate is stale. Inspect the current project again.', true);
			commit.disabled = true;
			try {
				await context.commit(result.buffer, token, current, {
					format: result.after?.format, faceIndex: result.faceIndex ?? 0,
				});
				disposePreview();
			} catch (error) {
				if (current()) {
					message(`Commit failed: ${error.message}. Project and preview unchanged.`, true);
					commit.disabled = false;
				}
			}
		});
		commit.disabled = true;
		controls.appendChild(commit);
		controls.appendChild(button('Discard candidate', () => {
			invalidate();
			message('Candidate discarded. Project and preview unchanged.');
			updateActions();
			focusReview();
		}));
		candidateArea.appendChild(controls);
		const preview = element('p', 'dx-candidate-preview', 'Aa Bb 0123 — Candidate preview');
		candidateArea.appendChild(preview);
		message('Core-verified candidate; browser preview check pending…');
		try {
			let previewBytes = result.buffer;
			if (result.after?.format === 'collection') {
				const extracted = FontFlux.open(result.buffer, { faceIndex: result.faceIndex ?? 0 });
				const previewResult = await extracted.preflightAsync({ format: 'sfnt', ...beginWork() });
				if (previewResult.state !== 'verified') throw new Error(previewResult.error);
				previewBytes = previewResult.buffer;
				preview.textContent += ' (preflighted selected-face extraction; not a whole-collection rendering proof)';
			}
			const face = new FontFace(`CandidatePreview${Date.now()}${operation}`, previewBytes);
			await face.load();
			if (!current()) return;
			disposePreview();
			candidatePreview = face;
			document.fonts.add(face);
			browserPreview = { ...browserPreview, state: 'loaded' };
			preview.style.fontFamily = `"${face.family}"`;
			commit.disabled = false;
			message('Candidate verified for selected checks; browser preview loaded. Review before committing. Original input is unchanged.');
		} catch (error) {
			if (current()) {
				browserPreview = { ...browserPreview, state: 'failed', error: error.message };
				preview.textContent = `Candidate preview failed: ${error.message}. Commit is disabled; the current preview is unchanged.`;
				message('Core verification passed, but browser preview failed. Candidate is downloadable for investigation, not committed.', true);
			}
		}
	}

	async function refreshInspections() {
		const operation = version, token = context.capture(), controls = beginWork();
		busy = true;
		updateActions();
		try {
			await renderOriginal(controls, operation);
			if (!active(token, operation)) return;
			const currentBinary = context.repairInput();
			if (currentBinary) {
				const options = inspectionOptions(true);
				const report = await FontFlux.inspectAsync(currentBinary, { ...options, ...controls, cache: inspectionCache });
				if (!active(token, operation)) return;
				currentArea.replaceChildren();
				if (fontData._dirty || report.format === 'collection')
					currentArea.appendChild(renderReport(report, `Current repair input${report.format === 'collection' ? ` — face ${Number(options.faceIndex) + 1}` : ''} (not original inspection scope)`));
				showOffers(report, currentBinary, token, options);
				message('Inspection finished. Review scoped coverage and explicit repair decisions; no changes applied.');
			} else {
				showOffers(null, null, token);
				message(fontData._dirty
					? 'Current project contains edits. Preflight it separately; repairs to old input would discard those edits.'
					: 'Use current-project preflight. Unsupported repairs remain unavailable.');
			}
		} catch (error) {
			if (active(token, operation)) message(`Inspection failed: ${error.message}`, true);
		} finally {
			if (active(token, operation)) { busy = false; updateActions(); }
		}
	}
	refreshInspections();
	updateActions();
	context.onDiagnoseLeave(() => {
		invalidate();
		inspectionCache.clear();
		message('Navigation invalidated pending plans and candidates. Reopen Diagnose to inspect again.');
	});
}
