import {
	abortError, finish, issue, positiveLimit, projectData, snapshotBytes,
	workBudget, workflowReport,
} from './workflow-common.js';

export { inspectLegacy, recoverLegacy } from './workflow-legacy.js';
export {
	applyPlanInWorker, createInspectionCache, fingerprintRepairPlan, inspectInWorker,
	planInWorker, preflightInWorker, repairInWorker, runQualityWorker,
} from './workflow-worker.js';
export { inspectSourceQuality } from './workflow-source.js';

function declaredFamily(options) {
	const family = options.family;
	if (!family || typeof family.id !== 'string' || !family.id.trim() ||
		typeof family.profile !== 'string' || !family.profile.trim())
		throw new TypeError('Declare family.id and family.profile explicitly.');
	if (family.expectedMembers !== undefined &&
		(!Array.isArray(family.expectedMembers) || family.expectedMembers.some((id) => typeof id !== 'string')))
		throw new TypeError('family.expectedMembers must contain member IDs.');
	return family;
}

function members(inputs, options) {
	if (!Array.isArray(inputs) || !inputs.length)
		throw new TypeError('Supply a nonempty array of explicitly identified family members.');
	if (inputs.length > positiveLimit(options, 'maxMembers', 128))
		throw new RangeError('Family exceeds maxMembers.');
	const ids = new Set();
	let totalBytes = 0;
	const maximumBytes = positiveLimit(options, 'maxTotalInputBytes', 256 * 1024 * 1024);
	return inputs.map((entry, index) => {
		if (!entry || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id))
			throw new TypeError('Family member IDs must be nonempty and unique.');
		ids.add(entry.id);
		totalBytes += entry.input?.byteLength ?? 0;
		if (totalBytes > maximumBytes) throw new RangeError('Family exceeds maxTotalInputBytes.');
		const importOptions = { ...options, faceIndex: entry.faceIndex };
		return { id: entry.id, inputIndex: index, faceIndex: entry.faceIndex, data: projectData(entry.input, importOptions) };
	});
}

function location(member) {
	return { inputIndex: member.inputIndex, memberId: member.id, ...(member.faceIndex === undefined ? {} : { faceIndex: member.faceIndex }) };
}

function stableAxes(data) {
	return (data.axes || []).map(({ tag, min, default: normal, max }) => ({ tag, min, default: normal, max }))
		.sort((a, b) => a.tag.localeCompare(b.tag));
}

/**
 * Inspect only the declared family. Policies are caller-authored, not inferred
 * from a collection, vendor name, or a filename.
 */
