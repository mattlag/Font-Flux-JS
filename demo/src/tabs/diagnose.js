/**
 * Each inline action plans, verifies and installs one explicitly requested fix.
 * Original bytes remain unchanged; failed or cancelled work is never installed.
 */
import { FontFlux } from 'font-flux-js';
import { qualityReferences, repairInputHelp } from '../quality-help.js';
import { candidateExtension, downloadQualityFile, preflightAudit } from '../quality-report.js';

export const diagnoseTab = { id: 'diagnose', label: 'Diagnose & fix', render };
let inputSequence = 0;

function element(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text != null) node.textContent = String(text).replaceAll('\u2014', '-');
	return node;
}

function button(text, action) {
	const node = element('button', 'dx-action', text);
	node.type = 'button';
	node.addEventListener('click', action);
	return node;
}

function isAuthorityInput(schema) {
	return schema.key === 'authority' && schema.type === 'boolean' && schema.mustBeTrue === true;
}

// Core blocker text identifies prerequisites until structured prerequisite IDs are available.
const repairPrerequisites = new Map([
	['Select explicit DSIG removal with consent before changing this signed font.', 'dsig.remove'],
	['Decomposition requires an explicitly dehinted candidate first.', 'tt.dehint'],
	['Apply an explicitly verified dehinting transaction first.', 'tt.dehint'],
	['A complete post format 3 header is required; explicitly drop glyph names first.', 'post.drop-names'],
	['Repair derived bounds first; removing a glyph must not reposition retained glyphs.', 'tt.bounds'],
	['Repair derived TrueType bounds before converting outlines.', 'tt.bounds'],
	['Explicitly decompose composite glyphs before outline conversion.', 'tt.decompose'],
]);

function issues(report) {
	return report?.diagnostics?.issues ?? report?.issues ?? [];
}

function activeIssues(report) {
	return [...issues(report), ...report?.profileReport?.issues ?? []]
		.filter((issue) => ['error', 'warning'].includes(issue.severity));
}

function compareIssueSeverity(a, b) {
	return Number(a.severity !== 'error') - Number(b.severity !== 'error');
}

function reportCards(report) {
	const occurrences = new Map();
	const findings = activeIssues(report).sort(compareIssueSeverity);
	const cards = findings.map((issue) => {
		const { offset: _offset, byteOffset: _byteOffset, ...location } = issue.location ?? {};
		const identity = JSON.stringify([issue.severity, issue.code, issue.faceIndex, issue.message,
			Object.entries(location).sort(([a], [b]) => a.localeCompare(b))]);
		const occurrence = occurrences.get(identity) ?? 0;
		occurrences.set(identity, occurrence + 1);
		return { key: `issue:${identity}:${occurrence}`, kind: 'issue', issue,
			offers: (report.repairs ?? []).filter((offer) => offer.codes.includes(issue.code)) };
	});
	const codes = new Set(findings.map((issue) => issue.code));
	for (const offer of report?.repairs ?? [])
		if (!offer.codes.some((code) => codes.has(code)))
			cards.push({ key: `suggestion:${offer.id}`, kind: 'suggestion', offers: [offer] });
	return cards;
}

function detailList(rows) {
	const list = element('dl', 'dx-detail-grid');
	for (const [label, value] of rows) {
		if (value == null || value === '' || (Array.isArray(value) && !value.length)) continue;
		list.append(element('dt', '', label),
			element('dd', '', Array.isArray(value) ? value.join('; ') : value));
	}
	return list;
}

function appendReferences(list, issue, offer) {
	const references = qualityReferences(FontFlux.checkCatalog(), issue, offer);
	if (!references.length) return;
	const links = element('dd', 'dx-reference-links');
	for (const { url, label } of references) {
		const link = element('a', '', label);
		link.href = url;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		link.setAttribute('aria-label', `${label} (opens in a new tab)`);
		links.appendChild(link);
	}
	list.append(element('dt', '', 'Learn more'), links);
}

function issueInformation(issue, includeReferences = true) {
	const list = detailList([
		['Check', issue.code], ['Location', issue.location ? JSON.stringify(issue.location) : issue.table],
		['Face', issue.faceIndex == null ? null : issue.faceIndex + 1],
		['Glyph', issue.glyphIndex], ['Offset', issue.offset],
	]);
	list.classList.add('dx-issue-meta');
	if (includeReferences) appendReferences(list, issue);
	return list;
}

function issueTitle(issue) {
	const label = issue.severity === 'error' ? 'Error' : issue.severity === 'warning' ? 'Warning' : 'Information';
	return `${label}: ${issue.message}`;
}

function countIcon(kind) {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', '0 0 16 16');
	svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('fill', 'none');
	svg.setAttribute('stroke', 'currentColor');
	svg.setAttribute('stroke-width', '1.5');
	const path = document.createElementNS(svg.namespaceURI, 'path');
	path.setAttribute('d', {
		error: 'M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM8 4v5m0 2v1',
		warning: 'M8 1.5 15 14H1L8 1.5ZM8 6v4m0 1.5v1',
		suggestion: 'M5.5 11C5.5 9 3.5 9 3.5 6a4.5 4.5 0 0 1 9 0c0 3-2 3-2 5h-5ZM5.5 13h5M6.5 15h3',
	}[kind]);
	svg.appendChild(path);
	return svg;
}

function evidenceTable(caption, nameLabel, rows) {
	const table = element('table', 'dx-evidence-table');
	table.appendChild(element('caption', '', caption));
	const head = element('thead');
	const headings = element('tr');
	for (const label of [nameLabel, 'Status / details']) {
		const cell = element('th', '', label);
		cell.scope = 'col';
		headings.appendChild(cell);
	}
	head.appendChild(headings);
	table.appendChild(head);
	const body = element('tbody');
	for (const { name, status, reason } of rows) {
		const row = element('tr');
		const key = element('th');
		key.scope = 'row';
		key.appendChild(element('code', '', name));
		const value = element('td');
		value.appendChild(element('strong', '', status));
		if (reason) value.appendChild(element('p', '', reason));
		row.append(key, value);
		body.appendChild(row);
	}
	table.appendChild(body);
	return table;
}

