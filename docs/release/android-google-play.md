# Android and Google Play Release Runbook

This runbook is the controlled procedure for building an Android release and optionally submitting it to the Google Play internal track. It complements the [Google Play setup reference](google-play-setup.md), which covers the required one-time console and repository configuration.

> **Scope:** this guide prepares and submits builds. Publishing, rollout selection, review responses, and final production promotion are Play Console actions that require an authorized account holder.

## Sources of truth

Confirm release information in the configuration files rather than copying identifiers into release notes or workflow inputs.

| Concern | Authoritative file |
|---|---|
| App identity, package, Expo owner, and EAS project identifier | [`config/app-identity.js`](../../config/app-identity.js) |
| User-visible version, Android configuration, plugins, and permissions | [`app.config.ts`](../../app.config.ts) |
| Build profiles and Play submission profile | [`eas.json`](../../eas.json) |
| CI and manual release workflow behavior | [`.github/workflows/eas-build-submit.yml`](../../.github/workflows/eas-build-submit.yml) and [`.github/workflows/eas-build.yml`](../../.github/workflows/eas-build.yml) |
| Play listing, data safety, and reviewer materials | [`legal/`](../../legal/) |

## Release readiness

Before requesting an Android build, start from the intended commit on the intended branch and complete the following local validation.

```bash
pnpm install --frozen-lockfile
pnpm verify:deps
pnpm verify:android-release
pnpm check
pnpm lint
pnpm test
pnpm build
```

Review the working tree after validation. A production release should not include unrelated formatting changes, local configuration, credentials, keystores, or service-account files.

| Preflight check | Expected result |
|---|---|
| Application identity | The values in `config/app-identity.js` are the intended registered values. |
| Versioning | `app.config.ts` contains the intended user-visible version. EAS manages remote application versioning and the production profile enables Android auto-increment. |
| Build profile | `production` produces an Android App Bundle for store distribution. `preview` and `production-apk` produce APK-oriented internal artifacts; `development` creates a development-client APK. |
| Billing and mapping | `pnpm verify:android-release` confirms Billing Library `8.1.0`, R8 release minification, resource shrinking, and AAB production settings. Use a newly built AAB; never resubmit the rejected version-code `10020` artifact. |
| Play product | The configured product identifier and Play product are aligned before testing driver registration. |
| Store materials | Privacy, data-safety, listing, and reviewer-access content have been reviewed for the release. |
| Secrets | Required repository secrets exist; their values are not exposed in logs or source control. |

## Repository secrets

Configure these in **GitHub → Settings → Secrets and variables → Actions**. Repository secrets are consumed only by manual release workflows.

| Secret | Required for | Notes |
|---|---|---|
| `EXPO_TOKEN` | EAS build | Create an Expo token for the account that owns the configured EAS project. Without it, the workflow intentionally skips the EAS build. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Automated Google Play submission | Preferred secret containing the Play service-account JSON. Required only when `submit` is enabled. |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Legacy automated submission | Fallback name supported by current workflows; use the preferred secret for new configuration. |

Never commit an Expo token, Android keystore, `.jks` file, `.p12` file, or service-account JSON. The workflow creates a temporary key file only during a submission run and removes it afterwards.

## Recommended release path: GitHub Actions

Use **EAS Build and Submit** because it validates the Android Play release configuration, TypeScript, and tests before it creates a cloud build.

1. Open **Actions** in the repository and select **EAS Build and Submit**.
2. Select **Run workflow** and choose the release branch.
3. Choose the `production` profile for a Play-distributable Android App Bundle.
4. Set `submit` to `false` to create a build only, or `true` to submit the latest production build to the configured internal Play track.
5. Start the workflow and monitor the **Validate**, **EAS Android build**, and optional **Submit to Google Play** jobs.
6. Record the resulting EAS build URL and release commit in the release record.

The alternate **EAS Build** workflow is also manual and supports the same profile and submission choices. Use it only when its reduced validation path is appropriate for the release process.

## Local build and submission path

Use local commands only from a trusted machine with the required EAS and Play credentials. Authenticate as the Expo account that owns the configured project.

```bash
npx eas-cli@latest whoami
npx eas-cli@latest build --platform android --profile production
```

After a successful build, submit the latest production build only when the Play service-account configuration is available locally:

```bash
npx eas-cli@latest submit --platform android --profile production --latest
```

The checked-in EAS submit profile targets the `internal` Play track with draft release status. Use `--service-account-json <path>` when the service-account file is not located at the profile's configured path. Keep that file outside the repository.

## After submission

Submission places the artifact in the configured Google Play track; it does not complete a public rollout. In Play Console, an authorized release manager should verify the uploaded artifact, complete any required store declarations, add release notes, and choose the appropriate testing or production promotion path.

| Verify after submission | Why it matters |
|---|---|
| Artifact is associated with the intended package and version | Confirms the correct fresh build reached the intended Play app. |
| Play Billing and deobfuscation checks clear | Confirms Play evaluated the new AAB rather than the rejected version-code `10020` artifact. App Bundles built with Android Gradle Plugin 4.1 or later carry the R8 mapping file that Play reads automatically. |
| Internal-testing access works | Confirms testers can install and exercise the release candidate. |
| In-app product behavior is tested in the intended track | Confirms the billing integration is configured for the release context. |
| Privacy, Data Safety, listing, and app-access entries are current | Keeps the console declaration aligned with the distributed app. |
| Release notes are appropriate for the shipped change | Provides accurate change information to reviewers and users. |

## Recovery and rollback principles

If validation fails, fix the first actionable error and rerun the narrowest relevant command before creating another EAS build. If an EAS build fails, use [Android and EAS troubleshooting](../troubleshooting/android-eas-builds.md). If a submitted artifact is not ready for promotion, keep it in the available test track and correct the issue in a new, versioned build rather than modifying a previously uploaded artifact.

## Related documentation

| Topic | Document |
|---|---|
| Google Play prerequisites and configuration | [Google Play setup reference](google-play-setup.md) |
| Build and submission failures | [Android and EAS troubleshooting](../troubleshooting/android-eas-builds.md) |
| Store listing and compliance materials | [Legal directory](../../legal/) |
| Documentation navigation | [Documentation index](../README.md) |
