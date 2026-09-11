# tiny-agents:exercise
"""The agent loop — YOU implement `run`. This is the lesson.

The runner calls `run` with everything wired up; you write the loop itself. The
recipe below is the whole of lesson 2 — transcribe it and understand each line.

    def run(task, *, client, rec, tools, dispatch, max_turns):
        rec.user(task)
        messages = [{"role": "user", "content": task}]
        for _ in range(max_turns):
            resp = rec.request(client, messages, tools=tools)     # sends the whole conversation
            messages.append({"role": "assistant", "content": resp.content})
            if resp.stop_reason != "tool_use":                    # the model is done
                rec.end("stop_reason", stop_reason=resp.stop_reason)
                return
            results = []
            for block in resp.content:                            # may be several tool calls
                if block.type == "tool_use":
                    output = dispatch(block)                      # runs your tools.py body
                    rec.tool_result(block, output)
                    results.append({"type": "tool_result", "tool_use_id": block.id, "content": output})
            messages.append({"role": "user", "content": results}) # append results; loop again
        rec.end("max_turns")                                      # our harness stopped it, not the model

Notes:
  - `messages` is the whole conversation, resent every turn — that is the point of
    the lesson. The loop only ever appends to it.
  - `resp.stop_reason == "tool_use"` is the continue signal; every other value is
    an ending. Reaching `max_turns` is a *different* kind of ending — your code
    stopping the loop, not the model — which is why it is recorded separately.

Parameters
----------
task : str          the user's request
client              the Anthropic client (call it only through `rec.request`)
rec                 the Recorder (agent/harness/trace.py)
tools : list[dict]  the tool JSON schemas to send to the model (provided)
dispatch            dispatch(tool_use_block) -> str, runs your tools.py body (provided)
max_turns : int     the turn limit
"""
from __future__ import annotations

from typing import Any


def run(task: str, *, client: Any, rec: Any, tools: list[dict], dispatch: Any, max_turns: int = 8) -> None:
    raise NotImplementedError('TODO: implement run')
