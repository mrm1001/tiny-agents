# tiny-agents:exercise
"""The agent loop — YOU implement `run`. This is the lesson.

The runner calls `run` with everything below already wired up; you write the loop
itself. What it has to do:

- Send the whole conversation to the model, and add the model's reply to it.
- If the model asks to use one or more tools, run each one, hand the results back
  by adding them to the conversation, and go round again.
- Stop when the model ends its turn without asking for a tool, or when the turn
  limit is reached — whichever comes first.
- Record the run as it happens through `rec` (below), so the lesson viewer has a
  trace to replay: the opening message, each request, each tool result, and the
  ending.

Notes:
  - The conversation is resent in full on every turn — the model keeps no memory of
    its own between calls, so the growing list you pass is the only state. The loop
    only ever appends to it; it never rewrites earlier turns.
  - The model's stop reason is the signal for what to do next: one value means it
    wants to use a tool, so the loop continues; every other value means it has
    finished, so the loop stops. Reaching the turn limit is a different kind of
    ending — your code stopping the loop rather than the model — and is worth
    recording as its own reason.
  - A single reply can carry more than one tool request. Run all of them before the
    next request, and pair each result with the request it answers.

Parameters
----------
task : str          the user's request
client              the Anthropic client — only ever call it through `rec.request`
rec                 the Recorder (agent/harness/trace.py); its user, request,
                    tool_result and end methods are how the run gets recorded
tools : list[dict]  the tool JSON schemas sent to the model (provided)
dispatch            dispatch(tool_use_block) -> str, runs your tools.py body (provided)
max_turns : int     the turn limit
"""
from __future__ import annotations

from typing import Any


def run(task: str, *, client: Any, rec: Any, tools: list[dict], dispatch: Any, max_turns: int = 8) -> None:
    raise NotImplementedError('TODO: implement run')
