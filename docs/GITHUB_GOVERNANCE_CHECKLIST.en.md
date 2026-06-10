---
title: GitHub Governance Checklist
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-06-10
---

# GitHub Governance Checklist

Use this checklist when enabling the workflow described in `docs/designs/WORKFLOW.md` and `docs/acceptances/CODE_REVIEW_STANDARD.md`.

## Repository settings

- Protect `main` and `release/*`
- Require pull request reviews before merge
- Require review from code owners
- Require at least one non-author approval for normal changes
- Require at least two approvals for high-risk changes
- Dismiss stale approvals on new commits
- Require conversation resolution
- Restrict direct pushes to protected branches
- Automatically delete head branches after merge

## Required checks

- `Quality Gates`
- `Security Gates`
- `Duplication Gate`
- Keep PR-required checks limited to fast, deterministic merge-gate jobs
- Run duplication on PR and merge queue as a visible report; enforce the full-repository threshold on protected-branch push or manual quality review until a new-code duplication gate exists
- Keep `Full Smoke Suite` manual, scheduled, or release-precheck only
- Keep Sonar and Codacy out of required checks

## Secrets

- Any repository secrets needed by active security or deployment workflows
- Do not configure Sonar secrets in GitHub; Sonar stays auxiliary and manual

## Local temporary secret file

For local Sonar validation without committing credentials:

- create `pantheon-sonarcloud.env` in the repo root
- keep it git-ignored
- use `npm run run:sonar-remediation -- --group local-sonar --execute`
- install SonarScanner CLI locally before running the scan phase
- review the uploaded `sonarcloud-report.md` / `sonarcloud-report.json` in `.harness/evidence/<task-id>/logs/` or the workflow artifact, not the SonarCloud UI
- `scripts/run-sonar.ps1` remains the lower-level scan-only entry point if you need to debug upload behavior
- if Codacy appears, do not require it for merge

Expected file format:

```text
SONAR_HOST_URL=https://sonarcloud.io
SONAR_TOKEN=...
```

## Review evidence

- PR description records ownership layer, boundary, validation, and GitHub checks status
- PR description names the independent reviewer
- High-risk PRs record the second approval explicitly
- Closeout records merged PR URL, merge commit, and branch cleanup status
