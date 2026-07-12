# GitHub Apps CI/CD Migration Plan

> **For agentic workers:** Execute stage-by-stage. Keep this file’s Status column current. Do not expand into Wave 2 until Wave 1 acceptance checks pass.

**Goal:** Replace long-lived cross-repo GitHub PATs with the four LangLink GitHub Apps, starting with `langlink-ci-read`, without changing Tailscale/Cloudflare/Infisical deploy auth.

**Architecture:** Actions mint short-lived installation tokens via `actions/create-github-app-token@v2`, using Org/repo `vars.LANGLINK_*_APP_ID` + `secrets.LANGLINK_*_APP_PRIVATE_KEY` (source of truth remains Infisical). Prefer App tokens only where `GITHUB_TOKEN` cannot reach another private repo or needs a distinct actor.

**Tech stack:** GitHub Apps · Actions · Infisical · existing workflows in `langlink-tech/*`

**Reference analysis:** [github-apps-cicd-migration.canvas.tsx](/Users/floyd/.cursor/projects/Users-floyd-Projects/canvases/github-apps-cicd-migration.canvas.tsx)

---

## Status Board

| Stage | Scope | Status |
|-------|--------|--------|
| 0 | Org/repo Actions secrets from Infisical | in progress — keys found in `prod` `/` (not `/github-apps`) |
| 1 | `langlink-ci-read` PAT replacement (5 repos) | in progress — workflow diffs ready |
| 2 | `pr-automation` + `release-writer` | blocked on Stage 0–1 |
| 3 | `dependency-bot` / Renovate ownership | deferred |
| 4 | PAT cleanup + blast-radius tighten | blocked on Stage 1–2 |

---

## Stage 0 — Prerequisites (manual / once)

**Acceptance:** Wave 1 workflows can mint a token without missing-secret failures.

1. From Infisical project `c7d74815-f3af-4bf3-a758-9555b1c6dd4d`, env **`prod`**, path **`/`** (all 8 `LANGLINK_*` keys live here today; `/github-apps` exists only in `dev` and is empty), copy into **GitHub Org** (preferred) or each Wave 1 repo:
   - Variable: `LANGLINK_CI_READ_APP_ID`
   - Secret: `LANGLINK_CI_READ_APP_PRIVATE_KEY` (PEM, full multiline)
2. Confirm App installation covers needed repos (currently `all` on `langlink-tech` — OK for Wave 1).
3. Optional later (Wave 2): same path for  
   `LANGLINK_PR_AUTOMATION_*`, `LANGLINK_RELEASE_WRITER_*`.

CLI mirror example (values never echoed):

```bash
infisical run --env=dev --path=/github-apps -- \
  gh variable set LANGLINK_CI_READ_APP_ID --repo langlink-tech/<repo> --body "$LANGLINK_CI_READ_APP_ID"
# private key via: gh secret set ... < pem-file from Infisical export
```

**Do not** commit PEMs. Infisical remains SoT; Org Actions secrets are the runtime mirror.

**Pattern already in tree:** `plunet-chrome-plugin/.github/workflows/release-unpacked.yml` (release-hub checkout).

---

## Stage 1 — `langlink-ci-read` (P0)

**Benefit:** Remove `CROSS_REPO_READ_TOKEN`, `GOVERNANCE_REPO_READ_TOKEN`, `RELEASE_HUB_REPOSITORY_TOKEN`.  
**Out of scope:** `GOVERNANCE_SYNC_TRIGGER_TOKEN` (repository_dispatch) — leave as-is.

### 1.1 `plunet-governance` — sync hub

**Files:**
- Modify: `.github/workflows/sync-contracts.yml`
- Modify: `docs/config.md`, `docs/runbook.md`, `README.md` (secret contract)

**Change:**
1. Replace required `CROSS_REPO_READ_TOKEN` check with App ID + private key presence check.
2. Add `actions/create-github-app-token@v2` for repositories:
   `plunet-database`, `langlink-reporting`, `plunet-api-server`
