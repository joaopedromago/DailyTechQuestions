# Project Documentation

Use this folder for concise, source-backed contracts about the application. Keep product and
business behavior out of documentation until it has been established from the product requirements
and implementation.

## AI Agent UI Verification

Whenever an AI agent changes user-facing UI, invoke the project-local `$ui-visual-verification`
skill. It runs the app over HTTP on `localhost`, inspects the updated page, and requires screenshots
at a phone-sized viewport in both dark and light mode when the app supports them. Include those
screenshots in the handoff.
This browser check supplements the required code checks; it does not replace native-platform
validation when a change depends on native behavior.

## Documentation Types

- **Systems** describes current runtime behavior, architecture, and code ownership. State what the
  app does now and point to the files that own it.
- **Design** describes a feature contract. Start each feature document with `Status:` set to
  `Not implemented`, `Partially implemented`, or `Implemented`. Keep implemented contracts in this
  folder and rewrite them to the current contract as behavior changes.
- **TODOs** contains concrete unimplemented work and unresolved contract decisions. Remove an item
  when it ships; do not duplicate backlog items in feature documents.
- **History** records behavior changes in daily `YYYY-MM-DD.md` files, one file per day, with a short
  heading for each entry. History is not a substitute for current Systems or Design contracts.

Avoid implementation memoirs, speculative behavior, duplicate rules, and full source-code copies.
Link to the owning source when a file or symbol makes a rule verifiable. When behavior changes,
update the relevant current contract and add a concise History entry in the same change.

## Documentation Search

`Tools/docs_search.py` searches Markdown under `Docs/` using the local section index. Read
[Documentation Search](Systems/DocumentationSearch.md) for the retrieval algorithm and command
options. Search results help locate relevant sections; read the full matching source before changing
a documented rule.

## Index

### Systems

- [Current Application](Systems/CurrentApp.md) — Current app shell, UI ownership, and question
  catalog shape.
- [Documentation Search](Systems/DocumentationSearch.md) — Python-based retrieval over project
  documentation.

### Design

- [Study Experience](Design/StudyExperience.md) — Implemented home menu, quiz, question browsing,
  and session-resume behavior.
- [UI Architecture](Design/UIArchitecture.md) — gluestack-ui, NativeWind `className`, shared
  controls, icon, and state conventions.

### Project records

- [TODOs](TODOs.md) — Concrete unimplemented work and unresolved contract decisions.
- [History](History/) — Daily behavior-change records, ordered by ISO date.