export function inspectFamily(inputs, options = {}) {
	const family = declaredFamily(options);
	const selected = members(inputs, options);
	const report = workflowReport('family');
	report.family = structuredClone(family);
	report.members = selected.map((member) => ({ ...location(member), variable: !!member.data.axes?.length }));
	const policy = family.policy ?? {};
	const available = new Set(selected.map((member) => member.id));
	if (!family.expectedMembers)
		issue(report, 'FAMILY_COMPLETENESS_UNKNOWN', 'No expected member set was supplied; completeness is unknown.', {}, 'info');
	for (const id of family.expectedMembers || [])
		if (!available.has(id)) issue(report, 'FAMILY_MEMBER_MISSING', `Expected family member ${id} is absent.`, { memberId: id });
	const identities = new Map(), styles = new Map();
	for (const member of selected) {
		const { font } = member.data, loc = location(member);
		for (const [field, groups, code] of [
			['postScriptName', identities, 'FAMILY_DUPLICATE_IDENTITY'],
			['styleName', styles, 'FAMILY_DUPLICATE_STYLE'],
		]) {
			const value = font[field];
			if (!value) {
				issue(report, 'FAMILY_METADATA_MISSING', `Member lacks ${field}.`, { ...loc, field }, 'info');
				continue;
			}
			// A static and a variable font may intentionally share their default style.
			const key = field === 'styleName' ? JSON.stringify([value, !!member.data.axes?.length]) : value;
			const previous = groups.get(key);
			if (previous) issue(report, code, `Members share ${field}: ${value}.`, loc, 'warning', { affectedMembers: [previous, member.id] });
			else groups.set(key, member.id);
		}
		const expected = policy.members?.[member.id];
		for (const field of policy.requiredFields || [])
			if (font[field] === undefined || font[field] === '')
				issue(report, 'FAMILY_METADATA_MISSING', `Member lacks explicitly required ${field}.`, { ...loc, field });
		for (const field of ['familyName', 'styleName', 'weightClass', 'widthClass', 'italicAngle', 'license', 'licenseURL', 'version']) {
			if (expected?.[field] !== undefined && font[field] !== expected[field])
				issue(report, 'FAMILY_EXPECTATION_MISMATCH', `${field} differs from the declared member expectation.`, { ...loc, field }, 'warning',
					{ expected: expected[field], actual: font[field] ?? null });
		}
		if (font.fsSelection !== undefined && font.macStyle !== undefined) {
			const italic = !!(font.fsSelection & 1), bold = !!(font.fsSelection & 32);
			if (italic !== !!(font.macStyle & 2) || bold !== !!(font.macStyle & 1))
				issue(report, 'FAMILY_STYLE_LINK_FLAGS', 'OS/2 and head style-linking flags disagree.', loc);
		}
		const axes = new Map((member.data.axes || []).map((axis) => [axis.tag, axis]));
		for (const [instanceIndex, instance] of (member.data.instances || []).entries()) {
			for (const [tag, value] of Object.entries(instance.coordinates || {})) {
				const axis = axes.get(tag);
				if (!axis || !Number.isFinite(value) || value < axis.min || value > axis.max)
					issue(report, 'FAMILY_INSTANCE_COORDINATE', 'Instance coordinate lacks a matching axis or falls outside its declared range.', { ...loc, instanceIndex, axis: tag });
			}
			for (const tag of axes.keys())
				if (instance.coordinates?.[tag] === undefined)
					issue(report, 'FAMILY_INSTANCE_COORDINATE_MISSING', 'Instance does not declare every axis coordinate.', { ...loc, instanceIndex, axis: tag });
		}
	}
	const compare = (field, value, code, enabled = true) => {
		const groups = new Map();
		for (const member of selected) {
			const actual = value(member.data);
			if (actual === undefined) continue;
			const key = JSON.stringify(actual);
			if (!groups.has(key)) groups.set(key, { value: actual, members: [] });
			groups.get(key).members.push(member.id);
		}
		if (groups.size > 1)
			issue(report, code, `${field} differs between declared members${enabled ? '' : ' (explicitly allowed)'}.`,
				{ field }, enabled ? 'warning' : 'info', { groups: [...groups.values()] });
	};
	for (const field of ['familyName', 'license', 'licenseURL', 'version'])
		compare(field, (data) => data.font[field], 'FAMILY_METADATA_DIFFERENCE', !(policy.allowDifferences || []).includes(field));
	compare('verticalMetrics', (data) => {
		const { unitsPerEm, ascender, descender, lineGap } = data.font;
		if (![unitsPerEm, ascender, descender, lineGap].every(Number.isFinite) || unitsPerEm <= 0) return undefined;
		const os2 = data.tables?.['OS/2'];
		return [ascender, descender, lineGap, os2?.sTypoAscender, os2?.sTypoDescender, os2?.sTypoLineGap, os2?.usWinAscent, os2?.usWinDescent]
			.map((number) => Number.isFinite(number) ? number / unitsPerEm : null);
	}, 'FAMILY_METRIC_DIFFERENCE', !(policy.allowDifferences || []).includes('verticalMetrics'));
	const variable = selected.filter((member) => member.data.axes?.length);
	if (variable.length > 1) {
		const first = JSON.stringify(stableAxes(variable[0].data));
		for (const member of variable.slice(1))
			if (JSON.stringify(stableAxes(member.data)) !== first)
				issue(report, 'FAMILY_AXIS_CONVENTION_DIFFERENCE', 'Variable members use different axis tags/ranges/defaults.',
					location(member), (policy.allowDifferences || []).includes('axes') ? 'info' : 'warning',
					{ affectedMembers: [variable[0].id, member.id] });
	}
	report.coverage.push(
		{ domain: 'declared-family-metadata', status: 'executed', reason: 'Identity, style flags, selected metadata, normalized metrics and axis/instance coordinates.' },
		{ domain: 'publishing-policy', status: 'partial', reason: `Caller-declared profile ${family.profile}; no external foundry certification or licensing authorization.` },
		{ domain: 'localized-names-and-shaping', status: 'unsupported', reason: 'Comparison uses simplified preferred names; no language-specific shaping or localized naming certification.' },
	);
	return finish(report);
}