3. Pass minted token into the three `actions/checkout` steps.
4. Keep PR creation on `github.token` for now (Wave 2 → `pr-automation`).

**Verify:**
- [ ] Manual `workflow_dispatch` Sync Contracts succeeds (or dry-run job that only mints token + lists remote refs).
- [ ] Docs no longer require `CROSS_REPO_READ_TOKEN`.

### 1.2 Consumers — governance clone

**Repos / files:**
- `plunet-api-server/.github/workflows/ci.yml`
- `plunet-database/.github/workflows/quality-gates.yml`
- `langlink-reporting/.github/workflows/quality-gates.yml` (+ caller `ci.yml` secret wiring)
- `plunet-governance/.github/workflows/reusable-contract-gate.yml`

**Change:**
1. Mint `ci-read` token scoped to `plunet-governance`.
2. Use token in clone URL (same shape as today).
3. Reusable gate: prefer App private key secret; keep optional PAT fallback one release if needed, then remove.
4. Update secret `workflow_call` interfaces / docs.

**Verify:**
- [ ] Contract gate job on each consumer green on a PR or `workflow_dispatch`.
- [ ] Missing App secret fails clearly (or falls back only if explicitly kept).

### 1.3 `plunet-chrome-plugin` — release hub read

**Files:** `.github/workflows/release-unpacked.yml` (already uses App token)

**Change:** Confirm Org/repo vars+secrets are set; remove any remaining `RELEASE_HUB_REPOSITORY_TOKEN` docs/references; no workflow rewrite unless broken.

**Verify:**
- [ ] Secrets present for chrome-plugin (or inherited from Org).
- [ ] Next release dry-run / draft path can checkout `internal-release-hub-cloudflare`.

### 1.4 Secret cleanup (after green)

- Delete repo secrets: `CROSS_REPO_READ_TOKEN`, `GOVERNANCE_REPO_READ_TOKEN`, `RELEASE_HUB_REPOSITORY_TOKEN` where unused.
- Leave `GOVERNANCE_SYNC_TRIGGER_TOKEN` until Stage 2 decision.

---

## Stage 2 — `pr-automation` + `release-writer` (P1)

**Blocked on:** Stage 1 green.

### 2.1 `plunet-governance` PR actor
- Mint `langlink-pr-automation` token for push + `gh pr create/edit`.
- Fixes “Actions is not permitted to create PRs” when org policy blocks `GITHUB_TOKEN`.

### 2.2 `tailscale-acl`
- Issue/status automation → `pr-automation` App token (or keep `github.token` if same-repo write already works — only switch if actor/audit needs it).

### 2.3 `plunet-chrome-plugin` release writer
- `gh release create/edit/delete` → `langlink-release-writer` App token.
- Keep Cloudflare publish secrets unchanged.

### 2.4 Blast radius
- Narrow write Apps from `all` repos → selected repos only.

---

## Stage 3 — `dependency-bot` (P2, deferred)

1. Confirm whether org Mend/Renovate App already opens dep PRs.
2. If yes: document “no custom dependency-bot needed” or dual-run policy.
3. If no: wire `langlink-dependency-bot` + Renovate self-hosted / workflow later.

---

## Stage 4 — Harden & close

- Remove PAT fallbacks from reusable workflows.
- Sync Infisical key comments / `.env.example` contracts where applicable.
- Update org runbook in `langlink-tech/.github`.
- Close initiative: remove this plan or mark complete and archive.

---

## Non-goals

- Migrating Tailscale OAuth, Cloudflare tokens, Infisical OIDC, SSH host keys.
- Forcing GHCR image pushes onto `release-writer` (keep `GITHUB_TOKEN` + `packages: write`).
- Converting ~20 deploy/verify-only repos.

---

## Execution order (this session)

1. Stage 0 checklist with operator (secrets).
2. Implement Stage 1.1 → 1.2 → 1.3 in code.
3. Open PRs per repo (or one coordinated batch).
4. Smoke: mint-token steps + one consumer contract gate.
5. Stop before Stage 2 unless Stage 1 accepted.
