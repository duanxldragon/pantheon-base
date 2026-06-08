# Repo-Local Skills

Chinese version: [README.zh.md](./README.zh.md)

This directory contains Pantheon Base repository-local Codex skills.

Shared template source:

- `harness-engineering/.agents/skills/README.md` at the workspace level

Use these before falling back to generic workflow skills when the task is specific to this repository:

- `repo-verify`: choose the minimum local verification matrix for the touched scope
- `repo-pr-gate`: close a Pantheon Base change before PR or merge
- `repo-ci-triage`: reproduce and classify GitHub Actions failures
- `gh-fix-ci`: adapt CI-fix work to Pantheon Base workflow names and checks

Recommended order:

1. `repo-verify`
2. `repo-pr-gate`
3. `repo-ci-triage` when GitHub Actions is red
4. `gh-fix-ci` when the failure still needs GitHub-run-level investigation
