import { positiveLimit } from './workflow-common.js';

const stores = new WeakMap();
const encoder = new TextEncoder();

function canonical(value, ancestors = new Set(), depth = 0) {
	if (depth > 128) throw new RangeError('Fingerprint data exceeds nesting limit 128.');
	if (value === undefined) return undefined;
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
	if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
	if (typeof value !== 'object' || (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))))
		throw new TypeError('Cached inspection options and reviewed plans must be finite JSON data.');
	if (ancestors.has(value)) throw new TypeError('Fingerprint data must not be cyclic.');
	ancestors.add(value);
	let result;
	if (Array.isArray(value))
		result = `[${Array.from(value, (item) => canonical(item, ancestors, depth + 1) ?? 'null').join(',')}]`;
	else result = `{${Object.keys(value).sort().filter((key) => value[key] !== undefined)
		.map((key) => `${JSON.stringify(key)}:${canonical(value[key], ancestors, depth + 1)}`).join(',')}}`;
	ancestors.delete(value);
	return result;
}

export async function contentFingerprint(bytes) {
	let subtle = globalThis.crypto?.subtle;
	if (!subtle && typeof process !== 'undefined' && process.versions?.node) {
		const moduleName = 'node:crypto';
		subtle = (await import(/* @vite-ignore */ moduleName)).webcrypto.subtle;
	}
	if (!subtle) throw new Error('Content fingerprints require Web Crypto; no identity-only cache fallback is available.');
	const hash = await subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function snapshotRepairPlan(plan, options = {}) {
	if (!plan || plan.schemaVersion !== 1 || typeof plan.inputFingerprint !== 'string' ||
		!/^[a-f0-9]{64}$/.test(plan.inputFingerprint))
		throw new TypeError('Expected a serialized, source-fingerprinted core repair plan.');
	const text = canonical(plan);
	if (encoder.encode(text).length > positiveLimit(options, 'maxPlanBytes', 1024 * 1024))
		throw new RangeError('Reviewed repair plan exceeds maxPlanBytes.');
	return { plan: JSON.parse(text), text };
}

/** Persist this digest alongside the exact plan shown to the user. */
export async function fingerprintRepairPlan(plan, options = {}) {
	return contentFingerprint(encoder.encode(snapshotRepairPlan(plan, options).text));
}

function projectValue(value, ancestors = new Set(), depth = 0) {
	if (depth > 128) throw new RangeError('Project exceeds nesting limit 128.');
	if (value === undefined) return ['undefined'];
	if (value === null) return ['null'];
	if (['string', 'boolean'].includes(typeof value)) return [typeof value, value];
	if (typeof value === 'number') return ['number', Object.is(value, -0) ? '-0' : String(value)];
	if (typeof value === 'bigint') return ['bigint', value.toString()];
	if (typeof value !== 'object') throw new TypeError('Project snapshots require structured data, not callbacks or symbols.');
	if (typeof SharedArrayBuffer !== 'undefined' && (value instanceof SharedArrayBuffer || value.buffer instanceof SharedArrayBuffer))
		throw new TypeError('Project snapshots do not accept SharedArrayBuffer; supply detached project data.');
	if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
		const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
		return [value.constructor.name, Array.from(bytes)];
	}
	if (value instanceof Date) return ['date', Number.isNaN(value.getTime()) ? 'invalid' : value.toISOString()];
	if (ancestors.has(value)) throw new TypeError('Project snapshots must not be cyclic.');
	if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
		throw new TypeError('Project snapshots require plain objects, arrays, dates or binary views.');
	ancestors.add(value);
	const result = Array.isArray(value)
		? ['array', Array.from(value, (item) => projectValue(item, ancestors, depth + 1))]
		: ['object', Object.keys(value).sort().map((key) => [key, projectValue(value[key], ancestors, depth + 1)])];
	ancestors.delete(value);
	return result;
}

export function projectSnapshotText(value, options = {}) {
	const text = JSON.stringify(projectValue(value));
	if (encoder.encode(text).length > positiveLimit(options, 'maxProjectBytes', 64 * 1024 * 1024))
		throw new RangeError('Detached project representation exceeds maxProjectBytes.');
	return text;
}

