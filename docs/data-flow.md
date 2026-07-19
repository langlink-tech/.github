# Data Flow

This repo moves governance data, not application data. The flows below are
derived from the committed templates and workflow files in this repository.

## 1. Issue Intake Flow

Source files:

- `.github/ISSUE_TEMPLATE/01-bug-report.yml`
- `.github/ISSUE_TEMPLATE/02-feature-request.yml`
- `.github/ISSUE_TEMPLATE/03-engineering-task.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/labels.json`

Flow:

1. A consuming repository without its own issue-form override inherits one of
   the shared forms.
2. The form applies a default `kind/*` label immediately when the template sets one:
   - bug report -> `kind/bug`
   - feature request -> `kind/feature`
   - engineering task -> no static default; label mapping needs `.github/workflows/issue-form-labels.yml` in the **same** repository (Task Type → `kind/refactor` / `kind/chore` / `kind/spike` / `kind/follow-up`, Area → `area/*`)
3. The reporter fills structured fields such as `area`, `summary`,
   `background`, `acceptance-criteria`, and optional `context`.
4. Bug/feature issues enter triage with their static `kind/*` label. Engineering
   Task issues only get mapped `kind/*` / `area/*` when the consumer copied
   `issue-form-labels.yml`; inheritance of the form alone is not enough.

What does not flow from this repo:

- repo-specific `CODEOWNERS`; that must exist in each consumer repo
- `issue-form-labels.yml`; it is not a community health file and must be copied
  into each consumer that wants Engineering Task label mapping

## 2. Pull Request Template Flow

Source files:

- `.github/pull_request_template.md`

Flow:

1. A consuming repository without its own PR template inherits
   `.github/pull_request_template.md`.
2. The author is prompted to provide summary, related issue linkage, type of
   change, verification checklist, and test plan.

Merge policy and Project automation are operator settings documented in the
private governance control plane.

## 3. Reusable Node Quality Flow

Source files:

- `.github/workflows/reusable-node-quality.yml`
- `docs/reusable-quality-workflows.md`

Flow:

1. A consumer workflow calls `.github/workflows/reusable-node-quality.yml`
   through `workflow_call`.
2. Inputs provide repository-specific execution details such as working
   directory, Node version, package manager, dependency cache path, and command
   hooks for install, lint, typecheck, test, and build.
3. Each enabled job performs checkout, runtime setup, dependency install, and
   the job-specific command.
4. If tests are enabled, the workflow expands `test-shards` into a matrix and
   exposes the selected shard through `TEST_SHARD`.

The data that crosses the boundary from the consuming repo into this repo is
command text plus dependency metadata. The reusable workflow runs those commands
but does not define repo-specific business assertions.

## 4. Reusable Python Quality Flow

Source files:

- `.github/workflows/reusable-python-quality.yml`
- `docs/reusable-quality-workflows.md`

Flow:

1. A consumer workflow calls `.github/workflows/reusable-python-quality.yml`
   through `workflow_call`.
2. Inputs provide working directory, Python version, installer choice, dependency
   cache path, install/lint/invariant/test commands, and optional artifact
   upload settings.
3. Each enabled job performs checkout, installer validation, runtime setup,
   dependency install, and the job-specific command.
4. When `upload-source-artifact` is true, the `tests` job archives `HEAD` into
   `repo-source.tgz` and uploads it with `actions/upload-artifact@v6`.

This flow turns repo-local quality commands into a shared execution shape
without centralizing package manifests or source code in this repository.
