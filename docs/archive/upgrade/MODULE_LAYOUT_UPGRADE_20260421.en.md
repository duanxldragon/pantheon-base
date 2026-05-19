---
title: Module Physical Layout Upgrade Notes (2026-04-21)
doc_type: Design
layer: platform
status: Archived
index_group: archive/upgrade
retention_reason: retained as the upgrade explanation for the 2026-04-21 physical module layout adjustment, for migration reference in older environments
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/contracts/SYSTEM_ORG_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-05-19
---

# Module Physical Layout Upgrade Notes (2026-04-21)

Chinese version: [MODULE_LAYOUT_UPGRADE_20260421.md](./MODULE_LAYOUT_UPGRADE_20260421.md)

This archived note explains the April 21, 2026 layout upgrade where logical ownership stayed the same while physical module directories were simplified.

## Main Intent

The upgrade addressed two clarity issues:

- `auth` needed a clearer top-level physical position as a security domain
- `platform/dashboard` was too deeply nested for its actual role

## Key Result

The logical layer model stayed intact, but directories became flatter:

- `backend/modules/auth/`
- `backend/modules/dashboard/`
- matching frontend module moves

API paths and logical ownership were intentionally kept stable.

Use the Chinese source document for the full before/after layout and migration notes.
