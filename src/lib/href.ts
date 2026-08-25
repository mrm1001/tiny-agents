/**
 * The site is served from a subpath (`/tiny-agents/`) on GitHub Pages. Astro
 * rewrites asset imports but NOT literal href strings, so every internal link
 * goes through this helper. `import.meta.env.BASE_URL` includes a trailing slash.
 *
 * Grep src/ for a literal absolute-path href before deploying — there should be none.
 */
export const href = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
