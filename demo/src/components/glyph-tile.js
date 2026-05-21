/**
 * Glyph tile renderer — shared component.
 *
 * Renders a single glyph's outlines onto a <canvas>, fitting the glyph
 * into the canvas with consistent padding. Used in the Preview tab grid,
 * the glyph detail panel, and anywhere else a vector preview is needed.
 *
 * Sizing rules:
 *  - The drawn area is fit to the UNION of the glyph's actual bounding box
 *    and the font's vertical metric box (descender→ascender). This keeps
 *    glyphs visually aligned in a grid while still ensuring oversize
 *    glyphs (large caps, descenders, swashes) are never clipped.
 *  - Horizontally we use the union of the bbox and the advance width.
 *  - Device-pixel-ratio aware: the backing store is dpr-scaled so tiles
 *    stay crisp on hi-dpi displays without changing CSS layout.
 *
 * Both TrueType (points with onCurve) and CFF (path commands M/L/C)
 * contour formats are supported.
 */

/**
 * Create a glyph tile canvas at the requested CSS size.
 *
 * @param {object} options
 * @param {object} options.glyph - A FontFlux glyph object (with `contours`).
 * @param {object} options.fontData - The full font data (uses .font.unitsPerEm/ascender/descender).
 * @param {number} [options.size=56] - CSS pixel size (square). Use `width`/`height` for non-square.
 * @param {number} [options.width] - Optional CSS pixel width.
 * @param {number} [options.height] - Optional CSS pixel height.
 * @param {number} [options.padding=0.08] - Inner padding as a fraction of the smaller dimension.
 * @param {string} [options.fillColor] - Glyph fill color (defaults to CSS --text or #1a1a1a).
 * @param {boolean} [options.showBounds=false] - Overlay baseline, x=0, and advanceWidth guide lines.
 * @returns {HTMLCanvasElement}
 */
export function createGlyphTile(options) {
	const canvas = document.createElement('canvas');
	canvas.className = 'glyph-thumb';
	drawGlyphTile(canvas, options);
	return canvas;
}

/**
 * Draw a glyph into an existing canvas. The canvas is resized (both backing
 * store and CSS) to match the requested dimensions.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} options - Same shape as `createGlyphTile`.
 */
export function drawGlyphTile(canvas, options) {
	const {
		glyph,
		fontData,
		size = 56,
		width = size,
		height = size,
		padding = 0.08,
		fillColor,
		showBounds = false,
	} = options;

	const dpr = window.devicePixelRatio || 1;
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	canvas.width = Math.round(width * dpr);
	canvas.height = Math.round(height * dpr);

	const ctx = canvas.getContext('2d');
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.scale(dpr, dpr);

	if (!glyph || !glyph.contours || glyph.contours.length === 0) return;

	const upm = fontData?.font?.unitsPerEm || 1000;
	const ascender = fontData?.font?.ascender ?? upm * 0.8;
	const descender = fontData?.font?.descender ?? -upm * 0.2;

	// Compute glyph bbox (including bezier control points — conservative but safe).
	let xMin = Infinity;
	let yMin = Infinity;
	let xMax = -Infinity;
	let yMax = -Infinity;
	const consider = (x, y) => {
		if (x == null || y == null) return;
		if (x < xMin) xMin = x;
		if (x > xMax) xMax = x;
		if (y < yMin) yMin = y;
		if (y > yMax) yMax = y;
	};
	for (const contour of glyph.contours) {
		for (const pt of contour) {
			consider(pt.x, pt.y);
			if (pt.x1 != null) consider(pt.x1, pt.y1);
			if (pt.x2 != null) consider(pt.x2, pt.y2);
		}
	}
	// If no finite extents (empty contours), bail.
	if (!Number.isFinite(xMin)) return;

	// Union with font metric box so glyphs share a common visual baseline.
	const boxXMin = Math.min(0, xMin);
	const boxXMax = Math.max(glyph.advanceWidth ?? xMax, xMax);
	const boxYMin = Math.min(descender, yMin);
	const boxYMax = Math.max(ascender, yMax);

	const boxW = Math.max(1, boxXMax - boxXMin);
	const boxH = Math.max(1, boxYMax - boxYMin);

	const pad = Math.max(1, Math.round(Math.min(width, height) * padding));
	const innerW = Math.max(1, width - pad * 2);
	const innerH = Math.max(1, height - pad * 2);
	const scale = Math.min(innerW / boxW, innerH / boxH);

	const scaledW = boxW * scale;
	const scaledH = boxH * scale;
	const offsetX = pad + (innerW - scaledW) / 2 - boxXMin * scale;
	const offsetY = pad + (innerH - scaledH) / 2 + boxYMax * scale;

	ctx.save();
	ctx.translate(offsetX, offsetY);
	ctx.scale(scale, -scale);

	ctx.beginPath();
	for (const contour of glyph.contours) {
		if (contour.length === 0) continue;

		if (contour[0].type) {
			// CFF path commands
			for (const cmd of contour) {
				switch (cmd.type) {
					case 'M':
						ctx.moveTo(cmd.x, cmd.y);
						break;
					case 'L':
						ctx.lineTo(cmd.x, cmd.y);
						break;
					case 'C':
						ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
						break;
				}
			}
			ctx.closePath();
		} else {
			// TrueType points (quadratic with implied on-curve midpoints)
			const first = contour[0];
			ctx.moveTo(first.x, first.y);
			let i = 1;
			while (i < contour.length) {
				const pt = contour[i];
				if (pt.onCurve) {
					ctx.lineTo(pt.x, pt.y);
					i++;
				} else {
					const next = contour[(i + 1) % contour.length];
					if (next.onCurve) {
						ctx.quadraticCurveTo(pt.x, pt.y, next.x, next.y);
						i += 2;
					} else {
						const midX = (pt.x + next.x) / 2;
						const midY = (pt.y + next.y) / 2;
						ctx.quadraticCurveTo(pt.x, pt.y, midX, midY);
						i++;
					}
				}
			}
			ctx.closePath();
		}
	}

	ctx.fillStyle = fillColor || resolveFillColor();
	ctx.fill('evenodd');
	ctx.restore();

	if (showBounds) {
		const baselineY = offsetY;
		const xZero = offsetX;
		const advance = glyph.advanceWidth ?? 0;
		const xAdvance = offsetX + advance * scale;

		ctx.save();
		ctx.lineWidth = 1;

		// Baseline (y=0) — horizontal
		ctx.strokeStyle = 'rgba(220, 50, 50, 0.85)';
		ctx.beginPath();
		ctx.moveTo(0, baselineY + 0.5);
		ctx.lineTo(width, baselineY + 0.5);
		ctx.stroke();

		// x=0 left boundary — vertical
		ctx.strokeStyle = 'rgba(50, 120, 220, 0.85)';
		ctx.beginPath();
		ctx.moveTo(Math.round(xZero) + 0.5, 0);
		ctx.lineTo(Math.round(xZero) + 0.5, height);
		ctx.stroke();

		// Advance width right boundary — vertical (dashed)
		ctx.strokeStyle = 'rgba(50, 120, 220, 0.85)';
		ctx.setLineDash([4, 3]);
		ctx.beginPath();
		ctx.moveTo(Math.round(xAdvance) + 0.5, 0);
		ctx.lineTo(Math.round(xAdvance) + 0.5, height);
		ctx.stroke();

		ctx.restore();
	}
}

function resolveFillColor() {
	try {
		const c = getComputedStyle(document.documentElement)
			.getPropertyValue('--text')
			.trim();
		if (c) return c;
	} catch {
		// non-DOM env, fall through
	}
	return '#1a1a1a';
}
