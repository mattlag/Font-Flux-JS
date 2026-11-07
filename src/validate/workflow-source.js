import { finish, issue, positiveLimit, projectData, workBudget, workflowReport } from './workflow-common.js';

const COORDINATES = ['x', 'y', 'x1', 'y1', 'x2', 'y2'];

function topology(glyph, glyphs) {
	return {
		contours: (glyph.contours || []).map((contour) => contour.map((point) => point.type ?? (point.onCurve ? 'on' : 'off'))),
		components: (glyph.components || []).map((component) => ({
			glyph: component.glyphName ?? glyphs[component.glyphIndex]?.name ?? `#${component.glyphIndex}`,
			// Point attachment versus XY offsets changes how interpolation is interpreted.
			attachment: component.flags === undefined ? 'authored'
				: (typeof component.flags === 'number' ? component.flags & 2 : component.flags.argsAreXYValues) ? 'xy' : 'points',
		})),
	};
}

function polygonArea(contour) {
	let twice = 0;
	for (let i = 0; i < contour.length; i++) {
		const a = contour[i], b = contour[(i + 1) % contour.length];
		twice += a.x * b.y - b.x * a.y;
	}
	return twice / 2;
}

function inspectGlyph(report, glyph, loc, options, budget) {
	const contours = glyph.contours || [], boxes = [];
	for (const [contourIndex, contour] of contours.entries()) {
		budget.tick(contour.length + 1);
		const where = { ...loc, contourIndex };
		if (!contour.length) { issue(report, 'OUTLINE_EMPTY_CONTOUR', 'Empty contour in supplied outline.', where); continue; }
		let finite = true;
		for (const [pointIndex, point] of contour.entries()) {
			const keys = point.type === 'Z' ? [] : ['x', 'y', ...(point.type === 'C' ? ['x1', 'y1', 'x2', 'y2'] : [])];
			if (keys.some((key) => !Number.isFinite(point[key]))) {
				finite = false;
				issue(report, 'OUTLINE_NONFINITE_COORDINATE', 'An outline coordinate is missing or nonfinite.', { ...where, pointIndex }, 'error');
			}
		}
		if (!finite) continue;
		const points = contour.filter((point) => point.type !== 'Z');
		if (!points.length) continue;
		const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
		for (const point of points)
			for (const [x, y] of [[point.x, point.y], ...(point.type === 'C' ? [[point.x1, point.y1], [point.x2, point.y2]] : [])]) {
				bounds.minX = Math.min(bounds.minX, x); bounds.maxX = Math.max(bounds.maxX, x);
				bounds.minY = Math.min(bounds.minY, y); bounds.maxY = Math.max(bounds.maxY, y);
			}
		boxes.push({ contourIndex, ...bounds });
		const lineOnly = points.every((point) => point.type ? point.type === 'M' || point.type === 'L' : point.onCurve === true);
		if (points.length < 2 || (bounds.minX === bounds.maxX && bounds.minY === bounds.maxY))
			issue(report, 'OUTLINE_DEGENERATE_CONTOUR', 'Contour collapses to a point.', where, 'warning', { heuristic: true });
		for (let i = 1; i < points.length; i++)
			if (points[i].x === points[i - 1].x && points[i].y === points[i - 1].y && lineOnly)
				issue(report, 'OUTLINE_ZERO_LENGTH_SEGMENT', 'Consecutive line vertices coincide.', { ...where, pointIndex: i }, 'warning', { heuristic: true });
		if (lineOnly) {
			const area = polygonArea(points);
			report.contours.push({ ...where, signedArea: area, winding: area > 0 ? 'counterclockwise' : area < 0 ? 'clockwise' : 'zero', bounds });
			if (Math.abs(area) <= options.tinyArea)
				issue(report, 'OUTLINE_TINY_SIGNED_AREA', 'Straight-edge contour has small signed area; cancellation/self-intersection may also explain this.', where, 'warning',
					{ heuristic: true, signedArea: area, tolerance: options.tinyArea, units: 'font-units-squared' });
		} else {
			report.contours.push({ ...where, signedArea: null, winding: 'not-evaluated', bounds });
		}
	}
	for (let i = 0; i < boxes.length; i++)
		for (let j = i + 1; j < boxes.length; j++) {
			budget.tick();
			const a = boxes[i], b = boxes[j];
			if (Math.max(a.minX, b.minX) < Math.min(a.maxX, b.maxX) && Math.max(a.minY, b.minY) < Math.min(a.maxY, b.maxY))
				issue(report, 'OUTLINE_OVERLAP_POSSIBLE', 'Contour control bounds overlap; intentional nesting or overlap is not an error.', loc, 'info',
					{ heuristic: true, contours: [a.contourIndex, b.contourIndex], actualIntersectionComputed: false });
		}
	if (glyph.charString && !glyph.contours)
		issue(report, 'OUTLINE_SOURCE_UNAVAILABLE', 'Raw charstring has no supplied editable contours; source geometry was not reconstructed.', loc, 'info');
}

/**
 * Inspect supplied masters, without claiming their provenance or performing
 * topology-changing repairs. Samples use explicitly supplied linear weights.
 */
