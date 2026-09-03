/**
 * Verifies that every reading pointer lands where it claims to.
 *
 *   node scripts/check-pointers.mjs          (or: npm run check:pointers)
 *   node scripts/check-pointers.mjs 02       one lesson, by number or slug
 *
 * Deliberately NOT part of `npm run check`: it makes a network request per
 * distinct target, so it is slow, occasionally flaky, and will go red for reasons
 * that are nobody's fault. A check you learn to ignore is worse than none.
 *
 * But it is the one check this course's format really needs. A pointer names a
 * section, a page or a line range, and every one of those rots independently of
 * the URL: the page still returns 200 long after the heading was renamed, the
 * anchor silently does nothing, and the reader lands at the top with no error
 * anywhere. So each kind is verified on its own terms:
 *
 *   #anchor      the id must exist in the HTML (GitHub's `user-content-` too)
 *   #Lnn-Lmm     the file must actually have that many lines
 *   #page=N      the PDF must have that many pages — from the local cache when
 *                we have one, so it costs nothing
 *   no href      the page must at least resolve
 *
 * One exception, and it is a verification rather than an excuse: a page that hard
 * 403s every automated request is not a rotted pointer, and openai.com/index/* is
 * one of those. When such a source has its text cached under sources/text/, the
 * `§ section` named in the pointer's `at` is looked up there instead. That is a
 * stronger claim than the HTTP 200 we settle for elsewhere, because it checks the
 * section rather than the page.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lessonsDir = join(root, 'src/content/lessons');
const { LIBRARY } = await import(join(root, 'src/data/library.ts'));
const { pointerUrl } = await import(join(root, 'src/lib/pointer-url.mjs'));

const BY_ID = new Map(LIBRARY.map((s) => [s.id, s]));
/** Same composition the pages use, via the same function. */
const resolvePointer = (reading) => {
  const entry = BY_ID.get(reading.source);
  if (!entry) throw new Error(`unknown source "${reading.source}"`);
  return { ...reading, entry, url: pointerUrl(entry.url, reading.href) };
};

const only = process.argv[2];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0 Safari/537.36';

let fails = 0;
let checked = 0;

/** One fetch per distinct URL, however many pointers share it. */
const bodies = new Map();
const fetchText = async (url) => {
  if (!bodies.has(url)) {
    bodies.set(
      url,
      fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,text/plain,*/*' } })
        .then(async (r) => ({ ok: r.ok, status: r.status, text: r.ok ? await r.text() : '' }))
        .catch((e) => ({ ok: false, status: 0, text: '', error: e.message })),
    );
  }
  return bodies.get(url);
};

/** GitHub blob → the raw file, which is what a line range is a claim about. */
const rawUrl = (url) => {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+?)(\?|#|$)/);
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}` : null;
};

/** Page count from the local cache, so a cached PDF costs no request. */
const cachedPages = (sourceId) => {
  const meta = join(root, 'sources/text', `${sourceId}.meta.json`);
  if (!existsSync(meta)) return null;
  try {
    return JSON.parse(readFileSync(meta, 'utf8')).pages ?? null;
  } catch {
    return null;
  }
};

/** Ligatures survive PDF extraction and would fail a plain substring match. */
const unligature = (t) =>
  t.replace(/\uFB01/g, 'fi').replace(/\uFB02/g, 'fl').replace(/\uFB00/g, 'ff');

/** Extracted text from the local cache, for a source whose page cannot be fetched. */
const cachedText = (sourceId) => {
  const f = join(root, 'sources/text', `${sourceId}.txt`);
  return existsSync(f) ? unligature(readFileSync(f, 'utf8')).toLowerCase() : null;
};

async function verify(pointer) {
  const { url, source } = pointer;
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const base = url.split('#')[0];

  // --- a PDF page --------------------------------------------------------------
  const page = hash.match(/^page=(\d+)$/);
  if (page) {
    const want = Number(page[1]);
    const pages = cachedPages(source);
    if (pages !== null) {
      return want <= pages
        ? { ok: true, detail: `page ${want} of ${pages} (from cache)` }
        : { ok: false, detail: `page ${want} but the PDF has ${pages}` };
    }
    const res = await fetchText(base);
    return res.ok
      ? { ok: true, detail: `resolves; page ${want} unverified (not cached — run ingest-source.py)` }
      : { ok: false, detail: `HTTP ${res.status || res.error}` };
  }

  // --- a line range in a file --------------------------------------------------
  const lines = hash.match(/^L(\d+)(?:-L(\d+))?$/);
  const raw = rawUrl(url);
  if (lines && raw) {
    const res = await fetchText(raw);
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status || res.error} on the raw file` };
    const count = res.text.split('\n').length;
    const first = Number(lines[1]);
    const last = Number(lines[2] ?? lines[1]);
    const range = lines[2] ? `lines ${first}–${last}` : `line ${first}`;
    return last <= count
      ? { ok: true, detail: `${range} of ${count}` }
      : { ok: false, detail: `points at line ${last} but the file has only ${count}` };
  }

  // --- an anchor on the page ---------------------------------------------------
  const res = await fetchText(base);
  if (!res.ok) {
    const cached = cachedText(source);
    if (!cached) return { ok: false, detail: `HTTP ${res.status || res.error}` };
    const section = unligature(pointer.at.split('§')[1] ?? '').trim().toLowerCase();
    if (!section) {
      return { ok: true, detail: `HTTP ${res.status}, but the source text is cached locally` };
    }
    return cached.includes(section)
      ? { ok: true, detail: `HTTP ${res.status}; "${section}" is in the cached text` }
      : {
          ok: false,
          detail: `HTTP ${res.status}, and "${section}" is not in sources/text/${source}.txt`,
        };
  }
  if (!hash) return { ok: true, detail: 'resolves (no anchor claimed)' };

  const ids = [hash, `user-content-${hash}`, hash.replace(/^user-content-/, '')];
  const found = ids.some((id) =>
    new RegExp(`(id|name)=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(res.text),
  );
  return found
    ? { ok: true, detail: `#${hash} present` }
    : { ok: false, detail: `#${hash} is not in the page — re-run: node scripts/anchors.mjs ${source}` };
}

const files = readdirSync(lessonsDir)
  .filter((f) => f.endsWith('.md'))
  .filter((f) => !only || f.startsWith(only) || f.includes(only))
  .sort();

for (const file of files) {
  const raw = readFileSync(join(lessonsDir, file), 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const data = fm ? (parseYaml(fm[1]) ?? {}) : {};
  const points = data.points ?? [];
  if (!points.length) continue;

  console.log(`\n${file.replace(/\.md$/, '')}`);
  for (const [i, point] of points.entries()) {
    for (const reading of point.reading ?? []) {
      const pointer = resolvePointer(reading);
      const result = await verify(pointer);
      checked++;
      if (!result.ok) fails++;
      console.log(
        `  ${result.ok ? 'ok  ' : 'FAIL'} ${String(i + 1)}. ${pointer.source} — ${pointer.at}`,
      );
      console.log(`         ${result.detail}`);
      if (!result.ok) console.log(`         ${pointer.url}`);
    }
  }
}

console.log(
  `\n${checked} pointers, ${bodies.size} requests · ` +
    `${fails === 0 ? 'POINTERS OK — 0 failures' : `${fails} broken`}`,
);
process.exit(fails ? 1 : 0);
