# Android and EAS Build Troubleshooting

Use this guide to diagnose Android build or Google Play submission failures. It covers the repository's manual EAS workflows, dependency compatibility safeguards, and the first places to inspect. For planned releases, use the [Android and Google Play release runbook](../release/android-google-play.md).

## Before investigating a failure

Record the workflow name, branch, EAS profile, and the first actionable error in the job or EAS logs. Do not treat the final generic failure message as the root cause.

| Check | Expected state |
|---|---|
| Repository and branch | Build from the intended branch of `Mgfromthe503/Ice-cream-man-app`. |
| Application identity | [`config/app-identity.js`](../../config/app-identity.js) matches [`app.config.ts`](../../app.config.ts) and the associated Expo project. |
| Build profile | Select `development`, `preview`, `production`, or `production-apk` intentionally; see [`eas.json`](../../eas.json). |
| Tooling | Node.js 22 and pnpm 9.12.0. |
| Dependency safeguards | `pnpm verify:deps` succeeds. |
| Baseline validation | `pnpm check` and `pnpm test` succeed before retrying a cloud build. |

## Know the workflow behavior

The repository contains two manual build workflows: **EAS Build** and **EAS Build and Submit**. Both are started through **Actions** → select the workflow → **Run workflow**. Pull requests and pushes to `main` use validation workflows; they do not start an EAS build automatically.

| Outcome | What to do |
|---|---|
| Validation job fails | Resolve the type-check, lint, install, or test error before retrying EAS. |
| Build job is skipped | Check that the run was manually dispatched and that `EXPO_TOKEN` is configured. The workflows intentionally skip EAS when the token is absent. |
| Build completes but submission does not run | Confirm that the profile is `production`, the `submit` input is `true`, and the Play service-account secret is present. |

## Resolve common failures

### `EXPO_TOKEN` is missing or authenticates to the wrong Expo account

The EAS workflow requires a repository secret named `EXPO_TOKEN`. Create the token in the Expo account that owns the configured EAS project, store it as a GitHub Actions repository secret, and rerun the manual workflow. Do not print the token in workflow logs or commit it to the repository.

### Validation fails before the EAS build starts

Run the affected local command to reproduce the failure:

```bash
pnpm check
pnpm lint
pnpm test
pnpm verify:deps
```

Fix the first actionable error, review the diff, and rerun the relevant command. EAS should not be used to diagnose a type-check or test failure that reproduces locally.

### EAS or Gradle reports a `brace-expansion` or codegen interoperability error

This repository pins `brace-expansion` to `2.1.3` and includes preinstall/build safeguards to preserve the CommonJS interoperation expected by the Android build. First restore a clean dependency state and verify the safeguards:

```bash
pnpm install
pnpm verify:deps
```

If `pnpm-lock.yaml` changes because a dependency or override was intentionally updated, review and commit the lockfile together with the corresponding `package.json` change. Do not change or remove the compatibility scripts simply to bypass the failure. See the [EAS Android codegen record](../records/eas-android-codegen.md) for the technical background.

### EAS reports a generic Gradle failure

Open the EAS build page linked by the workflow, locate the **Run gradlew** step, and capture the first concrete Gradle or native-module error. Then check the relevant native configuration in [`app.config.ts`](../../app.config.ts), the selected profile in [`eas.json`](../../eas.json), and the installed dependency versions in [`package.json`](../../package.json).

If no local condition explains the result, retry the same deliberate profile with a cleared EAS cache:

```bash
eas build --platform android --profile production --clear-cache
```

Use `production` only when that is the intended profile; substitute `preview` or `development` when testing those builds.

### Google Play submission is skipped

The workflows submit only for a `production` build when `submit` is explicitly enabled and a Play service-account JSON secret is available. Configure `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` as the preferred repository secret. The workflow also supports `GOOGLE_SERVICE_ACCOUNT_KEY` for legacy compatibility. Follow the [Google Play setup reference](../release/google-play-setup.md) before retrying.

## Escalation checklist

When handing off a failure, provide the following information without including credentials or personal data:

| Item | Example |
|---|---|
| Workflow and run URL | `EAS Build`, run URL or run ID |
| Git commit | Full or short commit SHA |
| Requested EAS profile | `preview` or `production` |
| First actionable error | Exact error text and step name |
| Commands already run | `pnpm verify:deps`, `pnpm test`, and outcome |
| EAS build URL | Link from the workflow log, if created |

## Related documentation

| Topic | Document |
|---|---|
| Build and submission procedure | [Android and Google Play release runbook](../release/android-google-play.md) |
| Play Console prerequisites | [Google Play setup reference](../release/google-play-setup.md) |
| Dependency compatibility context | [EAS Android codegen record](../records/eas-android-codegen.md) |
| Documentation navigation | [Documentation index](../README.md) |
