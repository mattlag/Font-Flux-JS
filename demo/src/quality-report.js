export async function preflightAudit(result, context) {
	const { buffer, ...report } = result;
	const outputFingerprint = buffer ? [...new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))]
		.map((byte) => byte.toString(16).padStart(2, '0')).join('') : null;
	return {
		...report, kind: 'export-preflight', ...context,
		profileVersion: result.output?.profileVersion ?? context.profileVersion ?? null,
		faceIndex: 0, scope: 'selected-project-face', outputFingerprint,
	};
}

export function candidateExtension(buffer, format) {
	if (format === 'woff' || format === 'woff2') return `.${format}`;
	const view = new DataView(buffer);
	if (format === 'sfnt') return view.getUint32(0) === 0x4f54544f ? '.otf' : '.ttf';
	if (format === 'collection') {
		for (let index = 0; index < view.getUint32(8); index++)
			if (view.getUint32(view.getUint32(12 + index * 4)) === 0x4f54544f) return '.otc';
		return '.ttc';
	}
	throw new Error(`No verified download filename is defined for ${format}.`);
}
export function downloadQualityFile(buffer, name, type = 'application/octet-stream') {
	const url = URL.createObjectURL(new Blob([buffer], { type }));
	const link = document.createElement('a');
	try {
		link.href = url;
		link.download = name;
		document.body.appendChild(link);
		link.click();
	} finally {
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
}
