---
title: Language Session and Cross-Page Selection Design
doc_type: Design
layer: platform
depends_on_layers:
  - system/auth
  - system/config
  - system/iam
status: Approved
index_group: superpowers-specs
retention_reason: retained as the cross-module design anchor for runtime language priority and cross-page bulk-selection rules
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_AUTH_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/designs/FRONTEND.md
  - docs/designs/FRONTEND_UI_SPEC.md
  - docs/designs/AUTH_MODULE_DESIGN.md
  - docs/designs/DATABASE.md
updated_at: 2026-05-19
---

# Language Session and Cross-Page Selection Design

Chinese version: [2026-05-16-language-session-and-cross-page-selection-design.md](./2026-05-16-language-session-and-cross-page-selection-design.md)

This design closes two confirmed platform interaction rules:

- runtime language priority across login selection, user preference, and system default
- cross-page bulk-selection behavior for system-domain list pages

The fixed language rule is:

`current login choice > user preference > system default`

The fixed selection rule is:

- page changes do not clear the selection set
- the selection set binds to the current query context
- changing filters, search, sort, or reset clears the selection set
- bulk actions apply to the full selection set, not only the visible page

Use the Chinese source document for the detailed boundary and rule set.
