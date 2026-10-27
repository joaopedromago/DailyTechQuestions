---
name: code-review
description: Independently review requested changes to this Expo and React Native project in a fresh-context, read-only pass.
---

# Code Review

Use this for the review step of `$implementation` or when the user asks for a review. Keep the
review independent and read-only: do not edit files, run tests, commit, or delegate further.

## Start a fresh reviewer

For each review pass, use `collaboration.spawn_agent` with `fork_turns="none"`. Do not do the
substantive review in the implementation context. If fresh-agent review is unavailable, report the
review as incomplete.

Send the reviewer the project root, task scope, concise change summary, and this brief:

> You are a fresh-context, read-only reviewer. Do not edit files, run tests, commit, or delegate.
> The project root is `<absolute project root>`. The requested change scope is `<scope and concise
> change summary>`.
>
> Read `AGENTS.md` first and follow its instructions. If this is a Git checkout, inspect status,
> staged and unstaged changes, and relevant untracked files. If Git metadata is unavailable, inspect
> the task files directly. Review only changes in the stated scope and preserve unrelated work.
> Inspect the current files and relevant callers or project documentation. Use the documentation
> search procedure when documented behavior is relevant.
>
> Report only actionable defects introduced by the task changes: violations of the request or
> documented contract, regressions, unsafe or inconsistent state changes, or important missing error
> handling. Ignore unrelated pre-existing issues and preference-only feedback. Do not guess; explain
> uncertainty or omit unsupported concerns. For each finding, give severity (`P0`–`P3`), precise file
> and line, a concrete triggering scenario, impact, and evidence. If there are no actionable
> findings, say so explicitly. State what you inspected and that tests were not run.

The implementation owner checks each finding against current source and applicable project docs.
The reviewer does not implement fixes. A review is clean only when it explicitly reports no
actionable findings and has inspected the relevant task changes. If relevant changes or required
context could not be inspected, report the review as incomplete rather than clean.
