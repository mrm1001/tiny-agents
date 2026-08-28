## Writing lesson content

**Read [STYLE.md](STYLE.md) before writing or editing any lesson prose.** It is not
optional guidance: the first draft of lessons 1 and 2 was rejected for style and rewritten
against it.

The target is a textbook or a technical blog post explaining a concept to a beginner. The
reader is a competent programmer who has never built an agent, has not read the sources,
and does not know the vocabulary.

The five rules that were actually broken, in priority order:

1. **Define every technical term on first use**, in the same sentence, in plain words.
2. **Say what a thing is before why it matters.** Explain the mechanism; do not assert the
   conclusion and move on.
3. **Headings name the topic** — noun phrases, not claims. Not "Everything hinges on the
   exact stop condition" but "Stop conditions: how the loop knows it is finished".
4. **No metaphors used as though familiar.** "Three rungs" meant nothing to the reader.
5. **No meta-commentary** — not about the writing ("that is the point"), not about other
   writing ("most posts wave at this"), not about the reader's reaction ("the surprise
   is").

Also avoid *simply*, *just*, *obviously*, *of course*, *merely* — they tell a stuck reader
the problem is them.

Run `npm run check:style` before committing a lesson. It catches the countable part;
whether a term was really defined and a mechanism really explained is editorial, so reread
the draft as someone seeing the vocabulary for the first time.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

**After installing or removing a dependency, restart the dev server with its cache
cleared:**

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

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
