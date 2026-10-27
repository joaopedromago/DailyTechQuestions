# TODOs

Keep only concrete unimplemented work or unresolved contract decisions here. Remove an item when it
ships; the feature contracts describe intended behavior without duplicating this task list.

## 1. Build shared question browsing and detail

- Replace the `/questions` placeholder with the question list and shared question detail view,
  including quick/full answer disclosure and clickable references.
- Add the question list with multi-category filtering and normalized search over question and quick
  answer text; preserve filters when returning from a question.
- Use the source category values while displaying the planned human-readable labels.

## 2. Implement random quiz navigation

- Replace the `/quiz/setup` placeholder with category selection, initially selecting every catalog
  category and using every matching question in a shuffled copy without mutating the catalog.
- Add previous/next controls, swipe navigation, mobile system-back behavior, the full-answer-gated
  Next Question button, and the completion return action.

## 3. Persist and resume an unfinished quiz

- Store one ordered question snapshot, its selected categories, and current position in
  AsyncStorage; hydrate it for Continue, replace it when a new quiz starts, and clear it on
  completion.
- Verify exact restoration after app restart and the no-session, replacement, and completion
  states.
