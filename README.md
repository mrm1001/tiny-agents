# Tiny Agents

A public, interactive site that teaches how AI agents work by progressively building a small coding
agent from first principles, across 36 five-minute lessons.

**Live: https://mrm1001.github.io/tiny-agents/**

The core idea is that the site gets more capable as the curriculum advances. The homepage
architecture diagram *is* the learning-progress tracker: each of the 12 boxes is a piece of the
agent, and it stays padlocked until the lessons behind it are written.

## How progress works

There is no database, no auth and no server — the site is static files. Progress lives in the
`status` field of each lesson's frontmatter:

```md
---
n: 2
title: "The agent loop"
part: "I — What actually is an agent?"
component: loop          # which diagram box this lesson belongs to
status: in-progress      # done | in-progress | locked
takeaway: "observe → decide → act → … → stop."
---
```

Unlocking a component means changing `status` in a lesson file and pushing. Component state is
*derived* from its lessons (`src/data/progress.ts`) rather than stored, so the diagram can never
disagree with the content. Both `status` and `component` are Zod enums, so a typo fails the build
instead of silently rendering as locked.

## Layout

```
src/
├── content/lessons/NN-slug.md   36 lessons; frontmatter drives the diagram
├── content.config.ts            collection schema (the build-time contract)
├── data/architecture.ts         the 12 components + hand-routed SVG edges
├── data/progress.ts             derives component lock state from lessons
├── components/                  ArchitectureDiagram (React island) + panel
├── layouts/                     Base shell, Lesson page
├── lib/href.ts                  base-path helper — all internal links go through it
└── pages/                       index, /lessons, /lessons/[...slug]

sources/                         local cache of source files (gitignored)
├── raw/                         original PDFs etc., byte-for-byte
└── text/                        extracted text + provenance sidecars
scripts/ingest-source.py         fetch/copy a source file and cache its text
```

## Development

```sh
npm install
npm run dev             # http://localhost:4321/tiny-agents/   (note the base path)
npm run build
npm run preview         # honours `base`, so it catches base-path mistakes dev hides
npx astro check         # needs typescript 6.x; 7.x drops the API astro check uses
npm run check            # all three checks below
npm run check:sources   # library integrity, cached files, blocked worklist
npm run check:lessons   # reading budget, dead citations, uncited sources, dead links
npm run check:contrast  # WCAG check on the theme tokens and the code theme
```

### Source files

Sources that exist as a file — mostly PDFs — are cached under `sources/`, together
with their extracted text. Everything there except the README is gitignored: the
raw files are third-party material we have no licence to redistribute, and the text
is a rebuildable cache rather than source of truth.

```sh
uv run scripts/ingest-source.py <url-or-path> --id <library-id>   # fetch + extract
uv run scripts/ingest-source.py --scan                            # extract new drops
uv run scripts/ingest-source.py --list                            # what's cached
```

Drop files into `sources/raw/` by hand and `--scan` picks them up. It skips files
whose cached text is current and re-extracts any whose `sha256` changed, so
replacing a file in place just works. Extracted text carries `=== page N ===`
markers so a quote can cite a page.

**[SOURCES.md](SOURCES.md) is the guide to curating the library** — adding URL
sources, dropping in PDFs, what to do when something can't be fetched, and how
lessons cite. Mechanics of the file cache are in [`sources/README.md`](sources/README.md).

The script declares its dependencies inline (PEP 723), so there is no install step —
`uv` provisions them in an ephemeral environment.

### Theme

The palette is a set of custom properties at the top of `src/styles/global.css`,
solved against WCAG contrast minimums rather than picked by eye — a light theme has
very little luminance room above white, so several values are close to their limit.
`npm run check:contrast` parses the tokens out of that file and checks every pair
they are actually used in, including the composited result for locked diagram nodes.
Run it after touching any colour.

Syntax highlighting is checked too, and needed its own mechanism. Shiki writes token
colours inline on every span, so no stylesheet can see or override them — four
`github-light` colours were below AA on our code background while the checker still
said "0 failures". `src/lib/code-theme.mjs` darkens those colours at build time,
preserving hue, and the checker re-derives that same theme and audits it. So the
theme the site ships is the theme that gets measured.

Two conventions worth knowing:

- `--c-locked` is a **graphics-only** token (status dot, padlock, dashed stroke, card
  edge). Locked *text* uses `--muted`: a grey dim enough to read as "locked" cannot
  also clear 4.5:1.
- The diagram carries its own three fills (`--c-frame-fill`, `--c-node-fill`,
  `--c-locked-fill`) instead of borrowing the page's `bg / bg-raised / surface`
  stack, which has no room left above white on a light theme.

Because the site is served from `/tiny-agents/`, every internal link must go through
`href()` from `src/lib/href.ts` — a literal `href="/lessons/02"` works in dev and 404s in
production. Links inside lesson Markdown don't pass through the helper, so use relative links
(`../03-the-augmented-llm/`) there.

## Deployment

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml` (Pages source must be set
to **GitHub Actions**). Moving to a custom domain later is a one-line `base` change plus a redeploy.

## Not built yet

The Agent Playground and its trace recorder, the experiments/"Measure" section, the Agent
Architecture Atlas, the Journey page, and the miniature coding-agent implementation. The playground
will replay **pre-recorded** traces committed to the repo — recording is a local dev script that
uses the author's own API key, so visitors never spend it and the site stays fully static.
