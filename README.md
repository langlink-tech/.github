# LangLink GitHub Defaults

This repository provides the default GitHub community health files for LangLink repositories.

It contains:
- shared issue forms
- a shared pull request template
- a shared label manifest in `.github/labels.json`

Shared classification model:
- issue `type`: `Bug`, `Feature`, `Refactor`, `Chore`, `Spike`
- labels: `priority/*`, `area/*`

Notes:
- repositories with their own `.github/ISSUE_TEMPLATE/` or `pull_request_template.md` override these defaults
- some existing repositories may still contain legacy `kind/*` labels for historical issues, but they are no longer part of the default baseline
