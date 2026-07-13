#!/usr/bin/env node
// Offline mirror of the Microsoft OpenType specification (learn.microsoft.com).
//
// Downloads the published spec pages (core chapters, appendices and every
// font-table page) as self-contained, offline-viewable HTML into
// specs/opentype/. Images referenced by each page are downloaded into
// specs/opentype/media/ and intra-spec links are rewritten to the local
// copies so the mirror can be browsed without a network connection.
//
// The OpenType specification text is published by Microsoft under the
// Creative Commons Attribution 4.0 International license. See specs/README.md
// for attribution details. Apple's TrueType Reference Manual is NOT mirrored
// (it is all-rights-reserved); the OpenType appendices cover the TrueType
// outline and instruction chapters instead.
//
// Usage:  node specs/download-spec.mjs
//         node specs/download-spec.mjs cmap head glyf   (subset)

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://learn.microsoft.com/en-us/typography/opentype/spec/';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'opentype');
const MEDIA = join(OUT, 'media');

// Core chapters + appendices (TrueType instruction chapters included here).
const CHAPTERS = [
	'index',
	'overview',
	'otff',
	'ttochap1',
	'chapter2',
	'otvaroverview',
	'otvarcommonformats',
	'errata',
	'recom',
	'ttoreg',
	'dvaraxisreg',
	'ttch01',
	'tt_instructing_glyphs',
	'tt_instructions',
	'tt_graphics_state',
	'ompl',
	'glyphformatcomparison',
	'changes',
];

// Every OpenType font-table page (slugs match learn.microsoft.com; OS/2 -> os2).
// NOTE: the Apple-only tables bdat, bloc and ltag are intentionally omitted —
// they are not part of the Microsoft OpenType spec (OT uses EBDT/EBLC/CBDT/CBLC
// instead) and are documented only in Apple's TrueType Reference Manual, which
// is all-rights-reserved and therefore not mirrored here.
const TABLES = [
	'avar',
	'base',
	'cbdt',
	'cblc',
	'cff',
	'cff2',
	'cmap',
	'colr',
	'cpal',
	'cvar',
	'cvt',
	'dsig',
	'ebdt',
	'eblc',
	'ebsc',
	'fpgm',
	'fvar',
	'gasp',
	'gdef',
	'glyf',
	'gpos',
	'gsub',
	'gvar',
	'hdmx',
	'head',
	'hhea',
	'hmtx',
	'hvar',
	'jstf',
	'kern',
	'loca',
	'ltsh',
	'math',
	'maxp',
	'merg',
	'meta',
	'mvar',
	'name',
	'os2',
	'pclt',
	'post',
	'prep',
	'sbix',
	'stat',
	'svg',
	'vdmx',
	'vhea',
	'vmtx',
	'vorg',
	'vvar',
];

const ALL_SLUGS = [...CHAPTERS, ...TABLES];
const SLUG_SET = new Set(ALL_SLUGS);

const argv = process.argv.slice(2);
const slugs = argv.length ? argv.map((s) => s.toLowerCase()) : ALL_SLUGS;

/**
 * Pull the article body out of a Microsoft Learn page. There are several
 * `<div class="content">` containers (one just wraps the <h1> header); the
 * real article body is the largest, so we depth-match each candidate and keep
 * the biggest. The <h1> heading is prepended from the header container.
 */
function extractContent(html) {
	const marker = '<div class="content">';
	let best = '';
	let from = 0;
	let start;
	while ((start = html.indexOf(marker, from)) !== -1) {
		from = start + marker.length;
		const openTag = start + marker.length;
		const re = /<div\b|<\/div>/g;
		re.lastIndex = openTag;
		let depth = 1;
		let end = html.length;
		let m;
		while ((m = re.exec(html))) {
			if (m[0] === '</div>') {
				depth--;
				if (depth === 0) {
					end = m.index;
					break;
				}
			} else {
				depth++;
			}
		}
		const body = html.slice(openTag, end);
		if (body.length > best.length) best = body;
	}
	if (!best) return null;

	// Grab the <h1> heading (lives in the header container).
	let heading = '';
	const h1 = html.indexOf('<h1');
	if (h1 !== -1) {
		const h1end = html.indexOf('</h1>', h1);
		if (h1end !== -1) heading = html.slice(h1, h1end + 5);
	}
	return heading + '\n' + best;
}

