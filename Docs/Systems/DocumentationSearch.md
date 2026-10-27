# Documentation Search

`Tools/docs_search.py` provides local keyword retrieval over `Docs/**/*.md`. It uses Python 3.10+
and the standard library's SQLite FTS5 extension. The disposable index lives at
`.cache/docs-search/index.sqlite3`; Markdown source files remain authoritative.

## Sections and labels

Each ATX Markdown heading begins a non-overlapping section. Headings inside backtick or tilde code
fences are treated as content. Empty headings do not produce results. A Design document's `Status:`
value is attached to its result. Results are labeled as system, design, reference, TODO, or history.
Daily files under `Docs/History/YYYY-MM-DD.md` are excluded unless `--include-history` is supplied.
Symlinked files that resolve outside this checkout's `Docs/` directory are excluded.

## Query and ranking

Queries are case-insensitive. Common English question words are removed, while code identifiers stay
searchable as both their complete spelling and their CamelCase or underscore-separated words. The
remaining words are OR-matched using SQLite FTS5 with English stemming. Results matching more
distinct query terms rank first; ties use BM25 with title, heading, and body weights of 8, 5, and 1,
then path and source line.

This is lexical search: related ideas with different vocabulary may need another query. History is
off by default so old behavior does not outrank current contracts.

## Output and index refresh

The default is five results and a 12,000-character output budget. `--limit` accepts 1–100 results;
`--max-chars` accepts at least 512 characters. Metadata counts toward the character budget.
Oversized sections return a contiguous window of whole source lines around a matching line and show
the excerpt range plus an omission notice. If only the document title or inherited breadcrumb
matches, the body is omitted rather than showing unrelated lines. Result metadata retains the full
source section range.

Every invocation hashes current Markdown bytes, including uncommitted edits, and transactionally
updates added, changed, and removed documents before querying. Checkouts keep separate indexes. If
the cache is inaccessible, locked beyond its timeout, or corrupt, that invocation searches a fresh
in-memory index and warns on stderr rather than serving stale content. Source-read failures stop the
search.

## Use

From the project root, run a specific, bounded query:

```sh
rtk proxy python3 Tools/docs_search.py "navigation deep links" --limit 3 --max-chars 2000
```

Pass `--include-history` when investigating how documented behavior changed. Search results are a
locator, not a replacement for reading the relevant source and its surrounding context.
