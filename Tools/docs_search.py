#!/usr/bin/env python3
"""Search repository documentation with bounded, source-backed output. Standard library only."""

import argparse
import hashlib
import re
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SCHEMA_VERSION = 1
DEFAULT_LIMIT = 5
DEFAULT_MAX_CHARS = 12000
STOP_WORDS = frozenset(
    "a an and are as at be been by can could do does for from how i in into is it "
    "me my of on or our should that the their there these this to us was we were "
    "what when where which who why will with would you your".split()
)
HEADING = re.compile(r"^ {0,3}(#{1,6})(?:[ \t]+(.*)|[ \t]*)$")
FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})(.*)$")


@dataclass(frozen=True)
class Section:
    path: str
    kind: str
    status: str
    title: str
    breadcrumb: str
    start: int
    end: int
    text: str


@dataclass(frozen=True)
class Results:
    hits: list
    total: int
    include_history: bool
    terms: tuple
    warning: str = ""


def searchable(text):
    """Retain full identifiers and also index their CamelCase/underscore words."""
    def expand(match):
        original = match.group()
        split = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", original)
        split = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", split).replace("_", " ")
        return original if split == original else original + " " + split

    return re.sub(r"\w+", expand, text)


def query_terms(query):
    terms = tuple(dict.fromkeys(
        word for word in re.findall(r"[^\W_]+", searchable(query).casefold())
        if word not in STOP_WORDS
    ))
    if not terms:
        raise ValueError("Enter at least one searchable word, such as 'inventory weight'.")
    if len(terms) > 64 or any(len(word) > 128 for word in terms):
        raise ValueError("Use at most 64 search terms, each at most 128 characters.")
    return terms


def document_kind(path):
    if path.startswith("Docs/History/"):
        return "history"
    if path.startswith("Docs/Systems/"):
        return "system"
    if path.startswith("Docs/Reference/"):
        return "reference"
    if path.startswith("Docs/Design/"):
        return "design"
    if path == "Docs/TODOs.md":
        return "todo"
    return "reference"


def split_sections(path, text):
    """Non-overlapping ATX sections; fenced examples never create headings."""
    lines = text.splitlines(keepends=True)
    headings = []
    fence = None
    for index, line in enumerate(lines):
        value = line.rstrip("\r\n")
        marker = FENCE.match(value)
        if fence:
            if marker and marker[1][0] == fence[0] and len(marker[1]) >= fence[1] and not marker[2].strip():
                fence = None
            continue
        if marker:
            fence = (marker[1][0], len(marker[1]))
            continue
        match = HEADING.match(value)
        if match:
            label = re.sub(r"[ \t]+#+[ \t]*$", "", match[2] or "").strip()
            headings.append((index, len(match[1]), label))

    title = next((label for _, level, label in headings if level == 1), Path(path).stem)
    first_section = next((index for index, level, _ in headings if level > 1), len(lines))
    status_lines = []
    for line in lines[:first_section]:
        value = line.strip().lstrip(">").strip()
        match = re.match(r"(?:\*\*)?Status:(?:\*\*)?\s*(.*)", value, re.I)
        if match:
            status_lines.append(match[1])
        elif status_lines:
            if line.lstrip().startswith(">") and value:
                status_lines.append(value)
            else:
                break
    status = " ".join(status_lines)
    kind = document_kind(path)
    boundaries = headings[:]
    if not headings or headings[0][0] > 0:
        boundaries.insert(0, (0, 0, ""))
    ancestry = []
    sections = []
    for pos, (start, level, label) in enumerate(boundaries):
        if level:
            while ancestry and ancestry[-1][0] >= level:
                ancestry.pop()
            ancestry.append((level, label))
        end = boundaries[pos + 1][0] if pos + 1 < len(boundaries) else len(lines)
        # A bare heading has no evidence to return.
        if not any(line.strip() for line in lines[start + bool(level):end]):
            continue
        breadcrumb = " > ".join(label for _, label in ancestry) or title
        if ancestry and ancestry[0][0] != 1:
            breadcrumb = title + " > " + breadcrumb
        sections.append(Section(path, kind, status, title, breadcrumb, start + 1, end,
                                "".join(lines[start:end])))
    return sections


