/**
 * Composes a reading pointer's deep URL from a source's base URL and a lesson's
 * `href`. The one rule that must not exist twice.
 *
 * Lives in `.mjs` rather than `.ts` so both sides can use it: `src/lib/reading.ts`
 * for rendering, and `scripts/check-pointers.mjs` for verification. Node strips
 * TypeScript but does not resolve extensionless imports the way Vite does, so a
 * `.ts` module that imports another `.ts` module is unusable from a script.
 */

/**
 * @param {string} baseUrl the source's URL, from src/data/library.ts
 * @param {string} [href] `#anchor`, `/path`, or an absolute URL
 * @returns {string}
 */
export function pointerUrl(baseUrl, href) {
  if (!href) return baseUrl;
  // An absolute href points at another host entirely — a PDF mirror, say — so it
  // replaces the base rather than extending it.
  if (/^https?:\/\//.test(href)) return href;
  return `${baseUrl.replace(/\/$/, '')}${href}`;
}
