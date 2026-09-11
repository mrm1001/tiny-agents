# Tiny Agent v0 — the agent loop (lesson 2)

Tiny Agent v0 is the first version of the coding agent built across this course: a model, a
loop, three tools, and a turn limit, in a few dozen lines. In this lesson it fixes a misspelled
greeting — it lists the files in a small repository, reads them to find the greeting, and edits
the file to correct it.

This directory is the **solution** (the runnable code). The **blank version to start from** is at
[`learn/agent/v0/`](../../learn/agent/v0/), where the two files below have their bodies removed.

## What you implement

- `loop.py` — the loop. Send the conversation to the model, run any tool it asks for, add the
  result, and repeat until the model stops or the turn limit is reached. The full recipe is in the
  file's docstring.
- `tools.py` — the three tool bodies: `list_files`, `read_file`, and `edit_file`.

## Provided for you (don't edit)

- `agent/harness/trace.py` — the recorder your loop calls. It writes the trace, so you never build
  the JSON by hand.
- `agent/harness/repo.py` — the four-file greeting repository the agent works on.
- `__main__.py` — the runner that wires everything together and saves the trace.

## Run it

```sh
uv run --env-file .env python -m agent.v0
```

After it runs, the trace is saved to `src/content/traces/02-agent-loop.json`. The interactive demo
on the lesson-2 page reads that file, so you can step through your own run one message at a time.
