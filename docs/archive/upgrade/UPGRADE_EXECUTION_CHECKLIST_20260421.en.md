---
title: Database / Existing Environment Upgrade Execution Checklist (2026-04-21)
doc_type: Design
layer: platform
status: Archived
index_group: archive/upgrade
retention_reason: retained as the verification and acceptance checklist for executing the 2026-04-21 upgrade in older environments
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/contracts/SYSTEM_ORG_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-05-19
---

# Database / Existing Environment Upgrade Execution Checklist (2026-04-21)

Chinese version: [UPGRADE_EXECUTION_CHECKLIST_20260421.md](./UPGRADE_EXECUTION_CHECKLIST_20260421.md)

This archived checklist is for upgrading already-running Pantheon environments to the April 21, 2026 layout and menu-information-architecture version.

It is the comprehensive verification surface, while the runbook remains the sequence-oriented operational SOP.

## Main Upgrade Themes

- `auth` moved physically to a top-level module
- `dashboard` moved physically to a top-level module
- left navigation regrouped into new top-level categories
- startup auto-seeding and auto-relinking of historical menus
- major API compatibility retained

Use the Chinese source document for the full precheck, compatibility, and acceptance checklist.
