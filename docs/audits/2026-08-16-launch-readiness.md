# Ice Cream Man Launch-Readiness Audit

**Audit date:** 2026-08-16  
**Scope:** Source repository, Expo/Android release configuration, available release documentation, server authorization and purchase verification paths, dependency graph, and the generated Android project.  
**Artifact note:** No signed Android App Bundle (`.aab`) was present in the repository or supplied for inspection. The findings about bundle contents are therefore based on a clean generated Android project and source-level release preflight, not on an uploaded production artifact.

## Executive assessment

The repository has been materially strengthened for a future Google Play release. The prior source path trusted device-local roles, payment flags, client-generated receipts, and a permanently registered test-login endpoint. Those paths have been removed or replaced with authenticated server-side controls. The Android build configuration now generates a Play Billing Library 8.1.0 dependency pair, creates a release AAB with R8 enabled, and no longer requests microphone recording permission.

The source tree is **not yet authorized for a production submission** solely because a release build passes locally. Before a real launch, the owner must apply the new database migration, configure the backend’s service-account secret and OAuth runtime values, perform a real license-test purchase, and build a fresh production AAB with a new version code. The remaining production dependency audit contains two high-severity `image-size` findings with no published fix, inherited through Expo/Metro build tooling; they require an accepted risk record or an upstream Expo/Metro update before approval.

| Readiness area | Audit result | Release implication |
|---|---|---|
| Server authentication | Repaired | Protected screens now require a server-confirmed session; the old test-login endpoint and hard-coded accounts were removed. |
| Vendor authorization | Repaired | Driver-only procedures require a server-side driver profile; a device-selected role is now presentation state only. |
| Google Play one-time product | Repaired in source; runtime setup pending | The backend verifies and acknowledges a purchase, hashes the token for replay prevention, and persists a unique entitlement. |
| Android Billing and obfuscation | Passed source and generated-project checks | Billing 8.1.0 and R8 release settings are generated; build a fresh AAB rather than reuse version code 10020. |
| Android permissions | Improved | `RECORD_AUDIO` is absent from the generated manifest; Billing permission remains present. |
| Expo compatibility | Passed | Expo Doctor completed 18/18 checks after dependency alignment and navigation deduplication. |
| Tests and build | Passed | TypeScript check, server bundle build, dependency preflight, and 149 tests passed. |
| Supply-chain audit | Conditional | Two high-severity, no-fix `image-size` advisories remain through Expo/Metro tooling. |

## Confirmed repairs

### Authentication and authorization

The insecure server endpoint `/api/auth/test-login` and its hard-coded customer and driver account definitions were deleted. The mobile login screen now begins the configured OAuth flow, while the OAuth callback accepts only a validated server-issued session and persists it through the platform secure store. Session helper logs no longer print token fragments or user objects.

The root navigator now redirects unauthenticated users to secure sign-in and requires an authenticated session before role selection. A selected customer or driver role is clearly documented and treated as an app-navigation preference rather than an authorization claim. Server-side `driverProcedure` middleware resolves the driver profile from the authenticated user, and driver requests, location updates, online status, acceptance, and completion use that canonical profile ID.

The cookie helper now handles requests without a Host header safely. This converted the previously skipped logout test into an active regression test and avoids an exception in direct test or health-request contexts.

### Purchase verification and entitlements

The client no longer simulates web purchases, creates local “secure receipts,” or writes a local `vendorRegistrationPaid` flag. After Google Play returns an opaque purchase token, the app sends it to a protected backend mutation. The backend uses the Android Publisher API to retrieve the one-time product status, requires a purchased and non-consumed state, acknowledges a purchase that is not already acknowledged, and records only a SHA-256 token hash. Google’s API documents that product responses contain purchase state, consumption state, acknowledgement state, product ID, and purchase token; its `get` endpoint requires the app package, product ID, token, and Android Publisher OAuth scope. [1] [2]

The new `vendor_entitlements` model includes unique user and token-hash constraints. Migration `0001_vendor_entitlements.sql` and the Drizzle migration journal entry are included. The server returns a generic verification error and does not log the purchase token. Driver-profile creation is denied unless a verified entitlement exists, so changing device storage cannot create a vendor account.

> A live purchase remains intentionally fail-closed until `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` is configured in the backend secret manager. This prevents the app from granting vendor access simply because a token has the correct shape.

### Request ownership and state transitions

