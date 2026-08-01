# Workflow Config

This page documents the committed configuration surface for reusable workflows
and the shared label taxonomy in `langlink-tech/.github`.

## Committed Config Sources

| Path | Config surface | Key values or behavior |
| --- | --- | --- |
| `README.md` | Published baseline and override rules | Declares the repo as the default GitHub community health source, lists the shipped assets, says repo-local issue templates or PR template override these defaults, says `CODEOWNERS` is not inherited, and says `issue-form-labels.yml` must be copied by consumers |
| `.github/ISSUE_TEMPLATE/config.yml` | Issue intake guardrail | `blank_issues_enabled: false` |
| `.github/ISSUE_TEMPLATE/01-bug-report.yml` | Bug issue form | Default label `kind/bug`; required fields for `area`, `summary`, `background`, `desired-outcome`, `acceptance-criteria` |
| `.github/ISSUE_TEMPLATE/02-feature-request.yml` | Feature issue form | Default label `kind/feature`; required fields for `area`, `summary`, `background`, `desired-outcome`, `in-scope`, `acceptance-criteria` |
| `.github/ISSUE_TEMPLATE/03-engineering-task.yml` | Engineering task form | No static `kind/*` default; mapped labels require a local `issue-form-labels.yml`; required fields for `task-kind`, `area`, `summary`, `motivation`, `in-scope`, `acceptance-criteria` |
| `.github/pull_request_template.md` | PR submission contract | Sections for summary, related issue, change type, checklist, and test plan |
| `.github/labels.json` | Label taxonomy | `kind/*`, `priority/*`, `area/*` labels with names, colors, and descriptions |
| `.github/workflows/issue-form-labels.yml` | Issue-form taxonomy mapper | Ordinary `issues: opened` workflow; maps `Task Type` when present and maps `Area` on any shared form; not inherited; consumers copy it into their repo |
| `.github/workflows/reusable-node-quality.yml` | Shared Node CI contract | Reusable workflow with `workflow_call` inputs and `contents: read` permission |
| `.github/workflows/reusable-python-quality.yml` | Shared Python CI contract | Reusable workflow with `workflow_call` inputs and `contents: read` permission |
| `.github/workflows/reusable-secret-scan.yml` | Shared secret-scan contract | Reusable report-only-by-default workflow; inherits the caller's permission ceiling and can optionally attempt SARIF upload |
| `.github/actions/setup-node-pnpm/action.yml` | Shared Node setup composite | Checkout-independent install setup for pnpm/npm |
| `.github/actions/setup-python-tooling/action.yml` | Shared Python setup composite | pip/uv install setup shared across quality jobs |
| `docs/repo-contract.md` | Required repo contract | Defines required files, local command entrypoints, repo archetypes, and the rule to prefer reusable workflows |

## Versioning And Pinning

Consumers must pin reusable workflows to a reviewed tag or immutable SHA, not
mutable `@main`.

Current reviewed release:

- Tag: `quality-workflows-v5`
- Immutable SHA: `7717a53d825005835142669a664b64f52f532304`
- Limited rollback: `quality-workflows-v4` / `73402fee64cf93c846005ca00c7c3d86f1250d95`
  is callable for Node and Python compatibility only. Secret Scan callers must
  remain on v5 because v5 preserves least-privilege caller permissions.

Compatibility window: keep the prior SHA callable for at least 14 days after a
new tag. `@main` is emergency fallback only and must carry an expiry date in the
caller matrix.

Example:

```yaml
jobs:
  quality:
    uses: langlink-tech/.github/.github/workflows/reusable-node-quality.yml@7717a53d825005835142669a664b64f52f532304 # quality-workflows-v5
```

## Reusable Workflow Input Contracts

### `reusable-node-quality.yml`

Declared inputs:

- `working-directory`: default `.`
- `node-version`: default `22`
- `package-manager`: default `pnpm`
- `package-manager-version`: default empty string
- `cache-dependency-path`: required
- `install-command`: required
- `lint-command`: default empty string
- `typecheck-command`: default empty string
- `test-command`: default empty string
- `test-shards`: default `["1/1"]`
- `build-command`: default empty string
- `timeout-minutes`: default `20`
- `combine-static-checks`: default `false` (when true, lint + typecheck share one job)
- `actionlint-enabled`: default `true`
- `actionlint-shellcheck`: default `false`

Behavior gates:

- only `pnpm` and `npm` are accepted
- jobs run only when their corresponding command input is non-empty
- test sharding is implemented through a job matrix and `TEST_SHARD`
- setup is provided by `langlink-tech/.github/.github/actions/setup-node-pnpm@be4f67a71a9db35ca52748af9205d57f6684522a` (fully qualified and immutable; relative `./` paths resolve against the caller and break cross-repo reuse)

### `reusable-python-quality.yml`

Declared inputs:

- `working-directory`: default `.`
- `python-version`: default `3.11`
- `installer`: default `pip`
- `uv-version`: default `0.11.6`
- `cache-dependency-path`: required
- `install-command`: required
- `lint-command`: default empty string
- `invariant-command`: default empty string
- `test-command`: default empty string
- `upload-source-artifact`: default `false`
- `source-artifact-name`: default `repo-source`
- `timeout-minutes`: default `20`
- `actionlint-enabled`: default `true`
- `actionlint-shellcheck`: default `false`

Behavior gates:

- only `pip` and `uv` are accepted
- the `invariants` job exists only when `invariant-command` is provided
- source packaging happens only when `test-command` is non-empty, the `tests` job runs, and artifact upload is enabled
- the source package is `git archive HEAD`, excludes untracked/runtime-generated files, and is retained for one day
- setup is provided by `langlink-tech/.github/.github/actions/setup-python-tooling@be4f67a71a9db35ca52748af9205d57f6684522a`

### `reusable-secret-scan.yml`

Declared inputs:

- `blocking`: default `false`
- `upload-sarif`: default `false`
- `timeout-minutes`: default `10`

Behavior gates:

- the workflow declares no top-level permissions and inherits the calling job's permission ceiling
- every caller needs `contents: read`; `upload-sarif: true` additionally needs `security-events: write`
- `blocking: false` changes only whether detected secrets fail the scan step
- artifact upload is attempted with `always()`, but a missing report is ignored
- SARIF upload is attempted only when enabled and is `continue-on-error`; a green workflow does not prove Code Scanning ingestion

## Taxonomy Config

`README.md` summarizes the default label families:

- `kind/*`: bug, feature, refactor, chore, spike, follow-up
- `priority/*`: p0, p1, p2
- `area/*`: backend, frontend, devops, data, docs, other, cross-cutting

`.github/labels.json` is the committed source for those labels. Bug and feature
forms apply static `kind/*` defaults immediately. On issue creation, a local
copy of `issue-form-labels.yml` maps `Area` for any shared form and maps `Task
Type` when that field is present. The Engineering Task form has no static
`kind/*` default. The mapper is not inherited and later edits do not retrigger it.

## Override Rules

The committed files define the baseline, not total control. Based on
`README.md` and `docs/repo-contract.md`:

- a consuming repo may override shared issue forms and the PR template by
  committing its own files
- every consuming repo must provide its own `.github/CODEOWNERS`
- repo-specific CI jobs remain in the consuming repo when they check domain
  invariants, deployment packaging, or environment-specific smoke behavior

Maintainer-only rollout and operator settings are documented in the private
governance control plane, not in this public repository.
