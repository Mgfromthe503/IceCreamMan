# Documentation Index

This directory organizes project documentation by the work a reader needs to complete. The repository root [README](../README.md) is the public entry point; this page is the authoritative navigation page for detailed guides.

## Start here

| If you need to… | Read… |
|---|---|
| Set up the repository and run it locally | [Development guide](development.md) |
| Contribute code, tests, or documentation | [Contributing guide](../CONTRIBUTING.md) |
| Understand the API, database, authentication, or environment variables | [Backend reference](../server/README.md) |
| Build or submit the Android app to Google Play | [Android and Google Play release runbook](release/android-google-play.md) |
| Configure the required Google Play resources and secrets | [Google Play setup reference](release/google-play-setup.md) |
| Resolve a native Android or EAS build issue | [Android and EAS troubleshooting](troubleshooting/android-eas-builds.md) |
| Understand intended product and UI direction | [Product design reference](design/product-design.md) |

## Guide catalog

| Area | Document | Intended use |
|---|---|---|
| Development | [Development guide](development.md) | Local setup, daily commands, validation, and database workflow. |
| Release | [Android and Google Play release runbook](release/android-google-play.md) | Controlled process for producing and submitting Android releases. |
| Release | [Google Play setup reference](release/google-play-setup.md) | Compact prerequisite reference for Play Console and repository setup. |
| Troubleshooting | [Android and EAS troubleshooting](troubleshooting/android-eas-builds.md) | First-response checklist for dependency, EAS, and workflow failures. |
| Architecture | [Backend reference](../server/README.md) | Server ownership, API conventions, authentication, database, and environment variables. |
| Product design | [Product design reference](design/product-design.md) | Screen inventory, design language, and product-flow guidance. |
| Historical engineering record | [EAS Android codegen record](records/eas-android-codegen.md) | Context for the `brace-expansion` codegen compatibility safeguards. |
| Legal and store operations | [Legal directory](../legal/) | Privacy, terms, listing content, data safety, and reviewer-access materials. |

## Documentation conventions

Operational guides should be written for a reader completing a task. Each guide should state its purpose, prerequisites, exact commands or steps, expected outcome, and recovery path where a failure is likely. Project facts must be linked to their checked-in source of truth rather than copied into multiple documents.

Use the following boundaries when adding or updating documentation:

| Content | Preferred location |
|---|---|
| Overview, quick start, and high-level navigation | Repository-root [`README.md`](../README.md) |
| Contributor workflow and contribution standards | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| General developer workflow | `docs/development.md` |
| Release, store, and publication procedures | `docs/release/` |
| Diagnostic guides and durable incident context | `docs/troubleshooting/` and `docs/records/` |
| Product and interface rationale | `docs/design/` |
| Server-specific implementation and API guidance | `server/README.md` |
| Privacy, terms, and Play Console content | `legal/` |

> **Maintenance rule:** when code changes alter a documented command, configuration value, environment variable, release behavior, or user-facing capability, update the document that owns that contract in the same change.
