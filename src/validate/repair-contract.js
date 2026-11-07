export function canonicalJSON(value, ancestors = new Set(), depth = 0) {
	if (depth > 128) throw new RangeError('Repair data exceeds nesting limit 128.');
	if (value === undefined) return undefined;
	if (value === null || ['string', 'boolean'].includes(typeof value)) return JSON.stringify(value);
	if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
	if (typeof value !== 'object') throw new TypeError('Repair data must contain finite JSON values.');
	if (ancestors.has(value)) throw new TypeError('Repair data must not be cyclic.');
	if (!Array.isArray(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
		throw new TypeError('Repair data must contain plain objects and arrays.');
	ancestors.add(value);
	const result = Array.isArray(value)
		? `[${Array.from(value, (item) => canonicalJSON(item, ancestors, depth + 1) ?? 'null').join(',')}]`
		: `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) =>
			`${JSON.stringify(key)}:${canonicalJSON(value[key], ancestors, depth + 1)}`).join(',')}}`;
	ancestors.delete(value);
	return result;
}

export function validateRepairCatalog(catalog) {
	const ids = new Set();
	for (const fix of catalog) {
		if (!fix.id || ids.has(fix.id)) throw new Error('Repair IDs must be unique.');
		ids.add(fix.id);
		for (const key of ['title', 'description', 'prerequisites', 'riskReason', 'ifApplied', 'ifUnfixed'])
			if (typeof fix[key] !== 'string' || !fix[key].trim())
				throw new Error(`${fix.id} is missing ${key}.`);
		if (!['safe', 'assisted', 'potentially-lossy'].includes(fix.risk) ||
			!Number.isSafeInteger(fix.revision) || fix.revision < 1)
			throw new Error(`${fix.id} has an invalid risk or revision.`);
		if (!fix.formats?.length || !fix.invariants?.length || !Array.isArray(fix.inputs))
			throw new Error(`${fix.id} must declare formats, invariants, and decisions.`);
		const keys = new Set();
		for (const field of fix.inputs) {
			if (!field.key || keys.has(field.key) || !field.label ||
				!['string', 'integer', 'number', 'boolean', 'enum'].includes(field.type))
				throw new Error(`${fix.id} has an invalid decision schema.`);
			keys.add(field.key);
			if (field.type === 'enum' && (!field.values?.length ||
				field.values.some((value) => typeof value !== 'string')))
				throw new Error(`${fix.id}.${field.key} must declare enum values.`);
		}
	}
	for (const fix of catalog)
		for (const id of [...fix.companions ?? [], ...fix.after ?? [], ...fix.conflicts ?? []])
			if (!ids.has(id)) throw new Error(`${fix.id} refers to unknown repair ${id}.`);
	orderRepairs(catalog.map((fix) => ({ ...fix, values: {} })), false);
	return catalog;
}

export function validateRepairInputs(fix, values) {
	if (!values || typeof values !== 'object' || Array.isArray(values))
		throw new TypeError(`Inputs for ${fix.id} must be an object.`);
	for (const key of Object.keys(values))
		if (!fix.inputs.some((input) => input.key === key))
			throw new Error(`Unknown input ${key} for ${fix.id}.`);
	for (const field of fix.inputs) {
		const value = values[field.key];
		if (field.type === 'integer' || field.type === 'number') {
			if (!Number.isFinite(value) || (field.type === 'integer' && !Number.isSafeInteger(value)) ||
				value < field.min || value > field.max)
				throw new Error(`${field.label} must be ${field.type === 'integer' ? 'an integer' : 'a number'} from ${field.min} to ${field.max}.`);
		} else if (field.type === 'boolean') {
			if (typeof value !== 'boolean' || (field.mustBeTrue && !value))
				throw new Error(`${field.label} ${field.mustBeTrue ? 'requires explicit confirmation' : 'must be true or false'}.`);
		} else if (field.type === 'enum') {
			if (!field.values.includes(value))
				throw new Error(`${field.label} must be one of: ${field.values.join(', ')}.`);
		} else if (typeof value !== 'string' || !value.trim() ||
			value.length > field.maxLength || /[\u0000-\u001f\u007f]/.test(value) ||
			[...value].some((char) => char.codePointAt(0) >= 0xd800 && char.codePointAt(0) <= 0xdfff)) {
			throw new Error(`${field.label} must be nonempty well-formed text without control characters (maximum ${field.maxLength} UTF-16 units).`);
		}
	}
}

export function orderRepairs(steps, checkConflicts = true) {
	const byID = new Map(steps.map((step) => [step.id, step]));
	if (byID.size !== steps.length) throw new Error('Repair requests must have unique registered IDs.');
	if (checkConflicts)
		for (const step of steps)
			for (const id of step.conflicts ?? [])
				if (byID.has(id)) throw new Error(`Conflicting repairs: ${step.id} and ${id}. Choose one authoritative operation.`);
	const active = new Set(), done = new Set(), ordered = [];
	function visit(id) {
		if (done.has(id)) return;
		if (active.has(id)) throw new Error(`Cyclic repair dependencies at ${id}.`);
		active.add(id);
		for (const dependency of byID.get(id).after ?? [])
			if (byID.has(dependency)) visit(dependency);
		active.delete(id);
		done.add(id);
		ordered.push(byID.get(id));
	}
	for (const id of [...byID.keys()].sort()) visit(id);
	return ordered;
}

export function checkCancellation(signal) {
	if (signal?.aborted) {
		const error = new Error('Font quality operation cancelled; no candidate was committed.');
		error.name = 'AbortError';
		throw error;
	}
}

export async function qualityPhase(controls, phase) {
	checkCancellation(controls?.signal);
	controls?.onProgress?.({ phase });
	// A stage boundary yields to the host. Full traversal cancellation uses the worker API.
	await new Promise((resolve) => setTimeout(resolve, 0));
	checkCancellation(controls?.signal);
}
