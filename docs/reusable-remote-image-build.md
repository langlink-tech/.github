# Reusable Remote Image Build

`reusable-remote-image-build.yml` reaches a Tailscale SSH host, checks out the
triggering commit SHA, builds a named Compose file, and never starts or
restarts containers.

Callers must pin a full commit SHA. Do not use `@main`. Do not call this
workflow from `pull_request` or from a non-`main` ref. The reusable job
fail-closes unless `github.ref` is `refs/heads/main` and the event is `push`
or `workflow_dispatch`. Product repos should keep their inlined remote-build
workflows until this file is pinned at a SHA that includes that gate.

```yaml
jobs:
  build-image:
    uses: langlink-tech/.github/.github/workflows/reusable-remote-image-build.yml@REPLACE_WITH_COMMIT_SHA
    with:
      project_name: TDL
      compose_file: docker-compose.prod.yaml
      search_paths: |
        /opt/tech-dept/projects/TDL
        /opt/TDL
      force_rebuild: ${{ inputs.force_rebuild || false }}
    secrets: inherit
```

## Inputs

- `project_name`: label used in logs and notifications
- `compose_file`: Compose file basename to build on the host (relative name
  only; no slashes, no control characters, no `..`)
- `search_paths`: newline-separated absolute directories; the first existing
  checkout that contains `docker-compose.yaml` wins
- `force_rebuild`: accepted for operator-triggered rebuilds; the workflow still
  checks out `GITHUB_SHA` from the triggering run

## Fail-closed behavior

- `github.ref` must be `refs/heads/main`. Other branches, tags, and pull-request
  refs fail.
- `github.event_name` must be `push` or `workflow_dispatch`. `pull_request` and
  other events fail.
- On the remote host, `origin/main` is fetched and
  `git merge-base --is-ancestor "$BUILD_SHA" origin/main` must succeed before
  checkout.
- `BUILD_SHA` is always `GITHUB_SHA`; the workflow does not re-resolve a live
  branch tip on `workflow_dispatch`.
- `compose_file` that is not a relative basename fails.
- `search_paths` entries that are not absolute, or that contain control
  characters, fail. Newlines remain the documented path separator.
- Missing `.env` fails. The workflow never copies `.env.example`.
- `.env` identical to `.env.example` fails.
- Dirty git checkout fails.
- `HEAD` must equal the triggering SHA.
- Slack notification is skipped when `SLACK_WEBHOOK` is unset; a configured
  webhook uses `curl --fail` and does not claim success on HTTP errors.
