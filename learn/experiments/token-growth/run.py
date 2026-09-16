# tiny-agents:exercise
"""Measure — token growth vs. sequential tool calls (lesson 2).

Runs Tiny Agent v0 on chains of increasing length and records how the cumulative
input tokens grow. The chain fixture, the agent, the recorder and the results
writer are provided; YOU write the measurement — turning each run's requests into
cumulative points. See experiments/token-growth/README.md for the contract.
"""
from __future__ import annotations

from pathlib import Path

import anthropic

from agent.harness.repo import chain_repo
from agent.harness.results import write_results
from agent.harness.trace import Recorder
from agent.v0 import loop
from agent.v0.__main__ import TOOL_SCHEMAS, make_dispatch

# One task per chain length, labelled A–D in order.
TASKS = [("A", 1), ("B", 3), ("C", 5), ("D", 10)]

TASK = """Do not list the files. Start at start.txt, read one file at a time, follow each "next file is …" pointer until you reach the value, then report it."""

RESULTS_PATH = Path(__file__).parent / "results.json"


def main() -> None:
    raise NotImplementedError('TODO: implement main')


if __name__ == "__main__":
    main()
