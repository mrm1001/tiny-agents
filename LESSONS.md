# How a lesson gets built

Four steps, in order. Claude writes the lesson, Maria reviews it and writes the notes,
and it ships when both parts are done.

Three companion documents cover the parts this one only points at:
**[STYLE.md](STYLE.md)** is how the prose is written, **[SOURCES.md](SOURCES.md)** is how
the source library works and how a pointer is put together, and
**[CURRICULUM.md](CURRICULUM.md)** is the list of what the 36 lessons are.

---

## What a lesson is

An **index**, not an essay. Four or five key points; each point is one paragraph naming
the idea, then links to the exact place someone else explains it properly. The original
writing is deliberately small, because the good explanations already exist and beat a
paraphrase of them.

```yaml
---
n: 1
title: "Chatbot vs workflow vs agent"
part: "I — What actually is an agent?"
component: overview          # one of the 12 architecture components
status: in-progress          # locked | in-progress | done
takeaway: "..."              # what the reader should understand afterwards
outline: true                # remove when the prose is finished

intro: >                     # one or two sentences of orientation
  ...

points:
  - heading: "Who decides whether there is another step"
    summary: >
      One paragraph: what the thing is, how it works, what follows from it.
    reading:
      - source: hf-smolagents
        at: "smolagents docs § An introduction to agentic systems"
        href: "#an-introduction-to-agentic-systems"

extraReading:
  - hn-building-effective-agents
---

<!-- YOUR NOTES GO HERE — type below this comment. -->
```

**Everything below the closing `---` is Maria's notes, and belongs to her.** Claude does
not write there. The one thing Claude puts in that space is the placeholder comment
described in step 3, which renders nothing.

---

## Step 1 — Claude writes an outline

Set `outline: true`. That exempts the lesson from the reading budget, relaxes the
minimum summary length, and puts a banner on the page saying it is not finished, so the
review is about **coverage, sources and framing** rather than sentence polish.

### Checking the lesson against CURRICULUM.md

[CURRICULUM.md](CURRICULUM.md) is the list of what the 36 lessons are: number, title,
part, and what the reader should understand by the end of each. The lesson files under
`src/content/lessons/` are what the site renders, so the two can fall out of step
without anything failing — no script compares them, and the build never reads
CURRICULUM.md.

Read the lesson's entry there before writing it, and read it again whenever a change
lands on the lesson's `title`, `part`, `component` or `takeaway`. That includes changes
made in step 2, which is where a title usually moves.

**When the file and the entry disagree, do not edit CURRICULUM.md unprompted.** Say
which one diverged, quote both, propose the wording the entry would take, and wait for
Maria to confirm. The lesson file is the accurate record of what exists, but the
curriculum is the shape of the whole course: a lesson drifting away from its entry is
sometimes a reason to reconsider the lesson rather than the plan, and that is her call
to make, not a tidy-up to perform on the way past.

### Start from the library, not from memory

```sh
node scripts/check-sources.mjs --for loop      # what the library already has
node scripts/check-sources.mjs --topics        # where it is thin
```

Add new sources only for a real gap, and follow [SOURCES.md](SOURCES.md) when you do.
Every source cited has to be in `src/data/library.ts`, so a rotted link is one line to fix
rather than a hunt through 36 lessons.

### Pointers name a place, and the place is verified

`at` is required, and it is the whole point of the format: a pointer that names only a
source makes the reader do the finding. It is also the *only* text rendered, so it names
the source too — `Anthropic docs § Stop reason values`, not `§ "Stop reason values"`.

**Never guess an anchor.** A wrong one does not error; it silently drops the reader at the
top of the page.

```sh
node scripts/anchors.mjs anthropic-bea         # every linkable heading
node scripts/anchors.mjs mini-swe-agent        # a repo's tree instead
npm run check:pointers                         # anchors, line ranges, PDF pages
```

Then go one step further and confirm the **quote is in the section you are pointing at**,
not merely that the section exists. Anthropic's simplicity line lives under "When (and
when not) to use agents", not where you would guess.

### Keep it short

The promise is five minutes: **1,100 words maximum**, warning at 1,000, counting the intro
and the points but not the notes. If a point needs more than a paragraph, it is two
points, or the pointer is doing too little work.

