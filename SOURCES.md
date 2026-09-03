# Curating the source library

This covers the library and the pointers into it. [LESSONS.md](LESSONS.md) covers the
process of building a lesson, and [STYLE.md](STYLE.md) covers how the prose is written.

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
  topics: ['tools'],               // what it's about — see "Topics" below
  core: true,
  note: 'What this supplies, and any caveat. Internal — never rendered.',
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
| `topics` | **required** | What the source is *about*. See below. |
| `author` | optional | Byline **as printed**. Omit for corporate authors where `site` already says it — "OpenAI · OpenAI" reads badly. |
| `site` | optional | Publication: `Anthropic Engineering`, `Lil'Log`, `GitHub`. |
| `date` | optional | `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. **Omit rather than guess.** Omit for living docs. |
| `note` | optional | Why it's cited, plus caveats. **Internal** — see below. |
| `core` | optional | `true` for sources expected to recur across many lessons. |
| `blocked` | optional | Only for genuinely unretrievable sources. See below. |

---

## Topics — how a source gets found again

`topics` is what makes the library searchable instead of a list you re-read every
time. It uses the **same twelve architecture components the lessons are mapped
to**, so "which sources can serve this lesson?" is a lookup rather than a guess:

```
overview · loop · model · tools · retrieval · edit
environment · guardrails · context · orchestration · tracing · eval
```

Because it's a closed set drawn from `ComponentId`, a typo is a **type error**, and
the vocabulary can't quietly fork from the diagram.

### Finding reading for a lesson

Look up the lesson's `component` in its frontmatter, then:

```sh
node scripts/check-sources.mjs --for retrieval
```

You get every readable source tagged with it — `★` marks course-wide ones — with its
kind, its other topics, and its note. Blocked sources are listed separately at the
end rather than mixed in, since they can't be read yet.

```sh
node scripts/check-sources.mjs --topics
```

shows how many readable sources exist per component, flagging any that are `thin`
or `none yet`. Read it before starting a lesson: a `thin` component means the
lesson will be written from two sources, which is usually a sign to go hunting
first. The flags come from live counts, so this guide does not carry a list that
can rot.

### Tagging well

**Tag generously.** A source that genuinely speaks to five components should list
five — `mini-swe-agent` is tagged `loop tools environment tracing guardrails`
because it has something specific to say about each. Under-tagging is the failure
mode that matters: it hides a source from the lesson that needed it, and nothing
will ever tell you.

**Don't tag aspirationally.** If a source only mentions a topic in passing, leave
it off. `cs229-notes` is tagged `model` alone, even though 278 pages touch plenty,
because there is exactly one section worth citing.

Inline one-off sources can skip `topics` — they're already attached to one lesson,
so there's nothing to discover.

### Two things worth getting right

**Titles.** Use the H1 as rendered. Anthropic's post is `Building effective agents`
(lowercase, no "AI") even though its `<title>` says otherwise, and its byline prints
`Erik S.`, not the widely-cited "Erik Schluntz".

**Notes are internal and never rendered.** Write them for whoever is choosing sources
for a lesson, not for a reader: which section carries which quote, where a byline or
date is misleading, what part of a long document is out of scope. They show up in
`--for <component>`, which is the moment they earn their keep. Anything a reader needs
belongs in the lesson's own summary.

---

## Dropping in a PDF

Put the file in `sources/raw/` and I'll process it — or run it yourself:

```sh
uv run scripts/ingest-source.py --scan
```

That extracts anything new into `sources/text/<name>.txt`, with
`=== page N ===` markers so a quote can cite a page, plus a `.meta.json` recording
origin, `sha256`, page and word counts:

```
sources/
  raw/   <id>.<ext>        the original file, byte-for-byte
  text/  <id>.txt          extracted text, with `=== page N ===` markers
         <id>.meta.json    provenance: origin, sha256, pages, words, when
