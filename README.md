# I Want To Be Ready For Interview

An Expo and React Native app built with TypeScript and Expo Router.

## Purpose

I Want To Be Ready For Interview is intended to be a local, self-guided study app for software
engineering topics: Node, TypeScript, JavaScript, React, Computer Science, and AI Tools. It presents
interview-style questions with quick and full answers for solo review or discussion with another
person. It is for learning, not an exam: users do not submit answers, receive grades, or compete.

The question catalog is maintained in [`src/data/db.json`](src/data/db.json). The current home menu
links to temporary quiz setup and question browsing screens; the study flows and saved quiz sessions
are still planned. See the [study experience contract](Docs/Design/StudyExperience.md),
[UI architecture contract](Docs/Design/UIArchitecture.md), and [implementation TODOs](Docs/TODOs.md).

## Requirements

- Node.js 22, within the versions supported by `package.json`
- npm
- For local Android builds: Android Studio, Java 17, Android SDK Platform 37.0 (Android 17 preview), Build Tools 37.0.0, NDK 27.1.12297006, and Platform Tools

## Install and run

```sh
npm ci
npm start
```

`npm run android` generates the native Android project from Expo config when needed, builds the development app, and launches it on an emulator or connected device. Expo's Continuous Native Generation (CNG) keeps `android/` and `ios/` generated; configure native behavior in `app.json` or config plugins.

## Quality checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run doctor
```

Use `npm run test:watch` while developing and `npm run test:coverage` to inspect coverage.

## Android builds

`npm run android:build` generates the Android project if needed and creates a release Android App Bundle at `android/app/build/outputs/bundle/release/app-release.aab`. `npm run android:build:debug` creates a debug APK. EAS profiles are configured for development builds, installable preview APKs, and production Android App Bundles:

```sh
npm run eas:build:android:preview
npm run eas:build:android:production
```

EAS cloud builds require an Expo account and project association. See [Expo's Android environment setup](https://docs.expo.dev/get-started/set-up-your-environment/) and [EAS Build setup](https://docs.expo.dev/build/setup/).

## GitHub Android releases

Pushing a semantic version tag such as `v1.2.3` starts the Android release workflow. If required reviewers are configured for the `android-release` GitHub Environment, the job waits for approval before running. It then builds a signed APK with the `github-release` EAS profile, sets the app version from the tag, increments the remote Android version code, and creates a GitHub Release with the APK and its SHA-256 checksum. Reviewer approval is optional; a solo maintainer can leave it unconfigured. Prerelease tags such as `v1.2.3-beta.1` create prereleases. The EAS CLI version is pinned to `26.0.0` in `eas.json` and the release workflow.

Before the first tag:

1. Sign in to Expo and run `npx eas-cli@26.0.0 project:init` to link this app to an EAS project, then commit the generated `extra.eas.projectId` in `app.json`.
2. In the repository’s **Settings → Environments**, create an environment named `android-release` and restrict deployments to version tags matching `v*`. Configure required reviewers only if an independent approval gate is desired; this is optional for a solo maintainer.
3. Create an [Expo access token](https://docs.expo.dev/accounts/programmatic-access/) and add it as an [environment secret](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments) named `EXPO_TOKEN` in `android-release`. Remove any repository-level `EXPO_TOKEN` secret so the token is available only through the protected environment.
4. Add a GitHub tag ruleset targeting `v*` and restrict who can create, update, or delete those tags to release maintainers. This prevents an unreviewed tag push from selecting arbitrary source for a release.
5. Check out the reviewed commit, then push its version tag, for example `git tag v1.0.0 && git push origin v1.0.0`.

The release workflow only runs for version tags. Regular pushes and pull requests do not run project CI workflows.


### This project was entirely made ai-assisted with OpenAI ChatGPT (pro plan) Luna XHigh
