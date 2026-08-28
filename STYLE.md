# How the lessons are written

The target is a **good textbook or a technical blog post that explains a concept to a
beginner**. Not aphorisms, not a magazine column, not a series of claims the reader
has to decode.

## Who the reader is

A competent programmer who has **never built an agent**, has **not read the sources**,
and does not know the vocabulary. They are not stupid and they are not in a hurry to be
impressed. They want to understand how the thing works.

Two consequences that decide most sentences:

- **Every technical term gets defined the first time it appears**, in the same sentence,
  in plain words. `stop_reason` is "a field on the model's response that says why it
  stopped generating" before it is anything else.
- **Say what something is before you say why it matters.** A reader who does not yet
  know what a tool call is cannot be told that stop conditions are subtle.

## The four failures this guide exists to prevent

These are real defects from the first draft of lessons 1 and 2, which was rewritten
because of them. They are listed with the fix so the pattern is recognisable.

### 1. Metaphors used as though they were familiar

> ❌ "Three rungs, not two."

"Rungs" of what? The metaphor was never introduced, so the reader has to reverse-engineer
it. It also carried an implication nobody argued for — that the three are steps on a
ladder you climb, when the point is that they are different tools for different jobs.

> ✅ "There are three kinds of system here, and it is worth separating them because they
> fail in different ways. The first is a single call to a model. The second is …"

**Rule:** use a metaphor only when it does work a plain description cannot, and introduce
it explicitly when you do. Prefer the boring concrete noun.

### 2. Headings that are slogans instead of labels

> ❌ "Everything hinges on the exact stop condition"
> ❌ "More agency is a cost, not a score"

A heading is navigation. It should tell the reader what the section is about, so they can
find it again and skip it if they already know it. A heading that makes a claim forces
them to read the section to find out what the claim was about.

> ✅ "Stop conditions: how the loop knows it is finished"
> ✅ "The costs of letting the model decide"

**Rule:** headings name the topic. Noun phrases. No semicolons joining two claims, no
"Everything…", "Nothing…", "The real…", "The whole…", and no second person.

### 3. Conclusions asserted without the mechanism

> ❌ "Nothing accumulates on the server — you resend the whole conversation every turn.
> This is the surprise for most people."

This tells the reader that something is surprising without explaining what it *is*. A
beginner does not know what is in a request, so the sentence cannot land.

> ✅ "Each request to the model is independent. The model keeps no record of the previous
> step, so the harness sends the entire conversation — every message so far — with every
> request. The loop grows that list by appending: the model's reply, then the result of
> whatever tool it asked for, then the next reply. This is why the conversation is the
> agent's only memory, and why it eventually runs out of room."

**Rule:** explain the mechanism. If a sentence states that something is surprising,
important or subtle, delete that framing and explain the thing instead.

### 4. Telling the reader what to think or feel

> ❌ "Most writing on agents waves at this."
> ❌ "…and that is the point of the bullet."
> ❌ "This one calculation explains why the second half of this course exists."

**Rule:** no meta-commentary about the writing, about other writing, or about the reader's
reaction. Explain; let them draw the conclusion.

## Shape

**Sentences** are ordinary length — 15 to 25 words is normal — and joined with the
connectives a beginner leans on: *because*, *so*, *which means*, *for example*, *in other
words*. Note the first draft's sentences averaged 16.8 words, so length was never the
problem; the problem was that the sentences asserted instead of explaining.

**A point summary** is one paragraph of three to five sentences, in this order:

1. what the thing is, in plain words;
2. how it works, concretely;
3. what follows from it — a consequence, a cost, or what it enables.

**A pointer's `why`** says what the reader will find at that link and what to take from
it, in one or two complete sentences. Not an epigram.

## Avoid

| Don't | Because |
|---|---|
| *simply*, *just*, *obviously*, *of course*, *merely*, *trivially* | Tells a stuck reader the problem is them. |
| *the surprise is*, *the interesting part*, *worth knowing* | Meta-commentary. Explain the thing. |
| *and that is the point*, *which is exactly why*, *the whole point* | The reader decides what the point was. |
| Stacked em-dash asides | Two asides in one sentence means the sentence needed to be two. |
| Rhetorical questions as headings | See failure 2. |
| Undefined API field names, acronyms, or jargon | See "Who the reader is". |

## What is checked, and what is not

`npm run check:style` catches the countable part: banned phrases, slogan-shaped headings,
em-dash density, and summaries that are too short to have explained anything. Run it
before committing a lesson.

The rest is editorial and cannot be linted — whether a term was actually defined, whether
the mechanism was actually explained, whether a metaphor earned its place. For those,
reread the draft as someone who has never seen the vocabulary, and check each summary
against the three-part shape above.
