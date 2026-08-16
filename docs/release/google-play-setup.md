# Google Play Setup Reference

This reference lists the configuration that must exist before the repository can submit a production Android build to Google Play. Use the [Android and Google Play release runbook](android-google-play.md) for the release procedure itself.

## Confirm the registered application identity

The Play app, Expo project, and checked-in configuration must describe the same application. Do not edit these values in this document; verify them in the source files below.

| Value | Source of truth |
|---|---|
| App name, Android package, Expo slug, owner, and EAS project identifier | [`config/app-identity.js`](../../config/app-identity.js) |
| User-visible version and Android native configuration | [`app.config.ts`](../../app.config.ts) |
| Build profiles and Play track configuration | [`eas.json`](../../eas.json) |

## Configure Google Play Console

Before an automated or local Play submission, an authorized account holder must create or select the Play app that uses the registered Android package. Complete the store information required for the intended release and keep each declaration aligned with the distributed app.

| Console area | Repository reference |
|---|---|
| Store listing | [Google Play listing content](../../legal/GOOGLE_PLAY_LISTING.md) |
| Privacy policy | [Privacy Policy](../../legal/PRIVACY_POLICY.md); host it at a publicly accessible URL before entering it in Play Console. |
| Data Safety | [Data Safety reference](../../legal/DATA_SAFETY.md) |
| App access and reviewer instructions | [Google Play app access](../../legal/GOOGLE_PLAY_APP_ACCESS.md) |
| Release notes | The release-note material in [Google Play listing content](../../legal/GOOGLE_PLAY_LISTING.md), adapted to the actual release. |

The app's internal testing track should have an appropriate tester group before a release candidate is submitted. Verify that the reviewer and tester flows described in the app-access material still work in the build being released.

## Configure driver registration billing

The driver registration flow expects the one-time product identifier configured by the application. Confirm the product is active in Play Console and that its identifier matches the application configuration before testing the billing flow.

| Check | Expected state |
|---|---|
| Product identifier | Matches the identifier used by the application. |
| Product type | A one-time product suitable for the registration flow. |
| Availability | Active for the test or release track being used. |
| Test path | Exercised by a permitted Play test account before production promotion. |

The app grants vendor access only after its backend verifies the opaque purchase token with the Google Play Developer API, acknowledges an unacknowledged one-time purchase, and persists a one-time token hash. Before internal testing, enable the Android Publisher API for the same Google Cloud project and grant the service account access to this Play app. Set `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` only in the backend's approved secret manager; it must contain the service-account JSON and must never be added to source control, EAS public variables, app configuration, or a client bundle.

> The GitHub Actions submission secret is separate from the running backend configuration. Both may use appropriately scoped service accounts, but the backend must have its own managed secret before vendor registration is enabled.

## Configure automated submission

Automated submission is optional. The manual workflows can create EAS builds with only the Expo token, but submission requires a Google Play service-account JSON secret.

1. Create or select a service account that has the required access to the target Play application.
2. Generate the service-account JSON through the approved Google Cloud and Play Console process.
3. Add its full JSON contents as the GitHub Actions repository secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
4. Add an Expo access token for the owning Expo account as the repository secret `EXPO_TOKEN`.
5. Use **EAS Build and Submit** with the `production` profile and `submit=true` when ready.

The current workflows accept `GOOGLE_SERVICE_ACCOUNT_KEY` as a legacy fallback, but new configuration should use `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`. Never commit service-account JSON or Android signing material to the repository.

## Verify billing and deobfuscation configuration

Before submitting an Android production build, run:

```bash
pnpm verify:android-release
```

The preflight verifies that the repository is configured to generate an Android
project with the explicit Google Play Billing Library `8.1.0` dependency,
matching Billing KTX dependency, `com.android.vending.BILLING` permission, and
R8 minification and resource shrinking enabled for release builds. Both manual
EAS workflows execute this check before starting a cloud build.

The production profile creates an Android App Bundle, not an APK. With Android
Gradle Plugin 4.1 or later, Google Play automatically reads the R8
`mapping.txt` file stored in the bundle. See [Google Play's deobfuscation
guidance](https://support.google.com/googleplay/android-developer/answer/9848633?hl=en).

> Play Console evaluates the uploaded artifact, not the source repository.
> Do not reuse the rejected version-code `10020` bundle. After this
> configuration is on `main`, create a new production AAB so EAS assigns a new
> Android version code.

If a newly downloaded production AAB still shows the mapping warning, inspect
it before upload:

```bash
unzip -l path/to/app.aab | grep 'BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map'
```

If the file is absent, stop the release and inspect the EAS **Run gradlew**
logs. Do not substitute a manually created or stale AAB for the new EAS
production artifact.

## Verify setup before a release

| Verification | Where to check |
|---|---|
| Identity and package alignment | `config/app-identity.js`, `app.config.ts`, Expo project, and Play Console app |
| EAS credentials and ownership | EAS account and credential management for the configured project |
| Required GitHub Actions secrets | Repository Actions secrets settings |
| Store declarations and reviewer flow | Play Console and the linked `legal/` materials |
| Backend purchase verification | A Google Play test purchase produces a server-verified entitlement without storing the raw token |
| Automated submission permissions | A controlled production-profile test or an authorized account review |

## Related documentation

| Topic | Document |
|---|---|
| Release procedure | [Android and Google Play release runbook](android-google-play.md) |
| Android build failures | [Android and EAS troubleshooting](../troubleshooting/android-eas-builds.md) |
| Store and compliance materials | [Legal directory](../../legal/) |
| Documentation navigation | [Documentation index](../README.md) |
