"""Runner for Tiny Agent v0 — scaffolding. Run with `uv run python -m agent.v0`.

Wires the fixture repo, the tool schemas, the dispatch onto your `tools.py`
bodies, the recorder, and your loop together, then saves the trace. You implement
`loop.run` and the `tools.py` bodies; you should not need to edit this file.
"""
from __future__ import annotations

from pathlib import Path

import anthropic

from agent.harness.repo import greeting_repo
from agent.harness.trace import Recorder
from agent.v0 import loop, tools

TASK = (
    "The greeting printed by this package is misspelled. "
    "Find the file it lives in, fix the spelling, and tell me what you changed."
)

# The tool schemas the model receives. Writing good schemas is lessons 4 and 9;
# here they are provided so the lesson can be about the loop.
TOOL_SCHEMAS: list[dict] = [
    {
        "name": "list_files",
        "description": "List the files in the repository.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "read_file",
        "description": "Read one file's contents.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "file name to read"}},
            "required": ["path"],
        },
    },
    {
        "name": "edit_file",
        "description": "Replace a substring in a file.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "find": {"type": "string"},
                "replace": {"type": "string"},
            },
            "required": ["path", "find", "replace"],
        },
    },
]


def make_dispatch(repo: Path):
    """Route a tool_use block to the matching body in tools.py."""
    def dispatch(block) -> str:
        name = block.name if hasattr(block, "name") else block["name"]
        args = dict(block.input if hasattr(block, "input") else block["input"])
        if name == "list_files":
            return tools.list_files(repo)
        if name == "read_file":
            return tools.read_file(repo, **args)
        if name == "edit_file":
            return tools.edit_file(repo, **args)
        return f"unknown tool: {name}"

    return dispatch


def main() -> None:
    repo_dir, repo_files = greeting_repo()
    rec = Recorder(
        lesson="02-the-agent-loop", version="v0", trace_id="02-agent-loop",
        tools=TOOL_SCHEMAS, repo=repo_files, max_turns=8,
    )
    try:
        client = anthropic.Anthropic()
    except anthropic.AnthropicError:
        # No credentials: fine while loop.run is still the TODO — it raises before
        # any request. Once you implement the loop, set ANTHROPIC_API_KEY (see the
        # lesson) and this becomes a real client.
        client = None

    loop.run(TASK, client=client, rec=rec, tools=TOOL_SCHEMAS,
             dispatch=make_dispatch(repo_dir), max_turns=8)

    path = rec.save()
    print(f"trace written to {path}")


if __name__ == "__main__":
    main()
