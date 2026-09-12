# CI Efficiency Contract

Shared rules for GitHub Actions wall-clock, billed minutes, artifact reuse,
and duplicate work. This is the public summary. The private fleet inventory
and rollout waves live in `langlink-tech/plunet-governance`
`specs/cicd-efficiency-conventions-2026-09/`.

These rules do not override Action SHA pins, least-privilege `permissions`,
deploy health checks, or named deploy-contract classes.

## Two clocks

Optimize pull-request **wall-clock** (time until the required aggregator is
green) and **billed minutes** (sum of job minutes, each rounded up). Parallel
jobs shorten the critical path and increase the bill. Split a job only when
the work after install is long enough to beat extra checkout, install, and
one-minute rounding.

## One install per job

Lint, typecheck, AntD CLI, and other cheap static checks share one checkout
and install. The Node reusable workflow defaults `combine-static-checks: true`.
The `lint` and `typecheck` jobs still report: they forward the combined
result so required child contexts keep their names.

Set `single-job: true` only for small repositories. That runs lint, typecheck,
tests, and build in one job and **drops** the child check names.

## Do not run what did not change

Use job-level `if:` plus an always-run aggregator for required checks. Do not
put `paths:` on a required workflow (a skipped workflow never reports).

Same-repository pull requests should not also bill a duplicate `push` run on
the same SHA. Keep `pull_request` for forks.

If change detection cannot resolve base and head, run the full gate.

## Cancel superseded PR work, never cancel production

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

The group must include `github.workflow`. Deploy workflows keep
`cancel-in-progress: false`.

## Produce once, consume many

CI builds the immutable image or bundle. CD pulls that artifact. Do not
rebuild the app in CD or in a later packaging job after quality already
built it. Keep artifact retention short (1–7 days).

## Cache as a shared fleet resource

Use setup-node / setup-python / setup-uv / pnpm caches keyed on the lockfile.
Write caches from trusted default-branch pushes. Pull requests restore. Do
not create per-PR unique keys that churn the 10 GB LRU.

## Two-speed CI

| Speed | When | Contents |
| --- | --- | --- |
| PR / fork | every head | static checks, unit tests of affected surfaces, compile of the affected app |
| merge group / default-branch push | enqueue or main | PR set plus image publish, e2e, visual, full shards if the PR used a subset |

## Reuse workflows; one required context

Call `langlink-tech/.github` reusable quality workflows at a reviewed SHA.
Keep local jobs for domain invariants, packaging, and deploy.

Prefer one required aggregator (`ci-required`, `ci-summary`, or a single
quality job). Pinning every reusable child name prevents skip-if.

## actionlint

The reusable Node and Python quality workflows still start an `actionlint`
job when enabled. They download and run actionlint only when
`.github/workflows` changed, or when the base/head SHA cannot be compared
(fail closed).
