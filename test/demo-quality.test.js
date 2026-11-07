import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { candidateExtension, preflightAudit } from '../demo/src/quality-report.js';

describe('M2 export evidence', () => {
	it.each(['test', 'release'])('gates %s CI on the complete Demo workflows', (name) => {
		const workflow = parse(readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8'));
		const steps = workflow.jobs[name].steps;
		const gate = steps.findIndex((step) => step.run === 'npm run test:demo');
		const browsers = steps.findIndex((step) => step.run?.includes('playwright install'));
		expect(browsers).toBeGreaterThan(-1);
		expect(gate).toBeGreaterThan(browsers);
		if (name === 'release') expect(gate).toBeLessThan(steps.findIndex((step) => step.run?.startsWith('npm publish')));
	});

	it('retains failed and partial preflight evidence without embedding candidate bytes', async () => {
		const font = FontFlux.create({ family: 'M2 audit' });
		const result = await font.preflight({ format: 'sfnt' });
		const audit = await preflightAudit(result, { target: 'sfnt', profile: 'structural', fileName: 'chosen.ttf', sourceFaceIndex: 2 });
		expect(audit).not.toHaveProperty('buffer');
		expect(audit.outputFingerprint).toBe(createHash('sha256').update(new Uint8Array(result.buffer)).digest('hex'));
		expect(audit.stages).toEqual(result.stages);
		expect(audit.normalizations).toEqual(result.normalizations);
		expect(audit).toMatchObject({ faceIndex: 0, sourceFaceIndex: 2, scope: 'selected-project-face', fileName: 'chosen.ttf' });
		const failed = await preflightAudit({ ...result, state: 'failed', output: null, buffer: null, error: 'Rejected' }, { target: 'woff', profileVersion: 1 });
		expect(failed).toMatchObject({ state: 'failed', outputFingerprint: null, error: 'Rejected', target: 'woff', profileVersion: 1 });
		expect(result.buffer.byteLength).toBeGreaterThan(0);
	});

	it('names verified bytes according to their actual outline and container format', async () => {
		await FontFlux.initWoff2();
		const font = FontFlux.create({ family: 'M2 filenames' });
		const ttf = font.export({ format: 'ttf' }), otf = font.export({ format: 'otf' });
		expect(candidateExtension(ttf, 'sfnt')).toBe('.ttf');
		expect(candidateExtension(otf, 'sfnt')).toBe('.otf');
		expect(candidateExtension(FontFlux.exportCollection([FontFlux.open(ttf), FontFlux.open(ttf)]), 'collection')).toBe('.ttc');
		expect(candidateExtension(FontFlux.exportCollection([FontFlux.open(ttf), FontFlux.open(otf)]), 'collection')).toBe('.otc');
		for (const format of ['woff', 'woff2'])
			expect(candidateExtension(font.export({ format }), format)).toBe(`.${format}`);
		expect(() => candidateExtension(ttf, 'unknown')).toThrow(/No verified/);
	});
});
