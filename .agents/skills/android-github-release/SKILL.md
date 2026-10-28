---
name: android-github-release
description: Prepare or publish this Expo app's Android APK as a GitHub Release, choosing the next version from the latest stable release and documented changes; don't use for general app changes.
---

# Android GitHub Release

Use this skill for the repository's tag-triggered Android APK release. Read the current `AGENTS.md`, `README.md`, `.github/workflows/release-android.yml`, `eas.json`, `app.json`, and `package.json` before changing or triggering a release. Preserve unrelated working-tree changes.

## Choose and update the version

Before preparing a release, identify the latest published stable GitHub Release and its tag, inspect all existing version tags, and compare them with `expo.version` in `app.json` and `version` in `package.json`. Use the latest stable SemVer as the baseline; do not treat prereleases as stable. Include tags with build metadata in conflict checks and compare their SemVer precedence without the build metadata, since metadata does not make a different release version. If a higher stable tag has no published release, a release workflow for it is still running, or the version sources disagree in a way that could skip or reuse a version, resolve that release state before continuing. Never move or force-push an existing tag.

Read the `Docs/History/YYYY-MM-DD.md` entries from the baseline release through the target commit. Use those records as the primary evidence for the change type; check the relevant current Design/System docs and the commit changes when the history is missing or unclear. When a change set includes multiple types, choose the largest justified increment:

- **Patch (`+0.0.1`)** for fixes, visual/accessibility corrections, documentation, or maintenance that do not add a user-facing capability or break an established contract.
- **Minor (`+0.1.0`)** for backward-compatible user-facing features or behavior additions.
- **Major (`+1.0.0`)** for breaking changes to established behavior, compatibility, or documented contracts.

For example, from `1.0.0`, a patch is `1.0.1`, a minor release is `1.1.0`, and a major release is `2.0.0`. If the documented changes do not support a clear classification, ask the user instead of guessing. For a first release with no stable release or version tag, use the already-declared version only when `app.json` and `package.json` agree; ask if they do not.

Update `expo.version` in `app.json` and `version` in `package.json` to the selected version before creating the reviewed release commit. Keep them equal. The workflow sets `app.json` from the pushed tag as a safeguard; it does not replace updating the committed project version. Do not change the pinned EAS CLI version or manually increment the Android version code for this release profile.

## Release protections

The workflow uses the GitHub Environment `android-release`. Verify the settings when access allows:

- `EXPO_TOKEN` is stored as a secret on `android-release`, not as a repository-level secret.
- Environment deployment rules allow only intended version tags such as `v*`.
- A tag ruleset for `v*` limits creation, updates, and deletion to release maintainers.

Human approval is optional. A required reviewer creates an approval gate only when configured in GitHub; do not block a solo maintainer's explicitly requested release just because no reviewer is configured. Report whether the environment has an approval gate. If GitHub settings cannot be inspected, say which remote protections remain unverified; do not claim they are configured.

## Prepare and publish

1. Confirm `app.json` has the EAS `projectId`, the `github-release` profile produces an APK, and `eas.json` pins `cli.version`. Use that exact EAS CLI version for every command; this repository currently pins `26.0.0`. Never use `eas-cli@latest` for a release.
2. Keep workflow actions pinned to full commit SHAs. When updating an action, verify the SHA belongs to the official action repository and review the version change.
3. Before release, run the relevant local checks already defined by the project (`npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm test`). Do not add general push or pull-request CI; this project intentionally uses GitHub Actions for tagged releases only.
4. Confirm the selected version matches both project version fields. Use `vMAJOR.MINOR.PATCH` for stable releases; use a prerelease suffix only when the user explicitly requests a prerelease. Do not add build metadata to release tags. Confirm the target commit has been reviewed and pushed, and that no existing tag has the same SemVer precedence.
5. Push the version tag only when the user explicitly asks to publish. The skill may derive the version using the rules above; the user does not have to supply the version number. Pushing the tag starts the workflow. If GitHub has a configured approval gate, wait for its authorized approval; do not bypass it.
6. After the run finishes, verify the GitHub Release contains the APK and its `.sha256` file. Download them and check the checksum with `sha256sum -c iwanttobereadyforinterview-vX.Y.Z.apk.sha256` from the directory containing both files. Report the workflow/release URL, checksum result, and any approval or configuration blocker.

Never print, commit, or copy `EXPO_TOKEN` into logs or project files. Do not create or publish a release when tag protection, the EAS project link, or the release version is unresolved. If a configured approval gate is pending, wait for its approval.
