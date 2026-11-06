import { getCheckDescriptor } from './check-catalog.js';

const runs = new WeakMap();
const incompleteCodes = new Set([
	'INVALID_DIAGNOSTIC_OPTIONS',
	'FACE_INDEX_OUT_OF_RANGE',
	'DIAGNOSTIC_LIMIT_EXCEEDED',
	'DIAGNOSTIC_CHECK_FAILED',
	'TABLE_PARSE_FAILED',
	'CFF_CONTEXT_UNSUPPORTED',
	'CFF_FDARRAY_MISSING',
	'CFF_FDSELECT_MISSING',
	'CFF_FD_INDEX_OUT_OF_RANGE',
	'CFF_VARIATION_CONTEXT_MISSING',
	'CFF_VARIATION_CONTEXT_INVALID',
	'CFF_VSINDEX_OUT_OF_RANGE',
	'CFF_OPERATION_LIMIT_EXCEEDED',
	'CFF_SUBR_DEPTH_EXCEEDED',
	'CFF_STACK_OVERFLOW',
]);

export function diagnosisIncomplete(report) {
	return report?.issues.some((issue) => incompleteCodes.has(issue.code)) ?? false;
}

export function trackDiagnosticIssues(issues, source = 'original-bytes') {
	const state = { source, checks: [], current: null, metadata: {} };
	runs.set(issues, state);
	return state;
}

export function diagnosticIssue(
	issues,
	severity,
	code,
	message,
	location = {},
) {
	const state = runs.get(issues);
	if (!state) {
		issues.push({ severity, code, message });
		return;
	}
	const descriptor = getCheckDescriptor(code);
	issues.push({
		severity,
		code,
		message,
		checkId: descriptor?.checkId ?? 'binary.unclassified',
		executionId: state.current?.id ?? 'binary.preconditions',
		outcome: severity === 'info' ? 'informational' : 'failed',
		source: state.source,
		location: {
			...(descriptor?.table ? { table: descriptor.table } : {}),
			...state.current?.location,
			...location,
		},
		evidence: { message },
	});
}

export function skipDiagnosticCheck(
	issues,
	id,
	outcome,
	reasonCode,
	reason,
	location = {},
) {
	const state = runs.get(issues);
	if (!state) return;
	state.checks.push({
		id,
		revision: 1,
		source: state.source,
		location,
		outcome,
		coverage: 'not-checked',
		reasonCode,
		reason,
		findingIds: [],
	});
}

export function runDiagnosticCheck(issues, id, callback, options = {}) {
	const state = runs.get(issues);
	if (!state) return callback();
	const check = {
		id,
		revision: 1,
		source: state.source,
		location: options.location ?? {},
		outcome: 'blocked',
		coverage: 'partial',
		reasonCode: 'check-interrupted',
		reason: 'The check did not finish.',
		findingIds: [],
	};
	state.checks.push(check);
	const nestedStart = state.checks.length;
	const previous = state.current;
	const start = issues.length;
	state.current = check;
	try {
		const result = callback();
		const findings = issues
			.slice(start)
			.filter((issue) => issue.severity !== 'info');
		const incomplete =
			findings.some((issue) => incompleteCodes.has(issue.code)) ||
			state.checks
				.slice(nestedStart)
				.some(
					(item) =>
						item.coverage !== 'complete' &&
						!(
							item.outcome === 'skipped' && item.reasonCode === 'not-applicable'
						),
				);
		check.outcome = findings.length ? 'failed' : 'passed';
		check.coverage = incomplete || options.partial ? 'partial' : 'complete';
		check.reasonCode = incomplete
			? 'prerequisite-or-execution-incomplete'
			: options.partial
				? 'implemented-subset'
				: 'checked';
		check.reason = incomplete
			? 'Some checks stopped; absence of further findings is not a pass.'
			: options.partial
				? options.partial
				: 'Completed the declared check scope.';
		return result;
	} finally {
		state.current = previous;
	}
}

export function diagnosticState(issues) {
	return runs.get(issues);
}

export function completeDiagnosticReport(report, state) {
	const occurrences = new Map();
	const findingIds = new Map();
	const executionKey = (id, location) => `${id}:${location?.faceIndex ?? ''}`;
	const knownExecutions = new Set(state.checks.map((check) =>
		executionKey(check.id, check.location)));
	for (const issue of report.issues) {
		const key = `${issue.code}:${JSON.stringify(issue.location ?? {})}`;
		const occurrence = occurrences.get(key) ?? 0;
		occurrences.set(key, occurrence + 1);
		issue.id = `${key}:${occurrence}`;
		if (issue.severity === 'info') continue;
		const execution = executionKey(issue.executionId, issue.location);
		if (!findingIds.has(execution)) findingIds.set(execution, []);
		findingIds.get(execution).push(issue.id);
		if (!knownExecutions.has(execution)) {
			knownExecutions.add(execution);
			state.checks.push({
				id: issue.executionId, revision: 1, source: issue.source,
				location: issue.faceIndex === undefined ? {} : { faceIndex: issue.faceIndex },
				outcome: 'failed', coverage: 'partial',
				reasonCode: 'input-or-execution-failure',
				reason: 'An input prerequisite or interrupted execution prevented complete inspection.',
				findingIds: [],
			});
		}
	}
	for (const check of state.checks) {
		check.findingIds = findingIds.get(executionKey(check.id, check.location)) ?? [];
	}
	return {
		...report,
		schemaVersion: 1,
		source: state.source,
		complete:
			state.checks.length > 0 &&
			state.checks.every(
				(check) =>
					check.coverage === 'complete' ||
					(check.outcome === 'skipped' &&
						check.reasonCode === 'not-applicable'),
			),
		checks: state.checks,
		metadata: state.metadata,
	};
}
