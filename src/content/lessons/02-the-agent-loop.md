---
n: 2
title: "The agent loop"
part: "I — What actually is an agent?"
component: loop
status: in-progress
takeaway: "`observe → decide → act → observe → … → stop`. This is the central concept for everything else."
outline: true
sources:
  - anthropic-bea
  - anthropic-tool-use-loop
  - anthropic-stop-reasons
  - ball-build-an-agent
  - openai-practical-guide
  - react-paper
extraReading:
  - willison-agents
  - kinney-agent-loops
  - twelve-factor-own-control-flow
  - anthropic-build-tool-agent
---

## What this lesson will cover

- **The loop, in about four lines.** The shape everything else in the course hangs off.
  [Anthropic](#s-anthropic-bea) frames the feedback half well — agents "gain 'ground truth' from the
  environment at each step" — which is what makes the arrow back into the loop meaningful rather
  than decorative.

- **The exact condition under which it stops.** Most writing on agents waves at this. The
  [tool-use docs](#s-anthropic-tool-use-loop) state it outright: keep going while `stop_reason` is
  `"tool_use"`, exit on anything else. The [stop-reasons page](#s-anthropic-stop-reasons) enumerates
  what "anything else" contains — and that `pause_turn` is *not* terminal, which is the kind of
  detail that turns into a hung loop if you get it wrong.

- **Two ways to read the same fact.** [Thorsten Ball's](#s-ball-build-an-agent) agent never inspects
  `stop_reason` at all — he checks whether any tool calls came back. Same behaviour, different mental
  model, and seeing both makes the loop feel less like API trivia.
  [OpenAI](#s-openai-practical-guide) independently describes the same shape in vendor-neutral terms
  — "a loop that lets agents operate until an exit condition is reached" — and names two exits: a
  final-output tool fires, or "the model returns a response without any tool calls". That the exact
  same loop is described three different ways is the point of the bullet.

- **The loop is stateless, and that is the surprise.** Nothing accumulates on the server; *you*
  resend the entire conversation every single turn. This is the one idea I want the interactive demo
  to carry, by showing the message array growing step by step.

- **Who actually stops it — the model, or you.** A turn cap is not a `stop_reason`; it is the harness
  overruling the model. [12-Factor Agents](#s-twelve-factor-own-control-flow) argues you should own
  that control flow deliberately, and [Anthropic](#s-anthropic-bea) notes stopping conditions are
  normal rather than a failure.

- **One paragraph of history.** [ReAct](#s-react-paper) interleaved reasoning with actions and gave
  the model an explicit `finish[answer]` action. Worth knowing the loop predates the API machinery —
  though ReAct parses a prompted trajectory out of text, so it is an ancestor, not the same thing.

## The exercise (planned)

- Hand-write the loop — deliberately not a framework helper — against a four-file in-memory repo
  where a greeting string has to be found and changed.
- Expect `list_files` → `read_file` → `edit_file`, then a natural stop.
- Record the run to a committed trace file and step through it on this page.

## Open questions for this lesson

- Show the loop first and the stop condition second, or the reverse?
- Is the stateless/resend point strong enough to carry the demo on its own, or does the demo also
  need to show tokens growing?
