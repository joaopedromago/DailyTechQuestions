# Study Experience

Status: Implemented

This contract describes the intended local study experience. Current implementation status and
question catalog ownership are summarized in [Current Application](../Systems/CurrentApp.md).

## Purpose and home menu

The app is a self-guided study tool for Node, TypeScript, JavaScript, React, Computer Science, AI
Tools, System Design, Backend, and JavaScript code-output questions. It does not ask learners to
submit answers, grade responses, award points, or compete. Questions can be reviewed alone or
discussed with another person.

The home menu presents four actions: **Start Random Quiz**, **View Questions**, **Continue**, and
**History**. Continue remains disabled until history hydration completes and opens the newest-created
quiz record. History is always available and lists saved records.

The menu also offers a light/dark appearance toggle that switches to the other appearance. Use a
Material Icon to identify the mode action and expose its target appearance in the accessible
label.

## Random quiz

Quiz setup derives its categories from the distinct `category` values in `src/data/db.json` and
selects all of them by default. `ComputerScience` is displayed as “Computer Science”, `AI` as “AI
Tools”, `SystemDesign` as “System Design”, and `JavascriptCode` as “JavaScript Code”; source
values remain unchanged.

A bulk selection action selects all categories when none are selected, selects the remaining
categories for a partial selection, and clears all when every category is selected. At least one
category must be selected to start.

The Max questions field defaults to the total questions available across selected categories. Its
integer value is clamped to the range from 1 through that maximum; category changes recalculate the
maximum and clamp the edited value.

Starting a quiz takes the requested number of questions from the combined selected-category pool
after shuffling. No question appears more than once, and the source catalog is never mutated.

The shared question view displays the question first. For `JavascriptCode`, it displays the fixed
prompt “What this code do?” and the raw `question` value in a monospace code block. **See answer**
expands the answer panel and shows the question category and `shortAnswer`; the same control becomes
**Hide answer** and collapses the quick and full answers. **See full answer** reveals `longAnswer`
and clickable `referenceUrls` inside the expanded panel. JavaScript code questions have no
reference links; their answers give the Node.js output and explanation. In quiz mode, **Next
Question** (or **Finish Quiz** on the last question) is shown after the full answer is revealed.
Previous and next controls and horizontal swipes also navigate while answers are hidden. Mobile
system back moves to the previous quiz position, or returns to the menu from the first question.
Returning to the menu keeps the quiz record and its saved position.

A copy icon beside the prompt copies the stored `question` value verbatim. For `JavascriptCode`, it
copies the raw snippet; the action is available in both browse and quiz modes. The icon follows the
selected theme and reports clipboard failures with an error icon.

After the last question, show a completion state with a return-to-menu action and mark the history
record completed while preserving it and its latest question position.

## Browse questions

View Questions starts with all catalog categories included. Learners can include multiple categories
and search with a case-insensitive, accent-insensitive substring query over `question` and
`shortAnswer`. The category selection and text query combine; an empty query shows all questions in
the selected categories.

Selecting a result opens the shared question view with the same collapsible answer and reference
behavior. JavaScript code rows show the fixed prompt and a one-line code preview. Browse detail
routes use the question's source catalog index. In this mode, the navigation action is **Return to
list** instead of quiz controls. Returning to the list preserves its category and search filters.
Browser history and mobile system back return to the list; a right swipe also returns from detail to
the list.

## Continue and history

Persist every quiz record on the device in AsyncStorage with its creation time, selected categories,
exact ordered question data, current position, and optional completion time. Continue always opens
the newest-created record. Starting a quiz appends a record, navigation updates that record's
position, and completion marks it without deleting it. A valid snapshot saved by older versions is
migrated into history. Answer-reveal state is not stored and starts collapsed after a question change
or resume.

The History page lists records newest first. Each row shows its creation time and current question
position out of the total. Expanding a row shows every selected category as a badge. Opening a row
loads that record at its saved question; it does not change which record Continue opens.
