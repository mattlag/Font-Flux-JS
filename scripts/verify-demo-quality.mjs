import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { expect } from '@playwright/test';
import { FontFlux } from '../src/font_flux.js';
import { exportFont } from '../src/export.js';
import { importFontTables } from '../src/import.js';
import { createHash } from 'node:crypto';

const coreURL = '/@fs/' + resolve('src', 'main.js').replaceAll('\\', '/');

function entry(buffer, tag, base = 0) {
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < view.getUint16(base + 4); i++) {
		const record = base + 12 + i * 16;
		if (String.fromCharCode(...bytes.slice(record, record + 4)) === tag)
			return { record, offset: view.getUint32(record + 8) };
	}
	throw new Error(`Missing fixture table ${tag}`);
}

async function load(page, url, bytes, name = 'quality.ttf') {
	await page.goto(url);
	await page.locator('input[type="file"]').setInputFiles({
		name, mimeType: 'application/octet-stream',
		buffer: typeof bytes === 'string' ? Buffer.from(bytes) : Buffer.from(bytes),
	});
	await page.locator('.font-name').waitFor();
}

async function diagnose(page) {
	await page.getByRole('button', { name: /^Diagnose/ }).click();
	await page.locator('.diagnose-page').waitFor();
}

async function downloaded(page, action, filename) {
	const pending = page.waitForEvent('download');
	await action();
	const download = await pending;
	if (filename) assert.match(download.suggestedFilename(), filename);
	const chunks = [];
	for await (const chunk of await download.createReadStream()) chunks.push(chunk);
	return Buffer.concat(chunks);
}

async function json(page) {
	return downloaded(page, () => page.getByRole('button', { name: 'Download JSON', exact: true }).click());
}

async function previewWidth(page) {
	return page.evaluate(async () => {
		await document.fonts.load('48px DemoLoadedFont', 'A');
		const context = document.createElement('canvas').getContext('2d');
		context.font = '48px DemoLoadedFont';
		return context.measureText('A').width;
	});
}

function fix(page, id) {
	return page.locator(`[data-repair-id="${id}"]`).first();
}

function latestChange(page) {
	return page.locator('[data-latest-change="true"]');
}

async function clickFix(page, id) {
	await fix(page, id).getByRole('button', { name: 'Apply fix', exact: true }).click();
}

async function applyFix(page, id) {
	const oldCard = await fix(page, id).elementHandle();
	await clickFix(page, id);
	await page.waitForFunction((node) => !node.isConnected, oldCard);
	await expect(latestChange(page)).toContainText('Fixed');
	await expect(page.locator('.dx-status')).toContainText('Current font checked');
}

async function openResult(root) {
	const details = root.locator('details').last();
	if (!await details.evaluate((node) => node.open)) await details.locator(':scope > summary').click();
}

async function appliedBytes(page) {
	await openResult(latestChange(page));
	return downloaded(page, () => page.getByRole('button', { name: 'Download applied font', exact: true }).click());
}

async function editFamily(page, value) {
	await page.getByRole('button', { name: 'Overview', exact: true }).click();
	const field = page.locator('.meta-item').filter({
		has: page.locator('.label', { hasText: /^Family Name$/ }),
	}).locator('.value');
	await field.click();
	await field.locator('input').fill(value);
	await field.locator('input').press('Enter');
}

export async function verifyDiagnoseViews(page, url, makeFont) {
	await page.setViewportSize({ width: 1280, height: 900 });
	const bytes = makeFont().export({ format: 'sfnt' });
	new DataView(bytes).setUint32(entry(bytes, 'head').offset + 8, 0);
	await load(page, url, bytes);
	await diagnose(page);
	const current = page.getByRole('tab', { name: /Current font/ });
	const original = page.getByRole('tab', { name: /Original file/ });
	assert.deepEqual(await page.locator('.dx-view-tab').evaluateAll((tabs) => tabs.map((tab) => tab.id)),
		['dx-tab-current', 'dx-tab-original']);
	await expect(page.getByRole('tab', { name: /Proposed changes/ })).toHaveCount(0);
	await expect(page.locator('.diagnose-page h2, .dx-view-context')).toHaveCount(0);
	await expect(current).toHaveAttribute('aria-selected', 'true');
	await expect(page.locator('.dx-current')).toContainText('BAD_CHECKSUM_ADJUSTMENT');
	await expect(page.locator('.dx-original')).toBeHidden();
	await expect(page.getByLabel('Filter suggested fixes')).toHaveValue('all');
	await expect(page.getByRole('checkbox', { name: 'Structure', exact: true })).toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Structure', exact: true })).toBeDisabled();
	await expect(page.getByRole('checkbox', { name: 'Compatibility', exact: true })).not.toBeChecked();
	await expect(page.getByRole('checkbox', { name: 'Publishing', exact: true })).not.toBeChecked();
	const checkButtonBox = await page.getByRole('button', { name: 'Check current font' }).boundingBox();
	const publishingBox = await page.getByRole('checkbox', { name: 'Publishing', exact: true }).boundingBox();
	assert(checkButtonBox.y < publishingBox.y + publishingBox.height &&
		checkButtonBox.y + checkButtonBox.height > publishingBox.y);
	await expect(page.locator('.dx-status')).toHaveAttribute('data-quiet', 'true');
	const report = FontFlux.inspect(bytes);
	const findings = [...report.diagnostics.issues, ...report.profileReport.issues]
		.filter((issue) => ['error', 'warning'].includes(issue.severity));
	for (const severity of ['error', 'warning'])
		await expect(current.locator(`[data-kind="${severity}"] .dx-count-value`))
			.toHaveText(String(findings.filter((issue) => issue.severity === severity).length));
	const otherSuggestions = report.repairs.filter((offer) => ['available', 'needs-input'].includes(offer.availability) &&
		!findings.some((issue) => offer.codes.includes(issue.code))).length;
	await expect(current.locator('[data-kind="suggestion"] .dx-count-value')).toHaveText(String(otherSuggestions));
	await expect(page.locator('.dx-current .dx-findings > summary')).toHaveText(`Errors and warnings (${findings.length})`);
	await expect(page.locator('.dx-current .dx-findings')).toHaveJSProperty('open', true);
	await expect(page.locator('.dx-repairs > summary')).toHaveText(`Suggestions (${otherSuggestions})`);
	await expect(page.locator('.dx-repairs')).toHaveJSProperty('open', true);
	await expect(original.locator('.dx-tab-count')).toHaveCount(0);
	await original.click();
	await expect(page.locator('.dx-original')).toBeVisible();
	await expect(page.locator('.dx-original .dx-findings')).toHaveJSProperty('open', true);
	await expect(page.locator('.dx-original .dx-findings > summary')).toHaveText(`Errors and warnings (${findings.length})`);
	await expect(page.locator('.dx-original .dx-findings .dx-card').first()).toBeVisible();
	const headingStyles = await page.locator('.dx-section-summary').evaluateAll((nodes) => nodes.map((node) => {
		const style = getComputedStyle(node);
		return { color: style.color, size: parseFloat(style.fontSize), weight: Number(style.fontWeight) };
	}));
	const textColor = await page.locator('body').evaluate((node) => getComputedStyle(node).color);
	assert(headingStyles.every((style) => style.color === textColor && style.size >= 15 && style.weight >= 600));
	await expect(page.locator('.dx-repairs')).toBeHidden();
	await expect(page.locator('.dx-original h3')).toHaveCount(0);
	await expect(page.locator('.dx-original')).not.toContainText('These are the checks FFJS');
	await page.locator('.dx-original .dx-coverage > summary').click();
	const checks = page.locator('.dx-original').getByRole('table', { name: 'Checks', exact: true });
	await expect(checks.locator('tbody tr')).toHaveCount(report.checks.length);
	const firstCheck = checks.locator('tbody tr').first();
	await expect(firstCheck.locator('th code')).toHaveText(report.checks[0].id);
	await expect(firstCheck.locator('td')).toContainText(report.checks[0].outcome);
	await expect(firstCheck.locator('td')).toContainText(report.checks[0].coverage);
	assert.match(await firstCheck.locator('code').evaluate((node) => getComputedStyle(node).fontFamily), /monospace/i);
	assert.equal((await page.locator('.dx-original').innerText()).includes('\u2014'), false);
	const downloadOriginal = page.getByRole('button', { name: 'Download original', exact: true });
	const contentBox = await page.locator('.dx-original').boundingBox();
	const buttonBox = await downloadOriginal.boundingBox();
	assert(buttonBox.y >= contentBox.y + contentBox.height);
	assert.deepEqual(await downloaded(page, () => downloadOriginal.click()), Buffer.from(bytes));
	await page.setViewportSize({ width: 390, height: 900 });
	assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
	await page.setViewportSize({ width: 1280, height: 900 });
	await original.press('Home');
	await expect(current).toBeFocused();
	const relatedFix = report.repairs.find((offer) => offer.risk === 'safe' && offer.availability === 'available' &&
		report.diagnostics.issues.some((issue) => ['error', 'warning'].includes(issue.severity) && offer.codes.includes(issue.code)));
	assert(relatedFix);
	const inlineAction = page.locator(`.dx-current [data-repair-id="${relatedFix.id}"]`).first();
	await expect(inlineAction.getByRole('button', { name: 'Apply fix' })).toBeVisible();
	const unrelatedInput = fix(page, 'metadata.style').getByLabel('Intended weight', { exact: true });
	await unrelatedInput.fill('500');
	await page.locator('.dx-repairs > summary').click();
	await expect(unrelatedInput).toBeHidden();
	await page.locator('.dx-repairs > summary').press('Enter');
	await expect(unrelatedInput).toBeVisible();
	await expect(unrelatedInput).toHaveValue('500');
	await page.getByLabel('Filter suggested fixes').selectOption('safe');
	await expect(unrelatedInput).toBeHidden();
	await page.getByLabel('Filter suggested fixes').selectOption('all');
	await expect(unrelatedInput).toHaveValue('500');
	const before = await json(page);
	await inlineAction.locator('.dx-offer-details > summary').click();
	assert.deepEqual(await json(page), before);
	const repairsBox = await page.locator('.dx-repairs').boundingBox();
	const detailsBox = await page.locator('.dx-current-details').boundingBox();
	assert(detailsBox.y >= repairsBox.y + repairsBox.height);
	await applyFix(page, relatedFix.id);
	await expect(current).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('button', { name: 'Undo last change' })).toBeVisible();
	await openResult(latestChange(page));
	const inlinePlan = JSON.parse(await downloaded(page, () =>
		page.getByRole('button', { name: 'Download reviewed plan' }).click()));
	const expectedInlinePlan = await FontFlux.planRepairs(bytes, [{ id: relatedFix.id }]);
	assert.deepEqual(inlinePlan.plan.steps.map((step) => step.id), expectedInlinePlan.steps.map((step) => step.id));
	await expect(page.locator('.dx-current')).not.toContainText('Current font results');
	await expect(page.locator('.dx-current [data-check-code="BAD_CHECKSUM_ADJUSTMENT"]')).toHaveClass(/dx-fixed/);
	await expect(page.locator('.dx-receipt')).toHaveCount(0);
	await original.click();
	await expect(page.locator('.dx-original')).toContainText('BAD_CHECKSUM_ADJUSTMENT');
	await current.click();
	await page.setViewportSize({ width: 390, height: 900 });
	assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
	await editFamily(page, 'Edited working copy');
	await diagnose(page);
	await expect(page.locator('.dx-current')).toContainText('Your current edits need a check');
	await expect(page.getByRole('button', { name: 'Apply fix' })).toHaveCount(0);
	await page.getByRole('button', { name: 'Check current font' }).click();
	await expect(page.getByRole('button', { name: 'Use checked export' })).toBeEnabled();
	await page.getByRole('checkbox', { name: 'Compatibility', exact: true }).check();
	await expect(page.locator('.dx-original .dx-coverage')).toContainText('interoperability v1');
	await expect(page.getByRole('button', { name: 'Use checked export' })).toHaveCount(0);
	await page.getByRole('checkbox', { name: 'Compatibility', exact: true }).uncheck();
	await page.getByRole('checkbox', { name: 'Publishing', exact: true }).check();
	await expect(page.getByRole('checkbox', { name: 'Compatibility', exact: true })).toBeChecked();
	await expect(page.getByLabel('Expected filename', { exact: true })).toBeVisible();
	await expect(page.locator('.dx-original .dx-coverage')).toContainText('publishing v1');
	await page.getByRole('checkbox', { name: 'Compatibility', exact: true }).uncheck();
	await expect(page.getByRole('checkbox', { name: 'Publishing', exact: true })).not.toBeChecked();
	await expect(page.getByLabel('Expected filename', { exact: true })).toBeHidden();
	await expect(page.locator('.dx-original .dx-coverage')).toContainText('structural v1');
	await page.setViewportSize({ width: 1280, height: 900 });
	console.log('Inline fix, isolated inputs, two views, original preservation, mobile layout and profile invalidation passed.');
}

