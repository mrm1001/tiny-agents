# Source files

> Curating the library itself — adding sources, citing them — is in
> [SOURCES.md](../SOURCES.md). This file covers the file cache mechanics.

Local cache of course sources that exist as files — mostly PDFs — plus their
extracted text. **Everything here except this README is gitignored**, so it never
gets pushed. That is deliberate on two counts: the raw files are third-party
material we have no licence to redistribute, and the extracted text is a
derivable cache rather than source of truth.

```
sources/
  raw/   <id>.<ext>        the original file, byte-for-byte
  text/  <id>.txt          extracted text, with `=== page N ===` markers
         <id>.meta.json    provenance: origin, sha256, pages, words, when
```

## Naming

Name a file after its `id` in [`src/data/library.ts`](../src/data/library.ts) and
the cache lines up with the bibliography — `openai-practical-guide.pdf` pairs with
the `openai-practical-guide` entry. Anything named otherwise still works; it just
isn't linked to a citation.

## Adding a source

Fetch and extract in one step:

```sh
uv run scripts/ingest-source.py https://example.com/paper.pdf --id author-title
```

Or drop files into `sources/raw/` by hand and extract whatever is new:

```sh
uv run scripts/ingest-source.py --scan
```

`--scan` is safe to re-run: it skips files whose cached text is already current,
and re-extracts any whose `sha256` no longer matches — so replacing a raw file in
place is picked up automatically.

```sh
uv run scripts/ingest-source.py --list    # what is cached, and what is stale
```

Supported: `.pdf` (via `pypdf`), and `.txt` / `.md` / `.html` / `.json` / `.csv`.
For anything else the script says so rather than guessing; add a branch to
`extract()` in `scripts/ingest-source.py`.

No install step — the script declares its own dependencies inline (PEP 723) and
`uv` provisions them in an ephemeral environment.

## Quoting from the cache

Page markers in `<id>.txt` mean a quote can cite a page. Keep the quote itself in
the source's `note` field in `library.ts`, or in the lesson prose — not only here,
since this directory is not pushed and a fresh clone starts empty. Rebuild it with
`--scan`, or re-fetch from the URLs in `library.ts`.

One case where that promise does not hold: a page whose URL blocks automated
fetching, captured by printing it to a PDF by hand. `openai-codex-agent-loop` is
one — `openai.com/index/*` returns 403 to everything, so the raw file in
`sources/raw/` is the only copy there will be and `--scan` cannot recreate it. For
these, the `note` in `library.ts` is not a convenience but the actual archive: put
every quote a lesson relies on there.
