/**
 * How long a lesson takes to read.
 *
 * The whole course promises five minutes per lesson, so this number is a
 * constraint on writing, not a decoration on the page. It is computed from the
 * raw Markdown body (`entry.body`) rather than from rendered HTML, so the same
 * function can run in `Lesson.astro` and in `scripts/check-lessons.mjs` — one
 * implementation, because a page that claims four minutes while the checker says
 * six is worse than having neither.
 *
 * 220 wpm is a middling estimate for technical prose. What matters more is that
 * the count excludes everything a reader does not actually read: code blocks
 * (skimmed or studied, but not read at this rate), link targets, HTML comments,
 * table scaffolding, and list and heading markers. Headings themselves count.
 */

export const WORDS_PER_MINUTE = 220;

/** Five minutes at 220 wpm. A lesson over this has to lose something. */
export const BUDGET_WORDS = 1100;

/**
 * Warn early enough that the fix is an edit, not a rewrite.
 *
 * Raised from 950 when lessons moved to the index format. Explaining a mechanism
 * to a beginner, as STYLE.md requires, costs more words than asserting a
 * conclusion did, so a finished lesson now lands nearer 1,000 than 800 and a
 * warning at 950 would be permanently on. A warning that never clears is noise.
 */
export const WARN_WORDS = 1000;

/**
 * Prose words in a Markdown body, excluding markup a reader doesn't read.
 * @param {string} body raw Markdown, frontmatter already stripped
 * @returns {number}
 */
export function proseWords(body) {
  let text = body ?? '';

  // Order matters: fences go first, so a `#` or `|` inside code is never
  // mistaken for markup below.
  text = text.replace(/^[ \t]*(```|~~~)[^\n]*\n[\s\S]*?^[ \t]*\1[^\n]*$/gm, '');
  // An unclosed fence at end of file — otherwise the whole tail would count.
  text = text.replace(/^[ \t]*(```|~~~)[^\n]*\n[\s\S]*$/m, '');

  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Link reference definitions: `[key]: https://…` on their own line.
  text = text.replace(/^[ \t]*\[[^\]]+\]:[^\n]*$/gm, '');

  // Images contribute a URL and alt text, neither of which is read as prose.
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  text = text.replace(/!\[[^\]]*\]\[[^\]]*\]/g, '');

  // Links: keep the label, drop the target. `[Anthropic](#s-anthropic-bea)`
  // is one word, not four.
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1');

  // Autolinks and any raw HTML tags.
  text = text.replace(/<[^\s>]+@[^\s>]+>|<https?:\/\/[^>]*>/g, '');
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, ' ');

  // Table separator rows (`|---|:--:|`) are pure scaffolding.
  text = text.replace(/^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/gm, '');
  text = text.replace(/\|/g, ' ');

  // Leading markers: headings, blockquotes, list bullets, ordered items.
  text = text.replace(/^[ \t]*#{1,6}[ \t]+/gm, '');
  text = text.replace(/^[ \t]*(> ?)+/gm, '');
  text = text.replace(/^[ \t]*([-*+]|\d+[.)])[ \t]+/gm, '');
  // Thematic breaks.
  text = text.replace(/^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/gm, '');

  // Emphasis and inline-code delimiters. The words inside stay: `stop_reason`
  // is read aloud like any other term.
  text = text.replace(/[`*_~]/g, '');

  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/**
 * Reading time in whole minutes, never zero.
 * @param {string} body raw Markdown
 */
export function readingMinutes(body) {
  return Math.max(1, Math.round(proseWords(body) / WORDS_PER_MINUTE));
}

/**
 * The lesson itself, as one string, for timing and for the budget.
 *
 * Excludes two things on purpose. The `at` labels are link text, scanned rather
 * than read. The Markdown body is hand-written notes, which are deliberately
 * outside the five-minute promise: notes can run long without making the lesson
 * longer, and holding them to a budget would defeat the point of having them.
 *
 * @param {{ intro?: string, points?: Array<{heading: string, summary: string}> }} lesson
 */
export function lessonText({ intro = '', points = [] }) {
  const fromPoints = points.flatMap((point) => [point.heading, point.summary]);
  return [intro, ...fromPoints].join('\n\n');
}

/** Prose words on a whole lesson page. */
export const lessonWords = (lesson) => proseWords(lessonText(lesson));

/** Reading time for a whole lesson page, never zero. */
export const lessonMinutes = (lesson) =>
  Math.max(1, Math.round(lessonWords(lesson) / WORDS_PER_MINUTE));
