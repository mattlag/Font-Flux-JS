import { abortError, positiveLimit, snapshotBytes } from './workflow-common.js';
import { handleQualityWorkerMessage } from './workflow-worker-runtime.js';
import {
	contentFingerprint, fingerprintRepairPlan, inspectionCacheIdentity, lookupInspection,
	projectSnapshotText, snapshotProject, snapshotRepairPlan, storeInspection,
} from './workflow-cache.js';

export { createInspectionCache, fingerprintRepairPlan } from './workflow-cache.js';

// Node/direct-module workers and bundler-managed browser workers share one
// protocol implementation; only loading and transport differ.
const WORKER_SOURCE = `
let send, listen;
if (typeof process !== 'undefined' && process.versions?.node) {
	const { parentPort } = await import('node:worker_threads');
	send = (message) => parentPort.postMessage(message);
	listen = (handler) => parentPort.once('message', handler);
} else {
	send = (message) => self.postMessage(message);
	listen = (handler) => { self.onmessage = (event) => handler(event.data); };
}
const handle = (${handleQualityWorkerMessage.toString()});
listen((message) => handle(message, send, async (entryURL) => {
	const module = await import(entryURL);
	return module.FontFlux ?? module.default;
}));
`;

function workerError(message, cause) {
	const error = new Error(message, cause ? { cause } : undefined);
	error.name = 'QualityWorkerError';
	return error;
}

function deadlineError(maxDurationMs) {
	const error = workerError(`Font quality operation exceeded maxDurationMs (${maxDurationMs}); no result committed.`);
	error.code = 'QUALITY_WORKER_DEADLINE';
	return error;
}

function controlled(promise, signal, deadline, maxDurationMs) {
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (error, value) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			signal?.removeEventListener('abort', abort);
			if (!error && performance.now() >= deadline) error = deadlineError(maxDurationMs);
			error ? reject(error) : resolve(value);
		};
		const abort = () => finish(abortError());
		const timer = setTimeout(() => finish(deadlineError(maxDurationMs)), Math.max(0, deadline - performance.now()));
		signal?.addEventListener('abort', abort, { once: true });
		if (signal?.aborted) abort();
		Promise.resolve(promise).then((value) => finish(null, value), (error) => finish(error));
	});
}

function assertUnchanged(input, snapshot) {
	try {
		const current = input instanceof ArrayBuffer ? new Uint8Array(input)
			: new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
		const baseline = new Uint8Array(snapshot);
		if (current.length !== baseline.length) throw new Error('Source byte length changed.');
		for (let index = 0; index < current.length; index++)
			if (current[index] !== baseline[index]) throw new Error('Source bytes changed.');
	} catch (cause) {
		const error = workerError('Caller input changed during quality execution; stale result discarded.', cause);
		error.code = 'QUALITY_WORKER_STALE_INPUT';
		throw error;
	}
}

function stalePlan(message) {
	const error = workerError(message);
	error.code = 'QUALITY_WORKER_STALE_PLAN';
	return error;
}

/**
 * Run the synchronous core in an actual disposable worker. Input snapshots are
 * copied (never transferred from the caller), and every terminal path terminates
 * the worker. Deadline includes startup; VM heap limits are not RSS limits.
 */