export async function verifyFixedCards(page, url, makeFont) {
	const bytes = makeFont().export({ format: 'sfnt' });
	new DataView(bytes).setUint32(entry(bytes, 'head').offset + 12, 0);
	await load(page, url, bytes);
	await diagnose(page);
	const current = page.getByRole('tab', { name: /Current font/ });
	const issueCards = page.locator('.dx-current .dx-findings > .dx-card');
	const head = page.locator('.dx-current [data-check-code="BAD_MAGIC_NUMBER"]');
	await expect(head).toBeVisible();
	const order = await issueCards.evaluateAll((cards) => cards.map((card) => card.dataset.cardKey));
	await expect(head.locator('.dx-issue-title')).toContainText('Error: head.magicNumber');
	await expect(head.locator('summary')).toHaveCount(1);
	await expect(head.locator('summary')).toHaveText('Details and consequences');
	const titleBox = await head.locator('.dx-issue-title').boundingBox();
	const subtitleBox = await head.locator('.dx-fix-subtitle').boundingBox();
	assert(subtitleBox.y >= titleBox.y + titleBox.height && subtitleBox.y <= titleBox.y + titleBox.height + 12);
	const countBox = await current.locator('.dx-tab-counts').boundingBox();
	assert(countBox.height <= 22 && countBox.width <= 140);
	await head.locator('summary').click();
	await expect(head.locator('.dx-detail-grid')).toHaveCount(2);
	await head.locator('summary').click();
	await applyFix(page, 'head.magic');
	assert.deepEqual(await issueCards.evaluateAll((cards) => cards.map((card) => card.dataset.cardKey)), order);
	await expect(head).toHaveClass(/dx-fixed/);
	await expect(head.getByRole('button', { name: 'Apply fix' })).toHaveCount(0);
	await expect(head.locator('.dx-fixed-label')).toHaveText('Fixed');
	await expect(head.locator('summary')).toHaveCount(1);
	await expect(page.locator('.dx-source-description')).toHaveText('Checking the latest font bytes applied to your working copy, not the original file.');
	await expect(page.locator('.dx-source-description')).toBeHidden();
	await page.locator('.dx-check-help > summary').click();
	await expect(page.locator('.dx-source-description')).toBeVisible();
	await page.locator('.dx-check-help > summary').click();
	const color = await head.evaluate((node) => getComputedStyle(node).borderLeftColor);
	const [red, green, blue] = color.match(/\d+/g).map(Number);
	assert(green > red && green > blue);
	const fixedBefore = await page.locator('.dx-current .dx-fixed').count();
	assert(fixedBefore >= 3);
	const beforeSuggestions = Number(await current.locator('[data-kind="suggestion"] .dx-count-value').innerText());
	const style = fix(page, 'metadata.style');
	const suggestionOrder = await page.locator('.dx-repairs > .dx-card').evaluateAll((cards) => cards.map((card) => card.dataset.cardKey));
	await expect(page.getByLabel('I have authority to choose these metadata values')).toHaveCount(0);
	await expect(page.locator('.dx-unavailable [data-repair-id="outlines.to-cff"]')).toHaveCount(1);
	await expect(page.getByLabel('Authorize outline/program representation loss')).toHaveCount(0);
	await expect(style.getByLabel('Bold style-linking bit', { exact: true })).toHaveValue('');
	await clickFix(page, 'metadata.style');
	await expect(style.locator('.dx-fix-status')).toContainText('Provide Intended weight');
	await expect(style).not.toHaveClass(/dx-fixed/);
	await style.locator('.dx-offer-details > summary').click();
	for (const width of [1280, 390]) {
		await page.setViewportSize({ width, height: 900 });
		for (const id of ['metadata.style', 'name.record', 'metrics.line']) {
			const rows = await fix(page, id).locator('.dx-repair-field').evaluateAll((labels) => labels.map((label) => {
				const input = label.querySelector('.field-input');
				const field = input.getBoundingClientRect();
				const caption = label.querySelector('span').getBoundingClientRect();
				return {
					left: field.x, right: field.right, width: field.width,
					labelRight: caption.right, labelBottom: caption.bottom, top: field.y, bottom: field.bottom,
					numeric: input.type === 'number', font: getComputedStyle(input).fontFamily,
				};
			}));
			assert(rows.length > 1);
			for (const [index, row] of rows.entries()) {
				assert(Math.abs(row.left - rows[0].left) < 1 && Math.abs(row.right - rows[0].right) < 1);
				assert(row.left - row.labelRight >= 8 && row.width >= 140);
				if (index) assert(row.top >= Math.max(rows[index - 1].bottom, rows[index - 1].labelBottom));
				if (row.numeric) assert.match(row.font, /monospace/i);
			}
		}
		const detailRows = await style.locator('.dx-detail-grid dt').evaluateAll((labels) => labels.map((label) => {
			const caption = label.getBoundingClientRect();
			const content = label.nextElementSibling.getBoundingClientRect();
			return {
				labelWidth: caption.width, contentWidth: content.width, gap: content.x - caption.right,
				top: caption.y, bottom: Math.max(caption.bottom, content.bottom),
			};
		}));
		for (const [index, row] of detailRows.entries()) {
			// Firefox DOM rectangles can differ by a subpixel rounding error.
			assert(row.labelWidth <= 110 && row.contentWidth > row.labelWidth && row.gap >= 12 - 0.001);
			if (index) assert(row.top - detailRows[index - 1].bottom >= 8 - 0.001);
		}
		assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
	}
	await page.setViewportSize({ width: 1280, height: 900 });
	await style.getByLabel('Intended weight', { exact: true }).fill('500');
	await style.getByLabel('Intended width class', { exact: true }).fill('5');
	for (const [label, value] of [
		['Bold style-linking bit', 'false'], ['Italic style-linking bit', 'false'],
		['Regular style-linking bit', 'true'],
	]) await style.getByLabel(label, { exact: true }).selectOption(value);
	await applyFix(page, 'metadata.style');
	await expect(style).toHaveClass(/dx-fixed/);
	assert.deepEqual(await page.locator('.dx-repairs > .dx-card').evaluateAll((cards) => cards.map((card) => card.dataset.cardKey)), suggestionOrder);
	await expect(page.locator('.dx-current .dx-fixed')).toHaveCount(fixedBefore);
	await expect(current.locator('[data-kind="suggestion"] .dx-count-value')).toHaveText(String(beforeSuggestions - 1));
	await expect(page.locator('.dx-repairs > summary')).toHaveText(`Suggestions (${beforeSuggestions - 1} open · 1 fixed)`);
	await openResult(latestChange(page));
	const reviewed = JSON.parse(await downloaded(page, () =>
		latestChange(page).getByRole('button', { name: 'Download reviewed plan' }).click()));
	assert.deepEqual(reviewed.plan.steps.find((step) => step.id === 'metadata.style').values,
		{ authority: true, weight: 500, width: 5, bold: false, italic: false, regular: true });
	const audit = JSON.parse(await downloaded(page, () => latestChange(page).getByRole('button', { name: 'Download audit report' }).click()));
	assert.equal(audit.application, 'applied');
	assert.equal(audit.browserPreview.state, 'loaded');
	assert.equal(audit.outputFingerprint, createHash('sha256').update(await appliedBytes(page)).digest('hex'));
	await page.setViewportSize({ width: 390, height: 900 });
	assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
	await page.getByRole('button', { name: 'Undo last change' }).click();
	await expect(style).not.toHaveClass(/dx-fixed/);
	await expect(style.getByRole('button', { name: 'Apply fix' })).toBeEnabled();
	await expect(page.locator('.dx-current .dx-fixed')).toHaveCount(fixedBefore);
	await expect(current.locator('[data-kind="suggestion"] .dx-count-value')).toHaveText(String(beforeSuggestions));
	await expect(page.locator('.dx-repairs > summary')).toHaveText(`Suggestions (${beforeSuggestions})`);
	await page.getByRole('tab', { name: /Original file/ }).click();
	assert.deepEqual(await downloaded(page, () => page.getByRole('button', { name: 'Download original' }).click()), Buffer.from(bytes));
	await page.setViewportSize({ width: 1280, height: 900 });
	console.log('Compact counts, merged details, fixed-card order/history, exact receipts, undo and mobile layout passed.');
}

