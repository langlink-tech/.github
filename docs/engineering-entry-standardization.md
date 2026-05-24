# Engineering Entry Standardization

This document defines the phase-one repo entrypoint contract for LangLink engineering repositories.

## Phase-One Scope

Phase one standardizes repo entrypoints without introducing new deployed services. Prometheus and Grafana remain the monitoring stack. Sentry, Uptime Kuma, Coolify, k3s, Argo CD, SOPS, and Loki stay out of scope for this phase.

## Taskfile Contract

Repositories should expose a `Taskfile.yml` using Taskfile schema version `3`. The standard task names are:

- `dev`: run the repo's local development entrypoint.
- `test`: run the repo's normal test command.
- `lint`: run static checks that do not mutate files.
- `typecheck`: run type checks where applicable.
- `build`: run the repo build where applicable.
- `docker:config`: validate Docker Compose config without starting services.
- `docker:up`: start the repo's local compose stack.
- `ci`: run the checks required before PR completion.
- `deploy`: run the repo's deployment entrypoint only when the repo already has one.

If a task is not applicable, it must fail with a clear message instead of succeeding silently.

`mise.toml` remains responsible for tool versions. `Taskfile.yml` is responsible for action orchestration. `.env.example` remains the readable environment contract. Runtime secrets stay in Infisical or machine-local state.

## Renovate Contract

Each pilot repo uses `renovate.json` with conservative defaults:

- Weekly schedule in the `Asia/Shanghai` timezone.
- `minimumReleaseAge` set to `10 days`.
- Dependency Dashboard enabled.
- No automerge.
- Minor, patch, and digest updates grouped.
- Major updates stay separate and carry a high-risk label.

Renovate PRs must pass the repo's normal CI. Renovate must not bypass branch protection or required checks.

## Logging And Future Loki Contract

Loki is not deployed in phase one. Repositories should still prefer structured logs that can be safely shipped later:

- `timestamp`
- `service`
- `env`
- `level`
- `message`
- `request_id`

Future Loki labels must stay low-cardinality:

- allowed labels: `service`, `env`, `level`, `host`
- forbidden labels: `user_id`, `order_id`, `request_id`, full URL paths, tokens, secrets, or arbitrary identifiers

High-cardinality values belong in the log body, not labels.
