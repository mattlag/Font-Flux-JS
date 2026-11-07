import { importFont } from '../import.js';
import { getCheckDescriptor } from './check-catalog.js';
import { canonicalJSON } from './repair-contract.js';

export function positiveLimit(options, key, fallback) {
	const value = options[key] ?? fallback;
	if (!Number.isSafeInteger(value) || value < 1)
		throw new RangeError(`${key} must be a positive safe integer.`);
	return value;
}

export function snapshotBytes(input, options = {}) {
	const bytes = input instanceof ArrayBuffer ? new Uint8Array(input)
		: ArrayBuffer.isView(input) ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength) : null;
	if (!bytes) throw new TypeError('Expected an ArrayBuffer or typed-array view.');
	if (bytes.byteLength > positiveLimit(options, 'maxInputBytes', 128 * 1024 * 1024))
		throw new RangeError('Input exceeds maxInputBytes.');
	return bytes.slice();
}

export function projectData(input, options = {}) {
	let data;
	if (input instanceof ArrayBuffer || ArrayBuffer.isView(input))
		data = importFont(snapshotBytes(input, options).buffer, options);
	else data = input?.data ?? input;
	if (data?.collection)
		throw new TypeError('Select a collection face explicitly; collections are not assumed to be families.');
	if (!data?.font || !Array.isArray(data.glyphs))
		throw new TypeError('Expected font bytes, a FontFlux instance, or simplified font data.');
	if (data.glyphs.length > positiveLimit(options, 'maxGlyphs', 65535))
		throw new RangeError('Project exceeds maxGlyphs.');
	return data;
}

export function workflowReport(scope) {
	return {
		schemaVersion: 1, scope, complete: false, issues: [], coverage: [],
		limitations: ['Evidence is scoped to the supplied inputs and selected expectations; no artwork or intent is inferred.'],
	};
}

export function issue(report, code, message, location = {}, severity = 'warning', evidence) {
	report.issues.push({ code, severity, message, ...location, location: { ...location }, ...(evidence === undefined ? {} : { evidence }) });
}

export function finish(report) {
	const source = report.scope === 'legacy' ? 'original-bytes' : 'declared-context';
	const executionId = `workflow.${report.scope}`;
	const occurrences = new Map();
	report.source = source;
	for (const finding of report.issues) {
		const descriptor = getCheckDescriptor(finding.code);
		finding.checkId ??= descriptor?.checkId ?? executionId;
		finding.executionId ??= executionId;
		finding.source ??= source;
		finding.location = { ...(descriptor?.table ? { table: descriptor.table } : {}), ...finding.location };
		finding.outcome = finding.severity === 'info' ? 'informational' : 'failed';
		finding.evidence = { message: finding.message, ...finding.evidence };
		const key = `${finding.code}:${canonicalJSON(finding.location)}`;
		const occurrence = occurrences.get(key) ?? 0;
		occurrences.set(key, occurrence + 1);
		finding.id ??= `${key}:${occurrence}`;
	}
	const checks = report.checks ?? [];
	const groups = new Map();
	for (const finding of report.issues) {
		if (!groups.has(finding.executionId)) groups.set(finding.executionId, []);
		groups.get(finding.executionId).push(finding);
	}
	if (!groups.size && !checks.length) groups.set(executionId, []);
	for (const [id, findings] of groups) {
		let check = checks.find((entry) => entry.id === id);
		if (!check) {
			const unsupported = report.capabilities?.inspect === 'unsupported';
			check = {
				id, revision: 1, source, location: {},
				outcome: unsupported ? 'unsupported' : findings.some((entry) => entry.severity !== 'info') ? 'failed' : 'blocked',
				coverage: unsupported ? 'not-checked' : 'partial',
				reasonCode: unsupported ? 'unsupported-original-format' : findings.some((entry) => entry.severity !== 'info')
					? 'declared-workflow-evidence' : 'workflow-conformance-not-certified',
				reason: unsupported ? 'The original format lacks an implemented inspection slice.'
					: 'Only the supplied context and listed workflow coverage slices were examined; no universal conformance pass is implied.',
			};
			checks.push(check);
		}
		check.findingIds = findings.map((finding) => finding.id);
	}
	report.checks = checks;
	const errors = report.issues.filter((entry) => entry.severity === 'error').length;
	const warnings = report.issues.filter((entry) => entry.severity === 'warning').length;
	report.summary = {
		errors, warnings, errorCount: errors, warningCount: warnings,
		infoCount: report.issues.filter((entry) => entry.severity === 'info').length,
		issueCount: report.issues.length,
	};
	return report;
}

export function workBudget(options = {}) {
	const maximum = positiveLimit(options, 'maxWork', 1000000);
	let used = 0;
	return {
		tick(count = 1) {
			used += count;
			if (used > maximum) throw new RangeError('Workflow exceeds maxWork.');
		},
		get used() { return used; },
	};
}

export function abortError() {
	const error = new Error('Font quality operation aborted.');
	error.name = 'AbortError';
	return error;
}