def read_sources(root):
    docs = root / "Docs"
    if not docs.is_dir():
        raise ValueError(f"Documentation folder not found: {docs}")
    sources = {}
    for path in sorted(docs.rglob("*.md")):
        # Keep the corpus inside this checkout, including for symlinked directories.
        if not path.resolve().is_relative_to(docs.resolve()):
            continue
        data = path.read_bytes()
        sources[path.relative_to(root).as_posix()] = (
            hashlib.sha256(data).hexdigest(), data.decode("utf-8-sig")
        )
    return sources


def query_index(connection, sources, terms, limit, include_history):
    connection.row_factory = sqlite3.Row
    connection.execute("BEGIN IMMEDIATE")
    try:
        version = connection.execute("PRAGMA user_version").fetchone()[0]
        if version != SCHEMA_VERSION:
            connection.execute("DROP TABLE IF EXISTS sections")
            connection.execute("DROP TABLE IF EXISTS files")
        connection.execute("CREATE TABLE IF NOT EXISTS files(path TEXT PRIMARY KEY, digest TEXT NOT NULL)")
        connection.execute("""CREATE VIRTUAL TABLE IF NOT EXISTS sections USING fts5(
            title, heading, body, path UNINDEXED, kind UNINDEXED, status UNINDEXED,
            breadcrumb UNINDEXED, start_line UNINDEXED, end_line UNINDEXED, source UNINDEXED,
            tokenize='porter unicode61'
        )""")
        connection.execute(f"PRAGMA user_version={SCHEMA_VERSION}")
        indexed = dict(connection.execute("SELECT path, digest FROM files"))
        for path in indexed.keys() - sources.keys():
            connection.execute("DELETE FROM sections WHERE path=?", (path,))
            connection.execute("DELETE FROM files WHERE path=?", (path,))
        for path, (digest, text) in sources.items():
            if indexed.get(path) == digest:
                continue
            connection.execute("DELETE FROM sections WHERE path=?", (path,))
            connection.executemany("INSERT INTO sections VALUES(?,?,?,?,?,?,?,?,?,?)", [
                (searchable(s.title), searchable(s.breadcrumb), searchable(s.text), s.path,
                 s.kind, s.status, s.breadcrumb, s.start, s.end, s.text)
                for s in split_sections(path, text)
            ])
            connection.execute("INSERT OR REPLACE INTO files VALUES(?,?)", (path, digest))
        expression = " OR ".join('"' + word + '"' for word in terms)
        clause = "sections MATCH ?" + ("" if include_history else " AND kind != 'history'")
        total = connection.execute(f"SELECT count(*) FROM sections WHERE {clause}", (expression,)).fetchone()[0]
        term_queries = " UNION ALL ".join(
            "SELECT rowid AS id FROM sections WHERE sections MATCH ?" for _ in terms
        )
        rows = connection.execute(f"""WITH term_matches AS ({term_queries}),
            coverage AS (SELECT id, count(*) AS matched FROM term_matches GROUP BY id)
            SELECT sections.* FROM sections JOIN coverage ON sections.rowid = coverage.id
            WHERE {clause}
            ORDER BY coverage.matched DESC, bm25(sections, 8.0, 5.0, 1.0),
                     path, CAST(start_line AS INTEGER)
            LIMIT ?""", tuple('"' + word + '"' for word in terms) + (expression, limit)).fetchall()
        hits = [Section(row["path"], row["kind"], row["status"], "", row["breadcrumb"],
                        int(row["start_line"]), int(row["end_line"]), row["source"]) for row in rows]
        connection.commit()
        return Results(hits, total, include_history, terms)
    except Exception:
        connection.rollback()
        raise


def search(root, query, limit=DEFAULT_LIMIT, include_history=False):
    terms = query_terms(query)
    if limit < 1 or limit > 100:
        raise ValueError("--limit must be between 1 and 100.")
    root = Path(root).resolve()
    sources = read_sources(root)
    cache = root / ".cache" / "docs-search" / "index.sqlite3"
    connection = None
    try:
        cache.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(cache, timeout=2)
        return query_index(connection, sources, terms, limit, include_history)
    except (OSError, sqlite3.Error):
        # Never serve a stale cache when refreshing fails.
        with sqlite3.connect(":memory:") as fresh:
            result = query_index(fresh, sources, terms, limit, include_history)
        return Results(result.hits, result.total, result.include_history, result.terms,
                       "Cache unavailable; searched a fresh in-memory index.")
    finally:
        if connection is not None:
            connection.close()


