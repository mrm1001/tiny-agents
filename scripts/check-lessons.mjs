/**
 * Checks every lesson against the format the course promises.
 *
 *   node scripts/check-lessons.mjs        (or: npm run check:lessons)
 *
 * A lesson is an index: key points, each pointing at the exact place in someone
 * else's writing where that point is explained properly. So the checks are about
 * whether the pointers do their job:
 *
 *   1. the five-minute reading budget, counting points as well as the body;
 *   2. every pointer names a *place* inside its source, not just the source;
 *   3. no source is pointed at twice for the same reason, and nothing sits in
 *      `extraReading` that a point already points at;
 *   4. `#s-` citations in the body resolve to an anchor that exists on the page;
 *   5. Markdown links go to pages that exist.
 *
 * The build enforces what belongs in a schema — a non-locked lesson has points,
 * every point has reading, every pointer resolves in the library. Use
 * `npm run check:sources` for library integrity and `node scripts/anchors.mjs`
 * to find the anchor a pointer should use.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';

import {
  proseWords,
  lessonWords,
  lessonMinutes,
  BUDGET_WORDS,
  WARN_WORDS,
  WORDS_PER_MINUTE,
} from '../src/lib/reading-time.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lessonsDir = join(root, 'src/content/lessons');
const { isKnownSourceId, LIBRARY } = await import(join(root, 'src/data/library.ts'));

// Sources whose pages have no linkable headings at all. A pointer into one names
// its section in prose and cannot do better, so not having an `href` is correct
// rather than an omission worth nagging about.
const noAnchors = new Set(LIBRARY.filter((s) => s.noAnchors).map((s) => s.id));

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

// --- lessons ------------------------------------------------------------------
const splitFrontmatter = (raw, file) => {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: no frontmatter`);
  return { data: parseYaml(m[1]) ?? {}, body: m[2] };
};

const files = readdirSync(lessonsDir).filter((f) => f.endsWith('.md')).sort();
const slugs = files.map((f) => f.replace(/\.md$/, ''));
const ROUTES = new Set(['/', '/lessons/', ...slugs.map((s) => `/lessons/${s}/`)]);

console.log(`${files.length} lessons · budget ${BUDGET_WORDS} words (${WORDS_PER_MINUTE} wpm)\n`);

let totalPointers = 0;

for (const file of files) {
  const raw = readFileSync(join(lessonsDir, file), 'utf8');
  const { data, body } = splitFrontmatter(raw, file);
  const points = data.points ?? [];
  const extraReading = data.extraReading ?? [];
  const isOutline = data.outline === true;
  const isLocked = data.status === 'locked';

  const pointers = points.flatMap((p, i) => (p.reading ?? []).map((r) => ({ ...r, point: i + 1 })));
  const pointedAt = new Set(pointers.map((p) => p.source));
  const words = lessonWords({ intro: data.intro, points });
  // Notes are not held to the budget, but silently unmeasured content is worse
  // than measured content, so they are counted and shown.
  const noteWords = proseWords(body);
  totalPointers += pointers.length;

  // 1. Reading budget.
  if (!isOutline && !isLocked) {
    if (words > BUDGET_WORDS) fail(`${file}: ${words} words is over the ${BUDGET_WORDS}-word budget`);
    else if (words > WARN_WORDS) warn(`${file}: ${words} words — approaching the ${BUDGET_WORDS} budget`);
  }

  for (const p of pointers) {
    // 2. A pointer must land somewhere specific. `at` is required by the schema,
    //    but a source with anchors and no `href` still dumps the reader at the
    //    top of the page, so that is worth naming.
    if (!p.href && !noAnchors.has(p.source)) {
      warn(`${file}: point ${p.point} → ${p.source} names "${p.at}" but has no href — ` +
           `find one with: node scripts/anchors.mjs ${p.source}, or set noAnchors on the source`);
    }
    // A pointer to an unknown source is a build error; report it here too, since
    // this script is often what gets run first.
    if (!isKnownSourceId(p.source)) fail(`${file}: point ${p.point} points at unknown source "${p.source}"`);
  }

  // 3a. The same place twice *within one point* is a copy-paste. Across points it
  //     is the normal case — a good source speaks to more than one idea, and
  //     sending the reader back to it is the whole design.
  for (const [i, point] of points.entries()) {
    const targets = (point.reading ?? []).map((r) => `${r.source}${r.href ?? ''}`);
    for (const dupe of new Set(targets.filter((t, j) => targets.indexOf(t) !== j)))
      fail(`${file}: point ${i + 1} points at the same place twice (${dupe})`);
  }

  // 3b. `extraReading` is for what the points do NOT already send you to.
  for (const ref of extraReading) {
    const id = typeof ref === 'string' ? ref : ref?.id;
    if (id && pointedAt.has(id))
      warn(`${file}: ${id} is in extraReading but a point already points at it`);
  }

  // 4. Dead `#s-` citations. These render as ordinary anchors that jump nowhere,
  //    which no build step and no browser complains about. Only Extra reading
  //    renders `<li id="s-…">` now that the derived bibliography is gone, so an
  //    anchor for a pointed-at source has nothing to land on.
  const anchored = new Set(
    extraReading.map((ref) => (typeof ref === 'string' ? ref : ref?.id)).filter(Boolean),
  );
  for (const [, id] of body.matchAll(/\(#s-([a-z0-9][a-z0-9-]*)\)/g)) {
    if (!anchored.has(id))
      fail(
        pointedAt.has(id)
          ? `${file}: body cites #s-${id}, but pointed-at sources no longer render an anchor — link the pointer instead`
          : isKnownSourceId(id)
            ? `${file}: body cites #s-${id}, which is not in this lesson's extraReading`
            : `${file}: body cites #s-${id}, which is not a known source`,
      );
  }

  // 5. Internal links. The hast plugin adds the base path; it cannot know whether
  //    the page exists.
  for (const [, target] of body.matchAll(/\]\((\/[^)#\s]*)/g)) {
    const path = target.endsWith('/') || target.includes('.') ? target : `${target}/`;
    if (!ROUTES.has(path)) fail(`${file}: links to ${target}, which is not a page`);
  }

  // The placeholder comment renders nothing while the notes are missing, but once
  // they exist the notes panel renders the whole slot and the comment ships in the
  // page source. Nothing breaks; it is just scaffolding left in a published page.
  if (noteWords && /YOUR NOTES GO HERE/.test(body)) {
    warn(`${file}: notes are written, so the "YOUR NOTES GO HERE" comment can be deleted`);
  }

  const flags = [];
  if (isOutline) flags.push('outline');
  if (isLocked) flags.push('locked');
  const time = isOutline || isLocked ? '' : `${lessonMinutes({ intro: data.intro, points })} min`;
  const notes = noteWords ? `  +${noteWords}w notes` : '';
  console.log(
    `  ${file.replace(/\.md$/, '').padEnd(38)} ${String(words).padStart(5)}w ${time.padStart(6)}` +
      `  ${String(points.length).padStart(2)} pts ${String(pointers.length).padStart(3)} ptr ` +
      `${String(pointedAt.size).padStart(2)} src${notes}${flags.length ? `  (${flags.join(', ')})` : ''}`,
  );
}

console.log(`\n${totalPointers} reading pointers across ${files.length} lessons`);
console.log(
  `${fails === 0 ? 'LESSONS OK — 0 failures' : `${fails} problem(s)`}${warns ? ` · ${warns} warning(s)` : ''}`,
);
process.exit(fails ? 1 : 0);
