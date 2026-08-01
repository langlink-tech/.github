# LangLink GitHub Defaults

This repository provides the default GitHub community health files for LangLink repositories.

It contains:
- shared issue forms
- a shared pull request template
- a shared label manifest in `.github/labels.json`
- reusable quality workflows in `.github/workflows/`
- engineering entrypoint templates in `templates/engineering-entry-standardization/`
- repository contract guidance in `docs/repo-contract.md`
- reusable workflow config in `docs/workflow-config.md`

Shared label taxonomy:
- `kind/*`: bug, feature, refactor, chore, spike, follow-up
- `priority/*`: p0, p1, p2
- `area/*`: backend, frontend, devops, data, docs, other, cross-cutting

Notes:
- repositories with their own `.github/ISSUE_TEMPLATE/` or `pull_request_template.md` override these defaults
- `CODEOWNERS` does not inherit from this repo; each repository needs its own `.github/CODEOWNERS`
- `.github/workflows/issue-form-labels.yml` is a normal `issues:` workflow, not `workflow_call`; GitHub does **not** inherit it with community health templates. It runs only in this repo unless a consumer copies it into their own `.github/workflows/`
- the label mapper runs only when an issue is opened. It maps `Task Type` to `kind/*` when that field exists and maps `Area` to `area/*` for any shared form that contains the field; later issue edits do not trigger remapping
- the Engineering Task form relies on that workflow for its `kind/*` default (it has no static `kind/*` label). Consumers that inherit the forms without copying the workflow will not get mapped labels automatically
- some existing repositories may still contain legacy `kind/*` labels for historical issues, but they are no longer part of the default baseline
- maintainer rollout, migration, and operator documentation is kept in the private governance control plane, not in this public repository

Reusable workflow entrypoints (pin the reviewed immutable SHA; do not leave consumers on mutable `@main`):
- `langlink-tech/.github/.github/workflows/reusable-node-quality.yml@7717a53d825005835142669a664b64f52f532304 # quality-workflows-v5`
- `langlink-tech/.github/.github/workflows/reusable-python-quality.yml@7717a53d825005835142669a664b64f52f532304 # quality-workflows-v5`
- `langlink-tech/.github/.github/workflows/reusable-secret-scan.yml@7717a53d825005835142669a664b64f52f532304 # quality-workflows-v5`

Shared setup composites (consumed by the reusable workflows above):
- `.github/actions/setup-node-pnpm`
- `.github/actions/setup-python-tooling`

Caller inventory and migration status live in the private control plane:
`langlink-tech/plunet-governance` → `docs/github-org/reusable-workflow-caller-matrix.md`

PR verification exception:
- this repository has no repository-owned PR workflow that exercises the reusable interfaces; platform-managed CodeQL may appear, but it does not validate those interfaces or representative callers
- until a dedicated self-test workflow is adopted, verify workflow-only PRs with YAML parsing plus the `plunet-governance` all-workflow static audit; a green CodeQL result or zero reusable-workflow checks is not evidence that interface validation was skipped or completed

Engineering entrypoint templates:
- `templates/engineering-entry-standardization/Taskfile.node.yml`
- `templates/engineering-entry-standardization/Taskfile.python-uv.yml`
- `templates/engineering-entry-standardization/Taskfile.python-pip.yml`
- `templates/engineering-entry-standardization/Taskfile.compose.yml`
- `templates/engineering-entry-standardization/renovate.json`
- `templates/engineering-entry-standardization/verification-checklist.md`
