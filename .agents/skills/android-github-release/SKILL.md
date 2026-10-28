---
name: android-github-release
description: Run this Expo app's stable Android APK release end to end when invoked, deriving the version from the latest stable release and documented changes; don't use for general app changes.
---

# Android GitHub Release

Use this skill for the repository's tag-triggered Android APK release. Invoking the skill authorizes the normal stable release through pushing the version tag; do not ask for a separate publish confirmation. Stop and explain a blocker instead of tagging when a release gate fails. This does not authorize a prerelease unless requested, bypassing a required approval gate, or moving or force-pushing a tag.

Read the current `AGENTS.md`, `README.md`, `.github/workflows/release-android.yml`, `eas.json`, `app.json`, `package.json`, and `package-lock.json` before changing or triggering a release. Preserve unrelated working-tree changes. If the intended release scope is unclear, ask before committing or tagging.

## Check that a release is due

Identify the latest published stable GitHub Release and its target tag, inspect all version tags and release workflow runs, and use that release as the comparison baseline. Read the `Docs/History/YYYY-MM-DD.md` entries from the baseline through the intended target commit. Use the history as primary evidence; inspect relevant current Design/System docs and commit changes when history is missing or unclear.

Compare the baseline with the intended target, including only clearly in-scope working-tree changes. Ignore version-only edits in `app.json`, `package.json`, and `package-lock.json`, and changes confined to `.agents/skills/`, `.github/workflows/`, or tests, when deciding whether unreleased app content exists. If there are no other changes since the latest release, do not create a version-bump commit, push a commit, or create a tag; explain that there is nothing new to release.

If a higher stable tag has no published release, its workflow is still running, or tag/version state could skip or reuse a release, resolve that state before continuing. Never move or force-push an existing tag.

## Choose and update the version

Use the latest stable SemVer as the baseline; do not treat prereleases as stable. Include tags with build metadata in conflict checks and compare their SemVer precedence without the build metadata, since metadata does not make a different release version. If version sources disagree in a way that could skip or reuse a version, resolve that release state before continuing. Never move or force-push an existing tag.

When a change set includes multiple types, choose the largest justified increment:

- **Patch (`+0.0.1`)** for fixes, visual/accessibility corrections, documentation, or maintenance that do not add a user-facing capability or break an established contract.
- **Minor (`+0.1.0`)** for backward-compatible user-facing features or behavior additions.
- **Major (`+1.0.0`)** for breaking changes to established behavior, compatibility, or documented contracts.

For example, from `1.0.0`, a patch is `1.0.1`, a minor release is `1.1.0`, and a major release is `2.0.0`. If the documented changes do not support a clear classification, ask the user instead of guessing. For a first release with no stable release or version tag, use the already-declared version only when `app.json`, `package.json`, and `package-lock.json` agree; ask if they do not.

Update `expo.version` in `app.json`, `version` in `package.json`, and both root version fields in `package-lock.json` to the selected version before creating the reviewed release commit. Keep them equal. The workflow sets `app.json` from the pushed tag as a safeguard; it does not replace updating the committed project version. Do not change the pinned EAS CLI version or manually increment the Android version code for this release profile.

## Release protections

Before tagging, verify the workflow uses the GitHub Environment `android-release`, that the environment exists and has an `EXPO_TOKEN` secret, that deployment rules permit the intended `v*` tag, and that an active tag ruleset protects creation, updates, and deletion of `v*` tags for release maintainers. Check secret presence only; never print, commit, or copy its value. A missing environment, missing token, blocked tag, or inability to verify a required setting is a blocker: stop before creating the tag and explain what must be fixed or verified.

Human approval is optional. If a required reviewer creates a pending approval gate, wait for its authorized approval; never bypass it. If GitHub settings cannot be inspected, name the settings that remain unverified and do not claim they are configured.

## Prepare and publish

1. Confirm `app.json` has the EAS `projectId`, the `github-release` profile produces an APK, and `eas.json` pins `cli.version`. Use that exact EAS CLI version for every command; this repository currently pins `26.0.0`. Never use `eas-cli@latest` for a release.
2. Keep workflow actions pinned to full commit SHAs. When updating an action, verify the SHA belongs to the official action repository and review the version change.
3. Before release, run the relevant local checks already defined by the project (`npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm test`). Do not add general push or pull-request CI; this project intentionally uses GitHub Actions for tagged releases only.
4. Confirm the selected version matches `app.json`, `package.json`, and `package-lock.json`. Use `vMAJOR.MINOR.PATCH` for stable releases; use a prerelease suffix only when the user explicitly requests one. Do not add build metadata to release tags. Confirm the target commit has been reviewed and pushed, and no existing tag has the same SemVer precedence.
5. After all preflight checks pass, commit the release version change if needed and push the reviewed target commit. Then create and push the stable version tag to `origin`; invoking this skill is authorization for that tag push. Pushing the tag starts the workflow. If a configured approval gate is pending, wait for approval.
6. If any preflight, check, push, workflow, or publication step fails, explain the exact failure and stop before any later release action that has not already occurred. Do not move, force-push, or recreate an existing tag. For a failure after tagging, preserve the tag and report the workflow run and safe next step.
7. After the run finishes, verify the GitHub Release contains the APK and its `.sha256` file. Download them and check the checksum with `sha256sum -c iwanttobereadyforinterview-vX.Y.Z.apk.sha256` from the directory containing both files. Report the workflow/release URL, checksum result, and any approval or configuration blocker.

Never print, commit, or copy `EXPO_TOKEN` into logs or project files. Do not create or publish a release when tag protection, the EAS project link, or the release version is unresolved. If a configured approval gate is pending, wait for its approval.
