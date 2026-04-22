# Runbook

This runbook is for maintainers of `/Users/floyd/Projects/.github`. It assumes changes must stay inside the governance baseline published by this repository.

## What To Change Here

Use this repo when the desired change belongs to one of these surfaces:

- shared issue intake shape in `.github/ISSUE_TEMPLATE/`
- shared PR metadata in `.github/pull_request_template.md`
- shared label taxonomy in `.github/labels.json`
- shared reusable CI entrypoints in `.github/workflows/`
- shared governance guidance in `README.md` or `docs/*.md`

Do not use this repo for:

- repo-specific `CODEOWNERS` rollout into product repos
- domain-specific CI jobs
- deployment steps
- GitHub UI-only settings such as branch protection or Project automation values

## Change Procedure

### 1. Intake And Taxonomy Changes

When editing issue forms, PR template, or labels:

1. Read `README.md` for the published baseline and override notes.
2. Check `.github/labels.json` before changing any form defaults, dropdown values, or wording that implies taxonomy.
3. Keep `.github/ISSUE_TEMPLATE/config.yml` aligned if intake policy changes.
4. If the change affects rollout expectations, update `docs/governance-rollout-checklist.md` or `docs/repo-contract.md` in a separate docs task.

Local files to inspect together:

- `.github/ISSUE_TEMPLATE/01-bug-report.yml`
- `.github/ISSUE_TEMPLATE/02-feature-request.yml`
- `.github/ISSUE_TEMPLATE/03-engineering-task.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/labels.json`
- `.github/pull_request_template.md`

### 2. Reusable Workflow Changes

When editing `.github/workflows/reusable-node-quality.yml` or `.github/workflows/reusable-python-quality.yml`:

1. Preserve the `workflow_call` interface unless you intentionally want a breaking change.
2. Re-check required inputs, default values, accepted package-manager or installer values, and job names.
3. Update `docs/reusable-quality-workflows.md` if examples or supported inputs drift.
4. Re-read `docs/repo-contract.md` to confirm the workflow still fits the intended split between shared quality gates and repo-specific jobs.

## Rollout Procedure

Use `docs/governance-rollout-checklist.md` as the source of truth for rollout order and target state.

Current documented sequence:

1. Push shared AI / governance changes from `dotfiles`.
2. Push this `.github` repository.
3. Push downstream product repositories so repo-specific files catch up.

Current documented follow-up checks:

- product repos still have `.github/CODEOWNERS`
- `CLAUDE.md` and `PROJECT_RULES.md` follow the shared skeleton
- merge settings still match the intended solo-phase or team-phase state
- Project workflow values still set the expected `Status`

## Local Verification

After editing this repo, run local path and name checks before calling the change done. Minimal checks:

```bash
rg -n "reusable-node-quality|reusable-python-quality|labels.json|pull_request_template.md|01-bug-report|02-feature-request|03-engineering-task|CODEOWNERS" README.md docs .github
rg -n "^name: Reusable Node Quality|^name: Reusable Python Quality" .github/workflows/reusable-*.yml
file docs/architecture.md docs/data-flow.md docs/config.md docs/runbook.md docs/debt.md
```

Add narrower `rg` checks when a document cites a more specific path or workflow field.

## Drift Audit

`docs/governance-rollout-checklist.md` says to run a light governance audit at least monthly. For this repo, that means confirming:

- the published baseline in `README.md` still matches the files actually present
- `docs/reusable-quality-workflows.md` still matches the current `workflow_call` inputs
- `docs/repo-contract.md` and `docs/governance-rollout-checklist.md` still reflect the current operating model
- known gaps in [debt.md](./debt.md) are still accurate or have been retired

## 新人两小时读懂项目

Suggested onboarding sequence:

1. `0-20` minutes: read `README.md` and [architecture.md](./architecture.md) to understand what this repo publishes and what it does not own.
2. `20-45` minutes: read `.github/ISSUE_TEMPLATE/*.yml`, `.github/pull_request_template.md`, and `.github/labels.json` together to understand intake and taxonomy.
3. `45-75` minutes: read `docs/reusable-quality-workflows.md` and then both reusable workflow YAML files to understand the CI contract surface.
4. `75-100` minutes: read `docs/repo-contract.md` and `docs/governance-rollout-checklist.md` to understand downstream expectations and rollout order.
5. `100-120` minutes: read [data-flow.md](./data-flow.md), [config.md](./config.md), and [debt.md](./debt.md), then run the local verification commands once yourself.
