# TODOs

Keep only concrete unimplemented work or unresolved contract decisions here. Remove an item when it
ships; the feature contracts describe intended behavior without duplicating this task list.

## 1. Establish gluestack UI and project conventions

- Set up gluestack-ui v3 with NativeWind v5, then establish the provider and theme configuration.
- Organize routes, generated UI components, feature code, shared components, and data as described
  in the [UI architecture contract](Design/UIArchitecture.md).
- Replace the Expo starter tab shell with the planned home menu and verify the shell on Android,
  iOS, and web.

## 2. Build shared question browsing and detail

- Add a shared question detail view with quick/full answer disclosure and clickable references.
- Add the question list with multi-category filtering and normalized search over question and quick
  answer text; preserve filters when returning from a question.
- Use the source category values while displaying the planned human-readable labels.

## 3. Implement random quiz navigation

- Add quiz category selection, initially selecting every catalog category and using every matching
  question in a shuffled copy without mutating the catalog.
- Add previous/next controls, swipe navigation, mobile system-back behavior, the full-answer-gated
  Next Question button, and the completion return action.

## 4. Persist and resume an unfinished quiz

- Store one ordered question snapshot, its selected categories, and current position in
  AsyncStorage; hydrate it for Continue, replace it when a new quiz starts, and clear it on
  completion.
- Verify exact restoration after app restart and the no-session, replacement, and completion
  states.
