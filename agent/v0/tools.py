"""The v0 tool belt — YOU implement these three functions. This is part of the lesson.

Each takes the fixture repo path first and returns a string: exactly what the
model sees as the tool result. Keep them small and forgiving. The JSON schemas
the model receives, and the dispatch that routes a tool call to the right
function here, are provided in `__main__.py` — you only write the bodies.
"""
from __future__ import annotations

from pathlib import Path


def list_files(repo: Path) -> str:
    """Return the names of the files in `repo`, one per line."""
    raise NotImplementedError("TODO (lesson 2): list the files in the repo, one name per line")


def read_file(repo: Path, path: str) -> str:
    """Return the contents of `path` within `repo`."""
    raise NotImplementedError("TODO (lesson 2): read `path` inside the repo and return its text")


def edit_file(repo: Path, path: str, find: str, replace: str) -> str:
    """Replace `find` with `replace` in `path`; return a short confirmation."""
    raise NotImplementedError("TODO (lesson 2): replace `find` with `replace` in the file and confirm")
