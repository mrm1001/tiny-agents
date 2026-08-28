# Curating the source library

Two places, with one rule between them:

| | | |
|---|---|---|
| **`src/data/library.ts`** | the canon — one entry per source | **tracked in git** |
| **`sources/`** | files (PDFs) and their extracted text | **gitignored** |

**A URL appears exactly once in the whole repo — in `library.ts`.** Lessons cite by
`id`, never by URL, so fixing a rotted link is a one-line change instead of a hunt
through 36 lesson files.

---

## Adding a source that's a URL

1. Add an entry to `LIBRARY` in `src/data/library.ts`:

```ts
{
  id: 'aizawa-writing-tools',      // lower-case kebab-case, stable forever
  title: 'Writing effective tools for agents — with agents',
  url: 'https://www.anthropic.com/engineering/writing-tools-for-agents',
  author: 'Ken Aizawa',
  site: 'Anthropic Engineering',
  date: '2025-09-11',
  kind: 'post',
  core: true,
  note: 'What this supplies, and any caveat. Renders on the page.',
},
```

2. Cite it from a lesson's frontmatter by `id`:

```yaml
sources:
  - aizawa-writing-tools
extraReading:
  - some-other-id
```

3. `npm run build`. An unknown key is a **build error**, so a typo can't ship.

### Fields

| Field | | Notes |
|---|---|---|
| `id` | **required** | Lower-case kebab-case. Also the citation anchor, so changing it breaks existing citations — pick well once. |
| `title` | **required** | The **H1 as rendered**, which is often not the `<title>` tag or the URL slug. |
| `url` | **required** | Absolute, and **strip tracking parameters** (`?utm_source=…`, `?ref=…`, `fbclid`). |
| `kind` | **required** | `post` · `docs` · `paper` · `thread` · `newsletter` · `repo` · `book` |
| `author` | optional | Byline **as printed**. Omit for corporate authors where `site` already says it — "OpenAI · OpenAI" reads badly. |
| `site` | optional | Publication: `Anthropic Engineering`, `Lil'Log`, `GitHub`. |
| `date` | optional | `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. **Omit rather than guess.** Omit for living docs. |
| `note` | optional | Why it's cited, plus caveats. This renders publicly — see the caveat below. |
| `core` | optional | `true` for sources expected to recur across many lessons. |
| `blocked` | optional | Only for genuinely unretrievable sources. See below. |

### Two things worth getting right

**Titles.** Use the H1 as rendered. Anthropic's post is `Building effective agents`
(lowercase, no "AI") even though its `<title>` says otherwise, and its byline prints
`Erik S.`, not the widely-cited "Erik Schluntz".

**Notes render on the page.** They're currently written half as working notes
("NB the live byline prints…"), which is useful to us and odd for a reader. If you
want them purely reader-facing, say so and I'll do a pass — it's an open question
from the Round 0 review.

---

## Dropping in a PDF

Put the file in `sources/raw/` and I'll process it — or run it yourself:

```sh
uv run scripts/ingest-source.py --scan
```

That extracts anything new into `sources/text/<name>.txt`, with
`=== page N ===` markers so a quote can cite a page, plus a `.meta.json` recording
origin, `sha256`, page and word counts.

**Name the file after its library `id`** (`dietz-llm-as-judge.pdf`) and the cache
lines up with the bibliography. Any name works; it just won't be linked, and
`npm run check:sources` will say `(no library entry yet)`.

Fetching a PDF straight from a URL does both steps at once:

```sh
uv run scripts/ingest-source.py https://example.com/paper.pdf --id author-title
```

Safe to re-run. It skips files whose text is current — and skips the download too —
and **re-extracts automatically if you replace a raw file in place**, because the
`sha256` no longer matches. `--list` shows anything `STALE`.

Handles `.pdf` plus `.txt` / `.md` / `.html` / `.json` / `.csv`. Anything else it
refuses rather than guessing; add a branch to `extract()` in the script.

No install step — the script declares its dependencies inline (PEP 723) and `uv`
provisions them.

### Why the files aren't committed

Two reasons: they're third-party material we have no licence to redistribute, and
the extracted text is a rebuildable cache. So a fresh clone starts empty —
**keep any quote you rely on in the source's `note` or in the lesson prose**, not
only in `sources/text/`. Rebuild with `--scan`, or re-fetch from the URLs in
`library.ts`.

---

## When something can't be fetched

Record it, don't drop it — you may be able to get it by hand:

```ts
blocked: {
  reason: 'What was tried and how it failed, specifically.',
  tried: '2026-08-28',
},
```

`npm run check:sources` prints these as a worklist. Currently two: **Reddit**
(unreachable from this environment entirely) and **`openai.com/index/*`** (403s to
curl, browser headers and WebFetch alike — though `cdn.openai.com` file URLs work
fine, so prefer their PDFs).

**`blocked` is only for genuine unretrievability.** A missing or ambiguous
publication date is a metadata gap — omit `date`, note the uncertainty, and cite the
source normally.

### Where to look for new sources

`anthropic.com/engineering` · `platform.claude.com/docs` · `arxiv.org` · OpenAI's
PDFs · and the real agent codebases already in the library (mini-swe-agent,
SWE-agent, codex, gemini-cli, OpenHands, agent-lightning).

---

## Citing inside a lesson

Link to the anchor, never the URL:

```md
[Anthropic's post](#s-anthropic-bea) gives both halves of the split.
```

The Sources list renders each entry as `<li id="s-<id>">`, so the citation jumps to
it and highlights it. Zero URLs in lesson prose, and citations survive reordering —
positional `[3]` wouldn't.

`extraReading` entries don't need to be cited in the prose; `sources` entries should
be.

---

## Checks

```sh
npm run check:sources   # library integrity + cached files + blocked worklist
npm run build           # unknown source key, or a written lesson with no sources
```

`check:sources` catches tracking parameters, duplicate ids, duplicate URLs
(ignoring trailing slashes), malformed dates, and `blocked` without a reason.

The build enforces the two that matter most: **every citation key resolves**, and
**any lesson not `status: locked` must cite at least one source.** That last one
means adding sources is part of writing a lesson, not an afterthought.
