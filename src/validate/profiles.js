import { buildReport } from './validateJSON.js';

const PROFILES = Object.freeze([
	Object.freeze({
		id: 'structural',
		version: 1,
		description:
			'Implemented binary checks plus OpenType required-table rules. Apple true-flavor fonts use their legacy table requirements.',
	}),
	Object.freeze({
		id: 'interoperability',
		version: 1,
		description:
			'Structural checks plus Windows Unicode family/style naming recommendations; not certification by every consumer.',
	}),
	Object.freeze({
		id: 'publishing',
		version: 1,
		description:
			'Structural and interoperability checks plus explicitly supplied filename and family expectations. No Google Fonts policy is implied.',
	}),
]);

export function qualityProfiles() {
	return PROFILES;
}

export function applyProfileCompatibility(report, profile) {
	if (!report) return null;
	const advisory = new Set([
		'CMAP_NO_SUPPORTED_SUBTABLE',
		'GLYF_COMPOSITE_DEPTH_EXCEEDED',
	]);
	const issues = report.issues.map((issue) =>
		advisory.has(issue.code)
			? {
					...issue,
					originalSeverity: issue.severity,
					severity: profile.id === 'structural' ? 'warning' : issue.severity,
					classification: 'interoperability',
					provenance:
						'FFJS legacy sanitizer-compatibility check; not a foundry policy',
					rationale:
						'The consumer-specific mapping repertoire or composite-depth threshold is distinct from the execution budget.',
					consequence:
						'Some sanitizers may reject the font. Structural inspection retains this advisory without authorizing a destructive compatibility edit.',
				}
			: issue,
	);
	return {
		...report,
		...buildReport(issues),
		faces: report.faces.map((face) => ({
			...face,
			...buildReport(
				issues.filter((issue) => issue.faceIndex === face.faceIndex),
			),
		})),
	};
}

export function resolveProfile(options = {}) {
	if (!options || typeof options !== 'object' || Array.isArray(options))
		throw new TypeError('Inspection options must be an object.');
	const profile = PROFILES.find(
		(item) => item.id === (options.profile ?? 'structural'),
	);
	if (!profile)
		throw new Error(
			`Unknown quality profile: ${options.profile}. Use structural, interoperability, or publishing.`,
		);
	if (
		options.profileVersion !== undefined &&
		options.profileVersion !== profile.version
	)
		throw new Error(
			`Unsupported ${profile.id} profile version: ${options.profileVersion}.`,
		);
	if (options.context !== undefined) {
		if (
			!options.context ||
			typeof options.context !== 'object' ||
			Array.isArray(options.context)
		)
			throw new TypeError('Profile context must be an object.');
		for (const key of ['fileName', 'expectedFileName', 'expectedFamilyName']) {
			if (
				options.context[key] !== undefined &&
				(typeof options.context[key] !== 'string' ||
					!options.context[key].trim())
			)
				throw new TypeError(
					`Profile context.${key} must be a nonempty string.`,
				);
		}
	}
	return profile;
}

