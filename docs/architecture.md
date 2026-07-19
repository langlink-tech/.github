# Architecture

This repository is a GitHub governance bundle, not an application runtime.

## Repository Role

`README.md` defines this repository as the source of LangLink's default GitHub
community health files. In committed files today, that means:

- shared issue forms in `.github/ISSUE_TEMPLATE/`
- a shared PR template in `.github/pull_request_template.md`
- a shared label manifest in `.github/labels.json`
- reusable CI entrypoints in `.github/workflows/reusable-node-quality.yml`
  and `.github/workflows/reusable-python-quality.yml`
- public contract guidance in `docs/repo-contract.md`,
  `docs/reusable-quality-workflows.md`, and `docs/workflow-config.md`

## Component Map

| Path | Responsibility | Consumption mode |
| --- | --- | --- |
| `README.md` | Human-readable summary of what this repo publishes and where overrides apply | Read by maintainers and adopters |
| `.github/ISSUE_TEMPLATE/01-bug-report.yml` | Structured intake for broken behavior, with default label `kind/bug` | Inherited by repos that do not override issue forms |
| `.github/ISSUE_TEMPLATE/02-feature-request.yml` | Structured intake for new capability requests, with default label `kind/feature` | Inherited by repos that do not override issue forms |
| `.github/ISSUE_TEMPLATE/03-engineering-task.yml` | Structured intake for refactors, chores, spikes, and follow-ups; no static `kind/*` default | Inherited by repos that do not override issue forms; label mapping requires a local copy of `issue-form-labels.yml` |
| `.github/ISSUE_TEMPLATE/config.yml` | Disables blank issues | Inherited by repos that do not override issue form config |
| `.github/pull_request_template.md` | Shared PR metadata contract | Inherited by repos that do not override the PR template |
| `.github/labels.json` | Default label taxonomy for `kind/*`, `priority/*`, and `area/*` | Applied when maintainers sync labels into consuming repos |
| `.github/workflows/issue-form-labels.yml` | Maps Engineering Task fields to `kind/*` / `area/*` on `issues: opened` | Local to each repo; not inherited with community health files; consumers must copy it |
| `.github/workflows/reusable-node-quality.yml` | Reusable Node quality workflow exposed through `workflow_call` | Explicitly called from consuming repos |
| `.github/workflows/reusable-python-quality.yml` | Reusable Python quality workflow exposed through `workflow_call` | Explicitly called from consuming repos |
| `.github/CODEOWNERS` | Owner rule for this repository itself | Local to this repo; not inherited |
| `docs/repo-contract.md` | Baseline expectations for active repositories | Read during repo setup and cleanup |
| `docs/reusable-quality-workflows.md` | Human-readable guide for the reusable workflow interfaces | Read before wiring consumer repos to the shared workflows |
| `docs/workflow-config.md` | Committed workflow inputs and label taxonomy | Read before changing reusable workflow contracts |

## Architecture Boundaries

This repo owns four things:

1. Intake structure for issues and PRs.
2. Reusable CI building blocks for Node and Python repositories.
3. Documentation for what a compliant repo should contain.
4. Public contract guidance for shared governance assets.

This repo does not own:

- repo-specific `.github/CODEOWNERS`; each repository must keep its own file
- repo-specific deployment or domain checks
- GitHub UI state such as Project workflow automation and branch protection

Maintainer rollout order and operator settings are documented in the private
governance control plane, not in this public repository.

## Reuse Model

There are two reuse paths in this architecture.

### Passive defaults

Issue templates and the PR template act as default community health files. A
repository-level `.github/ISSUE_TEMPLATE/` or `pull_request_template.md`
overrides them.

Ordinary `issues:` workflows such as `issue-form-labels.yml` are not community
health files and are not inherited. Consumers that want Engineering Task label
mapping must copy that workflow into their own repository.

### Explicit CI composition

The reusable quality workflow files are entrypoints with `on.workflow_call`,
required inputs such as `cache-dependency-path` and `install-command`, and
optional command hooks for linting, tests, builds, and invariants. Consuming
repositories opt in by calling these files from their own workflow YAML.
