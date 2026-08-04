# LangLink GitHub defaults

## Repository purpose
- Organization community-health files, reusable quality workflows, shared setup actions, labels, and engineering-entry templates.

## Key entrypoints
- `.github/workflows/` and `.github/actions/` are public reusable interfaces.
- `.github/ISSUE_TEMPLATE/`, `pull_request_template.md`, `.github/labels.json`, `docs/`, and `templates/` own shared contributor contracts.

## Working rules
- Preserve workflow inputs, outputs, permissions, secrets, matrix behavior, and caller compatibility unless a versioned migration is planned.
- Consumers must pin reusable workflows to reviewed immutable SHAs; never publish examples using mutable `@main`.
- Do not imply that issue-label automation or CODEOWNERS inherits automatically to consumer repositories.
- Keep private rollout inventories and operator evidence in the governance control plane, not this public repository.

## Validation
- Parse changed YAML and validate reusable workflow references and composite-action structure.
- Run the `plunet-governance` all-workflow static audit for workflow interface changes; CodeQL alone is not interface evidence.
- Verify changed templates and label manifests against their documented schemas and representative consumers.

