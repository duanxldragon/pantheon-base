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

## Workflow triggers

- `pull_request`
- `push` to `main` and `release/*`
- `merge_group` for merge queue compatibility

## Review evidence

- PR description records ownership layer, boundary, validation, SonarQube status, and GitHub checks status
- PR description names the independent reviewer
- High-risk PRs record the second approval explicitly
