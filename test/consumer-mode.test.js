import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { execFileSync, checkpoint } = vi.hoisted(() => ({
	execFileSync: vi.fn(),
	checkpoint: new Error('Reached declaration verification'),
}));

vi.mock('node:child_process', async (importOriginal) => ({
	...await importOriginal(),
	execFileSync,
}));

const originalArgv = process.argv;

beforeEach(() => {
	vi.resetModules();
	vi.stubEnv('npm_execpath', 'consumer-test-npm');
	execFileSync.mockReset().mockImplementation((_command, args) => {
		if (args[1] === 'pack') return JSON.stringify([{ filename: 'font-flux-js-test.tgz' }]);
		if (args[1] === 'install') return '';
		// Stop before the unchanged, expensive font matrix.
		throw checkpoint;
	});
});

afterEach(() => {
	process.argv = originalArgv;
	vi.unstubAllEnvs();
});

it.each([
	{ label: 'default', flags: [] },
	{ label: 'explicit local', flags: ['--local'] },
])('verifies the existing distribution without installing ($label)', async ({ flags }) => {
	process.argv = [process.execPath, 'verify-consumers.mjs', ...flags];
	await expect(import('../scripts/verify-consumers.mjs')).rejects.toBe(checkpoint);
	expect(execFileSync).toHaveBeenCalledTimes(1);
	expect(execFileSync.mock.calls[0][1][0]).toMatch(/typescript[/\\]bin[/\\]tsc$/);
});

it('installs only with explicit --installed opt-in', async () => {
	process.argv = [process.execPath, 'verify-consumers.mjs', '--installed'];
	await expect(import('../scripts/verify-consumers.mjs')).rejects.toBe(checkpoint);
	expect(execFileSync).toHaveBeenCalledTimes(3);
	expect(execFileSync.mock.calls[0][1].slice(0, 2)).toEqual(['consumer-test-npm', 'pack']);
	expect(execFileSync.mock.calls[1][1].slice(0, 2)).toEqual(['consumer-test-npm', 'install']);
	expect(execFileSync.mock.calls[2][1][0]).toMatch(/typescript[/\\]bin[/\\]tsc$/);
});

it('rejects conflicting installation modes before starting any command', async () => {
	process.argv = [process.execPath, 'verify-consumers.mjs', '--local', '--installed'];
	await expect(import('../scripts/verify-consumers.mjs')).rejects.toThrow('--installed and --local cannot be combined');
	expect(execFileSync).not.toHaveBeenCalled();
});
