# CI Tree Reuse

`.github/actions/ci-tree-reuse` lets a default-branch `push` skip checks that a
successful same-repository `pull_request` or `merge_group` run already passed on
exactly the same git tree. It implements the "do not double-run on the same
tree" rule in [cicd-efficiency.md](cicd-efficiency.md).

Pin the action to a reviewed immutable SHA. Do not use `@main`.

## How the proof works

1. **Publish.** The last step of a passing `pull_request` or `merge_group` run
   uploads an artifact named `tested-tree-<tree>`, where `<tree>` is the tree of
   the commit the gated jobs checked out. For `pull_request` this is GitHub's
   synthetic merge (`github.sha`), not the PR head, so the proof does not depend
   on merge method or branch freshness.
2. **Resolve.** On `push`, the action looks up the pushed commit's tree, then
   looks for a successful run of the same workflow file that published evidence
   for that tree:
   - first, a `merge_group` run whose head is the pushed commit;
   - otherwise, `pull_request` runs of the same-repository PR whose
     `merge_commit_sha` is the pushed commit and whose base is the pushed branch.
   The latest applicable run wins: if the newest completed same-repository
   candidate run did not succeed (failed, cancelled, timed out), an older
   success is not used (`newer-source-run-not-successful`, since v2).
3. Any missing input, API error, fork head, failed or cancelled source run,
   newer unsuccessful run, expired artifact, or tree mismatch returns
   `reuse=false`. The caller then runs its full graph.

The evidence is only as strong as the source run. Publish it only from a run
that executed every job the push would skip. If PR runs select a subset (for
example affected tests), publish only from `merge_group`, or use a separate
`evidence-prefix` for the full-suite run.

## What a reused push still runs

Skip only checks whose result depends on the tree alone: lint, typecheck,
unit and integration tests, static contract checks. Keep these on every push:

- build or image jobs that produce the deploy artifact for this SHA
- release-quality gates your deploy workflow requires for this SHA
- anything that reads secrets, remote state, or the current time

The required aggregator must accept `skipped` only when `reuse == 'true'`.

## Caller example

```yaml
on:
  pull_request:
  merge_group:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  reuse:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: read
      actions: read
      pull-requests: read
    outputs:
      reuse: ${{ steps.reuse.outputs.reuse }}
    steps:
      - id: reuse
        uses: langlink-tech/.github/.github/actions/ci-tree-reuse@<reviewed-sha> # ci-tree-reuse-v1
        with:
          mode: resolve

  test:
    needs: [reuse]
    if: ${{ !cancelled() && needs.reuse.outputs.reuse != 'true' }}
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@<sha>
      # ... install and test ...

  build:
    # Always runs: produces the deploy artifact for this SHA.
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@<sha>
      # ... build and upload ...

  ci-required:
    needs: [reuse, test, build]
    if: ${{ always() }}
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Require every gate
        env:
          REUSED: ${{ needs.reuse.outputs.reuse }}
          TEST: ${{ needs.test.result }}
          BUILD: ${{ needs.build.result }}
        run: |
          set -euo pipefail
          reusable() { [[ "$1" = success || ( "${REUSED:-}" = true && "$1" = skipped ) ]]; }
          reusable "$TEST" && [[ "$BUILD" = success ]]
      - name: Publish tested-tree evidence
        uses: langlink-tech/.github/.github/actions/ci-tree-reuse@<reviewed-sha> # ci-tree-reuse-v1
        with:
          mode: publish
```

`publish` is a no-op on events other than `pull_request` and `merge_group`, so
the aggregator can call it unconditionally. It runs only after the gate step
passed, so a failed run never publishes evidence.

## Inputs and outputs

| Input | Mode | Default | Meaning |
| --- | --- | --- | --- |
| `mode` | both | required | `publish` or `resolve` |
| `token` | both | `github.token` | Needs `contents: read`; resolve also needs `actions: read` and `pull-requests: read` |
| `workflow` | resolve | calling workflow file | Workflow whose runs may supply evidence |
| `expected-sha` | resolve | `github.sha` | Pushed commit |
| `tested-sha` | publish | `github.sha` | Commit the gated jobs checked out; change only if they used a non-default `ref` |
| `evidence-prefix` | both | `tested-tree` | Must match `^[a-z0-9][a-z0-9-]{0,40}$` and agree between modes |
| `retention-days` | publish | `30` | Evidence lifetime; a push after expiry runs full CI |

| Output | Meaning |
| --- | --- |
| `reuse` | `true` only when the pushed tree was tested by a successful source run |
| `reason` | `pull_request-tested-this-tree`, `merge_group-tested-this-tree`, `not-a-push`, `missing-input`, `tree-unavailable`, `no-merge-group-or-merged-pr`, `no-successful-source-run`, `newer-source-run-not-successful`, `tested-tree-mismatch`, `github-api-error` |
| `tree` | Pushed tree (resolve) or tested tree (publish) |
| `source-run-id`, `source-event` | Run that supplied the evidence |

## Local verification

```bash
node --test .github/actions/ci-tree-reuse/reuse.test.mjs
```

The script has no dependencies and runs on the Node.js preinstalled on
GitHub-hosted Ubuntu runners.
