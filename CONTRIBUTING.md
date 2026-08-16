# Contributing to The Ice Cream Man

Thank you for contributing to The Ice Cream Man. This guide defines the expected workflow for code, tests, configuration, and documentation changes. Follow the [development guide](docs/development.md) to set up and run the repository.

## Community standards

Contributions should be respectful, specific, and constructive. Discuss the technical issue, the proposed behavior, and the evidence for a change. Do not include credentials, personal data, private test-account details, or service-account material in issues, commits, pull requests, screenshots, or documentation.

## Prepare a change

Fork the repository if you do not have write access, then create a focused branch from the current default branch.

```bash
git clone https://github.com/YOUR_USERNAME/Ice-cream-man-app.git
cd Ice-cream-man-app
git remote add upstream https://github.com/Mgfromthe503/Ice-cream-man-app.git
git checkout -b type/concise-change-name
pnpm install
```

Choose a branch name that describes the purpose of the change, such as `feat/driver-report-export`, `fix/android-build`, or `docs/release-runbook`.

## Development expectations

Keep changes scoped to the requested behavior. Update tests, types, configuration, and documentation when they define the changed contract. Preserve existing public interfaces unless a breaking change is explicitly intended and documented.

| Area | Expectation |
|---|---|
| TypeScript | Use clear types and avoid `any` unless a boundary genuinely requires it. |
| Components | Follow existing React Native, Expo Router, and NativeWind patterns in the surrounding feature. |
| Naming | Use PascalCase for components, `use…` names for hooks, and existing repository conventions for files and constants. |
| Configuration | Update the responsible source of truth and do not duplicate sensitive values in documentation. |
| Tests | Add or update focused Vitest coverage when behavior changes can be reliably tested. |
| Documentation | Update the document that owns the command, configuration, operational process, or public capability. |

## Validate before opening a pull request

Run the applicable checks locally. The following sequence is the standard full validation for an application change:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
git diff --check
git diff --stat
```

Use `pnpm verify:deps` whenever dependency versions, lockfiles, Android tooling, or EAS behavior may be affected. Run `pnpm format` when formatting is needed, then inspect the resulting diff before committing.

| Change type | Minimum additional validation |
|---|---|
| Client or server behavior | Focused test coverage plus `pnpm test`. |
| Database schema | Review generated Drizzle migration, test against an appropriate database, and update owning documentation. |
| Android, EAS, or dependency configuration | `pnpm verify:deps`, relevant build validation, and the [Android release documentation](docs/release/android-google-play.md). |
| Documentation only | Verify all relative links, code samples, and referenced commands. |

## Commit messages

Use concise Conventional Commit-style messages that describe the intent of the change.

```text
feat(driver): add daily report export
fix(android): restore EAS codegen compatibility
docs(release): clarify Play submission prerequisites
test(requests): cover request acceptance flow
```

A commit message should state what changed, not merely that files were edited.

## Pull request expectations

A pull request should describe the problem, the implementation, validation performed, and any risk or follow-up required. Link related issues where applicable. Include screenshots or recordings for user-interface changes when they make the result easier to review.

| Pull-request section | Include |
|---|---|
| Purpose | The user or maintenance problem the change addresses. |
| Implementation | The key design choice and affected areas. |
| Validation | Exact commands, checks, or devices used and their outcomes. |
| Risks or follow-up | Unverified environments, migration steps, release notes, or dependencies on external configuration. |

Do not force-push a shared review branch unless the reviewer or maintainer asks. Resolve review comments with code changes or a concise explanation grounded in project behavior.

## Documentation responsibilities

The documentation structure is task-oriented. Use the [documentation index](docs/README.md) to choose the correct location.

| If a change affects… | Update… |
|---|---|
| Quick start, high-level capability, or repository navigation | [`README.md`](README.md) |
| Local commands and developer workflow | [`docs/development.md`](docs/development.md) |
| Android release or Play submission process | [`docs/release/`](docs/release/) |
| Build failure diagnosis or incident context | [`docs/troubleshooting/`](docs/troubleshooting/) or [`docs/records/`](docs/records/) |
| Server interface, API, database, auth, or environment configuration | [`server/README.md`](server/README.md) |
| Privacy, terms, store listing, Data Safety, or reviewer access | [`legal/`](legal/) |

## Report an issue or propose an improvement

A useful bug report includes the affected version or commit, clear reproduction steps, expected and observed results, relevant non-sensitive logs, and device or operating-system context. A useful feature proposal explains the user problem, expected outcome, and meaningful constraints or alternatives.

Before reporting a security-sensitive issue, avoid publishing exploitable details or credentials. Use the repository owner’s preferred private reporting channel when one is available.
