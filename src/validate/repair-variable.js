import { parseFvar } from '../sfnt/table_fvar.js';
import { parseSTAT } from '../sfnt/table_STAT.js';
import { nameLayout } from './repair-data.js';
import { integer, maskedEqual, need, same, view } from './repair-tt.js';

function range(bytes, start, length, label) {
	if (!Number.isInteger(start) || start < 0 || start + length > bytes.length)
		throw new Error(`Truncated or invalid ${label}.`);
}

function readNameIDs(payloads) {
	return new Set(nameLayout(need(payloads, 'name', 6)).records
		.filter((record) => record.bytes.length).map((record) => record.key[3]));
}

function nameID(payloads, value, min = 256, allowAbsentPS = false) {
	integer(value, min, allowAbsentPS ? 65535 : 32767, 'nameID');
	if (allowAbsentPS && value === 65535) return value;
	if (value > 32767 || !readNameIDs(payloads).has(value))
		throw new Error(`nameID ${value} does not identify a nonempty existing name; supply authoritative localized names first.`);
	return value;
}

export function readFvar(payloads) {
	const bytes = need(payloads, 'fvar', 16);
	const v = view(bytes);
	const start = v.getUint16(4);
	const axisCount = v.getUint16(8);
	const axisSize = v.getUint16(10);
	const instanceCount = v.getUint16(12);
	const instanceSize = v.getUint16(14);
	if (v.getUint16(0) !== 1 || v.getUint16(2) !== 0 || start < 16 || axisSize !== 20 ||
		!axisCount || axisCount > 256 ||
		![4 + axisCount * 4, 6 + axisCount * 4].includes(instanceSize))
		throw new Error('Unsupported fvar version, axis layout, or instance layout.');
	const instanceStart = start + axisCount * axisSize;
	const end = instanceStart + instanceCount * instanceSize;
	range(bytes, start, end - start, 'fvar axes/instances');
	const parsed = parseFvar(bytes);
	const tags = new Set();
	for (const axis of parsed.axes) {
		if (tags.has(axis.axisTag)) throw new Error('Duplicate fvar axis tags require source-aware repair.');
		tags.add(axis.axisTag);
		if (axis.minValue > axis.defaultValue || axis.defaultValue > axis.maxValue)
			throw new Error('Contradictory axis range/default requires source-aware variation repair.');
	}
	for (const instance of parsed.instances) instance.coordinates.forEach((value, i) => {
		if (value < parsed.axes[i].minValue || value > parsed.axes[i].maxValue)
			throw new Error('An existing instance is outside its axis range; coordinates are not inferred.');
	});
	return { bytes, parsed, start, axisCount, instanceStart, instanceCount, instanceSize, end };
}

function readStat(payloads) {
	const bytes = need(payloads, 'STAT', 18);
	const v = view(bytes);
	const minor = v.getUint16(2);
	const headerLength = minor ? 20 : 18;
	if (v.getUint16(0) !== 1 || minor > 2 || bytes.length < headerLength)
		throw new Error('Unsupported STAT version.');
	const axisSize = v.getUint16(4);
	const count = v.getUint16(6);
	const start = v.getUint32(8);
	const valueCount = v.getUint16(12);
	const valueStart = v.getUint32(14);
	if (count > 256 || axisSize < 8) throw new Error('Unsupported STAT axis layout.');
	const occupied = [[0, headerLength]];
	function claim(offset, size) {
		range(bytes, offset, size, 'STAT structure');
		if (!size) return;
		if (occupied.some(([a, b]) => offset < b && offset + size > a))
			throw new Error('Aliased or overlapping STAT structures are unsupported.');
		occupied.push([offset, offset + size]);
	}
	claim(start, count * axisSize);
	claim(valueStart, valueCount * 2);
	// parseSTAT computes next-greater offsets quadratically: bound records first.
	if (valueCount > 4096) throw new Error('STAT axis values exceed the supported work limit.');
	const offsets = [];
	for (let i = 0; i < valueCount; i++) {
		const pos = valueStart + v.getUint16(valueStart + i * 2);
		range(bytes, pos, 4, 'STAT axis value');
		const format = v.getUint16(pos);
		const length = ({ 1: 12, 2: 20, 3: 16 })[format] ??
			(format === 4 && minor >= 2 ? 8 + v.getUint16(pos + 2) * 6 : 0);
		if (!length) throw new Error('Unsupported STAT axis value format.');
		claim(pos, length);
		offsets.push(pos);
	}
	const parsed = parseSTAT(bytes);
	const tags = new Set();
	for (const axis of parsed.designAxes) {
		if (tags.has(axis.axisTag)) throw new Error('Duplicate STAT axes require source-aware repair.');
		tags.add(axis.axisTag);
	}
	for (const value of parsed.axisValues) {
		const indices = value.format === 4 ? value.axisValues.map((entry) => entry.axisIndex) : [value.axisIndex];
		if (new Set(indices).size !== indices.length || indices.some((index) => index >= count))
			throw new Error('Invalid STAT axis references require source-aware repair.');
		if (value.format === 2 && (value.rangeMinValue > value.nominalValue || value.nominalValue > value.rangeMaxValue))
			throw new Error('Invalid STAT value range requires authoritative coordinates.');
	}
	return { bytes, parsed, start, count, axisSize, offsets, minor };
}

