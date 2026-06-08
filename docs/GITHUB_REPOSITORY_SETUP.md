---
title: GitHub 仓库设置手册
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-05-29
---

# GitHub Repository Setup Guide

Use this guide to activate the workflow defined in `docs/designs/WORKFLOW.md` and `docs/acceptances/CODE_REVIEW_STANDARD.md`.

## 1. Base repository

### 1.1 Branch protection

Open `Settings -> Branches -> Branch protection rules` and add rules for:

- `main`
- `release/*`

Enable:

- Require a pull request before merging
- Require approvals
- Require review from Code Owners
- Dismiss stale pull request approvals when new commits are pushed
- Require conversation resolution before merging
- Restrict pushes that create matching branches

Recommended approval policy:

- normal changes: at least 1 non-author approval
- high-risk changes: at least 2 approvals, one from a domain, security, or architecture reviewer

### 1.2 Required status checks

Add these checks to the required checks list:

- `Quality Gates`
- `Security Gates`

Do not add `Full Smoke Suite` or `Sonar` to required checks. `Quality Gates` should stay fast and deterministic for PR feedback, while `Full Smoke Suite` remains manual or release-precheck only. Keep Sonar and Codacy out of required checks. See [代码质量与安全治理策略](./designs/QUALITY_AND_SECURITY_STRATEGY.md) for the gating model and thresholds.

### 1.3 Code owners

Keep `CODEOWNERS` enabled so the owner is always requested for review.

### 1.4 Secrets

Configure only the repository secrets that are required by active GitHub Actions workflows.

Do not add Sonar secrets to the repository. Sonar is an auxiliary review tool, not part of the CI gate.

### 1.5 Local Sonar validation

Use Sonar only as a local auxiliary review step:

1. create `pantheon-sonarcloud.env` in the repo root
2. keep it ignored by Git
3. run `scripts/run-sonar.ps1`
4. install SonarScanner CLI locally before running the script
5. review the report in SonarCloud manually after the upload completes
6. if Codacy appears in GitHub, treat it as informational only

## 2. Ops repository

Repeat the same branch-protection, required-check, and CODEOWNERS steps in `pantheon-ops`.

Keep Sonar in the ops repository as a local manual tool only.

The ops repository should keep the same review discipline as base, but only own business-specific drift and business-domain changes.

## 3. Verification

After configuration, verify:

- PRs request the code owner automatically
- branch protection blocks direct push to protected branches
- required checks show only GitHub-native merge gates
- stale approvals are dismissed after new commits
- the PR template records review ownership and GitHub checks status
