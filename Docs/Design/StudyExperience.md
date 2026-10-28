# Study Experience

Status: Implemented

This contract describes the intended local study experience. Current implementation status and
question catalog ownership are summarized in [Current Application](../Systems/CurrentApp.md).

## Purpose and home menu

The app is a self-guided study tool for Node, TypeScript, JavaScript, React, Computer Science, AI
Tools, System Design, Backend, and JavaScript code-output questions. It does not ask learners to
submit answers, grade responses, award points, or compete. Questions can be reviewed alone or
discussed with another person.

The home menu presents three actions: **Start Random Quiz**, **View Questions**, and **Continue**.
Continue is always visible, remains disabled until session hydration completes, and is enabled only
when an unfinished quiz is available.

The menu also offers a light/dark appearance toggle that switches to the other appearance. Use a
Material Icon to identify the mode action and expose its target appearance in the accessible
label.

## Random quiz

Quiz setup derives its categories from the distinct `category` values in `src/data/db.json` and
selects all of them by default. `ComputerScience` is displayed as “Computer Science”, `AI` as “AI
Tools”, `SystemDesign` as “System Design”, and `JavascriptCode` as “JavaScript Code”; source
values remain unchanged. At least one category must be selected to start.

Starting a quiz includes every catalog question in the selected categories, shuffles a copy once,
and preserves that ordered list for the session. The source catalog is never mutated and every
selected question appears once in that quiz.

The shared question view displays the question first. For `JavascriptCode`, it displays the fixed
prompt “What this code do?” and the raw `question` value in a monospace code block. **See answer**
expands the answer panel and shows the question category and `shortAnswer`; the same control becomes
**Hide answer** and collapses the quick and full answers. **See full answer** reveals `longAnswer`
and clickable `referenceUrls` inside the expanded panel. JavaScript code questions have no
reference links; their answers give the Node.js output and explanation. In quiz mode, **Next
Question** (or **Finish Quiz** on the last question) is shown after the full answer is revealed.
Previous and next controls and horizontal swipes also navigate while answers are hidden. Mobile
system back moves to the previous quiz position, or returns to the menu from the first question.
Returning to the menu keeps the unfinished snapshot.

A copy icon beside the prompt copies the stored `question` value verbatim. For `JavascriptCode`, it
copies the raw snippet; the action is available in both browse and quiz modes. The icon follows the
selected theme and reports clipboard failures with an error icon.

After the last question, show a completion state with a return-to-menu action and clear the
unfinished quiz session.

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

## Continue

Keep at most one unfinished quiz snapshot on the device in AsyncStorage. It contains the selected
categories, exact ordered question data, and current question position. Continue restores that
snapshot and position, including after the app is closed and reopened. Invalid saved data is removed
and treated as no session. Answer-reveal state is not part of the snapshot and starts collapsed
after a question change or resume.

Returning to the menu or closing the app keeps the snapshot. Starting a new quiz replaces it;
finishing a quiz clears it. There is no Continue session after completion.
