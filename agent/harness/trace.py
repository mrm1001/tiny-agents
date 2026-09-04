"""Trace recorder — scaffolding for the Build track. DO NOT EDIT for the lesson.

Your agent (loop.py + tools.py, which you write) calls a Recorder as it runs. The
recorder watches the conversation go by and writes a typed JSON trace that the
site's interactive viewer replays. You never hand-build the JSON.

The whole contract your loop needs:

    rec.user(task)                                     # the opening user message
    resp = rec.request(client, messages, tools=SCHEMAS)  # wraps messages.create
    rec.tool_result(tool_use_block, output_str)          # after you run a tool
    rec.end("stop_reason", stop_reason=resp.stop_reason) # or rec.end("max_turns")
    rec.save()

`rec.request` returns the raw SDK response, so your loop still reads
`resp.stop_reason` and `resp.content` and decides what to do next — the loop is
yours. `rec.tool_result` buffers results; they become one user message (faithful
to parallel tool calls) at the next `request` or at `end`.

The output matches the `traces` collection schema in src/content.config.ts. That
schema is shared and frozen across every lesson's version, so prefer not to
change the shape here; if you must, change it there too.
"""
from __future__ import annotations

import datetime
import json
import subprocess
from pathlib import Path
from typing import Any

# Tool outputs are truncated at record time: the trace is serialised inline into
# the page's HTML, so an unbounded file read would bloat every visitor's download.
MAX_TOOL_OUTPUT = 2000


def _get(obj: Any, name: str, default: Any = None) -> Any:
    """Read a field from either an SDK object (attribute) or a plain dict."""
    if isinstance(obj, dict):
        return obj.get(name, default)
    return getattr(obj, name, default)


def _repo_root() -> Path:
    """Walk up to the pyproject.toml. Depth varies by version dir, so this is more
    robust than counting parents."""
    here = Path(__file__).resolve()
    for p in (here, *here.parents):
        if (p / "pyproject.toml").exists():
            return p
    raise RuntimeError("could not find the repo root (no pyproject.toml above trace.py)")


def _git_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=_repo_root(), text=True
        ).strip()
    except Exception:
        return "unknown"


def _block_to_dict(block: Any) -> dict:
    """Serialise one assistant content block to the compact shape the trace stores."""
    kind = _get(block, "type")
    if kind == "text":
        return {"type": "text", "text": _get(block, "text", "")}
    if kind == "thinking":
        # SDK uses `.thinking`; a summary when display="summarized".
        return {"type": "thinking", "text": _get(block, "thinking", "") or _get(block, "text", "")}
    if kind == "tool_use":
        return {"type": "tool_use", "id": _get(block, "id"), "name": _get(block, "name"), "input": _get(block, "input", {})}
    return {"type": kind}