export async function runQualityWorker(operation, input, options = {}) {
	const started = performance.now();
	if (!['inspect', 'repair', 'plan', 'apply', 'preflight'].includes(operation)) throw new TypeError('Unknown worker operation.');
	const {
		entryURL, browserWorkerFactory, signal, onProgress, requests, maxDurationMs = 30000,
		workerResourceLimits, cache, serializedPlan, reviewedPlanFingerprint, reviewedEntryURL,
		maxPlanBytes, originalSource, maxProjectBytes, ...coreOptions
	} = options;
	const deadline = started + maxDurationMs;
	if (signal?.aborted) throw abortError();
	if (cache !== undefined && operation !== 'inspect') throw new TypeError('Inspection cache cannot be used for planning or repair.');
	if (operation === 'apply' && requests !== undefined) throw new TypeError('Apply uses the reviewed serialized plan, never replacement requests.');
	if (onProgress !== undefined && typeof onProgress !== 'function') throw new TypeError('onProgress must be a function.');
	positiveLimit({ maxDurationMs }, 'maxDurationMs', 30000);
	if (maxDurationMs > 0x7fffffff) throw new RangeError('maxDurationMs exceeds the supported timer range.');
	let url;
	try { url = new URL(entryURL); } catch { throw new TypeError('A trusted absolute public entryURL is required.'); }
	if (!['file:', 'http:', 'https:'].includes(url.protocol)) throw new TypeError('entryURL must use file, http or https.');
	const project = operation === 'preflight' ? snapshotProject(input, { maxProjectBytes }) : null;
	const snapshot = project ? project.data : snapshotBytes(input, options).buffer;
	let sourceSnapshot, sourceOptionsText, projectFingerprint, originalInputFingerprint;
	if (project) {
		if (originalSource !== undefined) {
			if (!originalSource || !originalSource.bytes) throw new TypeError('originalSource requires bytes and optional import options.');
			sourceOptionsText = projectSnapshotText(originalSource.options ?? {}, { maxProjectBytes });
			sourceSnapshot = { bytes: snapshotBytes(originalSource.bytes, options).buffer, options: structuredClone(originalSource.options ?? {}) };
		}
		[projectFingerprint, originalInputFingerprint] = await controlled(Promise.all([
			contentFingerprint(new TextEncoder().encode(project.text)),
			sourceSnapshot ? contentFingerprint(sourceSnapshot.bytes) : Promise.resolve(null),
		]), signal, deadline, maxDurationMs);
	}
	const assertCurrentInputs = () => {
		if (!project) { assertUnchanged(input, snapshot); return; }
		try {
			if (projectSnapshotText(input, { maxProjectBytes }) !== project.text) throw new Error('Project contents changed.');
		} catch (cause) {
			const error = workerError('Caller project changed during preflight; stale candidate discarded.', cause);
			error.code = 'QUALITY_WORKER_STALE_PROJECT';
			throw error;
		}
		if (sourceSnapshot || options.originalSource !== originalSource) {
			try {
				if (options.originalSource !== originalSource || projectSnapshotText(originalSource.options ?? {}, { maxProjectBytes }) !== sourceOptionsText)
					throw new Error('Original source/options changed.');
				assertUnchanged(originalSource.bytes, sourceSnapshot.bytes);
			} catch (cause) {
				const error = workerError('Retained original source changed during preflight; stale candidate discarded.', cause);
				error.code = 'QUALITY_WORKER_STALE_SOURCE';
				throw error;
			}
		}
	};
	let planSnapshot, planFingerprint;
	if (operation === 'apply') {
		if (typeof reviewedPlanFingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(reviewedPlanFingerprint))
			throw new TypeError('Applying a serialized plan requires its persisted reviewedPlanFingerprint.');
		if (reviewedEntryURL !== undefined && reviewedEntryURL !== url.href)
			throw stalePlan('The reviewed public entry URL changed.');
		planSnapshot = snapshotRepairPlan(serializedPlan, { maxPlanBytes });
		const [digest, inputFingerprint] = await controlled(Promise.all([
			fingerprintRepairPlan(planSnapshot.plan, { maxPlanBytes }), contentFingerprint(snapshot),
		]), signal, deadline, maxDurationMs);
		planFingerprint = digest;
		if (digest !== reviewedPlanFingerprint) throw stalePlan('Reviewed repair plan content changed; review the new plan explicitly.');
		if (inputFingerprint !== planSnapshot.plan.inputFingerprint) throw stalePlan('Reviewed plan input fingerprint does not match the current source.');
	}
	let payload;
	try { payload = structuredClone({ operation, input: snapshot, requests, serializedPlan: planSnapshot?.plan, originalSource: sourceSnapshot, options: coreOptions, entryURL: url.href }); }
	catch (error) { throw workerError('Worker options/requests must be structured-cloneable (callbacks belong in onProgress).', error); }
	let identity, cached;
	if (cache !== undefined) {
		identity = await controlled(inspectionCacheIdentity(cache, snapshot, url.href, {
			options: payload.options, maxDurationMs, workerResourceLimits,
		}), signal, deadline, maxDurationMs);
		cached = lookupInspection(cache, identity);
		if (cached.report) {
			await controlled(Promise.resolve().then(() => onProgress?.({
				operation, stage: 'cache', status: 'hit', origin: 'cache', sequence: 0,
			})), signal, deadline, maxDurationMs);
			assertCurrentInputs();
			if (performance.now() >= deadline) throw deadlineError(maxDurationMs);
			return {
				...cached.report,
				cache: { ...identity, ...cached.provenance, status: 'hit', workerStarted: false, fingerprintFreshlyComputed: true },
			};
		}
	}
	const isNode = typeof process !== 'undefined' && !!process.versions?.node;
	let WorkerClass;
	if (isNode) {
		// Avoid eager Node built-ins in browser bundles.
		const moduleName = 'node:worker_threads';
		try { ({ Worker: WorkerClass } = await controlled(import(/* @vite-ignore */ moduleName), signal, deadline, maxDurationMs)); }
		catch (error) {
			if (error.name === 'AbortError' || error.code === 'QUALITY_WORKER_DEADLINE') throw error;
			throw workerError('Node worker_threads is unavailable; no main-thread fallback was run.', error);
		}
	} else {
		WorkerClass = globalThis.Worker;
		if (browserWorkerFactory !== undefined && typeof browserWorkerFactory !== 'function')
			throw new TypeError('browserWorkerFactory must synchronously return a new dedicated Worker.');
		if (browserWorkerFactory === undefined &&
			(typeof WorkerClass !== 'function' || typeof globalThis.Blob !== 'function' || !globalThis.URL?.createObjectURL))
			throw workerError('Module workers are unavailable; no main-thread fallback was run.');
		if (workerResourceLimits !== undefined)
			throw new TypeError('workerResourceLimits are Node VM limits, not browser resource caps.');
	}
	if (workerResourceLimits !== undefined) {
		for (const [key, value] of Object.entries(workerResourceLimits)) {
			if (!['maxOldGenerationSizeMb', 'maxYoungGenerationSizeMb', 'codeRangeSizeMb', 'stackSizeMb'].includes(key) ||
				!Number.isFinite(value) || value <= 0) throw new RangeError(`Invalid worker resource limit ${key}.`);
		}
	}
	if (signal?.aborted) throw abortError();
	if (performance.now() >= deadline) throw deadlineError(maxDurationMs);
	const result = await new Promise((resolve, reject) => {
		let worker, blobURL, timer, settled = false, receivedResult = false, callbackChain = Promise.resolve();
		const cleanup = async () => {
			clearTimeout(timer);
			signal?.removeEventListener('abort', onAbort);
			try { if (typeof worker?.terminate === 'function') await worker.terminate(); }
			finally { if (blobURL) URL.revokeObjectURL(blobURL); }
		};
		const settle = (error, result) => {
			if (settled) return;
			settled = true;
			cleanup().then(() => error ? reject(error) : resolve(result), (cleanupError) => reject(error || cleanupError));
		};
		const onAbort = () => settle(abortError());
		timer = setTimeout(() => settle(deadlineError(maxDurationMs)), Math.max(0, deadline - performance.now()));
		try {
			if (isNode) {
				worker = new WorkerClass(new URL(`data:text/javascript,${encodeURIComponent(WORKER_SOURCE)}`), {
					type: 'module', resourceLimits: workerResourceLimits,
					// CLI --input-type cannot be inherited by a module-file worker.
					execArgv: process.execArgv.filter((arg) => !arg.startsWith('--input-type')),
				});
			} else if (browserWorkerFactory !== undefined) {
				worker = browserWorkerFactory();
				if (!worker || typeof worker.postMessage !== 'function' || typeof worker.terminate !== 'function')
					throw new TypeError('browserWorkerFactory must synchronously return a new dedicated Worker.');
			} else {
				blobURL = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }));
				worker = new WorkerClass(blobURL, { type: 'module' });
			}
			if (signal?.aborted) throw abortError();
			if (performance.now() >= deadline) throw deadlineError(maxDurationMs);
			const message = (event) => {
				if (settled) return;
				if (event.type === 'progress') {
					const progress = { operation, stage: event.stage, status: event.status, origin: event.origin, sequence: event.sequence };
					callbackChain = callbackChain.then(() => {
						if (!settled) return onProgress?.(progress);
					}).catch((error) => settle(error));
				} else if (event.type === 'error') {
					const error = new Error(event.error.message);
					Object.assign(error, event.error);
					settle(error);
				} else if (event.type === 'result') {
					receivedResult = true;
					callbackChain.then(() => {
						if (settled) return;
						if (signal?.aborted) { settle(abortError()); return; }
						settle(null, event.result);
					});
				}
			};
			if (isNode) {
				worker.on('message', message);
				worker.once('error', (error) => settle(workerError('Font quality worker failed; no main-thread fallback was run.', error)));
				worker.once('exit', (code) => {
					if (!settled && !receivedResult) settle(workerError(`Font quality worker exited without a result (code ${code}).`));
				});
			} else {
				worker.onmessage = (event) => message(event.data);
				worker.onerror = (event) => settle(workerError(`Module worker unavailable or failed (CSP/import): ${event.message || 'unknown error'}.`));
				worker.onmessageerror = () => settle(workerError('Worker result could not be deserialized.'));
			}
			signal?.addEventListener('abort', onAbort, { once: true });
			if (signal?.aborted) settle(abortError());
			else worker.postMessage(payload);
		} catch (error) {
			settle(error?.name === 'AbortError' || error?.code === 'QUALITY_WORKER_DEADLINE' ? error
				: workerError('Could not start module worker (availability/CSP/clone failure); no fallback was run.', error));
		}
	});
	if (signal?.aborted) throw abortError();
	if (performance.now() >= deadline) throw deadlineError(maxDurationMs);
	assertCurrentInputs();
	if (performance.now() >= deadline) throw deadlineError(maxDurationMs);
	if (project)
		return { ...result, worker: { operation: 'preflight', entryURL: url.href, projectFingerprint, originalInputFingerprint,
			originalSourceProvenance: sourceSnapshot ? 'supplied-baseline-not-authenticated' : 'no-original-source' } };
	if (operation === 'plan') {
		const plan = snapshotRepairPlan(result, { maxPlanBytes }).plan;
		const fingerprint = await controlled(fingerprintRepairPlan(plan, { maxPlanBytes }), signal, deadline, maxDurationMs);
		assertUnchanged(input, snapshot);
		return { schemaVersion: 1, kind: 'repair-review', inputFingerprint: plan.inputFingerprint, planFingerprint: fingerprint, entryURL: url.href, plan };
	}
	if (operation === 'apply') {
		const current = await controlled(fingerprintRepairPlan(serializedPlan, { maxPlanBytes }), signal, deadline, maxDurationMs);
		if (current !== planFingerprint) throw stalePlan('Caller changed the reviewed plan during execution; candidate discarded.');
		assertUnchanged(input, snapshot);
		return { ...result, review: { operation: 'resume-and-apply', inputFingerprint: planSnapshot.plan.inputFingerprint, planFingerprint, entryURL: url.href } };
	}
	if (cache !== undefined) {
		const admission = storeInspection(cache, identity, result, cached.generation);
		return { ...result, cache: { ...identity, ...admission, status: 'miss', workerStarted: true, fingerprintFreshlyComputed: true } };
	}
	return result;
}

