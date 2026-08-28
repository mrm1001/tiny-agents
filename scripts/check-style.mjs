/**
 * Catches the countable part of STYLE.md.
 *
 *   node scripts/check-style.mjs        (or: npm run check:style)
 *
 * The course is written for a beginner who has not read the sources, and the first
 * draft of lessons 1 and 2 failed at that in four specific ways: unexplained
 * metaphors, headings that were slogans rather than labels, conclusions asserted
 * without the mechanism, and meta-commentary about the writing.
 *
 * Only some of that is mechanical. Whether a term was really defined, or a
 * mechanism really explained, cannot be linted and is left to a reread — see
 * STYLE.md. What is checked here is the part with a countable signal, chosen
 * after measuring the rejected draft rather than guessed:
 *
 *   - banned phrases (condescension, meta-commentary, slogan tells)
 *   - headings shaped as claims instead of topics
 *   - em-dash density, which is how the asides stacked up
 *   - summaries too short to have explained anything
 *
 * Worth knowing what is NOT the signal: the rejected draft averaged 16.8 words a
 * sentence, so sentence length was never the problem and is not checked. The
 * sentences were the right length and asserted instead of explaining.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lessonsDir = join(root, 'src/content/lessons');

let fails = 0;
let warns = 0;
const fail = (msg) => { console.log(`  FAIL ${msg}`); fails++; };
const warn = (msg) => { console.log(`  warn ${msg}`); warns++; };

/** Phrases that reliably marked a defect in the rejected draft. */
const BANNED = [
  // Condescension: tells a stuck reader that the problem is them.
  [/\b(simply|obviously|of course|merely|trivially)\b/i, 'condescending — cut it'],
  [/\bjust\b(?! (in case|as|about|now|then))/i, 'minimising "just" — cut it or be specific'],
  // Meta-commentary about the writing or the reader's reaction.
  [/\bthe surprise\b|\bthe interesting part\b|\bthe fun part\b/i, 'meta-commentary — explain the thing instead'],
  [/\b(most|other) (writing|posts|introductions|articles|guides)\b/i, 'commentary on other writing — cut it'],
  [/\bworth (knowing|reading|seeing|noting)\b/i, 'meta-commentary — say what it tells the reader'],
  [/\bthat is the point\b|\bthe whole point\b|\bwhich is the point\b/i, 'the reader decides what the point was'],
  [/\bwhich is exactly why\b|\band that is why the\b/i, 'slogan construction — state the reason plainly'],
  [/\bload-bearing\b|\bgarnish\b/i, 'unexplained metaphor'],
  [/\bno metaphor required\b|\bnot a vibe\b|\bsounds like a slogan\b/i, 'writing about the writing'],
];

/**
 * A heading should be a label you can navigate by, not a claim you could argue
 * with. These patterns are the specific shapes the rejected draft used.
 */
const HEADING_BANNED = [
  [/;/, 'two clauses joined by a semicolon — pick the topic'],
  [/,\s*not\b/i, '"X, not Y" is a claim, not a label'],
  [/^(Everything|Nothing|The whole|The real)\b/i, 'slogan opener'],
  [/\b(you|your|we|our|I)\b/i, 'second or first person — headings name a topic'],
  [/\bhinges on\b|\bis the skill\b|\bis a cost\b/i, 'rhetorical claim'],
  [/\?$/, 'rhetorical question'],
];
const HEADING_MAX = 60;

/** Below this a summary cannot have done what STYLE.md asks of it. */
const SUMMARY_MIN_WORDS = 45;

const countWords = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

const files = readdirSync(lessonsDir).filter((f) => f.endsWith('.md')).sort();

for (const file of files) {
  const raw = readFileSync(join(lessonsDir, file), 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fm) continue;
  const data = parseYaml(fm[1]) ?? {};
  const points = data.points ?? [];
  if (!points.length) continue;

  const where = file.replace(/\.md$/, '');
  const prose = [...points.map((p) => p.summary ?? ''), fm[2]].join('\n');

  // --- banned phrases ---------------------------------------------------------
  // Quotations and code are exempt: STYLE.md governs our prose, and a source is
  // allowed to write however it likes. Without this, quoting mini-swe-agent's
  // "every step of the agent just appends to the messages" failed the check on
  // the word "just", which we would have had to fix by misquoting it.
  const ours = prose
    .replace(/`[^`]*`/g, ' ')
    .replace(/"[^"]*"/g, ' ')
    .replace(/[“][^”]*[”]/g, ' ');

  for (const [pattern, why] of BANNED) {
    const m = ours.match(pattern);
    if (m) fail(`${where}: "${m[0]}" — ${why}`);
  }

  // --- headings ---------------------------------------------------------------
  for (const [i, point] of points.entries()) {
    const h = point.heading ?? '';
    for (const [pattern, why] of HEADING_BANNED) {
      if (pattern.test(h)) fail(`${where} point ${i + 1}: heading "${h}" — ${why}`);
    }
    if (h.length > HEADING_MAX)
      warn(`${where} point ${i + 1}: heading is ${h.length} chars (over ${HEADING_MAX}) — likely a slogan`);

    // --- summary shape --------------------------------------------------------
    const words = countWords(point.summary ?? '');
    if (words < SUMMARY_MIN_WORDS)
      warn(`${where} point ${i + 1}: summary is ${words} words — too short to explain a mechanism`);
  }

  // --- em-dash density --------------------------------------------------------
  // Not banned; two asides in one sentence means the sentence wanted to be two.
  const dashes = (prose.match(/—/g) ?? []).length;
  const words = countWords(prose);
  const per100 = (dashes / words) * 100;
  if (per100 > 1.2)
    warn(`${where}: ${dashes} em dashes in ${words} words (${per100.toFixed(1)}/100) — unstack the asides`);

  console.log(
    `  ${where.padEnd(38)} ${String(points.length).padStart(2)} pts · ` +
      `em dash ${per100.toFixed(1)}/100 · headings ≤ ${Math.max(...points.map((p) => (p.heading ?? '').length))}`,
  );
}

console.log(
  `\n${fails === 0 ? 'STYLE OK — 0 failures' : `${fails} problem(s)`}${warns ? ` · ${warns} warning(s)` : ''}`,
);
console.log('Editorial rules that cannot be linted are in STYLE.md — reread the draft against them.');
process.exit(fails ? 1 : 0);
