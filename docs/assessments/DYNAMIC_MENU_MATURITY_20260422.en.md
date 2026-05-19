---
title: Dynamic Menu Maturity Assessment and Evolution Blueprint (2026-04-22)
doc_type: Assessment
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
updated_at: 2026-05-19
---

# Dynamic Menu Maturity Assessment and Evolution Blueprint (2026-04-22)

Chinese version: [DYNAMIC_MENU_MATURITY_20260422.md](./DYNAMIC_MENU_MATURITY_20260422.md)

This assessment focuses on dynamic menu capability across:

- `platform`
- `system/iam`
- `business/cmdb` as the first business-domain sample

## Main Conclusion

Pantheon Base currently sits at **L3: registration-based dynamic menus**.

It has already moved beyond:

- static layout menus
- simple dynamic tree rendering
- coarse permission-tied menu visibility

But it has not fully reached:

- controlled component-registry resolution
- plugin-level business assembly

## What Already Exists

- backend-managed menu metadata
- navigation pruning by role-owned menu authorization
- separation between menu visibility and page/button/API permissions
- module-level frontend manifests for routes, menus, permissions, and i18n namespaces
- `business/cmdb` as a real integration sample

## What Still Blocks The Next Stage

New frontend page components and module manifests still require explicit registration in the app shell.

That means the current model is:

- backend dynamic menus
- frontend explicit module registration

not:

- backend-only configuration that can independently activate a new business page

Use the Chinese source document for the full maturity ladder, matrix, and evolution blueprint.
