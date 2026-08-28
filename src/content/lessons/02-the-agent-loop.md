---
n: 2
title: "The agent loop"
part: "I — What actually is an agent?"
component: loop
status: in-progress
takeaway: "`observe → decide → act → observe → … → stop`. This is the central concept for everything else."

points:
  - heading: "The four steps of the loop"
    summary: >
      The loop has four steps. Send the conversation so far to the model; read the reply; if the
      reply contains a tool call, run that tool and append its result to the conversation; then send
      the conversation again. If a reply contains no tool call, the loop ends and that reply is the
      answer. Written out in Python this comes to about ten lines, and everything later in the course
      is machinery added around it. The three readings below are the same loop written three times,
      which is the quickest way to see which parts are essential and which are one library's
      choices.
    reading:
      - source: anthropic-tool-use-loop
        at: "Anthropic docs § The agentic loop (client tools)"
        href: "#the-agentic-loop-client-tools"
      - source: ball-build-an-agent
        at: 'Thorsten Ball, "How to Build an Agent" § Pencils out! to § Let it edit_file'
      - source: mini-swe-agent
        at: "mini-swe-agent · agents/default.py, run(), lines 88–124"
        href: "/blob/main/src/minisweagent/agents/default.py#L88-L124"

  - heading: "Stop conditions: how the loop knows it is finished"
    summary: >
      `stop_reason` is a field on the model's response that says why the model stopped generating.
      The loop continues for as long as that field is `tool_use`, which means the model has asked for
      a tool to be run and is waiting for the result. It ends on the other values, such as `end_turn`
      when the model has finished its reply, `max_tokens` when the response hit a length limit, and
      `refusal` when the model declined. Handling that list incorrectly is a common cause of loops
      that hang or exit too early. The value that catches people is `pause_turn`, which means the
      model paused a long-running operation and expects the conversation to be sent back to continue,
      so treating it as an ending cuts the work short.
    reading:
      - source: anthropic-stop-reasons
        at: "Anthropic docs § Stop reason values"
        href: "#stop-reason-values"
      - source: anthropic-stop-reasons
        at: "Anthropic docs § pause_turn"
        href: "#pause-turn"
      - source: openai-practical-guide
        at: "OpenAI guide p. 14, Single-agent systems"
        href: "#page=14"

  - heading: "Why the whole conversation is sent every time"
    summary: >
      Each request to the model is independent, and the model keeps no record of earlier steps in
      the run. Your code therefore sends the entire conversation with every request: the original
      instruction, every reply the model has made, and the result of every tool call so far. The loop
      grows that list by appending to it, which is why the conversation is the only memory an agent
      has. Two consequences follow. The number of tokens you pay for grows with the square of the
      number of steps, because each step resends everything that came before it, and a long run
      eventually fills the context window, which is the maximum amount of text the model can be sent
      at once.
    reading:
      - source: mini-swe-agent
        at: "mini-swe-agent · README, Has a completely linear history"
        href: "/blob/main/README.md?plain=1#L45"
      - source: mini-swe-agent
        at: "mini-swe-agent · agents/default.py, add_messages(), lines 69–86"
        href: "/blob/main/src/minisweagent/agents/default.py#L69-L86"
      - source: anthropic-tool-use-loop
        at: "Anthropic docs § The tool use contract"
        href: "#the-tool-use-contract"

  - heading: "Turn limits and other endings the model does not choose"
    summary: >
      A `stop_reason` is the model's own signal that it has finished. A turn limit is a different
      kind of ending: it is your code stopping the loop regardless of what the model wanted, usually
      to bound cost or to catch a run that is making no progress. Keeping the two apart matters in
      logs and in error handling, because "the model finished" and "we cut it off" call for different
      responses, and a trace that records them the same way is hard to debug. Deciding on purpose who
      owns that decision is a large part of what makes an agent operable rather than something that
      occasionally runs up a surprising bill.
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
      The loop is older than the APIs that make it convenient. The ReAct paper, published in 2022,
      prompted a model to produce a thought, then an action, then to read an observation from the
      environment, and to repeat that sequence. It also defined an explicit `finish[answer]` action
      for ending the episode, which is a stop condition expressed as one of the available actions
      rather than as a field on a response. ReAct is an ancestor of the modern loop rather than the
      same technique, because it recovers the structure by parsing generated text, where an API now
      returns that structure directly.
    reading:
      - source: react-paper
        at: "ReAct paper § 2, ReAct (p. 3)"
        href: "https://arxiv.org/pdf/2210.03629#page=3"
      - source: react-paper
        at: "ReAct paper § 3.1 Setup (p. 4), the action space"
        href: "https://arxiv.org/pdf/2210.03629#page=4"

intro: >
  This lesson describes the loop that the rest of the course extends. An exercise that runs it and
  records a real trace follows.

extraReading:
  - willison-agents
  - anthropic-build-tool-agent
---
