---
title: Low-Code Delivery Readiness Assessment (2026-05-19)
doc_type: Assessment
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
updated_at: 2026-05-20
---

# Low-Code Delivery Readiness Assessment (2026-05-19)

Chinese version: [LOWCODE_DELIVERY_READINESS_20260519.md](./LOWCODE_DELIVERY_READINESS_20260519.md)

## Summary

Current Pantheon low-code capabilities are deliverable as an **internal controlled scaffolding and module-onboarding accelerator**, but they are **not yet deliverable as a mature runtime low-code platform product**.

## Current Shape

The active ownership model is:

- `platform.lowcode`: product entry and work domain
- `system/generator`: controlled code generation
- `system/dynamicmodule`: module onboarding governance

## What Is Already Working

- schema-based module authoring
- preview of menus, permissions, i18n, generated files and contracts
- ZIP export
- writing generated sources into the workspace
- generated registry rewrite
- module registration with `pending activation` status
- activation audit with status write-back for pending modules
- module lifecycle governance with active / uninstalled / pending / failed states
- explicit `metadata.autoRecycle` marking for temporary QA / smoke modules
- governance-page lifecycle visibility for temporary auto-recycle modules
- runtime templates for many-to-many relations and child create/edit/submit flows in master-detail detail pages

## Main Gaps

- it is not runtime low-code; even with activation audit in place, generated modules still require backend restart and frontend rebuild
- real E2E still depends on environment-level orchestration after source generation, so activation UX is not yet product-grade
- frontend generation now covers baseline CRUD skeletons (`index.ts`, `api.ts`, `*List.tsx`, `*Form.tsx`, `*Detail.tsx`) and exposes dependency, relation, primary-table-context, related-entry placeholders, and lookup-option loading templates in generated pages, but it is still scaffold-level rather than runtime-composable UI
- multi-table support is still mostly contract-level. Generated pages now surface relation summaries, placeholder entry actions, and relation lookup loading contracts, but there is still no true runtime workflow/UI orchestration
- server-side generation ownership is mostly closed now; the remaining gap is activation closure rather than client-provided file trust

## Delivery Judgment

Deliverable:

- internal engineering beta
- controlled business module scaffolding
- development and governance environments

Not deliverable:

- external-facing low-code platform positioning
- non-engineer visual builder workflow
- product-grade multi-table runtime low-code system

Additional judgment:

- at the current scope, `generator + dynamicmodule` is deliverable as a product-grade internal governance tool
- it is still short of a mature runtime low-code platform in activation automation, online composition, and non-engineer usability

## Recommended P0

- make post-generation activation more productized and less dependent on manual ops steps
- add master-detail / relation-table UI patterns beyond baseline CRUD, then standardize business-side options contracts for many-to-many and richer relation flows
- keep tightening server-owned generation templates as the single source of truth
