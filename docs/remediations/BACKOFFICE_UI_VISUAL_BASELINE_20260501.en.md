---
title: Backoffice UI Screenshot Baseline and Visual Regression Checklist
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-19
---

# Backoffice UI Screenshot Baseline and Visual Regression Checklist

Chinese version: [BACKOFFICE_UI_VISUAL_BASELINE_20260501.md](./BACKOFFICE_UI_VISUAL_BASELINE_20260501.md)

This checklist fixes the platform-layer visual baseline for the Pantheon Base backoffice UI.

It is meant to guard against regressions such as:

- checking only vertical navigation and not horizontal mode
- preference density changes landing inconsistently
- unregistered business cards reappearing on the dashboard
- silent degradation in system pages, login flows, or modal copy

## Main Baseline Areas

- login desktop and mobile
- dashboard
- system user, role, permission, menu, dept, post, setting
- auth security
- horizontal plus compact preference mode
- critical dialogs and validation screenshots

## Acceptance Focus

- both sidebar and horizontal shell modes must be checked
- at least one non-default preference combination must be covered
- dashboard widgets must remain registry-controlled
- dense system pages must stay readable under compact mode

Use the Chinese source document for the exact screenshot list, file names, and regression rules.
