---
title: Pantheon Code Review Standard Flow
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-19
---

# Pantheon Code Review Standard Flow

Chinese version: [CODE_REVIEW_STANDARD.md](./CODE_REVIEW_STANDARD.md)

This document defines the fixed review flow for Pantheon Base. It applies to human review, AI review, and self-checks before staged delivery.

The goal is to catch drift in:

- architectural boundaries
- permissions
- i18n
- audit
- dynamic menus
- generator contracts

## Review Levels

- `[Auto]`: required automated gates
- `[PR]`: required before merge or PR submission
- `[Phase]`: deeper review at the end of a roadmap phase

## Mandatory Review Entry

Every review must first declare the ownership layer:

- `platform`
- `system/auth`
- `system/iam`
- `system/org`
- `system/config`
- `business/*`

Cross-layer changes must explain primary ownership, dependency layers, and intrusion risk.

## Fixed Review Order

At minimum, review should cover:

1. scope and diff confirmation
2. architecture boundary checks
3. schema and database constraints
4. permission and menu separation
5. i18n key-first compliance
6. dates, currency, and locale formatting
7. RTL readiness as a later-phase concern

The Chinese source remains the authoritative detailed standard, including required reading and fixed commands.
