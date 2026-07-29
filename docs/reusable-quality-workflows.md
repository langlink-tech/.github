# Reusable Quality Workflows

The shared defaults repository publishes three reusable workflows:

- `reusable-node-quality.yml`
- `reusable-python-quality.yml`
- `reusable-secret-scan.yml`

Use them when a repository's core CI gate is a combination of install, lint, typecheck, tests, and build.

## Workflow Lint (actionlint)

Both quality workflows run an `actionlint` job first (input `actionlint-enabled`, default `true`).
It lints the caller repository's `.github/workflows` with actionlint 1.7.12 (checksum-pinned
download). Set `actionlint-enabled: false` to opt out.

Shellcheck findings are gated behind `actionlint-shellcheck` (default `false`). Keep it off
until the repository's existing shell scripts are clean, then opt in per repo.

## Node Workflow

Supports:

- `pnpm` and `npm`
- custom working directory
- optional lint, typecheck, test, and build commands
- test sharding through `TEST_SHARD`

Typical use:

```yaml
jobs:
  quality:
    uses: langlink-tech/.github/.github/workflows/reusable-node-quality.yml@main
    with:
      package-manager: pnpm
      package-manager-version: "10.30.3"
      cache-dependency-path: pnpm-lock.yaml
      install-command: pnpm install --frozen-lockfile
      lint-command: pnpm lint
      typecheck-command: pnpm typecheck
      test-command: pnpm test
      build-command: pnpm build
```

If a repository pins pnpm through `package.json#packageManager`, omit `package-manager-version`.
Only pass `package-manager-version` for repositories that do not already declare pnpm that way.

## Python Workflow

Supports:

- `pip` and `uv`
- custom working directory
- optional lint, invariant, and test commands
- optional source artifact upload for downstream deploy jobs

Typical use:

```yaml
jobs:
  quality:
    uses: langlink-tech/.github/.github/workflows/reusable-python-quality.yml@main
    with:
      installer: uv
      cache-dependency-path: pyproject.toml
      install-command: uv sync --locked --extra test
      lint-command: uv run --no-sync ruff check .
      test-command: uv run --no-sync pytest tests/ -q
      upload-source-artifact: true
```

## Secret Scan Workflow

`reusable-secret-scan.yml` runs a redacted Infisical CLI secret scan and uploads a SARIF
artifact. It defaults to report-only (`blocking: false`); flip `blocking: true` per repo
once the baseline is clean. `upload-sarif: true` additionally pushes results to GitHub
code scanning (caller must grant `security-events: write`).

Typical use:

```yaml
jobs:
  secret-scan:
    uses: langlink-tech/.github/.github/workflows/reusable-secret-scan.yml@<reviewed-sha> # tag TBD
    with:
      blocking: false
```

Rollout status and pilot repos are tracked in the plunet-governance caller matrix.
