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
    client = anthropic.Anthropic()
    tasks = []
    for label, n in TASKS:
        print(f"Doing chain length: {n}")
        repo_dir, repo_files = chain_repo(n)
        rec = Recorder(
            lesson="token-growth", version="v0",
            tools=TOOL_SCHEMAS, repo=repo_files, max_turns=n + 2,
        )
        loop.run(TASK, client=client, rec=rec, tools=TOOL_SCHEMAS,
                 dispatch=make_dispatch(repo_dir), max_turns=n + 2)

        # TODO (this is the measurement — you write it):
        #   Walk the tool-calling requests in `rec.requests` (those where
        #   req["stopReason"] == "tool_use"), keep a running total of
        #   req["usage"]["inputTokens"], and collect one (call, cumulative) pair
        #   per request — `call` 1-indexed. That running total is the whole point:
        #   every step resends the conversation, so it climbs faster than `call`.
        points: list[tuple[int, int]] = []  # <-- replace [] with the real accumulation
        running_total = 0
        for req_n, req in enumerate(rec.requests):
            if req["stopReason"] == "tool_use":
                running_total += req["usage"]["inputTokens"]
                points.append((req_n + 1, running_total))

        tasks.append((label, n, points))

    path = write_results(RESULTS_PATH, "cumulative input tokens", tasks)
    print(f"results written to {path}")


if __name__ == "__main__":
    main()
