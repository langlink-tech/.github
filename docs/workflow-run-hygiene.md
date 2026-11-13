# `workflow_run` trigger hygiene

_Asia/Shanghai 2026-10-24 · tracks [.github#56](https://github.com/langlink-tech/.github/issues/56)._

Related (do not reopen): missing `permissions` on `reusable-secret-scan.yml` is
fixed by [.github#51](https://github.com/langlink-tech/.github/pull/51) — prefer
continuing that PR rather than a duplicate permissions change.

## Why `workflow_run` is medium risk

A workflow that starts after another workflow completes can:

- run with privileges on `main` after PR CI finishes
- check out an untrusted `head_sha` if authors are careless
- expose secrets to fork-driven paths if `pull_request` + `workflow_run` are mixed badly

SHA-40 Action pins across the org remain excellent; this doc is about **trigger
and checkout** discipline, not pin hygiene.

## Checklist (apply when editing any `workflow_run` workflow)

1. Top-level `permissions:` is least-privilege (usually `contents: read` until a
   job proves it needs more).
2. Job `if:` requires `workflow_run.conclusion == 'success'` and
   `workflow_run.event == 'push'` (or an explicit allowlist) — never "any
   completion".
3. Prefer `workflow_run.head_branch == 'main'` and
   `workflow_run.head_repository.full_name == github.repository`.
4. `actions/checkout` uses a **verified** SHA (tip-of-main check) — never
   `pull_request.head` from an untrusted fork.
5. No secrets in jobs that can be reached from fork PR CI completions.
6. Deploy jobs still require green required checks / artifact attestation as
   already practiced in langlink deploy workflows.

## Inventory snapshot (2026-10-24)

Fourteen workflows across active repos use `workflow_run` (see issue #56 body).
Spot-check (this pass):

| Repo / workflow | permissions | gate | checkout |
|-----------------|-------------|------|----------|
| langlink-work-agent deploy | contents:read | success + push | tip-of-main compare |
| plunet-database deploy | contents:read | success + push | DEPLOY_SHA verified |
| langlink-lqa-tapd deploy-cloudflare | contents:read | success + push + main + same-repo | head_sha with verify |
| email-content-to-feishu-bot deploy | contents:read | success + push | DEPLOY_SHA verified |
| plunet-governance pr-router-shadow | read-only | shadow only | **`refs/heads/main` only** (accepted) |

No High gap found that is not already tracked. Remaining work is checklist review
of the rest of the fourteen when those repos next touch deploy workflows.

## Anti-pattern (never)

```yaml
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
# ...
- uses: actions/checkout@...
  with:
    ref: ${{ github.event.workflow_run.head_branch }}  # unsafe if from fork PR
```

Combine that with write permissions or secrets → treat as High.
