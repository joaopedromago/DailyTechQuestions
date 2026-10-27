#!/usr/bin/env python3
"""Validate the interview question JSON and suggest possible duplicate prompts."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[4]
DB_PATH = ROOT / "src" / "data" / "db.json"
KEY_ORDER = ("question", "shortAnswer", "longAnswer", "category", "referenceUrls")
CATEGORY_ORDER = (
    "Javascript",
    "Typescript",
    "React",
    "Node",
    "AI",
    "ComputerScience",
)
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "between", "can", "could", "does",
    "do", "for", "from", "how", "in", "is", "it", "make", "of", "on", "or", "should",
    "the", "their", "this", "to", "use", "used", "using", "what", "when", "where",
    "which", "why", "with", "would", "you",
}
HTML_TAG_NAMES = (
    "a abbr address area article aside audio b base bdi bdo blockquote body br button canvas caption"
    " cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset"
    " figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins"
    " kbd label legend li link main map mark menu meta meter nav noscript object ol optgroup option"
    " output p param picture pre progress q rp rt ruby s samp script section select small source"
    " span strong style sub summary sup svg table tbody td template textarea tfoot th thead time"
    " title tr track u ul var video wbr circle ellipse g line path polygon polyline rect text"
).split()
HTML_TAG = re.compile(
    r"</?\s*(?:" + "|".join(HTML_TAG_NAMES) + r")(?=[\s/>])",
    re.IGNORECASE,
)
TECHNICAL_DUNDER_NAMES = (
    "__proto__", "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__",
    "__init__", "__new__", "__call__", "__str__", "__repr__", "__len__", "__iter__",
    "__next__", "__getitem__", "__setitem__", "__contains__", "__eq__", "__hash__",
    "__enter__", "__exit__", "__post_init__", "__name__", "__main__", "__doc__", "__slots__",
    "__dict__", "__all__", "__file__", "__module__", "__class__", "__annotations__", "__mro__",
    "__bases__", "__subclasshook__", "__init_subclass__",
)
TECHNICAL_DUNDER = re.compile(
    r"(?<![A-Za-z0-9_])(?:" + "|".join(map(re.escape, TECHNICAL_DUNDER_NAMES)) + r")(?![A-Za-z0-9_])"
)
GENERIC_CONSTRUCTORS = {
    "Array", "Awaited", "Exclude", "Extract", "Map", "NonNullable", "Omit", "Parameters",
    "Partial", "Pick", "Promise", "Readonly", "Record", "Required", "ReturnType", "Set",
    "WeakMap", "WeakSet",
}
GENERIC_PREFIX = re.compile(r"([A-Za-z_$][A-Za-z0-9_$]*)$")
MARKDOWN = re.compile(
    r"`|~~|\*\*[^*\s](?:[^*]*[^*\s])?\*\*|"
    r"(?<!\w)__(?:[^_\s](?:[^_\n]*[^_\s])?)__(?!\w)|"
    r"(?<!\w)\*(?:[^*\s](?:[^*\n]*[^*\s])?)\*(?!\w)|"
    r"(?<!\w)_(?:[^_\s](?:[^_\n]*[^_\s])?)_(?!\w)|\[[^\]]+\]\([^)]+\)|"
    r"(?:^\s{0,3})(?:#{1,6}\s|>\s|[-*+]\s|\d+[.)]\s)",
    re.MULTILINE,
)


def normalize_question(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.casefold()))


def mask_known_generic_types(value: str) -> str:
    chars = list(value)
    index = 0
    while index < len(value):
        if value[index] != "<" or index == 0:
            index += 1
            continue
        prefix = GENERIC_PREFIX.search(value[:index])
        if prefix is None:
            index += 1
            continue
        before_prefix = value[:prefix.start()]
        is_function_generic = re.search(r"\bfunction\s+$", before_prefix) is not None
        if prefix.group(1) not in GENERIC_CONSTRUCTORS and not is_function_generic:
            index += 1
            continue
        depth = 1
        end = index + 1
        while end < len(value) and depth:
            if value[end] == "<":
                depth += 1
            elif value[end] == ">":
                depth -= 1
            end += 1
        if depth == 0:
            chars[index:end] = " " * (end - index)
            index = end
        else:
            index += 1
    return "".join(chars)


def contains_html(value: str) -> bool:
    return bool(HTML_TAG.search(mask_known_generic_types(value)))


def validate(records: object) -> list[str]:
    errors: list[str] = []
    if not isinstance(records, list) or not records:
        return ["The JSON root must be a non-empty array."]

    seen: dict[str, int] = {}
    observed_categories: set[str] = set()
    for index, record in enumerate(records):
        label = f"record {index + 1}"
        if not isinstance(record, dict):
            errors.append(f"{label} must be an object.")
            continue
        if tuple(record.keys()) != KEY_ORDER:
            errors.append(f"{label} keys must be exactly {', '.join(KEY_ORDER)} in that order.")

        for key in KEY_ORDER[:3]:
            value = record.get(key)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"{label}.{key} must be a non-empty string.")
                continue
            if value != value.strip() or "\n" in value or "\r" in value:
                errors.append(f"{label}.{key} must be trimmed and fit on one line.")
            text_to_check = TECHNICAL_DUNDER.sub("TECHNICAL_IDENTIFIER", value)
            if contains_html(text_to_check) or MARKDOWN.search(text_to_check):
                errors.append(f"{label}.{key} must use plain text without HTML or Markdown formatting.")
        question = record.get("question")
        short_answer = record.get("shortAnswer")
        long_answer = record.get("longAnswer")
        if isinstance(question, str) and question and question[-1] not in ".?!":
            errors.append(f"{label}.question must end with question or prompt punctuation.")
        if isinstance(short_answer, str) and isinstance(long_answer, str):
            if len(long_answer) <= len(short_answer):
                errors.append(f"{label}.longAnswer must meaningfully extend shortAnswer.")

        category = record.get("category")
        if category not in CATEGORY_ORDER:
            errors.append(f"{label}.category must be one of: {', '.join(CATEGORY_ORDER)}.")
        else:
            observed_categories.add(category)

        references = record.get("referenceUrls")
        if not isinstance(references, list):
            errors.append(f"{label}.referenceUrls must be an array.")
        else:
            seen_urls: set[str] = set()
            for url in references:
                if not isinstance(url, str) or not url.strip():
                    errors.append(f"{label}.referenceUrls entries must be non-empty strings.")
                    continue
                parsed = urlparse(url)
                if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                    errors.append(f"{label} has an invalid reference URL: {url}")
                if url in seen_urls:
                    errors.append(f"{label} repeats reference URL: {url}")
                seen_urls.add(url)

        if isinstance(question, str) and question.strip():
            normalized = normalize_question(question)
            if normalized in seen:
                errors.append(f"{label}.question duplicates record {seen[normalized]} after normalization: {question}")
            else:
                seen[normalized] = index + 1

    missing = [category for category in CATEGORY_ORDER if category not in observed_categories]
    if missing:
        errors.append(f"Every subject must remain represented; missing categories: {', '.join(missing)}.")

    return errors


def similarity(candidate: str, existing: str) -> float:
    candidate_words = set(normalize_question(candidate).split()) - STOP_WORDS
    existing_words = set(normalize_question(existing).split()) - STOP_WORDS
    union = candidate_words | existing_words
    overlap = len(candidate_words & existing_words) / len(union) if union else 0.0
    sequence = SequenceMatcher(None, normalize_question(candidate), normalize_question(existing)).ratio()
    return max(overlap, sequence * 0.85)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--candidate",
        action="append",
        default=[],
        help="Question to compare with the existing dataset; may be supplied more than once.",
    )
    args = parser.parse_args()

    try:
        records = json.loads(DB_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Could not read valid JSON from {DB_PATH}: {exc}", file=sys.stderr)
        return 1

    errors = validate(records)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    counts = Counter(record["category"] for record in records)
    summary = ", ".join(f"{category} {counts[category]}" for category in CATEGORY_ORDER)
    print(f"Validation passed: {len(records)} records; {summary}.")

    if isinstance(records, list):
        for candidate_index, candidate in enumerate(args.candidate):
            normalized = normalize_question(candidate)
            for previous_index, previous in enumerate(args.candidate[:candidate_index], start=1):
                previous_normalized = normalize_question(previous)
                if normalized == previous_normalized:
                    print(f"Exact normalized duplicate between proposed candidates {previous_index} and {candidate_index + 1}: {candidate}")
                    errors.append(f"Proposed candidates {previous_index} and {candidate_index + 1} duplicate each other.")
                else:
                    score = similarity(candidate, previous)
                    if score >= 0.35:
                        print(
                            f"Possible overlap between proposed candidates {previous_index} and "
                            f"{candidate_index + 1} ({score:.2f}): {previous}"
                        )
                        print("Review these candidates for semantic overlap; lexical similarity is not a duplicate decision.")
            exact = [
                record
                for record in records
                if isinstance(record, dict)
                and normalize_question(record.get("question", "")) == normalized
            ]
            if exact:
                print(f"Exact normalized duplicate: {exact[0].get('question', '')}")
                errors.append(f"Candidate is already present: {candidate}")
                continue
            matches = [
                (similarity(candidate, record["question"]), record)
                for record in records
                if isinstance(record, dict) and isinstance(record.get("question"), str)
            ]
            matches.sort(key=lambda item: item[0], reverse=True)
            print(f"Possible overlaps for: {candidate}")
            for score, record in matches[:5]:
                print(f"  {score:.2f} [{record['category']}] {record['question']}")
            print("Review these suggestions for semantic overlap; lexical similarity is not a duplicate decision.")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
