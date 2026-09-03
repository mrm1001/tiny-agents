## Writing lesson content

**Read [LESSONS.md](LESSONS.md) before starting a lesson** — the four-step process
(Claude outlines, Maria reviews, Maria writes the notes, then it ships), with the
principles for each step. **Read [STYLE.md](STYLE.md) before writing or editing any
lesson prose**, and read the file rather than working from a summary of it: the first
draft of lessons 1 and 2 was rejected for style and rewritten against it.
[SOURCES.md](SOURCES.md) is the source library and how a pointer is put together.

Three rules from those documents are repeated here, because breaking any of them is
expensive and nothing catches it:

- **The Markdown body of a lesson belongs to Maria.** Do not write in it. Anything left
  there publishes as-is, HTML comments included.
- **Never guess an anchor** for a reading pointer. Use `node scripts/anchors.mjs <id>`,
  then `npm run check:pointers`. A wrong anchor does not error — it silently drops the
  reader at the top of the page.
- **Check the lesson against [CURRICULUM.md](CURRICULUM.md)**, and when they diverge, ask
  before editing it. Nothing compares the two, so a renamed lesson leaves the curriculum
  wrong and silent. Report the divergence and propose the wording; changing the shape of
  the course is Maria's call.

Run `npm run check` before committing. It catches the countable part of the style guide;
whether a term was really defined and a mechanism really explained is editorial, so
reread the draft as someone seeing the vocabulary for the first time.

## Development

The commands are in [README.md](README.md). Two things that are specific to working here
through an agent session:

Start the dev server in background mode, so the session is not left holding it:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status` and `astro dev logs`.

**After installing or removing a dependency, restart it with the cache cleared:**

```
astro dev stop && rm -rf node_modules/.vite .astro && astro dev --background
```

`npm install` invalidates Vite's pre-bundled dependencies, and a running dev server
keeps serving the stale ones. The symptom is a React island that silently renders
nothing while the page around it looks fine — the architecture diagram vanished this
way after `npm i -D yaml`. The give-away is in `astro dev logs`:

```
TypeError: Cannot read properties of null (reading 'useState')
```

which means two copies of React, not a bug in the component. **`npm run build` is
unaffected**, so check the production build before changing any component code:

```
npm run build && npx astro preview --port 4322
```
