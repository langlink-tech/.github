# Engineering Entry Verification Checklist

Use this checklist before opening a PR that adds or updates `Taskfile.yml` and `renovate.json`.

## Local Checks

- `mise exec -- task --list`
- `mise exec -- task ci`
- `python3 -m json.tool renovate.json`
- `git diff --check`

## Docker Compose Checks

Run this when the repo has `docker-compose.yml`, `compose.yml`, or an equivalent compose file:

- `mise exec -- task docker:config`

For repos without Docker Compose, `task docker:config` must fail with a clear no-compose message.

## PR Checks

- PR is ready for review, not draft.
- PR only contains the intended entrypoint files and related docs.
- GitHub checks are green or skipped for expected workflow conditions.
- Unresolved review threads are zero before merge.
- Merge state is `MERGEABLE` and `CLEAN` before `merge-pr-clean-branches`.