```

Neither directory is in a fresh clone — the whole of `sources/` is gitignored, and
the script creates what it needs.

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

One case where that last promise does not hold: a page whose URL blocks automated
fetching, captured by printing it to a PDF by hand. `openai-codex-agent-loop` is
one — `openai.com/index/*` returns 403 to everything, so the raw file is the only
copy there will be and `--scan` cannot recreate it. For these the `note` in
`library.ts` is not a convenience but the actual archive: put every quote a lesson
relies on there.

---

## When something can't be fetched

Record it, don't drop it — you may be able to get it by hand:

```ts
blocked: {
  reason: 'What was tried and how it failed, specifically.',
  tried: '2026-08-28',
},
```

`npm run check:sources` prints these as a worklist. Two things cause every entry on
it: **Reddit** (unreachable from this environment entirely) and
**`openai.com/index/*`** (403s to curl, browser headers and WebFetch alike, locale
prefixes included — though `cdn.openai.com` file URLs work fine, so prefer their
PDFs). Run the check for the current list rather than trusting a count written here.

**`blocked` is only for genuine unretrievability.** A missing or ambiguous
publication date is a metadata gap — omit `date`, note the uncertainty, and cite the
source normally.

### Where to look for new sources

`anthropic.com/engineering` · `platform.claude.com/docs` · `arxiv.org` · OpenAI's
PDFs · and the real agent codebases already in the library (mini-swe-agent,
SWE-agent, codex, gemini-cli, OpenHands, agent-lightning).

---

## Pointing at a source from a lesson

A lesson is an **index**: a short paragraph naming one idea, then pointers to the
exact place where someone explains it properly. A lesson declares points; there is
no separate list of sources to keep in step with them.

```yaml
points:
  - heading: "Who decides whether there is another step"
    summary: >
      One paragraph: what the thing is, how it works, what follows from it.
    reading:
      - source: hf-smolagents                                  # library id
        at: "smolagents docs § An introduction to agentic systems"
        href: "#an-introduction-to-agentic-systems"            # composed onto the url
```

**`at` is required, and it is the whole point of the format.** A pointer that
names only a source ("read Anthropic's post") makes the reader do the finding,
which is the work this course is supposed to have already done.

**`at` is also the only text rendered for a pointer.** There is no source title,
byline or explanation next to it, so the value has to name its own source as well
as the place: `Anthropic docs § Stop reason values`, not `§ "Stop reason values"`.
Three anonymous links in one box tell the reader nothing about where they lead.

`href` is appended to the source's URL in `library.ts`, so a rotted link stays a
one-line fix even when 36 lessons point deep into it:

| Form | Means | Example |
|---|---|---|
| `#anchor` | An anchor on the source's own page | `#what-are-agents` |
| `/path` | Appended to the source's path — for repos | `/blob/main/src/agent.py#L88-L124` |
| `#page=N` | A page in a PDF | `#page=14` |
| `https://…` | An absolute URL, for a deep target on another host | `https://arxiv.org/pdf/2210.03629#page=3` |

### Finding the anchor

Never guess one. A wrong anchor doesn't error — it silently drops the reader at
the top of the page.

```sh
node scripts/anchors.mjs anthropic-bea          # every linkable heading
node scripts/anchors.mjs ms-agents-for-beginners  # a repo's tree instead
```

Some pages have no anchors at all (ampcode.com is one). Set `noAnchors: true` on
that source in `library.ts` and `check:lessons` stops asking for an `href`;
pointers into it name their section in prose and the reader scrolls.

For PDFs, get the page number from the cached text — it carries `=== page N ===`
markers, and `#page=N` is the PDF page, not the printed one:

```sh
grep -n "=== page" sources/text/openai-practical-guide.txt
```

`extraReading` is for what the points deliberately *don't* send you to. It is the
only list that renders full titles and bylines, and therefore the only source of
`#s-<id>` anchors on the page. `check:lessons` warns if something sits there that a
point already points at.

---

## Checks

```sh
npm run check:sources                        # integrity + cached files + worklist
node scripts/check-sources.mjs --for loop    # candidate reading for a component
node scripts/check-sources.mjs --topics      # coverage, and where it's thin
node scripts/anchors.mjs <id>                # the anchors a pointer can use
npm run check:lessons                        # pointer hygiene + reading budget
npm run check:pointers                       # do the targets still exist? (network)
npm run build                                # every pointer's source resolves
```

`check:sources` catches tracking parameters, duplicate ids, duplicate URLs
(ignoring trailing slashes), malformed dates, `blocked` without a reason, and any
source with no `topics` — which would otherwise be invisible to `--for`.

The build enforces the three that matter most: **every pointer's source resolves
in the library**, **any lesson not `status: locked` has at least one point**, and
**every point has at least one pointer.** A point with no reading is just an
opinion, which is what this course is trying not to be.
