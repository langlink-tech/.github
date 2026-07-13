# Public Workspace Optimization Summary

- Status: proposed; no implementation is authorized by this document
- Owning repository: `langlink-tech/.github`
- Portfolio priority: P0
- Scope: public organization governance and reusable repository interfaces
- Baseline date: 2026-07-13, Asia/Shanghai

This public summary covers only reusable policy and organization-level
interfaces owned by this repository. Repository-specific risk inventories,
private rollout details, authentication inventories, runtime evidence, and
internal identifiers belong in access-controlled repository or governance
records.

## Goal

Make shared GitHub governance interfaces versioned, testable, low-noise, and
safe to consume across repositories while keeping private operational detail
out of the public organization repository.

## Context

This repository owns public community-health files, reusable quality
workflows, issue forms, label conventions, and the repository contract. These
interfaces have many consumers, so mutable references or drift can create
organization-wide maintenance and recovery work.

## Constraints

- Publish only reusable policy, templates, compatibility guidance, and
  appropriately sanitized status.
- Never record private repository inventories, machine-local paths, internal
  identifiers, authentication state, credential values, or value-bearing
  environment evidence.
- Use short-lived, job-scoped identity only where the default GitHub token is
  insufficient, and keep permission scope no broader than the approved job.
- Treat local validation, consumer CI, review, merge, rollout, and rollback as
  separate evidence states.
- Implementation requires a tracked issue, one primary writer, an isolated
  worktree, and representative consumer validation.

## Source Of Truth

| Concern | Source of truth |
|---|---|
| Public reusable interfaces | This repository's versioned files and releases |
| Implementation authorization | Tracked GitHub issue |
| Review and CI | Pull request, reviews, and required checks |
| Consumer compatibility | Representative consumer contract checks |
| Private operational detail | Access-controlled owning repository records |

## Non-Goals

- Publishing a private repository risk inventory or private migration log.
- Automatically changing branch rules, credentials, installations, or
  consumer repositories from a drift report.
- Replacing repository-local ownership, tests, or runtime verification.
- Claiming financial ROI before consumer, labor, incident, and maintenance
  baselines are measured.

## Work Packages

1. Public/private planning containment
   - Keep the public surface limited to reusable policy and sanitized status.
   - Apply a value-safe review to new planning and migration documentation.
   - Route any genuine exposure or history-remediation decision to the
     authorized security owner; documentation cleanup is not containment proof.
2. Version shared interfaces
   - Publish reviewed tags or immutable SHAs for reusable Node and Python
     quality workflows.
   - Maintain compatibility and rollback guidance for consumers.
   - Preserve a tested previous ref during each compatibility window.
3. Automate low-noise governance checks
   - Detect actionable taxonomy, contract, ownership, and workflow-version
     drift.
   - Require an owner and remediation path for every report.
   - Avoid automatic mutation of repositories, branch policy, or credentials.

## Dependencies

- Reviewed organization policy for reusable workflows and permissions.
- Representative Node and Python consumers for compatibility checks.
- Repository-local ownership and required checks in every consumer.
- Access-controlled records for any private implementation detail.

## Done When

- The public tree contains no private inventory, internal identifier,
  machine-local path, runtime authentication state, or value-bearing evidence.
- Active reusable-workflow consumers use a reviewed tag or immutable SHA with a
  documented compatibility and rollback window.
- Reusable workflow, issue-form, and label-contract checks pass.
- Drift reports are actionable, owned, and produce no repeated no-op issue.
- At least one representative Node and one Python consumer pass through the
  candidate interface before a shared workflow release.

## Verification Gates

- Parse workflow and issue-form YAML and the label manifest JSON.
- Run this repository's documentation and contract checks.
- Run representative consumer contract checks against the candidate ref.
- Verify actor and permission scope without printing or persisting credentials.
- Prove rollback with the previous reviewed ref on one pilot consumer.

For this documentation-only change, run `git diff --check` and a value-safe
scan for machine-local paths, internal identifiers, authentication state, and
secret-like material.

## Rollout, Rollback, and Stop Conditions

- Keep the last known-good tag or immutable SHA during the compatibility
  window.
- Stop when proposed permissions exceed the approved repository/job need.
- Stop when public documentation would expose private operational detail.
- Do not merge shared workflow changes until representative consumers pass.

## Priority and ROI

- Priority: P0, because shared interfaces and public/private containment have
  organization-wide reuse and risk-reduction leverage.
- First package: M.
- Impact score: 95.
- Benefit evidence confidence: High.
- Financial ROI: unknown.
- First executable action: review and sanitize the public planning surface,
  then track versioned workflow adoption through an approved issue.
- Required baseline inputs: consumer count, workflow migrations, rotations,
  authentication failures, repair hours, implementation cost, and maintenance
  effort.

## Public Evidence Anchors

- `docs/reusable-quality-workflows.md`
- `docs/repo-contract.md`
- `.github/workflows/`
- `.github/ISSUE_TEMPLATE/`

## GitHub Issue and PR Links

- Implementation issue: pending
- Pull request: pending
