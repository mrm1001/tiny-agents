/**
 * Reading pointers — the unit this course is actually made of.
 *
 * A lesson is an index: a short paragraph naming one idea, then pointers to the
 * exact place in someone else's writing where that idea is properly explained.
 * "The exact place" is the whole value, so a pointer carries a section or file,
 * not just a source.
 *
 * The deep URL is *composed* rather than written out: `src/data/library.ts` owns
 * the base URL, and a lesson supplies only the fragment or path. So a moved blog
 * post is still a one-line fix in the library, even though 36 lessons now link
 * deep into it.
 */
import { resolveSource, type Source } from '../data/library';

export interface ReadingPointer {
  /** Library key. Everything pointed at belongs in the shared library. */
  source: string;
  /** The specific place: a section heading, a file path, a chapter. Required. */
  at: string;
  /**
   * Appended to the source's URL:
   *   `#anchor`  an anchor on the source's own page
   *   `/path`    appended to the source's path — for repos, `/blob/main/x.py#L10-L40`
   *   `https://` an absolute URL, for a deep target on another host (a mirror)
   */
  href?: string;
  /** What the reader is meant to take from it. */
  why?: string;
}

export interface ResolvedPointer extends ReadingPointer {
  source: string;
  /** The library entry, so the rendered pointer can show title and byline. */
  entry: Source;
  /** Where the link actually goes. */
  url: string;
}

/** Composes a pointer's deep URL. Throws on an unknown library key. */
export function resolvePointer(pointer: ReadingPointer): ResolvedPointer {
  const entry = resolveSource(pointer.source);
  const { href } = pointer;

  let url = entry.url;
  if (href) {
    url = /^https?:\/\//.test(href) ? href : `${entry.url.replace(/\/$/, '')}${href}`;
  }

  return { ...pointer, entry, url };
}

/**
 * Every source a lesson points at, in first-appearance order.
 *
 * The bibliography is derived rather than declared. Under the old format a
 * lesson listed its sources *and* cited them, which was two places to keep in
 * step; now a source is in the Sources list precisely because a pointer sends
 * you there.
 */
export function sourcesFromPoints(points: Array<{ reading: ReadingPointer[] }>): string[] {
  const seen: string[] = [];
  for (const point of points) {
    for (const pointer of point.reading) {
      if (!seen.includes(pointer.source)) seen.push(pointer.source);
    }
  }
  return seen;
}