export async function verifySuggestionPriority(page, url, makeFont) {
	const base = makeFont().export({ format: 'sfnt' });
	const opaque = importFontTables(base);
	opaque.tables.ZZZZ = { _raw: [1, 2, 3, 4] };
	const bytes = exportFont(opaque);
	new DataView(bytes).setUint32(entry(bytes, 'head').offset + 12, 0);
	await load(page, url, bytes);
	await diagnose(page);
	const report = FontFlux.inspect(bytes);
	const findings = [...report.diagnostics.issues, ...report.profileReport.issues]
		.filter((issue) => ['error', 'warning'].includes(issue.severity));
	const other = report.repairs.filter((offer) => !findings.some((issue) => offer.codes.includes(issue.code)));
	const actionable = other.filter((offer) => ['available', 'needs-input'].includes(offer.availability));
	const unavailable = other.filter((offer) => !['available', 'needs-input'].includes(offer.availability));
	assert(actionable.length > 0 && unavailable.length > 0);
	await expect(page.locator('.dx-repairs > .dx-card')).toHaveCount(actionable.length);
	await expect(page.locator('.dx-unavailable > .dx-card')).toHaveCount(unavailable.length);
	await expect(page.locator('#dx-tab-current [data-kind="suggestion"] .dx-count-value')).toHaveText(String(actionable.length));
	await expect(page.locator('.dx-unavailable > summary')).toHaveText(`Unavailable for this font (${unavailable.length})`);
	assert.equal(await page.locator('.dx-unavailable').evaluate((node) => node.open), false);
	assert(findings.some((issue) => issue.severity === 'error') && findings.some((issue) => issue.severity === 'warning'));
	const expectedOrder = [
		...findings.filter((issue) => issue.severity === 'error'),
		...findings.filter((issue) => issue.severity === 'warning'),
	].map((issue) => issue.code);
	for (const view of ['current', 'original']) {
		await page.locator(`#dx-tab-${view}`).click();
		const order = await page.locator(`.dx-${view} .dx-findings > .dx-card`)
			.evaluateAll((cards) => cards.map((card) => card.dataset.checkCode));
		assert.deepEqual(order, expectedOrder);
	}
	await page.locator('#dx-tab-current').click();
	const issuesBox = await page.locator('.dx-current').boundingBox();
	const repairsBox = await page.locator('.dx-repairs').boundingBox();
	const unavailableBox = await page.locator('.dx-unavailable').boundingBox();
	assert(repairsBox.y >= issuesBox.y + issuesBox.height);
	assert(unavailableBox.y >= repairsBox.y + repairsBox.height);
	await page.locator('.dx-unavailable > summary').click();
	await expect(page.locator('.dx-unavailable input, .dx-unavailable select')).toHaveCount(0);
	await expect(page.locator('.dx-unavailable').getByRole('button', { name: 'Apply fix', exact: true })).toHaveCount(0);
	const names = fix(page, 'name.record');
	await expect(names).toContainText('Relocating unrecognized tables');
	await expect(names).toContainText('original source or a font editor');
	await expect(names.getByRole('button', { name: 'Review prerequisite' })).toHaveCount(0);
	await page.getByLabel('Filter suggested fixes').selectOption('safe');
	await expect(names).toBeVisible();
	await page.setViewportSize({ width: 390, height: 900 });
	assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
	await page.setViewportSize({ width: 1280, height: 900 });

	const signed = importFontTables(base);
	signed.tables.DSIG = { _raw: [0, 0, 0, 1, 0, 0, 0, 0] };
	const signedBytes = exportFont(signed);
	new DataView(signedBytes).setUint32(entry(signedBytes, 'head').offset + 8, 0);
	await load(page, url, signedBytes);
	await diagnose(page);
	const before = await json(page);
	await page.locator('.dx-unavailable > summary').click();
	const blockedStyle = page.locator('.dx-unavailable [data-repair-id="metadata.style"]');
	await expect(blockedStyle.locator('input, select')).toHaveCount(0);
	const blockedIssue = page.locator('.dx-current [data-check-code="BAD_CHECKSUM_ADJUSTMENT"]');
	await expect(blockedIssue.getByRole('button', { name: 'Apply fix', exact: true })).toHaveCount(0);
	await expect(blockedIssue.getByRole('button', { name: 'Review prerequisite' })).toBeVisible();
	await page.getByLabel('Filter suggested fixes').selectOption('safe');
	await page.locator('.dx-repairs > summary').click();
	await blockedStyle.getByRole('button', { name: 'Review prerequisite' }).click();
	const removal = fix(page, 'dsig.remove');
	await expect(page.locator('.dx-repairs')).toHaveJSProperty('open', true);
	await expect(page.getByLabel('Filter suggested fixes')).toHaveValue('all');
	await expect(removal.getByRole('button', { name: 'Apply fix', exact: true })).toBeFocused();
	await expect(removal.getByRole('checkbox')).toHaveCount(0);
	await expect(removal.locator('.dx-loss-warning')).toContainText('signature');
	assert.deepEqual(await json(page), before);
	await applyFix(page, 'dsig.remove');
	const style = page.locator('.dx-repairs [data-repair-id="metadata.style"]');
	await expect(style.getByLabel('Intended weight', { exact: true })).toBeEnabled();
	await expect(style.getByRole('button', { name: 'Apply fix', exact: true })).toBeEnabled();
	await expect(blockedStyle).toHaveCount(0);
	await page.getByRole('button', { name: 'Undo last change' }).click();
	await expect(blockedStyle).toHaveCount(1);
	await expect(blockedStyle.locator('input, select')).toHaveCount(0);
	console.log('Actionable-first ordering, informational blockers, prerequisite navigation, loss warnings and availability refresh passed.');
}

