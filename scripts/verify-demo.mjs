import { chromium, firefox } from '@playwright/test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'vite';
import { FontFlux } from '../src/font_flux.js';

function makeFont(composite = false, advanceWidth = 600) {
	const font = FontFlux.create({ family: `Demo Test ${advanceWidth}` });
	font.addGlyph({
		name: 'A',
		unicode: 0x41,
		advanceWidth,
		path: 'M100 0 L100 500 L500 500 L500 0 Z',
		format: 'truetype',
	});
	font.addGlyph({
		name: 'Omega',
		unicode: 0x3a9,
		advanceWidth: 900,
		path: 'M100 0 L100 400 L400 400 L400 0 Z',
		format: 'truetype',
	});
	if (composite) {
		font.addGlyph({
			name: 'Aacute',
			unicode: 0xc1,
			advanceWidth,
			components: [{ glyphName: 'A', dx: 0, dy: 0 }],
		});
	}
	return FontFlux.open(font.export());
}

async function measure(page, text = 'A') {
	return page.evaluate(async (sample) => {
		await document.fonts.load('48px DemoLoadedFont', sample);
		const canvas = document.createElement('canvas');
		canvas.width = 160;
		canvas.height = 80;
		const context = canvas.getContext('2d');
		context.font = '48px DemoLoadedFont';
		context.fillText(sample, 10, 60);
		const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
		return {
			width: context.measureText(sample).width,
			nonblank: pixels.some((value, index) => index % 4 === 3 && value > 0),
			loaded: [...document.fonts].filter(
				(font) =>
					font.family.replaceAll('"', '') === 'DemoLoadedFont' &&
					font.status === 'loaded',
			).length,
		};
	}, text);
}

async function removeLatin(page) {
	await page.getByRole('button', { name: 'Subset', exact: true }).click();
	await page
		.locator('.subset-block')
		.filter({ hasText: 'Basic Latin' })
		.locator('input')
		.check();
	await page
		.getByRole('button', { name: 'Remove Checked Ranges', exact: true })
		.click();
}

async function downloadFont(page) {
	await page.getByRole('button', { name: 'Export Font', exact: true }).click();
	const pending = page.waitForEvent('download');
	await page.locator('.btn-download').click();
	const download = await pending;
	const chunks = [];
	for await (const chunk of await download.createReadStream())
		chunks.push(chunk);
	return FontFlux.open(Buffer.concat(chunks));
}

const server = await createServer({
	configFile: resolve('demo/vite.config.js'),
	server: { host: '127.0.0.1', port: 0, open: false },
});

try {
	await server.listen();
	const address = server.httpServer.address();
	const url = `http://127.0.0.1:${address.port}`;
	for (const [engine, browserType] of [
		['chromium', chromium],
		['firefox', firefox],
	]) {
		const browser = await browserType.launch();
		try {
			for (const viewport of [
				{ width: 1440, height: 1000 },
				{ width: 390, height: 844 },
			]) {
				for (const composite of [false, true]) {
					const page = await browser.newPage({ viewport });
					const errors = [];
					page.on('pageerror', (error) => errors.push(error.message));
					page.on('dialog', (dialog) => dialog.accept());
					await page.goto(url);
					const font = makeFont(composite);
					await page.locator('input[type="file"]').setInputFiles({
						name: 'subset.json',
						mimeType: 'application/json',
						buffer: Buffer.from(font.toJSON()),
					});
					await page.locator('.font-name').waitFor();
					const before = await measure(page);
					assert(before.nonblank && before.loaded === 1);
					await page
						.getByRole('button', { name: 'Preview', exact: true })
						.click();
					await removeLatin(page);
					if (composite) {
						await page.getByRole('alert').waitFor({ state: 'visible' });
						assert.match(
							await page.getByRole('alert').textContent(),
							/Font unchanged/,
						);
						assert.deepEqual(await measure(page), before);
					} else {
						await page.waitForFunction(
							() =>
								![...document.querySelectorAll('.subset-block')].some(
									(element) => element.textContent.includes('Basic Latin'),
								),
						);
						assert(Math.abs((await measure(page)).width - before.width) > 0.1);
						const remaining = await measure(page, '\u03a9');
						assert(remaining.nonblank && remaining.loaded === 1);
						assert(Math.abs(remaining.width - 43.2) < 0.1);
					}
					const output = await downloadFont(page);
					assert.equal(output.glyphCount, composite ? font.glyphCount : 2);
					assert.equal(
						output.glyphs.some((glyph) => glyph.unicode === 0x41),
						composite,
					);
					await page
						.getByRole('button', { name: 'Preview', exact: true })
						.click();
					const screenshot = join(
						tmpdir(),
						`font-flux-demo-${engine}-${viewport.width}-${composite ? 'rejected' : 'subset'}.png`,
					);
					assert.equal(await page.locator('.l1-tab.active').count(), 1);
					assert.equal(
						await page.locator('.l1-tab.active').textContent(),
						'Preview',
					);
					assert(
						await page.evaluate(
							() => document.documentElement.scrollWidth <= window.innerWidth,
						),
					);
					assert.match(
						await page.locator('.preview-tab').textContent(),
						new RegExp(
							`Glyph Outlines \\(\\d+ of ${output.glyphCount}\\)`,
							'i',
						),
					);
					await page.screenshot({
						path: screenshot,
						fullPage: true,
						animations: 'disabled',
					});
					assert.deepEqual(errors, []);
					console.log(
						`${engine} ${viewport.width}px ${composite ? 'rejected' : 'successful'} subset: passed; ${screenshot}`,
					);
					await page.close();
				}
			}
			const page = await browser.newPage();
			page.on('dialog', (dialog) => dialog.accept());
			await page.goto(url);
			await page.locator('input[type="file"]').setInputFiles({
				name: 'faces.ttc',
				mimeType: 'font/collection',
				buffer: Buffer.from(
					FontFlux.exportCollection([makeFont(), makeFont(false, 950)]),
				),
			});
			await page.locator('.font-chooser').selectOption('1');
			await page.waitForFunction(
				() =>
					document.querySelector('.font-chooser')?.value === '1' &&
					!document.querySelector('.font-chooser')?.disabled,
			);
			assert(Math.abs((await measure(page)).width - 45.6) < 0.1);
			await removeLatin(page);
			await page.waitForFunction(
				() =>
					![...document.querySelectorAll('.subset-block')].some((element) =>
						element.textContent.includes('Basic Latin'),
					),
			);
			const removedWidth = (await measure(page)).width;
			await page.locator('.font-chooser').selectOption('0');
			await page.waitForFunction(
				() =>
					document.querySelector('.font-chooser')?.value === '0' &&
					!document.querySelector('.font-chooser')?.disabled,
			);
			assert(Math.abs((await measure(page)).width - 28.8) < 0.1);
			await page.locator('.font-chooser').selectOption('1');
			await page.waitForFunction(
				() =>
					document.querySelector('.font-chooser')?.value === '1' &&
					!document.querySelector('.font-chooser')?.disabled,
			);
			assert(Math.abs((await measure(page)).width - removedWidth) < 0.1);
			assert.equal((await downloadFont(page)).glyphCount, 2);
			console.log(`${engine} collection preview switching: passed`);
			await page.close();
		} finally {
			await browser.close();
		}
	}
} finally {
	await server.close();
}
