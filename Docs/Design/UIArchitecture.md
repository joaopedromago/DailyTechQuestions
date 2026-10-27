# UI Architecture

Status: Partially implemented

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
  `src/components/shared/input/`, and `src/components/shared/checkbox/`. Each control should expose
  deliberate variants and be reused by feature screens. These folders are scaffolded; no shared
  control components have been created yet.
- Keep study feature screens, behavior, and feature-specific hooks in `src/features/questions/` and
  `src/features/quiz/`.
- Keep the static question catalog and its shared types in `src/data/`.

The root layout owns the gluestack provider. Add the shared quiz-session provider there when quiz
session state is implemented. The home route replaces the starter tab experience with the study
menu; Expo Router routes compose feature screens for question browsing and quiz flows.

## State and persistence ownership

Use React Context and `useReducer` for the shared quiz session; do not add a separate global state
library for this feature. The session state contains the ordered question snapshot, selected
categories, and current position. Its storage adapter belongs with the quiz feature and stores one
serialized session in AsyncStorage, following [Expo's storage guidance](https://docs.expo.dev/develop/user-interface/store-data/).

Hydrate the session before enabling Continue. Update the stored position as quiz navigation occurs.
Question answer disclosure and question-list search/category filters remain screen-local UI state;
answer disclosure does not persist. Keep list filters available when returning from question detail.
