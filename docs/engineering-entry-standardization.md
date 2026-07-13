# Engineering Entry Standardization

This document defines the repo entrypoint contract for LangLink engineering repositories.

## Current Scope

The current phase standardizes repo entrypoints without introducing new deployed services. Existing monitoring, deployment, and platform tooling stay out of scope unless a repository already depends on them.

The shared templates live in `templates/engineering-entry-standardization/`:

- `Taskfile.node.yml`: Node.js and pnpm repositories.
- `Taskfile.python-uv.yml`: Python repositories using `uv`.
- `Taskfile.python-pip.yml`: Python repositories using `pip` and `requirements.txt`.
- `Taskfile.compose.yml`: Compose-first infra or monitoring repositories.
- `renovate.json`: conservative Renovate baseline.
- `verification-checklist.md`: local and PR verification checklist.

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

`mise.toml` remains responsible for tool versions. `Taskfile.yml` is responsible for action orchestration. `.env.example` remains the readable environment contract. Runtime secrets stay in the org secret manager or machine-local state.

`task ci` must wrap the current pull-request baseline. It should not invent a stricter gate unless that stricter gate is already accepted by the repo.

## Template Selection

Use the closest template and adapt commands to existing repo scripts:

| Repo shape | Start from | `task ci` should wrap |
| --- | --- | --- |
| Node/pnpm app, CLI, extension, or userscript | `Taskfile.node.yml` | `pnpm install --frozen-lockfile` plus existing lint/typecheck/test/build scripts |
| Python with `uv.lock` or `pyproject.toml` and `uv` workflow | `Taskfile.python-uv.yml` | `uv sync --locked` plus existing ruff/mypy/pytest gates |
| Python with `requirements.txt` and pip workflow | `Taskfile.python-pip.yml` | pip install plus existing lint/test gates |
| Compose-first infra or monitoring repo | `Taskfile.compose.yml` | compose config plus existing shell, rules, dashboard, or smoke checks |

For browser-extension and userscript repos, keep packaging or build artifact checks inside `task ci` when GitHub Actions already requires them. If the repo has Docker Compose, replace the default no-compose `docker:*` tasks with config validation and stack startup commands.

## Renovate Contract

Each governed repo uses `renovate.json` with conservative defaults:

- Weekly schedule in the `Asia/Shanghai` timezone.
- `minimumReleaseAge` set to `10 days`.
- Dependency Dashboard enabled.
- No automerge.
- Minor, patch, and digest updates grouped.
- Major updates stay separate and carry a high-risk label.

Renovate PRs must pass the repo's normal CI. Renovate must not bypass branch protection or required checks.

## Adoption Checklist

Before opening a PR:

- Copy the closest Taskfile template to `Taskfile.yml`.
- Copy `templates/engineering-entry-standardization/renovate.json`.
- Replace placeholder commands with existing repo-local scripts.
- Run `templates/engineering-entry-standardization/verification-checklist.md`.
- Keep generated artifacts out of the PR unless the repo already requires generated outputs to be committed.

## Logging And Future Loki Contract

Loki is not deployed in this phase. Repositories should still prefer structured logs that can be safely shipped later:

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
