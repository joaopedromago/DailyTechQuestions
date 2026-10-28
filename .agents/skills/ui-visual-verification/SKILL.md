---
name: ui-visual-verification
description: Run changed user-facing UI in a local browser and deliver visible screenshots in supported appearance modes. Use after every UI change in this project.
---

# UI Visual Verification

Use this after any change to user-facing UI in this project.

1. Read `AGENTS.md` and use `npm run web` (or `npx expo start --web`) to serve the app on HTTP localhost. Reuse an existing local server only after confirming it serves this project; otherwise start the app. If the default port is occupied, preserve any existing process and use another available port.
2. Use `cua_repl` to open the changed screen in the browser. Set the browser to a phone-sized viewport of about 390 × 844 for the primary inspection and screenshots. Inspect the actual rendered page and check for new console warnings or errors related to the change. Reload after code changes if hot reload did not update the page.
3. Capture the updated screen in dark and light mode when the app supports both. Use the app's visible theme control or another supported platform setting; do not fake the appearance by editing page DOM or styles in browser developer tools. Reset any temporary viewport override before finishing.
4. Save each screenshot as a local image file, preferably JPEG, at an absolute path that can be referenced in the handoff. Crop only when it keeps the full context needed to inspect the change.
5. In the final response, embed every required screenshot with Markdown image syntax and its absolute local path. Do not rely on screenshots appearing only in tool output. State which page and modes were captured, and report any browser warnings or blockers accurately.

This verifies browser rendering. Keep required lint/type checks and any native-platform validation required by the change as separate checks. Do not stop a pre-existing development server owned by the user.