class Recorder:
    def __init__(
        self,
        *,
        lesson: str,
        version: str,
        trace_id: str | None = None,
        model: str = "claude-opus-5",
        max_turns: int = 8,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
        repo: dict[str, str] | None = None,
        thinking: dict | None = None,
    ):
        self.lesson = lesson
        self.version = version
        self.trace_id = trace_id or lesson
        self.model = model
        self.max_turns = max_turns
        self.max_tokens = max_tokens
        self.tool_names = [t["name"] for t in (tools or [])]
        self.repo = repo or {}
        # display="summarized" so the trace has visible reasoning to show.
        self.thinking = thinking or {"type": "adaptive", "display": "summarized"}

        self.messages: list[dict] = []   # [{mi, role, blocks}]
        self.requests: list[dict] = []   # [{ri, sentMessages, stopReason, usage}]
        self.steps: list[dict] = []      # [{i, mi, ri, kind, …}]
        self._pending: list[dict] = []   # tool_results buffered into the next user message
        self._ri = 0
        self._any_truncation = False
        self._usage = {"inputTokens": 0, "outputTokens": 0, "requests": 0}

    # --- internal helpers -----------------------------------------------------
    def _add_message(self, role: str, blocks: list[dict]) -> int:
        mi = len(self.messages)
        self.messages.append({"mi": mi, "role": role, "blocks": blocks})
        return mi

    def _add_step(self, mi: int, ri: int | None, kind: str, **fields: Any) -> None:
        self.steps.append({"i": len(self.steps), "mi": mi, "ri": ri, "kind": kind, **fields})

    def _flush_tool_results(self) -> None:
        if not self._pending:
            return
        blocks = [
            {"type": "tool_result", "tool_use_id": tr["tool_use_id"], "content": tr["content"],
             **({"is_error": True} if tr["is_error"] else {})}
            for tr in self._pending
        ]
        mi = self._add_message("user", blocks)
        for tr in self._pending:
            self._add_step(mi, tr["ri"], "tool_result", toolUseId=tr["tool_use_id"],
                           name=tr["name"], output=tr["content"], isError=tr["is_error"],
                           truncated=tr["truncated"])
        self._pending = []

    # --- the contract your loop uses ------------------------------------------
    def user(self, text: str) -> None:
        mi = self._add_message("user", [{"type": "text", "text": text}])
        self._add_step(mi, None, "user", text=text)

    def request(self, client: Any, messages: list, *, tools: list[dict]) -> Any:
        """Send `messages` to the model and record the request + the reply's blocks.
        Returns the raw SDK response for your loop to act on."""
        self._flush_tool_results()  # the previous turn's tool results are the user message before this call
        sent = len(messages)        # the honest number: the whole conversation is resent every time
        resp = client.messages.create(
            model=self.model, max_tokens=self.max_tokens,
            thinking=self.thinking, tools=tools, messages=messages,
        )
        self._ri += 1
        ri = self._ri
        usage = _get(resp, "usage")
        in_tok = _get(usage, "input_tokens", 0) or 0
        out_tok = _get(usage, "output_tokens", 0) or 0
        self.requests.append({"ri": ri, "sentMessages": sent,
                              "stopReason": _get(resp, "stop_reason"),
                              "usage": {"inputTokens": in_tok, "outputTokens": out_tok}})
        self._usage["inputTokens"] += in_tok
        self._usage["outputTokens"] += out_tok
        self._usage["requests"] += 1

        blocks = [_block_to_dict(b) for b in _get(resp, "content", [])]
        mi = self._add_message("assistant", blocks)
        for b in blocks:
            if b["type"] == "tool_use":
                self._add_step(mi, ri, "tool_use", toolUseId=b["id"], name=b["name"], input=b["input"])
            elif b["type"] == "thinking":
                self._add_step(mi, ri, "thinking", text=b["text"])
            elif b["type"] == "text":
                self._add_step(mi, ri, "text", text=b["text"])
        return resp

    def tool_result(self, tool_use: Any, output: Any, *, is_error: bool = False) -> None:
        out = output if isinstance(output, str) else json.dumps(output)
        truncated = len(out) > MAX_TOOL_OUTPUT
        if truncated:
            out = out[:MAX_TOOL_OUTPUT] + "\n… [truncated]"
            self._any_truncation = True
        self._pending.append({"tool_use_id": _get(tool_use, "id"), "name": _get(tool_use, "name"),
                              "content": out, "is_error": is_error, "ri": self._ri, "truncated": truncated})

    def end(self, reason: str, *, stop_reason: str | None = None,
            stop_details: Any = None, truncated: bool | None = None) -> None:
        self._flush_tool_results()
        last_mi = self.messages[-1]["mi"] if self.messages else 0
        self._add_step(last_mi, self._ri or None, "end", reason=reason,
                       stopReason=stop_reason, stopDetails=stop_details,
                       truncated=bool(self._any_truncation if truncated is None else truncated))

    # --- output ---------------------------------------------------------------
    def to_dict(self) -> dict:
        return {
            "id": self.trace_id, "lesson": self.lesson, "version": self.version,
            "recordedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "model": self.model, "agentSha": _git_sha(),
            "config": {"tools": self.tool_names, "maxTurns": self.max_turns},
            "repo": self.repo,
            "messages": self.messages, "requests": self.requests, "steps": self.steps,
            "usage": self._usage,
        }

    def save(self, path: str | Path | None = None) -> Path:
        if path is None:
            path = _repo_root() / "src" / "content" / "traces" / f"{self.trace_id}.json"
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), indent=2) + "\n")
        return path
