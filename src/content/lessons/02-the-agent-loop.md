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
        at: '§ "The agentic loop (client tools)"'
        href: "#the-agentic-loop-client-tools"
        why: >
          The loop written out as a sequence of requests and responses, with the JSON for each step.
          It shows exactly what your code is responsible for sending.
      - source: ball-build-an-agent
        at: '§ "Pencils out!" through § "Let it edit_file"'
        why: >
          The same loop built from an empty file in under 400 lines of Go, adding one tool at a time.
          The post has no section anchors, so scroll to the headings named above.
      - source: mini-swe-agent
        at: "src/minisweagent/agents/default.py — run(), lines 88–124"
        href: "/blob/main/src/minisweagent/agents/default.py#L88-L124"
        why: >
          The same loop in a real agent, including the error handling a teaching example leaves out.
          Compare it with Ball's to see how little the core changes in production.

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
        at: '§ "Stop reason values"'
        href: "#stop-reason-values"
        why: >
          Every value the field can take, with a subsection each on what your code should do next.
          Read `tool_use`, `pause_turn` and `refusal` first; those three account for most mistakes.
      - source: anthropic-stop-reasons
        at: '§ "pause_turn"'
        href: "#pause-turn"
        why: >
          The specific case described above, with the rule stated plainly: send the conversation back
          unchanged to let the model continue.
      - source: openai-practical-guide
        at: 'p. 14, "Single-agent systems"'
        href: "#page=14"
        why: >
          The same stopping rule without any vendor's field names: a loop that runs "until an exit
          condition is reached", exiting when a designated final-output tool is called or the model
          returns no tool calls.

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
        at: 'README — "Has a completely linear history"'
        href: "/blob/main/README.md?plain=1#L45"
        why: >
          A real agent stating this as a deliberate choice: "every step of the agent just appends to
          the messages and that's it". One consequence the authors draw is that the record of what
          the agent did and the text sent to the model are the same object.
      - source: mini-swe-agent
        at: "src/minisweagent/agents/default.py — add_messages(), lines 69–86"
        href: "/blob/main/src/minisweagent/agents/default.py#L69-L86"
        why: >
          The twenty lines that do the appending. Reading them is the quickest way to confirm that
          nothing more complicated happens between steps.
      - source: anthropic-tool-use-loop
        at: '§ "The tool use contract"'
        href: "#the-tool-use-contract"
        why: >
          The rules the API enforces on what you send back, including that every tool call must be
          answered by a matching result. This is why a conversation cannot be trimmed arbitrarily.

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
        at: 'Factor 8 — "Own your control flow"'
        href: "#user-content-8-own-your-control-flow"
        why: >
          The argument for writing the loop yourself rather than accepting a framework's: it lets you
          pause, resume and interrupt between steps instead of only around a whole run.
      - source: anthropic-bea
        at: '§ "Agents" — the stopping-conditions paragraph'
        href: "#agents"
        why: >
          Stopping conditions and human checkpoints described as ordinary parts of a design. The same
          section explains that an agent gains "ground truth" from its environment at each step,
          which is what makes the loop a feedback loop.
      - source: kinney-agent-loops
        at: '§ "The loop every framework converges on"'
        href: "#the-loop-every-framework-converges-on"
        why: >
          Five frameworks reduced to the same loop, side by side, which confirms that none of this is
          specific to one vendor's API.

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
        at: "§ 2, ReAct (p. 3)"
        href: "https://arxiv.org/pdf/2210.03629#page=3"
        why: >
          The method in about two pages: thought, action, observation, repeat. Stop there unless the
          benchmark results interest you.
      - source: react-paper
        at: "§ 3.1 Setup (p. 4) — the action space"
        href: "https://arxiv.org/pdf/2210.03629#page=4"
        why: >
          Where the three available actions are defined, including `finish[answer]`. Seeing the stop
          action listed alongside the search actions shows how the ending was modelled before APIs
          reported it separately.

extraReading:
  - willison-agents
  - anthropic-build-tool-agent
---

This lesson describes the loop that the rest of the course extends. An exercise that runs it and
records a real trace follows.
