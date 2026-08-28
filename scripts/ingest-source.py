# /// script
# requires-python = ">=3.11"
# dependencies = ["pypdf>=6"]
# ///
"""Ingest a course source file and cache its extracted text.

    uv run scripts/ingest-source.py <url-or-path> [--id ID] [--force]
    uv run scripts/ingest-source.py --scan [--force]
    uv run scripts/ingest-source.py --list

Why this exists: sources with a physical file (mostly PDFs) should be kept so we
can re-read them without re-fetching, and their extracted text should be cached so
quoting does not mean re-running an extraction every time.

Layout, all of it gitignored except the README:

    sources/raw/<name>.<ext>        the original file, byte-for-byte
    sources/text/<name>.txt        extracted text, with `=== page N ===` markers
    sources/text/<name>.meta.json  provenance: origin, sha256, pages, words, when

Name files after their `id` in src/data/library.ts and the cache lines up with the
bibliography. Drop files into sources/raw/ by hand and `--scan` will pick them up.

The `# /// script` header above is deliberate here: it makes this tool run in its
own ephemeral environment, independent of the project. Do NOT copy that header
into exercise scripts under exercises/ — there it would cut them off from the
project's own dependencies.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "sources" / "raw"
TEXT = ROOT / "sources" / "text"

# Many CDNs reject the default urllib agent outright. cdn.openai.com is one.
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/151.0 Safari/537.36"
)

TEXTUAL = {".txt", ".md", ".markdown", ".html", ".htm", ".json", ".csv"}


def slugify(value: str) -> str:
    value = re.sub(r"\.[A-Za-z0-9]{1,5}$", "", value)
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value or "source"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=120) as resp, dest.open("wb") as out:
            shutil.copyfileobj(resp, out)
    except urllib.error.HTTPError as exc:
        raise SystemExit(
            f"! {url}\n  HTTP {exc.code} {exc.reason}\n"
            f"  If the landing page blocks but a direct file URL exists, try that instead.\n"
            f"  If it cannot be fetched at all, record it as `blocked` in src/data/library.ts."
        ) from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"! {url}\n  could not connect: {exc.reason}") from exc


def extension_for(origin: str, downloaded: Path | None = None) -> str:
    suffix = Path(origin.split("?")[0]).suffix.lower()
    if suffix:
        return suffix
    if downloaded and downloaded.read_bytes()[:5] == b"%PDF-":
        return ".pdf"
    return ".bin"


def extract_pdf(path: Path) -> tuple[str, dict]:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    pages = [(i + 1, (p.extract_text() or "").strip()) for i, p in enumerate(reader.pages)]
    body = "\n\n".join(f"=== page {n} ===\n{t}" for n, t in pages if t)
    meta = {k.lstrip("/"): str(v) for k, v in (reader.metadata or {}).items()}
    return body, {
        "pages": len(pages),
        "pages_with_text": sum(1 for _, t in pages if t),
        "pdf_metadata": meta,
    }


def extract_textual(path: Path) -> tuple[str, dict]:
    body = path.read_text(encoding="utf-8", errors="replace")
    if path.suffix.lower() in {".html", ".htm"}:
        body = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", body)
        body = re.sub(r"(?s)<[^>]+>", " ", body)
        body = re.sub(r"[ \t]*\n\s*\n\s*", "\n\n", body)
        body = re.sub(r"[ \t]{2,}", " ", body)
    return body.strip(), {"note": "tag-stripped" if path.suffix.lower() in {".html", ".htm"} else "verbatim"}


class Unsupported(Exception):
    """Raised for a file type we have no extractor for."""

    def __init__(self, path: Path):
        suffix = path.suffix.lower() or "a file with no extension"
        super().__init__(
            f"don't know how to extract {suffix}: {path.name}\n"
            f"    Supported: .pdf and {', '.join(sorted(TEXTUAL))}.\n"
            f"    Add a branch to extract() in this script if a new kind shows up."
        )


def supported(path: Path) -> bool:
    return path.suffix.lower() == ".pdf" or path.suffix.lower() in TEXTUAL


def extract(path: Path) -> tuple[str, dict]:
    if path.suffix.lower() == ".pdf":
        return extract_pdf(path)
    if path.suffix.lower() in TEXTUAL:
        return extract_textual(path)
    raise Unsupported(path)


def write_cache(name: str, raw_path: Path, origin: str, extra: dict, body: str) -> dict:
    TEXT.mkdir(parents=True, exist_ok=True)
    (TEXT / f"{name}.txt").write_text(body + "\n", encoding="utf-8")
    meta = {
        "id": name,
        "origin": origin,
        "raw_file": str(raw_path.relative_to(ROOT)),
        "bytes": raw_path.stat().st_size,
        "sha256": sha256(raw_path),
        # Count the content, not our own page markers.
        "words": len(re.sub(r"(?m)^=== page \d+ ===$", "", body).split()),
        "extracted_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "extracted_by": "scripts/ingest-source.py",
        **extra,
    }
    (TEXT / f"{name}.meta.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    return meta


def is_stale(name: str, raw_path: Path) -> bool:
    """True when there is no cached text, or the raw file changed underneath it."""
    meta_path = TEXT / f"{name}.meta.json"
    if not (TEXT / f"{name}.txt").exists() or not meta_path.exists():
        return True
    try:
        return json.loads(meta_path.read_text())["sha256"] != sha256(raw_path)
    except (ValueError, KeyError):
        return True


def report(meta: dict) -> None:
    detail = f"{meta['words']} words"
    if "pages" in meta:
        detail += f", {meta['pages_with_text']}/{meta['pages']} pages with text"
    print(f"  ✓ {meta['id']}: {detail}")
    print(f"    text  sources/text/{meta['id']}.txt")


def ingest(target: str, source_id: str | None, force: bool) -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    is_url = target.startswith(("http://", "https://"))

    if is_url:
        name = source_id or slugify(Path(target.split("?")[0]).name or target)
        existing = next((p for p in RAW.glob(f"{name}.*") if not p.name.endswith(".part")), None)
        # Check the cache before spending the download — these files run to megabytes.
        if existing and not force and not is_stale(name, existing):
            print(f"  · {name}: already cached and unchanged (use --force to re-fetch)")
            return
        tmp = RAW / f".{name}.part"
        print(f"  fetching {target}")
        fetch(target, tmp)
        raw_path = RAW / f"{name}{extension_for(target, tmp)}"
        tmp.replace(raw_path)
    else:
        src = Path(target).expanduser().resolve()
        if not src.is_file():
            raise SystemExit(f"! not a file: {target}")
        # Check before copying, so an unsupported file never lands in raw/ and
        # trips up every later --scan.
        if not supported(src):
            raise SystemExit(f"! {Unsupported(src)}")
        name = source_id or slugify(src.name)
        raw_path = RAW / f"{name}{src.suffix.lower()}"
        if src != raw_path:
            shutil.copy2(src, raw_path)

    if not force and not is_stale(name, raw_path):
        print(f"  · {name}: already cached and unchanged (use --force to redo)")
        return

    body, extra = extract(raw_path)
    report(write_cache(name, raw_path, target, extra, body))


def scan(force: bool) -> None:
    """Extract anything sitting in sources/raw/ that has no fresh cached text."""
    RAW.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in RAW.iterdir() if p.is_file() and not p.name.startswith("."))
    if not files:
        print("  sources/raw/ is empty — drop files in there, or pass a URL.")
        return
    done = skipped = 0
    for path in files:
        name = path.stem
        if not force and not is_stale(name, path):
            print(f"  · {name}: already cached and unchanged")
            continue
        try:
            body, extra = extract(path)
        except Unsupported as exc:
            # One unknown file must not abort the whole scan.
            print(f"  ! {exc}")
            skipped += 1
            continue
        report(write_cache(name, path, f"local:{path.name}", extra, body))
        done += 1
    current = len(files) - done - skipped
    summary = f"\n  {done} extracted, {current} already current"
    if skipped:
        summary += f", {skipped} unsupported"
    print(summary)


def listing() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in RAW.iterdir() if p.is_file() and not p.name.startswith("."))
    if not files:
        print("  nothing ingested yet")
        return
    print(f"  {'id':<32} {'size':>9}  extracted")
    for path in files:
        meta_path = TEXT / f"{path.stem}.meta.json"
        if meta_path.exists():
            meta = json.loads(meta_path.read_text())
            state = f"{meta['words']} words"
            if "pages" in meta:
                state += f" / {meta['pages']}pp"
            if meta.get("sha256") != sha256(path):
                state += "  (STALE — raw file changed)"
        else:
            state = "no — run --scan"
        print(f"  {path.stem:<32} {path.stat().st_size:>9,}  {state}")


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Cache a course source file and its extracted text.",
        epilog="Name files after their id in src/data/library.ts to keep the cache aligned.",
    )
    ap.add_argument("target", nargs="?", help="URL or local path of the source file")
    ap.add_argument("--id", help="library id to file it under (defaults to a slug of the filename)")
    ap.add_argument("--scan", action="store_true", help="extract anything in sources/raw/ lacking text")
    ap.add_argument("--list", action="store_true", help="show what is cached")
    ap.add_argument("--force", action="store_true", help="re-extract even if unchanged")
    args = ap.parse_args()

    if args.list:
        listing()
    elif args.scan:
        scan(args.force)
    elif args.target:
        ingest(args.target, args.id, args.force)
    else:
        ap.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
