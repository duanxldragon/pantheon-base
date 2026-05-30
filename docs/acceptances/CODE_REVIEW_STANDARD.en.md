---
title: Pantheon Code Review Standard Flow
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-29
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

## Role Separation and Independent Review

Pantheon review distinguishes:

- feature supervision
- code-quality guardianship
- implementation ownership

The author, or the same implementation-agent session, must not be the only reviewer.

- standard changes: at least one non-author approval
- high-risk changes: at least two non-author approvals, including a domain, security, or architecture reviewer

High-risk scope includes `system/auth`, `system/iam`, `system/config`, permission and audit flows, shared `pkg/*`, generator or dynamic-module flows, and CI, deploy, secret, or credential changes.

## Default Gate Stack

Pantheon uses four layers by default:

1. local validation
2. GitHub required checks
3. SonarQube PR analysis and quality gate
4. independent reviewer sign-off

Minimum SonarQube expectations:

- zero blocker or critical issues on new code
- reviewed security hotspots before merge
- new-code coverage at or above `80%`, unless the PR records a justified exception
- new-code duplication below `3%`
- passed reliability, security, and maintainability gates

## Mandatory Review Entry

Every review must first declare the ownership layer:

- `platform`
- `system/auth`
- `system/iam`
- `system/org`
- `system/config`
- `business/*`

Cross-layer changes must explain primary ownership, dependency layers, and intrusion risk.

The review entry should also identify who is doing feature acceptance, who is doing quality review, and who holds merge authority.

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

At minimum, the detailed review record should also confirm:

- SonarQube quality gate status
- GitHub required-check status
- independent reviewer evidence
