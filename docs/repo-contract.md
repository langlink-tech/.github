# Repo Contract

Use this baseline for new repositories and initial cleanup of active ones.

## Required Files

- `.env.example` with the human-readable runtime contract
- `README.md` with purpose, setup, testing, deployment, and architecture notes
- `.github/CODEOWNERS`

## Required Local Entry Points

Every active repository should expose these top-level commands through `package.json`, `Makefile`, or a thin wrapper script:

- `dev`: start the main local development loop
- `test`: run the primary automated test suite
- `build`: produce the primary build artifact or image
- `verify`: run the repo's agreed local quality gate

Optional but strongly recommended:

- `lint`
- `typecheck`
- `smoke`

## Archetypes

- `react-app`: `pnpm`, `lint`, `typecheck`, `test`, `build`, optional deployment smoke
- `browser-automation`: `pnpm`, `test`, `typecheck`, `build`, package or userscript artifact generation
- `node-service`: `pnpm` or `npm`, `test`, `build`, container or process healthcheck
- `python-api`: `pyproject.toml`, `test`, `lint`, `verify`, container or HTTP healthcheck
- `compose-stack`: `docker compose config`, service smoke checks, deployment notes

## Shared CI Principle

- Prefer calling reusable workflows from `langlink-tech/.github` instead of copying job definitions into each repo.
- Pin reusable workflows to the reviewed immutable SHA (currently `@d533f85808e3313fe97ae3a092c62865a6f131e2`, tagged `quality-workflows-v6` for Node and Python quality). Do not leave active consumers on mutable `@main`.
- Treat rollback compatibility per workflow: `quality-workflows-v5` / `7717a53d…` remains callable for Secret Scan and as Node/Python rollback; Secret Scan callers stay on v5 until a reviewed secret-scan pin moves.
- Keep repo-specific jobs only for domain invariants, deployment packaging, contract checks, or environment-specific smoke tests.
- Every CI/CD workflow should set least-privilege `permissions`, `concurrency` with `cancel-in-progress` for PR runs, and `timeout-minutes` on quality jobs.
- Follow `docs/cicd-efficiency.md`: one install per cheap static job, skip unchanged work behind an aggregator, reuse CI artifacts in CD, and do not double-run `pull_request` plus `push` on the same SHA.
- Complex monorepos may keep local orchestration (for example change detection) and still share setup composites from `langlink-tech/.github`.
