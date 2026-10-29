# Current Application

This document describes the current app shell and data ownership. Study behavior is specified in
[Study Experience](../Design/StudyExperience.md).

## App shell and routes

The project uses Expo SDK 58, React Native, TypeScript, and Expo Router. The root layout in
[`src/app/_layout.tsx`](../../src/app/_layout.tsx) imports the global stylesheet and wraps the route
stack with the Expo Router theme provider, gluestack provider, safe-area provider, quiz-session
provider, and question-check provider. It retains the configured animated splash overlay.

[`src/app/index.tsx`](../../src/app/index.tsx) displays the study menu: Start Random Quiz, View
Questions, Continue, and History. Continue becomes enabled after history hydration when a quiz
record exists and opens the newest-created record. The menu also toggles between light and dark
appearance and uses a Material Icon to identify the target mode. Native platforms use the React
Native appearance setting; web records the current selection on the document root so it remains
consistent when navigating between routes.

`/questions` lists catalog questions with category filters and normalized search, owned by
[`question-browsing-screen.tsx`](../../src/features/questions/question-browsing-screen.tsx) and
[`question-utils.ts`](../../src/features/questions/question-utils.ts). Selecting a result pushes
`/questions/[questionIndex]`, which uses
[`question-detail-view.tsx`](../../src/features/questions/question-detail-view.tsx) and preserves
list state underneath. `/quiz/setup` selects categories, a question check-status filter, and a
question count, then creates a shuffled sample. `/quiz/history` lists saved records and category
badges. `/quiz/play` loads the newest-created record for Continue or a selected record by ID for
History. Its question counter shares a row with a persisted checked/unchecked toggle.
[`quiz-session.tsx`](../../src/features/quiz/quiz-session.tsx) owns app-wide history state, while
[`session-storage.ts`](../../src/features/quiz/session-storage.ts) persists all records in AsyncStorage.
New quizzes append records, navigation updates each record's position, and completion marks rather
than clears the record. [`question-checks.tsx`](../../src/features/questions/question-checks.tsx)
owns the checked-question set, and
[`question-check-storage.ts`](../../src/features/questions/question-check-storage.ts) persists it
separately in AsyncStorage.

Gluestack-generated components and provider configuration live in `src/components/ui/`. Shared
application controls live in `src/components/shared/`; the button, input, checkbox, and dropdown
controls are used by the study screens. Screens use component primitives with NativeWind `className` utility
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

- `question`: the prompt shown to the learner, or the raw JavaScript snippet for `JavascriptCode`.
- `shortAnswer`: the quick answer.
- `longAnswer`: the full answer.
- `category`: the source category value.
- `referenceUrls`: external reference links.

The current category values are `Node`, `Typescript`, `Javascript`, `React`, `ComputerScience`,
`AI`, `SystemDesign`, `Backend`, and `JavascriptCode`. [`src/data/questions.ts`](../../src/data/questions.ts)
types the records and supplies display labels such as “Computer Science”, “AI Tools”, “System
Design”, and “JavaScript Code” without changing catalog values.

For `JavascriptCode`, `question` stores a raw JavaScript snippet, including line breaks. The shared
question detail view displays “What this code do?” above the snippet in a monospace block. These
records have no reference URLs; their answers describe the Node.js output and why it occurs.
The shared question detail view also has a copy icon beside the prompt. It copies the stored
`question` value verbatim in browse and quiz modes, including the raw snippet for `JavascriptCode`.
The icon follows the selected page theme and switches to an error icon if clipboard writing fails.

## Current feature boundary

The catalog is local and read-only. Browse filters and answer-disclosure state are screen-local. Quiz
history and checked-question status persist separately on the device; check keys combine the question
category and prompt. Quiz setup can include all questions, only checked questions, or only unchecked
questions after applying category selection. Answer disclosure resets on each question change or
resume. A valid legacy quiz snapshot migrates into history. Malformed stored records are discarded,
and Continue is unavailable when history is empty.