def excerpt(section, budget, terms):
    full = section.text + ("" if section.text.endswith("\n") else "\n")
    omitted = "Body omitted; open the source range above.\n"
    lines = section.text.splitlines(keepends=True)
    # Use the same tokenizer and stemmer as the document index. Literal substring
    # checks can miss FTS matches such as "actors" matching a line containing "actor".
    with sqlite3.connect(":memory:") as connection:
        connection.execute("CREATE VIRTUAL TABLE line_sections USING fts5(text, tokenize='porter unicode61')")
        connection.executemany("INSERT INTO line_sections(text) VALUES(?)",
                               [(searchable(line),) for line in lines])
        term_queries = " UNION ALL ".join(
            "SELECT rowid AS id FROM line_sections WHERE line_sections MATCH ?" for _ in terms
        )
        row = connection.execute(f"""WITH term_matches AS ({term_queries}),
            coverage AS (SELECT id, count(*) AS matched FROM term_matches GROUP BY id)
            SELECT id FROM coverage ORDER BY matched DESC, id LIMIT 1""",
            tuple('"' + word + '"' for word in terms)).fetchone()
    # A section may match only through its document title or inherited breadcrumb,
    # neither of which is necessarily present in this non-overlapping source range.
    if row is None:
        return omitted
    if len(full) <= budget:
        return full
    center = row[0] - 1
    # Reserve the complete omission notice before selecting whole source lines.
    allowance = budget - 120
    if allowance <= 0 or len(lines[center]) > allowance:
        return omitted
    start, end = center, center + 1
    used = len(lines[center])
    # Include immediate preceding context, then grow a contiguous source window.
    for _ in range(3):
        if start and used + len(lines[start - 1]) <= allowance:
            start -= 1
            used += len(lines[start])
    while end < len(lines) and used + len(lines[end]) <= allowance:
        used += len(lines[end])
        end += 1
    while start and used + len(lines[start - 1]) <= allowance:
        start -= 1
        used += len(lines[start])
    notice = (f"Excerpt lines {section.start + start}-{section.start + end - 1}; "
              "other section lines omitted. Open the full source for context.\n")
    return notice + "".join(lines[start:end]).rstrip("\r\n") + "\n"


def render(results, max_chars=DEFAULT_MAX_CHARS):
    if max_chars < 512:
        raise ValueError("--max-chars must be at least 512.")
    if not results.total:
        return "No matching documentation sections. Try different keywords or --include-history.\n"
    headers = [f"\n[{index}] {s.kind.upper()} | {s.path}:{s.start}-{s.end}\n{s.breadcrumb}\n"
               + (f"Status: {s.status}\n" if s.status else "")
               for index, s in enumerate(results.hits, 1)]
    intro = (f"Documentation search: {results.total} matching sections. "
             f"History {'included' if results.include_history else 'excluded'}.\n")
    omitted = "Body omitted; open the source range above.\n"
    count = len(headers)
    while count:
        footer = f"\nAdditional matches not shown: {results.total - count}. Increase --limit/--max-chars or refine the query.\n"
        base = len(intro) + sum(len(h) + len(omitted) for h in headers[:count]) + len(footer)
        if base <= max_chars:
            break
        count -= 1
    if not count:
        return "Matches found, but their source metadata exceeds the output budget. Increase --max-chars.\n"
    free = max_chars - base
    output = intro
    for index in range(count):
        allowance = len(omitted) + free // (count - index)
        body = excerpt(results.hits[index], allowance, results.terms)
        free += len(omitted) - len(body)
        output += headers[index] + body
    return output + footer


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, epilog=(
        'Example: python3 Tools/docs_search.py "navigation deep links". '
        'Search results supplement, rather than replace, required contract reads.'
    ))
    parser.add_argument("query", help="Quoted keywords or a short question")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="Maximum ranked results (default: 5)")
    parser.add_argument("--max-chars", type=int, default=DEFAULT_MAX_CHARS,
                        help="Maximum stdout characters, including metadata (default: 12000; minimum: 512)")
    parser.add_argument("--include-history", action="store_true", help="Also search dated History entries")
    args = parser.parse_args(argv)
    try:
        if args.max_chars < 512:
            raise ValueError("--max-chars must be at least 512.")
        results = search(ROOT, args.query, args.limit, args.include_history)
        output = render(results, args.max_chars)
    except (ValueError, OSError, UnicodeError, sqlite3.Error) as error:
        parser.exit(2, f"docs-search: {error}\n")
    if results.warning:
        print(f"docs-search: {results.warning}", file=sys.stderr)
    print(output, end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
