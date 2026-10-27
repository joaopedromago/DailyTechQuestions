# Current Application

This document describes the current app shell and data ownership. Planned study behavior is
documented in [Study Experience](../Design/StudyExperience.md).

## App shell and routes

The project uses Expo SDK 58, React Native, TypeScript, and Expo Router. The root layout in
[`src/app/_layout.tsx`](../../src/app/_layout.tsx) imports the global stylesheet and wraps the route
stack with the Expo Router theme provider, gluestack provider, and safe-area provider. It retains the
configured animated splash overlay.

[`src/app/index.tsx`](../../src/app/index.tsx) displays the study menu: Start Random Quiz, View
Questions, and Continue. Continue is disabled while quiz-session persistence is not implemented.
The menu also toggles between light and dark appearance and uses a Material Icon to identify the
target mode. Native platforms use the React Native appearance setting; web records the current
selection on the document root so it remains consistent when navigating between routes.
The `/questions` and `/quiz/setup` routes compose temporary coming-soon screens from
`src/features/questions/` and `src/features/quiz/`; their real study flows remain unimplemented.

Gluestack-generated components and provider configuration live in `src/components/ui/`. Shared
application UI lives in `src/components/`; reusable button, input, and checkbox folders are
scaffolded under `src/components/shared/` for future variant-based controls, with no shared control
components created yet. Screens use component primitives with NativeWind `className` utility
classes, without styled components. Material Icons come from
`@react-native-vector-icons/material-icons`. NativeWind v5 is configured through `metro.config.js`,
`postcss.config.mjs`, and `src/global.css`; semantic tokens map the system light and dark palettes.
The package is a NativeWind v5 release candidate and is being used with Expo SDK 58 / React Native
0.88, beyond the SDK 57 / React Native 0.86.3 target listed in its installation guide. JavaScript
bundles export for Android, iOS, and web; the shell has been smoke-tested on web and an iOS
simulator in light and dark appearance. The Android native debug build compiles, but its runtime
screen check remains pending because no Android emulator or device is configured.

## Question catalog

[`src/data/db.json`](../../src/data/db.json) is a static JSON array of question records. Each record
has these fields:

- `question`: the prompt shown to the learner.
- `shortAnswer`: the quick answer.
- `longAnswer`: the full answer.
- `category`: the source category value.
- `referenceUrls`: external reference links.

The current category values are `Node`, `Typescript`, `Javascript`, `React`, `ComputerScience`, and
`AI`. Display labels such as “Computer Science” and “AI Tools” do not change the catalog values.

## Current feature boundary

Question browsing and quiz setup currently show placeholders. There is no quiz-session provider,
session persistence, question filtering, answer disclosure, or quiz navigation yet.
