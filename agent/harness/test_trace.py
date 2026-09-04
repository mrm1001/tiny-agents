"""Recorder plumbing test — no key, no real agent. `uv run pytest agent/harness`.

Drives the Recorder with a fake client returning canned responses, then checks
the emitted trace satisfies the referential-integrity rules the site's `traces`
schema enforces. This proves the recorder before any agent is written.
"""
from __future__ import annotations

from agent.harness.trace import Recorder


class _Block:
    def __init__(self, **kw):
        self.__dict__.update(kw)


class _Usage:
    def __init__(self, i, o):
        self.input_tokens = i
        self.output_tokens = o


class _Resp:
    def __init__(self, content, stop_reason, usage):
        self.content = content
        self.stop_reason = stop_reason
        self.usage = usage


class _MockClient:
    """Two turns: read a file (tool_use), then finish (end_turn)."""

    def __init__(self):
        self._n = 0
        self.messages = self  # so client.messages.create resolves to .create

    def create(self, **kw):
        self._n += 1
        if self._n == 1:
            return _Resp(
                [
                    _Block(type="thinking", thinking="I'll read the file that holds the greeting."),
                    _Block(type="tool_use", id="t1", name="read_file", input={"path": "greet_c.py"}),
                ],
                "tool_use",
                _Usage(900, 20),
            )
        return _Resp([_Block(type="text", text="Fixed the typo in greet_c.py.")], "end_turn", _Usage(1200, 15))


def _check_integrity(trace: dict) -> None:
    steps = trace["steps"]
    assert [s["i"] for s in steps] == list(range(len(steps))), "step i must be contiguous from 0"

    tool_ids = [s["toolUseId"] for s in steps if s["kind"] == "tool_use"]
    assert len(tool_ids) == len(set(tool_ids)), "tool-use ids must be unique"

    answered = {s["toolUseId"] for s in steps if s["kind"] == "tool_result"}
    for tid in tool_ids:
        assert tid in answered, f"tool_use {tid} has no matching tool_result"

    assert all(
        s["name"] in trace["config"]["tools"] for s in steps if s["kind"] == "tool_use"
    ), "every tool_use name must be declared in config.tools"

    mis = [s["mi"] for s in steps if s["mi"] is not None]
    assert mis == sorted(mis), "mi must be non-decreasing"

    ends = [s for s in steps if s["kind"] == "end"]
    assert len(ends) == 1 and steps[-1]["kind"] == "end", "exactly one terminal step, and it is last"


def test_recorder_emits_valid_trace(tmp_path):
    rec = Recorder(
        lesson="02-the-agent-loop", version="v0", trace_id="t",
        tools=[{"name": "read_file"}], repo={"greet_c.py": "..."}, max_turns=8,
    )
    client = _MockClient()

    rec.user("fix the greeting")
    messages = [{"role": "user", "content": "fix the greeting"}]

    resp = rec.request(client, messages, tools=[{"name": "read_file", "input_schema": {}}])
    messages.append({"role": "assistant", "content": "<assistant>"})
    for b in resp.content:
        if b.type == "tool_use":
            rec.tool_result(b, "GREETING = 'Helo, world'")
    messages.append({"role": "user", "content": "<tool results>"})

    resp2 = rec.request(client, messages, tools=[{"name": "read_file", "input_schema": {}}])
    rec.end("stop_reason", stop_reason=resp2.stop_reason)

    trace = rec.to_dict()
    _check_integrity(trace)

    assert trace["usage"]["requests"] == 2
    assert [r["sentMessages"] for r in trace["requests"]] == [1, 3], "conversation grows; sentMessages is odd"
    assert trace["messages"][0]["mi"] == 0

    written = rec.save(tmp_path / "t.json")
    assert written.exists()