export function inspectSourceQuality(projects, options = {}) {
	if (!Array.isArray(projects) || !projects.length)
		throw new TypeError('Supply a nonempty array of identified source projects.');
	if (projects.length > positiveLimit(options, 'maxMasters', 32)) throw new RangeError('Sources exceed maxMasters.');
	const tinyArea = options.tinyArea ?? 1;
	if (!Number.isFinite(tinyArea) || tinyArea < 0) throw new RangeError('tinyArea must be finite and nonnegative.');
	const report = workflowReport('source-quality'), budget = workBudget(options), ids = new Set();
	report.contours = [];
	report.masters = [];
	const masters = projects.map((project, inputIndex) => {
		if (!project?.id || typeof project.id !== 'string' || ids.has(project.id)) throw new TypeError('Source IDs must be unique nonempty strings.');
		ids.add(project.id);
		const data = projectData(project.input, options), glyphs = new Map();
		for (const [glyphIndex, glyph] of data.glyphs.entries()) {
			budget.tick();
			const loc = { inputIndex, masterId: project.id, glyphIndex, glyphName: glyph.name ?? null };
			if (!glyph.name || glyphs.has(glyph.name))
				throw new TypeError('Source comparison requires unique explicit glyph names in every master.');
			glyphs.set(glyph.name, glyph);
			inspectGlyph(report, glyph, loc, { tinyArea }, budget);
		}
		report.masters.push({ id: project.id, source: project.source ? structuredClone(project.source) : null, glyphCount: data.glyphs.length });
		if (!project.source)
			issue(report, 'SOURCE_PROVENANCE_UNAVAILABLE', 'Original authoring source/master provenance was not supplied; these may be compiled outlines.', { inputIndex, masterId: project.id }, 'info');
		return { id: project.id, data, glyphs };
	});
	const compatible = new Set();
	const allNames = new Set(masters.flatMap((master) => [...master.glyphs.keys()]));
	for (const name of allNames) {
		budget.tick();
		const present = masters.filter((master) => master.glyphs.has(name));
		if (present.length !== masters.length) {
			issue(report, 'SOURCE_MASTER_GLYPH_MISSING', 'Glyph is absent from one or more supplied masters.', { glyphName: name }, 'warning',
				{ missingMasters: masters.filter((master) => !master.glyphs.has(name)).map((master) => master.id) });
			continue;
		}
		const first = JSON.stringify(topology(masters[0].glyphs.get(name), masters[0].data.glyphs));
		if (masters.some((master) => JSON.stringify(topology(master.glyphs.get(name), master.data.glyphs)) !== first)) {
			issue(report, 'SOURCE_MASTER_TOPOLOGY_MISMATCH', 'Point/command topology or component identity differs between masters.', { glyphName: name }, 'warning',
				{ affectedMasters: masters.map((master) => master.id) });
		} else compatible.add(name);
	}
	for (const master of masters.slice(1))
		if (master.data.font.unitsPerEm !== masters[0].data.font.unitsPerEm)
			issue(report, 'SOURCE_MASTER_UPEM_MISMATCH', 'Master unitsPerEm differs; no automatic rescaling was performed.', { masterId: master.id });
	if (masters.length === 1)
		issue(report, 'SOURCE_MASTERS_UNAVAILABLE', 'One input cannot establish master compatibility or interpolation behavior.', {}, 'info');
	report.samples = [];
	for (const [sampleIndex, sample] of (options.samples || []).entries()) {
		const weights = sample.weights;
		if (!Array.isArray(weights) || weights.length !== masters.length ||
			weights.some((weight) => !Number.isFinite(weight) || weight < 0 || weight > 1) ||
			Math.abs(weights.reduce((a, b) => a + b, 0) - 1) > 1e-8)
			throw new TypeError('Each sample requires one nonnegative linear weight per master, summing to one.');
		if (masters.some((master) => master.data.font.unitsPerEm !== masters[0].data.font.unitsPerEm))
			throw new TypeError('Interpolation samples require matching unitsPerEm; rescale original sources explicitly.');
		report.samples.push({ sampleIndex, id: sample.id ?? null, weights: weights.slice(), compatibleGlyphs: compatible.size });
		for (const name of compatible) {
			const original = masters[0].glyphs.get(name);
			if (original.components?.length) {
				issue(report, 'SOURCE_COMPONENT_SAMPLE_UNSUPPORTED', 'Composite transform/point-attachment interpolation requires a source engine.', { sampleIndex, glyphName: name }, 'info');
				continue;
			}
			const contours = (original.contours || []).map((contour, ci) => contour.map((point, pi) => {
				budget.tick();
				const result = { ...point };
				for (const key of COORDINATES)
					if (key in point)
						result[key] = masters.reduce((sum, master, index) => sum + weights[index] * master.glyphs.get(name).contours[ci][pi][key], 0);
				return result;
			}));
			inspectGlyph(report, { contours }, { sampleIndex, glyphName: name }, { tinyArea }, budget);
		}
	}
	report.engineEvidence = (options.engineEvidence || []).map((evidence) => {
		if (!evidence?.engine || !evidence.version || !['pass', 'fail', 'unknown'].includes(evidence.outcome))
			throw new TypeError('Engine evidence requires engine, version and pass/fail/unknown outcome.');
		return { ...structuredClone(evidence), provenance: 'caller-supplied-not-independently-run' };
	});
	report.coverage.push(
		{ domain: 'quadratic-and-cubic-outlines', status: 'partial', reason: 'Finite coordinates, collapsed/control bounds, and exact signed area for straight-edge contours only.' },
		{ domain: 'master-compatibility', status: masters.length > 1 ? 'executed' : 'missing-context', reason: 'Named glyph topology and component references; compatibility does not prove correct point correspondence.' },
		{ domain: 'interpolation-samples', status: report.samples.length ? 'partial' : 'not-requested', reason: 'Explicit linear samples only; no gvar/CFF2 engine evaluation or exhaustive design-space certification.' },
		{ domain: 'contour-union-repair', status: 'unsupported', reason: 'No topology-changing operation is offered; use source tools with explicit tolerance, hint and variation-loss analysis.' },
	);
	report.work = budget.used;
	report.limitations.push('Winding, tiny-area and overlap evidence are heuristics, not specification failures. No geometry, hints or metrics are modified.');
	return finish(report);
}