/**
 * All plans and candidates are detached. Even a late failure returns zero
 * candidate bytes; the core adapter retains its normal consent/preservation rules.
 */
export async function repairFamily(inputs, requests, options = {}, core) {
	declaredFamily(options);
	if (!core?.planRepairs || !core?.applyRepairs) throw new TypeError('A core planRepairs/applyRepairs adapter is required.');
	if (!Array.isArray(inputs) || !inputs.length || inputs.length > positiveLimit(options, 'maxMembers', 128))
		throw new TypeError('Supply a bounded nonempty family member array.');
	if (!requests || typeof requests !== 'object') throw new TypeError('Supply repair requests keyed by member ID.');
	const ids = new Set();
	let totalBytes = 0;
	const maximumBytes = positiveLimit(options, 'maxTotalInputBytes', 256 * 1024 * 1024);
	const { signal, family: _family, onProgress: _onProgress, ...coreOptions } = options;
	const snapshots = inputs.map((entry) => {
		if (typeof entry.id !== 'string' || !entry.id || ids.has(entry.id)) throw new TypeError('Family member IDs must be unique.');
		if (entry.faceIndex !== undefined) throw new TypeError('Family repair requires standalone members; extract collection faces explicitly.');
		ids.add(entry.id);
		totalBytes += entry.input?.byteLength ?? 0;
		if (totalBytes > maximumBytes) throw new RangeError('Family exceeds maxTotalInputBytes.');
		const baseline = snapshotBytes(entry.input, options);
		return { id: entry.id, source: entry.input, baseline, bytes: baseline.slice().buffer };
	});
	for (const id of Object.keys(requests))
		if (!ids.has(id)) throw new TypeError(`Repair requests reference unknown member ${id}.`);
	const checkAbort = () => { if (signal?.aborted) throw abortError(); };
	const candidates = [], plans = [];
	let current;
	try {
		for (const member of snapshots) {
			checkAbort();
			current = member.id;
			plans.push(await core.planRepairs(member.bytes, requests[member.id] ?? [], coreOptions));
		}
		for (let index = 0; index < snapshots.length; index++) {
			checkAbort();
			current = snapshots[index].id;
			const result = await core.applyRepairs(snapshots[index].bytes, plans[index]);
			checkAbort();
			if (result.state !== 'verified' || !(result.buffer instanceof ArrayBuffer))
				throw new Error(`Member repair was not verified (${result.state}).`);
			candidates.push({ id: current, result });
		}
		checkAbort();
		for (const member of snapshots) {
			current = member.id;
			const now = snapshotBytes(member.source, options);
			if (now.length !== member.baseline.length || now.some((value, index) => value !== member.baseline[index]))
				throw new Error('Family source changed while the transaction was running; all candidates discarded.');
		}
		return { schemaVersion: 1, scope: 'family-repair', state: 'verified', candidates, committed: false };
	} catch (error) {
		return { schemaVersion: 1, scope: 'family-repair', state: error.name === 'AbortError' ? 'cancelled' : 'failed', candidates: [],
			committed: false, failures: [{ memberId: current, message: error.message, name: error.name }] };
	}
}

function scalar(value) {
	return Number.isInteger(value) && value >= 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff);
}

/**
 * Repertoires are explicit caller-supplied, versioned data. Reachability is
 * potential graph evidence, not proof that a shaping engine can reach a glyph.
 */
