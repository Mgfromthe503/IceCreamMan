# Clean release pipeline

This repository is the clean parallel release track for The Ice Cream Man.

- Existing `Ice-cream-man-app` remains the legacy project and is not modified by this pipeline.
- Android application ID: `com.icecreamman.launch`
- Production artifact: Android App Bundle (`.aab`)
- EAS authentication: repository secret `EXPO_TOKEN`
- Android signing is managed by the new EAS project; no keystore is stored in Git.

The `clean-android-build.yml` workflow validates the new identity and submits a production EAS build. It intentionally fails if legacy package/project/signing identifiers are present in release configuration.
