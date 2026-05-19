---
title: IAM Remediation and Config Governance Design
doc_type: Design
layer: system/iam
depends_on_layers:
  - system/config
status: Approved
index_group: superpowers-specs
retention_reason: retained as the cross-module design anchor for system/iam remediation governance and system/config sensitive-page convergence
linked_contracts:
  - docs/contracts/SYSTEM_IAM_CONTRACT.md
  - docs/contracts/SYSTEM_CONFIG_CONTRACT.md
  - docs/designs/PANTHEON_BASE_ARCHITECTURE_OVERVIEW.md
  - docs/designs/FRONTEND_UI_SPEC.md
updated_at: 2026-05-19
---

# IAM Remediation and Config Governance Design

Chinese version: [2026-05-12-iam-remediation-and-config-governance-design.md](./2026-05-12-iam-remediation-and-config-governance-design.md)

This design anchors two focused goals:

- move the IAM permission workbench from discovery-only governance to remediation-oriented governance
- converge high-sensitivity `system/config` pages under a unified page-admission and shell pattern

It does not introduce a new mega-governance center or redesign the whole IA.

Use the Chinese source document for the full scope boundary and remediation model.
