---
title: Pantheon Base Task Packet Template
doc_type: Acceptance
layer: platform
status: Active
linked_contracts:
  - docs/contracts/PLATFORM_CONTRACT.md
updated_at: 2026-06-03
---

# Pantheon Base Task Packet Template

Chinese version: [TASK_PACKET_BASE_TEMPLATE.md](./TASK_PACKET_BASE_TEMPLATE.md)

This is the smallest reusable task-packet example for `pantheon-base`.

Use it for:

- `platform`
- `system/auth`
- `system/iam`
- `system/org`
- `system/config`
- `system/lowcode`

Copy and fill:

```text
Default location: docs/harness/tasks/YYYY-MM-DD-<task-name>.task.md
Default evidence: .harness/evidence/<task-id>/
Target repo: pantheon-base
Layer: platform / system/auth / system/iam / system/org / system/config / system/lowcode
Task mode: review / implement / ui / smoke / docs
Read first:
- pantheon-base/AGENTS.md
- pantheon-base/DESIGN.md
- pantheon-base/docs/README.md
- matching contract / design / acceptance docs

Implementation scope:
- the explicit closure for this turn
- the explicit non-goals for this turn

Sync expectation:
- base-only
- if the shared behavior will affect pantheon-ops, record whether sync is deferred or included this turn

Verification:
- Backend: `go test ...` / `go test ./...`
- Frontend: `npm run build`
- Smoke: `node scripts/run-smoke-suite.mjs ...` or `none`
- UI work must attach rendered evidence or record why rendering was not produced
- Runtime evidence: `none` / focused logs / smoke path / metrics sample / trace / explicit runtime gap

Stop points:
- none
- or pause before schema / contract / file deletion / other high-risk work

Implementation and review:
- implementer posture:
- reviewer posture: architecture / security / UX-QA / mechanical
```

Additional rule:

- if the work touches shared pagination, upload, tables, i18n, or the shared admin shell, treat it as base-owned by default
- if the turn changes downstream inheritance behavior, explicitly state whether a `base -> ops` sync is required
- if the task touches login, permissions, menu routing, import/export, generator, dynamic modules, async chains, or external integrations, add a runtime-sensitive evidence plan by default
- if the same failure pattern has already appeared before, state whether this turn only patches code or also promotes the issue into a rule, checker, or smoke path
