/**
 * Creates the loading screen with drag-and-drop + file browse.
 * Calls onFontLoaded(arrayBuffer, fileName) when a font is selected.
 */
export function createLoadingScreen(container, onFontLoaded) {
	const ACCEPT = '.otf,.ttf,.woff,.woff2,.ttc,.otc,.cff,.pfb,.pfa,.json';

	const versionLine = `Version ${__APP_VERSION__}, updated ${formatBuildDate(__BUILD_DATE__)}.`;

	container.innerHTML = `
		<div class="loading-screen">
			<div class="loading-content">
				<img class="hero-logo" src="${new URL('../assets/font-flux-js-logo.svg', import.meta.url).href}" alt="font flux js">
				<p class="hero-tagline">Convert fonts to JSON, make edits, then convert them back!</p>
				<p class="hero-links">An open source frontend library. Read the <a href="docs/" target="_blank" rel="noopener">Docs</a>, use it with <a href="https://www.npmjs.com/package/font-flux-js" target="_blank" rel="noopener">NPM</a> or <a href="https://github.com/mattlag/Font-Flux-JS" target="_blank" rel="noopener">GitHub</a></p>
				<p class="hero-demo-hint">This demo app can edit metadata, subset glyphs, and change file formats.<br>${versionLine}</p>
				<div class="beta-notice"><strong>June 2026</strong><br>Things seem good - have you tried it yet? <a href="mailto:mail@glyphrstudio.com">mail@glyphrstudio.com</a></div>
				<p class="tagline">Drop a font file anywhere, or <a href="#" class="browse-link">browse for files</a></p>
				<p class="supported-formats">Supports OTF, TTF, WOFF, WOFF2, TTC, OTC, CFF, PFB, PFA, JSON</p>
				<input type="file" accept="${ACCEPT}" hidden>
				<div class="status-area"></div>
			</div>
		</div>
	`;

	const screen = container.querySelector('.loading-screen');
	const fileInput = container.querySelector('input[type="file"]');
	const browseLink = container.querySelector('.browse-link');
	const statusArea = container.querySelector('.status-area');

	// Browse link triggers file input
	browseLink.addEventListener('click', (e) => {
		e.preventDefault();
		fileInput.click();
	});

	// File input change
	fileInput.addEventListener('change', () => {
		if (fileInput.files.length > 0) {
			handleFile(fileInput.files[0]);
		}
	});

	// Drag events on the whole screen
	let dragCounter = 0;

	screen.addEventListener('dragenter', (e) => {
		e.preventDefault();
		dragCounter++;
		screen.classList.add('dragover');
	});

	screen.addEventListener('dragleave', () => {
		dragCounter--;
		if (dragCounter === 0) screen.classList.remove('dragover');
	});

	screen.addEventListener('dragover', (e) => {
		e.preventDefault();
	});

	screen.addEventListener('drop', (e) => {
		e.preventDefault();
		dragCounter = 0;
		screen.classList.remove('dragover');
		if (e.dataTransfer.files.length > 0) {
			handleFile(e.dataTransfer.files[0]);
		}
	});

	function handleFile(file) {
		// Clear previous errors
		statusArea.innerHTML = '';

		// Validate extension
		const ext = file.name.split('.').pop().toLowerCase();
		const valid = [
			'otf',
			'ttf',
			'woff',
			'woff2',
			'ttc',
			'otc',
			'cff',
			'pfb',
			'pfa',
			'json',
		];
		if (!valid.includes(ext)) {
			showError(
				`Unsupported file type ".${ext}". Please use OTF, TTF, WOFF, WOFF2, TTC, OTC, CFF, PFB, PFA, or JSON.`,
			);
			return;
		}

		// Show loading state
		showLoading(file.name);

		const reader = new FileReader();
		reader.onload = () => {
			onFontLoaded(reader.result, file.name);
		};
		reader.onerror = () => {
			showError('Failed to read the file. Please try again.');
		};
		if (ext === 'json') {
			reader.readAsText(file, 'utf-8');
		} else {
			reader.readAsArrayBuffer(file);
		}
	}

	function showError(message) {
		statusArea.innerHTML = `<div class="loading-error">${message}</div>`;
	}

	function showLoading(fileName) {
		statusArea.innerHTML = `
			<div class="loading-spinner">
				<div class="spinner"></div>
				<span>Parsing ${fileName}…</span>
			</div>
		`;
	}

	return {
		showError(message) {
			showError(message);
		},
	};
}

/**
 * Format an ISO `YYYY-MM-DD` build date as e.g. "May 8th 2026".
 * Falls back to the input string if parsing fails.
 */
function formatBuildDate(iso) {
	if (typeof iso !== 'string') return String(iso ?? '');
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
	if (!m) return iso;
	const year = Number(m[1]);
	const month = Number(m[2]) - 1;
	const day = Number(m[3]);
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];
	const ord = (n) => {
		const mod100 = n % 100;
		if (mod100 >= 11 && mod100 <= 13) return 'th';
		switch (n % 10) {
			case 1:
				return 'st';
			case 2:
				return 'nd';
			case 3:
				return 'rd';
			default:
				return 'th';
		}
	};
	return `${months[month]} ${day}${ord(day)} ${year}`;
}
