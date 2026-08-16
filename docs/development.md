# Development Guide

This guide explains how to install, run, validate, and make routine database changes in The Ice Cream Man repository. For server ownership, environment variables, API patterns, and authentication details, use the [backend reference](../server/README.md).

## Prerequisites

Use Node.js **22** and pnpm **9.12.0**. The EAS build configuration pins Node.js 22.14.0 and pnpm 9.12.0; aligning local tooling with those versions minimizes differences between local and release environments.

| Requirement | How to verify |
|---|---|
| Git | `git --version` |
| Node.js 22 | `node --version` |
| pnpm 9.12.0 | `pnpm --version` |
| Android Studio and an Android device/emulator | Required only for local Android native builds. |
| Xcode and an iOS simulator/device | Required only for local iOS native builds on macOS. |

## Install the repository

Clone the repository and install dependencies from the committed lockfile.

```bash
git clone https://github.com/Mgfromthe503/Ice-cream-man-app.git
cd Ice-cream-man-app
pnpm install
```

The install step runs the repository's post-install compatibility safeguard. Do not remove or bypass it; see the [EAS Android codegen record](records/eas-android-codegen.md) for the rationale.

## Run locally

Start the full development environment with:

```bash
pnpm dev
```

This command runs the Express API in watch mode and starts Expo for the client. Use the command variants below when working on only one part of the application.

| Command | Expected result |
|---|---|
| `pnpm dev` | Starts API watch mode and the Expo development server together. |
| `pnpm dev:server` | Starts only the API server in development watch mode. |
| `pnpm dev:metro` | Starts only Expo/Metro for the client. |
| `pnpm android` | Runs the Android native project through Expo. |
| `pnpm ios` | Runs the iOS native project through Expo on macOS. |
| `pnpm qr` | Generates a QR-code utility output for device testing. |

Expo Go is suitable for supported JavaScript and Expo-module features. Use a development build when validating native capabilities that Expo Go does not include, including Google Play Billing.

## Validate a change

Run the narrowest relevant command while developing, then complete the full local quality gate before opening a pull request.

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
```

| Command | What it verifies |
|---|---|
| `pnpm check` | TypeScript compilation without emitting files. |
| `pnpm lint` | The Expo ESLint configuration. |
| `pnpm test` | The Vitest test suite in non-watch mode. |
| `pnpm build` | Production bundling of the API server to `dist/`. |
| `pnpm verify:deps` | Dependency override and lockfile safeguards used by the Android build workflow. |
| `pnpm format` | Applies Prettier formatting to the working tree. Review the resulting diff before committing. |

## Work with the database

Database changes are defined through Drizzle. Set `DATABASE_URL` for the intended MySQL-compatible database before generating or applying migrations.

```bash
export DATABASE_URL='mysql://USER:PASSWORD@HOST:PORT/DATABASE'
pnpm db:push
```

`pnpm db:push` runs `drizzle-kit generate` followed by `drizzle-kit migrate`. Inspect generated migrations and confirm the target database before running it; the command changes schema state. Do not place credentials in source files, committed `.env` files, screenshots, issues, or pull-request descriptions.

## Prepare a contribution

Use a focused branch and keep code, tests, and the owning documentation synchronized. The recommended pre-pull-request sequence is:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
git diff --check
git diff --stat
```

Then follow the [contribution workflow](../CONTRIBUTING.md). If the change affects Android build, store, or submission behavior, also follow the [release runbook](release/android-google-play.md) or update the relevant troubleshooting guide.

## Related documentation

| Topic | Document |
|---|---|
| Documentation navigation | [Documentation index](README.md) |
| Contributor requirements | [Contributing guide](../CONTRIBUTING.md) |
| Backend and environment variables | [Backend reference](../server/README.md) |
| Android release process | [Android and Google Play release runbook](release/android-google-play.md) |
| Android build failures | [Android and EAS troubleshooting](troubleshooting/android-eas-builds.md) |
