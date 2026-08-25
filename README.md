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
```

## Development

```sh
npm install
npm run dev        # http://localhost:4321/tiny-agents/   (note the base path)
npm run build
npm run preview    # honours `base`, so it catches base-path mistakes dev hides
npx astro check    # needs typescript 6.x; 7.x drops the API astro check uses
```

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
