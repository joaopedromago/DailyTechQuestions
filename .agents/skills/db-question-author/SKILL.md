---
name: db-question-author
description: "Use whenever adding, editing, or removing question records in src/data/db.json. Enforces the data schema, answer conventions, categories, references, and duplicate checks."
---

# Maintain the interview question dataset

Use this skill for every requested change to question records in `src/data/db.json`. The file is a
JSON array; preserve its existing order and do not add unrelated application code.

## Before adding a question

- Read the current file and the source material for the proposed question. Keep answers grounded in
  that material; do not invent claims or references.
- Check existing questions for the same underlying question, including alternate wording and
  overlap across categories. Run the candidate check below, then inspect the suggested matches for
  semantic duplicates. The script catches exact normalized duplicates and only suggests possible
  semantic overlaps; use judgment to distinguish related but different questions.
- If a duplicate already exists, do not append another item. Update the existing item only when the
  request is to improve or correct it; otherwise report that it is already covered.

## Record conventions

- Keep exactly these keys in this order: `question`, `shortAnswer`, `longAnswer`, `category`,
  `referenceUrls`.
- Use only `Javascript`, `Typescript`, `React`, `Node`, `AI`, or `ComputerScience` for `category`.
  For mixed topics, choose the primary subject of the question.
- Keep at least one question in every category. If a requested removal would empty a category, flag
  the conflict with the all-subject requirement before removing it.
- Write `question` as one clear prompt. Keep `shortAnswer` concise and direct, and make `longAnswer`
  a plain-text paragraph that adds explanation, an example, or a relevant trade-off. Keep both
  answers source-grounded and make `longAnswer` meaningfully longer than `shortAnswer`.
- Keep text values on one line without Markdown or HTML formatting. Technical syntax such as
  `Partial<T>` and identifiers such as `__proto__` are plain text and may keep their punctuation.
  If a valid generic type constructor or technical dunder identifier is rejected, extend its
  validator allowlist and add a validation case before using it.
- Put unique source URLs in `referenceUrls` as an array of HTTP(S) URL strings. Use `[]` when the
  source provides no suitable reference; do not put labels or citations in place of URLs.
- Preserve existing record order and place a new question near related prompts. JavaScript and
  TypeScript questions share a source page and may be interleaved. Do not add IDs, extra fields,
  comments, or a wrapper object.

## Validate

Before handoff, run the validator from the project root:

```sh
rtk proxy python3 .agents/skills/db-question-author/scripts/validate_db.py
```

Before adding each proposed item, use the candidate mode to find exact or lexically similar prompts:

```sh
rtk proxy python3 .agents/skills/db-question-author/scripts/validate_db.py --candidate "Question text?"
```

For a batch, pass every proposed item with a repeated `--candidate` option in one run so the script
also compares the candidates with each other. Review all printed matches for semantic overlap. Fix
every validation error and rerun the validator. Report how many questions were added or skipped as
duplicates.