export function inspectInWorker(input, options = {}) {
	return runQualityWorker('inspect', input, options);
}

export function repairInWorker(input, requests, options = {}) {
	return runQualityWorker('repair', input, { ...options, requests });
}

export function planInWorker(input, requests, options = {}) {
	return runQualityWorker('plan', input, { ...options, requests });
}

/** Apply an exact serialized review; no replacement request list is accepted. */
export async function applyPlanInWorker(input, serializedOrReview, options = {}) {
	const review = serializedOrReview?.kind === 'repair-review' ? serializedOrReview : null;
	const plan = review?.plan ?? serializedOrReview, fingerprint = options.reviewedPlanFingerprint ?? review?.planFingerprint;
	if (review && (review.schemaVersion !== 1 || review.inputFingerprint !== plan?.inputFingerprint ||
		(options.reviewedPlanFingerprint !== undefined && options.reviewedPlanFingerprint !== review.planFingerprint)))
		throw stalePlan('Repair review envelope fingerprints are inconsistent.');
	const entryURL = review?.entryURL;
	const result = await runQualityWorker('apply', input, {
		...options,
		serializedPlan: plan, reviewedPlanFingerprint: fingerprint, reviewedEntryURL: entryURL,
	});
	if (review && (review.plan !== plan || review.planFingerprint !== fingerprint || review.entryURL !== entryURL ||
		review.inputFingerprint !== plan.inputFingerprint))
		throw stalePlan('Caller replaced the review envelope during execution; candidate discarded.');
	return result;
}

export function preflightInWorker(projectData, options = {}) {
	return runQualityWorker('preflight', projectData, options);
}
