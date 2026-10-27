---
name: implementation
description: Implement requested changes to this Expo and React Native project using its documentation and project conventions, then close with a fresh-context code review.
---

# Implementation

Use this for requested changes to project files. Do not use it for conceptual questions,
planning-only requests, or review-only tasks.

## Establish scope

- Read `AGENTS.md` and inspect the working tree before editing. Preserve unrelated pre-existing
  changes. If Git metadata is unavailable, inspect the relevant files directly and limit changes to
  the request.
- When documentation may govern the task, search from the project root with:

  ```sh
  rtk proxy python3 Tools/docs_search.py "<specific feature terms>" --limit 3 --max-chars 2000
  ```

  Read matching sources in full. Read `Docs/README.md` before editing documentation or when search
  does not establish scope.
- For changes to Expo, EAS, or React Native APIs, follow the current-doc lookup instructions in
  `AGENTS.md`; do not rely on remembered API details.

## Implement within project conventions

- Follow `AGENTS.md` and the relevant Systems and Design contracts. Preserve unrelated files and
  avoid expanding scope to resolve pre-existing issues.
- Keep current behavior documentation synchronized with behavior changes and record each behavior
  change in the daily `Docs/History/YYYY-MM-DD.md` file. Update the Docs index when adding a
  documentation file.
- When changing source, use the narrowest relevant validation. Run `npx expo lint` and
  `npx tsc --noEmit` before declaring an implementation task done, as required by `AGENTS.md`.
  Report exactly what ran and what it establishes.

## Review and hand off

- After implementation, invoke `$code-review` with the concise task scope and change summary. The
  review must inspect the task changes while excluding unrelated pre-existing work.
- Independently check each finding. Fix confirmed actionable findings within scope; retain concise
  evidence for findings that do not apply.
- After any review-driven change, invoke `$code-review` again. Continue until the latest review has
  no actionable findings. If review is unavailable, task changes cannot be inspected, or a finding
  cannot be resolved safely, report the work as incomplete.
- Hand off with a concise summary of changes, review outcome, validation actually run, and material
  limitations.
