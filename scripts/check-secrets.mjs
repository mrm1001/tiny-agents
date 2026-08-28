/**
 * Refuses to let a credential become part of a public repository's history.
 *
 *   node scripts/check-secrets.mjs      (part of `npm run check`)
 *
 * `.gitignore` is the primary defence; this is the second one, because a
 * gitignore entry is easy to defeat by accident — `git add -f`, a renamed file,
 * a key pasted into a lesson while drafting. Once a key is in a public repo's
 * history, rotating it is the only fix.
 *
 * Checks what git actually tracks, not what is on disk, so an untracked `.env`
 * full of real keys passes — that is the point of it.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

let fails = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); fails++; };

const tracked = git('ls-files', '-z').split('\0').filter(Boolean);

// 1. The env file itself, however it got named.
for (const file of tracked) {
  if (/(^|\/)\.env($|\.)/.test(file) && !file.endsWith('.env.example'))
    fail(`${file} is tracked — untrack it: git rm --cached "${file}"`);
}

// 2. Anything key-shaped in a tracked file. `.env.example` may hold the
//    placeholder prefix, so a bare `sk-ant-...` is not a match on its own.
const PATTERNS = [
  [/sk-ant-[A-Za-z0-9_-]{20,}/, 'an Anthropic API key'],
  [/sk-[A-Za-z0-9]{32,}/, 'an OpenAI-style API key'],
  [/gh[pousr]_[A-Za-z0-9]{20,}/, 'a GitHub token'],
];
for (const file of tracked) {
  let text;
  try {
    text = readFileSync(join(root, file), 'utf8');
  } catch {
    continue; // deleted, or binary we cannot decode — nothing to scan.
  }
  for (const [pattern, what] of PATTERNS) {
    const m = text.match(pattern);
    if (m) fail(`${file} contains what looks like ${what} (${m[0].slice(0, 12)}…)`);
  }
}

console.log(
  `secrets: ${tracked.length} tracked files scanned · ` +
    `${fails === 0 ? 'SECRETS OK — 0 failures' : `${fails} problem(s)`}`,
);
process.exit(fails ? 1 : 0);
