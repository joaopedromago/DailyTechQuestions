# Current Application

This document describes the checked-in application scaffold and data ownership. The planned study
experience is documented separately in [Study Experience](../Design/StudyExperience.md) and is not
current runtime behavior.

## App shell and routes

The project uses Expo SDK 58, React Native, TypeScript, and Expo Router, with the application entry
configured in [package.json](../../package.json). Route files live under `src/app/`.

[`src/app/_layout.tsx`](../../src/app/_layout.tsx) wraps the route tree in Expo Router's theme
provider, renders the animated splash overlay, and mounts the app tabs. The tabs are defined in
[`src/components/app-tabs.tsx`](../../src/components/app-tabs.tsx) with Expo Router's native tab
navigator. The web-specific implementation in
[`src/components/app-tabs.web.tsx`](../../src/components/app-tabs.web.tsx) uses Expo Router's
`Tabs`, `TabList`, and `TabTrigger` components. Both implementations link to the `index` and
`explore` routes.

[`src/app/index.tsx`](../../src/app/index.tsx) is the Expo welcome and developer-hints starter
screen. [`src/app/explore.tsx`](../../src/app/explore.tsx) contains starter examples for links,
collapsible content, images, platform layout, and color themes. Shared starter UI is in
`src/components/`; theme values and hooks are in `src/constants/` and `src/hooks/`.

The project includes a web start script and `react-native-web`, with platform-specific tab
implementations. These source files describe the starter shell but do not establish that its runtime
behavior has been validated.

## Question catalog

[`src/data/db.json`](../../src/data/db.json) is a static JSON array of question records. Each record
has these fields:

- `question`: the prompt shown to the learner.
- `shortAnswer`: the quick answer.
- `longAnswer`: the full answer.
- `category`: the source category value.
- `referenceUrls`: external reference links.

The current category values are `Node`, `Typescript`, `Javascript`, `React`, `ComputerScience`, and
`AI`. Display labels such as “Computer Science” and “AI Tools” are planned presentation choices;
they do not change the catalog values.

## Current feature boundary

The checked-in routes are still the Expo starter screens. There is no quiz or question-browsing flow,
and the project does not currently include a persisted quiz-session store or gluestack-ui setup.
