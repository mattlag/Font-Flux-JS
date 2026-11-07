export function dataView(bytes) {
	if (!(bytes instanceof Uint8Array)) throw new Error('A complete table payload is required.');
	return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

export function equalBytes(a, b) {
	return a.length === b.length && a.every((byte, index) => byte === b[index]);
}

export function nameLayout(bytes) {
	const view = dataView(bytes);
	if (bytes.length < 6) throw new Error('The name table header is truncated.');
	const version = view.getUint16(0), count = view.getUint16(2), storage = view.getUint16(4);
	if (version > 1 || 6 + count * 12 > bytes.length)
		throw new Error('Unsupported or truncated name records.');
	let end = 6 + count * 12;
	const languages = [];
	if (version === 1) {
		if (end + 2 > bytes.length) throw new Error('The language-tag header is truncated.');
		const languageCount = view.getUint16(end);
		end += 2;
		if (end + languageCount * 4 > bytes.length) throw new Error('Language-tag records are truncated.');
		for (let i = 0; i < languageCount; i++) {
			const length = view.getUint16(end + i * 4), offset = view.getUint16(end + i * 4 + 2);
			if (storage + offset + length > bytes.length) throw new Error('A language-tag string is truncated.');
			languages.push(Array.from(bytes.subarray(storage + offset, storage + offset + length)));
		}
		end += languageCount * 4;
	}
	if (storage < end || storage > bytes.length) throw new Error('Invalid name string storage offset.');
	const records = [];
	for (let i = 0; i < count; i++) {
		const offset = 6 + i * 12;
		const key = [0, 2, 4, 6].map((field) => view.getUint16(offset + field));
		const length = view.getUint16(offset + 8), stringOffset = view.getUint16(offset + 10);
		if (storage + stringOffset + length > bytes.length) throw new Error('A name string is truncated.');
		records.push({ key, bytes: Array.from(bytes.subarray(storage + stringOffset, storage + stringOffset + length)), offset });
	}
	return { version, count, storage, end, records, languages };
}

export function metricAdvances(payloads, vertical = false) {
	const header = payloads.get(vertical ? 'vhea' : 'hhea');
	const metrics = payloads.get(vertical ? 'vmtx' : 'hmtx');
	const maxp = payloads.get('maxp');
	if (!header || header.length < 36 || !maxp || maxp.length < 6 || !metrics)
		throw new Error('Complete maxp and metric tables are required.');
	const count = dataView(maxp).getUint16(4), longCount = dataView(header).getUint16(34);
	if (!count || !longCount || longCount > count || metrics.length < longCount * 4 + (count - longCount) * 2)
		throw new Error('Metrics are incomplete; missing advances cannot be guessed.');
	const view = dataView(metrics);
	return Array.from({ length: count }, (_, index) => view.getUint16(Math.min(index, longCount - 1) * 4));
}
