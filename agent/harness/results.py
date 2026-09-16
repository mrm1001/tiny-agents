"""Write a Measure experiment's results.json in the contract shape.

Scaffolding — DO NOT EDIT for the lesson. An experiment collects its own numbers
(that is the experiment); this only serialises them, so the JSON shape — the key
names and `placeholder: false` — lives in one place instead of being hand-rolled
per experiment. The chart on the lesson page reads the file this writes; the
contract itself is documented in each experiment's README.
"""
from __future__ import annotations

import json
from pathlib import Path

# One task's numbers: its label, how many tool calls it forces, and the points —
# each a (call, cumulative) pair, call 1-indexed.
Task = tuple[str, int, list[tuple[int, int]]]


def write_results(path: str | Path, metric_label: str, tasks: list[Task]) -> Path:
    """Serialise `tasks` to `path` as results.json, in order.

    tasks: one (label, calls, points) per task.
      label  — the task's name, e.g. "A"
      calls  — how many tool calls the task forces
      points — [(call, cumulative), …]: `call` 1-indexed, `cumulative` the input
               tokens summed across every request up to and including that call.

    Writes `placeholder: false`, so only call this with numbers from a real run.
    """
    data = {
        "placeholder": False,
        "metricLabel": metric_label,
        "tasks": [
            {
                "label": label,
                "calls": calls,
                "points": [{"call": c, "cumulative": cum} for c, cum in points],
            }
            for (label, calls, points) in tasks
        ],
    }
    out = Path(path)
    out.write_text(json.dumps(data, indent=2) + "\n")
    return out
