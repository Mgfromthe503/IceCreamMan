# Engineering Record: EAS Android Codegen Compatibility

This record explains why the repository contains `brace-expansion` compatibility safeguards for Android EAS builds. It is historical engineering context, not the primary release procedure. For a current release, use the [Android and Google Play release runbook](../release/android-google-play.md); for a current failure, use [Android and EAS troubleshooting](../troubleshooting/android-eas-builds.md).

## Incident signature

The affected Android build path failed during React Native code generation with an error equivalent to:

```text
:react-native-gesture-handler:generateCodegenSchemaFromJavaScript
TypeError: (0 , brace_expansion_1.default) is not a function
```

The failure involved the CommonJS interoperation path between `minimatch` and `brace-expansion`, not application code. The upstream context is tracked in [expo/eas-cli#3695](https://github.com/expo/eas-cli/issues/3695).

## Compatibility model

`minimatch` may call `brace-expansion` through a TypeScript default-import compatibility path. Some CommonJS module shapes expose a named `expand` function without a callable `default` export, causing that call path to fail. The repository treats this as a build-tool compatibility issue and verifies that the installed module can satisfy the expected default-import shape.

| Concern | Current repository safeguard |
|---|---|
| Dependency resolution | `package.json` pins `brace-expansion` and declares pnpm overrides. |
| Lockfile drift | `scripts/verify-pnpm-overrides.cjs` checks override and lockfile consistency before dependency installation. |
| Installed module interoperation | `scripts/patch-brace-expansion-cjs.cjs` repairs the CommonJS shape when required. |
| EAS lifecycle | `eas-build-pre-install` and `eas-build-post-install` run the guard and patch scripts. |
| CI workflow | Both manual EAS workflows verify dependency safeguards and run the compatibility patch after installation. |
| EAS auto-fingerprinting | The base EAS profile sets `EAS_SKIP_AUTO_FINGERPRINT=1`. |

> **Important:** the current `eas.json` does not inject a `NODE_OPTIONS` preload. The active approach relies on dependency pinning, lifecycle hooks, and the post-install compatibility patch.

## Why the lockfile matters

The EAS workflows install with `pnpm install --frozen-lockfile`. If package overrides change without a matching `pnpm-lock.yaml` update, the build either fails with a lockfile configuration mismatch or resolves an unintended dependency graph. Keep `package.json` and `pnpm-lock.yaml` synchronized.

The repository uses pnpm 9.12.0 for EAS builds. Its active overrides are maintained in `package.json`, where the verification script expects them.

## Required maintenance workflow

When an intentional dependency or override change affects this compatibility area, use the following sequence:

```bash
pnpm install
pnpm verify:deps
pnpm test
git diff -- package.json pnpm-lock.yaml
```

Review the dependency diff, commit the package manifest and lockfile together, then validate the relevant Android build path. Do not remove the guard or patch merely to make a local installation proceed.

## Verification

The repository exposes a deterministic guard:

```bash
pnpm verify:deps
```

A successful check confirms that the expected override configuration is present and that the lockfile agrees with it. The patch script also validates that a minimatch-style `require('brace-expansion').default(...)` call can succeed after repair.

For a cloud-build failure, follow [Android and EAS troubleshooting](../troubleshooting/android-eas-builds.md) and capture the first actionable error from the EAS or Gradle logs.

## Removal criteria

Remove or simplify these safeguards only after all of the following have been demonstrated in a controlled branch:

1. The relevant React Native codegen dependency path no longer requires the compatibility behavior.
2. A clean installation passes `pnpm verify:deps` with the proposed change.
3. A clean Android EAS production build succeeds without the removed safeguard.
4. The release and troubleshooting documentation is updated in the same change.

## Related files

| File | Role |
|---|---|
| [`package.json`](../../package.json) | Pins and pnpm overrides. |
| [`scripts/verify-pnpm-overrides.cjs`](../../scripts/verify-pnpm-overrides.cjs) | Verifies override and lockfile expectations. |
| [`scripts/ensure-brace-expansion.cjs`](../../scripts/ensure-brace-expansion.cjs) | Performs the pre-install / local guard. |
| [`scripts/patch-brace-expansion-cjs.cjs`](../../scripts/patch-brace-expansion-cjs.cjs) | Repairs and verifies CommonJS interoperation. |
| [`eas.json`](../../eas.json) | Defines EAS lifecycle hooks and base build environment. |
| [EAS Build workflow](../../.github/workflows/eas-build.yml) | Applies safeguards in the manual build workflow. |
