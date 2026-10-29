# UI Architecture

Status: Implemented

This contract defines the intended UI and code organization for the study app. Current runtime
behavior is described in [Current Application](../Systems/CurrentApp.md).

## UI system

Use gluestack-ui v5 with NativeWind v5 for application-visible UI and a shared theme. The
[gluestack installation guide](https://gluestack.io/ui/docs/home/getting-started/installation)
documents the current initialization options. Map the app's light and dark appearance to the
gluestack theme tokens.

Use the native appearance API to change the palette on iOS and Android. On web, preserve an explicit
selection on the document root so the semantic theme tokens override the system media preference;
before a user selects a mode, follow the system preference.

Build screens from components and style them with NativeWind `className` utility classes. Do not
use `styled-components` or NativeWind's `styled()` API for application UI. Keep reusable variants
in the shared controls rather than introducing per-screen styled wrappers. Use Material Icons from
React Native Vector Icons for recognizable actions; icon-only controls need an accessible label,
and icons next to text should not repeat that text to assistive technology.

Use gluestack components for visible layout, text, controls, and disclosure UI rather than styling
raw React Native `View` and `Text` throughout feature screens. Use platform APIs for routing, safe
areas, gestures, system back, and opening reference URLs.

## Code organization

- Keep Expo Router route declarations and layouts in `src/app/`; routes compose feature screens.
- Keep gluestack-generated components in `src/components/ui/` and app-wide shared components in
  `src/components/`.
- Place reusable buttons, inputs, and checkboxes in `src/components/shared/button/`,
  `src/components/shared/input/`, and `src/components/shared/checkbox/`. Each control exposes
  deliberate variants and is reused by feature screens.
- Keep study feature screens, behavior, and feature-specific hooks in `src/features/questions/` and
  `src/features/quiz/`.
- Keep the static question catalog and its shared types in `src/data/`.

The root layout owns the gluestack and shared quiz-session providers. The home route presents the
study menu; Expo Router routes compose feature screens for question browsing and quiz flows.

## State and persistence ownership

Use React Context and `useReducer` for shared quiz history; do not add a separate global state
library for this feature. Each record contains its ordered question snapshot, selected categories,
creation time, current position, and optional completion time. The quiz feature's storage adapter
stores the versioned history in AsyncStorage, following
[Expo's storage guidance](https://docs.expo.dev/develop/user-interface/store-data/).

Hydrate history before enabling Continue. Update the selected record's stored position as quiz
navigation occurs. Continue targets the newest-created record, while a history selection opens that
specific record.

Question answer disclosure and question-list search/category filters remain screen-local UI state;
answer disclosure does not persist. The list remains mounted under its detail route so filters are
available when returning.
