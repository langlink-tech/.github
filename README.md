# LangLink GitHub Defaults

This repository provides the default GitHub community health files for LangLink repositories.

It contains:
- shared issue forms
- a shared pull request template
- a shared label manifest in `.github/labels.json`
- reusable quality workflows in `.github/workflows/`
- engineering entrypoint templates in `templates/engineering-entry-standardization/`
- repository contract guidance in `docs/repo-contract.md`
- governance rollout notes in `docs/governance-rollout-checklist.md`

Shared label taxonomy:
- `kind/*`: bug, feature, refactor, chore, spike
- `priority/*`: p0, p1, p2
- `area/*`: backend, frontend, devops, data, docs

Notes:
- repositories with their own `.github/ISSUE_TEMPLATE/` or `pull_request_template.md` override these defaults
- `CODEOWNERS` does not inherit from this repo; each repository needs its own `.github/CODEOWNERS`
- some existing repositories may still contain legacy `kind/*` labels for historical issues, but they are no longer part of the default baseline

Reusable workflow entrypoints:
- `langlink-tech/.github/.github/workflows/reusable-node-quality.yml@main`
- `langlink-tech/.github/.github/workflows/reusable-python-quality.yml@main`

Engineering entrypoint templates:
- `templates/engineering-entry-standardization/Taskfile.node.yml`
- `templates/engineering-entry-standardization/Taskfile.python-uv.yml`
- `templates/engineering-entry-standardization/Taskfile.python-pip.yml`
- `templates/engineering-entry-standardization/Taskfile.compose.yml`
- `templates/engineering-entry-standardization/renovate.json`
- `templates/engineering-entry-standardization/verification-checklist.md`
