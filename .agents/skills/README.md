# Repo-Local Skills

Chinese version: [README.zh.md](./README.zh.md)

This directory contains Pantheon Base repository-local agent workflow skills.

Shared template source:

- `pantheon-harness/.agents/skills/README.md` at the workspace level

Use these before falling back to generic workflow skills when the task is specific to this repository:

- `repo-verify`: choose the minimum local verification matrix for the touched scope
- `repo-pr-gate`: close a Pantheon Base change before PR or merge
- `gh-address-comments`: fix and close actionable GitHub PR, issue, and discussion comments
- `repo-ci-triage`: reproduce and classify GitHub Actions failures
- `gh-fix-ci`: adapt CI-fix work to Pantheon Base workflow names and checks

Standard command entrypoints:

- `npm run check:github-feedback -- --repo <owner/repo> --pr <number>`: fail fast when the PR or linked issue/discussion feedback is not fully closed yet

Recommended order:

1. `repo-verify`
2. `repo-pr-gate`
3. `gh-address-comments` when open GitHub feedback needs action
4. `repo-ci-triage` when GitHub Actions is red
5. `gh-fix-ci` when the failure still needs GitHub-run-level investigation

