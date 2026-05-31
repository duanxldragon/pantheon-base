---
title: GitHub 仓库设置手册
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-05-31
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
- `Duplication Gate`

### 1.3 Code owners

Keep `CODEOWNERS` enabled so the owner is always requested for review.

### 1.4 Secrets

Configure the repository secrets required by deployment or security automation.

GitHub-native quality gates do not require Sonar credentials.

### 1.5 Local validation

Use the same entrypoints as CI:

1. run `npm run check:duplication`
2. run `go test -race ./...`
3. run `cd frontend && npm run build`
4. run targeted smoke commands when the change touches generated modules or system governance

## 2. Ops repository

Repeat the same branch-protection, required-check, CODEOWNERS, and secret steps in `pantheon-ops`.

The ops repository should keep the same review discipline as base, but only own business-specific drift and business-domain changes.

## 3. Verification

After configuration, verify:

- PRs request the code owner automatically
- branch protection blocks direct push to protected branches
- required checks show `Quality Gates`, `Security Gates`, and `Duplication Gate`
- stale approvals are dismissed after new commits
- the PR template records review ownership, GitHub check status, and duplication/security results