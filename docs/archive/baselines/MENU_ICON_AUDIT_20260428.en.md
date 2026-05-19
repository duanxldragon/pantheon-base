---
title: Menu Icon Audit and Governance Result
doc_type: Assessment
layer: platform
status: Archived
index_group: archive/baselines
retention_reason: retained as the historical audit baseline for platform navigation icon semantics
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-05-19
---

# Menu Icon Audit and Governance Result

Chinese version: [MENU_ICON_AUDIT_20260428.md](./MENU_ICON_AUDIT_20260428.md)

This archived audit records how Pantheon normalized menu icon semantics at the platform layer.

## Main Finding

The icon-repetition issue did not come from isolated menu mistakes. It came from two structural causes:

- the shared icon registry was too small
- manifest and seed values such as `language` and `code` had no registry mapping, so rendering fell back to the default menu icon

## Governance Direction

The resulting rule set is:

- keep primary domains visually distinct where possible
- do not let a single generic security icon stand in for roles, permissions, logs, and sessions
- constrain menu icons to registered semantic keys
- align backend `system_menu.icon` values with the frontend registry

Use the Chinese source document for the full audit table and icon-semantic mapping.