export function inspectExpectations(input, options = {}) {
	const data = projectData(input, options), report = workflowReport('expectations'), budget = workBudget(options);
	const repertoires = options.repertoires ?? [];
	if (!Array.isArray(repertoires)) throw new TypeError('repertoires must be an array.');
	report.repertoires = repertoires.map((repertoire) => {
		if (typeof repertoire?.id !== 'string' || !repertoire.id || typeof repertoire.version !== 'string' || !repertoire.version ||
			!Array.isArray(repertoire.codePoints) || repertoire.codePoints.some((cp) => !scalar(cp)))
			throw new TypeError('Each repertoire requires id, explicit version, and Unicode scalar codePoints.');
		return { id: repertoire.id, version: repertoire.version, language: repertoire.language ?? null, source: repertoire.source ?? null };
	});
	const namePolicy = options.glyphNames;
	if (namePolicy) {
		if (typeof namePolicy.id !== 'string' || !namePolicy.id || typeof namePolicy.version !== 'string' || !namePolicy.version)
			throw new TypeError('Glyph naming expectations require an explicit id and version.');
		if (namePolicy.maxLength !== undefined) positiveLimit(namePolicy, 'maxLength', 63);
		report.glyphNamePolicy = structuredClone(namePolicy);
	}
	const glyphs = data.glyphs, names = new Map(), encoded = new Map(), reasons = glyphs.map(() => new Set()), edges = glyphs.map(() => []);
	for (const [gid, glyph] of glyphs.entries()) {
		budget.tick();
		if (names.has(glyph.name)) issue(report, 'EXPECTATION_DUPLICATE_GLYPH_NAME', 'Duplicate glyph names make name-based reachability ambiguous.', { glyphIndex: gid });
		else if (glyph.name) names.set(glyph.name, gid);
		if (namePolicy && (typeof glyph.name !== 'string' || !glyph.name ||
			(namePolicy.maxLength !== undefined && glyph.name.length > namePolicy.maxLength) ||
			(namePolicy.asciiOnly === true && /[^\x21-\x7e]/.test(glyph.name))))
			issue(report, 'EXPECTATION_GLYPH_NAME_POLICY', 'Glyph name differs from the selected naming length/printable-ASCII policy.',
				{ glyphIndex: gid, glyphName: glyph.name ?? null }, 'warning', { policyId: namePolicy.id, policyVersion: namePolicy.version });
		for (const cp of glyph.unicodes ?? (glyph.unicode == null ? [] : [glyph.unicode])) {
			budget.tick();
			if (!scalar(cp)) { issue(report, 'EXPECTATION_INVALID_SCALAR', 'Glyph has a non-scalar Unicode assignment.', { glyphIndex: gid }, 'error'); continue; }
			if (gid !== 0) { encoded.set(cp, gid); reasons[gid].add('cmap'); }
		}
	}
	const resolve = (reference) => Number.isInteger(reference) ? reference : names.get(reference);
	const valid = (gid) => Number.isInteger(gid) && gid >= 0 && gid < glyphs.length;
	const edge = (from, to, kind) => {
		budget.tick();
		const a = resolve(from), b = resolve(to);
		if (!valid(a) || !valid(b)) { issue(report, 'EXPECTATION_REFERENCE_MISSING', 'Reachability reference does not identify an existing glyph.', {}, 'warning', { from, to, kind }); return; }
		edges[a].push({ to: b, kind });
	};
	for (const [gid, glyph] of glyphs.entries())
		for (const component of glyph.components || []) edge(gid, component.glyphName ?? component.glyphIndex, 'component');
	for (const rule of data.substitutions || []) {
		budget.tick();
		if (rule.type === 'ligature')
			for (const from of rule.components || []) edge(from, rule.ligature, 'shaping');
		else if (['single', 'multiple', 'alternate', 'reverse'].includes(rule.type))
			for (const to of rule.alternates ?? (Array.isArray(rule.to) ? rule.to : [rule.to])) edge(rule.from, to, 'shaping');
		else issue(report, 'EXPECTATION_SHAPING_RULE_UNSUPPORTED', 'A substitution rule is not included in the reachability graph.', {}, 'info');
	}
	for (const color of data.colorGlyphs || []) {
		for (const layer of color.layers || []) edge(color.name, layer.glyph, 'color');
		if (color.paint) {
			const pending = [color.paint], seen = new Set();
			while (pending.length) {
				budget.tick();
				const value = pending.pop();
				if (!value || typeof value !== 'object' || seen.has(value)) continue;
				seen.add(value);
				if (value.glyphID !== undefined) edge(color.name, value.glyphID, 'color');
				for (const child of Object.values(value)) if (child && typeof child === 'object') pending.push(child);
			}
		}
	}
	for (const subtable of data.tables?.cmap?.subtables || []) {
		if (subtable.format !== 14) continue;
		for (const record of subtable.varSelectorRecords || [])
			for (const mapping of record.nonDefaultUVS || []) {
				budget.tick();
				if (valid(mapping.glyphID) && mapping.glyphID !== 0) reasons[mapping.glyphID].add('uvs');
				else issue(report, 'EXPECTATION_UVS_GLYPH_MISSING', 'Nondefault UVS references a missing glyph.', { glyphIndex: mapping.glyphID }, 'error');
			}
	}
	if (glyphs.length) reasons[0].add('notdef');
	for (const reference of options.roots || []) {
		const gid = resolve(reference);
		if (!valid(gid)) throw new TypeError('Explicit reachability root does not identify a glyph.');
		reasons[gid].add('explicit-root');
	}
	const queue = reasons.flatMap((set, gid) => set.size ? [gid] : []), visited = new Set(queue);
	for (let cursor = 0; cursor < queue.length; cursor++)
		for (const target of edges[queue[cursor]]) {
			budget.tick();
			reasons[target.to].add(target.kind);
			if (!visited.has(target.to)) { visited.add(target.to); queue.push(target.to); }
		}
	for (const repertoire of repertoires)
		for (const cp of new Set(repertoire.codePoints)) {
			budget.tick();
			if (!encoded.has(cp))
				issue(report, 'EXPECTATION_REPERTOIRE_MISSING', `Selected repertoire ${repertoire.id}@${repertoire.version} requires U+${cp.toString(16).toUpperCase()}.`,
					{ repertoireId: repertoire.id, repertoireVersion: repertoire.version, codePoint: cp }, 'warning');
		}
	for (const name of options.requiredGlyphs || [])
		if (!names.has(name)) issue(report, 'EXPECTATION_GLYPH_MISSING', 'An explicitly required glyph is absent.', { glyphName: name });
	for (const expectation of options.behavior || []) {
		if (!scalar(expectation.codePoint)) throw new TypeError('Behavior expectations require a Unicode scalar codePoint.');
		if (expectation.advanceWidth !== undefined && !Number.isFinite(expectation.advanceWidth))
			throw new TypeError('Behavior advanceWidth must be finite.');
		if (expectation.empty !== undefined && typeof expectation.empty !== 'boolean')
			throw new TypeError('Behavior empty must be a boolean.');
		const gid = encoded.get(expectation.codePoint), glyph = glyphs[gid];
		if (!glyph) { issue(report, 'EXPECTATION_BEHAVIOR_GLYPH_MISSING', 'Behavior cannot be checked because the selected code point is absent.', { codePoint: expectation.codePoint }); continue; }
		if (expectation.advanceWidth !== undefined && glyph.advanceWidth !== expectation.advanceWidth)
			issue(report, 'EXPECTATION_ADVANCE_WIDTH', 'Advance width differs from the explicitly selected whitespace/control/mark policy.', { glyphIndex: gid, codePoint: expectation.codePoint }, 'warning',
				{ expected: expectation.advanceWidth, actual: glyph.advanceWidth ?? null });
		if (expectation.empty === true && (glyph.contours?.some((contour) => contour.length) || glyph.components?.length || data.colorGlyphs?.some((color) => color.name === glyph.name)))
			issue(report, 'EXPECTATION_VISIBLE_WHITESPACE', 'Selected empty glyph policy conflicts with outline/component/color content.', { glyphIndex: gid });
	}
	report.glyphs = glyphs.map((glyph, gid) => ({
		glyphIndex: gid, name: glyph.name ?? null, encoded: reasons[gid].has('cmap'),
		potentiallyReachable: visited.has(gid), reasons: [...reasons[gid]].sort(),
	}));
	report.work = budget.used;
	report.coverage.push(
		{ domain: 'selected-repertoires', status: repertoires.length ? 'executed' : 'not-requested', reason: 'Only explicitly versioned caller data is checked; no universal language completeness claim.' },
		{ domain: 'reachability', status: 'partial', reason: 'cmap, nondefault UVS, components, simplified GSUB and color graph; edges are potential uses, not executable shaping proofs.' },
		{ domain: 'mark-positioning-and-dotted-circle', status: 'unsupported', reason: 'Coverage and explicit width/empty policies are not a mark-positioning or dotted-circle shaping test.' },
		{ domain: 'glyph-naming-expectations', status: namePolicy ? 'executed' : 'not-requested', reason: 'Only caller-selected versioned length and printable-ASCII constraints; no names are guessed or rewritten.' },
	);
	if (data._rawGSUBLookups?.length || data.tables?.GSUB?._raw)
		issue(report, 'EXPECTATION_REACHABILITY_INCOMPLETE', 'Opaque/contextual GSUB references may reach additional glyphs.', {}, 'info');
	report.limitations.push('Unencoded or currently unreachable glyphs are evidence, never automatic deletion candidates.');
	return finish(report);
}
