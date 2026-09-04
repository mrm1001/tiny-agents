"""Fixture repositories. Scaffolding — DO NOT EDIT for the lesson.

`greeting_repo()` is the lesson-2 Build task: four tiny files, one holding a
misspelled greeting, so the agent must list, read and edit to fix it.

`chain_repo(n)` is a Measure fixture: n files where each names the next, so a task
that follows the chain from `start.txt` forces exactly n `read_file` round-trips.

Both return `(path, files)` — a temp directory to run against, and a name→content
dict for the trace's `repo` field.
"""
from __future__ import annotations

import tempfile
from pathlib import Path

GREETING_FILES: dict[str, str] = {
    "greet_a.py": "def hi():\n    return 1  # no greeting here\n",
    "greet_b.py": "TITLE = 'greetings module'\n",
    "greet_c.py": 'GREETING = "Helo, world"\n',
    "greet_d.py": "# helpers for the greeting package\n",
}


def _materialise(files: dict[str, str]) -> tuple[Path, dict[str, str]]:
    d = Path(tempfile.mkdtemp(prefix="tiny-agent-"))
    for name, content in files.items():
        (d / name).write_text(content)
    return d, dict(files)


def greeting_repo() -> tuple[Path, dict[str, str]]:
    return _materialise(GREETING_FILES)


def chain_repo(n: int) -> tuple[Path, dict[str, str]]:
    """n files: start.txt → link_1.txt → … → link_{n-1}.txt, the last holding the value."""
    if n < 1:
        raise ValueError("chain length must be at least 1")
    names = ["start.txt"] + [f"link_{i}.txt" for i in range(1, n)]
    files: dict[str, str] = {}
    for i, name in enumerate(names):
        if i + 1 < n:
            files[name] = f"The next file is {names[i + 1]}\n"
        else:
            files[name] = "The value is 42\n"
    return _materialise(files)
