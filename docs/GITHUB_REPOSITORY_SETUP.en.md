---
title: GitHub Repository Setup Guide
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
- `SonarQube Analysis`

If the repo has additional merge-gate jobs, add them too.

### 1.3 Code owners

Keep `CODEOWNERS` enabled so the owner is always requested for review.

### 1.4 Secrets

Configure repository secrets:

- `SONAR_TOKEN`
- `SONAR_HOST_URL`

For SonarCloud:

- `SONAR_HOST_URL=https://sonarcloud.io`

### 1.5 Local validation

For local validation without committing credentials:

1. create `pantheon-sonarcloud.env` in the repo root
2. keep it ignored by Git
3. run `scripts/run-sonar.ps1`
4. install SonarScanner CLI locally before running the script

## 2. Ops repository

Repeat the same branch-protection, required-check, CODEOWNERS, and secret steps in `pantheon-ops`.

The ops repository should keep the same review discipline as base, but only own business-specific drift and business-domain changes.

## 3. Verification

After configuration, verify:

- PRs request the code owner automatically
- branch protection blocks direct push to protected branches
- required checks show both `Quality Gates` and `SonarQube Analysis`
- stale approvals are dismissed after new commits
- the PR template records review ownership, SonarQube status, and GitHub checks status
