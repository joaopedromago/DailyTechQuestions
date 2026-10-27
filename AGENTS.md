@/Users/joaopedroferreiramaciel/.codex/RTK.md

# Project Instructions

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance,
and cross-platform compatibility.

## Implementation and Code Review Skills

For requests that change project files, use the project-local `$implementation` skill. It coordinates
a fresh-context, read-only `$code-review` before handoff and repeats the review after accepted fixes
until no actionable findings remain. Keep read-only advice, planning-only, and review-only requests
out of the implementation workflow. The code-review skill is also used when the user asks for a
review.

## Documentation

For work that may be governed by project documentation, search from the project root first:

```sh
rtk proxy python3 Tools/docs_search.py "<specific feature terms>" --limit 3 --max-chars 2000
```

Read matching source documents in full before changing their rules. Read `Docs/README.md` before
editing documentation, adding a documentation file, or when search results do not establish scope.
If the search helper fails, use `rg` and inspect the matching sources directly.

Keep documentation synchronized with behavior changes. `Docs/Systems/` describes current runtime
behavior and code ownership. `Docs/Design/` describes feature contracts and declares a `Status:` at
the top using `Not implemented`, `Partially implemented`, or `Implemented`. Implemented design
documents remain in `Design/`. Keep unimplemented work in `Docs/TODOs.md`; remove shipped work from
that file in the same change. Record each behavior change in `Docs/History/YYYY-MM-DD.md`, one file
per day, with a short heading for each entry. Rewrite feature documents to describe current behavior;
keep the history of changes in History. Add and index a Systems or Design document when a new system
or feature contract needs a durable home. Do not invent app behavior while establishing AI tooling.

## Expo and React Native APIs

Expo ships breaking changes each SDK release. Before writing code that touches Expo, EAS, or React
Native APIs:

1. Read the major version of `expo` in `package.json`.
2. Fetch the matching versioned docs at `https://docs.expo.dev/versions/v<major>.0.0/`.
3. For other Expo questions, fetch `https://docs.expo.dev/llms.txt` and follow its links to the
   relevant page.

## Commands

This project uses npm (`package-lock.json`). Use `npx` for Expo CLI commands and use
`npx expo install <package>` to select SDK-compatible package versions. Run lint and typecheck before
declaring an implementation task done:

```bash
npx expo lint
npx tsc --noEmit
```

Other common commands:

```bash
npx expo start
npx expo-doctor
npx expo install --fix
```

## Navigation and Routing

- Use Expo Router for navigation. Routes live in `src/app/`; `_layout.tsx` files define navigators.
- Keep non-route code such as components, hooks, and utilities outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Reference: <https://docs.expo.dev/router/introduction.md>

## Building with EAS

Use EAS to build, sign, and submit in the cloud (`npx eas-cli@latest build` and
`npx eas-cli@latest submit`) and to publish over-the-air updates (`npx eas-cli@latest update`).
Reference: <https://docs.expo.dev/eas/index.md>

## Native Projects

- If `ios/` and `android/` do not exist, they are generated through Continuous Native Generation.
  Do not create or edit them by hand; configure native behavior in `app.json` and config plugins.
- Expo Go includes only its bundled native modules. After adding a library with native code, use a
  development build (`npx expo run:ios`, `npx expo run:android`, or an EAS development build).
- Prefer recommended Expo modules over third-party libraries and check applicable project skills
  before adding dependencies. Reference: <https://docs.expo.dev/versions/latest/index.md>