export async function verifyDiagnoseBadge(page, url, makeFont) {
	const bytes = makeFont().export({ format: 'sfnt' });
	const view = new DataView(bytes);
	view.setUint32(entry(bytes, 'head').offset + 12, 0);
	view.setInt16(entry(bytes, 'OS/2').offset + 2, 30000);
	await load(page, url, bytes);
	const badge = page.getByRole('button', { name: /^Diagnose & fix/ }).locator('.l1-tab-badge');
	await expect(badge).toHaveText('1');
	await expect(badge).toHaveAttribute('title', '1 error');
	await diagnose(page);
	await applyFix(page, 'head.magic');
	await expect(badge).toHaveText('1');
	await expect(badge).toHaveClass(/l1-tab-badge-warning/);
	await expect(badge).toHaveAttribute('title', '1 warning');
	await page.locator('#dx-tab-original').click();
	await expect(page.locator('.dx-original .dx-error')).toHaveCount(1);
	await expect(badge).toHaveAttribute('title', '1 warning');
	await page.locator('#dx-tab-current').click();
	await applyFix(page, 'os2.average-width');
	await expect(badge).toHaveCount(0);
	await page.getByRole('button', { name: 'Undo last change' }).click();
	await expect(badge).toHaveAttribute('title', '1 warning');
	await page.evaluate(() => { window.confirm = () => true; });
	await page.getByRole('button', { name: 'Revert to original project' }).click();
	await expect(badge).toHaveAttribute('title', '1 error');
	await editFamily(page, 'Badge edited working copy');
	await expect(badge).toHaveText('?');
	await diagnose(page);
	await expect(badge).toHaveText('?');
	await page.getByRole('button', { name: 'Check current font' }).click();
	await expect(page.getByRole('button', { name: 'Use checked export' })).toBeEnabled();
	const errors = Number(await page.locator('#dx-tab-current [data-kind="error"] .dx-count-value').innerText());
	const warnings = Number(await page.locator('#dx-tab-current [data-kind="warning"] .dx-count-value').innerText());
	if (errors || warnings) await expect(badge).toHaveText(String(errors || warnings));
	else await expect(badge).toHaveCount(0);
	console.log('Current-font navigation badge, remaining warnings, clear state, original isolation, undo, revert and preflight passed.');
}

export async function verifyRepairGuidance(page, url, makeFont) {
	const bytes = makeFont().export({ format: 'sfnt' });
	new DataView(bytes).setUint32(entry(bytes, 'head').offset + 12, 0);
	await load(page, url, bytes);
	await diagnose(page);
	const fields = page.locator('.dx-repair-field');
	await expect(fields.first()).toBeVisible();
	for (const field of await fields.all()) {
		const input = field.locator('.field-input');
		const note = field.locator('.dx-input-note');
		await expect(field.getByRole('button', { name: /^Expected input:/ })).toHaveAttribute('aria-expanded', 'false');
		await expect(note).toBeHidden();
		await expect(input).toHaveAttribute('aria-describedby', await note.getAttribute('id'));
		await expect(input).toHaveAccessibleDescription(await note.textContent());
	}
	const currentHead = page.locator('.dx-current [data-check-code="BAD_MAGIC_NUMBER"]');
	await currentHead.locator('.dx-offer-details > summary').click();
	await expect(currentHead.getByRole('link', { name: 'OpenType: head (opens in a new tab)', exact: true })).toHaveCount(1);
	const warning = page.locator('.dx-current .dx-warning').first();
	await warning.locator('.dx-offer-details > summary').first().click();
	await expect(warning.locator('.dx-reference-links a').first()).toBeVisible();
	const style = fix(page, 'metadata.style');
	await style.locator('.dx-offer-details > summary').click();
	await expect(style.getByRole('link', { name: 'OpenType: OS/2 (opens in a new tab)', exact: true })).toBeVisible();
	const weight = style.getByLabel('Intended weight', { exact: true });
	await weight.fill('500');
	const help = style.getByRole('button', { name: 'Expected input: Intended weight', exact: true });
	const note = style.locator(`#${await weight.getAttribute('aria-describedby')}`);
	const before = await json(page);
	await help.focus();
	await help.press('Enter');
	await expect(help).toHaveAttribute('aria-expanded', 'true');
	await expect(note).toContainText('400 Regular');
	await expect(note).toContainText('700 Bold');
	await expect(note).toContainText('number, not the name');
	await weight.focus();
	await weight.press('Escape');
	await expect(note).toBeHidden();
	await expect(help).toBeFocused();
	await help.press('Space');
	await expect(note).toBeVisible();
	await expect(weight).toHaveValue('500');
	await expect(style.getByLabel('Bold style-linking bit', { exact: true })).toHaveValue('');
	const italic = fix(page, 'metadata.italic');
	const angle = italic.getByLabel('Italic angle in degrees', { exact: true });
	await expect(angle).toHaveAccessibleDescription(/Angle in degrees.*negative angle/);
	const removing = fix(page, 'name.remove-record');
	await expect(removing.getByRole('checkbox')).toHaveCount(0);
	await expect(removing.locator('.dx-loss-warning')).toBeVisible();
	await removing.getByRole('button', { name: 'Expected input: Name ID', exact: true }).click();
	await expect(removing.locator('.dx-loss-warning')).toBeVisible();
	await expect(removing.getByLabel('Name ID', { exact: true })).toHaveValue('');
	assert.deepEqual(await json(page), before);
	await page.locator('.dx-unavailable > summary').click();
	const unavailable = fix(page, 'outlines.to-cff');
	await unavailable.locator('.dx-offer-details > summary').click();
	await expect(unavailable.locator('.dx-input-help')).toHaveCount(0);
	await expect(unavailable.getByRole('link', { name: 'OpenType: CFF (opens in a new tab)', exact: true })).toBeVisible();
	await page.getByRole('tab', { name: /Original file/ }).click();
	const originalHead = page.locator('.dx-original [data-check-code="BAD_MAGIC_NUMBER"]');
	await originalHead.locator('summary').click();
	await expect(originalHead.getByRole('link', { name: 'OpenType: head (opens in a new tab)', exact: true })).toBeVisible();
	const links = await page.locator('.dx-reference-links a').evaluateAll((nodes) =>
		nodes.map((node) => ({ href: node.href, target: node.target, rel: node.rel })));
	assert(links.every((link) => link.href.startsWith('https://') &&
		link.target === '_blank' && link.rel === 'noopener noreferrer'));
	await page.getByRole('tab', { name: /Current font/ }).click();
	await page.setViewportSize({ width: 390, height: 900 });
	await expect(note).toBeVisible();
	const layout = await style.locator('.dx-repair-field').evaluateAll((nodes) => nodes.map((node) => ({
		left: node.querySelector('.field-input').getBoundingClientRect().left,
		right: node.querySelector('.field-input').getBoundingClientRect().right,
		width: node.getBoundingClientRect().width,
	})));
	assert(layout.every((row) => row.left === layout[0].left && row.right <= 390 && row.width > 0));
	assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
	await page.setViewportSize({ width: 1280, height: 900 });
	console.log('Repair input help, keyboard dismissal, value preservation, official references and mobile layout passed.');
}

export async function verifyLossWarnings(page, url, makeFont) {
	const bytes = makeFont().export({ format: 'sfnt' });
	await load(page, url, bytes);
	await diagnose(page);
	const overlap = fix(page, 'tt.overlap-flag');
	const warning = overlap.locator('.dx-loss-warning');
	await expect(warning).toBeVisible();
	const offer = FontFlux.repairCatalog().find((repair) => repair.id === 'tt.overlap-flag');
	await expect(warning).toContainText(offer.ifApplied);
	await expect(overlap.getByRole('checkbox')).toHaveCount(0);
	await expect(overlap).not.toContainText('Explicit consent is required');
	await expect(overlap.locator('.dx-offer-details')).toHaveJSProperty('open', false);
	const apply = overlap.getByRole('button', { name: 'Apply fix', exact: true });
	await expect(apply).toHaveAccessibleDescription(`Warning: Potential loss or behavior change ${offer.ifApplied}`);
	const color = await warning.evaluate((node) => getComputedStyle(node).color);
	const [red, green, blue] = color.match(/\d+/g).map(Number);
	assert(red > green * 2 && red > blue * 2, 'The loss warning should use a red foreground.');
	const originalProject = await json(page);
	await page.setViewportSize({ width: 390, height: 900 });
	assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
	await page.setViewportSize({ width: 1280, height: 900 });
	await overlap.getByLabel('Glyph index (existing glyph order)', { exact: true }).fill('65535');
	await overlap.getByLabel('Authoritative overlap flag', { exact: true }).selectOption('true');
	await clickFix(page, offer.id);
	await expect(overlap.locator('.dx-fix-status')).toContainText('Fix not applied');
	assert.deepEqual(await json(page), originalProject);
	await overlap.getByLabel('Glyph index (existing glyph order)', { exact: true }).fill('2');
	await applyFix(page, offer.id);
	await openResult(latestChange(page));
	const review = JSON.parse(await downloaded(page, () =>
		page.getByRole('button', { name: 'Download reviewed plan' }).click()));
	const request = { id: offer.id, inputs: { glyphIndex: 2, overlap: true }, consent: true };
	assert.deepEqual(review.plan.requests, [request]);
	assert(review.plan.steps.every((step) => step.id === offer.id || step.risk === 'safe'));
	const expected = await FontFlux.applyRepairs(bytes, await FontFlux.planRepairs(bytes, [request]));
	assert.equal(expected.state, 'verified');
	assert.deepEqual(await appliedBytes(page), Buffer.from(expected.buffer));
	await page.getByRole('tab', { name: /Original file/ }).click();
	assert.deepEqual(await downloaded(page, () =>
		page.getByRole('button', { name: 'Download original', exact: true }).click()), Buffer.from(bytes));
	await page.getByRole('tab', { name: /Current font/ }).click();
	await page.getByRole('button', { name: 'Undo last change' }).click();
	await expect(warning).toBeVisible();
	assert.deepEqual(await json(page), originalProject);
	console.log('Red loss warnings, one-click authorization, input validation, scoped plans, exact bytes and undo passed.');
}

