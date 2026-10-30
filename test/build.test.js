import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { expect, test } from 'vitest';

test('library bundle starts with the project, version, and copyright banner', async () => {
	const pkg = JSON.parse(
		readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
	);
	const result = await build({
		configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
		logLevel: 'silent',
		build: { write: false },
	});
	const outputs = Array.isArray(result) ? result : [result];
	const chunks = outputs.flatMap((output) =>
		output.output.filter((file) => file.type === 'chunk'),
	);
	expect(chunks).toHaveLength(1);
	expect(chunks[0].fileName).toBe('font-flux-js.js');
	const banner = chunks[0].code.match(/^\/\*![\s\S]*?\*\//)?.[0];
	expect(banner?.split('\n').map((line) => line.trim())).toEqual([
		'/*!',
		`* Font Flux JS v${pkg.version}`,
		`* Copyright (c) 2026 ${pkg.author}`,
		`* Licensed under ${pkg.license}. See LICENSE for details.`,
		'*/',
	]);
});
