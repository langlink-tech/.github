# Review Thread Disposition Contract

Applies to every pull request in LangLink repositories, covering human review
threads and AI review threads (for example `chatgpt-codex-connector`). This is
the organization-level convention; the branch-protection
`required_conversation_resolution` gate enforces the merge-side half of it.

## Merge Gate

- Default branches enable **Require conversation resolution before merging**.
  A pull request with unresolved review threads cannot merge, regardless of
  who authored the thread.
- Resolve a thread only after its disposition is real and recorded (below).
  Resolving to bypass the gate without a disposition is a contract violation.

## Disposition Rule

Every resolved thread must carry a closing reply with evidence, in one of
these forms:

| Disposition | When | Required evidence in the reply |
|---|---|---|
| `FIXED` | A commit on the PR head (or a later merged PR) resolves the concern | Commit SHA / fix PR link, plus the verification that ran (tests, CI run) |
| `TRACKED` | The concern is valid but deferred (severity P2/P3 without user-facing risk) | Link to the tracking issue that owns the fix, with acceptance criteria |
| `FALSE_POSITIVE` | The concern is factually wrong | Short technical reasoning (quoted code, type definitions, or docs proving the premise wrong) |
| `OBSOLETE` | The flagged code was removed or rewritten for unrelated reasons | The commit or PR that removed it |

Rules of thumb:

- A P1 thread may never be closed as `TRACKED`; fix it, prove it a false
  positive, or close it as `OBSOLETE` with evidence before merge.
- `TRACKED` requires an issue created in the same repository, referenced by
  URL in the thread reply.
- When a re-review of a new head finds the thread's concern addressed, the
  merger may resolve with a pointer to the addressing commit — chronology
  alone is not evidence.

## Post-Merge Hygiene

- Merged PRs with threads resolved as `TRACKED` keep their tracking issues
  open until the fix lands; closing the issue requires the same evidence bar.
- The periodic PR audit re-scans merged PRs for unresolved or re-opened
  threads and files the delta as follow-up debt.
- Dependabot and supply-chain review comments follow the same contract.

## Why This Exists

Before this contract, AI review threads could stay unresolved through merge,
and "the bot commented" was indistinguishable from "someone decided". The
2026-08 organization-wide audit found a large backlog of such threads on
merged PRs, including still-valid P1 issues at the default-branch head; exact
figures are operator evidence and live in the private governance control
plane. The gate plus the evidence rule keeps that backlog at zero.
