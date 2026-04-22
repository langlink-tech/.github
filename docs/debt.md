# Debt

This page tracks governance-repo debt visible from committed local files. Each entry includes the impact, evidence, likely fix surface, and priority.

## 1. Area Taxonomy Does Not Fully Line Up Across Labels And Forms

- Impact: issue intake can collect values that do not map cleanly to the shipped label baseline, which makes triage and reporting less consistent across repositories.
- Evidence: `.github/ISSUE_TEMPLATE/01-bug-report.yml` includes `other`; `.github/ISSUE_TEMPLATE/02-feature-request.yml` and `.github/ISSUE_TEMPLATE/03-engineering-task.yml` include `cross-cutting`; `.github/labels.json` only ships `area/frontend`, `area/backend`, `area/devops`, `area/data`, and `area/docs`; `README.md` lists the same narrower `area/*` baseline.
- Likely fix surface: `.github/ISSUE_TEMPLATE/*.yml`, `.github/labels.json`, `README.md`, and `docs/config.md`.
- Priority: P1

## 2. Engineering Task Form Loses Task-Type Fidelity

- Impact: refactors and spikes can be filed through the shared engineering-task form but still land with the same default label `kind/chore`, so dashboards and backlog slices based on labels under-report the actual mix of internal work.
- Evidence: `.github/ISSUE_TEMPLATE/03-engineering-task.yml` collects `task-kind` values `refactor`, `chore`, `spike`, and `follow-up`, but the form applies only `kind/chore`; `.github/labels.json` already contains `kind/refactor` and `kind/spike`, while no `kind/follow-up` label exists.
- Likely fix surface: `.github/ISSUE_TEMPLATE/03-engineering-task.yml`, `.github/labels.json`, and any downstream label-sync process.
- Priority: P1

## 3. Rollout Checklist Still Uses An Older Local Repo Path Name

- Impact: maintainers can follow the right rollout order but still look for the wrong local checkout name, which slows onboarding and increases the chance of editing the wrong clone.
- Evidence: `docs/governance-rollout-checklist.md` refers to `~/projects/langlink-tech-org-dotgithub`, while the active repository in this workspace is `/Users/floyd/Projects/.github` and `README.md` presents the repository simply as `.github`.
- Likely fix surface: `docs/governance-rollout-checklist.md` and any other docs that repeat the older local path alias.
- Priority: P1

## 4. Reusable Workflow Maintenance Surface Is Repetitive

- Impact: a simple runtime or setup change has to be repeated across multiple jobs in both reusable workflows, which raises review cost and makes drift between jobs more likely.
- Evidence: `.github/workflows/reusable-node-quality.yml` repeats checkout, package-manager validation, package-manager setup, Node setup, and install steps in `lint`, `typecheck`, `tests`, and `build`; `.github/workflows/reusable-python-quality.yml` repeats the same structure across `lint`, `invariants`, and `tests`.
- Likely fix surface: `.github/workflows/reusable-node-quality.yml`, `.github/workflows/reusable-python-quality.yml`, or a shared composite action introduced specifically for common setup.
- Priority: P2

## 5. Governance Drift Detection Is Mostly Manual

- Impact: branch settings, project workflow values, repo contract drift, and downstream adoption gaps can remain unnoticed until a human remembers to audit them.
- Evidence: `docs/governance-rollout-checklist.md` prescribes a monthly light governance audit, but the committed workflow directory contains only `reusable-node-quality.yml` and `reusable-python-quality.yml`; there is no audit workflow or script in this repo to check the documented baseline automatically.
- Likely fix surface: a new audit workflow under `.github/workflows/`, supporting scripts if needed, and the rollout docs.
- Priority: P2
