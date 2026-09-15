# tiny-agents:exercise
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
    return "\n".join([p.name for p in repo.iterdir()])


def read_file(repo: Path, path: str) -> str:
    """Return the contents of `path` within `repo`."""
    return (repo / path).read_text()


def edit_file(repo: Path, path: str, find: str, replace: str) -> str:
    """Replace `find` with `replace` in `path`; return a short confirmation."""
    file_content = read_file(repo, path)
    replacements = file_content.count(find)
    if replacements == 0:
        return f"no occurrences of {find!r} in {path} — nothing changed"
    (repo / path).write_text(file_content.replace(find, replace))
    return f"replaced {replacements} occurrence(s) of {find!r} with {replace!r} in {path}"
