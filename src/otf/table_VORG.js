/**
 * Font Flux JS : VORG table
 * Vertical Origin Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/vorg
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const VORG_HEADER_SIZE = 8;
const VERT_ORIGIN_METRIC_SIZE = 4;

export function parseVORG(rawBytes) {
	const reader = new DataReader(rawBytes);
	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const defaultVertOriginY = reader.int16();
	const numVertOriginYMetrics = reader.uint16();

	const vertOriginYMetrics = [];
	for (let i = 0; i < numVertOriginYMetrics; i++) {
		vertOriginYMetrics.push({
			glyphIndex: reader.uint16(),
			vertOriginY: reader.int16(),
		});
	}

	return {
		majorVersion,
		minorVersion,
		defaultVertOriginY,
		numVertOriginYMetrics,
		vertOriginYMetrics,
	};
}

export function writeVORG(vorg) {
	const majorVersion = vorg.majorVersion ?? 1;
	const minorVersion = vorg.minorVersion ?? 0;
	const defaultVertOriginY = vorg.defaultVertOriginY ?? 0;
	const metrics = vorg.vertOriginYMetrics ?? [];
	const numVertOriginYMetrics = vorg.numVertOriginYMetrics ?? metrics.length;
	const safeMetrics = metrics.slice(0, numVertOriginYMetrics);
	while (safeMetrics.length < numVertOriginYMetrics) {
		safeMetrics.push({ glyphIndex: 0, vertOriginY: defaultVertOriginY });
	}

	const w = new DataWriter(
		VORG_HEADER_SIZE + numVertOriginYMetrics * VERT_ORIGIN_METRIC_SIZE,
	);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.int16(defaultVertOriginY);
	w.uint16(numVertOriginYMetrics);

	for (const metric of safeMetrics) {
		w.uint16(metric.glyphIndex ?? 0);
		w.int16(metric.vertOriginY ?? defaultVertOriginY);
	}

	return w.toArray();
}
