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
- some existing repositories may still contain legacy `kind/*` labels for historical issues, but they are no longer part of the default baseline
- maintainer rollout, migration, and operator documentation is kept in the private governance control plane, not in this public repository

Reusable workflow entrypoints (pin a reviewed tag or SHA; do not leave consumers on mutable `@main`):
- `langlink-tech/.github/.github/workflows/reusable-node-quality.yml@quality-workflows-v1`
- `langlink-tech/.github/.github/workflows/reusable-python-quality.yml@quality-workflows-v1`

Shared setup composites (consumed by the reusable workflows above):
- `.github/actions/setup-node-pnpm`
- `.github/actions/setup-python-tooling`

Caller inventory and migration status live in the private control plane:
`langlink-tech/plunet-governance` → `docs/github-org/reusable-workflow-caller-matrix.md`

Engineering entrypoint templates:
- `templates/engineering-entry-standardization/Taskfile.node.yml`
- `templates/engineering-entry-standardization/Taskfile.python-uv.yml`
- `templates/engineering-entry-standardization/Taskfile.python-pip.yml`
- `templates/engineering-entry-standardization/Taskfile.compose.yml`
- `templates/engineering-entry-standardization/renovate.json`
- `templates/engineering-entry-standardization/verification-checklist.md`
