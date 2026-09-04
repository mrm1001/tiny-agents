"""Tiny Agents — the coding agent, grown one block at a time across the lessons.

Each `agent/vX/` is a complete, self-contained snapshot of the agent as of a
particular lesson (v0 = lesson 2). A later version is a copy of the previous one
plus the new block, so an earlier lesson's code never changes underneath it and
its recorded trace can always be reproduced.

`agent/harness/` is the one shared, frozen piece: the trace recorder and the
fixture repos. It is deliberately not versioned, because the site renders every
version's trace through a single schema and viewer.
"""
