/**
 * Prefixes root-relative links in Markdown with the site's base path.
 *
 * The site is served from `/tiny-agents/`. Astro rewrites asset *imports* but
 * not literal paths, and `src/lib/href.ts` covers component code — Markdown
 * bodies have no such seam. Verified: `[x](/lessons/03-…/)` renders as
 * `href="/lessons/03-…/"`, which works perfectly on `localhost:4321` and 404s in
 * production. That is the worst kind of bug: invisible until deployed.
 *
 * This is a Sätteri hast plugin, not a rehype one. Sätteri is Astro 7's default
 * Markdown processor and does not run remark/rehype plugins at all — setting
 * `markdown.rehypePlugins` now throws unless `@astrojs/markdown-remark` is
 * installed as a second processor
 * (`node_modules/astro/dist/core/config/validate.js:53`). Writing to the native
 * API avoids pulling in a parallel pipeline just for one twelve-line transform.
 *
 * `base` is passed in from `astro.config.mjs`, so this is not a third place the
 * value lives.
 */

/** Left alone: absolute URLs, protocol-relative, fragments, `mailto:`, `data:`. */
const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/|#)/i;

/** Which attribute carries a path, per element. */
const ATTR = { a: 'href', img: 'src', source: 'src', video: 'src', audio: 'src' };

export function hastBasePath({ base = '/' } = {}) {
  const prefix = base.replace(/\/$/, '');

  return {
    name: 'tiny-agents:base-path',
    // Sätteri filters by tag name in Rust, so only these elements cross into JS.
    element: {
      filter: Object.keys(ATTR),
      visit(node, ctx) {
        if (!prefix) return;
        const attr = ATTR[node.tagName];
        const value = node.properties?.[attr];
        if (typeof value !== 'string' || !value.startsWith('/')) return;
        if (EXTERNAL.test(value)) return;
        // Idempotent: must never produce `/tiny-agents/tiny-agents/`.
        if (value === prefix || value.startsWith(`${prefix}/`)) return;
        ctx.setProperty(node, attr, `${prefix}${value}`);
      },
    },
  };
}