/** Rewrite intra-spec anchors and image srcs to local offline copies. */
function localize(content, mediaFiles) {
	// <a href="cmap">, href="cmap#foo", href="./cmap", absolute learn URLs.
	content = content.replace(/href="([^"]*)"/g, (whole, href) => {
		let h = href;
		const absPrefix = '/en-us/typography/opentype/spec/';
		if (h.startsWith(absPrefix)) h = h.slice(absPrefix.length);
		else if (h.startsWith('./')) h = h.slice(2);
		if (h.startsWith('http') || h.startsWith('#') || h.startsWith('mailto:')) {
			return whole;
		}
		const [slug, anchor] = h.split('#');
		if (SLUG_SET.has(slug)) {
			return `href="${slug}.html${anchor ? '#' + anchor : ''}"`;
		}
		return whole;
	});
	// <img src="..."> -> media/<file>
	content = content.replace(/src="([^"]*)"/g, (whole, src) => {
		const file = mediaFiles.get(src);
		return file ? `src="media/${file}"` : whole;
	});
	return content;
}

async function fetchText(url) {
	const res = await fetch(url, {
		headers: { 'user-agent': 'font-flux-spec-mirror' },
	});
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	return res.text();
}

async function downloadImages(content, pageUrl) {
	const map = new Map();
	const srcs = new Set();
	for (const m of content.matchAll(/<img[^>]+src="([^"]+)"/g)) srcs.add(m[1]);
	for (const src of srcs) {
		if (src.startsWith('data:')) continue;
		let abs;
		try {
			abs = new URL(src, pageUrl).href;
		} catch {
			continue;
		}
		const clean = abs.split('?')[0];
		const name = clean.split('/').pop() || `img-${map.size}`;
		try {
			const res = await fetch(abs, {
				headers: { 'user-agent': 'font-flux-spec-mirror' },
			});
			if (!res.ok) continue;
			const buf = Buffer.from(await res.arrayBuffer());
			await writeFile(join(MEDIA, name), buf);
			map.set(src, name);
		} catch {
			// skip unreachable image
		}
	}
	return map;
}

function wrap(slug, content) {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${slug} — OpenType spec (offline mirror)</title>
<style>
 body{font:16px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
      max-width:60rem;margin:0 auto;padding:1.5rem;color:#1b1b1b;background:#fff}
 .mirror-note{background:#fff4ce;border:1px solid #e6d27a;padding:.6rem .9rem;
      border-radius:6px;font-size:.85rem;margin-bottom:1.5rem}
 .mirror-note a{color:#0b5cad}
 table{border-collapse:collapse;margin:1rem 0;display:block;overflow:auto}
 th,td{border:1px solid #ccc;padding:.35rem .6rem;text-align:left;vertical-align:top}
 th{background:#f3f3f3}
 code,pre{font-family:Consolas,Menlo,monospace;background:#f5f5f5}
 pre{padding:.8rem;overflow:auto;border-radius:6px}
 code{padding:.1rem .3rem;border-radius:3px}
 img{max-width:100%}
 h1,h2,h3{line-height:1.25}
 a{color:#0b5cad}
</style>
</head>
<body>
<div class="mirror-note">Offline mirror of
 <a href="${BASE}${slug === 'index' ? '' : slug}">${BASE}${slug === 'index' ? '' : slug}</a>.
 OpenType spec © Microsoft, CC BY 4.0. Regenerate with
 <code>node specs/download-spec.mjs</code>. &nbsp;<a href="index.html">Spec index</a></div>
${content}
</body>
</html>
`;
}

async function main() {
	await mkdir(MEDIA, { recursive: true });
	let ok = 0;
	const failed = [];
	for (const slug of slugs) {
		const url = BASE + (slug === 'index' ? '' : slug);
		try {
			const html = await fetchText(url);
			const content = extractContent(html);
			if (!content) throw new Error('no <h1> content found');
			const media = await downloadImages(content, url);
			const localized = localize(content, media);
			await writeFile(join(OUT, `${slug}.html`), wrap(slug, localized), 'utf8');
			ok++;
			process.stdout.write(`  ok  ${slug}\n`);
		} catch (err) {
			failed.push(slug);
			process.stdout.write(`FAIL  ${slug}  (${err.message})\n`);
		}
	}
	process.stdout.write(
		`\nDone: ${ok}/${slugs.length} pages saved to specs/opentype/\n`,
	);
	if (failed.length) process.stdout.write(`Failed: ${failed.join(', ')}\n`);
}

main();
