---
name: android-github-release
description: Prepare, audit, or publish this Expo app's Android APK as a GitHub Release. Use for release workflow setup, release readiness, and versioned Android releases; don't use for general app changes.
---

# Android GitHub Release

Use this skill for the repository's tag-triggered Android APK release. Read the current `AGENTS.md`, `README.md`, `.github/workflows/release-android.yml`, `eas.json`, and `app.json` before changing or triggering a release. Preserve unrelated working-tree changes.

## Release protections

The workflow uses the GitHub Environment `android-release`. A job-level environment declaration only creates a real approval gate when repository settings configure protection rules, so verify these settings when access allows:

- `android-release` has required reviewer(s), with self-review prevention enabled where available.
- Environment deployment rules allow only intended version tags such as `v*`.
- `EXPO_TOKEN` is stored as a secret on `android-release`, not as a repository-level secret.
- A tag ruleset for `v*` limits creation, updates, and deletion to release maintainers.

If GitHub settings cannot be inspected, say the gate is declared in the workflow but its remote protection is unverified. Give the exact settings the repository owner must configure; do not claim the release is protected until confirmed.

## Prepare and publish

1. Confirm `app.json` has the EAS `projectId`, the `github-release` profile produces an APK, and `eas.json` pins `cli.version`. Use that exact EAS CLI version for every command; this repository currently pins `26.0.0`. Never use `eas-cli@latest` for a release.
2. Keep workflow actions pinned to full commit SHAs. When updating an action, verify the SHA belongs to the official action repository and review the version change.
3. Before release, run the relevant local checks already defined by the project (`npm run lint`, `npm run format:check`, `npm run typecheck`, and `npm test`). Do not add general push or pull-request CI; this project intentionally uses GitHub Actions for tagged releases only.
4. Use a strict semantic-version tag (`vMAJOR.MINOR.PATCH`, optionally with prerelease or build metadata). Confirm the target commit has been reviewed and pushed, and check that the tag does not already exist. Do not invent a release version, move an existing tag, or force-push a tag.
5. Create and push the tag only when the user explicitly asks to publish that specific version. Creating the tag triggers the workflow; the protected environment reviewer must approve it before the job gets its steps or `EXPO_TOKEN`.
6. After the run finishes, verify the GitHub Release contains the APK and its `.sha256` file. Download them and check the checksum with `sha256sum -c iwanttobereadyforinterview-v1.2.3.apk.sha256` from the directory containing both files, replacing the example version with the released version. Report the workflow/release URL and any approval or configuration blocker.

Never print, commit, or copy `EXPO_TOKEN` into logs or project files. Do not create or publish a release when the tag protection, environment approval, EAS project link, or release version is unresolved.
