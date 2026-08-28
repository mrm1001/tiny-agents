---
n: 1
title: "Chatbot vs workflow vs agent"
part: "I — What actually is an agent?"
component: overview
status: in-progress
takeaway: "Why calling an LLM isn't an agent; what \"model controls the loop\" means."
outline: true
sources:
  - anthropic-bea
  - openai-practical-guide
  - hf-smolagents
  - willison-agents
  - huyen-agents
extraReading:
  - hn-building-effective-agents
  - bowne-harness
  - weng-agents
---

## What this lesson will cover

- **The three rungs, concretely.** One LLM call, then a predefined code path, then a system that
  directs its own process. [Anthropic](#s-anthropic-bea) gives both halves of the split in one
  sentence each — workflows run "through predefined code paths", agents "dynamically direct their
  own processes and tool usage" — so the lesson can quote rather than paraphrase. And
  [OpenAI](#s-openai-practical-guide) settles the title's first rung outright: applications that use
  LLMs but not "to control workflow execution — think simple chatbots, single-turn LLMs, or
  sentiment classifiers — are not agents."

- **What "controls the loop" actually means.** Not a vibe: it is the question of *who decides whether
  there is another step*. [smolagents](#s-hf-smolagents) has a levels-of-agency table whose middle
  row — "LLM output controls iteration and program continuation" — is precisely this idea, and it
  gives us a ladder rather than a label.

- **The definition is contested, and that is the interesting part.** This is the section I want to
  spend the most words on, because every other post on this topic hides it:
  - [Anthropic](#s-anthropic-bea) draws a line; [smolagents](#s-hf-smolagents) explicitly refuses to
    ("'agency' evolves on a continuous spectrum"). A router is mildly agentic for one and a workflow
    for the other.
  - [Chip Huyen](#s-huyen-agents) uses a different tradition entirely — perceiving and acting on an
    environment, after Russell & Norvig — under which a fixed pipeline that calls a search API *is*
    an agent.
  - [Willison](#s-willison-agents) supplies the practical consensus ("runs tools in a loop to achieve
    a goal") while conceding the word is fought over.
  - And the word *workflow* is itself overloaded between the two most-cited sources: for
    [Anthropic](#s-anthropic-bea) it names an architecture (predefined code paths), for
    [OpenAI](#s-openai-practical-guide) it names the task — "a sequence of steps that must be
    executed to meet the user's goal". A reader who has met both and not noticed this is quietly
    confused, so the lesson should say it plainly.

- **Why the distinction has teeth.** Two concrete consequences, so this isn't taxonomy for its own
  sake: compounding error — [Huyen's](#s-huyen-agents) 95%-per-step over ten steps lands near 60% —
  and [Anthropic's](#s-anthropic-bea) own advice that for many applications a single well-fed LLM
  call is enough.

- **Where this leaves the reader.** The remaining 35 lessons build the agent rung. Knowing which
  rung you are on is the point of starting here.

## Open questions for this lesson

- Should the compounding-error arithmetic get a small table, or stay inline as one sentence?
- Is the contested-definition section better as prose or as a three-column comparison?
