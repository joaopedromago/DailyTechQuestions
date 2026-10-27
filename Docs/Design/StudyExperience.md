# Study Experience

Status: Partially implemented

This contract describes the intended local study experience. Current implementation status and
question catalog ownership are summarized in [Current Application](../Systems/CurrentApp.md).

## Purpose and home menu

The app is a self-guided study tool for Node, TypeScript, JavaScript, React, Computer Science, and
AI Tools. It does not ask learners to submit answers, grade responses, award points, or compete.
Questions can be reviewed alone or discussed with another person.

The home menu presents three actions: **Start Random Quiz**, **View Questions**, and **Continue**.
Continue is always visible but disabled when there is no unfinished quiz.

The menu also offers a light/dark appearance toggle that switches to the other appearance. Use a
Material Icon to identify the mode action and expose its target appearance in the accessible
label.

## Random quiz

Quiz setup derives its categories from the distinct `category` values in `src/data/db.json` and
selects all of them by default. `ComputerScience` is displayed as “Computer Science” and `AI` as
“AI Tools”; source values remain unchanged. At least one category must be selected to start.

Starting a quiz includes every catalog question in the selected categories, shuffles a copy once,
and preserves that ordered list for the session. The source catalog is never mutated and every
selected question appears once in that quiz.

The shared question view displays the question first. **See answer** reveals `shortAnswer`; **See
full answer** reveals `longAnswer` and clickable `referenceUrls`. In quiz mode, **Next Question** is
shown after the full answer is revealed. A left swipe advances and a right swipe goes back, even
when answers are still hidden. Previous/next controls are also available. Mobile system back moves
to the previous quiz position, or returns to the menu from the first question. A menu-return action
is available from the question view.

After the last question, show a completion state with a return-to-menu action and clear the
unfinished quiz session.

## Browse questions

View Questions starts with all catalog categories included. Learners can include multiple categories
and search with a case-insensitive, accent-insensitive substring query over `question` and
`shortAnswer`. The category selection and text query combine; an empty query shows all questions in
the selected categories.

Selecting a result opens the shared question view with the same progressive answer and reference
behavior. In this mode, the navigation action is **Return to list** instead of **Next Question**.
Returning to the list preserves its category and search filters. On web, provide navigation
controls and use browser history; mobile uses touch gestures and system back as described above.

## Continue

Keep at most one unfinished quiz snapshot on the device. It contains the selected categories, exact
ordered question data, and current question position. Continue restores that snapshot and position,
including after the app is closed and reopened. Answer-reveal state is not part of the snapshot and
starts collapsed after a question change or resume.

Returning to the menu or closing the app keeps the snapshot. Starting a new quiz replaces it;
finishing a quiz clears it. There is no Continue session after completion.
