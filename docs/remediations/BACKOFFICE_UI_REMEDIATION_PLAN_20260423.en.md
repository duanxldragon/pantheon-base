---
title: Backoffice UI Remediation Plan
doc_type: Remediation
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/contracts/SYSTEM_ORG_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-05-19
---

# Backoffice UI Remediation Plan

Chinese version: [BACKOFFICE_UI_REMEDIATION_PLAN_20260423.md](./BACKOFFICE_UI_REMEDIATION_PLAN_20260423.md)

This remediation plan governs the Pantheon Base backoffice UI cleanup.

The target is the backoffice itself:

- login page
- platform shell
- dashboard
- system-domain management pages
- global states and feedback

It explicitly does not redesign `business/*` pages.

## Core Direction

The main issue is not missing functionality. It is visual inconsistency and a tendency toward over-decorated, AI-template-looking admin interfaces.

The intended convergence is:

- calm
- trustworthy
- tool-like
- information-dense in a controlled way

## Main Remediation Sequence

- lock the platform rules first
- converge components and shell patterns
- replace historical page-level residue afterward

## Later Review Updates

The document also captures later conclusions about:

- old right-rail removal
- shell baseline convergence
- modal and drawer platformization
- remaining P2 UI evolution items

Use the Chinese source document for the full remediation sequence and dated follow-up conclusions.
