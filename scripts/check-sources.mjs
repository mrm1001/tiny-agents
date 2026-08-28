/**
 * Sanity checks on the shared source library, and the lookup used when picking
 * reading for a lesson.
 *
 *   node scripts/check-sources.mjs              (or: npm run check:sources)
 *   node scripts/check-sources.mjs --for loop   candidate sources for a component
 *   node scripts/check-sources.mjs --topics     coverage per component
 *
 * Also prints the blocked worklist — sources that could not be retrieved and need
 * fetching by hand — and flags library entries whose cached file is missing or
 * stale, so `sources/` and `library.ts` don't drift apart.
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { LIBRARY, CORE_SOURCES, BLOCKED_SOURCES, sourcesForTopic, topicCoverage } = await import(
  join(root, 'src/data/library.ts')
);
const { COMPONENTS } = await import(join(root, 'src/data/architecture.ts'));

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : (argv[i + 1] ?? true);
};

const wrap = (text, width, indent) =>
  text
    .replace(/\s+/g, ' ')
    .replace(new RegExp(`(.{1,${width}})(\\s|$)`, 'g'), `${indent}$1\n`)
    .trimEnd();

// --- --for <component>: the lookup used when choosing reading for a lesson -----
const forTopic = flag('--for');
if (typeof forTopic === 'string') {
  const known = COMPONENTS.map((c) => c.id);
  if (!known.includes(forTopic)) {
    console.error(`unknown component "${forTopic}"\nknown: ${known.join(', ')}`);
    process.exit(1);
  }
  const label = COMPONENTS.find((c) => c.id === forTopic).label;
  const hits = sourcesForTopic(forTopic);
  console.log(`sources for "${forTopic}" (${label}) — ${hits.length} readable\n`);
  for (const s of hits) {
    console.log(`  ${s.core ? '★' : '·'} ${s.id}  [${s.kind}]  ${s.topics.join(' ')}`);
    console.log(`      ${s.title}`);
    if (s.note) console.log(wrap(s.note, 74, '      '));
    console.log();
  }
  const blocked = sourcesForTopic(forTopic, true).filter((s) => s.blocked);
  if (blocked.length) console.log(`  (${blocked.length} more blocked: ${blocked.map((s) => s.id).join(', ')})`);
  process.exit(0);
}

// --- --topics: where the gaps are ---------------------------------------------
if (flag('--topics')) {
  const coverage = new Map(topicCoverage().map((c) => [c.topic, c.count]));
  console.log('readable sources per component:\n');
  // Count first, then the bar — a count wider than the bar would otherwise push
  // the columns out of alignment.
  for (const c of COMPONENTS) {
    const n = coverage.get(c.id) ?? 0;
    const warn = n === 0 ? '   ← none yet' : n <= 2 ? '   ← thin' : '';
    console.log(`  ${c.id.padEnd(14)} ${String(n).padStart(2)}  ${'█'.repeat(n)}${warn}`);
  }
  process.exit(0);
}

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
  // An untagged source is invisible to `--for`, which is how reading gets picked.
  if (!s.topics?.length) fail(`${s.id}: no topics — it will never surface for a lesson`);
  const knownTopics = COMPONENTS.map((c) => c.id);
  for (const t of s.topics ?? []) {
    if (!knownTopics.includes(t)) fail(`${s.id}: unknown topic "${t}"`);
  }
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
