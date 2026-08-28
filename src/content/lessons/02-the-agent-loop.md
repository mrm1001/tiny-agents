---
n: 2
title: "The agent loop"
part: "I — What actually is an agent?"
component: loop
status: in-progress
takeaway: "`observe → decide → act → observe → … → stop`. This is the central concept for everything else."

points:
  - heading: "The whole loop is about four lines"
    summary: >
      Send the conversation. If the model asked for a tool, run it, append the result, send again.
      Otherwise stop. Everything else in this course — tools, context, guardrails, orchestration —
      is something bolted onto those four lines, which is why it is worth reading three
      independent renderings of them before writing your own.
    reading:
      - source: anthropic-tool-use-loop
        at: '§ "The agentic loop (client tools)"'
        href: "#the-agentic-loop-client-tools"
        why: >
          The loop stated as a contract rather than as prose: what you send, what comes back, and
          what you must send next. The most precise short description of it anywhere.
      - source: ball-build-an-agent
        at: '§ "Pencils out!" through § "Let it edit_file"'
        why: >
          The same loop built up from nothing in under 400 lines of Go, one tool at a time. This
          post has no section anchors, so scroll — it is worth it for the tone alone.
      - source: mini-swe-agent
        at: "src/minisweagent/agents/default.py — run(), lines 88–124"
        href: "/blob/main/src/minisweagent/agents/default.py#L88-L124"
        why: >
          A real agent's `while True:`, with the exception handling that a teaching example leaves
          out. Compare the shape to Ball's and notice they are the same thing.

  - heading: "Everything hinges on the exact stop condition"
    summary: >
      Most writing on agents waves at "until it's done". The API is specific: keep going while
      `stop_reason` is `tool_use`, and stop on anything else. Getting the "anything else" wrong is
      how you write a loop that hangs — `pause_turn` in particular is *not* terminal, and treating
      it as an exit truncates the model mid-task.
    reading:
      - source: anthropic-stop-reasons
        at: '§ "Stop reason values"'
        href: "#stop-reason-values"
        why: >
          The complete list, one subsection each. Read `tool_use`, then `pause_turn`, then
          `refusal` — those three are where the bugs live.
      - source: anthropic-stop-reasons
        at: '§ "pause_turn"'
        href: "#pause-turn"
        why: >
          The one that breaks naive loops: it means continue, not finish.
      - source: openai-practical-guide
        at: 'p. 14, "Single-agent systems"'
        href: "#page=14"
        why: >
          The same stopping rule without any vendor's field names — "a loop that lets agents
          operate until an exit condition is reached", exiting when a final-output tool fires or
          the model returns no tool calls. Useful for seeing which parts are Anthropic specifics
          and which are the idea.

  - heading: "Nothing accumulates on the server — you resend the whole conversation every turn"
    summary: >
      This is the surprise for most people. The model has no memory of the previous step; each
      request carries the entire history, and the loop grows that history by appending. Once you
      have seen it, half the later course follows: context windows fill up, costs scale with the
      square of the number of steps, and the trace *is* the message list.
    reading:
      - source: mini-swe-agent
        at: 'README — "Has a completely linear history"'
        href: "/blob/main/README.md?plain=1#L45"
        why: >
          The design stated as a feature: "every step of the agent just appends to the messages and
          that's it." That is also why there is no difference between its trajectory and its
          prompt.
      - source: mini-swe-agent
        at: "src/minisweagent/agents/default.py — add_messages(), lines 69–86"
        href: "/blob/main/src/minisweagent/agents/default.py#L69-L86"
        why: >
          Twenty lines showing that "appending to the conversation" really is all that happens
          between steps.
      - source: anthropic-tool-use-loop
        at: '§ "The tool use contract"'
        href: "#the-tool-use-contract"
        why: >
          Why the resend is not optional: every `tool_use` block must come back as a matching
          `tool_result` in the next message, or the request is invalid.

  - heading: "The model decides when it is finished; you decide when it has had enough"
    summary: >
      A turn cap is not a `stop_reason` — it is your harness overruling the model, and the two
      kinds of ending should never be confused in your code or your logs. Deciding deliberately
      who owns that control flow is the difference between an agent you can operate and one that
      occasionally spends forty dollars.
    reading:
      - source: twelve-factor-own-control-flow
        at: 'Factor 8 — "Own your control flow"'
        href: "#user-content-8-own-your-control-flow"
        why: >
          The argument for writing the loop yourself rather than accepting a framework's, and what
          you gain: pausing, resuming, and interrupting between steps.
      - source: anthropic-bea
        at: '§ "Agents" — the stopping-conditions paragraph'
        href: "#agents"
        why: >
          Stopping conditions and human checkpoints treated as normal parts of the design rather
          than as failures. Also the "ground truth from the environment at each step" line, which
          is what makes the loop a feedback loop.
      - source: kinney-agent-loops
        at: '§ "The loop every framework converges on"'
        href: "#the-loop-every-framework-converges-on"
        why: >
          Five frameworks reduced to the same loop, side by side. The clearest evidence that what
          you are learning is not an Anthropic-specific trick.

  - heading: "The loop predates the API that made it easy"
    summary: >
      ReAct interleaved reasoning with actions in 2022 and gave the model an explicit
      `finish[answer]` action to end the episode — the stop condition, before there was a
      `stop_reason` field. It is an ancestor rather than the same thing: ReAct parses a trajectory
      out of prompted text, where today the structure comes back typed.
    reading:
      - source: react-paper
        at: "§ 2, ReAct (p. 3)"
        href: "https://arxiv.org/pdf/2210.03629#page=3"
        why: >
          The method in two pages: thought, action, observation, repeat. Read only this section
          unless the benchmarks interest you.
      - source: react-paper
        at: "§ 3.1 Setup (p. 4) — the action space"
        href: "https://arxiv.org/pdf/2210.03629#page=4"
        why: >
          Where `finish[answer]` is defined. Worth seeing that the original stop action was just
          another tool.

extraReading:
  - willison-agents
  - anthropic-build-tool-agent
---

Five points, in the order that makes the loop hardest to misunderstand: the shape, the exit, the
resend, who owns the ending, and where it came from. The exercise that records a real trace of
this loop lands next.
