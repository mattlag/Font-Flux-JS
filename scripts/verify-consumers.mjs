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
import { prepareRepairContainer } from '../src/validate/repair-containers.js';
import { initBrotli as initVerificationWoff2 } from '../src/woff/woff2.js';

const root = resolve(import.meta.dirname, '..');
const local = !process.argv.includes('--installed');
assert(local || !process.argv.includes('--local'), '--installed and --local cannot be combined.');
const temporary = await mkdtemp(join(tmpdir(), 'font-flux-consumer-'));
const packageRoot = local ? root : join(temporary, 'node_modules/font-flux-js');
const packageLabel = local ? 'Local-build (package installation not tested)' : 'Installed-package';
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

function tablePayloads(buffer) {
	const bytes = new Uint8Array(buffer), view = new DataView(buffer);
	const tables = new Map();
	for (let i = 0; i < view.getUint16(4); i++) {
		const offset = 12 + i * 16;
		tables.set(String.fromCharCode(...bytes.subarray(offset, offset + 4)),
			bytes.slice(view.getUint32(offset + 8), view.getUint32(offset + 8) + view.getUint32(offset + 12)));
	}
	return tables;
}

function encodedNames(bytes) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), result = new Map();
	for (let i = 0; i < view.getUint16(2); i++) {
		const offset = 6 + i * 12;
		const key = [0, 2, 4, 6].map((delta) => view.getUint16(offset + delta)).join(',');
		const start = view.getUint16(4) + view.getUint16(offset + 10);
		assert(!result.has(key), 'Consumer fixture must have unambiguous name keys.');
		result.set(key, bytes.slice(start, start + view.getUint16(offset + 8)));
	}
	return result;
}

function decodedRepairFace(input, format, options) {
	const source = prepareRepairContainer(new Uint8Array(input), format, options);
	assert(!source.reason, source.reason);
	return source.sfnt.buffer.slice(source.sfnt.byteOffset, source.sfnt.byteOffset + source.sfnt.byteLength);
}