function renderReport(report, title, { renderCard, cards = [], detailsTarget } = {}) {
	const section = element('section', 'dx-section dx-report');
	if (title) section.appendChild(element('h3', 'dx-section-heading', title));
	if (!report) {
		section.appendChild(element('p', 'dx-empty', 'No binary inspection is available.'));
		return section;
	}
	const findings = [...issues(report), ...report.profileReport?.issues ?? []].sort(compareIssueSeverity);
	const errors = findings.filter((issue) => issue.severity === 'error').length;
	const warnings = findings.filter((issue) => issue.severity === 'warning').length;
	for (const card of cards.filter((card) => card.kind === 'export')) section.appendChild(renderCard(card));
	section.appendChild(element('div', `dx-banner ${errors ? 'dx-banner-bad' : ''}`,
		report.diagnostics ? `${errors} errors · ${warnings} warnings` : 'No completed original-format diagnosis; review scoped evidence.'));
	const coverage = element('details', 'dx-coverage');
	coverage.appendChild(element('summary', 'dx-info-summary dx-section-summary', 'Technical details: checks and limitations'));
	const properties = [
		{ name: 'profile', status: `${report.profile} v${report.profileVersion}` },
		{ name: 'format', status: report.legacyFormat || report.format },
		{ name: 'scope', status: report.scope },
	];
	if (report.profileReport) properties.push({
		name: 'profile.result',
		status: report.profileReport.complete ? report.profileReport.passed ? 'passed' : 'failed' : 'incomplete / unsupported',
	});
	coverage.appendChild(evidenceTable('Inspection', 'Property', properties));
	if (report.coverage?.length) coverage.appendChild(evidenceTable('Coverage', 'Area',
		report.coverage.map((item) => ({ name: item.domain, status: item.status, reason: item.reason }))));
	if (report.checks?.length) coverage.appendChild(evidenceTable('Checks', 'Check name',
		report.checks.map((check) => ({
			name: check.id, status: `${check.outcome} · ${check.coverage} coverage`, reason: check.reason,
		}))));
	if (report.limitations?.length) {
		coverage.appendChild(element('h4', 'dx-section-heading', 'Limitations'));
		const limitations = element('ul', 'dx-limitations');
		for (const limitation of report.limitations) limitations.appendChild(element('li', '', limitation));
		coverage.appendChild(limitations);
	}
	const findingDetails = element('details', 'dx-findings');
	findingDetails.open = true;
	const fixed = cards.filter((card) => card.kind === 'issue' && card.fixed).length;
	findingDetails.appendChild(element('summary', 'dx-info-summary dx-section-summary',
		`Errors and warnings (${errors + warnings}${fixed ? ` open · ${fixed} fixed` : ''})`));
	const info = element('details');
	info.appendChild(element('summary', 'dx-info-summary', 'Informational findings'));
	for (const issue of findings) {
		if (renderCard && issue.severity !== 'info') continue;
		const card = element('div', `dx-card dx-${issue.severity}`);
		card.dataset.checkCode = issue.code;
		card.appendChild(element('div', 'dx-card-header', issueTitle(issue)));
		const issueDetails = element('details');
		issueDetails.append(element('summary', 'dx-info-summary', 'Details'), issueInformation(issue));
		card.appendChild(issueDetails);
		(issue.severity === 'info' ? info : findingDetails).appendChild(card);
	}
	for (const card of cards.filter((card) => card.kind === 'issue').sort((a, b) => compareIssueSeverity(a.issue, b.issue)))
		findingDetails.appendChild(renderCard(card));
	if (errors + warnings + fixed) section.appendChild(findingDetails);
	if (info.children.length > 1) coverage.appendChild(info);
	if (detailsTarget) detailsTarget.replaceChildren(coverage);
	else section.appendChild(coverage);
	return section;
}

