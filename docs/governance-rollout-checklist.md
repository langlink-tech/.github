# Governance Rollout Checklist

Use this checklist when applying or re-applying the current LangLink GitHub governance setup.

## 1. Push Order

Push the local commits in this order so shared guidance lands before repo-level files:

1. `~/projects/dotfiles`
2. `~/projects/langlink-tech-org-dotgithub`
3. `~/projects/plunet-api-server`
4. `~/projects/langlink-reporting`
5. `~/projects/plunet-database`

Why this order:
- `dotfiles` updates the shared AI / governance instructions
- `.github` updates the org-level defaults and rollout notes
- product repos then receive repo-specific governance docs and `CODEOWNERS`

## 2. Current Solo-Phase Baseline

The current operating model assumes:
- PM + AI / Codex does most implementation work
- `Projects` manage priority and status
- draft PRs carry implementation context
- issues are only for durable tracking
- branch protection keeps CI and conversation resolution, but does **not** require a human approval yet

Expected repo settings in this phase:
- merge strategy: `squash only`
- `delete branch on merge`: enabled
- `required_approving_review_count`: `0`
- `require_code_owner_reviews`: disabled

## 3. Project Workflow Values

Project: `Plunet Platform`

Open `Project -> Workflows` and confirm these built-in workflow values:

- `Auto-close issue`
  - trigger status: `Done`
- `Item added to project`
  - set `Status = Todo`
- `Item reopened`
  - set `Status = Todo`
- `Item closed`
  - set `Status = Done`
- `Code changes requested`
  - set `Status = In Progress`
- `Code review approved`
  - set `Status = Review`
- `Pull request linked to issue`
  - set `Status = In Progress`
- `Pull request merged`
  - set `Status = Done`

Alternative if PM acceptance should happen after merge:
- keep `Auto-close issue -> Done`
- change `Pull request merged -> Review`

That keeps merged work open until someone explicitly moves the project item to `Done`.

## 4. Project Views

Keep these table views in `Plunet Platform`:

- `All Items`
  - no filter
- `Active Backlog`
  - filter: `status:Todo`
- `In Flight`
  - filter: `status:"In Progress",Blocked,Review`
- `Recent Done`
  - filter: `status:Done`
  - recommended columns: `Title`, `Status`, `Repository`, `Work Type`, `Area`, `Linked pull requests`
- `By Repo`
  - no filter, used for audit / cross-repo slicing

Recommended cleanup:
- rename legacy `View 1` to `All Items`
- rename legacy `Backlog` to `Active Backlog`
- keep `In Flight`
- create `Recent Done`

## 5. Repository Checklist

For each repo:
- `langlink-tech/plunet-api-server`
- `langlink-tech/langlink-reporting`
- `langlink-tech/plunet-database`

Confirm:
- `.github/CODEOWNERS` exists
- `CLAUDE.md` follows the shared skeleton
- `PROJECT_RULES.md` follows the shared skeleton
- merge settings are still `squash only`
- `delete branch on merge` is still enabled

## 6. First Human Developer Join Checklist

Do this only when at least one real developer joins the delivery loop:

1. Replace or refine the default `CODEOWNERS` entries.
2. If team boundaries are real, prefer GitHub teams over individual usernames.
3. In each repository's branch protection for `main`:
   - enable `Require a pull request before merging`
   - enable `Require review from Code Owners`
   - set `required approvals = 1`
4. Keep CI checks as required checks.

Do **not** turn on code-owner reviews before `CODEOWNERS` is meaningful. Otherwise the rule becomes noise.

## 7. Drift Checks

Run a light governance audit at least once per month:

- `CODEOWNERS` still present in each repo
- `CLAUDE.md` / `PROJECT_RULES.md` did not drift back to repo-specific ad-hoc structures
- Project workflows still have the correct `Status` values
- merge settings still match the solo-phase or team-phase target
- repository issue auto-close behavior is not fighting the Project `Auto-close issue` workflow

## 8. Reference Notes

- `CODEOWNERS` must live in each repo; it is not inherited from the org default community health repo.
- For AI-tooling / governance changes, edit `~/projects/dotfiles` and apply with `chezmoi apply`.
