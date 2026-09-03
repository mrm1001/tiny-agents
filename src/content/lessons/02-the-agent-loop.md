---
n: 2
title: "The agent loop"
part: "I — What actually is an agent?"
component: loop
status: in-progress
takeaway: "`observe → decide → act → observe → … → stop`. This is the central concept for everything else."

intro: >
  The agent loop is what turns a single call to a model into a system that can get work done.
  This lesson covers what happens on each pass through it, and what makes it stop.

points:
  - heading: "The four steps of the loop"
    summary: >
      A tool call is a structured request that appears in the model's reply, asking for
      something to be run on its behalf: read this file, run this command. The model cannot
      reach outside the conversation itself, so the loop exists to service those requests, and
      it has four steps. Send the conversation so far to the model; read the reply; if the reply
      contains a tool call, run that tool and append its result to the conversation; then send
      the conversation again. A reply with no tool call in it ends the loop, and that reply is
      the answer. Written out in Python this comes to nine or ten lines. What ends there is the
      inner loop: control goes back to whoever asked the question, and their next message starts
      it again, so an interactive agent is two loops nested one inside the other.
    reading:
      - source: anthropic-tool-use-loop
        at: "Anthropic docs § The agentic loop (client tools)"
        href: "#the-agentic-loop-client-tools"
      - source: zeyliger-agent-loop
        at: "Philip Zeyliger, Sketch — the whole loop in nine lines of Python"
      - source: mini-swe-agent
        at: "mini-swe-agent · agents/default.py, run(), lines 88–124"
        href: "/blob/main/src/minisweagent/agents/default.py#L88-L124"
      - source: ljw1004-mini-agent
        at: "mini_agent · README, the inner and outer loops, lines 102–110"
        href: "/blob/main/README.md?plain=1#L102-L110"

  - heading: "Why the whole conversation is sent every time"
    summary: >
      Each request to the model is independent. The model keeps no record of earlier steps in
      the run, so the code around it sends the entire conversation every time: the original
      instruction, every reply the model has made, and the result of every tool call so far.
      The loop grows that list by appending to it, which is why the conversation is the only
      memory an agent has. The number of tokens sent therefore grows with the square of the
      number of steps, because each step resends everything that came before it. Prompt caching
      brings the cost back to roughly linear, because the provider stores the computation for a
      prefix it has already
      processed and charges less to reuse it, but that only holds while the earliest part of the
      conversation stays byte-for-byte identical. A long run still fills the context window,
      which is the maximum amount of text the model can be sent at once.
    reading:
      - source: rastrigin-claude-code-wire
        at: "Sergei Rastrigin § The Conversation History"
        href: "#the-conversation-history"
      - source: mini-swe-agent
        at: "mini-swe-agent · README, Has a completely linear history"
        href: "/blob/main/README.md?plain=1#L45"
      - source: mini-swe-agent
        at: "mini-swe-agent · agents/default.py, add_messages(), lines 69–86"
        href: "/blob/main/src/minisweagent/agents/default.py#L69-L86"
      - source: openai-codex-agent-loop
        at: 'OpenAI, "Unrolling the Codex agent loop" § Performance considerations'

  - heading: "Stop conditions: how the loop knows it is finished"
    summary: >
      `stop_reason` is a field on the model's response that says why the model stopped
      generating, and the loop keys on it: carry on while the value is `tool_use`, which means
      the model has asked for a tool to be run and is waiting for the result. Every other value
      ends the loop. `end_turn` means the model finished its reply, `max_tokens` means the
      response hit a length limit, and `refusal` means the model declined. `pause_turn` looks like
      an ending but is not one: it means the model paused a long-running operation and expects
      the conversation to be sent back so it can continue, so a loop that exits on it cuts the
      work short. Not every agent reads this field at all: some check only whether
      any tool calls came back, which is shorter to write and behaves identically until one of
      the rarer values turns up.
    reading:
      - source: anthropic-stop-reasons
        at: "Anthropic docs § Stop reason values"
        href: "#stop-reason-values"
      - source: anthropic-stop-reasons
        at: "Anthropic docs § pause_turn"
        href: "#pause-turn"
      - source: ball-build-an-agent
        at: 'Thorsten Ball, "How to Build an Agent" § The read_file tool, the inference loop'
      - source: openai-practical-guide
        at: "OpenAI guide p. 14, Single-agent systems"
        href: "#page=14"

  - heading: "Turn limits and other endings the model does not choose"
    summary: >
      A `stop_reason` is the model's own signal that it has finished. A turn limit is a
      different kind of ending: the code around the loop stops it after a fixed number of
      passes whatever the model wanted, usually to bound cost or to cut off a run that is
      making no progress. Keeping the two apart matters in logs and in error handling, because
      "the model finished" and "we stopped it" call for different responses, and a record that
      does not distinguish them is hard to debug afterwards. Deciding on purpose which endings
      belong to the model and which belong to the code around it is what keeps an agent from
      running until the budget is gone.
    reading:
      - source: twelve-factor-own-control-flow
        at: "12-Factor Agents · Factor 8, Own your control flow"
        href: "#user-content-8-own-your-control-flow"
      - source: anthropic-bea
        at: 'Anthropic, "Building effective agents" § Agents, the stopping-conditions paragraph'
        href: "#agents"
      - source: kinney-agent-loops
        at: "Steve Kinney § The loop every framework converges on"
        href: "#the-loop-every-framework-converges-on"

  - heading: "Where the idea came from: the ReAct paper"
    summary: >
      The loop predates the APIs that make it convenient to write. The ReAct paper, published
      in 2022, prompted a model to produce a thought, then an action, then to read an
      observation from the environment, and to repeat that sequence. It also defined an
      explicit `finish[answer]` action for ending the episode, which is a stop condition
      expressed as one of the available actions rather than as a field on a response. ReAct is
      an ancestor of the modern loop rather than the same technique: it recovers that structure
      by parsing generated text, where an API now returns the structure directly.
    reading:
      - source: react-paper
        at: "ReAct paper § 2, ReAct (p. 3)"
        href: "https://arxiv.org/pdf/2210.03629#page=3"
      - source: react-paper
        at: "ReAct paper § 3.1 Setup (p. 4), the action space"
        href: "https://arxiv.org/pdf/2210.03629#page=4"

extraReading:
  - willison-agents
  - ptacek-write-an-agent
  - byo-coding-agent
  - anthropic-build-tool-agent
---

<!-- ────────────────────────────────────────────────────────────────────────────
  YOUR NOTES GO HERE — type below this comment.

  Everything above the `---` line is the lesson itself and is written for you.
  Everything from here down is yours, and is never edited or overwritten.

  Rough is the point: bullets, half-thoughts, a link, something to come back to.
  They render at the foot of the lesson page under the heading "My notes".
  Nothing here is style-checked, and none of it counts towards the lesson's
  five-minute reading budget.

  Until you type something, the notes panel does not appear on the page at all,
  and nothing in this comment reaches the published HTML.

  Once you have written your notes, delete this comment: from that point it would
  ship in the page source. `npm run check:lessons` reminds you if you forget.

  Writing them is step 3 of 4 in LESSONS.md, and the last thing a lesson needs
  before it can be marked `status: done`.
───────────────────────────────────────────────────────────────────────────── -->
