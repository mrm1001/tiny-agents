#!/usr/bin/env python3
"""Generate the blank exercises under learn/ from the solutions.

The solutions live at agent/v*/ and experiments/*/ and are the single source of
truth. This mirrors them into learn/, blanking the body of every function in a
file marked `# tiny-agents:exercise` on its first line, copying everything else
verbatim, and excluding recorded answers (results.json).

    uv run scripts/make_exercises.py            # (re)write learn/
    uv run scripts/make_exercises.py --check     # fail if learn/ is stale

Blanking keeps each function's decorators, signature and leading docstring, and
replaces the rest of the body with `raise NotImplementedError`. It is line-based
(not ast.unparse), so comments and formatting outside the body survive intact.
"""
from __future__ import annotations

import ast
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEARN = ROOT / "learn"
MARKER = "# tiny-agents:exercise"
EXCLUDE_NAMES = {"results.json"}  # recorded answers, not code


def source_dirs() -> list[Path]:
    """The solution trees to mirror: agent/v*/ (not agent/harness) and experiments/*/."""
    dirs: list[Path] = []
    for p in sorted((ROOT / "agent").glob("v*")):
        if p.is_dir():
            dirs.append(p)
    exp = ROOT / "experiments"
    if exp.is_dir():
        dirs += [p for p in sorted(exp.iterdir()) if p.is_dir()]
    return dirs


def iter_files(d: Path):
    for p in sorted(d.rglob("*")):
        if p.is_file() and "__pycache__" not in p.parts:
            yield p


def blank_source(src: str) -> str:
    """Replace each function body with `raise NotImplementedError`, keeping the
    decorators, signature and a leading docstring."""
    lines = src.splitlines(keepends=True)
    tree = ast.parse(src)

    # Outermost functions only: top-level defs and methods of top-level classes.
    funcs: list[ast.AST] = []
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            funcs.append(node)
        elif isinstance(node, ast.ClassDef):
            funcs += [m for m in node.body if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef))]

    edits = []  # (replace_start, replace_end, indent, name) — 1-indexed, inclusive
    for fn in funcs:
        body = fn.body
        first = body[0]
        has_doc = (
            isinstance(first, ast.Expr)
            and isinstance(getattr(first, "value", None), ast.Constant)
            and isinstance(first.value.value, str)
        )
        indent = " " * first.col_offset
        if has_doc:
            rest = body[1:]
            if rest:
                replace_start, replace_end = rest[0].lineno, body[-1].end_lineno
            else:  # docstring only — insert a raise just after it
                replace_start, replace_end = first.end_lineno + 1, first.end_lineno
        else:
            replace_start, replace_end = first.lineno, body[-1].end_lineno
        edits.append((replace_start, replace_end, indent, fn.name))

    # Apply bottom-to-top so earlier line numbers stay valid.
    for replace_start, replace_end, indent, name in sorted(edits, key=lambda e: e[0], reverse=True):
        raise_line = f"{indent}raise NotImplementedError({f'TODO: implement {name}'!r})\n"
        lines[replace_start - 1 : replace_end] = [raise_line]
    return "".join(lines)


def build(dest: Path) -> None:
    if dest.exists():
        shutil.rmtree(dest)
    for d in source_dirs():
        for f in iter_files(d):
            if f.name in EXCLUDE_NAMES:
                continue
            out = dest / f.relative_to(ROOT)
            out.parent.mkdir(parents=True, exist_ok=True)
            text = f.read_text()
            marked = f.suffix == ".py" and text.splitlines()[:1] and text.splitlines()[0].strip() == MARKER
            out.write_text(blank_source(text) if marked else text)


def _tree(root: Path) -> dict[str, str]:
    if not root.exists():
        return {}
    return {
        str(p.relative_to(root)): p.read_text()
        for p in root.rglob("*")
        if p.is_file() and "__pycache__" not in p.parts
    }


def check() -> int:
    tmp = Path(tempfile.mkdtemp()) / "learn"
    build(tmp)
    want, have = _tree(tmp), _tree(LEARN)
    diffs = []
    for rel in sorted(set(want) | set(have)):
        if rel not in have:
            diffs.append(f"missing:  learn/{rel}")
        elif rel not in want:
            diffs.append(f"extra:    learn/{rel}")
        elif want[rel] != have[rel]:
            diffs.append(f"stale:    learn/{rel}")
    shutil.rmtree(tmp.parent, ignore_errors=True)
    if diffs:
        print("EXERCISES STALE — run: uv run scripts/make_exercises.py")
        for d in diffs:
            print("  " + d)
        return 1
    print(f"EXERCISES OK — learn/ mirrors the solutions ({len(want)} files)")
    return 0


if __name__ == "__main__":
    if "--check" in sys.argv[1:]:
        sys.exit(check())
    build(LEARN)
    n = sum(1 for _ in LEARN.rglob("*") if _.is_file())
    print(f"wrote learn/ ({n} files)")
