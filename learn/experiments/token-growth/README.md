# Measure — the cost of the loop (lesson 2)

**Question.** How does the number of input tokens grow as a task needs more sequential tool calls?

Every step of the loop resends the whole conversation, so the cumulative input tokens should grow
faster than the number of steps — roughly with its square. This experiment measures that.

This directory is the **solution** (the rig, once written). The **blank version to start from** is
at [`learn/experiments/token-growth/`](../../learn/experiments/token-growth/).

## The four tasks

Each task forces its depth by construction — a chain of tiny files where each names the next, so a
task that follows the chain from `start.txt` makes exactly *N* `read_file` calls. Use
`agent.harness.repo.chain_repo(n)` for the fixtures.

| Task | Chain length | `read_file` round-trips |
| --- | --- | --- |
| A | 1 | 1 |
| B | 3 | 3 |
| C | 5 | 5 |
| D | 10 | 10 |

Hold everything else constant: the same model and tools, the same turn limit, the same fixture
shape.

## What you write

A rig that runs the agent on the four tasks and records the input tokens for each request, then
writes `results.json` in the contract below. Commit `results.json` — the chart on the lesson-2 page
reads it. (`results.json` is the recorded answer, so it is **not** copied into the blank version.)

## Results contract — `results.json`

```json
{
  "placeholder": false,
  "metricLabel": "cumulative input tokens",
  "tasks": [
    {
      "label": "A",
      "calls": 1,
      "points": [ { "call": 1, "cumulative": 950 } ]
    }
  ]
}
```

- `tasks[]` — one entry per task, in order.
- `label`, `calls` — the task's name and how many tool calls it forces.
- `points[]` — one point per tool call: `call` (1-indexed) and `cumulative` (input tokens summed
  across every request up to and including that call).
- `placeholder` — set `true` while the numbers are illustrative; the page shows a note when it is
  true. Set `false` once the numbers come from a real run.
