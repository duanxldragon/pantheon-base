# GitHub Governance Checklist

Use this checklist when enabling the execution flow described in `docs/designs/WORKFLOW.md` and `docs/acceptances/CODE_REVIEW_STANDARD.md`.

## Repository settings

- Protect `main` and `release/*`
- Require pull request reviews before merge
- Require review from code owners
- Require at least one non-author approval for normal changes
- Require at least two approvals for high-risk changes
- Dismiss stale approvals on new commits
- Require conversation resolution
- Restrict direct pushes to protected branches

## Required checks

- `Quality Gates`
- `SonarQube Analysis`
- Any repo-specific smoke or audit jobs that are part of the merge gate

## Secrets

- `SONAR_TOKEN`
- `SONAR_HOST_URL`
- Any additional repository secrets needed by security or deployment workflows

## Local temporary secret file

For local validation without committing credentials:

- create `pantheon-sonarcloud.env` in the repo root
- keep it git-ignored
- use `scripts/run-sonar.ps1`
- install SonarScanner CLI locally before running the script
- if GitHub secrets are not configured, the GitHub Actions Sonar workflow is informational only and local validation is the active path

Expected file format:

```text
SONAR_HOST_URL=https://sonarcloud.io
SONAR_TOKEN=...
```

## Workflow triggers

- `pull_request`
- `push` to `main` and `release/*`
- `merge_group` for merge queue compatibility

## Review evidence

- PR description records ownership layer, boundary, validation, SonarQube status, and GitHub checks status
- PR description names the independent reviewer
- High-risk PRs record the second approval explicitly
