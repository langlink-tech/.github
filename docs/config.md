# Config

This repository mixes committed configuration files with documented operator settings. The list below is based on local files only.

## Committed Config Sources

| Path | Config surface | Key values or behavior |
| --- | --- | --- |
| `README.md` | Published baseline and override rules | Declares the repo as the default GitHub community health source, lists the shipped assets, says repo-local issue templates or PR template override these defaults, and says `CODEOWNERS` is not inherited |
| `.github/ISSUE_TEMPLATE/config.yml` | Issue intake guardrail | `blank_issues_enabled: false` |
| `.github/ISSUE_TEMPLATE/01-bug-report.yml` | Bug issue form | Default label `kind/bug`; required fields for `area`, `summary`, `background`, `desired-outcome`, `acceptance-criteria` |
| `.github/ISSUE_TEMPLATE/02-feature-request.yml` | Feature issue form | Default label `kind/feature`; required fields for `area`, `summary`, `background`, `desired-outcome`, `in-scope`, `acceptance-criteria` |
| `.github/ISSUE_TEMPLATE/03-engineering-task.yml` | Engineering task form | Default label `kind/chore`; required fields for `task-kind`, `area`, `summary`, `motivation`, `in-scope`, `acceptance-criteria` |
| `.github/pull_request_template.md` | PR submission contract | Sections for summary, related issue, change type, checklist, and test plan |
| `.github/labels.json` | Label taxonomy | `kind/*`, `priority/*`, `area/*` labels with names, colors, and descriptions |
| `.github/CODEOWNERS` | Ownership for this repo | Fallback owner is `@langlink-localization`; file comment says team-based ownership should replace this when real teams exist |
| `.github/workflows/reusable-node-quality.yml` | Shared Node CI contract | Reusable workflow with `workflow_call` inputs and `contents: read` permission |
| `.github/workflows/reusable-python-quality.yml` | Shared Python CI contract | Reusable workflow with `workflow_call` inputs and `contents: read` permission |
| `docs/repo-contract.md` | Required repo contract | Defines required files, local command entrypoints, repo archetypes, and the rule to prefer reusable workflows |
| `docs/governance-rollout-checklist.md` | Rollout target state | Defines push order, Project workflow values, merge settings, repo checklist, and monthly drift checks |

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

Behavior gates:

- only `pnpm` and `npm` are accepted
- jobs run only when their corresponding command input is non-empty
- test sharding is implemented through a job matrix and `TEST_SHARD`

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

Behavior gates:

- only `pip` and `uv` are accepted
- the `invariants` job exists only when `invariant-command` is provided
- source packaging happens only in the `tests` job and only when artifact upload is enabled

## Taxonomy Config

`README.md` summarizes the default label families:

- `kind/*`: bug, feature, refactor, chore, spike
- `priority/*`: p0, p1, p2
- `area/*`: backend, frontend, devops, data, docs

`.github/labels.json` is the committed source for those labels. The issue forms consume part of that taxonomy immediately through default `kind/*` labels and area dropdowns, but the forms do not assign area labels automatically.

## Documented But Non-Committed Settings

Some governance settings are configuration targets, but they are not encoded as YAML in this repo. `docs/governance-rollout-checklist.md` documents them as operator-applied state:

- `Plunet Platform` Project workflow transitions such as `Item added to project -> Status = Todo`
- repo merge policy for the current solo phase
- whether code-owner reviews are required
- monthly drift-audit expectations

Treat these as configuration that is documented here and executed in GitHub UI.

## Override Rules

The committed files define the baseline, not total control. Based on `README.md` and `docs/repo-contract.md`:

- a consuming repo may override shared issue forms and the PR template by committing its own files
- every consuming repo must provide its own `.github/CODEOWNERS`
- repo-specific CI jobs remain in the consuming repo when they check domain invariants, deployment packaging, or environment-specific smoke behavior