Request acceptance now performs a conditional update only while the request is waiting. Transit and completion require the assigned driver profile and expected prior status. Customer cancellation requires the requesting customer and active request state. Delivery completion updates request state and driver earnings within one database transaction, deriving the earning amount from the server-side request price rather than a client-supplied amount.

### Android, dependency, and workflow cleanup

Expo-native dependencies were aligned with SDK 54, and the React Navigation pair was deduplicated around the version required by Expo Router. The documented Expo exception prevents a generic package-version check from suggesting an incompatible downgrade. The Android config disables audio-recording support and microphone permission because the app uses playback only.

The Android release preflight continues to enforce Google Play Billing 8.1.0, Billing KTX 8.1.0, R8 minification, resource shrinking, and AAB production output. Generated Android files confirmed both Billing dependencies and the `com.android.vending.BILLING` permission; `RECORD_AUDIO` was absent. Google Play reads R8 mapping information from modern App Bundles, so a newly produced release AAB is required to clear the old mapping-file warning. [3]

The EAS workflow now fails rather than silently skips when `EXPO_TOKEN` is absent. A requested Google Play submission also fails when no service-account secret is present. The dependency preflight pins patched versions such as `brace-expansion` 2.1.4 and verifies lockfile consistency before EAS build work begins.

### Documentation and reviewer access

The canonical Google Play setup guide now explains the backend service-account prerequisite and the separation between backend and GitHub Actions secrets. The old App Access document, which contained hard-coded reviewer credentials and a bypass path, was replaced with a secure reviewer-preparation template. It requires OAuth reviewer access, Play license testing, server verification, and evidence from the actual release build. Google Play’s purchase API provides status retrieval and acknowledgement methods for one-time products. [1] [2] [4]

## Validation record

| Validation | Result |
|---|---|
| `pnpm check` | Passed |
| `pnpm test` | Passed — 12 files, 149 tests |
| `pnpm build` | Passed — production server bundle generated |
| `pnpm verify:deps` | Passed — 24 pinned overrides synchronized with `pnpm-lock.yaml` |
| `pnpm verify:android-release` | Passed — Billing 8.1.0, R8, mapping generation, and AAB configuration verified |
| `npx expo-doctor` | Passed — 18/18 checks |
| Generated Android project | Confirmed Billing 8.1.0 and Billing KTX 8.1.0; Billing permission present; microphone permission absent |
| `pnpm lint` | Passed with 39 pre-existing warnings and zero errors |
| `pnpm audit --prod` | Two high-severity `image-size` advisories remain with no published patched version |

## Required release gates

The following actions require account access or a real deployment environment and cannot be validated from repository source alone.

| Priority | Required action | Owner evidence |
|---|---|---|
| Blocking | Run the committed Drizzle migration against the production database. | Migration history shows `0001_vendor_entitlements` applied. |
| Blocking | Configure `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` only in the backend secret manager and grant that service account Android Publisher access to this app. | A license-test purchase reaches server verification without exposing the token. |
| Blocking | Configure the production OAuth provider and runtime variables, then test sign-in with the exact internal-test build. | Unauthenticated navigation redirects to login; callback establishes a real session. |
| Blocking | Activate the `icm_vendor_registration` one-time product and add a license tester. | A tester completes purchase, restoration, acknowledgement, and entitlement creation. |
| Blocking | Build a fresh production AAB after merge; do not re-upload version code 10020. | New version code appears in EAS output and Play Console accepts the artifact. |
| Blocking | Inspect the actual production AAB and Play Console declarations. | R8 mapping, Data Safety, Privacy Policy, App Access, and target SDK declarations match the release. |
| Security acceptance | Review the two `image-size` advisories inherited through Expo/Metro and record the no-fix exception or update Expo/Metro once a fixed upstream package is available. | Approved exception or a clean dependency audit. |
| Quality follow-up | Triage the remaining lint warnings, particularly unused imports and React hook dependency warnings. | Lint warning count reduced or accepted in a tracked issue. |

## References

[1]: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products "Google Play Developer API: purchases.products resource"
[2]: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/get "Google Play Developer API: purchases.products.get"
[3]: https://support.google.com/googleplay/android-developer/answer/9848633?hl=en "Google Play Console: Deobfuscate or symbolicate crash stack traces"
[4]: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/acknowledge "Google Play Developer API: purchases.products.acknowledge"
[5]: https://developer.android.com/google/play/developer-api "Android Developers: Google Play Developer APIs"
