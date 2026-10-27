# Current Application

This document describes the current app shell and data ownership. Study behavior is specified in
[Study Experience](../Design/StudyExperience.md).

## App shell and routes

The project uses Expo SDK 58, React Native, TypeScript, and Expo Router. The root layout in
[`src/app/_layout.tsx`](../../src/app/_layout.tsx) imports the global stylesheet and wraps the route
stack with the Expo Router theme provider, gluestack provider, and safe-area provider. It retains the
configured animated splash overlay.

[`src/app/index.tsx`](../../src/app/index.tsx) displays the study menu: Start Random Quiz, View
Questions, and Continue. Continue becomes enabled after session hydration when an unfinished quiz
exists. The menu also toggles between light and dark appearance and uses a Material Icon to identify
the target mode. Native platforms use the React Native appearance setting; web records the current
selection on the document root so it remains consistent when navigating between routes.

`/questions` lists catalog questions with category filters and normalized search, owned by
[`question-browsing-screen.tsx`](../../src/features/questions/question-browsing-screen.tsx) and
[`question-utils.ts`](../../src/features/questions/question-utils.ts). Selecting a result pushes
`/questions/[questionIndex]`, which uses
[`question-detail-view.tsx`](../../src/features/questions/question-detail-view.tsx) and preserves
list state underneath. `/quiz/setup` selects categories and creates a shuffled question snapshot;
`/quiz/play` uses that snapshot for navigation, progressive answer disclosure, and completion.
[`quiz-session.tsx`](../../src/features/quiz/quiz-session.tsx) owns app-wide state, while
[`session-storage.ts`](../../src/features/quiz/session-storage.ts) persists the current snapshot in
AsyncStorage. Returning to the menu preserves it, a new quiz replaces it, and completion clears it.

Gluestack-generated components and provider configuration live in `src/components/ui/`. Shared
application controls live in `src/components/shared/`; the button, input, and checkbox controls are
used by the study screens. Screens use component primitives with NativeWind `className` utility
classes, without styled components. The root Gluestack provider supplies the selected semantic
palette as NativeWind variables on native platforms; route roots also set native flex sizing so
pushed screens fill the stack. Input placeholder text uses the muted foreground palette. Material
Icons come from `@react-native-vector-icons/material-icons`. NativeWind v5 is configured through
`metro.config.js`, `postcss.config.mjs`, and `src/global.css`; semantic tokens map the system light
and dark palettes. The package is a NativeWind v5 release candidate and is being used with Expo
SDK 58 / React Native 0.88, beyond the SDK 57 / React Native 0.86.3 target listed in its installation
guide. JavaScript bundles export for Android, iOS, and web; the shell has been smoke-tested on web
and an iOS simulator in light and dark appearance. The Android native debug build compiles, but its
runtime screen check remains pending because no Android emulator or device is configured.

## Question catalog

[`src/data/db.json`](../../src/data/db.json) is a static JSON array of question records. Each record
has these fields:

- `question`: the prompt shown to the learner.
- `shortAnswer`: the quick answer.
- `longAnswer`: the full answer.
- `category`: the source category value.
- `referenceUrls`: external reference links.

The current category values are `Node`, `Typescript`, `Javascript`, `React`, `ComputerScience`, and
`AI`. [`src/data/questions.ts`](../../src/data/questions.ts) types the records and supplies display
labels such as “Computer Science” and “AI Tools” without changing catalog values.

## Current feature boundary

The catalog is local and read-only. Browse filters and answer-disclosure state are screen-local;
unfinished quiz state persists locally, with answer disclosure resetting on each question change or
resume. A malformed saved snapshot is removed and Continue is unavailable.
