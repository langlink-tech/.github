# Data Flow

This repo moves governance data, not application data. The flows below are derived from the committed templates, workflow files, and rollout docs in this repository.

## 1. Issue Intake Flow

Source files:

- `.github/ISSUE_TEMPLATE/01-bug-report.yml`
- `.github/ISSUE_TEMPLATE/02-feature-request.yml`
- `.github/ISSUE_TEMPLATE/03-engineering-task.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/labels.json`

Flow:

1. A consuming repository without its own issue-form override inherits one of the shared forms.
2. The form applies a default `kind/*` label immediately:
   - bug report -> `kind/bug`
   - feature request -> `kind/feature`
   - engineering task -> `kind/chore`
3. The reporter fills structured fields such as `area`, `summary`, `background`, `acceptance-criteria`, and optional `context`.
4. The resulting issue enters repo and project triage with a stable default `kind/*` label plus structured fields such as `area`, `summary`, `acceptance-criteria`, and `context`.

What does not flow from this repo:

- project status automation itself; `docs/governance-rollout-checklist.md` documents the expected `Plunet Platform` workflow values, but those values live in GitHub UI state
- repo-specific `CODEOWNERS`; that must exist in each consumer repo

## 2. Pull Request Governance Flow

Source files:

- `.github/pull_request_template.md`
- `docs/governance-rollout-checklist.md`

Flow:

1. A consuming repository without its own PR template inherits `.github/pull_request_template.md`.
2. The author is prompted to provide:
   - summary
   - related issue linkage
   - type of change
   - verification checklist
   - test plan
3. `docs/governance-rollout-checklist.md` supplies the surrounding merge policy for the current solo phase:
   - squash only
   - delete branch on merge
   - zero required approvals
   - no required code-owner review yet
4. After merge, the same rollout checklist documents the expected project-state transition to `Done` or `Review`, depending on how the project workflow is configured.

## 3. Reusable Node Quality Flow

Source files:

- `.github/workflows/reusable-node-quality.yml`
- `docs/reusable-quality-workflows.md`

Flow:

1. A consumer workflow calls `.github/workflows/reusable-node-quality.yml` through `workflow_call`.
2. Inputs provide repository-specific execution details:
   - working directory
   - Node version
   - package manager and optional version
   - dependency cache path
   - install, lint, typecheck, test, and build commands
3. Each enabled job performs the same pipeline skeleton:
   - `actions/checkout@v6`
   - package-manager validation
   - `pnpm/action-setup@v5` when `package-manager` is `pnpm`
   - `actions/setup-node@v6`
   - install command
   - the job-specific command
4. If tests are enabled, the workflow expands `test-shards` into a matrix and exposes the selected shard through `TEST_SHARD`.

The data that crosses the boundary from the consuming repo into this repo is command text plus dependency metadata. The reusable workflow runs those commands but does not define repo-specific business assertions.

## 4. Reusable Python Quality Flow

Source files:

- `.github/workflows/reusable-python-quality.yml`
- `docs/reusable-quality-workflows.md`

Flow:

1. A consumer workflow calls `.github/workflows/reusable-python-quality.yml` through `workflow_call`.
2. Inputs provide:
   - working directory
   - Python version
   - installer choice (`pip` or `uv`)
   - optional `uv` version
   - dependency cache path
   - install, lint, invariant, and test commands
   - optional artifact upload toggle
3. Each enabled job performs checkout, installer validation, runtime setup, dependency install, and the job-specific command.
4. When `upload-source-artifact` is true, the `tests` job archives `HEAD` into `repo-source.tgz` and uploads it with `actions/upload-artifact@v6`.

This flow turns repo-local quality commands into a shared execution shape without centralizing package manifests or source code in this repository.

## 5. Rollout And Update Flow

Source files:

- `docs/governance-rollout-checklist.md`
- `docs/repo-contract.md`
- `README.md`

Flow:

1. Maintainers update shared governance assets in this repository.
2. `docs/governance-rollout-checklist.md` says shared guidance should land before repo-level files, and gives a push order with this `.github` repo ahead of product repos.
3. Product repos then apply or re-apply repo-specific files such as `.github/CODEOWNERS`, `CLAUDE.md`, and `PROJECT_RULES.md`.
4. Monthly drift checks compare live repo settings and files against the documented baseline.

The important architectural property is that this repo publishes the baseline, while downstream repos and GitHub UI settings complete the rollout.
