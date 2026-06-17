---
title: GitHub 仓库设置手册
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-06-10
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
- Require conversation resolution before merging
- Restrict pushes that create matching branches
- Allow auto-merge
- Prefer squash merge as the standard merge method
- Automatically delete head branches after merge so merged worktree branches do not linger on GitHub

### 1.2 Required status checks

Add these checks to the required checks list:

- `Quality Gates`
- `Security Gates`

Do not add `Full Smoke Suite`、Codacy、OCR 或其他外部扫描器到 required checks。`Quality Gates` 应保持快速且确定，`Security Gates` 是唯一 required 的 GitHub-native 安全聚合门禁，并已包含 CodeQL。详见 [代码质量与安全治理策略](./designs/QUALITY_AND_SECURITY_STRATEGY.md)。

### 1.3 Copilot review

If your account or organization supports GitHub Copilot code review, enable automatic review or let the repository workflow request `@copilot` on each PR.

### 1.4 Secrets

Configure only the repository secrets that are required by active GitHub Actions workflows.

Do not add inactive scanner secrets to the repository. The active workflow stack is GitHub-native plus CodeQL.

### 1.5 Review gate evidence

Require the PR template to record:

1. `Quality Gates` result
2. `Security Gates` result
3. CodeQL result or alert link
4. Copilot review status
5. Auto-merge status
6. residual risk / rollback note for high-risk changes

## 2. Ops repository

Repeat the same branch-protection, required-check, and Copilot/auto-merge steps in `pantheon-ops`.

The ops repository should keep the same review discipline as base, but only own business-specific drift and business-domain changes.

## 3. Verification

After configuration, verify:

- branch protection blocks direct push to protected branches
- required checks show only GitHub-native merge gates
- PRs enable auto-merge after the gate workflow runs
- Copilot review is requested automatically when available
- merged PR head branches are deleted automatically
- the PR template records gate status, Copilot status, and rollback notes
