// This function has no module-local dependencies: inline workers serialize the
// same handler that the dedicated, statically bundled browser entry imports.
export async function handleQualityWorkerMessage(message, send, loadCore) {
	const { operation, input, requests, serializedPlan, originalSource, options, entryURL } = message;
	let sequence = 0;
	const progress = (stage, status, origin = 'worker') => send({ type: 'progress', stage, status, origin, sequence: sequence++ });
	const run = async (stage, action) => {
		progress(stage, 'started');
		const result = await action();
		progress(stage, 'completed');
		return result;
	};
	const runCore = async (stage, action) => {
		let current;
		const result = await run(stage, () => action({
			...options,
			onProgress: ({ phase }) => {
				if (current) progress(current, 'completed', 'core');
				current = phase;
				progress(phase, 'started', 'core');
			},
		}));
		if (current) progress(current, 'completed', 'core');
		return result;
	};
	try {
		const core = await run('loading', async () => {
			const api = await loadCore(entryURL);
			if (!api) throw new Error('Public entry module must export FontFlux or default.');
			return api;
		});
		const encodedSource = operation === 'preflight' ? originalSource?.bytes : input;
		if ((encodedSource?.byteLength >= 4 && new DataView(encodedSource).getUint32(0) === 0x774f4632) ||
			(operation === 'preflight' && options.format === 'woff2')) {
			if (typeof core.initWoff2 !== 'function') throw new Error('WOFF2 requires public FontFlux.initWoff2().');
			await run('codec-initialization', () => core.initWoff2());
		}
		let result;
		if (operation === 'inspect') {
			result = await run('decode-and-traversal', () => core.inspect(input, options));
		} else if (operation === 'preflight') {
			const project = await run('project-snapshot', () => new core(input));
			result = await run('preflight', () => project.preflight({ ...options, originalSource }));
		} else if (operation === 'plan') {
			result = await runCore('planning', (controls) => core.planRepairs(input, requests, controls));
		} else if (operation === 'apply') {
			if (typeof core.resumeRepairPlan !== 'function')
				throw new Error('Public entry must expose resumeRepairPlan; reviewed decisions are never replanned as new requests.');
			const plan = await runCore('resume-reviewed-plan', (controls) => core.resumeRepairPlan(input, serializedPlan, controls));
			result = await runCore('application-and-verification', (controls) => core.applyRepairs(input, plan, controls));
		} else if (operation === 'repair') {
			const plan = await runCore('planning', (controls) => core.planRepairs(input, requests, controls));
			result = await runCore('application-and-verification', (controls) => core.applyRepairs(input, plan, controls));
		} else throw new TypeError('Unknown worker operation.');
		send({ type: 'result', result });
	} catch (error) {
		send({ type: 'error', error: { name: error.name, message: error.message, stack: error.stack, code: error.code } });
	}
}