function render(container, fontData, context) {
	const wrap = element('div', 'diagnose-page');
	container.appendChild(wrap);
	let version = 0;
	let source = null;
	let sourceToken = null;
	let busy = false;
	let controller = null;
	let sourceOptions = {};
	let exportAudit = null;
	let activeFeedback = null;
	let cards = [];
	const inspectionCache = FontFlux.createInspectionCache({ maxEntries: 2, maxBytes: 8 * 1024 * 1024 });
	const forms = [];
	const suggestionCards = [];
	const exportButtons = [];
	const status = element('div', 'dx-status');
	status.tabIndex = -1;
	status.setAttribute('role', 'status');
	status.setAttribute('aria-live', 'polite');
	const originalArea = element('div', 'dx-original');
	const currentArea = element('div', 'dx-current');
	const repairArea = element('details', 'dx-repairs');
	repairArea.open = true;
	const repairSummary = element('summary', 'dx-info-summary dx-section-summary');
	const unavailableArea = element('details', 'dx-unavailable');
	unavailableArea.hidden = true;
	const currentDetails = element('div', 'dx-current-details');
	const currentTools = element('div', 'dx-actions');
	const originalTools = element('div', 'dx-actions');
	const navigation = element('div', 'dx-views');
	navigation.setAttribute('role', 'tablist');
	navigation.setAttribute('aria-label', 'Font version to inspect');
	const panels = new Map();
	const tabs = new Map();
	const counts = new Map();
	const viewNames = { current: 'Current font', original: 'Original file' };
	const viewDescriptions = {
		current: 'Your working copy',
		original: 'Unchanged reference',
	};
	let selectedView = 'current';
	const suggestionSummary = element('p', 'dx-card-msg');
	const filter = element('select', 'field-input');
	filter.setAttribute('aria-label', 'Filter suggested fixes');
	for (const [value, label] of [
		['all', 'All suggestions'], ['safe', 'Safe fixes'], ['assisted', 'Needs your input'],
		['potentially-lossy', 'May change appearance or features'],
	]) {
		const option = element('option', '', label);
		option.value = value;
		filter.appendChild(option);
	}
	filter.addEventListener('change', filterOffers);

	if (fontData._loadError) {
		wrap.appendChild(element('div', 'dx-parse-error',
			`Import failed: ${fontData._loadError.message}. Inspection may still identify recoverable problems.`));
	}
	wrap.append(navigation, status);
	for (const id of Object.keys(viewNames)) {
		const tab = button('', () => selectView(id));
		tab.className = 'dx-view-tab';
		tab.id = `dx-tab-${id}`;
		tab.setAttribute('role', 'tab');
		tab.setAttribute('aria-controls', `dx-panel-${id}`);
		const heading = element('strong', 'dx-tab-heading', viewNames[id]);
		if (id === 'current') {
			const badges = element('span', 'dx-tab-counts');
			for (const kind of ['error', 'warning', 'suggestion']) {
				const badge = element('span', `dx-tab-count dx-count-${kind}`);
				badge.dataset.kind = kind;
				badge.append(countIcon(kind), element('span', 'dx-count-value', '?'));
				counts.set(kind, badge);
				badges.appendChild(badge);
			}
			heading.appendChild(badges);
		}
		tab.append(heading, element('span', '', viewDescriptions[id]));
		const panel = element('section', 'dx-view-panel');
		panel.id = `dx-panel-${id}`;
		panel.setAttribute('role', 'tabpanel');
		panel.setAttribute('aria-labelledby', tab.id);
		tabs.set(id, tab);
		panels.set(id, panel);
		navigation.appendChild(tab);
		wrap.appendChild(panel);
	}
	navigation.addEventListener('keydown', (event) => {
		if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
		event.preventDefault();
		const ids = [...tabs.keys()], index = ids.indexOf(selectedView);
		const next = event.key === 'Home' ? 0 : event.key === 'End' ? ids.length - 1
			: (index + (event.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
		selectView(ids[next], true);
	});
	panels.get('current').append(currentTools, currentArea, repairArea, unavailableArea, currentDetails);
	panels.get('original').append(originalArea, originalTools);
	selectView('current');

	const settings = element('section', 'dx-settings');
	const checkRow = element('div', 'dx-check-row');
	const checkOptions = element('fieldset', 'dx-check-options');
	checkOptions.appendChild(element('legend', '', 'Checks'));
	const profiles = FontFlux.qualityProfiles();
	const checkboxes = new Map();
	for (const [id, label] of [['structural', 'Structure'], ['interoperability', 'Compatibility'], ['publishing', 'Publishing']]) {
		const field = element('label', 'dx-decision');
		const checkbox = element('input');
		checkbox.type = 'checkbox';
		checkbox.checked = id === 'structural';
		checkbox.disabled = id === 'structural';
		field.append(checkbox, document.createTextNode(label));
		checkOptions.appendChild(field);
		checkboxes.set(id, checkbox);
	}
	checkRow.appendChild(checkOptions);
	const checkHelp = element('details', 'dx-check-help');
	checkHelp.appendChild(element('summary', 'dx-info-summary', 'About these checks'));
	const sourceDescription = element('p', 'dx-card-msg dx-source-description');
	checkHelp.appendChild(sourceDescription);
	checkHelp.appendChild(element('p', 'dx-card-msg',
		'Structure is always checked. Compatibility adds naming and consumer checks. Publishing includes Compatibility and your filename/family expectations. Apply fix checks the result before changing your working copy. Your original file is always kept.'));
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
	settings.append(checkRow, policy, checkHelp);
	panels.get('current').insertBefore(settings, currentTools);
	for (const [id, checkbox] of checkboxes) checkbox.addEventListener('change', () => {
		if (id === 'publishing' && checkbox.checked) checkboxes.get('interoperability').checked = true;
		if (id === 'interoperability' && !checkbox.checked) checkboxes.get('publishing').checked = false;
		policy.hidden = !checkboxes.get('publishing').checked;
		invalidate();
		refreshInspections();
	});

	function inspectionOptions(face = false) {
		const profile = checkboxes.get('publishing').checked ? 'publishing'
			: checkboxes.get('interoperability').checked ? 'interoperability' : 'structural';
		return {
			profile,
			profileVersion: profiles.find((descriptor) => descriptor.id === profile).version,
			...(profile === 'publishing' ? { context: {
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
					message(`${progress.phase}: ${progress.status ?? 'working'} - no project changes committed.`);
			},
		};
	}

	function message(text, failed = false) {
		status.textContent = text.replaceAll('\u2014', '-');
		status.className = `dx-status${failed ? ' dx-status-error' : ''}`;
		status.dataset.inline = String(!!activeFeedback);
		status.dataset.quiet = String(!!activeFeedback || (!busy && !failed));
		if (activeFeedback) {
			activeFeedback.textContent = text.replaceAll('\u2014', '-');
			activeFeedback.classList.toggle('dx-status-error', failed);
		}
	}

	function updateCounts(report, validation = null) {
		const findings = [...activeIssues(report), ...activeIssues(validation)];
		const summary = report?.diagnostics ? {
			errorCount: findings.filter((issue) => issue.severity === 'error').length,
			warningCount: findings.filter((issue) => issue.severity === 'warning').length,
		} : null;
		for (const [kind, badge] of counts) {
			const count = kind === 'suggestion'
				? report ? cards.filter((card) => card.kind === 'suggestion' && !card.fixed && isActionable(card.offers[0])).length : null
				: summary?.[`${kind}Count`] ?? null;
			badge.querySelector('.dx-count-value').textContent = count ?? '?';
			badge.dataset.empty = String(count === 0);
			badge.title = count == null ? 'Check the current font to see counts'
				: `${count} ${kind === 'suggestion' ? 'actionable suggestions' : `${kind}${count === 1 ? '' : 's'}`}`;
			badge.setAttribute('aria-label', badge.title);
		}
		context.updateQualitySummary?.(summary);
	}

	function selectView(id, focus = false) {
		selectedView = id;
		for (const [key, tab] of tabs) {
			tab.setAttribute('aria-selected', String(key === id));
			tab.tabIndex = key === id ? 0 : -1;
			panels.get(key).hidden = key !== id;
		}
		if (focus) tabs.get(id).focus();
	}

	function filterOffers() {
		let visible = 0, total = 0, fixed = 0;
		for (const { row, card } of suggestionCards) {
			if (row.fixed) { card.hidden = false; fixed++; continue; }
			const offer = row.offers[0];
			total++;
			const show = filter.value === 'all' || offer.risk === filter.value;
			card.hidden = !show;
			if (show) visible++;
		}
		repairSummary.textContent = `Suggestions (${total}${fixed ? ` open · ${fixed} fixed` : ''})`;
		suggestionSummary.textContent = total
			? `${visible} of ${total} actionable suggestions shown. These are optional changes, not necessarily problems.`
			: 'No remaining actionable suggestions for these results.';
	}

	function isActionable(offer) {
		return !!source && ['available', 'needs-input'].includes(offer.availability);
	}

	function download(buffer, name, type) {
		try { downloadQualityFile(buffer, name, type); }
		catch (error) { message(`Download failed: ${error.message}. Project and preview unchanged.`, true); }
	}

	function invalidate() {
		controller?.abort();
		controller = null;
		version++;
		busy = false;
		activeFeedback = null;
	}

	function active(token, operation) {
		return operation === version && context.isCurrent(token);
	}

	function updateActions() {
		if (preflightButton) preflightButton.disabled = busy;
		for (const entry of forms) {
			const disabled = busy || !isActionable(entry.offer);
			entry.apply.disabled = disabled;
			for (const { input } of entry.inputs.values()) input.disabled = disabled;
		}
		for (const action of exportButtons) action.disabled = busy;
		cancelButton.hidden = !busy;
		status.dataset.quiet = String(status.dataset.inline === 'true' || (!busy && !status.classList.contains('dx-status-error')));
		filterOffers();
	}

	let preflightButton = null;
	const cancelButton = button('Cancel pending work', () => {
		const feedback = activeFeedback;
		invalidate();
		if (feedback) feedback.textContent = 'Cancelled. Your current font is unchanged.';
		message('Pending work cancelled. Your current font and original file are unchanged.');
		updateActions();
		if (feedback) {
			feedback.tabIndex = -1;
			feedback.focus();
		} else status.focus();
	});
	cancelButton.classList.add('dx-cancel');
	status.after(cancelButton);
	if (!fontData._diagnoseOnly) {
		preflightButton = button('Check current font', preflightProject);
		preflightButton.title = 'Create and check a test export of your current edits without applying it.';
		checkRow.appendChild(preflightButton);
	}
	if (fontData._originalBuffer) {
		originalTools.appendChild(button('Download original', () => {
			download(fontData._originalBuffer, fontData._fileName || 'original.font');
		}));
	}
	if (context.canUndo()) {
		currentTools.appendChild(button('Undo last change', async () => {
			invalidate();
			try {
				await context.undo();
			} catch (error) {
				message(`Undo failed: ${error.message}. Project and preview unchanged.`, true);
			}
		}));
	}
	if (fontData._dirty && context.canRevert()) {
		currentTools.appendChild(button('Revert to original project', async () => {
			if (!window.confirm('Discard current edits and restore the original project?')) return;
			invalidate();
			try {
				await context.revert();
			} catch (error) {
				message(`Revert failed: ${error.message}. Project and preview unchanged.`, true);
			}
		}));
	}
	checkHelp.appendChild(element('p', 'dx-card-msg',
		'Cancel pending work stops checks or fixes in progress without applying them. After applying a change, Undo last change restores the previous working copy (one step). Separate edits on another collection face can block repair. Browser checks do not prove that every glyph renders identically.'));

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
				'Authored JSON project - no original binary. Use current-project preflight to inspect exact export bytes.'));
			return;
		}
		try {
			const options = { ...inspectionOptions(), ...controls, ...(inspectionFace === '' ? {} : { faceIndex: Number(inspectionFace) }) };
			const report = await FontFlux.inspectAsync(fontData._originalBuffer, { ...options, cache: inspectionCache });
			if (operation !== version) return;
			originalArea.appendChild(renderReport(report));
		} catch (error) {
			if (operation !== version || error.name === 'AbortError') return;
			originalArea.appendChild(element('p', 'dx-parse-error', `Inspection failed: ${error.message}`));
		}
	}

	function showOffers(report, buffer, token, options = {}, title) {
		source = buffer;
		sourceOptions = options;
		sourceToken = token;
		forms.length = 0;
		suggestionCards.length = 0;
		const live = new Map(reportCards(report).map((card) => [card.key, card]));
		cards = [];
		for (const previous of context.qualityReceipt?.cards ?? []) {
			const current = live.get(previous.key);
			if (previous.fixed && (previous.kind !== 'issue' || !current)) cards.push(previous);
			else if (current) cards.push({ ...current, evidence: previous.evidence });
			live.delete(previous.key);
		}
		cards.push(...live.values());
		const filterLabel = element('label', 'dx-decision', 'Show ');
		filterLabel.appendChild(filter);
		repairArea.replaceChildren(repairSummary, filterLabel, suggestionSummary);
		unavailableArea.replaceChildren();
		const unavailable = [];
		if (!report?.repairs?.length) {
			repairArea.appendChild(element('p', 'dx-empty',
				buffer ? 'No fixes are suggested for these results. Some issues may need the original font source.'
					: 'No fixes to review yet. Check your current font first; unavailable checks or exports cannot provide repairable bytes.'));
		}
		for (const row of cards.filter((card) => card.kind === 'suggestion')) {
			const card = renderCard(row);
			if (row.fixed || isActionable(row.offers[0])) {
				suggestionCards.push({ row, card });
				repairArea.appendChild(card);
			} else unavailable.push(card);
		}
		filterLabel.hidden = !suggestionCards.some(({ row }) => !row.fixed);
		unavailableArea.hidden = !unavailable.length;
		if (unavailable.length) unavailableArea.append(
			element('summary', 'dx-info-summary dx-section-summary', `Unavailable for this font (${unavailable.length})`),
			element('p', 'dx-card-msg',
				'For information, not additional problems to fix. These operations cannot run on the current font. Availability is checked again after each applied fix.'),
			...unavailable,
		);
		const rendered = report ? renderReport(report, title, { renderCard, cards, detailsTarget: currentDetails }) : null;
		updateCounts(report);
		updateActions();
		return rendered;
	}

	function unavailableInformation(offer) {
		const information = element('div', 'dx-blocker');
		const reason = source ? offer.reason : 'No verified working-copy export is available for this fix.';
		information.appendChild(element('p', 'dx-card-msg', reason || 'FFJS cannot apply this operation to the current font.'));
		const prerequisiteId = source && repairPrerequisites.get(offer.reason);
		const prerequisite = cards.filter((row) => !row.fixed).flatMap((row) => row.offers ?? [])
			.find((candidate) => candidate.id === prerequisiteId && isActionable(candidate));
		if (prerequisite) {
			information.appendChild(element('p', 'dx-card-msg',
				`First review "${prerequisite.title}". It needs its own approval and may have consequences. Other blockers may remain afterward.`));
			information.appendChild(button('Review prerequisite', () => {
				const entry = forms.find((form) => form.offer.id === prerequisite.id);
				if (!entry) return message('This prerequisite is no longer available. Check current font again.', true);
				filter.value = 'all';
				filterOffers();
				for (let parent = entry.card.parentElement; parent && parent !== wrap; parent = parent.parentElement)
					if (parent.tagName === 'DETAILS') parent.open = true;
				entry.apply.focus({ preventScroll: true });
				entry.card.scrollIntoView({ block: 'center' });
			}));
		} else information.appendChild(element('p', 'dx-card-msg', !source
			? 'Resolve the preflight problems above, then use Check current font.'
			: 'Resolve this requirement in the original source or a font editor that supports it, then load and check the result. This safeguard cannot be bypassed here.'));
		return information;
	}

	function renderCard(row) {
		if (row.kind === 'suggestion') return renderFix(row.offers[0], false, row);
		const card = element('div', `dx-card ${row.fixed ? 'dx-fixed' : `dx-${row.issue?.severity ?? 'info'}`}`);
		card.dataset.cardKey = row.key;
		if (row.issue) card.dataset.checkCode = row.issue.code;
		const header = element('div', 'dx-card-header dx-issue-title', row.issue ? issueTitle(row.issue) : 'Checked export');
		if (row.fixed) header.appendChild(element('span', 'dx-fixed-label', 'Fixed'));
		card.appendChild(header);
		if (row.kind === 'export') {
			card.classList.add('dx-checked-export');
			card.appendChild(resultDetails(currentResult(row), row.evidence.browserPreview, row.evidence.review, 'applied'));
		} else if (row.offers.length) {
			const offers = row.fixed ? [row.offers.find((offer) =>
				row.evidence.review?.plan.steps.some((step) => step.id === offer.id)) ?? row.offers[0]] : row.offers;
			for (const offer of offers) card.appendChild(renderFix(offer, true, row));
		} else {
			const details = element('details', 'dx-offer-details');
			details.append(element('summary', 'dx-info-summary', 'Details'), issueInformation(row.issue));
			if (row.evidence) appendResult(details, row);
			else card.appendChild(element('p', 'dx-card-msg',
				'No automatic fix is available for this issue. It may need changes in the original font source.'));
			card.appendChild(details);
		}
		markLatest(card, row);
		return card;
	}

	function markLatest(card, row) {
		if (context.qualityReceipt?.cardKey === row.key) {
			card.dataset.latestChange = 'true';
			card.tabIndex = -1;
		}
	}

	function currentResult(row) {
		const latest = context.qualityReceipt;
		return latest && latest.result.outputFingerprint === row.evidence.result.outputFingerprint
			? { ...row.evidence.result, buffer: latest.result.buffer } : row.evidence.result;
	}

	function appendResult(details, row) {
		const result = resultDetails(currentResult(row), row.evidence.browserPreview, row.evidence.review, 'applied');
		result.firstElementChild.remove();
		details.append(...result.childNodes);
	}

	function renderFix(offer, inline = false, row) {
		const card = element('div', inline ? 'dx-offer dx-issue-action' : 'dx-card dx-offer');
		card.dataset.repairId = offer.id;
		if (!inline) {
			card.dataset.cardKey = row.key;
			if (row.fixed) card.classList.add('dx-fixed');
			markLatest(card, row);
		}
		const label = element('div', 'dx-fix-subtitle');
		const unavailable = !row.fixed && !isActionable(offer);
		const riskLabels = { safe: 'Safe fix', assisted: 'Needs your input', 'potentially-lossy': 'May change appearance or features' };
		label.append(element('strong', '', inline ? offer.title : `${unavailable ? 'Information' : 'Suggestion'}: ${offer.title}`),
			element('span', unavailable ? 'dx-risk' : `dx-risk dx-risk-${offer.risk}`, unavailable ? 'Unavailable' : riskLabels[offer.risk]));
		if (!inline && row.fixed) label.appendChild(element('span', 'dx-fixed-label', 'Fixed'));
		card.appendChild(label);
		if (unavailable) card.appendChild(unavailableInformation(offer));
		const technical = element('details', 'dx-offer-details');
		technical.appendChild(element('summary', 'dx-info-summary', 'Details and consequences'));
		if (row.issue) technical.appendChild(issueInformation(row.issue, false));
		const fixDetails = detailList([
			['About', offer.description],
			['If applied', offer.ifApplied], ['If unfixed', offer.ifUnfixed],
			['Requires', offer.prerequisites],
			['Risk rationale', offer.riskReason], ['Preservation', offer.invariants],
			['Findings', offer.codes],
			['Policy version', offer.policyVersion], ['Affected tables', offer.affectedTables],
			['Fix type', unavailable ? riskLabels[offer.risk] : null],
			['Formats', unavailable ? offer.formats : null],
		]);
		appendReferences(fixDetails, row.issue, offer);
		technical.appendChild(fixDetails);
		technical.appendChild(element('p', 'dx-card-msg',
			'Required safe companion repairs run with this fix. The result is verified before it replaces your working copy.'));
		card.appendChild(technical);
		if (row.evidence) appendResult(technical, row);
		if (row.fixed || unavailable) return card;
		if (row.evidence) card.appendChild(element('p', 'dx-card-msg', 'Change applied, but this issue still needs attention.'));
		if (offer.reason && !(offer.risk === 'potentially-lossy' && offer.reason === 'Explicit consent is required.'))
			card.appendChild(element('p', 'dx-card-msg', `Availability: ${offer.reason}`));
		const inputs = new Map();
		const resultArea = element('div', 'dx-fix-result');
		const feedback = element('p', 'dx-fix-status');
		feedback.setAttribute('role', 'status');
		feedback.setAttribute('aria-live', 'polite');
		const changed = () => {
			invalidate();
			resultArea.replaceChildren();
			feedback.textContent = '';
			updateActions();
		};
		for (const schema of offer.inputs) {
			if (isAuthorityInput(schema)) continue;
			const field = element('div', 'dx-decision dx-repair-field');
			const labelGroup = element('div', 'dx-input-label');
			const inputLabel = element('label');
			const input = element(['enum', 'boolean'].includes(schema.type) ? 'select' : 'input', 'field-input');
			input.id = `dx-repair-input-${++inputSequence}`;
			inputLabel.htmlFor = input.id;
			inputLabel.appendChild(element('span', '', schema.label));
			labelGroup.appendChild(inputLabel);
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
			input.addEventListener('input', changed);
			field.append(labelGroup, input);
			const helpText = repairInputHelp(offer.id, schema.key);
			if (helpText) {
				const note = element('p', 'dx-input-note', helpText);
				note.id = `${input.id}-help`;
				note.hidden = true;
				const toggleHelp = (open) => {
					note.hidden = !open;
					help.setAttribute('aria-expanded', String(open));
				};
				const help = button('i', () => toggleHelp(note.hidden));
				help.className = 'dx-input-help';
				help.setAttribute('aria-label', `Expected input: ${schema.label}`);
				help.setAttribute('aria-expanded', 'false');
				help.setAttribute('aria-controls', note.id);
				input.setAttribute('aria-describedby', note.id);
				field.addEventListener('keydown', (event) => {
					if (event.key === 'Escape' && !note.hidden) {
						toggleHelp(false);
						help.focus();
						event.stopPropagation();
					}
				});
				labelGroup.appendChild(help);
				field.appendChild(note);
			}
			card.appendChild(field);
			inputs.set(schema.key, { input, schema });
		}
		const lossWarning = offer.risk === 'potentially-lossy' ? element('div', 'dx-loss-warning') : null;
		if (lossWarning) {
			lossWarning.id = `dx-loss-warning-${++inputSequence}`;
			lossWarning.setAttribute('role', 'note');
			lossWarning.append(
				element('strong', '', 'Warning: Potential loss or behavior change'),
				element('p', '', offer.ifApplied));
			card.appendChild(lossWarning);
		}
		if (exportAudit) card.appendChild(element('p', 'dx-card-msg',
			'This also uses the checked export changes listed above.'));
		const apply = button('Apply fix', () => applyFix(entry));
		apply.classList.add('dx-action-primary');
		if (lossWarning) apply.setAttribute('aria-describedby', lossWarning.id);
		const entry = { offer, inputs, card, apply, feedback, resultArea, inline, row };
		card.append(apply, feedback, resultArea);
		forms.push(entry);
		return card;
	}

	async function preflightProject() {
		invalidate();
		const operation = version;
		const token = context.capture();
		busy = true;
		exportAudit = null;
		exportButtons.length = 0;
		currentDetails.replaceChildren();
		updateCounts(null);
		updateActions();
		message('Preflighting current project - export and verification pending…');
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
			currentArea.replaceChildren(element('h3', 'dx-section-heading', 'Checks on your current edits'));
			currentArea.appendChild(element('p', 'dx-card-msg', result.error || `Preflight: ${result.state}`));
			currentArea.appendChild(element('p', 'dx-card-msg',
				'These results check a test export of your current edits. Nothing has been applied. Applying a fix also uses the export changes below.'));
			const exportDetails = element('details');
			exportDetails.appendChild(element('summary', 'dx-info-summary', 'Export steps and changes'));
			for (const effect of result.effects) exportDetails.appendChild(element('p', 'dx-card-msg', effect));
			for (const stage of result.stages)
				exportDetails.appendChild(element('p', 'dx-card-msg', `${stage.id}: ${stage.status} - ${stage.reasonCode}`));
			for (const normalization of result.normalizations)
				exportDetails.appendChild(element('p', 'dx-card-msg', `${normalization.kind}: ${normalization.description}`));
			currentArea.appendChild(exportDetails);
			exportAudit = audit;
			const verified = result.state === 'verified' && result.buffer;
			const report = showOffers(result.output, verified ? result.buffer : null, token, options, 'Test export results');
			updateCounts(result.output, result.validation);
			if (report) currentArea.appendChild(report);
			for (const issue of result.validation?.issues ?? []) {
				currentArea.appendChild(element('p', `dx-card-msg dx-${issue.severity}`,
					`${issue.severity}: ${issue.code} - ${issue.message}`));
			}
			if (result.state !== 'verified' || !result.buffer) {
				currentArea.appendChild(button('Download audit report', () => {
					if (!active(token, operation)) return message('Report is stale. Preflight the current project again.', true);
					download(JSON.stringify(audit, null, 2), 'font-preflight-report.json', 'application/json');
				}));
				message(`Project preflight ${result.state}. No verified bytes available; original input and edits unchanged.`, true);
				return;
			}
			const checked = {
				state: 'verified', buffer: result.buffer, before: null, after: result.output,
				preflight: audit, outputFingerprint: audit.outputFingerprint,
				changes: result.effects.map((description) => ({ id: 'export', description })),
				verification: { passed: true, evidence: ['Exact project export passed core preflight.'], failures: [] },
			};
			const exportCard = element('div', 'dx-card dx-checked-export');
			const feedback = element('p', 'dx-fix-status');
			feedback.setAttribute('role', 'status');
			const evidence = element('div', 'dx-fix-result');
			const useExport = button('Use checked export', () => applyCheckedExport(checked, token, feedback, evidence));
			exportButtons.push(useExport);
			exportCard.append(element('strong', '', 'Checked export - not applied'),
				element('p', 'dx-card-msg', 'Use this export without additional fixes, or apply an individual fix below.'),
				useExport, feedback, evidence, resultDetails(checked, { state: 'not-run' }, null, 'checked'));
			currentArea.insertBefore(exportCard, report);
			message('Current edits checked. No changes applied.');
		} catch (error) {
			if (active(token, operation)) {
				updateCounts(null);
				message(`Preflight failed: ${error.message}. Project unchanged.`, true);
			}
		} finally {
			if (active(token, operation)) {
				busy = false;
				updateActions();
			}
		}
	}

	async function applyFix(entry) {
		if (busy) return;
		invalidate();
		const operation = version;
		const token = context.capture();
		activeFeedback = entry.feedback;
		entry.resultArea.replaceChildren();
		if (!source || !context.isCurrent(sourceToken)) {
			message('Project changed. Check the current font before applying this fix.', true);
			return;
		}
		const inputBytes = source, options = sourceOptions;
		let result = null, review = null;
		const browserPreview = { state: 'not-run' };
		try {
			const { offer, inputs } = entry;
			const values = {};
			if (offer.inputs.some(isAuthorityInput)) values.authority = true;
			for (const [key, { input, schema }] of inputs) {
				if (!input.value.trim()) {
					input.reportValidity();
					input.focus();
					throw new Error(`Provide ${schema.label}; no default is assumed.`);
				}
				values[key] = ['integer', 'number'].includes(schema.type) ? Number(input.value)
					: schema.type === 'boolean' ? input.value === 'true' : input.value;
			}
			busy = true;
			updateActions();
			message('Preparing this fix…');
			const controls = beginWork();
			// Apply fix authorizes only this selected change after its loss warning.
			review = await FontFlux.planRepairsAsync(inputBytes, [{ id: offer.id, inputs: values, consent: offer.risk === 'potentially-lossy' }], {
				...options, projectRevision: token.revision, ...controls,
			});
			if (!active(token, operation)) return;
			const companion = review.plan.steps.find((step) => step.id !== offer.id && step.risk !== 'safe');
			if (companion) throw new Error(`Apply ${companion.title} separately first; its decisions cannot be assumed.`);
			message('Checking the repaired font before applying…');
			result = await FontFlux.applyRepairsAsync(inputBytes, review, controls);
			if (!active(token, operation)) return;
			if (exportAudit) result = { ...result, preflight: exportAudit };
			await installChecked(result, review, offer.title, offer.id, browserPreview, token, operation, controls, entry.row.key);
		} catch (error) {
			if (active(token, operation)) message(`Fix not applied: ${error.message}. Your current font is unchanged.`, true);
		} finally {
			if (active(token, operation)) {
				if (result) entry.resultArea.appendChild(resultDetails(result, browserPreview, review, 'not-applied'));
				busy = false;
				activeFeedback = null;
				updateActions();
			}
		}
	}

	async function applyCheckedExport(result, token, feedback, evidence) {
		if (busy) return;
		invalidate();
		const operation = version;
		activeFeedback = feedback;
		if (!context.isCurrent(token)) {
			message('This export is stale. Check your current font again.', true);
			return;
		}
		busy = true;
		updateActions();
		evidence.replaceChildren();
		const browserPreview = { state: 'not-run' };
		try {
			await installChecked(result, null, 'Checked export', null, browserPreview, token, operation, beginWork());
		} catch (error) {
			if (active(token, operation)) message(`Export not applied: ${error.message}. Your current font is unchanged.`, true);
		} finally {
			if (active(token, operation)) {
				evidence.appendChild(resultDetails(result, browserPreview, null, 'not-applied'));
				busy = false;
				activeFeedback = null;
				updateActions();
			}
		}
	}

	async function installChecked(result, review, title, repairId, browserPreview, token, operation, controls, cardKey = 'export') {
		if (result.state !== 'verified' || !result.verification?.passed || !result.buffer)
			throw new Error(`Repair verification failed. ${result.verification?.failures?.join(' ') || result.error || result.state}`);
		browserPreview.scope = result.after?.format === 'collection' ? 'extracted-selected-face' : 'candidate';
		browserPreview.state = 'pending';
		message('Checking browser compatibility…');
		try {
			let previewBytes = result.buffer;
			if (result.after?.format === 'collection') {
				const extracted = FontFlux.open(result.buffer, { faceIndex: result.faceIndex ?? 0 });
				const previewResult = await extracted.preflightAsync({ format: 'sfnt', ...controls });
				if (previewResult.state !== 'verified') throw new Error(previewResult.error);
				previewBytes = previewResult.buffer;
			}
			await new FontFace(`CandidatePreview${Date.now()}${operation}`, previewBytes).load();
			if (!active(token, operation)) return;
			browserPreview.state = 'loaded';
		} catch (error) {
			browserPreview.state = 'failed';
			browserPreview.error = error.message;
			throw new Error(`Browser check failed: ${error.message}`);
		}
		if (!active(token, operation)) return;
		message('Applying verified change…');
		const { buffer: _buffer, ...audit } = result;
		const evidence = { title, repairId, result: audit, review, browserPreview };
		const remaining = new Set(reportCards(result.after).filter((card) => card.kind === 'issue').map((card) => card.key));
		const retained = cards.map((card) => {
			if (card.fixed) return card;
			const fixed = card.kind === 'issue' ? !remaining.has(card.key) : card.key === cardKey;
			return fixed || card.key === cardKey ? { ...card, fixed, evidence } : card;
		});
		if (!repairId) {
			const exportIndex = retained.findIndex((card) => card.kind === 'export');
			const exportCard = { key: cardKey, kind: 'export', fixed: true, evidence };
			if (exportIndex < 0) retained.unshift(exportCard);
			else retained[exportIndex] = exportCard;
		}
		await context.commit(result.buffer, token, () => active(token, operation), {
			format: result.after?.format, faceIndex: result.faceIndex ?? 0,
			receipt: { title, repairId, result, review, browserPreview, cardKey, cards: retained },
		});
	}

	function resultDetails(result, browserPreview, review, application) {
		const evidenceDetails = element('details');
		evidenceDetails.appendChild(element('summary', 'dx-info-summary', 'Result details and downloads'));
		evidenceDetails.appendChild(detailList([
			['Changes', (result.changes ?? []).map((change) => `${change.id}: ${change.description}`)],
			['Verification', [...result.verification?.evidence ?? [], ...result.verification?.failures ?? []]],
		]));
		if (result.findingChanges) {
			const { resolved, introduced, remaining } = result.findingChanges;
			evidenceDetails.appendChild(element('p', 'dx-card-msg',
				`${resolved} issues resolved; ${introduced} new; ${remaining} remaining.`));
		}
		if (result.inputFingerprint) evidenceDetails.appendChild(element('code', 'dx-fingerprint',
			`Input ${result.inputFingerprint} → output ${result.outputFingerprint}`));
		else if (result.outputFingerprint) evidenceDetails.appendChild(element('code', 'dx-fingerprint', `Output ${result.outputFingerprint}`));
		const controls = element('div', 'dx-actions');
		if (result.state === 'verified' && result.verification?.passed && result.buffer)
			controls.appendChild(button(application === 'applied' ? 'Download applied font' : 'Download checked font', () => {
			const ext = candidateExtension(result.buffer, result.after?.format);
			download(result.buffer, `${(fontData._fileName || 'font').replace(/\.[^.]+$/, '')}-${application === 'applied' ? 'fixed' : 'checked'}${ext}`);
		}));
		controls.appendChild(button('Download audit report', () => {
			const { buffer: _buffer, ...audit } = result;
			download(JSON.stringify({ ...audit, application, browserPreview, target: result.after?.format, faceIndex: result.faceIndex ?? 0,
				sourceFaceIndex: fontData._collectionIndex ?? 0, profile: result.after?.profile }, null, 2),
				'font-quality-report.json', 'application/json');
		}));
		if (review) controls.appendChild(button('Download reviewed plan', () =>
			download(JSON.stringify(review, null, 2), 'font-repair-plan.json', 'application/json')));
		evidenceDetails.appendChild(controls);
		return evidenceDetails;
	}

	function focusAppliedCard() {
		const receipt = context.qualityReceipt;
		const target = wrap.querySelector('[data-latest-change="true"]');
		if (receipt && target && !receipt.focused) {
			target.focus({ preventScroll: true });
			target.scrollIntoView({ block: 'nearest' });
			receipt.focused = true;
		}
	}

	async function refreshInspections() {
		const operation = version, token = context.capture(), controls = beginWork();
		busy = true;
		updateCounts(null);
		source = null;
		sourceToken = null;
		exportAudit = null;
		forms.length = 0;
		exportButtons.length = 0;
		repairArea.replaceChildren();
		unavailableArea.replaceChildren();
		unavailableArea.hidden = true;
		currentDetails.replaceChildren();
		currentArea.replaceChildren(element('p', 'dx-card-msg', 'Checking your current font…'));
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
				sourceDescription.textContent = fontData._diagnoseOnly
					? 'This file could not be opened as an editable font. The checks and recovery suggestions use its loaded bytes; there is no editable working copy yet.'
					: fontData._dirty
						? 'Checking the latest font bytes applied to your working copy, not the original file.'
						: 'No edits have been applied yet. These checks use the loaded font bytes, which still match the original file.';
				currentArea.appendChild(showOffers(report, currentBinary, token, options));
				focusAppliedCard();
				message(context.qualityReceipt ? `Applied: ${context.qualityReceipt.title}. Current font checked.`
					: 'Checked current font. Apply individual fixes below.');
			} else {
				updateCounts(null);
				sourceDescription.textContent = 'Your working copy has no matching checked font bytes. Check the current font before applying fixes.';
				currentArea.replaceChildren(
					element('h3', 'dx-section-heading', 'Your current edits need a check'),
					element('p', 'dx-card-msg', 'Choose "Check current font" to create a test export and find fixes for your working copy. Original-file findings are separate and do not describe these edits.'),
				);
				showOffers(null, null, token);
				message(fontData._dirty
					? 'Current project contains edits. Preflight it separately; repairs to old input would discard those edits.'
					: 'Use current-project preflight. Unsupported repairs remain unavailable.');
			}
		} catch (error) {
			if (active(token, operation)) {
				updateCounts(null);
				message(`Inspection failed: ${error.message}`, true);
			}
		} finally {
			if (active(token, operation)) { busy = false; updateActions(); }
		}
	}
	refreshInspections();
	updateActions();
	context.onDiagnoseLeave(() => {
		invalidate();
		inspectionCache.clear();
		message('Navigation cancelled pending work. Reopen Diagnose to inspect again.');
	});
}
