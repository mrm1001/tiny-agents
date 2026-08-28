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
import { pointerUrl } from './pointer-url.mjs';

export interface ReadingPointer {
  /** Library key. Everything pointed at belongs in the shared library. */
  source: string;
  /**
   * The specific place, and the only text shown for this pointer: a section
   * heading, a file path, a page. Names its own source too, since nothing else
   * on the page does.
   */
  at: string;
  /**
   * Appended to the source's URL:
   *   `#anchor`  an anchor on the source's own page
   *   `/path`    appended to the source's path — for repos, `/blob/main/x.py#L10-L40`
   *   `https://` an absolute URL, for a deep target on another host (a mirror)
   */
  href?: string;
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
  return { ...pointer, entry, url: pointerUrl(entry.url, pointer.href) };
}
