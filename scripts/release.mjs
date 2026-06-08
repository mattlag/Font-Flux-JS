/**
 * Release helper — tag the current commit with the package.json version and
 * push it, which triggers the Release and Deploy Demo GitHub workflows.
 *
 * Run via `npm run release` or the VS Code task "Release: tag & push".
 *
 * Guards (each aborts before anything is pushed):
 *   1. Must be on the `main` branch.
 *   2. Working tree must be clean (no staged/unstaged/untracked changes).
 *   3. Local commit must match the remote (push your version bump first).
 *   4. The tag `vX.Y.Z` must not already exist locally or on the remote.
 *
 * This script never bumps the version — edit package.json yourself first,
 * commit, and push, then run this to cut the release.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';

/** Run a git command and return trimmed stdout. */
function git(args, { allowFail = false } = {}) {
	try {
		return execFileSync('git', args, { encoding: 'utf8' }).trim();
	} catch (err) {
		if (allowFail) return null;
		throw err;
	}
}

function fail(message) {
	console.error(`${RED}✗ ${message}${RESET}`);
	process.exit(1);
}

function info(message) {
	console.log(`${YELLOW}• ${message}${RESET}`);
}

function ok(message) {
	console.log(`${GREEN}✓ ${message}${RESET}`);
}

// 1. Read the version we're releasing.
const pkg = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url)),
);
const version = pkg.version;
if (!/^\d+\.\d+\.\d+/.test(version)) {
	fail(`package.json version "${version}" is not a valid semver string.`);
}
const tag = `v${version}`;
info(`Preparing release ${tag}`);

// 2. Must be on main.
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch !== 'main') {
	fail(`You are on "${branch}". Switch to "main" before releasing.`);
}
ok('On main branch');

// 3. Working tree must be clean.
const status = git(['status', '--porcelain']);
if (status) {
	fail(
		'Working tree is not clean. Commit or stash your changes (and push the version bump) first.',
	);
}
ok('Working tree is clean');

// 4. Local main must be in sync with origin/main.
git(['fetch', '--quiet', 'origin', 'main'], { allowFail: true });
const local = git(['rev-parse', 'HEAD']);
const remote = git(['rev-parse', 'origin/main'], { allowFail: true });
if (remote && local !== remote) {
	fail(
		'Local main differs from origin/main. Push your version-bump commit before tagging.',
	);
}
ok('Local main matches origin/main');

// 5. Tag must not already exist locally or remotely.
const localTag = git(['tag', '--list', tag]);
if (localTag) {
	fail(`Tag ${tag} already exists locally. Delete it or bump the version.`);
}
const remoteTag = git(['ls-remote', '--tags', 'origin', tag], {
	allowFail: true,
});
if (remoteTag) {
	fail(`Tag ${tag} already exists on origin. Bump the version.`);
}
ok(`Tag ${tag} is available`);

// 6. Create and push the tag.
info(`Creating tag ${tag}...`);
git(['tag', '-a', tag, '-m', `Release ${tag}`]);
info(`Pushing ${tag} to origin...`);
try {
	git(['push', 'origin', tag]);
} catch (err) {
	// Roll back the local tag so a retry isn't blocked by guard #5.
	git(['tag', '-d', tag], { allowFail: true });
	fail(
		`Failed to push tag. Local tag removed so you can retry.\n${err.message}`,
	);
}

ok(`Pushed ${tag}.`);
console.log(
	`\n${GREEN}Release triggered.${RESET} Watch progress at:\n` +
		'  https://github.com/mattlag/Font-Flux-JS/actions\n\n' +
		'CI will publish to npm, create the GitHub Release, and deploy the demo.',
);