export function snapshotProject(data, options = {}) {
	if (!data?.font || !Array.isArray(data.glyphs)) throw new TypeError('preflightInWorker requires simplified project data.');
	const text = projectSnapshotText(data, options);
	return { data: structuredClone(data), text };
}

function storeFor(handle) {
	const store = stores.get(handle);
	if (!store) throw new TypeError('Use a cache returned by createInspectionCache().');
	return store;
}

function remove(store, key, eviction = false) {
	const item = store.entries.get(key);
	if (!item) return;
	store.entries.delete(key);
	store.bytes -= item.bytes;
	if (eviction) store.evictions++;
}

function expire(store) {
	const now = performance.now();
	for (const [key, item] of store.entries)
		if (now - item.created >= store.ttlMs) remove(store, key, true);
}

/**
 * Explicit LRU/TTL report reuse, not a decoded-font object cache. Payload-byte
 * accounting bounds admitted serialized data, not JS heap, RSS or process use.
 */
export function createInspectionCache(options = {}) {
	const store = {
		maxEntries: positiveLimit(options, 'maxEntries', 4),
		maxBytes: positiveLimit(options, 'maxBytes', 16 * 1024 * 1024),
		ttlMs: positiveLimit(options, 'ttlMs', 60000),
		entries: new Map(), bytes: 0, hits: 0, misses: 0, writes: 0, evictions: 0, generation: 0,
	};
	const handle = Object.freeze({
		clear() {
			store.entries.clear();
			store.bytes = 0;
			store.generation++;
		},
		get stats() {
			expire(store);
			return Object.freeze({
				entries: store.entries.size, payloadBytes: store.bytes,
				maxEntries: store.maxEntries, maxBytes: store.maxBytes, ttlMs: store.ttlMs,
				hits: store.hits, misses: store.misses, writes: store.writes, evictions: store.evictions,
			});
		},
	});
	stores.set(handle, store);
	return handle;
}

export async function inspectionCacheIdentity(handle, bytes, entryURL, options) {
	storeFor(handle);
	const text = canonical(options);
	if (encoder.encode(text).length > 1024 * 1024) throw new RangeError('Cached inspection options exceed one MiB.');
	const [inputFingerprint, optionsFingerprint] = await Promise.all([
		contentFingerprint(bytes), contentFingerprint(encoder.encode(text)),
	]);
	const key = await contentFingerprint(encoder.encode(JSON.stringify([1, inputFingerprint, optionsFingerprint, entryURL])));
	return { key, inputFingerprint, optionsFingerprint, entryURL };
}

export function lookupInspection(handle, identity) {
	const store = storeFor(handle);
	expire(store);
	const item = store.entries.get(identity.key);
	if (!item) {
		store.misses++;
		return { generation: store.generation, report: null };
	}
	store.hits++;
	store.entries.delete(identity.key);
	store.entries.set(identity.key, item);
	return {
		generation: store.generation,
		report: structuredClone(item.report),
		provenance: { createdAt: item.createdAt, ageMs: Math.max(0, Math.round(performance.now() - item.created)) },
	};
}

export function storeInspection(handle, identity, report, generation) {
	const store = storeFor(handle);
	if (generation !== store.generation) return { stored: false, reason: 'cache-cleared-during-inspection' };
	const detached = structuredClone(report);
	const serialized = JSON.stringify(detached);
	const bytes = encoder.encode(serialized).length + encoder.encode(identity.key).length;
	if (bytes > store.maxBytes) return { stored: false, reason: 'report-exceeds-cache-maxBytes', payloadBytes: bytes };
	expire(store);
	remove(store, identity.key);
	while (store.entries.size >= store.maxEntries || store.bytes + bytes > store.maxBytes)
		remove(store, store.entries.keys().next().value, true);
	const createdAt = new Date().toISOString();
	store.entries.set(identity.key, { report: detached, bytes, created: performance.now(), createdAt });
	store.bytes += bytes;
	store.writes++;
	return { stored: true, payloadBytes: bytes, createdAt, ageMs: 0 };
}
