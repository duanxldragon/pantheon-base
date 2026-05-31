---
title: GitHub 治理清单
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/DOCUMENT_GOVERNANCE_CONTRACT.md
updated_at: 2026-05-31
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
- `Security Gates`
- `Duplication Gate`
- Any repo-specific smoke or audit jobs that are intentionally required in branch protection

## Secrets

- Any additional repository secrets needed by security or deployment workflows

## Local validation baseline

Run the same repository-owned entrypoints before opening a PR:

- `npm run check:duplication`
- `go test -race ./...`
- `cd frontend && npm run build`
- run targeted smoke commands when generated modules, governance flows, or security-sensitive routes change

## Workflow triggers

- `pull_request`
- `push` to `main` and `release/*`
- `merge_group` for merge queue compatibility

## Review evidence

- PR description records ownership layer, boundary, validation, GitHub check status, and duplication/security results
- PR description names the independent reviewer
- High-risk PRs record the second approval explicitly