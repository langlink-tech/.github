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
- Pin reusable workflows to a reviewed tag (for example `@quality-workflows-v1`) or immutable SHA. Do not leave active consumers on mutable `@main`.
- Keep repo-specific jobs only for domain invariants, deployment packaging, contract checks, or environment-specific smoke tests.
- Every CI/CD workflow should set least-privilege `permissions`, `concurrency` with `cancel-in-progress` for PR runs, and `timeout-minutes` on quality jobs.
- Complex monorepos may keep local orchestration (for example change detection) and still share setup composites from `langlink-tech/.github`.
