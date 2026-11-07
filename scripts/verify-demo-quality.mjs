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

async function reviewSafe(page) {
	await page.getByRole('button', { name: 'Select available safe repairs', exact: true }).click();
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await page.getByRole('button', { name: 'Apply plan to detached candidate', exact: true }).waitFor();
}

async function apply(page) {
	await page.getByRole('button', { name: 'Apply plan to detached candidate', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Commit candidate', exact: true })).toBeEnabled();
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

export async function verifyDemoQuality(page, url, makeFont, engine) {
	const base = makeFont().export({ format: 'sfnt' });
	const damaged = base.slice(0);
	new DataView(damaged).setUint32(entry(damaged, 'head').offset + 8, 0);
	const expectedPlan = await FontFlux.planRepairs(damaged, FontFlux.inspect(damaged).repairs
		.filter((offer) => offer.risk === 'safe' && offer.availability === 'available').map((offer) => ({ id: offer.id })));
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
		await reviewSafe(page);
		await page.getByRole('button', { name: 'Decline plan', exact: true }).click();
		await expect(page.locator('.dx-status')).toContainText('Plan declined');
		assert.deepEqual(await json(page), originalProject);
		await expect(page.locator('.dx-original')).toContainText('BAD_CHECKSUM_ADJUSTMENT');
		await reviewSafe(page);
		await apply(page);
		assert.deepEqual(await json(page), originalProject);
		const candidate = await downloaded(page, () => page.getByRole('button', { name: 'Download exact candidate', exact: true }).click(), /-candidate\.ttf$/);
		assert.deepEqual(candidate, Buffer.from(expected.buffer));
		const audit = JSON.parse(await downloaded(page, () => page.getByRole('button', { name: 'Download audit report', exact: true }).click()));
		assert.equal(audit.outputFingerprint, expected.outputFingerprint);
		assert.equal(audit.profile, 'structural');
		assert(audit.after.coverage.some((item) => item.status !== 'checked'));
		assert(!('buffer' in audit));
		await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
		await page.getByRole('button', { name: 'Undo last commit', exact: true }).waitFor();
		await expect(page.locator('.dx-original')).toContainText('BAD_CHECKSUM_ADJUSTMENT');
		assert.deepEqual(await downloaded(page, () => page.getByRole('button', { name: 'Download original (unverified)', exact: true }).click()), Buffer.from(damaged));
		await page.getByRole('button', { name: 'Undo last commit', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Undo last commit', exact: true })).toHaveCount(0);
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
	await reviewSafe(page);
	await apply(page);
	await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
	await page.getByRole('button', { name: 'Undo last commit', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Undo last commit', exact: true })).toHaveCount(0);
	assert.deepEqual(await json(page), unrenderableProject);
	await expect(page.locator('.dx-original')).toContainText('BAD_MAGIC_NUMBER');

	// Authored JSON follows project preflight; target/filename changes invalidate it.
	await load(page, url, makeFont().toJSON(), 'authored.json');
	await diagnose(page);
	await expect(page.locator('.dx-original')).toContainText('Authored JSON');
	await page.getByRole('button', { name: 'Preflight current project', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Commit candidate', exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Discard candidate', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Preflight current project', exact: true })).toBeFocused();
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
	await expect(page.getByRole('button', { name: 'Review repair plan', exact: true })).toBeDisabled();
	await page.getByRole('button', { name: 'Preflight current project', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Commit candidate', exact: true })).toBeEnabled();
	const editedCandidate = FontFlux.open(await downloaded(page, () => page.getByRole('button', { name: 'Download exact candidate', exact: true }).click()));
	assert.equal(editedCandidate.data.font.familyName, 'Keep my edited family');
	await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
	await page.getByRole('button', { name: 'Undo last commit', exact: true }).click();
	assert.deepEqual(await json(page), edited);
	await page.getByRole('button', { name: 'Revert to original project', exact: true }).click();
	assert.equal(JSON.parse(await json(page)).font.familyName, makeFont().data.font.familyName);

	// Assisted forms have no invented name or language defaults.
	const unnamed = importFontTables(base);
	unnamed.tables.name.names = unnamed.tables.name.names.filter((name) => name.nameID !== 1);
	await load(page, url, exportFont(unnamed));
	await diagnose(page);
	const nameOffer = page.locator('[data-repair-id="name.family"]');
	await expect(nameOffer).toContainText('assisted');
	assert.equal(await nameOffer.locator('input[type="text"]').inputValue(), '');
	assert.equal(await nameOffer.locator('input[type="number"]').inputValue(), '');
	await nameOffer.locator('input[type="checkbox"]').check();
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('no default is assumed');
	await nameOffer.getByLabel('Intended family name').fill('Deliberately Named');
	await nameOffer.getByLabel(/Windows language ID/).fill('1033');
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await expect(page.locator('.dx-candidate')).toContainText('Deliberately Named');
	await apply(page);
	const named = FontFlux.open(await downloaded(page, () => page.getByRole('button', { name: 'Download exact candidate', exact: true }).click()));
	assert.equal(named.data.font.familyName, 'Deliberately Named');

	const spacing = base.slice(0);
	new DataView(spacing).setInt16(entry(spacing, 'OS/2').offset + 72, -1);
	await load(page, url, spacing);
	await diagnose(page);
	const spacingOffer = page.locator('[data-repair-id="os2.typo-linegap"]');
	assert.equal(await spacingOffer.locator('input[type="number"]').inputValue(), '');
	await spacingOffer.locator('input[type="checkbox"]').check();
	await spacingOffer.getByLabel('Intended typographic line gap').fill('-1');
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('integer');
	await spacingOffer.getByLabel('Intended typographic line gap').fill('0');
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await apply(page);
	const spaced = await downloaded(page, () => page.getByRole('button', { name: 'Download exact candidate', exact: true }).click());
	const spacedBuffer = spaced.buffer.slice(spaced.byteOffset, spaced.byteOffset + spaced.byteLength);
	assert.equal(new DataView(spacedBuffer).getInt16(entry(spacedBuffer, 'OS/2').offset + 72), 0);

	// Potentially lossy signature removal requires consent scoped to the plan.
	const signed = importFontTables(base);
	signed.tables.DSIG = { _raw: [0, 0, 0, 1, 0, 0, 0, 0] };
	const signedBytes = exportFont(signed);
	await load(page, url, signedBytes);
	await diagnose(page);
	const loss = page.locator('[data-repair-id="dsig.remove"]');
	await expect(loss).toContainText('potentially-lossy');
	const selection = loss.locator('.dx-card-header input');
	const consent = loss.locator('.dx-consent input');
	await selection.check();
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('Explicit loss consent');
	await consent.check();
	await selection.uncheck();
	await expect(consent).not.toBeChecked();
	await selection.check();
	await consent.check();
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await apply(page);
	const unsigned = await downloaded(page, () => page.getByRole('button', { name: 'Download exact candidate', exact: true }).click());
	assert.equal(FontFlux.open(unsigned).tables.DSIG, undefined);
	assert.deepEqual(await downloaded(page, () => page.getByRole('button', { name: 'Download original (unverified)', exact: true }).click()), Buffer.from(signedBytes));
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
	await reviewSafe(page);
	await page.getByRole('button', { name: 'Apply plan to detached candidate', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('verification failed');
	await expect(page.getByRole('button', { name: 'Commit candidate', exact: true })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Download exact candidate', exact: true })).toHaveCount(0);
	const rejectedAudit = JSON.parse(await downloaded(page, () => page.getByRole('button', { name: 'Download audit report' }).click()));
	assert.equal(rejectedAudit.state, 'failed');
	assert.equal(rejectedAudit.browserPreview.state, 'not-run');
	assert(!('buffer' in rejectedAudit));
	assert.deepEqual(await json(page), beforeFailure);

	await load(page, url, damaged);
	await diagnose(page);
	await reviewSafe(page);
	await apply(page);
	const previewBeforeFailure = await previewWidth(page);
	await page.evaluate(() => {
		const original = FontFace.prototype.load;
		FontFace.prototype.load = function () {
			return this.family === 'DemoLoadedFont'
				? Promise.reject(new Error('Injected preview failure')) : original.call(this);
		};
	});
	await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('Commit failed');
	assert.deepEqual(await json(page), beforeFailure);
	assert.equal(await previewWidth(page), previewBeforeFailure);
	await expect(page.getByRole('button', { name: 'Undo last commit', exact: true })).toHaveCount(0);

	// Discarding during an asynchronous commit preview cancels the transaction.
	await load(page, url, damaged);
	await diagnose(page);
	await reviewSafe(page);
	await apply(page);
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
	await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
	await page.waitForFunction(() => !!window.__releaseCommit);
	await page.getByRole('button', { name: 'Discard candidate', exact: true }).click();
	await page.evaluate(() => window.__releaseCommit());
	await page.waitForFunction(() => window.__commitPreviewFinished);
	await expect(page.locator('.dx-status')).toContainText('Candidate discarded');
	await expect(page.getByRole('button', { name: 'Undo last commit', exact: true })).toHaveCount(0);
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
	await reviewSafe(page);
	await page.getByRole('button', { name: 'Apply plan to detached candidate', exact: true }).click();
	await page.waitForFunction(() => !!window.__releaseRepair);
	await page.getByRole('button', { name: 'Overview', exact: true }).click();
	await page.evaluate(() => window.__releaseRepair());
	await page.waitForFunction(() => window.__repairFinished);
	await diagnose(page);
	await expect(page.getByRole('button', { name: 'Commit candidate', exact: true })).toHaveCount(0);
	assert.deepEqual(await json(page), beforeFailure);

	// Collection diagnosis includes later corrupt faces without hiding good ones.
	const collection = FontFlux.exportCollection([makeFont(), makeFont(false, 950)]);
	const collectionView = new DataView(collection);
	collectionView.setUint32(collectionView.getUint32(16), 0x12345678);
	await load(page, url, collection, 'later-bad.ttc');
	await diagnose(page);
	await expect(page.locator('.dx-original')).toContainText('BAD_SF_VERSION');
	await page.getByLabel('Original collection scope', { exact: true }).selectOption('1');
	await expect(page.locator('.dx-original')).toContainText('face 2');
	await expect(page.locator('.dx-original')).toContainText('BAD_SF_VERSION');
	assert.equal(await page.locator('.font-chooser').inputValue(), '0');
	await expect(page.getByRole('button', { name: 'Review repair plan', exact: true })).toBeDisabled();

	// Wrapper inspection is actionable; legacy evidence never claims SFNT repair.
	await load(page, url, makeFont().export({ format: 'woff' }), 'wrapped.woff');
	await diagnose(page);
	await expect(page.locator('.dx-original')).toContainText('woff');
	await expect(page.getByRole('button', { name: 'Review repair plan', exact: true })).toBeDisabled();
	await load(page, url, '%!PS-AdobeFont unsupported fixture', 'legacy.pfa');
	await expect(page.locator('.dx-original')).toContainText('LEGACY_STRUCTURE_INVALID');
	await expect(page.getByRole('button', { name: 'Review repair plan', exact: true })).toBeDisabled();

	await load(page, url, base);
	await diagnose(page);
	const style = page.locator('[data-repair-id="metadata.style"]');
	await expect(style.getByLabel('Regular style-linking bit')).toHaveValue('');
	await style.locator('.dx-card-header input').check();
	await style.getByLabel('Intended weight').fill('500');
	await style.getByLabel('Intended width class').fill('5');
	for (const [label, value] of [
		['Bold style-linking bit', 'false'], ['Italic style-linking bit', 'false'],
		['Regular style-linking bit', 'true'],
		['I have authority to choose these metadata values', 'true'],
	]) await style.getByLabel(label, { exact: true }).selectOption(value);
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await page.getByRole('button', { name: 'Download reviewed plan', exact: true }).waitFor();
	const savedReview = JSON.parse(await downloaded(page, () =>
		page.getByRole('button', { name: 'Download reviewed plan', exact: true }).click()));
	assert.equal(savedReview.kind, 'repair-review');
	assert.equal(savedReview.plan.steps.find((step) => step.id === 'metadata.style').values.authority, true);
	await apply(page);
	const styled = FontFlux.open(await downloaded(page, () =>
		page.getByRole('button', { name: 'Download exact candidate', exact: true }).click()));
	assert.equal(styled.info.weightClass, 500);
	await page.getByRole('button', { name: 'Discard candidate', exact: true }).click();
	await style.locator('.dx-card-header input').uncheck();
	const loca = page.locator('[data-repair-id="tt.loca-format"]');
	await expect(loca.getByLabel('loca representation', { exact: true })).toHaveValue('');
	await loca.locator('.dx-card-header input').check();
	await loca.getByLabel('loca representation', { exact: true }).selectOption('long');
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await apply(page);
	const longLoca = await downloaded(page, () =>
		page.getByRole('button', { name: 'Download exact candidate', exact: true }).click());
	const longBuffer = longLoca.buffer.slice(longLoca.byteOffset, longLoca.byteOffset + longLoca.byteLength);
	assert.equal(new DataView(longBuffer).getInt16(entry(longBuffer, 'head').offset + 50), 1);
	await page.getByRole('button', { name: 'Discard candidate', exact: true }).click();

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
	await page.locator('[data-repair-id="container.reserved"] .dx-card-header input').check();
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await apply(page);
	const fixedWrapper = await downloaded(page, () =>
		page.getByRole('button', { name: 'Download exact candidate', exact: true }).click());
	const expectedWrapper = new Uint8Array(wrapped.slice(0));
	expectedWrapper[14] = 0; expectedWrapper[15] = 0;
	assert.deepEqual(fixedWrapper, Buffer.from(expectedWrapper));

	const repairableCollection = FontFlux.exportCollection([makeFont(), makeFont(false, 950)]);
	const secondOffset = new DataView(repairableCollection).getUint32(16);
	new DataView(repairableCollection).setUint32(entry(repairableCollection, 'head', secondOffset).offset + 12, 0);
	await load(page, url, repairableCollection, 'repair-face.ttc');
	await page.locator('.font-chooser').selectOption('1');
	await diagnose(page);
	await page.locator('[data-repair-id="head.magic"] .dx-card-header input').check();
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await apply(page);
	const fixedCollection = await downloaded(page, () =>
		page.getByRole('button', { name: 'Download exact candidate', exact: true }).click());
	assert.equal(FontFlux.open(fixedCollection, { faceIndex: 1 }).glyphs.find((glyph) => glyph.name === 'A').advanceWidth, 950);
	const prefix = fixedCollection.subarray(0, repairableCollection.byteLength);
	const originalPrefix = Buffer.from(repairableCollection);
	for (let index = 0; index < prefix.length; index++)
		if (index < 16 || index >= 20) assert.equal(prefix[index], originalPrefix[index]);
	await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
	await page.getByRole('button', { name: 'Undo last commit', exact: true }).waitFor();
	assert((await previewWidth(page)) > 40);
	await page.getByRole('button', { name: 'Undo last commit', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Undo last commit', exact: true })).toHaveCount(0);
	await expect(page.locator('.dx-original')).toContainText('BAD_MAGIC_NUMBER');
	await page.locator('.font-chooser').selectOption('0');
	assert((await previewWidth(page)) < 35);

	await load(page, url, damaged);
	await diagnose(page);
	await reviewSafe(page);
	await page.getByRole('button', { name: 'Cancel pending work', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('cancelled');
	await expect(page.getByRole('button', { name: 'Apply plan to detached candidate', exact: true })).toHaveCount(0);
	assert.deepEqual(await downloaded(page, () =>
		page.getByRole('button', { name: 'Download original (unverified)', exact: true }).click()), Buffer.from(damaged));
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
		await expect(ranges.getByLabel('I have authority to choose these metadata values')).toHaveValue('');
		await ranges.locator('.dx-card-header input').focus();
		await page.keyboard.press('Space');
		await ranges.getByLabel('I have authority to choose these metadata values').selectOption('true');
		await page.getByRole('button', { name: 'Review repair plan', exact: true }).focus();
		await page.keyboard.press('Enter');
		await expect(page.locator('.dx-candidate')).toContainText('Policy version: OpenType-1.5-Unicode-5.1-mapped-characters-v1');
		await page.getByRole('button', { name: 'Decline plan', exact: true }).focus();
		await page.keyboard.press('Enter');
		await expect(page.getByRole('button', { name: 'Review repair plan', exact: true })).toBeFocused();
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
	await page.getByRole('button', { name: 'Preflight current project', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Commit candidate', exact: true })).toBeEnabled();
	const authoredAudit = JSON.parse(await downloaded(page, () => page.getByRole('button', { name: 'Download audit report' }).click()));
	const authoredBytes = await downloaded(page, () => page.getByRole('button', { name: 'Download exact candidate' }).click());
	assert.equal(authoredAudit.preflight.kind, 'export-preflight');
	assert.equal(authoredAudit.preflight.outputFingerprint, createHash('sha256').update(authoredBytes).digest('hex'));
	assert.equal(authoredAudit.preflight.stages[0].status, 'skipped');
	assert.equal(authoredAudit.preflight.stages[0].reasonCode, 'no-original-bytes');
	assert.equal(authoredAudit.browserPreview.state, 'loaded');

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
	await page.getByRole('button', { name: 'Preflight current project', exact: true }).click();
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
	await name.locator('.dx-card-header input').check();
	await name.getByLabel('Name ID', { exact: true }).fill('1');
	await name.getByLabel('Windows language ID', { exact: true }).fill('1033');
	await name.getByLabel('Authoritative name or rights text').fill('M2 candidate');
	await name.getByLabel('I have authority to choose these metadata values').selectOption('true');
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await apply(page);
	await page.evaluate(async (moduleURL) => {
		const { FontFlux } = await import(moduleURL), original = FontFlux.prototype.toJSON;
		FontFlux.prototype.toJSON = function (...args) {
			if (this.info.familyName === 'M2 candidate') throw new Error('Injected commit serialization failure');
			return original.apply(this, args);
		};
	}, coreURL);
	await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('Commit failed');
	assert.deepEqual(await json(page), original);
	assert.equal(await previewWidth(page), oldWidth);

	// A new download failure is visible and does not erase the existing project.
	await page.evaluate(() => {
		window.__originalCreateURL = URL.createObjectURL;
		URL.createObjectURL = () => { throw new Error('Injected download failure'); };
	});
	await page.getByRole('button', { name: 'Download exact candidate', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('Download failed');
	await page.evaluate(() => { URL.createObjectURL = window.__originalCreateURL; });
	assert.deepEqual(await json(page), original);

	const damaged = base.slice(0);
	new DataView(damaged).setUint32(entry(damaged, 'head').offset + 8, 0);
	await load(page, url, damaged);
	const before = await json(page), width = await previewWidth(page);
	await diagnose(page);
	await reviewSafe(page);
	await apply(page);
	await page.evaluate(() => {
		window.__originalAdd = document.fonts.add;
		document.fonts.add = function () { throw new Error('Injected preview registration failure'); };
	});
	await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('Commit failed');
	await expect(page.getByRole('button', { name: 'Undo last commit' })).toHaveCount(0);
	assert.deepEqual(await json(page), before);
	assert.equal(await previewWidth(page), width);
	await page.evaluate(() => { document.fonts.add = window.__originalAdd; });
	await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
	await page.getByRole('button', { name: 'Undo last commit' }).waitFor();
	const committed = await json(page);
	await page.evaluate(() => {
		window.__originalCreateURL = URL.createObjectURL;
		URL.createObjectURL = () => { throw new Error('Injected original preview resource failure'); };
	});
	await page.getByRole('button', { name: 'Undo last commit' }).click();
	await expect(page.locator('.dx-status')).toContainText('failed');
	await expect(page.getByRole('button', { name: 'Undo last commit' })).toBeVisible();
	await page.evaluate(() => { URL.createObjectURL = window.__originalCreateURL; });
	assert.deepEqual(await json(page), committed);
	assert.equal(await previewWidth(page), width);
	await page.getByRole('button', { name: 'Undo last commit' }).click();
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
	await reviewSafe(page);
	await page.getByRole('button', { name: 'Apply plan to detached candidate', exact: true }).click();
	await expect(page.locator('.dx-status')).toContainText('browser preview failed');
	await expect(page.getByRole('button', { name: 'Commit candidate', exact: true })).toBeDisabled();
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
	await page.locator('[data-repair-id="head.magic"] .dx-card-header input').check();
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await apply(page);
	await page.getByRole('button', { name: 'Commit candidate', exact: true }).click();
	await page.getByRole('button', { name: 'Revert to original project', exact: true }).click();
	await expect(page.locator('[data-repair-id="head.magic"] .dx-card-header input')).toBeEnabled();
	await expect(page.locator('.diagnose-page h2')).toBeFocused();
	assert.deepEqual(await downloaded(page, () => page.getByRole('button', { name: 'Download original (unverified)' }).click()), Buffer.from(collection));
	await editFamily(page, 'Selected temporary edit');
	await page.getByLabel('Active collection face').selectOption('0');
	assert((await previewWidth(page)) < 35);
	await editFamily(page, 'Independent peer edit');
	const peerEdit = await json(page);
	await page.getByLabel('Active collection face').selectOption('1');
	await diagnose(page);
	await page.getByRole('button', { name: 'Revert to original project', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Review repair plan', exact: true })).toBeDisabled();
	await page.getByLabel('Active collection face').selectOption('0');
	assert.deepEqual(await json(page), peerEdit);

	// Switching to a corrupt face disposes detached preview fonts and pending work.
	new DataView(collection).setUint32(second, 0x12345678);
	await load(page, url, collection, 'corrupt-peer.ttc');
	await diagnose(page);
	const rights = page.locator('[data-repair-id="rights.embedding"]');
	await rights.locator('.dx-card-header input').check();
	await rights.getByLabel('Authorized fsType bit mask').fill('4');
	await rights.getByLabel('I have authority to choose these metadata values').selectOption('true');
	await page.getByRole('button', { name: 'Review repair plan', exact: true }).click();
	await apply(page);
	assert.equal(await page.evaluate(() => [...document.fonts].filter((face) => face.family.startsWith('CandidatePreview')).length), 1);
	await page.getByLabel('Active collection face').selectOption('1');
	await expect(page.locator('.dx-original')).toContainText('BAD_SF_VERSION');
	assert.equal(await page.evaluate(() => [...document.fonts].filter((face) => face.family.startsWith('CandidatePreview')).length), 0);
	await expect(page.getByRole('button', { name: 'Commit candidate', exact: true })).toHaveCount(0);

	await load(page, url, Uint8Array.from([0, 1]), 'truncated.ttf');
	await expect(page.locator('.dx-status')).toContainText('Inspection finished');
	await expect(page.getByRole('button', { name: 'Review repair plan', exact: true })).toBeDisabled();

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
	await page.route('**/src/main.js', bootFailure);
	await page.goto(url);
	await expect(page.locator('.loading-error')).toContainText('WOFF2 initialization failed');
	await page.locator('input[type="file"]').setInputFiles({ name: 'still-supported.ttf', mimeType: 'application/octet-stream', buffer: Buffer.from(base) });
	await page.locator('.font-name').waitFor();
	await page.unroute('**/src/main.js', bootFailure);
	console.log(`${engine} M2 audits, provenance, keyboard/focus, download/commit rollback, collection revert/disposal and loader failures: passed`);
}
