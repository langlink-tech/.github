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
    uses: langlink-tech/.github/.github/workflows/reusable-node-quality.yml@7717a53d825005835142669a664b64f52f532304 # quality-workflows-v5
    with:
      package-manager: pnpm
      package-manager-version: "10.30.3"
      cache-dependency-path: pnpm-lock.yaml
      install-command: pnpm install --frozen-lockfile
      lint-command: pnpm lint
      typecheck-command: pnpm typecheck
      test-command: pnpm test
      build-command: pnpm build
      actionlint-enabled: true
      actionlint-shellcheck: false
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
    uses: langlink-tech/.github/.github/workflows/reusable-python-quality.yml@7717a53d825005835142669a664b64f52f532304 # quality-workflows-v5
    with:
      installer: uv
      cache-dependency-path: pyproject.toml
      install-command: uv sync --locked --extra test
      lint-command: uv run --no-sync ruff check .
      test-command: uv run --no-sync pytest tests/ -q
      upload-source-artifact: true
      actionlint-enabled: true
      actionlint-shellcheck: false
```

The source artifact is produced only when `test-command` is non-empty and the
`tests` job runs. It contains `git archive HEAD` rather than untracked or
runtime-generated files, and it is retained for one day. Downstream deploy jobs
must consume it within that window.

## Secret Scan Workflow

`reusable-secret-scan.yml` runs a redacted Infisical CLI secret scan. It defaults
to report-only (`blocking: false`); flip `blocking: true` per repo once the
baseline is clean. The reusable workflow intentionally declares no top-level
permissions, so it cannot exceed the calling job's permission ceiling.

`upload-sarif: true` requires the caller to grant both `contents: read` and
`security-events: write`:

Typical use:

```yaml
jobs:
  secret-scan:
    permissions:
      contents: read
      security-events: write
    uses: langlink-tech/.github/.github/workflows/reusable-secret-scan.yml@7717a53d825005835142669a664b64f52f532304 # quality-workflows-v5
    with:
      blocking: false
      upload-sarif: true
```

`blocking: false` only prevents detected secrets from failing the scan step. The
workflow always attempts artifact upload, but a missing report is ignored. SARIF
upload is also attempted when enabled and uses `continue-on-error`; therefore a
green workflow does not prove that an artifact exists or that GitHub Code
Scanning ingested the SARIF. Verify those two evidence surfaces separately.

`quality-workflows-v4` remains a limited rollback ref for the Node and Python
workflows only. Secret Scan callers must stay on v5 because v5 preserves the
caller's least-privilege permission ceiling.

Rollout status and pilot repos are tracked in the plunet-governance caller matrix.
