# UI Architecture

Status: Not implemented

This contract defines the intended UI and code organization for the study app. It does not describe
the current starter implementation; see [Current Application](../Systems/CurrentApp.md).

## UI system

Use gluestack-ui v3 with NativeWind v5 for application-visible UI and a shared theme. The
[gluestack installation guide](https://gluestack.io/ui/docs/home/getting-started/installation)
documents the current initialization options. Map the app's light and dark appearance to the
gluestack theme tokens.

Use gluestack components for visible layout, text, controls, and disclosure UI rather than styling
raw React Native `View` and `Text` throughout feature screens. Use platform APIs for routing, safe
areas, gestures, system back, and opening reference URLs.

## Code organization

- Keep Expo Router route declarations and layouts in `src/app/`; routes compose feature screens.
- Keep gluestack-generated components in `src/components/ui/` and app-wide shared components in
  `src/components/`.
- Keep study feature screens, behavior, and feature-specific hooks in `src/features/questions/` and
  `src/features/quiz/`.
- Keep the static question catalog and its shared types in `src/data/`.

The root layout owns the gluestack provider and shared quiz-session provider. The home route replaces
the starter tab experience with the study menu; question browsing and quiz screens use Expo Router.

## State and persistence ownership

Use React Context and `useReducer` for the shared quiz session; do not add a separate global state
library for this feature. The session state contains the ordered question snapshot, selected
categories, and current position. Its storage adapter belongs with the quiz feature and stores one
serialized session in AsyncStorage, following [Expo's storage guidance](https://docs.expo.dev/develop/user-interface/store-data/).

Hydrate the session before enabling Continue. Update the stored position as quiz navigation occurs.
Question answer disclosure and question-list search/category filters remain screen-local UI state;
answer disclosure does not persist. Keep list filters available when returning from question detail.
