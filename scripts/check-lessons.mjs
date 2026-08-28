/**
 * Checks every lesson against the format the course promises.
 *
 *   node scripts/check-lessons.mjs        (or: npm run check:lessons)
 *
 * Four things, none of which the Astro build can see:
 *
 *   1. the five-minute reading budget;
 *   2. every `#s-<id>` citation in the prose resolves to a source that lesson
 *      actually declares — a dead citation link is silent in HTML;
 *   3. every declared source is cited somewhere in the prose, so the Sources
 *      list stays a bibliography rather than a reading pile;
 *   4. root-relative Markdown links point at pages that exist.
 *
 * The build enforces the rest (citation keys resolve against the library, and a
 * non-locked lesson must declare sources) because those belong in the schema,
 * where CI runs them. See `npm run check:sources` for library integrity and the
 * blocked worklist.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { proseWords, readingMinutes, BUDGET_WORDS, WARN_WORDS, WORDS_PER_MINUTE } from '../src/lib/reading-time.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lessonsDir = join(root, 'src/content/lessons');
const { isKnownSourceId } = await import(join(root, 'src/data/library.ts'));

let fails = 0;
let warns = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); fails++; };
const warn = (msg) => { console.log(`  warn ${msg}`); warns++; };

// --- the word counter is load-bearing, so it gets tested ----------------------
// No test runner in this repo; these run every time instead, in microseconds.
const COUNTER_CASES = [
  ['plain prose',        'One two three four five.', 5],
  ['headings count',     '## A real heading', 3],
  ['link label only',    'See [Anthropic post](#s-anthropic-bea) now.', 4],
  ['code fence skipped', 'Before.\n\n```python\ndef f(): return 1\n```\n\nAfter.', 2],
  ['unclosed fence',     'Before.\n\n```js\nlots of code here', 1],
  ['inline code counts', 'Check `stop_reason` please.', 3],
  ['table scaffolding',  '| a | b |\n|---|---|\n| c | d |', 4],
  ['image dropped',      'Look ![a nice alt](/x.png) here.', 2],
  ['comment dropped',    'Kept <!-- not this --> too.', 2],
  ['list markers',       '- one\n- two', 2],
  ['reference def',      'Word.\n\n[key]: https://example.com', 1],
];
for (const [name, input, want] of COUNTER_CASES) {
  const got = proseWords(input);
  if (got !== want) fail(`word counter, ${name}: expected ${want}, got ${got}`);
}

// --- frontmatter -------------------------------------------------------------
/**
 * Just enough YAML for the fields this script needs: scalars and `- item`
 * lists. The build validates frontmatter properly via Zod; duplicating a YAML
 * parser here would be the second implementation of something already correct.
 */
const parseFrontmatter = (raw, file) => {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: no frontmatter`);
  const data = {};
  let key = null;
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && key) {
      (data[key] ??= []).push(item[1].trim().replace(/^["']|["']$/g, ''));
      continue;
    }
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    const value = kv[2].trim();
    data[key] = value === '' ? [] : value.replace(/^["']|["']$/g, '');
  }
  return { data, body: m[2] };
};

// Every route a Markdown link may target.
const files = readdirSync(lessonsDir).filter((f) => f.endsWith('.md')).sort();
const slugs = new Set(files.map((f) => f.replace(/\.md$/, '')));
const ROUTES = new Set(['/', '/lessons/', ...[...slugs].map((s) => `/lessons/${s}/`)]);

console.log(`${files.length} lessons · budget ${BUDGET_WORDS} words (${WORDS_PER_MINUTE} wpm)\n`);

for (const file of files) {
  const raw = readFileSync(join(lessonsDir, file), 'utf8');
  const { data, body } = parseFrontmatter(raw, file);
  const declared = [...(Array.isArray(data.sources) ? data.sources : []),
                    ...(Array.isArray(data.extraReading) ? data.extraReading : [])];
  const isOutline = data.outline === 'true';
  const isLocked = data.status === 'locked';
  const words = proseWords(body);
  const notes = [];

  // 1. Reading budget. Outlines are bullets for review, not the finished read.
  if (!isOutline && !isLocked) {
    if (words > BUDGET_WORDS) fail(`${file}: ${words} words is over the ${BUDGET_WORDS}-word budget`);
    else if (words > WARN_WORDS) warn(`${file}: ${words} words — approaching the ${BUDGET_WORDS} budget`);
  }

  // 2. Citations resolve. Dead `#s-` links render as normal anchors that jump
  //    nowhere, which no build step and no browser will complain about.
  const cited = new Set([...body.matchAll(/\(#s-([a-z0-9][a-z0-9-]*)\)/g)].map((m) => m[1]));
  for (const id of cited) {
    if (declared.includes(id)) continue;
    fail(
      isKnownSourceId(id)
        ? `${file}: cites #s-${id}, which is in the library but not in this lesson's sources`
        : `${file}: cites #s-${id}, which is not a known source`,
    );
  }

  // 3. Declared sources are used. `extraReading` is explicitly exempt — it is
  //    for things worth reading that the prose never leans on.
  if (!isLocked) {
    for (const id of Array.isArray(data.sources) ? data.sources : []) {
      if (!cited.has(id)) warn(`${file}: declares ${id} in sources but never cites it`);
    }
  }

  // 4. Internal links. The hast plugin adds the base path, but it cannot know
  //    whether the page exists.
  for (const [, target] of body.matchAll(/\]\((\/[^)#\s]*)/g)) {
    const path = target.endsWith('/') || target.includes('.') ? target : `${target}/`;
    if (!ROUTES.has(path)) fail(`${file}: links to ${target}, which is not a page`);
  }

  // 5. A source listed twice renders twice and gets two identical anchors.
  const dupes = declared.filter((id, i) => declared.indexOf(id) !== i);
  for (const id of new Set(dupes)) fail(`${file}: ${id} is listed twice`);

  if (isOutline) notes.push('outline');
  if (isLocked) notes.push('locked');
  const time = isOutline || isLocked ? '' : `${readingMinutes(body)} min`;
  console.log(
    `  ${file.replace(/\.md$/, '').padEnd(38)} ${String(words).padStart(5)}w ${time.padStart(6)}` +
      `  ${declared.length} src${notes.length ? `  (${notes.join(', ')})` : ''}`,
  );
}

console.log(
  `\n${fails === 0 ? 'LESSONS OK' : `${fails} problem(s)`}${warns ? ` · ${warns} warning(s)` : ''}` +
    `${fails === 0 ? ' — 0 failures' : ''}`,
);
process.exit(fails ? 1 : 0);
