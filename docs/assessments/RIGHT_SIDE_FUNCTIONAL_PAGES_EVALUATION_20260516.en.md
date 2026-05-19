---
title: Right-Side Functional Pages Layout and System Evaluation
doc_type: Assessment
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-19
---

# Right-Side Functional Pages Layout and System Evaluation

Chinese version: [RIGHT_SIDE_FUNCTIONAL_PAGES_EVALUATION_20260516.md](./RIGHT_SIDE_FUNCTIONAL_PAGES_EVALUATION_20260516.md)

This report evaluates logged-in right-side functional pages across two dimensions:

- layout quality
- operational usability

## Coverage

It reviews eighteen key pages including:

- dashboard
- auth security
- profile
- user, role, menu, permission
- operation log
- dept and post
- dict, setting, i18n
- login log and session
- modules and generator

## Evidence Model

The report combines:

- UI quality evaluation through `impeccable`
- report-only QA evidence through existing Playwright smoke and visual-contract tests

## Main Finding

System governance pages have already converged around a shared page skeleton, but shell-contract failures and dense interaction surfaces still need active monitoring.

Use the Chinese source document for the detailed page list, evidence references, and execution writeback.
