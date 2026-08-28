/**
 * Sanity checks on the shared source library.
 *
 *   node scripts/check-sources.mjs      (or: npm run check:sources)
 *
 * Also prints the blocked worklist — sources that could not be retrieved and need
 * fetching by hand — and flags library entries whose cached file is missing or
 * stale, so `sources/` and `library.ts` don't drift apart.
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { LIBRARY, CORE_SOURCES, BLOCKED_SOURCES } = await import(join(root, 'src/data/library.ts'));

let fails = 0;
const fail = (msg) => {
  console.log(`  FAIL ${msg}`);
  fails++;
};

// --- tracking parameters -----------------------------------------------------
// These arrive attached to shared links and are never needed. Explicitly asked
// for, so guarded rather than just tidied once.
const TRACKING = /[?&](utm_[a-z]+|ref|ref_src|fbclid|gclid|mc_cid|mc_eid|si|igshid)=/i;
for (const s of LIBRARY) {
  if (TRACKING.test(s.url)) fail(`${s.id}: url carries a tracking parameter — ${s.url}`);
}

// --- uniqueness --------------------------------------------------------------
const seenId = new Map();
const seenUrl = new Map();
for (const s of LIBRARY) {
  if (seenId.has(s.id)) fail(`duplicate id "${s.id}"`);
  seenId.set(s.id, s);
  // Compare ignoring a trailing slash, so the same page can't sneak in twice.
  const key = s.url.replace(/\/$/, '');
  if (seenUrl.has(key)) fail(`${s.id} duplicates the url of ${seenUrl.get(key)}`);
  seenUrl.set(key, s.id);
}

// --- shape -------------------------------------------------------------------
for (const s of LIBRARY) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(s.id)) fail(`${s.id}: id must be lower-case kebab-case`);
  if (s.date && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s.date))
    fail(`${s.id}: date "${s.date}" must be YYYY, YYYY-MM or YYYY-MM-DD`);
  if (!/^https?:\/\//.test(s.url)) fail(`${s.id}: url must be absolute`);
  if (s.blocked && !s.blocked.reason) fail(`${s.id}: blocked without a reason`);
}

console.log(
  `library: ${LIBRARY.length} sources · ${CORE_SOURCES.length} course-wide · ` +
    `${BLOCKED_SOURCES.length} blocked`,
);

// --- cached files ------------------------------------------------------------
const rawDir = join(root, 'sources/raw');
const textDir = join(root, 'sources/text');
const rawFiles = existsSync(rawDir)
  ? readdirSync(rawDir).filter((f) => !f.startsWith('.'))
  : [];

if (rawFiles.length) {
  console.log('\ncached source files:');
  for (const file of rawFiles.sort()) {
    const id = file.replace(/\.[^.]+$/, '');
    const metaPath = join(textDir, `${id}.meta.json`);
    const inLibrary = seenId.has(id);
    let state;
    if (!existsSync(metaPath)) {
      state = 'NOT EXTRACTED — run: uv run scripts/ingest-source.py --scan';
    } else {
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      state = `${meta.words.toLocaleString()} words${meta.pages ? `, ${meta.pages}pp` : ''}`;
    }
    // Not an error: a file may be dropped in before its library entry is written.
    const link = inLibrary ? '' : '   (no library entry yet)';
    console.log(`  ${id.padEnd(26)} ${state}${link}`);
  }
}

// --- the worklist ------------------------------------------------------------
if (BLOCKED_SOURCES.length) {
  console.log('\nblocked — could not be retrieved, needs fetching by hand:');
  for (const s of BLOCKED_SOURCES) {
    console.log(`  ${s.id}`);
    console.log(`    ${s.url}`);
    console.log(`    ${s.blocked.reason.replace(/\s+/g, ' ').slice(0, 150)}…`);
  }
}

console.log(`\n${fails === 0 ? 'SOURCES OK — 0 failures' : `${fails} problem(s)`}`);
process.exit(fails ? 1 : 0);
