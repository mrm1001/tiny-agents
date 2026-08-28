/**
 * Lists the linkable sections of a source, so a reading pointer can name a real
 * anchor instead of a guessed one.
 *
 *   node scripts/anchors.mjs anthropic-bea       # a library id
 *   node scripts/anchors.mjs https://example.com/post
 *
 * The whole course is now pointers into other people's writing, and an anchor
 * that does not exist silently lands the reader at the top of the page — no
 * error, just a worse lesson. This is how `href` values get chosen.
 *
 * For a GitHub repo it lists the top-level tree instead, since the useful
 * pointer there is a file path rather than a heading.
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { LIBRARY } = await import(join(root, 'src/data/library.ts'));

const arg = process.argv[2];
if (!arg) {
  console.error('usage: node scripts/anchors.mjs <library-id|url>');
  process.exit(1);
}

const entry = LIBRARY.find((s) => s.id === arg);
const url = entry?.url ?? arg;
if (!entry && !/^https?:\/\//.test(arg)) {
  console.error(`"${arg}" is neither a library id nor a URL`);
  process.exit(1);
}

// A browser UA: several of these hosts refuse a default client.
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0 Safari/537.36';

const gh = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);
if (gh) {
  const [, owner, repo] = gh;
  const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { 'user-agent': UA },
  }).then((r) => r.json());
  const branch = meta.default_branch ?? 'main';
  const tree = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}`,
    { headers: { 'user-agent': UA } },
  ).then((r) => r.json());
  console.log(`${owner}/${repo} · default branch "${branch}"\n`);
  console.log(`pointer form:  href: '/blob/${branch}/<path>'   (add #L10-L40 for lines)\n`);
  for (const node of tree.tree ?? []) console.log(`  ${node.type === 'tree' ? 'dir ' : 'file'} ${node.path}`);
  process.exit(0);
}

const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
if (!res.ok) {
  console.error(`${res.status} ${res.statusText} for ${url}`);
  process.exit(1);
}
const html = await res.text();

// Headings that carry an id are the only ones a fragment can target.
const strip = (s) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const found = [];
for (const m of html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)) {
  const [, level, attrs, inner] = m;
  const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1]
    // Some sites put the id on an anchor inside the heading instead.
    ?? inner.match(/\bid=["']([^"']+)["']/i)?.[1];
  const text = strip(inner);
  if (text) found.push({ level: +level, id, text });
}

console.log(`${url}\n`);
if (!found.length) console.log('  no headings found — the page may be client-rendered');
for (const h of found) {
  const indent = '  '.repeat(h.level);
  console.log(`${indent}h${h.level} ${h.id ? `#${h.id}` : '(no id — not linkable)'}\n${indent}   ${h.text.slice(0, 96)}`);
}
const linkable = found.filter((h) => h.id).length;
console.log(`\n${found.length} headings, ${linkable} linkable`);