export function variablePrerequisites(id, payloads) {
	if (id.startsWith('stat.')) readStat(payloads);
	else readFvar(payloads);
	if (id === 'fvar.default-style') need(payloads, 'OS/2', 8);
	else if (!readNameIDs(payloads).size) throw new Error('Existing authoritative name records are required.');
}

function coords(value, fvar) {
	if (typeof value !== 'string' || value.length > 8192) throw new Error('coordinates must be a comma-separated decimal string.');
	const fields = value.split(',').map((field) => field.trim());
	if (fields.length !== fvar.axisCount || fields.some((field) => !/^[+-]?\d+(?:\.\d+)?$/.test(field)))
		throw new Error('Supply exactly one decimal coordinate per existing fvar axis, in its existing order.');
	return fields.map((field, i) => {
		const value = Number(field);
		integer(value * 65536, -2147483648, 2147483647, '16.16 coordinate');
		const axis = fvar.parsed.axes[i];
		if (value < axis.minValue || value > axis.maxValue) throw new Error(`Coordinate for ${axis.axisTag} is outside its existing range.`);
		return value;
	});
}

export function variableEdit(step, payloads) {
	if (step.id === 'fvar.standard-instance') {
		const fvar = readFvar(payloads);
		const weights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
		if (!weights.includes(step.values?.weight)) throw new Error('Choose a standard weight coordinate from 100 through 900.');
		const index = fvar.parsed.axes.findIndex((axis) => axis.axisTag === 'wght');
		if (index < 0) throw new Error('The standard weight-instance policy requires an existing wght axis.');
		const coordinates = fvar.parsed.axes.map((axis, i) => i === index ? Number(step.values.weight) : axis.defaultValue);
		return variableEdit({ id: 'fvar.add-instance', values: {
			nameID: step.values.nameID, postScriptNameID: step.values.postScriptNameID,
			coordinates: coordinates.join(','),
		} }, payloads);
	}
	const { id, values = {} } = step;
	if (id.startsWith('stat.')) {
		const stat = readStat(payloads);
		const value = nameID(payloads, values.nameID, id === 'stat.fallback-name' ? 2 : 256);
		if (id === 'stat.axis-name') {
			const index = integer(values.axisIndex, 0, stat.count - 1, 'axisIndex');
			return { tag: 'STAT', offset: stat.start + index * stat.axisSize + 4, value };
		}
		if (id === 'stat.value-name') {
			const index = integer(values.valueIndex, 0, stat.offsets.length - 1, 'valueIndex');
			return { tag: 'STAT', offset: stat.offsets[index] + 6, value };
		}
		if (id === 'stat.fallback-name') {
			if (stat.minor < 1) throw new Error('STAT 1.0 has no fallback name field.');
			return { tag: 'STAT', offset: 18, value };
		}
		throw new Error(`Unknown variable metadata repair: ${id}`);
	}
	const fvar = readFvar(payloads);
	if (id === 'fvar.axis-name') {
		const index = integer(values.axisIndex, 0, fvar.axisCount - 1, 'axisIndex');
		return { tag: 'fvar', offset: fvar.start + index * 20 + 18, value: nameID(payloads, values.nameID) };
	}
	if (id === 'fvar.instance-name') {
		const index = integer(values.instanceIndex, 0, fvar.instanceCount - 1, 'instanceIndex');
		if (!['subfamily', 'postscript'].includes(values.field)) throw new Error('field must be subfamily or postscript.');
		const ps = values.field === 'postscript';
		if (ps && fvar.instanceSize !== 6 + fvar.axisCount * 4) throw new Error('This fvar layout has no PostScript instance name field.');
		const value = nameID(payloads, values.nameID, 2, ps);
		if (!ps && value < 256 && value !== 2 && value !== 17)
			throw new Error('Instance subfamily name IDs must be 2, 17, or font-specific IDs.');
		if (ps && value < 256 && value !== 6) throw new Error('Instance PostScript name IDs must be 6, 65535, or font-specific IDs.');
		return { tag: 'fvar', offset: fvar.instanceStart + index * fvar.instanceSize + (ps ? 4 + fvar.axisCount * 4 : 0), value };
	}
	if (id === 'fvar.default-style') {
		if (!['wght', 'wdth'].includes(values.axis)) throw new Error('axis must be wght or wdth.');
		const axis = fvar.parsed.axes.find((axis) => axis.axisTag === values.axis);
		if (!axis) throw new Error(`No authoritative ${values.axis} axis exists.`);
		need(payloads, 'OS/2', 8);
		const value = values.axis === 'wght' ? integer(axis.defaultValue, 1, 1000, 'Default weight') :
			[50, 62.5, 75, 87.5, 100, 112.5, 125, 150, 200].indexOf(axis.defaultValue) + 1;
		if (!value) throw new Error('Default width does not exactly match a standard OS/2 width class; no nearest-class guess is made.');
		return { tag: 'OS/2', offset: values.axis === 'wght' ? 4 : 6, value };
	}
	if (id === 'fvar.add-instance') {
		if (fvar.instanceCount === 65535) throw new Error('fvar instance count would overflow.');
		const name = nameID(payloads, values.nameID);
		const coordinates = coords(values.coordinates, fvar);
		const ps = nameID(payloads, values.postScriptNameID ?? 65535, 6, true);
		if (ps < 256 && ps !== 6) throw new Error('Invalid PostScript name ID.');
		if (fvar.instanceSize === 4 + fvar.axisCount * 4 && ps !== 65535)
			throw new Error('The existing instance layout has no PostScript name field.');
		if (fvar.parsed.instances.some((instance) => instance.coordinates.every((value, i) => value === coordinates[i])))
			throw new Error('An instance already exists at these coordinates; custom instances are not overwritten or duplicated.');
		return { tag: 'fvar', append: true, fvar, name, ps, coordinates };
	}
	throw new Error(`Unknown variable metadata repair: ${id}`);
}

