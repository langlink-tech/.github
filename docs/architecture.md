# Architecture

This repository is a GitHub governance bundle, not an application runtime. The description below is derived from `README.md`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `.github/labels.json`, `.github/workflows/*`, `docs/repo-contract.md`, and `docs/governance-rollout-checklist.md`.

## Repository Role

`README.md` defines this repository as the source of LangLink's default GitHub community health files. In committed files today, that means:

- shared issue forms in `.github/ISSUE_TEMPLATE/`
- a shared PR template in `.github/pull_request_template.md`
- a shared label manifest in `.github/labels.json`
- reusable CI entrypoints in `.github/workflows/reusable-node-quality.yml` and `.github/workflows/reusable-python-quality.yml`
- rollout and contract guidance in `docs/repo-contract.md`, `docs/reusable-quality-workflows.md`, and `docs/governance-rollout-checklist.md`

## Component Map

| Path | Responsibility | Consumption mode |
| --- | --- | --- |
| `README.md` | Human-readable summary of what this repo publishes and where overrides apply | Read by maintainers and adopters |
| `.github/ISSUE_TEMPLATE/01-bug-report.yml` | Structured intake for broken behavior, with default label `kind/bug` | Inherited by repos that do not override issue forms |
| `.github/ISSUE_TEMPLATE/02-feature-request.yml` | Structured intake for new capability requests, with default label `kind/feature` | Inherited by repos that do not override issue forms |
| `.github/ISSUE_TEMPLATE/03-engineering-task.yml` | Structured intake for refactors, chores, spikes, and follow-ups, with default label `kind/chore` | Inherited by repos that do not override issue forms |
| `.github/ISSUE_TEMPLATE/config.yml` | Disables blank issues | Inherited by repos that do not override issue form config |
| `.github/pull_request_template.md` | Shared PR metadata contract: summary, linked issue, type, checklist, test plan | Inherited by repos that do not override the PR template |
| `.github/labels.json` | Default label taxonomy for `kind/*`, `priority/*`, and `area/*` | Applied when maintainers sync labels into consuming repos |
| `.github/workflows/reusable-node-quality.yml` | Reusable Node quality workflow exposed through `workflow_call` | Explicitly called from consuming repos |
| `.github/workflows/reusable-python-quality.yml` | Reusable Python quality workflow exposed through `workflow_call` | Explicitly called from consuming repos |
| `.github/CODEOWNERS` | Owner rule for this repository itself | Local to this repo; not inherited |
| `docs/repo-contract.md` | Baseline expectations for active repositories | Read during repo setup and cleanup |
| `docs/reusable-quality-workflows.md` | Human-readable guide for the reusable workflow interfaces | Read before wiring consumer repos to the shared workflows |
| `docs/governance-rollout-checklist.md` | Rollout order, Project settings, repo checklist, and monthly drift checks | Read during adoption and audits |

## Architecture Boundaries

This repo owns four things:

1. Intake structure for issues and PRs.
2. Reusable CI building blocks for Node and Python repositories.
3. Documentation for what a compliant repo should contain.
4. Rollout guidance for how shared governance changes land across product repos.

This repo does not own:

- repo-specific `.github/CODEOWNERS`; `README.md` and `docs/governance-rollout-checklist.md` both say each repository must keep its own file
- repo-specific deployment or domain checks; `docs/repo-contract.md` says reusable workflows should cover the shared quality gate, while repo-specific jobs stay in the consuming repo for domain invariants and deployment packaging
- GitHub UI state such as Project workflow automation and branch protection; those settings are documented in `docs/governance-rollout-checklist.md`, not encoded as workflow files here

## Reuse Model

There are two reuse paths in this architecture.

### Passive defaults

`README.md` says issue templates and the PR template act as default community health files, and that a repository-level `.github/ISSUE_TEMPLATE/` or `pull_request_template.md` overrides them. That makes these files a baseline, not an enforcement layer.

### Explicit CI composition

The two workflow files are not passive defaults. They are reusable entrypoints with `on.workflow_call`, required inputs such as `cache-dependency-path` and `install-command`, and optional command hooks for linting, tests, builds, and invariants. Consuming repositories opt in by calling these files from their own workflow YAML.

## Update Surfaces

The committed repo shows three update surfaces with different rollout costs:

- Low-cost doc updates: `README.md` and `docs/*.md`
- Medium-cost metadata updates: issue forms, PR template, and `labels.json`, which may require re-sync into consuming repositories
- Highest-cost CI contract updates: `.github/workflows/*.yml`, because consuming repositories rely on the `workflow_call` interface and command semantics

`docs/governance-rollout-checklist.md` shows that shared governance changes are expected to land in an ordered rollout, with this `.github` repo updated before downstream product repositories receive repo-specific governance files.
