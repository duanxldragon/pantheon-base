---
title: Existing Environment Upgrade Operations SOP (2026-04-21)
doc_type: Design
layer: platform
status: Archived
index_group: archive/upgrade
retention_reason: retained as the ordered runbook for executing the 2026-04-21 upgrade in older environments
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/contracts/SYSTEM_ORG_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-05-19
---

# Existing Environment Upgrade Operations SOP (2026-04-21)

Chinese version: [UPGRADE_RUNBOOK_20260421.md](./UPGRADE_RUNBOOK_20260421.md)

This archived runbook is the sequence-oriented SOP for upgrading an existing Pantheon environment to the April 21, 2026 module-layout and menu-information-architecture version.

## Scope

The upgrade covered:

- platform dashboard physical relocation
- auth physical relocation
- menu regrouping
- compatibility-preserving deployment of the new layout

It did not require:

- business-domain schema rewrites
- bulk API prefix renaming
- full database reinitialization

Use the Chinese source document for the ordered operational steps, rollback boundary, and release-gate details.