export function applyVariable(step, payloads) {
	const edit = variableEdit(step, payloads);
	if (!edit.append) {
		const bytes = need(payloads, edit.tag).slice();
		view(bytes).setUint16(edit.offset, edit.value);
		payloads.set(edit.tag, bytes);
		return;
	}
	const { fvar, name, ps, coordinates } = edit;
	const bytes = new Uint8Array(fvar.bytes.length + fvar.instanceSize);
	bytes.set(fvar.bytes.subarray(0, fvar.end));
	bytes.set(fvar.bytes.subarray(fvar.end), fvar.end + fvar.instanceSize);
	const v = view(bytes);
	v.setUint16(12, fvar.instanceCount + 1);
	v.setUint16(fvar.end, name);
	coordinates.forEach((value, i) => v.setInt32(fvar.end + 4 + i * 4, value * 65536));
	if (fvar.instanceSize === 6 + fvar.axisCount * 4)
		v.setUint16(fvar.end + 4 + fvar.axisCount * 4, ps);
	payloads.set('fvar', bytes);
}

export function verifyVariable(before, after, steps) {
	const failures = [];
	const masks = new Map();
	const appendSteps = steps.filter((step) => ['fvar.add-instance', 'fvar.standard-instance'].includes(step.id));
	if (appendSteps.length > 1) throw new Error('Only one appended instance per transaction is supported.');
	for (const step of steps) {
		const edit = variableEdit(step, before);
		if (!masks.has(edit.tag)) masks.set(edit.tag, []);
		if (!edit.append) {
			masks.get(edit.tag).push([edit.offset, edit.offset + 2]);
			// A later explicit edit of the same field supersedes this one.
			const later = steps.slice(steps.indexOf(step) + 1).some((other) => {
				const next = variableEdit(other, before);
				return !next.append && next.tag === edit.tag && next.offset === edit.offset;
			});
			if (!later && view(need(after, edit.tag)).getUint16(edit.offset) !== edit.value)
				failures.push(`${edit.tag} did not retain the requested name/style value.`);
		} else {
			masks.get('fvar').push([12, 14]);
			const current = readFvar(after);
			const instance = current.parsed.instances.at(-1);
			if (current.instanceCount !== edit.fvar.instanceCount + 1 ||
				instance.subfamilyNameID !== edit.name || instance.flags !== 0 ||
				!same(instance.coordinates, edit.coordinates) ||
				(instance.postScriptNameID !== undefined && instance.postScriptNameID !== edit.ps))
				failures.push('Appended instance does not match the authoritative metadata.');
			if (!same(edit.fvar.bytes.subarray(edit.fvar.end), current.bytes.subarray(current.end)))
				failures.push('Opaque fvar suffix changed.');
		}
	}
	for (const [tag, ranges] of masks) {
		const a = need(before, tag);
		const b = need(after, tag);
		const appended = tag === 'fvar' && appendSteps.length;
		const end = appended ? readFvar(before).end : a.length;
		if (!maskedEqual(a.subarray(0, end), b.subarray(0, end), ranges) ||
			(!appended && a.length !== b.length))
			failures.push(`Unselected ${tag} metadata, coordinates, or opaque bytes changed.`);
		if (tag === 'fvar') readFvar(after);
		if (tag === 'STAT') readStat(after);
	}
	return { failures, handledTags: [...masks.keys()] };
}