try {
	const npm = process.env.npm_execpath;
	assert(npm, 'Run this gate through npm run test:consumers.');
	if (!local) {
		const packed = JSON.parse(
		execFileSync(
			process.execPath,
			[npm, 'pack', '--json', '--pack-destination', temporary],
			{ cwd: root, encoding: 'utf8' },
		),
	);
	const packedPackage = Array.isArray(packed) ? packed[0] : packed['font-flux-js'];
	assert(packedPackage?.filename, 'npm pack must report the font-flux-js tarball filename.');
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
			join(temporary, packedPackage.filename),
		],
		{ cwd: temporary, stdio: 'inherit' },
	);
	}
	const typeConsumer = local ? join(root, 'test/types/consumer.ts') : join(temporary, 'consumer.ts');
	if (!local) await writeFile(typeConsumer, await readFile(join(root, 'test/types/consumer.ts')));
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
			join(packageRoot, 'font-flux.schema.json'),
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
	console.log(`${packageLabel} declarations and schema passed.`);
	const packageEntry = join(packageRoot, 'dist/font-flux-js.js');
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
	await initVerificationWoff2();
	const repairFont = api.FontFlux.create({ family: 'Repair Consumer' });
	repairFont.addGlyph({
		name: 'A', unicode: 65, advanceWidth: 500,
		path: 'M0 0 L100 400 L200 0 Z', format: 'truetype',
	});
	const repairSource = repairFont.export({ format: 'sfnt' });
	const originalShape = shape(new Uint8Array(repairSource), 'AA');
	new DataView(repairSource).setUint16(6, 0);
	const repairOriginal = repairSource.slice(0);
	const repairPlan = await api.FontFlux.planRepairs(repairSource, [{ id: 'sfnt.search-fields' }]);
	const repair = await api.FontFlux.applyRepairs(repairSource, repairPlan);
	assert.equal(repair.state, 'verified', JSON.stringify(repair.verification));
	assert.deepEqual(shape(new Uint8Array(repair.buffer), 'AA'), originalShape);
	assert.deepEqual(repairSource, repairOriginal);
	assert.equal((await repairFont.preflight({ format: 'woff2' })).state, 'verified');
	console.log(`${packageLabel} repair, source preservation, HarfBuzz, and WOFF2 preflight passed.`);
	const samples = [];
	for (const name of ['authored.ttf', 'oblegg.ttf', 'oblegg.otf', 'AdobeVFPrototype-online-test.otf', 'SegUIVar-test.ttf']) {
		const source = name === 'authored.ttf' ? repairFont.export({ format: 'sfnt' }) :
			await readFile(join(root, 'test/sample fonts', name));
		const originalSource = source instanceof ArrayBuffer ? source :
			source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
		const font = api.FontFlux.open(originalSource);
		const locations = font.axes?.length ? ['min', 'default', 'max'].map((position) =>
			Object.fromEntries(font.axes.map((axis) => [axis.tag, axis[position]]))) : [{}];
		for (const format of font.axes?.length || name === 'oblegg.ttf' ? ['sfnt'] : ['sfnt', 'woff', 'woff2', 'collection']) {
			const input = format === 'collection' ? api.FontFlux.exportCollection([font, font]) :
				format === 'sfnt' ? originalSource.slice(0) : font.export({ format });
			const options = format === 'collection' ? { faceIndex: 1 } : {};
			const before = decodedRepairFace(input, format, options);
			const baseline = new Uint8Array(input).slice();
			const request = name === 'oblegg.ttf' ? { id: 'rights.embedding', inputs: { value: 4, authority: true } } : { id: 'name.record', inputs: {
				nameID: 1, languageID: 1033, value: 'Reviewed Consumer Family', authority: true,
			} };
			const removeSignature = tablePayloads(before).has('DSIG');
			const requests = removeSignature ? [request, { id: 'dsig.remove', consent: true }] : [request];
			const plan = await api.FontFlux.planRepairs(input, requests, options);
			// A preview can be declined without changing the upload or live project.
			assert.deepEqual(new Uint8Array(input), baseline);
			const result = await api.FontFlux.applyRepairs(input, plan);
			assert.equal(result.state, 'verified', `${name}/${format}: ${JSON.stringify(result.verification)}`);
			assert.equal(result.format, format);
			assert.deepEqual(new Uint8Array(input), baseline);
			const after = decodedRepairFace(result.buffer, format, options);
			const beforeTables = tablePayloads(before), afterTables = tablePayloads(after);
			assert.deepEqual([...afterTables.keys()].sort(), [...beforeTables.keys()].filter((tag) => tag !== 'DSIG').sort());
			for (const [tag, bytes] of beforeTables) {
				if (tag === 'name' || tag === 'DSIG') continue;
				if (tag === 'head') { bytes.fill(0, 8, 12); afterTables.get(tag).fill(0, 8, 12); }
				if (tag === 'OS/2' && request.id === 'rights.embedding') {
					assert.equal(new DataView(afterTables.get(tag).buffer).getUint16(8), request.inputs.value);
					bytes.fill(0, 8, 10); afterTables.get(tag).fill(0, 8, 10);
				}
				assert.deepEqual(afterTables.get(tag), bytes, `${name}/${format}: retained ${tag}`);
			}
			const originalNames = encodedNames(beforeTables.get('name')), outputNames = encodedNames(afterTables.get('name'));
			if (request.id === 'name.record') {
				assert.equal(new TextDecoder('utf-16be').decode(outputNames.get('3,1,1033,1')), request.inputs.value);
				originalNames.delete('3,1,1033,1'); outputNames.delete('3,1,1033,1');
			}
			assert.deepEqual(outputNames, originalNames, `${name}/${format}: unselected encoded names`);
			if (format === 'collection') {
				const prefix = new Uint8Array(result.buffer).slice(0, input.byteLength);
				prefix.set(baseline.subarray(16, 20), 16);
				assert.deepEqual(prefix, baseline, `${name}: only selected face pointer may change`);
			}
			for (const coordinates of locations) {
				for (const text of ['AVATAR office', '\u0391\u03a9 \u0410\u0411 \u0627\u0644'])
					assert.deepEqual(shape(after, text, coordinates), shape(before, text, coordinates),
						`${name}/${format}: repaired glyphs, positions and paths`);
				samples.push({
					name: `repair/${name}/${format}`, coordinates,
					original: Array.from(new Uint8Array(format === 'collection' ? before : input)),
					exported: Array.from(new Uint8Array(format === 'collection' ? after : result.buffer)),
				});
			}
			const repeated = await api.FontFlux.applyRepairs(result.buffer,
				await api.FontFlux.planRepairs(result.buffer, [request], options));
			assert.equal(repeated.state, 'verified', JSON.stringify(repeated.verification));
			assert.deepEqual(decodedRepairFace(repeated.buffer, format, options), after,
				`${name}/${format}: semantic repair idempotence`);
			if (format !== 'collection') assert.equal(repeated.changed, false, `${name}/${format}: byte-level no-op`);
		}
	}
	const opaqueFont = api.FontFlux.open(await readFile(join(root, 'test/sample fonts/oblegg.ttf')));
	for (const format of ['woff', 'woff2', 'collection']) {
		const input = format === 'collection' ? api.FontFlux.exportCollection([opaqueFont, opaqueFont]) : opaqueFont.export({ format });
		const original = new Uint8Array(input).slice();
		await assert.rejects(api.FontFlux.planRepairs(input,
			[{ id: 'rights.embedding', inputs: { value: 4, authority: true } }],
			format === 'collection' ? { faceIndex: 1 } : {}), /opaque/);
		assert.deepEqual(new Uint8Array(input), original);
	}
	console.log('M1 opaque-table relocation refused; in-place SFNT retention separately verified.');
	const limitedInput = await readFile(join(root, 'test/sample fonts/SegUIVar-test.ttf'));
	const limitedOriginal = Uint8Array.from(limitedInput);
	await assert.rejects(api.FontFlux.planRepairs(limitedInput, [
		{ id: 'name.record', inputs: { nameID: 1, languageID: 1033, value: 'Must not apply', authority: true } },
		{ id: 'dsig.remove', consent: true },
	], { maxGlyphs: 1 }), /Inspection was blocked/);
	assert.deepEqual(new Uint8Array(limitedInput), limitedOriginal);
	console.log('M1 repair intentionally blocked, not counted as verified: explicit maxGlyphs limit stops inspection.');
	const derivedInput = repairFont.export({ format: 'sfnt' }), derivedBefore = derivedInput.slice(0);
	const derivedView = new DataView(derivedInput);
	for (let i = 0; i < derivedView.getUint16(4); i++) {
		const offset = 12 + i * 16;
		if (derivedView.getUint32(offset) === 0x68656164)
			derivedView.setInt16(derivedView.getUint32(offset + 8) + 36, -7);
	}
	const derived = await api.FontFlux.applyRepairs(derivedInput,
		await api.FontFlux.planRepairs(derivedInput, [{ id: 'tt.bounds' }]));
	assert.equal(derived.state, 'verified', JSON.stringify(derived.verification));
	assert.deepEqual(shape(derived.buffer, 'AA'), shape(derivedBefore, 'AA'));
	samples.push({ name: 'repair/derived-bounds', text: 'AA',
		original: Array.from(new Uint8Array(derivedBefore)), exported: Array.from(new Uint8Array(derived.buffer)) });
	const standalone = api.FontFlux.open(await readFile(join(root, 'test/sample fonts/oblegg.otf'))).export({ format: 'cff' });
	const unsupported = api.FontFlux.inspect(standalone);
	assert.equal(unsupported.diagnostics.complete, false);
	assert.equal(unsupported.profileReport.valid, null);
	assert.equal(unsupported.repairs.length, 0);
	await assert.rejects(api.FontFlux.planRepairs(standalone, [{ id: 'sfnt.checksums' }]), /unsupported|Inspection|applicable|SFNT/i);
	const converted = api.FontFlux.open(standalone).export({ format: 'sfnt' });
	const convertedRepair = await api.FontFlux.applyRepairs(converted, await api.FontFlux.planRepairs(converted, [
		{ id: 'name.record', inputs: { nameID: 1, languageID: 1033, value: 'Reviewed Converted CFF', authority: true } },
	]));
	assert.equal(convertedRepair.state, 'verified', JSON.stringify(convertedRepair.verification));
	assert.deepEqual(shape(convertedRepair.buffer, 'AVATAR office'), shape(converted, 'AVATAR office'));
	samples.push({ name: 'repair/converted-standalone-cff',
		original: Array.from(new Uint8Array(converted)), exported: Array.from(new Uint8Array(convertedRepair.buffer)) });
	console.log('M1 repaired TTF/CFF/WOFF/WOFF2/TTC/OTC, variation samples, derived bounds, decline and unsupported cases passed.');
	console.log('M1 provenance: FFJS decodes/extracts raw faces for HarfBuzz; browser checks use actual wrapper bytes, or extracted collection faces. No open/export normalization of repaired faces.');
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
		root: local ? root : temporary,
		server: { host: '127.0.0.1', port: 0 },
		optimizeDeps: { include: ['brotli-wasm'] },
		plugins: [
			{
				name: 'consumer-page',
				configureServer(vite) {
					vite.middlewares.use('/consumer', (_request, response) => {
						response.setHeader('Content-Type', 'text/html');
						response.end(
							`<!doctype html><html><body><canvas width="600" height="160"></canvas><script type="module">import * as api from "${local ? '/dist/font-flux-js.js' : '/node_modules/font-flux-js/dist/font-flux-js.js'}"; window.fontAPI = api;</script></body></html>`,
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
	console.log(`${packageLabel} Node/browser/WOFF2 checks passed.`);
} finally {
	await server?.close();
	await rm(temporary, { recursive: true, force: true });
}