export async function verifyDemoQuality(page, url, makeFont, engine) {
	await verifyDiagnoseViews(page, url, makeFont);
	await verifyFixedCards(page, url, makeFont);
	await verifySuggestionPriority(page, url, makeFont);
	await verifyDiagnoseBadge(page, url, makeFont);
	await verifyRepairGuidance(page, url, makeFont);
	await verifyLossWarnings(page, url, makeFont);
	const base = makeFont().export({ format: 'sfnt' });
	const damaged = base.slice(0);
	new DataView(damaged).setUint32(entry(damaged, 'head').offset + 8, 0);
	const expectedPlan = await FontFlux.planRepairs(damaged, [{ id: 'sfnt.checksums' }]);
	const expected = await FontFlux.applyRepairs(damaged, expectedPlan);
	assert.equal(expected.state, 'verified');
	const pageErrors = [];
	page.on('pageerror', (error) => pageErrors.push(error.message));

	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: 1000 });
		await load(page, url, damaged);
		const originalProject = await json(page);
		await diagnose(page);
		assert.equal(await page.locator('.dx-offer input:checked').count(), 0);
		await fix(page, 'sfnt.checksums').locator('.dx-offer-details > summary').click();
		assert.deepEqual(await json(page), originalProject);
		await expect(page.locator('.dx-original')).toContainText('BAD_CHECKSUM_ADJUSTMENT');
		await applyFix(page, 'sfnt.checksums');
		const candidate = await appliedBytes(page);
		assert.deepEqual(candidate, Buffer.from(expected.buffer));
		const audit = JSON.parse(await downloaded(page, () => page.getByRole('button', { name: 'Download audit report', exact: true }).click()));
		assert.equal(audit.outputFingerprint, expected.outputFingerprint);
		assert.equal(audit.profile, 'structural');
		assert(audit.after.coverage.some((item) => item.status !== 'checked'));
		assert(!('buffer' in audit));
		await page.getByRole('button', { name: 'Undo last change', exact: true }).waitFor();
		await expect(page.locator('.dx-original')).toContainText('BAD_CHECKSUM_ADJUSTMENT');
		await page.getByRole('tab', { name: /Original file/ }).click();
		assert.deepEqual(await downloaded(page, () => page.getByRole('button', { name: 'Download original', exact: true }).click()), Buffer.from(damaged));
		await page.getByRole('tab', { name: /Current font/ }).click();
		await page.getByRole('button', { name: 'Undo last change', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Undo last change', exact: true })).toHaveCount(0);
		assert.deepEqual(await json(page), originalProject);
		assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
		console.log(`${engine} ${width}px verified repair/download/audit/commit/undo: passed`);
	}

	// Undo can restore an originally unrenderable project, not just clean input.
	const badMagic = base.slice(0);
	new DataView(badMagic).setUint32(entry(badMagic, 'head').offset + 12, 0);
	await load(page, url, badMagic);
	const unrenderableProject = await json(page);
	await diagnose(page);
	await applyFix(page, 'head.magic');
	await page.getByRole('button', { name: 'Undo last change', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Undo last change', exact: true })).toHaveCount(0);
	assert.deepEqual(await json(page), unrenderableProject);
	await expect(page.locator('.dx-original')).toContainText('BAD_MAGIC_NUMBER');

	// Authored JSON follows project preflight; target/filename changes invalidate it.
	await load(page, url, makeFont().toJSON(), 'authored.json');
	await diagnose(page);
	await expect(page.locator('.dx-original')).toContainText('Authored JSON');
	await page.getByRole('button', { name: 'Check current font', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Use checked export', exact: true })).toBeEnabled();
	await expect(page.getByRole('tab', { name: /Current font/ })).toHaveAttribute('aria-selected', 'true');
	await page.getByRole('button', { name: 'Export Font', exact: true }).click();
	await expect(page.locator('.btn-download')).toBeDisabled();
	await page.evaluate(async (moduleURL) => {
		const { FontFlux } = await import(moduleURL);
		const original = FontFlux.prototype.preflightAsync;
		FontFlux.prototype.preflightAsync = async function (options) {
			const result = await original.call(this, options);
			window.__preflightBytes = [...new Uint8Array(result.buffer)];
			return result;
		};
		FontFlux.prototype.export = () => { throw new Error('Fresh re-export must not be used by Download'); };
	}, coreURL);
	await page.locator('.btn-validate').click();
	await expect(page.locator('.btn-download')).toBeEnabled();
	await expect(page.locator('.validation-results')).toContainText('Partial coverage');
	await page.getByLabel('Filename', { exact: true }).fill('reviewed.ttf');
	await expect(page.locator('.btn-download')).toBeDisabled();
	await page.locator('.btn-validate').click();
	await expect(page.locator('.btn-download')).toBeEnabled();
	await page.locator('input[value="woff"]').check();
	await expect(page.locator('.btn-download')).toBeDisabled();
	await page.locator('.btn-validate').click();
	await expect(page.locator('.btn-download')).toBeEnabled();
	const bytes = await page.evaluate(() => window.__preflightBytes);
	const exact = await downloaded(page, () => page.locator('.btn-download').click());
	assert.deepEqual(exact, Buffer.from(bytes));
	await expect(page.getByRole('button', { name: 'Export Font', exact: true })).toBeFocused();

	// A stale preflight cannot re-enable download after a target/data change.
	await load(page, url, makeFont().toJSON(), 'authored.json');
	await page.evaluate(async (moduleURL) => {
		const { FontFlux } = await import(moduleURL);
		const original = FontFlux.prototype.preflightAsync;
		FontFlux.prototype.preflightAsync = async function (options) {
			await new Promise((resolve) => { window.__releasePreflight = resolve; });
			try { return await original.call(this, options); }
			finally { window.__preflightFinished = true; }
		};
	}, coreURL);
	await page.getByRole('button', { name: 'Export Font', exact: true }).click();
	await page.locator('.btn-validate').click();
	await page.waitForFunction(() => !!window.__releasePreflight);
	await page.locator('input[value="woff"]').check();
	await page.evaluate(() => {
		window.dispatchEvent(new Event('fontflux:project-change'));
		window.__releasePreflight();
	});
	await page.waitForFunction(() => window.__preflightFinished);
	await expect(page.locator('.btn-download')).toBeDisabled();
	await expect(page.locator('.validation-results')).toContainText('changed');
	await page.keyboard.press('Escape');

	// Dirty project edits are not replaced with a repair of the old source.
	await load(page, url, damaged);
	await editFamily(page, 'Keep my edited family');
	const edited = await json(page);
	await diagnose(page);
	await expect(page.locator('.dx-status')).toContainText('contains edits');
	await expect(page.getByRole('button', { name: 'Apply fix', exact: true })).toHaveCount(0);
	await page.getByRole('button', { name: 'Check current font', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Use checked export', exact: true })).toBeEnabled();
	await openResult(page.locator('.dx-checked-export'));
	const editedCandidate = FontFlux.open(await downloaded(page, () => page.getByRole('button', { name: 'Download checked font', exact: true }).click()));
	assert.equal(editedCandidate.data.font.familyName, 'Keep my edited family');
	await page.getByRole('button', { name: 'Use checked export', exact: true }).click();
	await page.getByRole('button', { name: 'Undo last change', exact: true }).click();
	assert.deepEqual(await json(page), edited);
	await page.getByRole('button', { name: 'Revert to original project', exact: true }).click();
	assert.equal(JSON.parse(await json(page)).font.familyName, makeFont().data.font.familyName);

	// Assisted forms have no invented name or language defaults.
	const unnamed = importFontTables(base);
	unnamed.tables.name.names = unnamed.tables.name.names.filter((name) => name.nameID !== 1);
	await load(page, url, exportFont(unnamed));
	await diagnose(page);
	const nameOffer = fix(page, 'name.family');
	await expect(nameOffer).toContainText('Needs your input');
	assert.equal(await nameOffer.locator('input[type="text"]').inputValue(), '');
	assert.equal(await nameOffer.locator('input[type="number"]').inputValue(), '');
	await clickFix(page, 'name.family');
	await expect(page.locator('.dx-status')).toContainText('no default is assumed');
	await nameOffer.getByLabel('Intended family name', { exact: true }).fill('Deliberately Named');
	await nameOffer.getByRole('spinbutton', { name: /Windows language ID/ }).fill('1033');
	await applyFix(page, 'name.family');
	const named = FontFlux.open(await appliedBytes(page));
	assert.equal(named.data.font.familyName, 'Deliberately Named');

	const spacing = base.slice(0);
	new DataView(spacing).setInt16(entry(spacing, 'OS/2').offset + 72, -1);
	await load(page, url, spacing);
	await diagnose(page);
	const spacingOffer = fix(page, 'os2.typo-linegap');
	assert.equal(await spacingOffer.locator('input[type="number"]').inputValue(), '');
	await spacingOffer.getByLabel('Intended typographic line gap', { exact: true }).fill('-1');
	await clickFix(page, 'os2.typo-linegap');
	await expect(page.locator('.dx-status')).toContainText('integer');
	await spacingOffer.getByLabel('Intended typographic line gap', { exact: true }).fill('0');
	await applyFix(page, 'os2.typo-linegap');
	const spaced = await appliedBytes(page);
	const spacedBuffer = spaced.buffer.slice(spaced.byteOffset, spaced.byteOffset + spaced.byteLength);
	assert.equal(new DataView(spacedBuffer).getInt16(entry(spacedBuffer, 'OS/2').offset + 72), 0);

	// Applying a warned signature removal authorizes only that selected plan.
	const signed = importFontTables(base);
	signed.tables.DSIG = { _raw: [0, 0, 0, 1, 0, 0, 0, 0] };
	const signedBytes = exportFont(signed);
	await load(page, url, signedBytes);
	await diagnose(page);
	const loss = fix(page, 'dsig.remove');
	await expect(loss).toContainText('May change appearance or features');
	await expect(loss.getByRole('checkbox')).toHaveCount(0);
	await expect(loss.locator('.dx-loss-warning')).toContainText('signature');
	const beforeProfile = await json(page);
	await page.getByRole('checkbox', { name: 'Compatibility', exact: true }).check();
	await expect(loss.locator('.dx-loss-warning')).toBeVisible();
	assert.deepEqual(await json(page), beforeProfile);
	await applyFix(page, 'dsig.remove');
	const unsigned = await appliedBytes(page);
	assert.equal(FontFlux.open(unsigned).tables.DSIG, undefined);
	await page.getByRole('tab', { name: /Original file/ }).click();
	assert.deepEqual(await downloaded(page, () => page.getByRole('button', { name: 'Download original', exact: true }).click()), Buffer.from(signedBytes));
	await load(page, url, signedBytes);
	await page.getByRole('button', { name: 'Export Font', exact: true }).click();
	await page.locator('.btn-validate').click();
	await expect(page.locator('.validation-results')).toContainText('DSIG');
	await expect(page.locator('.btn-download')).toBeDisabled();
	await page.keyboard.press('Escape');

	// Verification and preview failures do not mutate source/project.
	await load(page, url, damaged);
	const beforeFailure = await json(page);
	await diagnose(page);
	await page.evaluate(async (moduleURL) => {
		const { FontFlux } = await import(moduleURL);
		const original = FontFlux.applyRepairsAsync;
		FontFlux.applyRepairsAsync = async (...args) => {
			const result = await original(...args);
			return { ...result, state: 'failed', buffer: null, verification: {
				passed: false, failures: ['Injected verification failure'], evidence: [],
			} };
		};
	}, coreURL);
	await clickFix(page, 'sfnt.checksums');
	await expect(page.locator('.dx-status')).toContainText('verification failed');
	await expect(page.getByRole('button', { name: 'Undo last change', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Download checked font', exact: true })).toHaveCount(0);
	await openResult(fix(page, 'sfnt.checksums').locator('.dx-fix-result'));
	const rejectedAudit = JSON.parse(await downloaded(page, () => page.getByRole('button', { name: 'Download audit report' }).click()));
	assert.equal(rejectedAudit.state, 'failed');
	assert.equal(rejectedAudit.browserPreview.state, 'not-run');
	assert(!('buffer' in rejectedAudit));
	assert.deepEqual(await json(page), beforeFailure);

	await load(page, url, damaged);
	await diagnose(page);
	const previewBeforeFailure = await previewWidth(page);
	await page.evaluate(() => {
		const original = FontFace.prototype.load;
		FontFace.prototype.load = function () {
			return this.family === 'DemoLoadedFont'
				? Promise.reject(new Error('Injected preview failure')) : original.call(this);
		};
	});
	await clickFix(page, 'sfnt.checksums');
	await expect(page.locator('.dx-status')).toContainText('Fix not applied');
	assert.deepEqual(await json(page), beforeFailure);
	assert.equal(await previewWidth(page), previewBeforeFailure);
	await expect(page.getByRole('button', { name: 'Undo last change', exact: true })).toHaveCount(0);

	// Discarding during an asynchronous commit preview cancels the transaction.
	await load(page, url, damaged);
	await diagnose(page);
	await page.evaluate(() => {
		const original = FontFace.prototype.load;
		FontFace.prototype.load = async function () {
			if (this.family === 'DemoLoadedFont') {
				await new Promise((resolve) => { window.__releaseCommit = resolve; });
			}
			const result = await original.call(this);
			window.__commitPreviewFinished = true;
			return result;
		};
	});
	await clickFix(page, 'sfnt.checksums');
	await page.waitForFunction(() => !!window.__releaseCommit);
	await page.getByRole('button', { name: 'Cancel pending work', exact: true }).click();
	await page.evaluate(() => window.__releaseCommit());
	await page.waitForFunction(() => window.__commitPreviewFinished);
	await expect(page.locator('.dx-status')).toContainText('cancelled');
	await expect(fix(page, 'sfnt.checksums').locator('.dx-fix-status')).toContainText('Cancelled');
	await expect(page.getByRole('button', { name: 'Undo last change', exact: true })).toHaveCount(0);
	assert.deepEqual(await json(page), beforeFailure);
	assert.equal(await previewWidth(page), previewBeforeFailure);

	// Stale async repair results are ignored when navigating to another tab.
	await load(page, url, damaged);
	await diagnose(page);
	await page.evaluate(async (moduleURL) => {
		const { FontFlux } = await import(moduleURL);
		const original = FontFlux.applyRepairsAsync;
		FontFlux.applyRepairsAsync = async (...args) => {
			await new Promise((resolve) => { window.__releaseRepair = resolve; });
			try { return await original(...args); }
			finally { window.__repairFinished = true; }
		};
	}, coreURL);
	await clickFix(page, 'sfnt.checksums');
	await page.waitForFunction(() => !!window.__releaseRepair);
	await page.getByRole('button', { name: 'Overview', exact: true }).click();
	await page.evaluate(() => window.__releaseRepair());
	await page.waitForFunction(() => window.__repairFinished);
	await diagnose(page);
	await expect(page.getByRole('button', { name: 'Undo last change', exact: true })).toHaveCount(0);
	assert.deepEqual(await json(page), beforeFailure);

	// Original-file scope must not change the active, editable collection face.
	const collection = FontFlux.exportCollection([makeFont(), makeFont(false, 950)]);
	const collectionView = new DataView(collection);
	collectionView.setUint32(collectionView.getUint32(16), 0x12345678);
	await load(page, url, collection, 'later-bad.ttc');
	const collectionProject = await json(page);
	await diagnose(page);
	await expect(page.locator('.dx-original')).toContainText('BAD_SF_VERSION');
	await page.getByRole('tab', { name: /Original file/ }).click();
	await page.getByLabel('Original collection scope', { exact: true }).selectOption('1');
	await expect(page.getByLabel('Original collection scope', { exact: true })).toHaveValue('1');
	await expect(page.locator('.dx-original')).toContainText('BAD_SF_VERSION');
	assert.equal(await page.locator('.font-chooser').inputValue(), '0');
	await page.getByRole('tab', { name: /Current font/ }).click();
	await expect(fix(page, 'metadata.style').getByRole('button', { name: 'Apply fix' })).toBeEnabled();
	await expect(page.locator('.dx-current')).not.toContainText('BAD_SF_VERSION');
	assert.deepEqual(await json(page), collectionProject);

	// Wrapper inspection is actionable; legacy evidence never claims SFNT repair.
	await load(page, url, makeFont().export({ format: 'woff' }), 'wrapped.woff');
	await diagnose(page);
	await expect(page.locator('.dx-original')).toContainText('woff');
	await expect(fix(page, 'metadata.style').getByRole('button', { name: 'Apply fix' })).toBeEnabled();
	await load(page, url, '%!PS-AdobeFont unsupported fixture', 'legacy.pfa');
	await expect(page.locator('.dx-original')).toContainText('LEGACY_STRUCTURE_INVALID');
	assert.equal(await page.locator('.dx-offer > button:enabled').count(), 0);

	await load(page, url, base);
	await diagnose(page);
	const style = page.locator('[data-repair-id="metadata.style"]');
	await expect(style.getByLabel('Regular style-linking bit', { exact: true })).toHaveValue('');
	await style.getByLabel('Intended weight', { exact: true }).fill('500');
	await style.getByLabel('Intended width class', { exact: true }).fill('5');
	for (const [label, value] of [
		['Bold style-linking bit', 'false'], ['Italic style-linking bit', 'false'],
		['Regular style-linking bit', 'true'],
	]) await style.getByLabel(label, { exact: true }).selectOption(value);
	await applyFix(page, 'metadata.style');
	await openResult(latestChange(page));
	const savedReview = JSON.parse(await downloaded(page, () =>
		page.getByRole('button', { name: 'Download reviewed plan', exact: true }).click()));
	assert.equal(savedReview.kind, 'repair-review');
	assert.equal(savedReview.plan.steps.find((step) => step.id === 'metadata.style').values.authority, true);
	const styled = FontFlux.open(await appliedBytes(page));
	assert.equal(styled.info.weightClass, 500);
	await page.getByRole('button', { name: 'Undo last change', exact: true }).click();
	const loca = page.locator('[data-repair-id="tt.loca-format"]');
	await expect(loca.getByLabel('loca representation', { exact: true })).toHaveValue('');
	await loca.getByLabel('loca representation', { exact: true }).selectOption('long');
	await applyFix(page, 'tt.loca-format');
	const longLoca = await appliedBytes(page);
	const longBuffer = longLoca.buffer.slice(longLoca.byteOffset, longLoca.byteOffset + longLoca.byteLength);
	assert.equal(new DataView(longBuffer).getInt16(entry(longBuffer, 'head').offset + 50), 1);
	await page.getByRole('button', { name: 'Undo last change', exact: true }).click();

	await page.getByRole('button', { name: 'Export Font', exact: true }).click();
	const dialog = page.locator('.save-dialog');
	await dialog.getByLabel('Export quality profile').selectOption('publishing');
	await dialog.getByLabel('Filename', { exact: true }).fill('approved.ttf');
	await dialog.locator('.btn-validate').click();
	await expect(dialog.locator('.validation-results')).toContainText('unsupported');
	await expect(dialog.locator('.btn-download')).toBeDisabled();
	await dialog.getByLabel('Expected filename', { exact: true }).fill('approved.ttf');
	await dialog.getByLabel('Expected family name', { exact: true }).fill(makeFont().info.familyName);
	await dialog.locator('.btn-validate').click();
	await expect(dialog.locator('.btn-download')).toBeEnabled();
	for (const stage of ['original', 'project', 'resolved', 'output'])
		await expect(dialog.locator('.validation-results')).toContainText(`${stage}: checked`);
	await dialog.getByLabel('Export quality profile').selectOption('structural');
	await expect(dialog.locator('.btn-download')).toBeDisabled();
	await page.keyboard.press('Escape');

	const wrapped = makeFont().export({ format: 'woff' });
	new DataView(wrapped).setUint16(14, 1);
	await load(page, url, wrapped, 'wrapper-header.woff');
	await diagnose(page);
	await applyFix(page, 'container.reserved');
	const fixedWrapper = await appliedBytes(page);
	const expectedWrapper = new Uint8Array(wrapped.slice(0));
	expectedWrapper[14] = 0; expectedWrapper[15] = 0;
	assert.deepEqual(fixedWrapper, Buffer.from(expectedWrapper));

	const repairableCollection = FontFlux.exportCollection([makeFont(), makeFont(false, 950)]);
	const secondOffset = new DataView(repairableCollection).getUint32(16);
	new DataView(repairableCollection).setUint32(entry(repairableCollection, 'head', secondOffset).offset + 12, 0);
	await load(page, url, repairableCollection, 'repair-face.ttc');
	await page.locator('.font-chooser').selectOption('1');
	await diagnose(page);
	await applyFix(page, 'head.magic');
	const fixedCollection = await appliedBytes(page);
	assert.equal(FontFlux.open(fixedCollection, { faceIndex: 1 }).glyphs.find((glyph) => glyph.name === 'A').advanceWidth, 950);
	const prefix = fixedCollection.subarray(0, repairableCollection.byteLength);
	const originalPrefix = Buffer.from(repairableCollection);
	for (let index = 0; index < prefix.length; index++)
		if (index < 16 || index >= 20) assert.equal(prefix[index], originalPrefix[index]);
	await page.getByRole('button', { name: 'Undo last change', exact: true }).waitFor();
	assert((await previewWidth(page)) > 40);
	await page.getByRole('button', { name: 'Undo last change', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Undo last change', exact: true })).toHaveCount(0);
	await expect(page.locator('.dx-original')).toContainText('BAD_MAGIC_NUMBER');
	await page.locator('.font-chooser').selectOption('0');
	assert((await previewWidth(page)) < 35);

	await load(page, url, damaged);
	await diagnose(page);
	await expect(page.getByRole('button', { name: 'Cancel pending work', exact: true })).toBeHidden();
	await expect(page.getByRole('button', { name: 'Create preview', exact: true })).toHaveCount(0);
	await page.getByRole('tab', { name: /Original file/ }).click();
	assert.deepEqual(await downloaded(page, () =>
		page.getByRole('button', { name: 'Download original', exact: true }).click()), Buffer.from(damaged));
	await verifyM2Acceptance(page, url, makeFont, engine);
	assert.deepEqual(pageErrors, []);
	console.log(`${engine} quality decisions, profiles, typed forms, exact wrapper/collection repair, preflight, cancellation, consent and rollback: passed`);
}

async function verifyM2Acceptance(page, url, makeFont, engine) {
	const base = makeFont().export({ format: 'sfnt' });
	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: 1000 });
		await load(page, url, base);
		await diagnose(page);
		const ranges = page.locator('[data-repair-id="os2.unicode-ranges"]');
		await expect(ranges).toContainText('OpenType-1.5-Unicode-5.1-mapped-characters-v1');
		await expect(ranges.getByLabel('I have authority to choose these metadata values')).toHaveCount(0);
		await ranges.getByRole('button', { name: 'Apply fix', exact: true }).focus();
		await page.keyboard.press('Enter');
		await expect(latestChange(page)).toContainText('Fixed');
		await expect(ranges).toBeFocused();
		await openResult(latestChange(page));
		const review = JSON.parse(await downloaded(page, () => page.getByRole('button', { name: 'Download reviewed plan' }).click()));
		assert.equal(review.plan.steps.find((step) => step.id === 'os2.unicode-ranges').policyVersion, 'OpenType-1.5-Unicode-5.1-mapped-characters-v1');
		await expect(page.locator('.dx-status')).toHaveAttribute('role', 'status');
		await expect(page.locator('.dx-status')).toHaveAttribute('aria-live', 'polite');
		await page.getByRole('button', { name: 'Export Font', exact: true }).click();
		const dialog = page.locator('.save-dialog'), filename = dialog.getByLabel('Filename', { exact: true });
		await expect(filename).toBeFocused();
		await page.keyboard.press('Shift+Tab');
		await expect(dialog.getByRole('button', { name: 'Preflight', exact: true })).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(filename).toBeFocused();
		await dialog.getByRole('button', { name: 'Preflight', exact: true }).click();
		await expect(dialog.locator('.btn-download')).toBeEnabled();
		const audit = JSON.parse(await downloaded(page, () => dialog.getByRole('button', { name: 'Download preflight report' }).click()));
		assert.equal(audit.kind, 'export-preflight');
		assert.equal(audit.target, 'sfnt');
		assert.equal(audit.sourceFaceIndex, 0);
		assert.deepEqual(audit.stages.map((stage) => stage.id), ['original', 'project', 'resolved', 'output']);
		assert(audit.output.checks.some((check) => check.coverage !== 'complete'));
		assert(!('buffer' in audit));
		await filename.focus();
		await page.keyboard.press('Shift+Tab');
		await expect(dialog.locator('.btn-download')).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(filename).toBeFocused();
		const binary = await downloaded(page, () => dialog.locator('.btn-download').click());
		assert.equal(audit.outputFingerprint, createHash('sha256').update(binary).digest('hex'));
		await expect(page.getByRole('button', { name: 'Export Font', exact: true })).toBeFocused();
		assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
	}

	await load(page, url, makeFont().toJSON(), 'authored.json');
	await diagnose(page);
	await page.getByRole('button', { name: 'Check current font', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Use checked export', exact: true })).toBeEnabled();
	await openResult(page.locator('.dx-checked-export'));
	const authoredAudit = JSON.parse(await downloaded(page, () => page.getByRole('button', { name: 'Download audit report' }).click()));
	const authoredBytes = await downloaded(page, () => page.getByRole('button', { name: 'Download checked font' }).click());
	assert.equal(authoredAudit.preflight.kind, 'export-preflight');
	assert.equal(authoredAudit.preflight.outputFingerprint, createHash('sha256').update(authoredBytes).digest('hex'));
	assert.equal(authoredAudit.preflight.stages[0].status, 'skipped');
	assert.equal(authoredAudit.preflight.stages[0].reasonCode, 'no-original-bytes');
	assert.equal(authoredAudit.browserPreview.state, 'not-run');

	// Failed and unavailable outputs retain downloadable evidence, not binary downloads.
	const signed = importFontTables(base);
	signed.tables.DSIG = { _raw: [0, 0, 0, 1, 0, 0, 0, 0] };
	await load(page, url, exportFont(signed));
	await page.getByRole('button', { name: 'Export Font', exact: true }).click();
	await page.locator('.btn-validate').filter({ hasText: /^Preflight$/ }).click();
	const reportButton = page.getByRole('button', { name: 'Download preflight report' });
	await expect(reportButton).toBeEnabled();
	await expect(page.locator('.btn-download')).toBeDisabled();
	const failed = JSON.parse(await downloaded(page, () => reportButton.click()));
	assert.notEqual(failed.state, 'verified');
	assert.equal(failed.outputFingerprint, null);
	await page.getByLabel('Filename', { exact: true }).fill('changed.ttf');
	await expect(reportButton).toBeDisabled();
	await page.keyboard.press('Escape');

	await diagnose(page);
	await page.getByRole('button', { name: 'Check current font', exact: true }).click();
	const rejectedPreflight = JSON.parse(await downloaded(page, () => page.getByRole('button', { name: 'Download audit report' }).click()));
	assert.equal(rejectedPreflight.outputFingerprint, null);
	assert.notEqual(rejectedPreflight.state, 'verified');
	assert(rejectedPreflight.stages.length === 4);

	// A serializer failure during commit preparation cannot partially replace the project.
	await load(page, url, base);
	const original = await json(page);
	const oldWidth = await previewWidth(page);
	await diagnose(page);
	const name = page.locator('[data-repair-id="name.record"]');
	await name.getByLabel('Name ID', { exact: true }).fill('1');
	await name.getByLabel('Windows language ID', { exact: true }).fill('1033');
	await name.getByLabel('Authoritative name or rights text', { exact: true }).fill('M2 candidate');
	await page.evaluate(async (moduleURL) => {
		const { FontFlux } = await import(moduleURL), original = FontFlux.prototype.toJSON;
		FontFlux.prototype.toJSON = function (...args) {
			if (this.info.familyName === 'M2 candidate') throw new Error('Injected commit serialization failure');
			return original.apply(this, args);
		};
	}, coreURL);
	await clickFix(page, 'name.record');
	await expect(page.locator('.dx-status')).toContainText('Fix not applied');
	await openResult(name.locator('.dx-fix-result'));
	assert.deepEqual(await json(page), original);
	assert.equal(await previewWidth(page), oldWidth);

	// A new download failure is visible and does not erase the existing project.
	await page.evaluate(() => {
		window.__originalCreateURL = URL.createObjectURL;
		URL.createObjectURL = () => { throw new Error('Injected download failure'); };
	});
	await page.getByRole('button', { name: 'Download checked font', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('Download failed');
	await page.evaluate(() => { URL.createObjectURL = window.__originalCreateURL; });
	assert.deepEqual(await json(page), original);

	const damaged = base.slice(0);
	new DataView(damaged).setUint32(entry(damaged, 'head').offset + 8, 0);
	await load(page, url, damaged);
	const before = await json(page), width = await previewWidth(page);
	await diagnose(page);
	await page.evaluate(() => {
		window.__originalAdd = document.fonts.add;
		document.fonts.add = function () { throw new Error('Injected preview registration failure'); };
	});
	await clickFix(page, 'sfnt.checksums');
	await expect(page.locator('.dx-status')).toContainText('Fix not applied');
	await expect(page.getByRole('button', { name: 'Undo last change' })).toHaveCount(0);
	assert.deepEqual(await json(page), before);
	assert.equal(await previewWidth(page), width);
	await page.evaluate(() => { document.fonts.add = window.__originalAdd; });
	await applyFix(page, 'sfnt.checksums');
	await page.getByRole('button', { name: 'Undo last change' }).waitFor();
	const committed = await json(page);
	await page.evaluate(() => {
		window.__originalCreateURL = URL.createObjectURL;
		URL.createObjectURL = () => { throw new Error('Injected original preview resource failure'); };
	});
	await page.getByRole('button', { name: 'Undo last change' }).click();
	await expect(page.locator('.dx-status')).toContainText('failed');
	await expect(page.getByRole('button', { name: 'Undo last change' })).toBeVisible();
	await page.evaluate(() => { URL.createObjectURL = window.__originalCreateURL; });
	assert.deepEqual(await json(page), committed);
	assert.equal(await previewWidth(page), width);
	await page.getByRole('button', { name: 'Undo last change' }).click();
	assert.deepEqual(await json(page), before);
	await expect(page.locator('#demo-font-face')).toHaveCount(1);

	await page.getByRole('button', { name: 'Export Font', exact: true }).click();
	await page.locator('.btn-validate').click();
	await expect(page.locator('.btn-download')).toBeEnabled();
	await page.evaluate(() => {
		window.__originalCreateURL = URL.createObjectURL;
		URL.createObjectURL = () => { throw new Error('Injected export download failure'); };
	});
	await page.getByRole('button', { name: 'Download preflight report' }).click();
	await expect(page.locator('.validation-results')).toContainText('Report download failed');
	await page.locator('.btn-download').click();
	await expect(page.locator('.validation-results')).toContainText('Export failed');
	await page.evaluate(() => { URL.createObjectURL = window.__originalCreateURL; });
	await page.keyboard.press('Escape');
	assert.deepEqual(await json(page), before);
	assert.equal(await previewWidth(page), width);

	await page.evaluate(() => {
		const load = FontFace.prototype.load;
		FontFace.prototype.load = function () {
			return this.family.startsWith('CandidatePreview') ? Promise.reject(new Error('Injected candidate preview failure')) : load.call(this);
		};
	});
	await clickFix(page, 'sfnt.checksums');
	await expect(page.locator('.dx-status')).toContainText('Browser check failed');
	await expect(page.getByRole('button', { name: 'Undo last change', exact: true })).toHaveCount(0);
	await openResult(fix(page, 'sfnt.checksums').locator('.dx-fix-result'));
	const previewFailure = JSON.parse(await downloaded(page, () => page.getByRole('button', { name: 'Download audit report' }).click()));
	assert.equal(previewFailure.browserPreview.state, 'failed');
	assert.match(previewFailure.browserPreview.error, /Injected candidate/);
	assert.equal(previewFailure.state, 'verified');
	assert.deepEqual(await json(page), before);

	// Reverting a collection commit re-links untouched peers to the original source.
	const collection = FontFlux.exportCollection([makeFont(), makeFont(false, 950)]);
	const second = new DataView(collection).getUint32(16);
	new DataView(collection).setUint32(entry(collection, 'head', second).offset + 12, 0);
	await load(page, url, collection, 'revert.ttc');
	await page.getByLabel('Active collection face').selectOption('1');
	await diagnose(page);
	await applyFix(page, 'head.magic');
	await page.getByRole('button', { name: 'Revert to original project', exact: true }).click();
	await expect(fix(page, 'head.magic').getByRole('button', { name: 'Apply fix' })).toBeEnabled();
	await expect(page.getByRole('tab', { name: /Current font/ })).toBeFocused();
	await page.getByRole('tab', { name: /Original file/ }).click();
	assert.deepEqual(await downloaded(page, () => page.getByRole('button', { name: 'Download original' }).click()), Buffer.from(collection));
	await editFamily(page, 'Selected temporary edit');
	await page.getByLabel('Active collection face').selectOption('0');
	assert((await previewWidth(page)) < 35);
	await editFamily(page, 'Independent peer edit');
	const peerEdit = await json(page);
	await page.getByLabel('Active collection face').selectOption('1');
	await diagnose(page);
	await page.getByRole('button', { name: 'Revert to original project', exact: true }).click();
	assert.equal(await page.locator('.dx-offer > button:enabled').count(), 0);
	await page.getByLabel('Active collection face').selectOption('0');
	assert.deepEqual(await json(page), peerEdit);

	// Switching to a corrupt face cancels a browser check before it can commit.
	new DataView(collection).setUint32(second, 0x12345678);
	await load(page, url, collection, 'corrupt-peer.ttc');
	await diagnose(page);
	const rights = page.locator('[data-repair-id="rights.embedding"]');
	await rights.getByLabel('Authorized fsType bit mask', { exact: true }).fill('4');
	await page.evaluate(() => {
		const load = FontFace.prototype.load;
		FontFace.prototype.load = async function () {
			if (this.family.startsWith('CandidatePreview')) await new Promise((resolve) => { window.__releaseFaceCheck = resolve; });
			try { return await load.call(this); }
			finally { window.__faceCheckFinished = true; }
		};
	});
	await clickFix(page, 'rights.embedding');
	await page.waitForFunction(() => !!window.__releaseFaceCheck);
	await page.getByLabel('Active collection face').selectOption('1');
	await page.evaluate(() => window.__releaseFaceCheck());
	await page.waitForFunction(() => window.__faceCheckFinished);
	await expect(page.locator('.dx-original')).toContainText('BAD_SF_VERSION');
	assert.equal(await page.evaluate(() => [...document.fonts].filter((face) => face.family.startsWith('CandidatePreview')).length), 0);
	await expect(page.getByRole('button', { name: 'Undo last change', exact: true })).toHaveCount(0);

	await load(page, url, Uint8Array.from([0, 1]), 'truncated.ttf');
	await expect(page.locator('.dx-status')).toContainText('Checked current font');
	assert.equal(await page.locator('.dx-offer > button:enabled').count(), 0);

	await page.goto(url);
	await page.evaluate(() => { FileReader.prototype.readAsArrayBuffer = () => {}; });
	await page.locator('input[type="file"]').setInputFiles({ name: 'literal<em>font.ttf', mimeType: 'application/octet-stream', buffer: Buffer.from(base) });
	await expect(page.locator('.loading-spinner')).toContainText('literal<em>font.ttf');
	await expect(page.locator('.loading-spinner em')).toHaveCount(0);

	const bootFailure = async (route) => {
		if (route.request().url().includes('/@fs/')) return route.continue();
		const response = await route.fetch(), text = await response.text();
		assert(text.includes('initWoff2().then(showLoadingScreen'));
		await route.fulfill({ response, body: text.replace('initWoff2().then(showLoadingScreen',
			"Promise.reject(new Error('Injected WOFF2 unavailable')).then(showLoadingScreen") });
	};
	const mainModule = /\/src\/main\.js(?:\?.*)?$/;
	await page.route(mainModule, bootFailure);
	await page.goto(url);
	await expect(page.locator('.loading-error')).toContainText('WOFF2 initialization failed');
	await page.locator('input[type="file"]').setInputFiles({ name: 'still-supported.ttf', mimeType: 'application/octet-stream', buffer: Buffer.from(base) });
	await page.locator('.font-name').waitFor();
	await page.unroute(mainModule, bootFailure);
	console.log(`${engine} M2 audits, provenance, keyboard/focus, download/commit rollback, collection revert/disposal and loader failures: passed`);
}
