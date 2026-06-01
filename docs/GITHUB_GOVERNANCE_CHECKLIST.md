---
title: GitHub 治理清单
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-05-29
---

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
- Any repo-specific smoke or audit jobs that are part of the merge gate

## Secrets

- Any repository secrets needed by active security or deployment workflows
- Do not configure Sonar secrets in GitHub; Sonar stays local and manual

## Local temporary secret file

For local Sonar validation without committing credentials:

- create `pantheon-sonarcloud.env` in the repo root
- keep it git-ignored
- use `scripts/run-sonar.ps1`
- install SonarScanner CLI locally before running the script
- review the uploaded report in SonarCloud manually after the script completes

Expected file format:

```text
SONAR_HOST_URL=https://sonarcloud.io
SONAR_TOKEN=...
```

## Review evidence

- PR description records ownership layer, boundary, validation, and GitHub checks status
- PR description names the independent reviewer
- High-risk PRs record the second approval explicitly
