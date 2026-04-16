# Reusable Quality Workflows

The shared defaults repository publishes two reusable workflows:

- `reusable-node-quality.yml`
- `reusable-python-quality.yml`

Use them when a repository's core CI gate is a combination of install, lint, typecheck, tests, and build.

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
