---
n: 1
title: "Chatbot vs workflow vs agent"
part: "I — What actually is an agent?"
component: overview
status: in-progress
takeaway: "Why calling an LLM isn't an agent; what \"model controls the loop\" means."
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

## Three rungs, not two

Start with things you could build this afternoon.

**One call.** You send text, you get text back — a summariser, a classifier, a chatbot answering
from what it already knows. The control flow is entirely yours: you decided there would be exactly
one call, and there was exactly one call.

**A predefined path.** You chain calls. Classify the incoming email, route it by category, draft a
reply, check the draft against a policy. [Anthropic](#s-anthropic-bea) calls these **workflows**:
"systems where LLMs and tools are orchestrated through predefined code paths." Every branch was
written by a human before the request arrived. The model fills in the text; your code decides what
happens next.

**A system that decides for itself.** Agents, in the same post, are "systems where LLMs dynamically
direct their own processes and tool usage, maintaining control over how they accomplish tasks."

The step from the first rung to the second is engineering — more calls, more plumbing. The step from
the second to the third is a **transfer of authority**. That is why the distinction is worth a
lesson. [OpenAI](#s-openai-practical-guide) draws the boundary in one blunt sentence:
"Applications that integrate LLMs but don't use them to control workflow execution—think simple
chatbots, single-turn LLMs, or sentiment classifiers—are not agents."

## What "controls the loop" actually means

The phrase sounds like a slogan. It isn't. It resolves to a single mechanical question:

> **Who decides whether there is another step?**

In a workflow, the answer lives in your source code — a `for` loop with a fixed bound, an `if` on a
classifier's output, a state machine you drew on a whiteboard. You can read the file and list every
path the system can take.

In an agent, the answer arrives in the model's response. The model asks for a tool; your code runs
it, hands back the result, and asks again. Nobody wrote down how many steps there would be, because
nobody could.

[smolagents](#s-hf-smolagents) makes this precise with a levels-of-agency table, and one row is the
whole idea in nine words: "LLM output controls iteration and program continuation." That row *is*
what "the model controls the loop" means — no metaphor required.

The shortest usable definition comes from [Simon Willison](#s-willison-agents): "An LLM agent runs
tools in a loop to achieve a goal." Fourteen words, and every one is load-bearing — tools, loop,
goal. Lesson 2 builds exactly that loop, and it is smaller than you expect.

## The definition is contested, and that is the interesting part

Most introductions give you one definition and move on. That leaves you unable to read the field,
because the four most-cited sources on this page do not agree. Ask each of them about the same
system — a fixed pipeline that calls a search API and then summarises the results:

| Source | The test it applies | Verdict on that pipeline |
| --- | --- | --- |
| [Anthropic](#s-anthropic-bea) | Does the model direct its own process, or does your code? | Not an agent — a workflow |
| [OpenAI](#s-openai-practical-guide) | Does the LLM control workflow execution? | Not an agent |
| [smolagents](#s-hf-smolagents) | *How much* agency? A spectrum, not a threshold | Mildly agentic |
| [Chip Huyen](#s-huyen-agents) | Does it perceive an environment and act upon it? | Yes, an agent |

The last row is not a mistake. [Huyen](#s-huyen-agents) uses the older tradition, after Russell &
Norvig, in which an agent is "anything that can perceive its environment and act upon that
environment". Under that test, a thermostat qualifies. Under Anthropic's, a system with a language
model making genuine decisions might not.

And the confusion goes one level deeper: the word **workflow** itself means different things in the
two most-quoted documents. For [Anthropic](#s-anthropic-bea) it names an *architecture* — the
predefined-code-paths category above. For [OpenAI](#s-openai-practical-guide) it names the *task*:
"a sequence of steps that must be executed to meet the user's goal." A reader who has met both and
not noticed is quietly confused, and will stay confused.

None of this is settled by choosing a favourite. What you need is the habit of asking, whenever
someone says "agent": *which test are they applying?*

## Why the distinction has teeth

Two consequences, so this isn't taxonomy for its own sake.

**Steps multiply, they don't add.** [Huyen](#s-huyen-agents) makes the point with arithmetic. If each
step succeeds independently 95% of the time:

| Steps | 95% per step | 99% per step |
| --- | --- | --- |
| 1 | 95% | 99% |
| 5 | 77% | 95% |
| 10 | 60% | 90% |
| 20 | 36% | 82% |

A ten-step agent built from a 95%-reliable step is a coin flip. This single table explains most of
the second half of this course: guardrails, evaluation, and human checkpoints are not garnish, they
are what makes a long loop survivable.

**More agency is a cost, not a score.** [Anthropic's](#s-anthropic-bea) own advice, in the post that
popularised the distinction: "When building applications with LLMs, we recommend finding the simplest
solution possible, and only increasing complexity when needed." Handing control to the model buys
flexibility on tasks you couldn't enumerate in advance, and it costs you predictability, latency,
money, and the ability to say what your system will do. If a workflow solves your problem, the
workflow is the better system.

## Where this leaves you

You now have the question that matters — *who decides whether there is another step* — and the
knowledge that reasonable people answer it differently. The remaining lessons build the top rung:
the loop, the tools it calls, the context it carries, and the machinery that keeps a
sixty-percent-reliable pipeline from being what you ship.

Next: the loop itself, in about four lines of code.
