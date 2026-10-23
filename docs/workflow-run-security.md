# `workflow_run` security checklist (org)

Tracking: [#56](https://github.com/langlink-tech/.github/issues/56).  
Audit artifact: Actions supply-chain map 2026-10-24 (145 workflows; all `uses:` SHA-40).

## Why this matters

`workflow_run` can start a privileged job after another workflow finishes — including after PR CI. Combined with a checkout of `pull_request.head` and secrets, that is a classic privilege-escalation path.

## Required checklist (every `workflow_run` workflow)

- [ ] Top-level `permissions:` is **least privilege** (prefer `contents: read` only; no `write-all`).
- [ ] Jobs that need writes declare **job-level** permissions explicitly.
- [ ] Checkout uses a **trusted ref** (`github.event.workflow_run.head_branch` only after repo/actor checks, or better: `refs/heads/main` / release tags). **Never** check out an untrusted PR head when secrets are present.
- [ ] `persist-credentials: false` on `actions/checkout`.
- [ ] Secrets are not passed to jobs that run untrusted code.
- [ ] Prefer `branches:` / `types:` filters so fork PR CI cannot trigger prod deploy.
- [ ] Document any accepted exception inline in the workflow.

## Anti-pattern (forbidden)

```yaml
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
jobs:
  deploy:
    # BAD: privileges + untrusted code
    permissions: write-all
    steps:
      - uses: actions/checkout@…
        with:
          ref: ${{ github.event.workflow_run.head_sha }}  # PR head
      - run: ./deploy.sh   # has secrets in env
```

## Accepted exception (document in-file)

`plunet-governance` `pr-router-shadow.yml`: `pull_request_target` + `workflow_run`, but checks out **`refs/heads/main` only**, read-only permissions, no secrets — Medium/accepted. Do not change checkout to PR head without a new review.

## Repos with `workflow_run` (inventory 2026-10-24)

langlink-work-agent, plunet-governance, plunet-database, langlink-tech-portal, langlink-tools, infisical, langlink-lqa-tapd (×2), prometheus-monitoring, sub-relay-docker, langlink-reporting, email-content-to-feishu-bot, tailscale-api, plunet-api-server.

Related: [#50](https://github.com/langlink-tech/.github/issues/50) / [#51](https://github.com/langlink-tech/.github/pull/51) reusable-secret-scan permissions.