```sh
npm run check:lessons
```

### Then say what is uncertain

Open questions go **in the conversation**, not in the file — that space is Maria's. List the
calls you are unsure about, and make a recommendation for each rather than only asking.

---

## Step 2 — Maria reviews, Claude revises

Review happens on **localhost**, not on the deployed site:

```sh
astro dev --background     # http://localhost:4321/tiny-agents/
```

Feedback can go anywhere convenient, including the notes space at the foot of the lesson
file, since that is hers and gets replaced in step 3. Claude applies it and reruns the checks — and re-reads the
CURRICULUM.md entry if the feedback moved the lesson's title, part, component or
takeaway.

The revisions that have already been asked for once, so they should not need asking again:

| Rejected | Instead |
|---|---|
| Essay prose with the explanation written out | An index: a paragraph, then pointers |
| Aphorisms and unexplained metaphors ("three rungs") | Plain description, terms defined on first use |
| Headings that are claims | Headings that name the topic |
| A source title, byline and blurb beside every link | One line: the source and the place |
| A bibliography repeating the pointers | Nothing — `extraReading` is the only list |
| Comparisons and arithmetic in prose | A small table |

Ordering and editorial calls are Claude's to make. Ask when two readings would produce
materially different work; otherwise decide, do it, and say what was decided.

When the prose is finished, remove `outline: true`. The full summary minimum then applies,
and the build will say so if a point is still a placeholder.

---

## Step 3 — Maria writes the notes

If a lesson page shows no **My notes** panel at the foot, the notes are missing. They are
the last thing a lesson needs before step 4.

### Where to type them

Open the lesson's own file. It is named after the lesson number, so lesson 2 is:

```
src/content/lessons/02-the-agent-loop.md
```

Scroll to the very bottom. Below the second `---` there is a comment block beginning:

```
<!-- ────────────────────────────────────────────
  YOUR NOTES GO HERE — type below this comment.
```

**Type under it.** Everything above the `---` is the lesson itself and is written for you;
everything from the comment down is yours and is never edited or overwritten.

The comment renders nothing, so a lesson with no notes yet shows no panel and leaks
nothing into the page. Once the notes are written the comment can be deleted, because from
that point it would ship in the page source — `check:lessons` warns if it is still there.

### What they are for

Ordinary Markdown: bullets, nested lists, `code`, tables, links. Rough is the point.

They sit outside the machinery deliberately — not counted towards the five-minute budget,
and not linted by `check:style`, because holding rough bullet points to a prose style
guide is how you end up not keeping notes. They are still measured (`check:lessons` prints
`+40w notes`) and their links are still checked.

---

## Step 4 — Mark it done and publish

```sh
npm run check          # secrets, sources, lessons, style, contrast
npx astro check        # types
npm run build          # the schema rules: pointers resolve, points exist
npm run check:pointers # every target still exists (network)
```

Then set `status: done` and push. GitHub Actions builds and deploys; verify on the live
site rather than assuming:

```sh
gh run watch <id> --exit-status
curl -s -o /dev/null -w '%{http_code}\n' https://mrm1001.github.io/tiny-agents/
```

Two things to expect and not mistake for bugs:

- The homepage counter moves (`1 / 36 lessons written`), but **a component only turns green
  when every one of its lessons is done**. `overview` also owns lessons 7 and 36, so it
  stays locked for a long time. Component state is derived from the lesson files, never
  stored.
- After any `npm install`, restart the dev server with its cache cleared, or a React island
  silently renders nothing. See [CLAUDE.md](CLAUDE.md).

---

## Definition of done

- [ ] Four or five points, each with at least one pointer
- [ ] Every source in `src/data/library.ts`; no URLs in the lesson
- [ ] Every `at` names the source *and* the place; every anchor verified with `anchors.mjs`
- [ ] Every quote checked against the section it is attributed to
- [ ] Under 1,100 words, and `outline: true` removed
- [ ] Checked against CURRICULUM.md, and any divergence confirmed with Maria before editing it
- [ ] `npm run check`, `astro check`, `npm run build`, `npm run check:pointers` all clean
- [ ] Reviewed on localhost by Maria
- [ ] Notes written
- [ ] `status: done`, pushed, and the live page checked