export function evaluateProfile(report, options = {}) {
	const profile = resolveProfile(options);
	const checks = [];
	const issues = [];
	const record = (id, faceIndex, outcome, reasonCode, reason, details = {}) => {
		const location = faceIndex === undefined ? {} : { faceIndex };
		const check = {
			id,
			revision: profile.version,
			source: 'profile-context',
			location,
			outcome,
			coverage:
				outcome === 'blocked' || outcome === 'unsupported'
					? 'not-checked'
					: 'complete',
			reasonCode,
			reason,
			findingIds: [],
			...details,
		};
		checks.push(check);
		return check;
	};
	const finding = (check, severity, code, message, table) => {
		const location = { ...check.location, ...(table ? { table } : {}) };
		const id = `${code}:${JSON.stringify(location)}:0`;
		check.findingIds.push(id);
		issues.push({
			id,
			code,
			severity,
			message,
			checkId: check.id,
			outcome: 'failed',
			source: 'profile-context',
			location,
			...check.location,
			evidence: { message },
			profile: profile.id,
			profileVersion: profile.version,
			provenance: check.provenance,
			rationale: check.rationale,
			consequence: check.consequence,
		});
	};
	const faces = report?.faces ?? [];
	if (!faces.length) {
		record(
			'profile.structural.required-tables',
			undefined,
			'blocked',
			'no-inspectable-face',
			'Required-table policy needs a readable face directory.',
		);
	}
	for (const face of faces) {
		const metadata = face.metadata ?? {};
		const apple = metadata.sfVersion === 0x74727565;
		const hasOS2 = metadata.tableTags?.includes('OS/2');
		const structural = record(
			'profile.structural.required-tables',
			face.faceIndex,
			!metadata.directoryComplete
				? 'blocked'
				: apple || hasOS2
					? 'passed'
					: 'failed',
			!metadata.directoryComplete
				? 'directory-unreadable'
				: apple
					? 'apple-legacy-flavor'
					: 'opentype-requirement',
			apple
				? 'Apple true-flavor SFNT does not acquire an OpenType OS/2 requirement.'
				: 'OpenType SFNT, including decoded WOFF faces, requires OS/2 in addition to legacy core tables.',
			{
				provenance:
					'https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables',
				rationale:
					'Required-table rules depend on the actual SFNT flavor, not a filename extension.',
				consequence:
					'Missing OS/2 content must be supplied from design/source information; selecting this profile does not invent it.',
			},
		);
		if (structural.outcome === 'failed') {
			finding(
				structural,
				'error',
				'PROFILE_REQUIRED_TABLE_MISSING',
				'OpenType font is missing required OS/2 data.',
				'OS/2',
			);
		}
		if (profile.id === 'structural') continue;
		const names = metadata.names;
		const windowsNames =
			names &&
			[1, 2].every((id) =>
				names.some(
					(name) =>
						name.nameID === id &&
						name.platformID === 3 &&
						(name.encodingID === 1 || name.encodingID === 10) &&
						name.value,
				),
			);
		const naming = record(
			'profile.interoperability.windows-names',
			face.faceIndex,
			!names ? 'blocked' : windowsNames ? 'passed' : 'failed',
			!names ? 'name-table-unreadable' : 'windows-unicode-names',
			'Check for Windows Unicode family and style name records.',
			{
				provenance:
					'https://learn.microsoft.com/en-us/typography/opentype/spec/name',
				rationale:
					'Some consumers expect Windows platform family/style names; their absence is not a universal binary-format error.',
				consequence:
					'Affected consumers may display fallback names. Adding localized names requires an explicit naming decision.',
			},
		);
		if (naming.outcome === 'failed') {
			finding(
				naming,
				'warning',
				'PROFILE_WINDOWS_NAMES_MISSING',
				'Windows Unicode family/style name records are missing.',
				'name',
			);
		}
		if (profile.id !== 'publishing') continue;
		const expected = options.context?.expectedFamilyName;
		const matches = names?.some(
			(name) =>
				(name.nameID === 1 || name.nameID === 16) && name.value === expected,
		);
		const family = record(
			'profile.publishing.family-name',
			face.faceIndex,
			!expected || !names ? 'blocked' : matches ? 'passed' : 'failed',
			!expected
				? 'missing-family-context'
				: !names
					? 'name-table-unreadable'
					: 'declared-family',
			'At least one family/typographic-family record must match the supplied family expectation.',
			{
				provenance:
					'FFJS publishing profile v1: caller-declared family expectation',
				rationale:
					'Family membership is contextual, not a property inferred from unrelated collection members.',
				consequence:
					'Mismatch blocks this publishing policy. Correct the expectation or explicitly choose a naming edit; localized names need not all be identical.',
			},
		);
		if (family.outcome === 'failed') {
			finding(
				family,
				'error',
				'PROFILE_FAMILY_NAME_MISMATCH',
				`No family name matches the declared expectation "${expected}".`,
				'name',
			);
		}
	}
	if (profile.id === 'publishing') {
		const { fileName, expectedFileName } = options.context ?? {};
		const filename = record(
			'profile.publishing.filename',
			undefined,
			!fileName || !expectedFileName
				? 'blocked'
				: fileName === expectedFileName
					? 'passed'
					: 'failed',
			!fileName || !expectedFileName
				? 'missing-filename-context'
				: 'declared-filename',
			'Compare the actual and expected filenames supplied by the caller.',
			{
				provenance:
					'FFJS publishing profile v1: caller-declared filename expectation',
				rationale:
					'A filename mismatch is packaging policy, not corruption of the font bytes.',
				consequence:
					'Mismatch blocks this publishing policy. Rename the external file or correct the policy; no binary repair is authorized.',
			},
		);
		if (filename.outcome === 'failed') {
			finding(
				filename,
				'error',
				'PROFILE_FILENAME_MISMATCH',
				`Filename "${fileName}" differs from the declared expectation "${expectedFileName}".`,
			);
		}
	}
	const complete = checks.every((check) => check.coverage === 'complete');
	return {
		...buildReport(issues),
		id: profile.id,
		version: profile.version,
		complete,
		passed:
			complete &&
			report?.issues.every((issue) => issue.severity === 'info') === true &&
			checks.every((check) => check.outcome === 'passed'),
		checks,
	};
}

export function addProfileFindings(report, profileReport) {
	if (!report) return null;
	return {
		...report,
		...buildReport([...report.issues, ...profileReport.issues]),
		complete: report.complete && profileReport.complete,
		checks: [...report.checks, ...profileReport.checks],
		faces: report.faces.map((face) => ({
			...face,
			...buildReport([
				...face.issues,
				...profileReport.issues.filter(
					(issue) => issue.faceIndex === face.faceIndex,
				),
			]),
		})),
	};
}
