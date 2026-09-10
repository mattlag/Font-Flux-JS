import { chromium, firefox } from '@playwright/test';
import Ajv2020 from 'ajv/dist/2020.js';
import * as hb from 'harfbuzzjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import { parse as parseYAML } from 'yaml';

const root = resolve(import.meta.dirname, '..');
const temporary = await mkdtemp(join(tmpdir(), 'font-flux-consumer-'));
let server;

function shape(bytes, text, coordinates = {}) {
	const blob = new hb.Blob(bytes);
	const face = new hb.Face(blob);
	const font = new hb.Font(face);
	font.setVariations(
		Object.entries(coordinates).map(
			([tag, value]) => new hb.Variation(tag, value),
		),
	);
	const buffer = new hb.Buffer();
	buffer.addText(text);
	buffer.guessSegmentProperties();
	hb.shape(font, buffer);
	return {
		infos: buffer.getGlyphInfos(),
		positions: buffer.getGlyphPositions(),
		paths: buffer
			.getGlyphInfos()
			.map((info) => font.glyphToPath(info.codepoint)),
	};
}

try {
	const npm = process.env.npm_execpath;
	assert(npm, 'Run this gate through npm run test:consumers.');
	const packed = JSON.parse(
		execFileSync(
			process.execPath,
			[npm, 'pack', '--json', '--pack-destination', temporary],
			{ cwd: root, encoding: 'utf8' },
		),
	);
	await writeFile(
		join(temporary, 'package.json'),
		JSON.stringify({ private: true, type: 'module' }),
	);
	execFileSync(
		process.execPath,
		[
			npm,
			'install',
			'--ignore-scripts',
			'--no-audit',
			'--no-fund',
			join(temporary, packed[0].filename),
		],
		{ cwd: temporary, stdio: 'inherit' },
	);
	const typeConsumer = join(temporary, 'consumer.ts');
	await writeFile(
		typeConsumer,
		await readFile(join(root, 'test/types/consumer.ts')),
	);
	execFileSync(
		process.execPath,
		[
			join(root, 'node_modules/typescript/bin/tsc'),
			'--noEmit',
			'--strict',
			'--target',
			'es2022',
			'--module',
			'nodenext',
			typeConsumer,
		],
		{ cwd: temporary, stdio: 'inherit' },
	);
	const schema = JSON.parse(
		await readFile(
			join(temporary, 'node_modules/font-flux-js/font-flux.schema.json'),
			'utf8',
		),
	);
	assert.equal(schema.properties._schemaVersion.const, 1);
	const validateDocument = new Ajv2020({ strict: false }).compile(schema);
	for (const workflow of ['test.yml', 'release.yml'])
		assert(
			parseYAML(
				await readFile(join(root, '.github/workflows', workflow), 'utf8'),
			).jobs,
		);
	console.log('Installed-package declarations and schema passed.');
	const packageEntry = join(
		temporary,
		'node_modules/font-flux-js/dist/font-flux-js.js',
	);
	const api = await import(pathToFileURL(packageEntry).href);
	assert.deepEqual(
		Object.keys(api).sort(),
		[
			'FontFlux',
			'diagnoseFont',
			'fontFromJSON',
			'fontToJSON',
			'initWoff2',
		].sort(),
	);
	await api.initWoff2();
	const samples = [];
	for (const name of [
		'oblegg.ttf',
		'oblegg.otf',
		'AdobeVFPrototype-online-test.otf',
		'SegUIVar-test.ttf',
	]) {
		const bytes = await readFile(join(root, 'test/sample fonts', name));
		const original = bytes.buffer.slice(
			bytes.byteOffset,
			bytes.byteOffset + bytes.byteLength,
		);
		const axes = api.FontFlux.open(original).axes || [];
		const coordinates = axes.length
			? ['min', 'default', 'max'].map((position) =>
					Object.fromEntries(axes.map((axis) => [axis.tag, axis[position]])),
				)
			: [{}];
		for (const operation of ['noop', 'metadata', 'validate', 'json']) {
			let font = api.FontFlux.open(original);
			if (operation === 'metadata') font.info.familyName += ' Consumer Test';
			if (operation === 'validate') font.validate();
			if (operation === 'json') font = api.FontFlux.fromJSON(font.toJSON());
			for (const format of ['sfnt', 'woff', 'woff2']) {
				const exported = font.export({ format });
				const sfnt =
					format === 'sfnt'
						? exported
						: api.FontFlux.open(exported).export({ format: 'sfnt' });
				for (const location of coordinates) {
					for (const text of [
						'AVATAR office affine',
						'\u0391\u03a9 \u0410\u0411 \u0627\u0644',
					])
						assert.deepEqual(
							shape(sfnt, text, location),
							shape(original, text, location),
							`${name}/${operation}/${format}/${JSON.stringify(location)}: first-export semantics changed`,
						);
					samples.push({
						name: `${name}/${operation}/${format}`,
						coordinates: location,
						original: Array.from(new Uint8Array(original)),
						exported: Array.from(new Uint8Array(exported)),
					});
				}
			}
		}
		console.log(
			`HarfBuzz original-first container/operation/variation matrix passed: ${name}`,
		);
	}
	const mutationSource = api.FontFlux.create({ family: 'Mutation Consumer' });
	for (const [name, unicode] of [
		['unused', null],
		['A', 65],
		['V', 86],
		['f', 102],
		['i', 105],
		['fi', null],
	])
		mutationSource.addGlyph({
			name,
			unicode,
			advanceWidth: 600,
			path: 'M50 0 L300 700 L550 0 Z',
			format: 'truetype',
		});
	mutationSource.addKerning([{ left: 'A', right: 'V', value: -80 }]);
	mutationSource.addSubstitution({
		type: 'ligature',
		feature: 'liga',
		substitution: { components: ['f', 'i'], ligature: 'fi' },
	});
	const mutationOriginal = mutationSource.export({ format: 'sfnt' });
	for (const operation of [
		'glyph-edit',
		'glyph-add',
		'glyph-remove',
		'clear-kerning',
		'clear-substitutions',
	]) {
		const font = api.FontFlux.open(mutationOriginal);
		const expected = api.FontFlux.fromJSON(mutationSource.toJSON());
		for (const candidate of [font, expected]) {
			if (operation === 'glyph-edit')
				for (const contour of candidate.glyphs.find(
					(glyph) => glyph.name === 'A',
				).contours)
					for (const point of contour) point.y *= 0.5;
			if (operation === 'glyph-add')
				candidate.addGlyph({
					name: 'Z',
					unicode: 90,
					advanceWidth: 700,
					path: 'M0 0 L500 0 L500 500 Z',
					format: 'truetype',
				});
			if (operation === 'glyph-remove') candidate.removeGlyph('unused');
			if (operation === 'clear-kerning') candidate.clearKerning();
			if (operation === 'clear-substitutions') candidate.clearSubstitutions();
		}
		const expectedBytes = expected.export({ format: 'sfnt' });
		const before = shape(mutationOriginal, 'AV fi');
		const after = shape(expectedBytes, 'AV fi');
		if (operation === 'glyph-edit')
			assert.notDeepEqual(after.paths, before.paths);
		if (operation === 'clear-kerning')
			assert.notDeepEqual(after.positions, before.positions);
		if (operation === 'clear-substitutions')
			assert.equal(after.infos.length, before.infos.length + 1);
		for (const format of ['sfnt', 'woff', 'woff2']) {
			const exported = font.export({ format });
			const sfnt =
				format === 'sfnt'
					? exported
					: api.FontFlux.open(exported).export({ format: 'sfnt' });
			assert.deepEqual(
				shape(sfnt, 'AV fi Z'),
				shape(expectedBytes, 'AV fi Z'),
				`${operation}/${format}: edited semantics changed`,
			);
			samples.push({
				name: `authored/${operation}/${format}`,
				original: Array.from(new Uint8Array(expectedBytes)),
				exported: Array.from(new Uint8Array(exported)),
			});
		}
	}
	const variationSource = api.FontFlux.open(mutationOriginal);
	const variationCmap = variationSource.tables.cmap;
	variationCmap.encodingRecords.push({
		platformID: 0,
		encodingID: 5,
		subtableIndex: variationCmap.subtables.length,
	});
	const variantGlyph = variationSource.glyphs.findIndex(
		(glyph) => glyph.name === 'V',
	);
	variationCmap.subtables.push({
		format: 14,
		varSelectorRecords: [
			{
				varSelector: 0xfe0f,
				defaultUVS: [{ startUnicodeValue: 32, additionalCount: 0 }],
				nonDefaultUVS: [{ unicodeValue: 65, glyphID: variantGlyph }],
			},
		],
	});
	const variationOriginal = variationSource.export({ format: 'sfnt' });
	assert.equal(
		shape(variationOriginal, 'A\ufe0f').infos[0].codepoint,
		variantGlyph,
	);
	const compositeSource = api.FontFlux.open(mutationOriginal);
	compositeSource.getGlyph('A').instructions = [0xb0, 0, 0x21];
	compositeSource.tables.maxp.maxStackElements = 1;
	compositeSource.addGlyph({
		name: 'A.comp',
		advanceWidth: 600,
		components: [{ glyphName: 'A', dx: 20, dy: 0 }],
	});
	compositeSource.addGlyph({
		name: 'A.nested',
		unicode: 0xc1,
		advanceWidth: 600,
		components: [{ glyphName: 'A.comp', dx: 0, dy: 20 }],
	});
	const compositeOriginal = compositeSource.export({ format: 'sfnt' });
	for (const [name, original, text] of [
		['uvs', variationOriginal, 'A\ufe0f V'],
		['hinted-composite', compositeOriginal, '\u00c1 A'],
	]) {
		const font = api.FontFlux.open(original);
		font.info.familyName += ' Consumer';
		font.validate();
		for (const format of ['sfnt', 'woff', 'woff2']) {
			const exported = api.FontFlux.fromJSON(font.toJSON()).export({ format });
			const sfnt =
				format === 'sfnt'
					? exported
					: api.FontFlux.open(exported).export({ format: 'sfnt' });
			assert.deepEqual(
				shape(sfnt, text),
				shape(original, text),
				`${name}/${format}`,
			);
			samples.push({
				name: `${name}/${format}`,
				text,
				original: Array.from(new Uint8Array(original)),
				exported: Array.from(new Uint8Array(exported)),
			});
		}
	}
	const collection = api.FontFlux.exportCollection([
		mutationSource,
		api.FontFlux.open(mutationOriginal),
	]);
	for (const face of api.FontFlux.openAll(collection)) {
		const exported = face.export({ format: 'sfnt' });
		assert.deepEqual(
			shape(exported, 'AV fi'),
			shape(mutationOriginal, 'AV fi'),
		);
		samples.push({
			name: 'collection/selected-face',
			original: Array.from(new Uint8Array(mutationOriginal)),
			exported: Array.from(new Uint8Array(exported)),
		});
	}
	const cffSource = api.FontFlux.open(
		await readFile(join(root, 'test/sample fonts/oblegg.otf')),
	);
	const bareCFF = api.FontFlux.open(cffSource.export({ format: 'cff' }));
	const bareBefore = bareCFF.export({ format: 'sfnt' });
	bareCFF.info.familyName += ' Consumer';
	const bareAfter = api.FontFlux.fromJSON(bareCFF.toJSON()).export({
		format: 'sfnt',
	});
	assert.deepEqual(
		shape(bareAfter, 'AVATAR office'),
		shape(bareBefore, 'AVATAR office'),
	);
	samples.push({
		name: 'bare-cff/metadata-json',
		original: Array.from(new Uint8Array(bareBefore)),
		exported: Array.from(new Uint8Array(bareAfter)),
	});
	console.log(
		'HarfBuzz authored mutations, collection faces, and standalone CFF checks passed.',
	);
	const created = api.FontFlux.create({ family: 'Packed Authoring' });
	assert(
		validateDocument(JSON.parse(created.toJSON())),
		JSON.stringify(validateDocument.errors),
	);
	const invalid = JSON.parse(created.toJSON());
	invalid.glyphs[0].advanceWidth = -1;
	assert.equal(validateDocument(invalid), false);
	created.addGlyph({
		name: 'A',
		unicode: 65,
		advanceWidth: 600,
		path: 'M50 0 L300 700 L550 0 Z',
		format: 'truetype',
	});
	assert.equal(
		api.FontFlux.open(created.export({ format: 'woff2' })).glyphCount,
		created.glyphCount,
	);
	server = await createServer({
		configFile: false,
		root: temporary,
		server: { host: '127.0.0.1', port: 0 },
		optimizeDeps: { include: ['brotli-wasm'] },
		plugins: [
			{
				name: 'consumer-page',
				configureServer(vite) {
					vite.middlewares.use('/consumer', (_request, response) => {
						response.setHeader('Content-Type', 'text/html');
						response.end(
							'<!doctype html><html><body><canvas width="600" height="160"></canvas><script type="module">import * as api from "/node_modules/font-flux-js/dist/font-flux-js.js"; window.fontAPI = api;</script></body></html>',
						);
					});
				},
			},
		],
	});
	await server.listen();
	const address = server.httpServer.address();
	for (const engine of [chromium, firefox]) {
		const browser = await engine.launch();
		try {
			const page = await browser.newPage();
			page.on('pageerror', (error) =>
				console.error(`${engine.name()} page error: ${error.message}`),
			);
			page.on('console', (message) => {
				if (message.type() === 'error')
					console.error(`${engine.name()}: ${message.text()}`);
			});
			page.on('requestfailed', (request) =>
				console.error(
					`${engine.name()} request failed: ${request.url()} ${request.failure()?.errorText}`,
				),
			);
			await page.goto(`http://127.0.0.1:${address.port}/consumer`);
			await page.waitForFunction(() => !!window.fontAPI);
			await page.evaluate(async () => {
				const { FontFlux, initWoff2 } = window.fontAPI;
				await initWoff2();
				const font = FontFlux.create({ family: 'Browser WOFF2' });
				const reopened = FontFlux.open(font.export({ format: 'woff2' }));
				if (reopened.glyphCount !== font.glyphCount)
					throw new Error('Browser WOFF2 round-trip failed.');
			});
			for (const [sampleIndex, sample] of samples.entries()) {
				const result = await page.evaluate(
					async ({
						original,
						exported,
						coordinates,
						sampleIndex,
						text = 'AVATAR office',
					}) => {
						const widths = [];
						for (const [index, bytes] of [original, exported].entries()) {
							const family = `Consumer${sampleIndex}_${index}`;
							const face = await new FontFace(family, new Uint8Array(bytes), {
								variationSettings:
									Object.entries(coordinates || {})
										.map(([tag, value]) => `"${tag}" ${value}`)
										.join(', ') || 'normal',
							}).load();
							document.fonts.add(face);
							const canvas = document.querySelector('canvas');
							const context = canvas.getContext('2d');
							context.clearRect(0, 0, canvas.width, canvas.height);
							context.font = `48px ${family}`;
							context.fillText(text, 10, 70);
							const pixels = context.getImageData(
								0,
								0,
								canvas.width,
								canvas.height,
							).data;
							if (
								!pixels.some(
									(value, position) => position % 4 === 3 && value > 0,
								)
							)
								throw new Error('Font rendered blank.');
							widths.push(context.measureText(text).width);
							document.fonts.delete(face);
						}
						return widths;
					},
					{ ...sample, sampleIndex },
				);
				assert(
					Math.abs(result[0] - result[1]) < 0.1,
					`${engine.name()} ${sample.name}/${JSON.stringify(sample.coordinates)}: advance widths changed ${result[0]} -> ${result[1]}`,
				);
				console.log(
					`${engine.name()} sanitizer/load/render passed: ${sample.name}`,
				);
			}
		} finally {
			await browser.close();
		}
	}
	console.log('Installed-package Node/browser/WOFF2 checks passed.');
} finally {
	await server?.close();
	await rm(temporary, { recursive: true, force: true });
}
